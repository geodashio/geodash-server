import datetime
import requests
import yaml
import errno
from socket import error as socket_error

from django.conf import settings
from django.core.urlresolvers import reverse
from django.contrib.auth.models import User, Group
from django.http import Http404, HttpResponse, HttpResponseRedirect
from django.views.generic import View
from django.shortcuts import render_to_response, get_object_or_404
from django.template import RequestContext
from django.template.loader import get_template

from guardian.models import UserObjectPermission
from guardian.shortcuts import get_users_with_perms, get_perms, remove_perm

try:
    import simplejson as json
except ImportError:
    import json

from geodash.cache import provision_memcached_client

from geodashserver.models import GeoDashDashboard
from geodashserver.utils import build_initial_state, build_state_schema

SCHEMA_PATH = 'geodashserver/static/geodashserver/build/schema/schema.yml'


def home(request, template="geodashserver/explore.html"):
    now = datetime.datetime.now()
    current_month = now.month

    page = "home" # READ: No context path
    slug = "home"
    map_obj = get_object_or_404(GeoDashDashboard, slug=slug)
    map_config = yaml.load(map_obj.config)

    initial_state = build_initial_state(map_config, page=page, slug=slug)
    state_schema = build_state_schema()

    ctx = {
        "map_config": map_config,
        "map_config_json": json.dumps(map_config),
        "state": initial_state,
        "state_json": json.dumps(initial_state),
        "state_schema": state_schema,
        "state_schema_json": json.dumps(state_schema),
        "init_function": "init_dashboard",
        "geodash_main_id": "geodash-main"
    }

    return render_to_response(template, RequestContext(request, ctx))

def explore(request, template="geodashserver/explore.html"):
    now = datetime.datetime.now()
    current_month = now.month

    page = "explore"
    slug = "explore"
    map_obj = get_object_or_404(GeoDashDashboard, slug=slug)
    map_config = yaml.load(map_obj.config)

    initial_state = build_initial_state(map_config, page=page, slug=slug)
    state_schema = build_state_schema()

    ctx = {
        "map_config": map_config,
        "map_config_json": json.dumps(map_config),
        "state": initial_state,
        "state_json": json.dumps(initial_state),
        "state_schema": state_schema,
        "state_schema_json": json.dumps(state_schema),
        "init_function": "init_dashboard",
        "geodash_main_id": "geodash-main",
        "include_sidebar_right": False
    }

    return render_to_response(template, RequestContext(request, ctx))

def geodash_dashboard(request, slug=None, template="geodashserver/dashboard.html"):

    map_obj = get_object_or_404(GeoDashDashboard, slug=slug)

    print map_obj
    print map_obj.published
    print get_perms(request.user, map_obj)
    print request.user.has_perm("view_geodashdashboard", map_obj)

    if not map_obj.published:
        if not request.user.is_authenticated():
            raise Http404("Not authenticated.")
        if not request.user.has_perm("view_geodashdashboard", map_obj):
            raise Http404("Not authorized.")

    pages = {}
    for gm in GeoDashDashboard.objects.all():
        pages[gm.slug] = reverse('geodash_dashboard', kwargs={'slug':gm.slug})

    #map_config_template = "geodashserver/maps/"+map_obj.template
    #map_config_yml = get_template(map_config_template).render({
    #    'slug': map_obj.slug,
    #    'title': map_obj.title
    #})
    map_config = yaml.load(map_obj.config)
    map_config["slug"] = map_obj.slug
    map_config["title"]  = map_obj.title

    #map_config_schema_template = "geodash/schema.yml"
    #map_config_schema_yml = get_template(map_config_schema_template).render({})
    #map_config_schema = yaml.load(map_config_schema_yml)
    map_config_schema = yaml.load(file(SCHEMA_PATH,'r'))

    editor_template = "geodashserver/editor.yml"
    editor_yml = get_template(editor_template).render({})
    editor = yaml.load(editor_yml)

    allperms = get_users_with_perms(map_obj, attach_perms=True)
    print allperms
    security = {
        "advertised": map_obj.advertised,
        "published": map_obj.published,
        'view_geodashdashboard': sorted([x.username for x in allperms if 'view_geodashdashboard' in allperms[x]]),
        'change_geodashdashboard':sorted([x.username for x in allperms if 'change_geodashdashboard' in allperms[x]]),
        'delete_geodashdashboard':sorted([x.username for x in allperms if 'delete_geodashdashboard' in allperms[x]])
    }
    security_schema = yaml.load(get_template("geodashserver/security.yml").render({}))

    initial_state = build_initial_state(map_config, page="dashboard", slug=slug)
    state_schema = build_state_schema()

    users = []
    if request.user.has_perm("change_geodashdashboard", map_obj):
        users =[{'id': x.username, 'text': x.username} for x in User.objects.exclude(username='AnonymousUser')]

    ctx = {
        "pages_json": json.dumps(pages),
        "map_config": map_config,
        "map_config_json": json.dumps(map_config),
        "map_config_schema": map_config_schema,
        "map_config_schema_json": json.dumps(map_config_schema),
        "editor": editor,
        "editor_json": json.dumps(editor),
        "state": initial_state,
        "state_json": json.dumps(initial_state),
        "state_schema": state_schema,
        "state_schema_json": json.dumps(state_schema),
        "security": security,
        "security_json": json.dumps(security),
        "security_schema": security_schema,
        "security_schema_json": json.dumps(security_schema),
        "init_function": "init_dashboard",
        "geodash_main_id": "geodash-main",
        "include_sidebar_right": request.user.has_perm("change_geodashdashboard", map_obj),
        "perms_json": json.dumps(get_perms(request.user, map_obj)),
        "users": json.dumps(users)
    }

    return render_to_response(template, RequestContext(request, ctx))


