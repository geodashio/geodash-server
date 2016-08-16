var buildPageURL = function($interpolate, map_config, state)
{
  var template = geodash.api.getPage(state["page"]);
  if(template != undefined)
  {
    //
    var url = $interpolate(template)(state);

    var hash_args = [];
    var view = state["view"];
    if(view != undefined && view["z"] != undefined && view["lat"] != undefined && view["lon"] != undefined)
    {
      hash_args.push("z="+view["z"]);
      hash_args.push("lat="+view["lat"].toFixed(4));
      hash_args.push("lon="+view["lon"].toFixed(4));
    }
    var filters = state["filters"];
    if(filters)
    {
        $.each(state["filters"], function(layer_id, layer_filters)
        {
          $.each(layer_filters, function(filter_id, filter_value)
          {
              hash_args.push(layer_id+":"+filter_id+"="+filter_value);
          });
        });
    }
    if(hash_args.length > 0)
    {
      url += "#"+hash_args.join("&");
    }
    return url;
  }
  else
  {
    return undefined;
  }
};

geodash.controllers["controller_main"] = function(
  $interpolate, $scope, $element, $controller, $http, $q,
  state, map_config, stateschema, live)
{
    $scope.map_config = map_config;
    $scope.state = geodash.init_state(state, stateschema);
    $scope.live = live;

    $scope.refreshMap = function(state){
      // Refresh all child controllers
      $scope.$broadcast("refreshMap", {'state': state});
    };

    $scope.processEvent = function(event, args)
    {
      var c = $.grep(geodash.meta.controllers, function(x, i){
        return x['name'] == 'controller_main';
      })[0];

      for(var i = 0; i < c.handlers.length; i++)
      {
        if(c.handlers[i]['event'] == event.name)
        {
          geodash.handlers[c.handlers[i]['handler']]($scope, $interpolate, $http, $q,  event, args);
        }
      }
    };

    $.each(geodash.listeners, function(i, x){ $scope.$on(i, x); });

    var c = $.grep(geodash.meta.controllers, function(x, i){
      return x['name'] == 'controller_main';
    })[0];
    for(var i = 0; i < c.handlers.length; i++)
    {
      $scope.$on(c.handlers[i]['event'], $scope.processEvent);
    }
};


var init_geodashserver_controller_main = function(that, app)
{
  app.controller("GeoDashControllerBase", geodash.controllers.GeoDashControllerBase);
  app.controller("GeoDashControllerModal", geodash.controllers.GeoDashControllerModal);

  geodash.init_controller(that, app, geodash.controllers.controller_main);

  var selector_controller_base = [
    ".geodash-controller.geodash-about",
    ".geodash-controller.geodash-download",
    ".geodash-controller.geodash-dashboard-config",
    ".geodash-controller.geodash-dashboard-security",
    "[geodash-controller='geodash-modal']",
    "[geodash-controller='geodash-base']"
  ].join(", ");

  geodash.init_controllers(that, app, [{
    "selector": selector_controller_base,
    "controller": geodash.controllers.controller_base
  }]);

  geodash.init_controllers(that, app, [{
    "selector": '.geodash-controller.geodash-sidebar.geodash-sidebar-right',
    "controller": geodash.controllers.controller_sidebar_geodashserver
  }]);

  $("[geodash-controller='geodash-map']", that).each(function(){
    // Init This
    geodash.init_controller($(this), app, geodash.controllers.controller_base);

    // Init Children
    geodash.init_controllers($(this), app, [
      { "selector": "[geodash-controller='geodash-map-map']", "controller": geodash.controllers.controller_map_map },
      { "selector": "[geodash-controller='geodashserver-welcome']", "controller": geodash.controllers.controller_geodashserver_welcome },
      { "selector": "[geodash-controller='geodash-map-legend']", "controller": geodash.controllers.controller_legend }
    ]);

  });
};
