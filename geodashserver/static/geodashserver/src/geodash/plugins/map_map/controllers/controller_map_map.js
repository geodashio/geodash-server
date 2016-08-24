var highlightFeature = function(e){
  var layer = e.target;
  /*if("hoverStyle" in layer.options && layer.options.hoverStyle != undefined)
  {
    var newStyle = layer.options.hoverStyle;
    layer.setStyle(newStyle);
    if (!L.Browser.ie && !L.Browser.opera){
      layer.bringToFront();
    }
  }*/
};

geodash.controllers["controller_map_map"] = function(
  $rootScope, $scope, $element, $http, $q,
  $compile, $interpolate, $templateCache,
  state, map_config, live) {
  //////////////////////////////////////
  $scope.processEvent = function(event, args)
  {
    var c = $.grep(geodash.meta.controllers, function(x, i){
      return x['name'] == 'controller_map_map';
    })[0];

    for(var i = 0; i < c.handlers.length; i++)
    {
      if(c.handlers[i]['event'] == event.name)
      {
        geodash.handlers[c.handlers[i]['handler']]($scope, $interpolate, $http, $q, event, args);
      }
    }
  };

  var c = $.grep(geodash.meta.controllers, function(x, i){
    return x['name'] == 'controller_map_map';
  })[0];
  for(var i = 0; i < c.handlers.length; i++)
  {
    $scope.$on(c.handlers[i]['event'], $scope.processEvent);
  }
  //////////////////////////////////////
  var listeners =
  {
    click: function(e) {
      var m = live["map"];
      var v = m.getView();
      var c = v.getCenter();
      var delta = {
        "lat": c[1],
        "lon": c[0]
      };
      geodash.api.intend("clickedOnMap", delta, $scope);
    },
    zoomend: function(e){
      var m = live["map"];
      var v = m.getView();
      var c = v.getCenter();
      var delta = {
        "extent": v.calculateExtent(m.getSize()).join(","),
        "z": v.getZoom()
      };
      geodash.api.intend("viewChanged", delta, $scope);
    },
    dragend: function(e){
      var m = live["map"];
      var v = m.getView();
      var c = v.getCenter();
      var delta = {
        "extent": v.calculateExtent(m.getSize()).join(","),
        "lat": c[1],
        "lon": c[0]
      };
      geodash.api.intend("viewChanged", delta, $scope);
    },
    moveend: function(e){
      var m = live["map"];
      var v = m.getView();
      var c = v.getCenter();
      var delta = {
        "extent": v.calculateExtent(m.getSize()).join(","),
        "lat": c.lat,
        "lon": c.lng
      };
      geodash.api.intend("viewChanged", delta, $scope);
    }
  };
  //////////////////////////////////////
  // The Map
  var hasViewOverride = hasHashValue(["latitude", "lat", "longitude", "lon", "lng", "zoom", "z"]);
  var view = state["view"];
  live["map"] = geodash.init.map_ol3({
    "attributionControl": extract(expand("controls.attribution"), map_config, true),
    "zoomControl": extract(expand("controls.zoom"), map_config, true),
    "minZoom": extract(expand("view.minZoom"), map_config, 0),
    "maxZoom": extract(expand("view.maxZoom"), map_config, 18),
    "lat": extract(expand("view.latitude"), map_config, 0),
    "lon": extract(expand("view.longitude"), map_config, 0),
    "z": extract(expand("view.zoom"), map_config, 3),
    "listeners": listeners
  });
  //////////////////////////////////////
  // Base Layers
  var baseLayers = geodash.layers.init_baselayers_ol3(live["map"], map_config["baselayers"]);
  $.extend(live["baselayers"], baseLayers);
  // Load Default/Initial Base Layer
  var baseLayerID = map_config["view"]["baselayer"] || map_config["baselayers"][0].id;
  live["map"].addLayer(live["baselayers"][baseLayerID]);
  //live["baselayers"][baseLayerID].addTo(live["map"]);
  geodash.api.intend("viewChanged", {'baselayer': baseLayerID}, $scope);
  geodash.api.intend("layerLoaded", {'type':'baselayer', 'layer': baseLayerID}, $scope);
  //////////////////////////////////////
  // Feature Layers
  if("featurelayers" in map_config && map_config.featurelayers != undefined)
  {
    $.each(map_config.featurelayers, function(i, layerConfig){
      geodash.layers.init_featurelayer(layerConfig.id, layerConfig, $scope, live, map_config);
    });
  }
  //////////////////////////////////////
  // Sidebar Toggle
  /*$("#geodash-map-sidebar-toggle-right").click(function (){
    $(this).toggleClass("sidebar-open sidebar-right-open");
    $("#geodash-sidebar-right, #geodash-map").toggleClass("sidebar-open sidebar-right-open");
    setTimeout(function(){
      live["map"].invalidateSize({
        animate: true,
        pan: false
      });
    },2000);
  });*/
  /*$scope.on$('toggleComponent', function (event, args){
    console.log("Event: ", event);
    console.log("Args: ", args);
    var component = args.component;
    var position = args.position;
    var classes = component+"-open "+component+"-"+position+"-open";
    $(args.selector).toggleClass(classes);
    setTimeout(function(){
      live["map"].invalidateSize({
        animate: true,
        pan: false
      });
    },2000);
  });*/
  //////////////////////////////////////
  $scope.$on("refreshMap", function(event, args) {
    // Forces Refresh
    console.log("Refreshing map...");
    // Update Visibility
    var visibleBaseLayer = args.state.view.baselayer;
    $.each(live["baselayers"], function(id, layer) {
      var visible = id == visibleBaseLayer;
      if(live["map"].hasLayer(layer) && !visible)
      {
        live["map"].removeLayer(layer)
      }
      else if((! live["map"].hasLayer(layer)) && visible)
      {
        live["map"].addLayer(layer)
      }
    });
    var visibleFeatureLayers = args.state.view.featurelayers;
    $.each(live["featurelayers"], function(id, layer) {
      var visible = $.inArray(id, visibleFeatureLayers) != -1;
      if(live["map"].hasLayer(layer) && !visible)
      {
        live["map"].removeLayer(layer)
      }
      else if((! live["map"].hasLayer(layer)) && visible)
      {
        live["map"].addLayer(layer)
      }
    });
    // Update Render Order
    var renderLayers = $.grep(layersAsArray(live["featurelayers"]), function(layer){ return $.inArray(layer["id"], visibleFeatureLayers) != -1;});
    var renderLayersSorted = sortLayers($.map(renderLayers, function(layer, i){return layer["layer"];}),true);
    var baseLayersAsArray = $.map(live["baselayers"], function(layer, id){return {'id':id,'layer':layer};});
    var baseLayers = $.map(
      $.grep(layersAsArray(live["baselayers"]), function(layer){return layer["id"] == visibleBaseLayer;}),
      function(layer, i){return layer["layer"];});
    updateRenderOrder(baseLayers.concat(renderLayersSorted));
    // Force Refresh
    setTimeout(function(){live["map"]._onResize()}, 0);
  });

  $scope.$on("changeView", function(event, args) {
    console.log("Refreshing map...");
    if(args["layer"] != undefined)
    {
      live["map"].fitBounds(live["featurelayers"][args["layer"]].getBounds());
    }
  });

  $scope.$on("openPopup", function(event, args) {
    console.log("Refreshing map...");
    if(
      args["featureLayer"] != undefined &&
      args["feature"] != undefined &&
      args["location"] != undefined)
    {
      geodash.popup.openPopup(
        $interpolate,
        args["featureLayer"],
        args["feature"],
        args["location"],
        live["map"],
        angular.element("#geodash-main").scope().state);
    }
  });
};
