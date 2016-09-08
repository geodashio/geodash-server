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
from geodash.security import check_perms_view, expand_perms, expand_users, geodash_assign_default_perms
from geodash.utils import build_state_schema, build_initial_state, build_editor_config, build_context, build_dashboard_config

from geodashserver.models import GeoDashDashboard


SCHEMA_PATH = 'geodashserver/static/geodashserver/build/schema/schema.yml'
ENDPOINTS_PATH = 'geodashserver/static/geodashserver/build/api/endpoints.yml'

def home(request, template="geodashserver/home.html"):
    now = datetime.datetime.now()
    current_month = now.month

    page = "home" # READ: No context path
    slug = "home"
    map_obj = get_object_or_404(GeoDashDashboard, slug=slug)

    config = yaml.load(map_obj.config)
    endpoints = yaml.load(file(ENDPOINTS_PATH,'r'))

    ctx = build_context(
        config,
        build_initial_state(config, page=page, slug=slug),
        build_state_schema())

    ctx.update({
        "endpoints": endpoints,
        "endpoints_json": json.dumps(endpoints),
        "include_sidebar_right": False
    })

    return render_to_response(template, RequestContext(request, ctx))

def explore(request, template="geodashserver/explore.html"):
    now = datetime.datetime.now()
    current_month = now.month

    page = "explore"
    slug = "explore"
    map_obj = get_object_or_404(GeoDashDashboard, slug=slug)

    config = yaml.load(map_obj.config)
    endpoints = yaml.load(file(ENDPOINTS_PATH,'r'))

    ctx = build_context(
        config,
        build_initial_state(config, page=page, slug=slug),
        build_state_schema())

    ctx.update({
        "endpoints": endpoints,
        "endpoints_json": json.dumps(endpoints),
        "include_sidebar_right": False
    })

    return render_to_response(template, RequestContext(request, ctx))

def geodash_capabilities(request, extension=json):
    dashboards = []

    for obj in GeoDashDashboard.objects.all():
        if check_perms_view(request, obj, raiseErrors=False):
            config = build_dashboard_config(obj)
            x = {
              'id': config['slug'],
              'slug': config['slug'],
              'title': config['title'],
              'uri': reverse('geodash_dashboard', kwargs={'slug': config['slug']}),
              'view': {
                "center": [config["view"]["longitude"], config["view"]["latitude"]],
                "minZoom": config['view']['minZoom'],
                "maxZoom": config['view']['maxZoom']
              }
            }
            dashboards.append(x)

    data = {
        'dashboards': dashboards
    }

    ext_lc = extension.lower();
    if ext_lc == "json":
        return HttpResponse(json.dumps(data, default=jdefault), content_type="application/json")
    elif ext_lc == "yml" or ext_lc == "yaml":
        response = yaml.safe_dump(data, encoding="utf-8", allow_unicode=True, default_flow_style=False)
        return HttpResponse(response, content_type="text/plain")
    else:
        raise Http404("Unknown config format.")


