geodash.controllers["controller_modal_edit_field"] = function($scope, $element, $controller)
{

  angular.extend(this, $controller('GeoDashControllerModal', {$element: $element, $scope: $scope}));
  //////////////////////////////////
  var m = $.grep(geodash.meta.modals, function(x, i){ return x['name'] == 'edit_field';})[0];
  $scope.config = m.config;
  $scope.ui = m.ui;
  //////////////////////////////////
  $scope.html5data = geodashserver.html5data;
  $scope.updateValue = geodash.api.updateValue;
  $scope.setValue = geodash.api.setValue;
  $scope.value_edit_field = null;
  //////////////////////////////////
  $scope.showOptions = geodash.ui.showOptions;
  /////////////////////////////////

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

  $scope.up = function($event, $index)
  {
    var currentValue = extract($scope.path_array, $scope.workspace);
    var t = extract(($scope.schemapath_array || $scope.basepath_array), $scope.schema).type;
    if(t == "stringarray" || t == "textarray" || t == "templatearray" || t == "objectarray")
    {
      if($index > 0)
      {
         var newValue = [].concat(
          currentValue.slice(0, $index - 1),
          currentValue[$index],
          currentValue[$index - 1],
          currentValue.slice($index + 1));
        $scope.setValue($scope.path_flat, newValue, $scope.workspace);  // field, value, target
        $.each(geodash.api.flatten(newValue), function(i, x){
          $scope.workspace_flat[$scope.path_flat+"__"+i] = $scope.stack.head.workspace_flat[$scope.path_flat+"__"+i] = x;
        });
      }
    }
    else if(angular.isNumber(currentValue))
    {
      $scope.workspace_flat[$scope.path_flat] = $scope.stack.head.workspace_flat[$scope.path_flat] = currentValue + 1;
      $scope.setValue($scope.path_flat, $scope.workspace_flat[$scope.path_flat], $scope.workspace);  // field, value, target
    }
  };

  $scope.down = function($event, $index)
  {
    var currentValue = extract($scope.path_array, $scope.workspace);
    var t = extract(($scope.schemapath_array || $scope.basepath_array), $scope.schema).type;
    if(Array.isArray(currentValue))
    {
      if($index < currentValue.length - 1)
      {
        var newValue = [].concat(
          currentValue.slice(0, $index),
          currentValue[$index + 1],
          currentValue[$index],
          currentValue.slice($index + 2));
        $scope.setValue($scope.path_flat, newValue, $scope.workspace);
        $.each(geodash.api.flatten(newValue), function(i, x){
          $scope.workspace_flat[$scope.path_flat+"__"+i] = $scope.stack.head.workspace_flat[$scope.path_flat+"__"+i] = x;
        });
      }
    }
    else if(angular.isNumber(currentValue))
    {
      $scope.workspace_flat[$scope.path_flat] = $scope.stack.head.workspace_flat[$scope.path_flat] = currentValue - 1;
      $scope.setValue($scope.path_flat, $scope.workspace_flat[$scope.path_flat], $scope.workspace);
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
    if(fieldType == "stringarray" || fieldType == "textarray" || fieldType == "templatearray" || fieldType == "objectarray")
    {
      var valueToAdd = $("#editor-field-"+field_flat).val();
      if(angular.isString(valueToAdd) && valueToAdd != "")
      {
        var newValue = angular.isDefined(currentValue) ? [valueToAdd].concat(currentValue) : [valueToAdd];
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
    }catch(err){}
  };

  $scope.subtractFromField = function($event, field, field_flat, $index)
  {
    var workspace = $scope[$scope.config.workspace.workspace];
    var workspace_flat = $scope[$scope.config.workspace.workspace_flat];
    var currentValue = extract(field.split("."), workspace);
    var fieldType = extract(field.split("."), $scope[$scope.config.schema.schema]).type;
    if(fieldType == "stringarray" || fieldType == "textarray" || fieldType == "templatearray" || fieldType == "objectarray")
    {
      currentValue.splice($index, 1);
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
    }catch(err){}
  };

};
