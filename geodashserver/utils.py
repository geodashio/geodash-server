import datetime
import psycopg2
import yaml

#from jenks import jenks

from django.conf import settings
from django.template import Context
from django.template.loader import get_template

try:
    import simplejson as json
except ImportError:
    import json

from geodash.enumerations import MONTHS_SHORT3

from geodash.data import GeoDashDatabaseConnection, calc_breaks_natural, insertIntoObject
from geodashserver.data import data_local_country_admin

def get_month_number(month):
    month_num = -1
    if month:
        month_lc = month.lower()
        try:
            month_num = int(month_lc)
        except:
            try:
                month_num = [x.lower() for x in MONTHS_SHORT3].index(month_lc)
            except:
                pass
            if month_num == -1:
                try:
                    month_num = [x.lower() for x in MONTHS_LONG].index(month_lc)
                except:
                    pass

            if month_num != -1:
                month_num += 1

    return month_num


def build_initial_state(dashboard_config, page="dashboard", slug=None):

    initial_state = {
        "page": page,
        "slug": (slug or dashboard_config["slug"]),
        "view": {
            "lat": dashboard_config["view"]["latitude"],
            "lon": dashboard_config["view"]["longitude"],
            "z": dashboard_config["view"]["zoom"],
            "baselayer": dashboard_config["view"].get("baselayer", None),
            "featurelayers": []
        }
    }
    return initial_state

def build_state_schema():
    t = "geodashserver/enumerations.yml"
    y = get_template(t).render({})
    obj = yaml.load(y)
    return obj.get('state_schema', None)
