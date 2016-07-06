geodash.controllers["controller_modal_edit_field"] = ['$scope', function($scope) {

  //////////////////////////////////
  // Used by templates and javascript
  //
  $scope.config = {
    "that" : {
      "id": "geodash-modal-edit-field"
    },
    "workspace": {
      "map_config": "modaleditfield_map_config",
      "map_config_flat": "modaleditfield_map_config_flat"
    },
    "edit": {
      "target": "geodash-modal-edit-object",
    },
    "save": {
      "target": "geodash-sidebar-right",
      "fields":  {
        "map_config": "modaleditfield_map_config",
        "map_config_flat": "modaleditfield_map_config_flat"
      }
    }
  };
  //////////////////////////////////
  $scope.html5data = geodashserver.html5data;
  $scope.updateValue = geodash.api.updateValue;
  $scope.value_edit_field = null;
  //////////////////////////////////
  $scope.showOptions = geodash.ui.showOptions;
  //////////////////////////////////

  $scope.validateModalField = function(field_flat)
  {
    $scope["value_edit_field"] = $("#modal-edit-field-"+field_flat).val();

    $scope["modaleditfield_map_config_flat"][field_flat] = $scope["value_edit_field"];

    $scope.updateValue(
      field_flat,
      $scope[$scope.config.workspace.map_config_flat],
      $scope[$scope.config.workspace.map_config]);
  };

  $scope.updateValues = function(field_flat_array)
  {
    for(var i = 0; i < field_flat_array.length; i++)
    {
      $scope.updateValue(field_flat_array[i]);
    }
  };

  $scope.up = function($event, field, field_flat, $index)
  {
    var map_config = $scope[$scope.config.workspace.map_config];
    var map_config_flat = $scope[$scope.config.workspace.map_config_flat];
    var currentValue = extract(field.split("."), map_config);
    if(Array.isArray(currentValue))
    {
      if($index > 0)
      {
         var newValue = [].concat(
          currentValue.slice(0, $index - 1),
          currentValue[$index],
          currentValue[$index - 1],
          currentValue.slice($index + 1));
        map_config[field] = newValue;

        $.each(geodash.api.flatten(newValue), function(i, x){
          map_config_flat[field_flat+"__"+i] = x;
        });
      }
    }
    else if(angular.isNumber(currentValue))
    {
      map_config[field_flat] = currentValue + 1;

      $scope.updateValue(
        field_flat,
        $scope[$scope.config.workspace.map_config_flat],
        $scope[$scope.config.workspace.map_config]);
    }
  };

  $scope.down = function($event, field, field_flat, $index)
  {
    var map_config = $scope[$scope.config.workspace.map_config];
    var map_config_flat = $scope[$scope.config.workspace.map_config_flat];
    var currentValue = extract(field.split("."), map_config);
    if(Array.isArray(currentValue))
    {
      if($index < currentValue.length - 1)
      {
        var newValue = [].concat(
          currentValue.slice(0, $index),
          currentValue[$index + 1],
          currentValue[$index],
          currentValue.slice($index + 2));
        map_config[field] = newValue;
        $.each(geodash.api.flatten(newValue), function(i, x){
          map_config_flat[field_flat+"__"+i] = x;
        });
      }
    }
    else if(angular.isNumber(currentValue))
    {
      map_config_flat[field_flat] = currentValue - 1;

      $scope.updateValue(
        field_flat,
        $scope[$scope.config.workspace.map_config_flat],
        $scope[$scope.config.workspace.map_config]);
    }
  };



  $scope.keyUpOnField = function($event, field, field_flat)
  {
    if($event.keyCode == 13)
    {
      $scope.prependToField($event, field, field_flat);
    }
  };

  $scope.prependToField = function($event, field, field_flat)
  {
    var map_config = $scope[$scope.config.workspace.map_config];
    var map_config_flat = $scope[$scope.config.workspace.map_config_flat];
    var currentValue = extract(field.split("."), map_config);
    if(Array.isArray(currentValue))
    {
      var valueToAdd = $("#editor-field-"+field_flat).val();
      if(angular.isString(valueToAdd) && valueToAdd != "")
      {
        var newValue = [valueToAdd].concat(currentValue);
        map_config[field] = newValue;
        $.each(geodash.api.flatten(newValue), function(i, x){
          map_config_flat[field_flat+"__"+i] = x;
        });
      }
    }
    else if(angular.isString(currentValue))
    {
      var valueToAdd = $("#editor-field-"+field_flat).val();
      if(angular.isString(valueToAdd) && valueToAdd != "")
      {
        map_config_flat[field_flat] = valueToAdd + "," + currentValue;
        $scope.updateValue(
          field_flat,
          $scope[$scope.config.workspace.map_config_flat],
          $scope[$scope.config.workspace.map_config]);
      }
    }

    $("#editor-field-"+field_flat).val(null);
    try{
      $("#editor-field-"+field_flat).typeahead('val', null);
      $("#editor-field-"+field_flat).typeahead('close');
    }catch(err){};
  };

  $scope.subtractFromField = function($event, field, field_flat, $index)
  {
    var map_config = $scope[$scope.config.workspace.map_config];
    var map_config_flat = $scope[$scope.config.workspace.map_config_flat];
    var currentValue = extract(field.split("."), map_config);
    if(Array.isArray(currentValue))
    {
      currentValue.splice($index, 1);
      map_config[field] = currentValue;
      $.each(geodash.api.flatten(currentValue), function(i, x){
        map_config_flat[field_flat+"__"+i] = x;
      });
      delete map_config_flat[field_flat+"__"+(currentValue.length)];
    }
    else if(angular.isString(currentValue))
    {
      map_config_flat[field_flat] = currentValue.substring(0, $index) + currentValue.substring($index + 1);
      $scope.updateValue(
        field_flat,
        $scope[$scope.config.workspace.map_config_flat],
        $scope[$scope.config.workspace.map_config]);
    }
    else if(angular.isNumber(currentValue))
    {
      map_config_flat[field_flat] = currentValue - $("#editor-field-"+field_flat).val();
      $scope.updateValue(
        field_flat,
        $scope[$scope.config.workspace.map_config_flat],
        $scope[$scope.config.workspace.map_config]);
    }
    $("#editor-field-"+field_flat).val(null);
    try{
      $("#editor-field-"+field_flat).typeahead('val', null);
      $("#editor-field-"+field_flat).typeahead('close');
    }catch(err){};
  };

}];
