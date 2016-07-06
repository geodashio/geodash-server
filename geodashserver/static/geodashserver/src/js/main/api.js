var geodashserver = {};

geodashserver.welcome = function(options)
{
  options = options || {};
  var scope = options['$scope'] || options['scope'] || angular.element("#geodash-main").scope();
  var intentData = {
    "id": "geodashserver-modal-welcome",
    "modal": {
      "backdrop": "static",
      "keyboard": false
    },
    "dynamic": {},
    "static": {
      "welcome": scope.map_config["welcome"]
    }
  };
  geodash.api.intend("toggleModal", intentData, scope);
};

geodashserver.html5data = function()
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
        ]
        data["static"] = {
          "field": field,
          "field_flat": field_flat
        }
        data["dynamic"] = {
          "value_edit_field": ["source", "map_config", field],
          "map_config_schema": ["source", "map_config_schema"],
          "map_config_schema_flat": ["source", "map_config_schema_flat"]
        };
      }
      else if(id_show == "geodash-modal-edit-object")
      {
        var objectIndex = args[4];
        data["static"] = {
          "prefix_field": field,
          "prefix_field_flat": field_flat
        }
        data["dynamic"] = {
          "modaleditobject_map_config": ["source", "modaleditfield_map_config"],
          "modaleditobject_map_config_flat": ["source", "modaleditfield_map_config_flat"],
          "object_schema": ["source", "map_config_schema", field, "schema"],
          "map_config_schema": ["source", "map_config_schema"],
          "map_config_schema_flat": ["source", "map_config_schema_flat"]
        };
        if(angular.isNumber(objectIndex))
        {
          data["static"]["objectIndex"] = objectIndex;
          data["dynamic"]["object"] = ["source", "modaleditfield_map_config", field, objectIndex];
        }
        else
        {
          data["dynamic"]["objectIndex"] = ["source", "modaleditfield_map_config", field, "length"];
          data["dynamic"]["object"] = undefined;
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
        "static": {
          "field":field,
          "field_flat":field_flat
        },
        "dynamic": {
          "value_edit_field": ["source", "map_config", field],
          "modaleditfield_map_config": ["source", "map_config"],
          "modaleditfield_map_config_flat": ["source", "map_config_flat"],
          "map_config_schema": ["source", "map_config_schema"],
          "map_config_schema_flat": ["source", "map_config_schema_flat"]
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
        "dynamic": {
          "object": ["source", "map_config_flat", field_flat, index],
          "object_schema": ["source", "map_config_schema", field, "schema"]
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
        "value_edit_field": ["source", "modaleditobject_map_config", prefix_field]
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