def geodash_dashboard_config(request, slug=None, extension="json"):

    map_obj = get_object_or_404(GeoDashDashboard, slug=slug)

    if not map_obj.published:
        if not request.user.is_authenticated():
            raise Http404("Not authenticated.")
        if not request.user.has_perm("view_geodashdashboard", map_obj):
            raise Http404("Not authorized.")

    map_config = yaml.load(map_obj.config)
    map_config["slug"] = map_obj.slug
    map_config["title"]  = map_obj.title

    ext_lc = extension.lower();
    if ext_lc == "json":
        return HttpResponse(json.dumps(map_config, default=jdefault), content_type="application/json")
    elif ext_lc == "yml" or ext_lc == "yaml":
        response = yaml.safe_dump(map_config, encoding="utf-8", allow_unicode=True, default_flow_style=False)
        return HttpResponse(response, content_type="application/json")
    else:
        raise Http404("Unknown config format.")

def geodash_dashboard_config_new(request):

    if not request.user.is_authenticated():
        raise Http404("Not authenticated.")

    if request.is_ajax():
        raise Http404("Use AJAX.")

    if request.method != 'POST':
        raise Http404("Can only use POST")

    content = json.loads(request.body)
    config = content['config']
    slug = config.pop('slug', None)

    map_obj = None
    try:
        map_obj = GeoDashDashboard.objects.get(slug=slug)
    except GeoDashDashboard.DoesNotExist:
        map_obj = None

    response_json = None

    if map_obj:
        response_json = {
            'success': False,
            'message': 'Create new dashboard failed.  Same slug.'
        }
    else:
        owner = request.user
        title = config.pop('title', None)
        security = content['security']
        map_obj = GeoDashDashboard(
          slug=slug,
          title=title,
          config=yaml.dump(config),
          advertised=(security.get('advertised', False) in ["true", "t", "1", "yes", "y", True]),
          published=(security.get('published', False) in ["true", "t", "1", "yes", "y", True]))
        map_obj.save()

        for perm in ["view_geodashdashboard", "change_geodashdashboard", "delete_geodashdashboard"]:
            UserObjectPermission.objects.assign_perm(
                perm,
                user=owner,
                obj=map_obj)

        config.update({
            'slug': slug,
            'title': title
        })
        response_json = {
            'success': True,
            'config': config
        }

    return HttpResponse(json.dumps(response_json, default=jdefault), content_type="application/json")


