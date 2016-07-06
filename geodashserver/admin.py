from django.contrib import admin

from geodashserver.models import *

class GeoDashDashboardAdmin(admin.ModelAdmin):
    model = GeoDashDashboard
    list_display_links = ('id', 'title',)
    list_display = ('id', 'title', 'slug', 'config', )

admin.site.register(GeoDashDashboard, GeoDashDashboardAdmin)
