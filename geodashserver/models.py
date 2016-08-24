from django.db import models

class GeoDashDashboard(models.Model):
    title = models.CharField(max_length=255, null=True, blank=True)
    slug = models.CharField(max_length=255, null=True, blank=True)
    config = models.TextField(null=True, blank=True)
    advertised = models.BooleanField()
    published = models.BooleanField()

    def __str__(self):
        return "%s" % self.title.encode('utf-8')

    class Meta:
        ordering = ("title",)
        verbose_name = ("GeoDash Dashboards")
        verbose_name_plural = ("GeoDash Dashboards")
        permissions = (
            ('view_geodashdashboard', 'View GeoDash Dashboard'),
            # ('add_geodashdashboard', 'Add GeoDash Dashboard'),
            # ('change_geodashdashboard', 'Change GeoDash Dashboard'),
            # ('delete_geodashdashboard', 'Delete GeoDash Dashboard'),
        )