def geodash_dashboard(request, slug=None, template="geodashserver/dashboard.html"):

    map_obj = get_object_or_404(GeoDashDashboard, slug=slug)

    print map_obj
    print map_obj.published
    print get_perms(request.user, map_obj)
    print request.user.has_perm("view_geodashdashboard", map_obj)

    check_perms_view(request, map_obj, raiseErrors=True)

    #pages = {}
    #for gm in GeoDashDashboard.objects.all():
    #    pages[gm.slug] = reverse('geodash_dashboard', kwargs={'slug':gm.slug})

    config = build_dashboard_config(map_obj)
    config_schema = yaml.load(file(SCHEMA_PATH,'r'))
    endpoints = yaml.load(file(ENDPOINTS_PATH,'r'))

    config['api'] = {
        'save': '/api/dashboard/{{ slug }}/config/save',
        'saveas': '/api/dashboard/config/new'
    }

    editor_template = "geodash/editor/editor.yml"
    editor_yml = get_template(editor_template).render({})
    editor = yaml.load(editor_yml)

    security = expand_perms(map_obj)
    security_schema = yaml.load(get_template("geodash/security/security.yml").render({}))

    ctx = build_context(
        config,
        build_initial_state(config, page="dashboard", slug=slug),
        build_state_schema())

    ctx.update({
        #"pages_json": json.dumps(pages),
        "map_config_schema": config_schema,
        "map_config_schema_json": json.dumps(config_schema),
        "editor": editor,
        "editor_json": json.dumps(editor),
        "endpoints": endpoints,
        "endpoints_json": json.dumps(endpoints),
        "security": security,
        "security_json": json.dumps(security),
        "security_schema": security_schema,
        "security_schema_json": json.dumps(security_schema),
        "include_sidebar_right": request.user.has_perm("change_geodashdashboard", map_obj),
        "perms_json": json.dumps(get_perms(request.user, map_obj)),
        "users": json.dumps(expand_users(request, map_obj))
    })

    return render_to_response(template, RequestContext(request, ctx))


def geodash_dashboard_config(request, slug=None, extension="json"):

    map_obj = get_object_or_404(GeoDashDashboard, slug=slug)
    check_perms_view(request, map_obj, raiseErrors=True)
    map_config = build_dashboard_config(map_obj)

    ext_lc = extension.lower();
    if ext_lc == "json":
        return HttpResponse(json.dumps(map_config, default=jdefault), content_type="application/json")
    elif ext_lc == "yml" or ext_lc == "yaml":
        response = yaml.safe_dump(map_config, encoding="utf-8", allow_unicode=True, default_flow_style=False)
        return HttpResponse(response, content_type="text/plain")
    else:
        raise Http404("Unknown config format.")


def geodash_dashboard_security(request, slug=None, extension="json"):

    map_obj = get_object_or_404(GeoDashDashboard, slug=slug)
    check_perms_view(request, map_obj, raiseErrors=True)
    security = expand_perms(map_obj)

    ext_lc = extension.lower();
    if ext_lc == "json":
        return HttpResponse(json.dumps(security, default=jdefault), content_type="application/json")
    elif ext_lc == "yml" or ext_lc == "yaml":
        response = yaml.safe_dump(security, encoding="utf-8", allow_unicode=True, default_flow_style=False)
        return HttpResponse(response, content_type="text/plain")
    else:
        raise Http404("Unknown config format.")


def geodash_dashboard_servers(request, slug=None, extension="json"):

    map_obj = get_object_or_404(GeoDashDashboard, slug=slug)
    check_perms_view(request, map_obj, raiseErrors=True)
    servers = config = build_dashboard_config(map_obj).get('servers', [])

    ext_lc = extension.lower();
    if ext_lc == "json":
        return HttpResponse(json.dumps(servers, default=jdefault), content_type="application/json")
    elif ext_lc == "yml" or ext_lc == "yaml":
        response = yaml.safe_dump(servers, encoding="utf-8", allow_unicode=True, default_flow_style=False)
        return HttpResponse(response, content_type="text/plain")
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
        title = config.pop('title', None)
        security = content['security']
        map_obj = GeoDashDashboard(
          slug=slug,
          title=title,
          config=yaml.dump(config),
          advertised=(security.get('advertised', False) in ["true", "t", "1", "yes", "y", True]),
          published=(security.get('published', False) in ["true", "t", "1", "yes", "y", True]))
        map_obj.save()

        geodash_assign_default_perms(map_obj, request.user)

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
    map_config_schema = yaml.load(file(SCHEMA_PATH,'r'))
    return HttpResponse(json.dumps(map_config_schema, default=jdefault), content_type="application/json")

def geodash_editor_config(request):
    return HttpResponse(json.dumps(build_editor_config(), default=jdefault), content_type="application/json")

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
