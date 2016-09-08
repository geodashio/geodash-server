var geodasheditor = {};
var geodashserver = {};

geodashserver.welcome = geodasheditor.welcome = function()
{
  var scope = geodash.api.getScope("geodash-main");
  var intentData = {
    "id": "geodash-modal-geodashserver-welcome",
    "modal": {
      "backdrop": "static",
      "keyboard": false
    },
    "dynamic": {},
    "static": {
      "welcome": extract("welcome", scope.config || scope.map_config)
    }
  };
  geodash.api.intend("toggleModal", intentData, scope);
};

geodashserver.html5data = geodasheditor.html5data = function()
{
  var args = arguments;
  var zero_lc = args[0].toLowerCase();
  if(zero_lc == "switchmodal")
  {
    var id_hide = args[1];
    var id_show = args[2];
    var data = {
      "id_hide": id_hide,
      "id_show": id_show
    };
    if(id_show == "geodash-modal-edit-field" || id_show == "geodash-modal-edit-object")
    {
      var field = args[3];
      var field_flat = field.replace('.', '__');
      if(id_show == "geodash-modal-edit-field")
      {
        data["clear"] = [
          "objectIndex"
        ];
        data["static"] = {
          "modal": "geodash-modal-edit-field",
          "field": field,
          "field_flat": field_flat,
          "path": field,
          "schemapath": field
        };
        data["dynamic"] = {
          "value_edit_field": ["source", "workspace", "config", field],
          "workspace": ["source", "workspace"],
          "schema": ["source", "schema"]
        };
      }
      else if(id_show == "geodash-modal-edit-object")
      {
        var objectIndex = args[4];
        data["static"] = {
          "modal": "geodash-modal-edit-object",
          "prev": id_hide,
          "basepath": field
        };
        data["dynamic"] = {
          "workspace": ["source", "workspace"],
          "schema": ["source", "schema"]
        };
        if(angular.isNumber(objectIndex))
        {
          data["static"]["objectIndex"] = objectIndex;
        }
        else
        {
          data["dynamic"]["objectIndex"] = ["source", "modaleditfield_workspace", field, "length"];
        }
      }
    }
    return data;
  }
  else if(zero_lc == "togglemodal" || zero_lc == "showmodal")
  {
    var id = args[1];
    if(id == "geodash-modal-edit-field")
    {
      var field = args[2];
      var field_flat = field.replace('.', '__');
      return {
        "id": id,
        "modal": {
          "backdrop": "static"
        },
        "clear": [
          "objectIndex"
        ],
        "static": {
          "modal": "geodash-modal-edit-field",
          "path": field,
          "schemapath": field
        },
        "dynamic": {
          "value_edit_field": ["source", "workspace", field],
          "workspace": ["source", "workspace"],
          "schema": ["source", "schema"],
          "featurelayers": ["source", "workspace", "config", "featurelayers"],
          "baselayers": ["source", "workspace", "config", "baselayers"]
        }
      };
    }
    else if(id == "geodash-modal-edit-object")
    {
      var field = args[2];
      var field_flat = field.replace('.', '__');
      var index = args[3];
      return {
        "id": id,
        "static": {
          "modal": "geodash-modal-edit-object"
        },
        "dynamic": {
          "workspace": ["source", "workspace"],
          "schema": ["source", "schema"],
          "object": ["source", "workspace_flat", field_flat, index],
          "object_schema": ["source", "schema", field, "schema"]
        }
      };
    }
    else
    {
        return "";
    }
  }
  else if(zero_lc == "hidemodal")
  {
    var id = args[1];
    return {
      "id": id
    };
  }
  else if(zero_lc == "saveandhide")
  {
    var id = args[1];
    var id_hide = args[1];
    var id_target = args[2];
    var fields = args[3];

    var data = {
      "id_hide": id_hide,
      "id_target": id_target
    };
    data["clear"] = [
      "field",
      "field_flat"
    ]
    data["dynamic"] = {};
    if(angular.isDefined(fields))
    {
      $.each(fields, function(k, v) {
        data["dynamic"][k] = ["source", v];
      });
    }
    return data;
  }
  else if(zero_lc == "saveobjectandswitch")
  {
    var id = args[1];
    var id_hide = args[1];
    var id_show = args[2]; // target and show
    var prefix_field = args[3];
    var prefix_field_flat = args[4];
    var fields = args[5];

    var data = {
      "id_hide": id_hide,
      "id_show": id_show,
      "static": {
        "field": prefix_field,
        "field_flat": prefix_field_flat
      },
      "dynamic": {
        "value_edit_field": ["source", "modaleditobject_workspace", prefix_field]
      }
    };
    if(angular.isDefined(fields))
    {
      $.each(fields, function(k, v) {
        data["dynamic"][k] = ["source", v];
      });
    }
    return data;
  }
  else
  {
    return "";
  }
};
