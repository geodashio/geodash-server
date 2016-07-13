geodash.controllers["controller_sidebar_geodashserver"] = function(
  $scope, $element, $controller, $http, $cookies, state, map_config, live)
{
  angular.extend(this, $controller('GeoDashControllerBase', {$element: $element, $scope: $scope}));
  /////////////////////
  $scope.config = {
    "that" : {
      "id": "geodash-sidebar-right"
    },
    "html5data": {
      "modal_dashboard_config": {
        "id": "geodash-modal-dashboard-config",
        "dynamic": {
          "map_config": ["source", "map_config"],
          "map_config_flat": ["source", "map_config_flat"],
          "map_config_schema": ["source", "map_config_schema"],
          "map_config_schema_flat": ["source", "map_config_schema_flat"]
        }
      }
    }
  };
  /////////////////////


  $scope.map_config = map_config;
  $scope.map_config_flat = geodash.api.flatten($scope.map_config, undefined);
  $scope.editor = geodash.initial_data["data"]["editor"];
  $scope.map_config_schema = geodash.initial_data["data"]["map_config_schema"];
  $scope.map_config_schema_flat = geodash.api.flatten($scope.map_config_schema, undefined);
  $scope.fields_by_pane = {};
  $scope.value_edit_field = null;

  $scope.html5data = geodashserver.html5data;

  $scope.updateVariables = function(){

    var fields_by_pane = [];
    for(var i = 0; i < $scope.editor.panes.length; i++)
    {
        var pane = $scope.editor.panes[i];
        var fields_all = [];

        if("fields" in pane && angular.isArray(pane.fields))
        {
          fields_all = fields_all.concat(pane.fields);
        }

        if("section" in pane && pane.section in $scope.map_config_schema)
        {
          fields_all = fields_all.concat($.map($scope.map_config_schema[pane.section], function(value, key){
            return pane.section+"."+key;
          }));
        }

        fields_by_pane.push({'id': pane.id, 'fields': fields_all});
    }
    $scope.fields_by_pane = fields_by_pane;
  };
  $scope.updateVariables();
  $scope.$watch('map_config', $scope.updateVariables);
  $scope.$watch('editor', $scope.updateVariables);
  $scope.$watch('map_config_schema', $scope.updateVariables);
  /*$scope.$watch('map_config',  function(){
    $scope.map_config_flat = geodash.api.flatten($scope.map_config, undefined);
  });
  $scope.$watch('map_config_flat', function(){
    $scope.map_config = geodash.api.unpack($scope.map_config_flat);
  });*/

  var jqe = $($element);

  $scope.validateFields = function(field_flat_array)
  {
    for(var i = 0; i < field_flat_array.length; i++)
    {
      $scope.validateField(field_flat_array[i]);
    }
  }
  $scope.validateField = function(field_flat)
  {
    // Update map_config
    if(field_flat.indexOf("__") == -1)
    {
      $scope.map_config[field_flat] = $scope.map_config_flat[field_flat];
    }
    else
    {
      var keyChain = field_flat.split("__");
      var target = $scope.map_config;
      for(var j = 0; j < keyChain.length -1 ; j++)
      {
        var newKey = keyChain[j];
        if(!(newKey in target))
        {
          var iTest = -1;
          try{iTest = parseInt(keyChain[j+1], 10);}catch(err){iTest = -1;};
          target[newKey] = iTest >= 0 ? [] : {};
        }
        target = target[newKey];
      }
      var finalKey = keyChain[keyChain.length-1];
      if(angular.isArray(target))
      {
        if(finalKey >= target.length)
        {
          var zeros = finalKey - target.length;
          for(var k = 0; k < zeros; k++ )
          {
            target.push({});
          }
          target.push($scope.map_config_flat[field_flat]);
        }
      }
      else
      {
        target[finalKey] = $scope.map_config_flat[field_flat];
      }
    }
  };

  //$scope.showOptions = function($event, field, field_flat)
  // $("#editor-field-"+field_flat);

  $scope.addToField = function($event, field, field_flat)
  {
    var currentValue = extract(field.split("."), $scope.map_config);
    if(Array.isArray(currentValue))
    {
      var valueToAdd = $("#editor-field-"+field_flat).val();
      if(angular.isString(valueToAdd) && valueToAdd != "")
      {
        var newValue = currentValue.push(valueToAdd);
        $scope.map_config[field] = newValue;
        $.each(geodash.api.flatten(newValue), function(i, x){
          $scope.map_config_flat[field_flat+"__"+i] = x;
        });
      }
    }
    else if(angular.isString(currentValue))
    {
      var valueToAdd = $("#editor-field-"+field_flat).val();
      if(angular.isString(valueToAdd) && valueToAdd != "")
      {
        $scope.map_config_flat[field_flat] = currentValue + "," + valueToAdd;
        $scope.validateField(field_flat);
      }
    }
    else if(angular.isNumber(currentValue))
    {
      var valueToAdd = $("#editor-field-"+field_flat).val();
      if(angular.isString(valueToAdd) && valueToAdd != "")
      {
        $scope.map_config_flat[field_flat] = currentValue + parseFloat(valueToAdd);
        $scope.validateField(field_flat);
      }
    }
    $("#editor-field-"+field_flat).val(null);
    try{
      $("#editor-field-"+field_flat).typeahead('val', null);
      $("#editor-field-"+field_flat).typeahead('close');
    }catch(err){};
  };

  $scope.saveConfig = function($event)
  {
    var slug = $('#geodash-main').scope()['state']['slug'];
    if(window.confirm("Are you sure you want to save?"))
    {
      var httpConfig = {
          'headers': {
            'Content-Type': 'application/json',
            'X-CSRFToken': $cookies['csrftoken']
          }
      };
      var data = $scope.map_config;
      $http.post('/api/dashboard/'+slug+'/config/save', data, httpConfig).success(function(data)
      {
        console.log(data);
        if(data.success)
        {
          if(data.map_config.slug != slug)
          {
            window.location.href = '/dashboard/'+data.map_config.slug;
          }
          else
          {
            location.reload();
          }
        }
        else
        {
            window.alert(data.message);
        }
      });
    }
  };

  $scope.saveAsConfig = function($event)
  {
    var slug = $('#geodash-main').scope()['state']['slug'];
    if(window.confirm("Are you sure you want to save as a new dashboard?  Old one will still exist at old slug."))
    {
      if($scope.map_config.slug == slug)
      {
        alert("Cannot save as.  Need to specify new unique slug.")
        return 1;
      }

      var httpConfig = {
          'headers': {
            'Content-Type': 'application/json',
            'X-CSRFToken': $cookies['csrftoken']
          }
      };
      var data = $scope.map_config;
      $http.post('/api/dashboard/config/new', data, httpConfig).success(function(data)
      {
        console.log(data);
        if(data.success)
        {
          window.location.href = '/dashboard/'+data.map_config.slug;
        }
        else
        {
            window.alert(data.message);
        }
      });
    }
  };

  /*$scope.build_title_edit_object = function(map_config_schema, field, object)
  {
    if(object != undefined)
    {
      return 'Edit / ' + extract([field, 'label'], map_config_schema) +' / ' + object.id;
    }
    else
    {
      return 'Edit / ' + extract([field, 'label'], map_config_schema) +' / New Object';
      //ng-bind-html="map_config_schema | extract : field : 'label' | prepend : 'Edit / ' | append : ' / ' : object.id | md2html"></h4>
    }
  };*/

  setTimeout(function(){
    $('[data-toggle="tooltip"]', $element).tooltip();
  },0);
};
