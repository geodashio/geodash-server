geodash.controllers["controller_modal_edit_object"] = ['$scope', function($scope) {

  //////////////////////////////////
  // Used by templates and javascript
  //
  $scope.config = {
    "that" : {
      "id": "geodash-modal-edit-object"
    },
    "workspace": {
      "map_config": "modaleditobject_workspace",
      "map_config_flat": "modaleditobject_workspace_flat"
    },
    "save": {
      "target": "geodash-modal-edit-field",
      "fields":  {
        "modaleditfield_workspace": "modaleditobject_workspace",
        "modaleditfield_workspace_flat": "modaleditobject_workspace_flat",
      }
    }
  };
  // Placeholders.  Filled in by geodash-intent
  $scope.prefix_field = undefined;
  $scope.prefix_field_flat = undefined;
  $scope.objectIndex = undefined;
  $scope["object"] = undefined;
  //////////////////////////////////
  $scope.html5data = geodashserver.html5data;
  $scope.updateValue = geodash.api.updateValue;
  //////////////////////////////////
  $scope.showOptions = geodash.ui.showOptions;
  //////////////////////////////////

  $scope.when = function(object_field)
  {
    //ng-if="(object_field.when.field | ternary_defined: false : true)  || (map_config | extract : prefix_field : objectIndex : object_field.when.field | inArray: object_field.when.values)">
    //ng-if="(object_field.when.field | ternary_defined: false : true)  || (map_config | extract : prefix_field : objectIndex : object_field.when.field | inArray: object_field.when.values)">
    if(extract("when.field", object_field, undefined) != undefined)
    {
      var map_config = $scope[$scope.config.workspace.map_config];
      var value = extract(
        [$scope.prefix_field, $scope.objectIndex, object_field.when.field],
        map_config,
        undefined);
      var arr = object_field.when.values || [];
      return $.inArray(value, arr) != -1;
    }
    else
    {
      return true;
    }
  };

  $scope.validateFields = function(field_flat_array)
  {
    for(var i = 0; i < field_flat_array.length; i++)
    {
      $scope.validateField(field_flat_array[i]);
    }
  };

  $scope.validateField = function(field_flat)
  {
    $scope.updateValue(
      field_flat,
      $scope[$scope.config.workspace.map_config_flat],
      $scope[$scope.config.workspace.map_config]);

    $scope["object"] = extract(
      expand([$scope.prefix_field, $scope.objectIndex]),
      $scope[$scope.config.workspace.map_config]);
  };

}]
