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
          "value_edit_field": ["source", "workspace", "config", field]
          //"schema": ["source", "schema"],
          //"schema_flat": ["source", "schema_flat"]
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
          "modaleditobject_workspace": ["source", "modaleditfield_workspace"],
          "modaleditobject_workspace_flat": ["source", "modaleditfield_workspace_flat"],
          "modaleditobject_schema": ["source", "modaleditfield_schema"],
          "modaleditobject_schema_flat": ["source", "modaleditfield_schema_flat"],
          "object_schema": ["source", "schema", field, "schema"]
        };
        if(angular.isNumber(objectIndex))
        {
          data["static"]["objectIndex"] = objectIndex;
          data["dynamic"]["object"] = ["source", "modaleditfield_workspace", field, objectIndex];
        }
        else
        {
          data["dynamic"]["objectIndex"] = ["source", "modaleditfield_workspace", field, "length"];
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
          "value_edit_field": ["source", "workspace", field],
          "modaleditfield_workspace": ["source", "workspace"],
          "modaleditfield_workspace_flat": ["source", "workspace_flat"],
          "modaleditfield_schema": ["source", "schema"],
          "modaleditfield_schema_flat": ["source", "schema_flat"]
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
