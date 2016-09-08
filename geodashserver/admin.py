from django.contrib import admin

from guardian.admin import GuardedModelAdmin

from geodashserver.models import *

class GeoDashDashboardAdmin(GuardedModelAdmin):
    model = GeoDashDashboard
    list_display_links = ('id', 'title',)
    list_display = ('id', 'title', 'slug', 'advertised', 'published')

admin.site.register(GeoDashDashboard, GeoDashDashboardAdmin)

#class GeoDashServerAdmin(GuardedModelAdmin):
#    model = GeoDashServer
#    list_display_links = ('id', 'title',)
#    list_display = ('id', 'title', 'advertised', 'published', )

#admin.site.register(GeoDashServer, GeoDashServerAdmin)
