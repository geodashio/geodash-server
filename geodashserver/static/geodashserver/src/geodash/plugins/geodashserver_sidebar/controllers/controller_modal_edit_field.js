geodash.controllers["controller_modal_edit_field"] = ['$scope', function($scope) {

  //////////////////////////////////
  // Used by templates and javascript
  //
  $scope.config = {
    "that" : {
      "id": "geodash-modal-edit-field"
    },
    "workspace": {
      "workspace": "modaleditfield_workspace", // Variable name to temporarily store value
      "workspace_flat": "modaleditfield_workspace_flat"  // Variable name to temporarily store value
    },
    "schema": {
      "schema": "modaleditfield_schema",  // Variable name to temporarily store value
      "schema_flat": "modaleditfield_schema_flat"  // Variable name to temporarily store value
    },
    "edit": {
      "target": "geodash-modal-edit-object",
    },
    "save": {
      "target": "geodash-sidebar-right",
      "fields":  {
        "workspace": "modaleditfield_workspace",
        "workspace_flat": "modaleditfield_workspace_flat"
      }
    }
  };
  //////////////////////////////////
  $scope.html5data = geodashserver.html5data;
  $scope.updateValue = geodash.api.updateValue;
  $scope.setValue = geodash.api.setValue;
  $scope.value_edit_field = null;
  //////////////////////////////////
  $scope.showOptions = geodash.ui.showOptions;
  //////////////////////////////////

  $scope.validateModalField = function(field_flat)
  {
    $scope["value_edit_field"] = $("#modal-edit-field-"+field_flat).val();

    $scope["modaleditfield_workspace_flat"][field_flat] = $scope["value_edit_field"];

    $scope.updateValue(
      field_flat,
      $scope[$scope.config.workspace.workspace_flat],
      $scope[$scope.config.workspace.workspace]);
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
    var workspace = $scope[$scope.config.workspace.workspace];
    var workspace_flat = $scope[$scope.config.workspace.workspace_flat];
    var currentValue = extract(field.split("."), workspace);
    var fieldType = extract(field.split("."), $scope[$scope.config.schema.schema]).type;
    if(fieldType == "stringarray" || fieldType == "textarray" || fieldType == "objectarray")
    {
      if($index > 0)
      {
         var newValue = [].concat(
          currentValue.slice(0, $index - 1),
          currentValue[$index],
          currentValue[$index - 1],
          currentValue.slice($index + 1));
        $scope.setValue(field_flat, currentValue, workspace);  // field, value, target
        $.each(geodash.api.flatten(newValue), function(i, x){
          workspace_flat[field_flat+"__"+i] = x;
        });
      }
    }
    else if(angular.isNumber(currentValue))
    {
      workspace_flat[field_flat] = currentValue + 1;
      $scope.setValue(field_flat, workspace_flat[field_flat], workspace);  // field, value, target
    }
  };

  $scope.down = function($event, field, field_flat, $index)
  {
    var workspace = $scope[$scope.config.workspace.workspace];
    var workspace_flat = $scope[$scope.config.workspace.workspace_flat];
    var currentValue = extract(field.split("."), workspace);
    if(Array.isArray(currentValue))
    {
      if($index < currentValue.length - 1)
      {
        var newValue = [].concat(
          currentValue.slice(0, $index),
          currentValue[$index + 1],
          currentValue[$index],
          currentValue.slice($index + 2));
        $scope.setValue(field_flat, currentValue, workspace);  // field, value, target
        $.each(geodash.api.flatten(newValue), function(i, x){
          workspace_flat[field_flat+"__"+i] = x;
        });
      }
    }
    else if(angular.isNumber(currentValue))
    {
      workspace_flat[field_flat] = currentValue - 1;
      $scope.setValue(field_flat, workspace_flat[field_flat], workspace);  // field, value, target
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
    var workspace = $scope[$scope.config.workspace.workspace];
    var workspace_flat = $scope[$scope.config.workspace.workspace_flat];
    var currentValue = extract(field.split("."), workspace);
    var fieldType = extract(field.split("."), $scope[$scope.config.schema.schema]).type;
    if(fieldType == "stringarray" || fieldType == "textarray" || fieldType == "objectarray")
    {
      var valueToAdd = $("#editor-field-"+field_flat).val();
      if(angular.isString(valueToAdd) && valueToAdd != "")
      {
        var newValue = angular.isDefined(currentValue) ? [valueToAdd].concat(currentValue) : [valueToAdd];
        //workspace[field] = newValue;
        $scope.setValue(field_flat, newValue, workspace);  // field, value, target
        $.each(geodash.api.flatten(newValue), function(i, x){
          workspace_flat[field_flat+"__"+i] = x;
        });
      }
    }
    else if(angular.isString(currentValue))
    {
      var valueToAdd = $("#editor-field-"+field_flat).val();
      if(angular.isString(valueToAdd) && valueToAdd != "")
      {
        workspace_flat[field_flat] = valueToAdd + "," + currentValue;
        $scope.setValue(field_flat, workspace_flat[field_flat], workspace);  // field, value, target
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
    var workspace = $scope[$scope.config.workspace.workspace];
    var workspace_flat = $scope[$scope.config.workspace.workspace_flat];
    var currentValue = extract(field.split("."), workspace);
    var fieldType = extract(field.split("."), $scope[$scope.config.schema.schema]).type;
    if(fieldType == "stringarray" || fieldType == "textarray" || fieldType == "objectarray")
    {
      currentValue.splice($index, 1);
      //workspace[field] = currentValue;
      $scope.setValue(field_flat, currentValue, workspace);  // field, value, target
      $.each(geodash.api.flatten(currentValue), function(i, x){
        workspace_flat[field_flat+"__"+i] = x;
      });
      delete workspace_flat[field_flat+"__"+(currentValue.length)];
    }
    else if(angular.isString(currentValue))
    {
      workspace_flat[field_flat] = currentValue.substring(0, $index) + currentValue.substring($index + 1);
      $scope.setValue(field_flat, workspace_flat[field_flat], workspace);  // field, value, target
    }
    else if(angular.isNumber(currentValue))
    {
      workspace_flat[field_flat] = currentValue - $("#editor-field-"+field_flat).val();
      $scope.setValue(field_flat, workspace_flat[field_flat], workspace);  // field, value, target
    }
    $("#editor-field-"+field_flat).val(null);
    try{
      $("#editor-field-"+field_flat).typeahead('val', null);
      $("#editor-field-"+field_flat).typeahead('close');
    }catch(err){};
  };

}];