def geodash_dashboard_config_save(request, slug=None):

    if not request.user.is_authenticated():
        raise Http404("Not authenticated.")

    if request.is_ajax():
        raise Http404("Use AJAX.")

    if request.method != 'POST':
        raise Http404("Can only use POST")

    map_obj = get_object_or_404(GeoDashDashboard, slug=slug)

    response_json = None

    if request.user.has_perm("change_geodashdashboard", map_obj):

        print request.body
        content = json.loads(request.body)
        config = content['config']
        map_obj.slug = config.pop('slug', None)
        map_obj.title = config.pop('title', None)
        map_obj.config = yaml.dump(config)
        security = content['security'];
        map_obj.advertised=(security.get('advertised', False) in ["true", "t", "1", "yes", "y", True]);
        map_obj.published=(security.get('published', False) in ["true", "t", "1", "yes", "y", True]);
        map_obj.save()

        perms = {
            'view_geodashdashboard': security.get("view_geodashdashboard", []),
            'change_geodashdashboard': security.get("change_geodashdashboard", []),
            'delete_geodashdashboard': security.get("delete_geodashdashboard", [])
        }
        currentUsers = get_users_with_perms(map_obj)
        for perm in ["view_geodashdashboard", "change_geodashdashboard", "delete_geodashdashboard"]:
            # Remove Old Permissions
            for user in currentUsers:
                username = user.username
                if (username not in perms[perm]) and user.has_perm(perm, map_obj):
                    remove_perm(perm, user, map_obj)

            # Add New Permissions
            for username in perms[perm]:
                user = User.objects.get(username=username)
                UserObjectPermission.objects.assign_perm(
                    perm,
                    user=user,
                    obj=map_obj)

        config.update({
            'slug': map_obj.slug,
            'title': map_obj.title
        })
        response_json = {
            'success': True,
            'config': config
        }
    else:
        response_json = {
            'success': False,
            'message': 'Save dashboard failed.  You do not have permissions.'
        }
    return HttpResponse(json.dumps(response_json, default=jdefault), content_type="application/json")


def geodash_map_schema(request):

    #map_config_schema_template = "geodash/schema.yml"
    #map_config_schema_yml = get_template(map_config_schema_template).render({})
    #map_config_schema = yaml.load(map_config_schema_yml)
    map_config_schema = yaml.load(file(SCHEMA_PATH,'r'))

    return HttpResponse(json.dumps(map_config_schema, default=jdefault), content_type="application/json")


def geodash_editor_config(request):

    editor_config_template = "geodashserver/editor.yml"
    editor_config_yml = get_template(editor_config_template).render({})
    editor_config = yaml.load(editor_config_yml)

    return HttpResponse(json.dumps(editor_config, default=jdefault), content_type="application/json")

class geodash_view(View):

    key = None
    content_type = "application/json"

    def _build_key(self, request, *args, **kwargs):
        return self.key

    def _build_data(self):
        raise Exception('geodash_view._build_data should be overwritten')

    def get(self, request, *args, **kwargs):
        data = None
        if settings.GEODASH_CACHE_DATA:
            client = provision_memcached_client()
            if client:
                key = self._build_key(request, *args, **kwargs)
                print "Checking cache with key ", key

                data = None
                try:
                    data = client.get(key)
                except socket_error as serr:
                    data = None
                    print "Error getting data from in-memory cache."
                    if serr.errno == errno.ECONNREFUSED:
                        print "Memcached is likely not running.  Start memcached with supervisord."
                    raise serr

                if not data:
                    print "Data not found in cache."
                    data = self._build_data(request, *args, **kwargs)
                    try:
                        client.set(key, data)
                    except socket_error as serr:
                        print "Error saving data to in-memory cache."
                        if serr.errno == errno.ECONNREFUSED:
                            print "Memcached is likely not running or the data exceeds memcached item size limit.  Start memcached with supervisord."
                        raise serr
                else:
                    print "Data found in cache."
            else:
                print "Could not connect to memcached client.  Bypassing..."
                data = self._build_data(request, *args, **kwargs)
        else:
            print "Not caching data (settings.GEODASH_CACHE_DATA set to False)."
            data = self._build_data(request, *args, **kwargs)
        return HttpResponse(json.dumps(data, default=jdefault), content_type=self.content_type)


def cache_data_flush(request):
    client = provision_memcached_client()
    success = client.flush_all()
    return HttpResponse(json.dumps({'success':success}), content_type='application/json')


def jdefault(o):
    return o.__dict__
