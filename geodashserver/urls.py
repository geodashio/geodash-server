from django import VERSION
from django.conf.urls import patterns, include, url
from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.views.i18n import javascript_catalog
from django.views.generic import TemplateView

from . import views

admin.autodiscover()

js_info_dict = {
    'domain': 'djangojs',
    'packages': ('geodashserver',)
}

sitemaps = {
}

urlpatterns = [
    # Web Pages
    url(
        r'^$',
        views.home,
        name='home'),
    url(
        r'^explore$',
        views.explore,
        name='explore'),
    url(
        r'^dashboard$',
        views.explore,
        name='dashboard'),
    url(
        r'^dashboard/(?P<slug>[^/]+)$',
        views.geodash_dashboard,
        name='geodash_dashboard'),

    # JSON Services
    url(
        r'^map-schema[.]json$',
        views.geodash_map_schema,
        name='geodash_map_schema'),

    url(
        r'^editor/config[.]json$',
        views.geodash_editor_config,
        name='geodash_editor_config'),

    url(
        r'^api/capabilities[.](?P<extension>[^.]+)$',
        views.geodash_capabilities,
        name='geodash_capabilities'),

    url(
        r'^api/dashboard/config/geodash_dashboard_(?P<slug>[^/]+)[.](?P<extension>[^.]+)$',
        views.geodash_dashboard_config,
        name='geodash_dashboard_config'),

    url(
        r'^api/dashboard/security/(?P<slug>[^/]+)[.](?P<extension>[^.]+)$',
        views.geodash_dashboard_security,
        name='geodash_dashboard_security'),

    url(
        r'^api/dashboard/servers/(?P<slug>[^/]+)[.](?P<extension>[^.]+)$',
        views.geodash_dashboard_servers,
        name='geodash_dashboard_servers'),

    url(
        r'^api/dashboard/config/new$',
        views.geodash_dashboard_config_new,
        name='geodash_dashboard_config_new'),

    url(
        r'^api/dashboard/(?P<slug>[^/]+)/config/save$',
        views.geodash_dashboard_config_save,
        name='geodash_dashboard_config_save'),

    # Cache control
    url(
        r'^cache/data/flush$',
        views.cache_data_flush,
        name='cache_data_flush'),

    # Django urls
    url(
        r'^sitemap\.xml$',
        sitemap,
        {'sitemaps': sitemaps},
        name='sitemap'),
    url(
        r'^lang\.js$',
        TemplateView.as_view(template_name='lang.js', content_type='text/javascript'),
        name='lang'),
    url(r'^jsi18n/$', javascript_catalog, js_info_dict, name='jscat'),
    url(r'^i18n/', include('django.conf.urls.i18n')),
    #url(r'^autocomplete/', include('autocomplete_light.urls')),
    # Admin URLS Specific @ https://github.com/django/django/blob/master/django/contrib/admin/sites.py#L270
    url(r'^admin/', include(admin.site.urls)),
]

if VERSION < (1, 9):
    urlpatterns = patterns('', *urlpatterns)
