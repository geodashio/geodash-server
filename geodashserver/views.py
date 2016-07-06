import datetime
import requests
import yaml
import errno
from socket import error as socket_error

from django.conf import settings
from django.core.urlresolvers import reverse
from django.http import Http404, HttpResponse, HttpResponseRedirect
from django.views.generic import View
from django.shortcuts import render_to_response, get_object_or_404
from django.template import RequestContext
from django.template.loader import get_template

try:
    import simplejson as json
except ImportError:
    import json

from geodash.cache import provision_memcached_client

from geodashserver.models import GeoDashDashboard


def home(request, template="home.html"):
    raise NotImplementedError

def explore(request, template="geodashserver/explore.html"):
    now = datetime.datetime.now()
    current_month = now.month

    map_config_yml = get_template("geodashserver/maps/explore.yml").render({})
    map_config = yaml.load(map_config_yml)

    ##############
    initial_state = {
        "page": "explore",
        "view": {
            "lat": map_config["view"]["latitude"],
            "lon": map_config["view"]["longitude"],
            "z": map_config["view"]["zoom"],
            "baselayer": map_config["view"].get("baselayer", None),
            "featurelayers": []
        },
        "filters": {},
        "styles": {}
    }
    state_schema = {
        "view": {
          "lat": "float",
          "lon": "float",
          "z": "integer",
          "baselayer": "string",
          "featurelayers": "stringarray"
        },
        "filters": {},
        "styles": {}
    }

    ctx = {
        "map_config": map_config,
        "map_config_json": json.dumps(map_config),
        "state": initial_state,
        "state_json": json.dumps(initial_state),
        "state_schema": state_schema,
        "state_schema_json": json.dumps(state_schema),
        "init_function": "init_explore"
    }

    return render_to_response(template, RequestContext(request, ctx))

def geodash_dashboard(request, slug=None, template="geodashserver/dashboard.html"):

    map_obj = get_object_or_404(GeoDashDashboard, slug=slug)

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

    map_config_schema_template = "geodash/schema.yml"
    map_config_schema_yml = get_template(map_config_schema_template).render({})
    map_config_schema = yaml.load(map_config_schema_yml)

    editor_template = "geodashserver/editor.yml"
    editor_yml = get_template(editor_template).render({})
    editor = yaml.load(editor_yml)

    initial_state = {
        "page": "dashboard",
        "slug": slug,
        "view": {
            "lat": map_config["view"]["latitude"],
            "lon": map_config["view"]["longitude"],
            "z": map_config["view"]["zoom"],
            "baselayer": map_config["view"].get("baselayer", None),
            "featurelayers": []
        }
    }
    state_schema = {
        "view": {
          "lat": "float",
          "lon": "float",
          "z": "integer",
          "baselayer": "string",
          "featurelayers": "stringarray"
        },
        "filters": {},
        "styles": {}
    }

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
        "init_function": "init_dashboard"
    }

    return render_to_response(template, RequestContext(request, ctx))


def geodash_dashboard_config(request, slug=None):

    map_obj = get_object_or_404(GeoDashDashboard, slug=slug)

    map_config_template = "geodashserver/maps/"+map_obj.template
    map_config_yml = get_template(map_config_template).render({
      'slug': map_obj.slug,
      'title': map_obj.title
    })
    map_config = yaml.load(map_config_yml)

    return HttpResponse(json.dumps(map_config, default=jdefault), content_type="application/json")

def geodash_dashboard_config_save(request, slug=None):

    if not request.user.is_authenticated():
        raise Http404("Not authenticated.")

    if request.is_ajax():
        raise Http404("Use AJAX.")

    if request.method != 'POST':
        raise Http404("Can only use POST")

    map_obj = get_object_or_404(GeoDashDashboard, slug=slug)
    config = yaml.load(request.body)
    map_obj.slug = config.pop('slug', None)
    map_obj.title = config.pop('title', None)
    map_obj.config = yaml.dump(config)
    map_obj.save()

    config.update({
        'slug': map_obj.slug,
        'title': map_obj.title
    })
    response_json = {
        'success': True,
        'map_config': config
    }

    return HttpResponse(json.dumps(response_json, default=jdefault), content_type="application/json")

def geodash_map_schema(request):

    map_config_schema_template = "geodash/schema.yml"
    map_config_schema_yml = get_template(map_config_schema_template).render({})
    map_config_schema = yaml.load(map_config_schema_yml)

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
