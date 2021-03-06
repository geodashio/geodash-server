var geodash = {
  'init': {},
  'directives': {},
  'controllers': {},
  'filters': {},
  'handlers': {},
  'vecmath': {},
  'tilemath': {},
  'api': {},
  'listeners': {},
  'ui': {}
};

geodash.init.templates = function(app)
{
  if(geodash.templates != undefined)
  {
    geodash.meta.templates = [];
    $.each(geodash.templates, function(name, template){
      geodash.meta.templates.push(name);
      app.run(function($templateCache){$templateCache.put(name,template);});
    });
  }
};

geodash.init.filters = function(app)
{
  if(geodash.filters != undefined)
  {
    geodash.meta.filters = [];
    $.each(geodash.filters, function(name, func){
      geodash.meta.filters.push(name);
      app.filter(name, func);
    });
  }
};
geodash.init.directives = function(app)
{
  if(geodash.directives != undefined)
  {
    geodash.meta.directives = [];
    $.each(geodash.directives, function(name, dir){
      geodash.meta.directives.push(name);
      app.directive(name, dir);
    });
  }
};

geodash.init.listeners = function()
{
  $('body').on('click', '.btn-clear', function(event) {
    // "this" doesn't always point to what you think it does,
    // that's why need to use event.currentTarget
    var selector = $(event.currentTarget).attr('data-target');

    try{ $(selector).typeahead('close'); }catch(err){};

    $(selector).each(function(){
      var input = $(this);
      input.val(null);
      // Update Typeahead backend if exists
      if(input.data('backend') != undefined)
      {
        var backend = $('#'+input.data('backend'));
        backend.val(null);
        backend.trigger('input');
        backend.change();
      }
    });
  });
  $('body').on('click', '.btn-off', function(event) {
    var selector = $(event.currentTarget).attr('data-target');
    $(selector).each(function(){
      var input = $(this);
      input.val("false");
      input.trigger('input');
      input.change();
    });
  });
  $('body').on('click', '.btn-on', function(event) {
    var selector = $(event.currentTarget).attr('data-target');
    $(selector).each(function(){
      var input = $(this);
      input.val("true");
      input.trigger('input');
      input.change();
    });
  });

  $('body').on('click', '.geodash-intent', function(event) {
    event.preventDefault();  // For anchor tags
    var that = $(this);
    //var scope = angular.element('[ng-controller='+that.data('intent-ctrl')+']').scope();
    var scope = geodash.api.getScope(that.attr('data-intent-ctrl'));
    if(that.hasClass('geodash-toggle'))
    {
      var intentData = JSON.parse(that.attr('data-intent-data')); // b/c jquery data not updated by angular
      if(that.hasClass('geodash-off'))
      {
        that.removeClass('geodash-off');
        geodash.api.intend(that.attr('data-intent-names')[0], intentData, scope);
      }
      else
      {
        that.addClass('geodash-off');
        geodash.api.intend(that.attr('data-intent-names')[1], intentData, scope);
      }
    }
    else if(that.hasClass('geodash-radio'))
    {
      var siblings = that.parents('.geodash-radio-group:first').find(".geodash-radio").not(that);
      if(!(that.hasClass('geodash-on')))
      {
        that.addClass('geodash-on');
        if(that.data("intent-class-on"))
        {
          that.addClass(that.data("intent-class-on"));
          siblings.removeClass(that.data("intent-class-on"));
        }
        siblings.removeClass('geodash-on');
        if(that.data("intent-class-off"))
        {
          that.removeClass(that.data("intent-class-off"));
          siblings.addClass(that.data("intent-class-off"));
        }
        var intentName = that.attr('data-intent-name');
        var intentData = JSON.parse(that.attr('data-intent-data')); // b/c jquery data not updated by angular
        geodash.api.intend(intentName, intentData, scope);
      }
    }
    else
    {
      var intentName = that.attr('data-intent-name');
      var intentData = JSON.parse(that.attr('data-intent-data'));
      geodash.api.intend(intentName, intentData, scope);
    }
  });
};

geodash.init.typeahead = function($element, featurelayers, baselayers)
{
  $('.typeahead', $element).each(function(){
    var s = $(this);
    var placeholder = s.data('placeholder');
    var initialData = s.data('initialData');
    var w = s.data('width');
    var h = s.data('height');
    var css = 'geodashserver-welcome-select-dropdown';
    var template_empty = s.data('template-empty');
    var template_suggestion = s.data('template-suggestion');

    var bloodhoundData = [];
    if(angular.isString(initialData))
    {
      if(initialData == "layers")
      {
        bloodhoundData = [];
        featurelayers = featurelayers || geodash.api.listFeatureLayers();
        //angular.element("#geodash-main").scope()["map_config"]["featurelayers"];
        if(featurelayers != undefined)
        {
          bloodhoundData = bloodhoundData.concat($.map(featurelayers, function(x, i){
            return {'id': x.id, 'text': x.id};
          }));
        }
        baselayers = baselayers || geodash.api.listBaseLayers();
        //angular.element("#geodash-main").scope()["map_config"]["baselayers"];
        if(baselayers != undefined)
        {
          bloodhoundData = bloodhoundData.concat($.map(baselayers, function(x, i){
            return {'id': x.id, 'text': x.id};
          }));
        }
      }
      else if(initialData == "featurelayers")
      {
        featurelayers = featurelayers || geodash.api.listFeatureLayers();
        bloodhoundData = $.map(featurelayers, function(fl, id){ return {'id': id, 'text': id}; });
      }
      else if(initialData == "baselayers")
      {
        baselayers = baselayers || geodash.api.listBaseLayers();
        bloodhoundData = $.map(baselayers, function(bl, id){ return {'id': id, 'text': id}; });
      }
      else if(initialData.length > 0)
      {
        bloodhoundData = [].concat(geodash.initial_data["data"][initialData]);
        for(var i = 0; i < bloodhoundData.length; i++)
        {
          if(angular.isString(bloodhoundData[i]))
          {
            bloodhoundData[i] = {'id': bloodhoundData[i], 'text': bloodhoundData[i]};
          }
        }
      }
    }
    else if(Array.isArray(initialData))
    {
      bloodhoundData = [].concat(initialData);
      for(var i = 0; i < bloodhoundData.length; i++)
      {
        if(angular.isString(bloodhoundData[i]))
        {
          bloodhoundData[i] = {'id': bloodhoundData[i], 'text': bloodhoundData[i]};
        }
      }
      //bloodhoundData = $.map(initialData, function(x, i){ return {'id': x, 'text': x}; });
    }

    if(angular.isDefined(bloodhoundData) && bloodhoundData.length > 0)
    {
      bloodhoundData.sort(function(a, b){
        var textA = a.text.toLowerCase();
        var textB = b.text.toLowerCase();
        if(textA < textB){ return -1; }
        else if(textA > textB){ return 1; }
        else { return 0; }
      });

      // Twitter Typeahead with
      //https://github.com/bassjobsen/typeahead.js-bootstrap-css
      var engine = new Bloodhound({
        identify: function(obj) {
          return obj['text'];
        },
        datumTokenizer: function(d) {
          return Bloodhound.tokenizers.whitespace(d.text);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        local: bloodhoundData
      });

      s.data('engine', engine);
      s.typeahead('destroy','NoCached');
      s.typeahead(null, {
        name: s.attr('name'),
        minLength: 0,
        limit: 10,
        hint: false,
        highlight: true,
        displayKey: 'text',
        source: function (query, cb)
        {
          // https://github.com/twitter/typeahead.js/pull/719#issuecomment-43083651
          // http://pastebin.com/adWHFupF
          //query == "" ? cb(data) : engine.ttAdapter()(query, cb);
          engine.ttAdapter()(query, cb);
        },
        templates: {
          empty: template_empty,
          suggestion: function (data) {
              return '<p><strong>' + data.text + '</strong> - ' + data.id + '</p>';
          },
          footer: function (data) {
            return '<div>Searched for <strong>' + data.query + '</strong></div>';
          }
        }
      }).on('blur', function(event) {
        var results = engine.get($(this).val());
        var backend = $('#'+$(this).data('backend'))
          .val(results.length == 1 ? results[0]['id'] : null)
          .trigger('input')
          .change();
      })
      .on('typeahead:change', function(event, value) {
        console.log("Event: ", event, value);
        var results = engine.get(value);
        var backend = $('#'+$(this).data('backend'))
          .val(results.length == 1 ? results[0]['id'] : null)
          .trigger('input')
          .change();
      })
      .on('typeahead:select typeahead:autocomplete typeahead:cursorchange', function(event, obj) {
        console.log("Event: ", event, obj);
        var backend = $('#'+$(this).data('backend'))
          .val(extract("id", obj, null))
          .trigger('input')
          .change();
      });
    }

  });

}
geodash.api.parseTrue = function(value)
{
  return ['on', 'true', 't', '1', 1, true].indexOf(value) != -1;
};
geodash.api.getOption = function(options, name)
{
  if(options != undefined && options != null)
  {
    return options[name];
  }
  else
  {
    return undefined;
  }
};
geodash.api.getScope = function(id)
{
  return angular.element("#"+id).isolateScope() || angular.element("#"+id).scope();
};
geodash.api.getDashboardConfig = function(options)
{
  var scope = geodash.api.getOption(options, '$scope') ||
    geodash.api.getOption(options, 'scope') ||
    geodash.api.getScope("geodash-main");
  return scope.map_config;
};
geodash.api.getPage = function(id, options)
{
  var config = geodash.api.getDashboardConfig(options);
  var matches = $.grep(config.pages, function(x, i){return x.id == id;});
  if(matches.length == 1)
  {
    return matches[0]["url"];
  }
  else
  {
    return undefined;
  }
};
geodash.api.hasLayer = function(id, layers)
{
  var layer = undefined;
  var matches = $.grep(layers, function(x, i){ return x.id == id; });
  return matches.length == 1;
};
geodash.api.getLayer = function(id, layers)
{
  var layer = undefined;
  var matches = $.grep(layers, function(x, i){ return x.id == id; });
  if(matches.length == 1)
  {
    layer = matches[0];
  }
  return layer;
};
geodash.api.listBaseLayers = function(options)
{
  var config = geodash.api.getDashboardConfig(options);
  return extract("baselayers", config, []);
};
geodash.api.getBaseLayer = function(id, options)
{
  var config = geodash.api.getDashboardConfig(options);
  return geodash.api.getLayer(id, config.baselayers);
};
geodash.api.hasBaseLayer = function(id, options)
{
  var config = geodash.api.getDashboardConfig(options);
  return geodash.api.hasLayer(id, config.baselayers);
};
geodash.api.listFeatureLayers = function(options)
{
  var config = geodash.api.getDashboardConfig(options);
  return extract("featurelayers", config, []);
};
geodash.api.getFeatureLayer = function(id, options)
{
  var config = geodash.api.getDashboardConfig(options);
  return geodash.api.getLayer(id, config.featurelayers);
};
geodash.api.hasFeatureLayer = function(id, options)
{
  var config = geodash.api.getDashboardConfig(options);
  return geodash.api.hasLayer(id, config.featurelayers);
};
geodash.api.welcome = function(options)
{
  options = options || {};
  var scope = options['$scope'] || options['scope'] || angular.element("#geodash-main").scope();
  var intentData = {
    "id": "geodash-modal-welcome",
    "dynamic": {},
    "static": {
      "welcome": scope.map_config["welcome"]
    }
  };
  geodash.api.intend("toggleModal", intentData, scope);
};

/**
 * Used for intents (requesting and action), such as opening modals, zooming the map, etc.
 * @param {string} name of the intent (toggleModal, refreshMap, filterChanged)
 * @param {object} JSON package for intent
 * @param {object} Angular Scope object for emiting the event up the DOM.  This should correspond to an element's paranet controller.
*/
geodash.api.intend = function(name, data, scope)
{
  scope.$emit(name, data);
};


geodash.assert_float = function(x, fallback)
{
  if(x === undefined || x === "")
  {
    return fallback;
  }
  else if(angular.isNumber(x))
  {
    return x;
  }
  else
  {
    return parseFloat(x);
  }
};

geodash.assert_array_length = function(x, length, fallback)
{
  if(x === undefined || x === "")
  {
    return fallback;
  }
  else if(angular.isString(x))
  {
    x = x.split(",");
    if(x.length == length)
    {
      return x;
    }
    else
    {
      return fallback;
    }
  }
  else if(angular.isArray(x))
  {
    if(x.length == length)
    {
      return x;
    }
    else
    {
      return fallback;
    }
  }
};

geodash.api.opt = function(options, names, fallback, fallback2)
{
  if(options != undefined)
  {
    if($.isArray(names))
    {
      var value = undefined;
      for(var i = 0; i < names.length; i++)
      {
        value = options[names[i]];
        if(value != undefined)
            break;
      }
      return value || fallback || fallback2;
    }
    else
        return options[names] || fallback ||  fallback2;
  }
  else
      return fallback || fallback2;
};
geodash.api.opt_i = function(options, names, fallback)
{
  return geodash.api.opt(options, names, fallback, 0);
};
geodash.api.opt_s = function(options, names, fallback)
{
  return geodash.api.opt(options, names, fallback, "");
};
geodash.api.opt_b = function(options, names, fallback)
{
  return geodash.api.opt(options, names, fallback, false);
};
geodash.api.opt_j = function(options, names, fallback)
{
  return geodash.api.opt(options, names, fallback, {});
};

geodash.api.normalize_feature = function(feature)
{
  var feature = {
    'attributes': feature.attributes || feature.properties,
    'geometry': feature.geometry
  };
  return feature;
};

geodash.api.flatten = function(obj, prefix)
{
  var newObject = {};
  $.each(obj, function(key, value){
    var newKey = prefix != undefined ? prefix+"__"+key : key;
    if(
      (value === undefined) ||
      (value === null) ||
      angular.isString(value) ||
      angular.isNumber(value) ||
      (typeof value == "boolean")
    )
    {
      newObject[newKey] = value;
    }
    else if(angular.isArray(value))
    {
      $.each(geodash.api.flatten(value, newKey), function(key2, value2){
        newObject[""+key2] = value2;
      });
    }
    else
    {
      $.each(geodash.api.flatten(value, newKey), function(key2, value2){
        newObject[key2] = value2;
      });
    }
  });
  return newObject;
};

geodash.api.unpack = function(obj)
{
  var newObject = {};
  $.each(obj, function(key, value){
    if(key.indexOf("__") == -1)
    {
      newObject[key] = value;
    }
    else
    {
      var keyChain = key.split("__");
      var target = obj;
      for(var j = 0; j < keyChain.length; j++)
      {
        var newKey = keyChain[j];
        if(!(newKey in target))
        {
          target[newKey] = {};
        }
        target = target[newKey];
      }
      target[keyChain[keyChain.length-1]] = value;
    }
  });
  return newObject;
};

geodash.api.buildScope = function(event, args)
{
  var mainScope = geodash.api.getScope("geodash-main");
  //
  var id = args["id_target"] || args["id_show"] || args["id"];
  var sourceScope = event.targetScope;
  var scope_new = {
    "state": mainScope.state,
    "meta": geodash.meta
  };
  if(angular.isDefined(args))
  {
    if("static" in args)
    {
      scope_new = $.extend(scope_new, args["static"]);
    }
    if("dynamic" in args)
    {
      $.each(args["dynamic"],function(key, value){
        if(angular.isString(value))
        {
          if(value == "map_config")
          {
            scope_new[key] = mainScope.map_config;
          }
          else if(value == "state")
          {
            scope_new[key] = mainScope.state;
          }
        }
        else if(angular.isArray(value))
        {
          var value_0_lc = value[0].toLowerCase();
          if(value_0_lc == "source")
          {
            scope_new[key] = extract(expand(value.slice(1)), event.targetScope);
          }
          else if(value_0_lc == "baselayer" || value_0_lc == "bl")
          {
              scope_new[key] = geodash.api.getBaseLayer(value[1]) || undefined;
          }
          else if(value_0_lc == "featurelayer" || value_0_lc == "fl")
          {
              scope_new[key] = geodash.api.getFeatureLayer(value[1]) || undefined;
          }
          else
          {
            if(value_0_lc == "map_config")
            {
              scope_new[key] = extract(expand(value.slice(1)), mainScope.map_config);
            }
            else if(value_0_lc == "state")
            {
              scope_new[key] = extract(expand(value.slice(1)), mainScope.state);
            }
          }
        }
        else
        {
          scope_new[key] = value;
        }
      });
    }
  }
  return $.extend(true, {}, scope_new);  // Returns a deep copy of variables
};

geodash.api.updateValue = function(field_flat, source, target)
{
  // Update map_config
  if(field_flat.indexOf("__") == -1)
  {
    target[field_flat] = source[field_flat];
  }
  else
  {
    var keyChain = field_flat.split("__");
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
        target.push(source[field_flat]);
      }
    }
    else
    {
      target[finalKey] = source[field_flat];
    }
  }
};
geodash.api.setValue = function(field_flat, value, target)
{
  // Update map_config
  if(field_flat.indexOf("__") == -1)
  {
    target[field_flat] = value;
  }
  else
  {
    var keyChain = field_flat.split("__");
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
        target.push(value);
      }
    }
    else
    {
      target[finalKey] = value;
    }
  }
};


geodash.listeners.saveAndHide = function(event, args)
{
  geodash.listeners.hideModal(event, args);
  //
  var target = args["id_target"] || args["id"];
  var modal_scope_target = geodash.api.getScope(target);
  var modal_scope_new = geodash.api.buildScope(event, args);
  modal_scope_target.$apply(function () {
    $.each(modal_scope_new, function(key, value){
      modal_scope_target[key] = value;
    });
    // OR
    //$.extend(modal_scope_target, modal_scope_new);
  });
};
/*
geodash.listeners.saveAndSwitch = function(event, args)
{
  geodash.listeners.hideModal(event, args);
  //
  var target = args["id_show"] || args["id"];
  var modal_scope_target = geodash.api.getScope(target);
  var modal_scope_new = geodash.api.buildScope(event, args);
  modal_scope_target.$apply(function () {
    $.each(modal_scope_new, function(key, value){ modal_scope_target[key] = value; });
  });
};*/
geodash.listeners.switchModal = function(event, args)
{
  geodash.listeners.hideModal(event, args);
  geodash.listeners.showModal(event, args);
};
geodash.listeners.hideModal = function(event, args)
{
  var id = args["id_hide"] || args["id"];
  try {
    $("#"+id).modal('hide');
    var modal_scope = geodash.api.getScope(id);
    var aClear = args["clear"];
    if("clear" in args && args["clear"] != undefined)
    {
      modal_scope.$apply(function () {
        $.each(aClear,function(i, x){
          modal_scope[x] = undefined;
        });
      });
    }
  }
  catch(err){};
};
geodash.listeners.toggleModal = function(event, args)
{
  geodash.listeners.showModal(event, args);
};
geodash.listeners.showModal = function(event, args)
{
    console.log('event', event);
    console.log('args', args);
    //
    var id = args["id_show"] || args["id"];
    var modal_scope = geodash.api.getScope(id);
    var modal_scope_new = geodash.api.buildScope(event, args);
    var modalOptions = args['modal'] || {};
    modalOptions['show'] = false;
    modal_scope.$apply(function () {
        // Update Scope
        //modal_scope = $.extend(modal_scope, modal_scope_new);
        //$.each(modal_scope_new, function(key, value){ modal_scope[key] = value; });
        /////////////////
        modal_scope.push(modal_scope_new);// Pushes New Scope to Modal's Stack
        /////////////////
        setTimeout(function(){
          // Update Modal Tab Selection
          // See https://github.com/angular-ui/bootstrap/issues/1741
          var modalElement = $("#"+id);
          var targetTab = modal_scope.tab;
          if(targetTab != undefined)
          {
            modalElement.find('.nav-tabs li').each(function(){
              var that = $(this);
              var thisTab = that.find('a').attr('href').substring(1);
              if(targetTab == thisTab)
              {
                  that.addClass('active');
              }
              else
              {
                  that.removeClass('active');
              }
            });
            modalElement.find('.tab-pane').each(function(){
              var that = $(this);
              if(targetTab == that.attr('id'))
              {
                  that.addClass('in active');
              }
              else
              {
                  that.removeClass('in active');
              }
            });
          }
          else
          {
            modalElement.find('.nav-tabs li').slice(0, 1).addClass('active');
            modalElement.find('.nav-tabs li').slice(1).removeClass('active');
            modalElement.find('.tab-pane').slice(0, 1).addClass('in active');
            modalElement.find('.tab-pane').slice(1).removeClass('in active');
          }
          // Initalize Tooltips
          $('[data-toggle="tooltip"]', modalElement).tooltip();
          //Initialize Typeahead
          geodash.init.typeahead(
            modalElement,
            modal_scope.featurelayers,
            modal_scope.baselayers);
          // Toggle Modal
          $("#"+id).modal(modalOptions);
          $("#"+id).modal('toggle');
        },0);
    });
};

geodash.ui.toggleOptions = function($event, selector)
{
  //var selector = $(event.currentTarget).attr('data-target');
  //try{ $(selector).typeahead('close'); }catch(err){};
  return geodash.ui.showOptions($event, selector);
};

geodash.ui.showOptions = function($event, selector)
{
  try{
    var input = $(selector);
    input.typeahead('open');
    input.data('ttTypeahead').menu.update.apply(input.data('ttTypeahead').menu, [""]);
    var engine = input.data('engine');
    engine.search.apply(engine, [""])
  }catch(err){};
};

var currentControllers = [];

geodash.init_controller_base = function(app)
{
  app.controller("GeoDashControllerBase", geodash.controllers.controller_base);
};

geodash.init_controller = function(that, app, controller)
{
  var controllerName = that.data('controllerName') || that.attr('geodash-controller') || that.attr('name') || that.attr('id');
  if(controllerName == undefined || controllerName == null || controllerName == "")
  {
    console.log("Error: Could not load controller for element, because name could not be resolved");
    console.log(that, controller);
  }
  else
  {
    currentControllers.push({
      'controllerName': controllerName,
      'controller': (controller || geodash.controllers.controller_base)
    });
    app.controller(controllerName, controller || geodash.controllers.GeoDashControllerBase);
  }
};

geodash.init_controllers = function(that, app, controllers)
{
  for(var i = 0; i < controllers.length; i++)
  {
    var c = controllers[i];
    $(c.selector, that).each(function(){
        try
        {
          geodash.init_controller($(this), app, c.controller);
        }
        catch(err)
        {
          console.log("Could not load GeoDash Controller \""+c.selector+"\"", err);
        }
    });
  }
};

geodash.vecmath = {};

geodash.vecmath.distance = function(a, b)
{
  var p = L.Projection.SphericalMercator;
  if(b.toString != undefined && b.toString().startsWith('LatLng'))
  {
    return (p.project(a)).distanceTo(p.project(b));
  }
  else
  {
    var minDistance = undefined;
    $.each(b._layers, function(id, layer)
    {
      var rings = [];
      if(layer.feature.geometry.type == "MultiPolygon")
      {
        for(var i = 0; i < layer._latlngs.length; i++)
        {
          for(var j = 0; j < layer._latlngs[i].length; j++)
          {
            rings.push(layer._latlngs[i][j]);
          }
        }
      }
      else
      {
        rings.push(layer._latlngs);
      }
      for(var r = 0; r < rings.length; r++)
      {
        var verticies = rings[r];
        var i = 0;
        if(minDistance == undefined)
        {
          minDistance = L.LineUtil.pointToSegmentDistance(
            p.project(a),
            p.project(verticies[i]),
            p.project(verticies[i+1]));
          i++;
        }
        for(; i < verticies.length -1; i++)
        {
          var d = L.LineUtil.pointToSegmentDistance(
            p.project(a),
            p.project(verticies[i]),
            p.project(verticies[i+1]));
          if(d < minDistance)
          {
            minDistance = d;
          }
        }
      }
    });
    return minDistance;
  }
};

geodash.vecmath.closestLocation = function(a, b)
{
  if(b.toString != undefined && b.toString().startsWith('LatLng'))
  {
    return b;
  }
  else
  {
    var p = L.Projection.SphericalMercator;
    var minDistance = undefined;
    var closestPoint = undefined;
    $.each(b._layers, function(id, layer)
    {
      var rings = [];
      if(layer.feature.geometry.type == "MultiPolygon")
      {
        for(var i = 0; i < layer._latlngs.length; i++)
        {
          for(var j = 0; j < layer._latlngs[i].length; j++)
          {
            rings.push(layer._latlngs[i][j]);
          }
        }
      }
      else
      {
        rings.push(layer._latlngs);
      }
      for(var r = 0; r < rings.length; r++)
      {
        var verticies = rings[r];
        var i = 0;
        if(minDistance == undefined)
        {
          minDistance = L.LineUtil.pointToSegmentDistance(
            p.project(a),
            p.project(verticies[i]),
            p.project(verticies[i+1]));
          closestPoint = L.LineUtil.closestPointOnSegment(
            p.project(a),
            p.project(verticies[i]),
            p.project(verticies[i+1]));
          i++;
        }
        for(; i < verticies.length -1; i++)
        {
          var d = L.LineUtil.pointToSegmentDistance(
            p.project(a),
            p.project(verticies[i]),
            p.project(verticies[i+1]));
          if(d < minDistance)
          {
            minDistance = d;
            closestPoint = L.LineUtil.closestPointOnSegment(
              p.project(a),
              p.project(verticies[i]),
              p.project(verticies[i+1]));
          }
        }
      }
    });
    return p.unproject(closestPoint);
  }
};

geodash.vecmath.getClosestFeatureAndLocation = function(nearbyFeatures, target)
{
  var closestFeature = undefined;
  var closestDistance = 0;
  var closestLocation = undefined;
  if(nearbyFeatures != undefined)
  {
    if(nearbyFeatures.length > 0)
    {
      closestFeature = nearbyFeatures[0];
      closestDistance = geodash.vecmath.distance(target, nearbyFeatures[0].geometry);
      closestLocation = geodash.vecmath.closestLocation(target, nearbyFeatures[0].geometry);
      for(var i = 1; i < nearbyFeatures.length ;i++)
      {
        var f = nearbyFeatures[i];
        if(geodash.vecmath.distance(target, f.geometry) < closestDistance)
        {
          closestFeature = f;
          closestDistance = geodash.vecmath.distance(target, f.geometry);
          closestLocation = geodash.vecmath.closestLocation(target, f.geometry);
        }
      }
    }
  }
  return {'feature': closestFeature, 'location': closestLocation};
};

/**
 * init_state will overwrite the default state from the server with params in the url.
 * @param {Object} state - Initial state from server
 */
geodash.init_state = function(state, stateschema)
{
  var newState = $.extend({}, state);

  // Update View
  var lat = getHashValueAsFloat(["latitude", "lat", "y"]) || state["lat"] || 0.0;
  var lon = getHashValueAsFloat(["longitude", "lon", "long", "lng", "x"]) || state["lon"] || 0.0;
  var z = getHashValueAsInteger(["zoom", "z"]) || state["z"] || 3;
  var delta = {'lat': lat, 'lon': lon, 'z': z};
  newState["view"] = newState["view"] != undefined ? $.extend(newState["view"], delta) : delta;

  // Update Filters
  if(newState["filters"] != undefined)
  {
    $.each(newState["filters"], function(layer_id, layer_filters){
      $.each(layer_filters, function(filter_id, filer_value){
        var type = stateschema["filters"][layer_id][filter_id].toLowerCase();
        var value = getHashValue(layer_id+":"+filter_id, type);
        if(value != undefined && value != "")
        {
          newState["filters"][layer_id][filter_id] = value;
        }
      });
    });
  }

  // Update Filters
  if(newState["styles"] != undefined)
  {
    /*
    $.each(newState["styles"], function(layer_id, layer_style){
      var type = stateschema["filters"][layer_id][filter_id].toLowerCase();
      var value = getHashValue("style:"+layer_id, type);
      if(value != undefined && value != "")
      {
        newState["filters"][layer_id][filter_id] = value;
      }
    });*/
  }

  return newState;
};

/**
 * Initializes a filter slider's label
 * @constructor
 * @param {Object} that - DOM element for slider
 * @param {string} type - Either ordinal or continuous
 * @param {Object} range - Either true, "min", or "max".
 * @param {Object} value - If range is true, then integer array, else integer.
 */
geodash.ui_init_slider_label = function($interpolate, that, type, range, value)
{
  if(type=="ordinal")
  {
    var ctx = {"value": value};
    that.data('label').html($interpolate(that.data('label-template'))(ctx));
  }
  else if(type=="continuous")
  {
    if(($.type(range) == "boolean" && range ) || (range.toLowerCase() == "true"))
    {
      var ctx = {"values": [value[0], value[1]]};
      that.data('label').html($interpolate(that.data('label-template'))(ctx));
    }
    else if(range=="min" || range=="max")
    {
      var ctx = {"value": value};
      that.data('label').html($interpolate(that.data('label-template'))(ctx));
    }
  }
};

/**
 * Initializes a filter slider's label
 * @constructor
 * @param {Object} $interplate - Angular $interpolate function
 * @param {Object} $scope - Angular $scope
 * @param {Object} that - DOM element for slider
 * @param {string} type - Either ordinal or continuous
 * @param {Object} range - Either true, "min", or "max".
 * @param {Object} value - If range is true, then integer array, else integer.
 */
geodash.ui_init_slider_slider = function($interpolate, $scope, that, type, range, value, minValue, maxValue, step)
{
  if(type=="ordinal")
  {
    that.slider({
      range: (($.type(range) == "boolean" && range ) || (range.toLowerCase() == "true")) ? true : range,
      value: value,
      min: 0,
      max: maxValue,
      step: 1,
      slide: function(event, ui) {
          geodash.ui_update_slider_label.apply(this, [$interpolate, event, ui]);
          var output = that.data('output');
          var newValue = that.data('options')[ui.value];
          var filter = {};
          filter[output] = newValue;
          geodash.api.intend("filterChanged", {"layer":"popatrisk", "filter":filter}, $scope);
      }
    });
  }
  else if(type=="continuous")
  {
    if(($.type(range) == "boolean" && range ) || (range.toLowerCase() == "true"))
    {
      that.slider({
        range: true,
        values: value,
        min: minValue,
        max: maxValue,
        step: step,
        slide: function(event, ui) {
            geodash.ui_update_slider_label.apply(this, [$interpolate, event, ui]);
            var output = that.data('output');
            var newValue = ui.values;
            var filter = {};
            filter[output] = newValue;
            geodash.api.intend("filterChanged", {"layer":"popatrisk", "filter":filter}, $scope);
        }
      });
    }
    else if(range=="min" || range=="max")
    {
      that.slider({
        range: range,
        value: value,
        min: minValue,
        max: maxValue,
        step: step,
        slide: function(event, ui) {
            geodash.ui_update_slider_label.apply(this, [$interpolate, event, ui]);
            var output = that.data('output');
            var newValue = ui.value / 100.0;
            var filter = {};
            filter[output] = newValue;
            geodash.api.intend("filterChanged", {"layer":"popatrisk", "filter":filter}, $scope);
        }
      });
    }
  }
};


/**
 * Updates a filter slider's label
 * @constructor
 * @param {Object} event - A jQuery UI event object
 * @param {Object} author - A jQuery UI ui object
 */
geodash.ui_update_slider_label = function($interpolate, event, ui)
{
  var that = $(this);
  var type = that.data('type');
  var range = that.data('range');

  if(type=="ordinal")
  {
    var ctx = {"value": that.data('options')[ui.value]};
    that.data('label').html($interpolate(that.data('label-template'))(ctx));
  }
  else if(type=="continuous")
  {
    if(($.type(range) == "boolean" && range ) || (range.toLowerCase() == "true"))
    {
      var ctx = {"values": [ui.values[0], ui.values[1]]};
      that.data('label').html($interpolate(that.data('label-template'))(ctx));
    }
    else if(range=="min" || range=="max")
    {
      var ctx = {"value": (ui.value / 100.0)};
      that.data('label').html($interpolate(that.data('label-template'))(ctx));
    }
  }
};

var getHashValue = function(keys, type)
{
    var value = undefined;
    if(typeof keys === 'string')
    {
      keys = [keys.toLowerCase()];
    }
    else
    {
      keys = $.map(keys,function(value, i){return value.toLowerCase();});
    }
    var hash_lc = location.hash.toLowerCase();
    for(var i = 0; i < keys.length; i++)
    {
      var key = keys[i];
      var keyAndHash = hash_lc.match(new RegExp(key + '=([^&]*)'));
      if(keyAndHash)
      {
          value = keyAndHash[1];
          if(value != undefined && value != null && value != "")
          {
            break;
          }
      }
    }

    if(type != undefined)
    {
        if(type == "integer")
        {
          value = (value != undefined && value != null && value != "") ? parseInt(value, 10) : undefined;
        }
        else if(type == "stringarray")
        {
          if(value != undefined)
          {
            var newValue = value.split(",");
            value = newValue;
          }
        }
        else if(type == "integerarray")
        {
          if(value != undefined)
          {
            var sValue = value.split(",");
            var newValue = [];
            for(var i = 0; i < sValue.length; i++)
            {
              var v = sValue[i];
              newValue.push((v != undefined && v != null && v != "") ? parseInt(v, 10) : undefined);
            }
            value = newValue;
          }
        }
        else if(type == "float")
        {
          value = (value != undefined && value != null && value != "") ? parseFloat(value) : undefined;
        }
        else if(type == "floatarray")
        {
          if(value !=undefined)
          {
            var sValue = value.split(",");
            var newValue = [];
            for(var i = 0; i < sValue.length; i++)
            {
              var v = sValue[i];
              newValue.push((v != undefined && v != null && v != "") ? parseFloat(v) : undefined);
            }
            value = newValue;
          }
        }
    }
    return value;
};
var hasHashValue = function(keys)
{
    var value = getHashValue(keys);
    return value != undefined && value != null && value != "";
};
var getHashValueAsStringArray = function(keys)
{
  return getHashValue(keys, "stringarray");
};
var getHashValueAsInteger = function(keys)
{
  return getHashValue(keys, "integer");
};
var getHashValueAsIntegerArray = function(keys)
{
  return getHashValue(keys, "integerarray");
};
var getHashValueAsFloat = function(keys)
{
  return getHashValue(keys, "float");
};
var sortLayers = function(layers, reverse)
{
  var renderLayers = $.isArray(layers) ? layers : $.map(layers, function(layer){return layer;});
  renderLayers = renderLayers.sort(function(a, b){
      return a.options.renderOrder - b.options.renderOrder;
  });
  if(reverse === true)
    renderLayers.reverse();
  return renderLayers;
};
var updateRenderOrder = function(layers)
{
    for(var i = 0; i < layers.length; i++)
    {
        layers[i].bringToFront();
    }
};
var layersAsArray = function(layers)
{
  return $.map(layers, function(layer, id){return {'id':id, 'layer':layer};});
};
var expand = function(x)
{
  var newArray = [];
  if(Array.isArray(x))
  {
    for(var i = 0; i < x.length; i++)
    {
      var value = x[i];
      if(angular.isString(value))
      {
        if(value.indexOf(".") != -1)
        {
          newArray = newArray.concat(value.split("."));
        }
        else
        {
          newArray.push(value);
        }
      }
      else
      {
        newArray.push(value);
      }
    }
  }
  else if(angular.isString(x))
  {
    newArray = x.split(".");
  }
  return newArray;
};
var extract = function(keyChain, node, fallback)
{
  if(angular.isString(keyChain))
  {
    keyChain = keyChain.split(".");
  }
  var obj = undefined;
  if(keyChain.length==0)
  {
    if(node != undefined && node != null)
    {
      obj = node;
    }
    else
    {
      obj = fallback;
    }
  }
  else
  {
    var newKeyChain = keyChain.slice(1);
    if(newKeyChain.length == 0)
    {
      if(angular.isString(keyChain[0]) && keyChain[0].toLowerCase() == "length")
      {
        if(Array.isArray(node))
        {
          obj = node.length;
        }
        else if(angular.isDefined(node))
        {
          obj = node["length"];
        }
        else
        {
          obj = 0;
        }
      }
    }

    if(obj == undefined && angular.isDefined(node))
    {
      if(Array.isArray(node))
      {
        var index = angular.isString(keyChain[0]) ?
          parseInt(keyChain[0], 10) :
          keyChain[0];
        obj = extract(newKeyChain, node[index], fallback);
      }
      else
      {
        obj = extract(newKeyChain, node[""+keyChain[0]], fallback);
      }
    }
	}
	return obj;
};

geodash.codec = {};

geodash.codec.formatArray = function(path, obj, fallback)
{
  var result = fallback || '';
  var x = extract(path, obj);
  if(Array.isArray(x))
  {
    result = x.join(",");
  }
  else if(angular.isString(x))
  {
    result = x;
  }
  return result;
};

geodash.codec.parseFeatures = function(response, fields_by_featuretype)
{
  var features = [];
  //$(response).find("FeatureCollection")  No need to search for featurecollection.  It IS the featurecollection
  $(response).find('gml\\:featuremember').each(function(){
      //var f = $(this).find(typeName.indexOf(":") != -1 ? typeName.substring(typeName.indexOf(":") + 1) : typeName);
      var f = $(this).children();
      var typeName = f.prop("tagName").toLowerCase();
      var attributes = geodash.codec.parseAttributes(f, fields_by_featuretype[typeName]);
      var geom = geodash.codec.parseGeometry(f);
      var newFeature = {
        'featuretype': typeName,
        'attributes': attributes,
        'geometry': geom
      };
      features.push(newFeature);
  });
  return features;
};
geodash.codec.parseAttributes  = function(element, fields)
{
  var attributes = {};
  if(fields != undefined)
  {
    for(var k = 0; k < fields.length; k++)
    {
      var field = fields[k];
      var attributeName = field['output'] || field['attribute'];
      attributes[attributeName] = undefined;
      var inputName = field['attribute'] || field['input'];
      var inputNames = inputName != undefined ? [inputName] : field['inputs'];
      if(inputNames!= undefined)
      {
        for(var l = 0; l < inputNames.length; l++)
        {
          var inputName = inputNames[l];
          if(element.find("geonode\\:"+inputName).length > 0)
          {
            attributes[attributeName] = element.find("geonode\\:"+inputName).text();
            break;
          }
        }
      }
    }
  }
  return attributes;
};
geodash.codec.parseGeometry = function(element)
{
  var geom = undefined;

  var attribute = element.find("geonode\\:shape");
  if(attribute.length == 0){ attribute = element.find("geonode\\:the_geom"); }

  if(attribute.find("gml\\:point").length > 0)
  {
    var coords = attribute.find("gml\\:point").find("gml\\:coordinates").text().split(",");
    geom = new L.LatLng(parseFloat(coords[1]), parseFloat(coords[0]));
  }
  else if(attribute.find("gml\\:multilinestring").length > 0)
  {
    var coords = attribute.find("gml\\:multilinestring")
      .find("gml\\:linestringmember")
      .find("gml\\:linestring")
      .find("gml\\:coordinates")
      .text().split(" ");
    coords = $.map(coords, function(x, i){
      var a = x.split(",");
      return [[parseFloat(a[0]), parseFloat(a[1])]];
    });
    var geojson = [{"type": "LineString","coordinates": coords}];
    geom = new L.GeoJSON(geojson, {});
  }
  else if(attribute.find("gml\\:multipolygon").length > 0)
  {
    var coords = attribute.find("gml\\:multipolygon")
      .find("gml\\:polygonmember")
      .find("gml\\:polygon")
      .find("gml\\:outerboundaryis")
      .find("gml\\:linearring")
      .find("gml\\:coordinates")
      .text().split(" ");
    coords = $.map(coords, function(x, i){
      var a = x.split(",");
      return [[parseFloat(a[0]), parseFloat(a[1])]];
    });
    var ring = [coords];
    var multipolygon = [ring];
    var geojson = [{
      "type": "MultiPolygon",
      "coordinates": multipolygon
    }];
    geom = new L.GeoJSON(geojson, {});
  }
  return geom;
};

geodash.popup = {};

geodash.popup.buildChart = function(chart, layer, feature, state)
{
  var html = "";
  html += "<div style=\"text-align:center;\"><b>"+chart.label+"</b></div><br>";
  html += "<div id=\""+chart.id+"\" class=\"geodash-popup-chart\"></div>";
  return html;
}

geodash.popup.buildField = function(field, layer, feature, state)
{
  var output = field["output"] || field["attribute"];
  var html = undefined;
  var bInclude = false;
  if(field.when != undefined)
  {
    if(field.when.toLowerCase() == "defined")
    {
      if(feature.attributes[output] != undefined)
      {
        bInclude = true;
      }
    }
    else
    {
      bInclude = true;
    }
  }
  else
  {
    bInclude = true;
  }

  if(bInclude)
  {
    if(field.type == "link")
    {
      var value = field.value != undefined ? field.value : "{{ feature.attributes." + output + " }}";
      html = "<span><b>"+ field.label +":</b> <a target=\"_blank\" href=\""+field.url+"\">";
      html += value;
      html += "</a></span>";
    }
    else
    {
      var value = undefined;
      if(field.value != undefined)
      {
        value = field.value;
      }
      else
      {
        if(field.type == "date")
        {
          var format = field.format || "medium";
          value = "feature.attributes." + output + " | date:'"+format+"'"
        }
        else
        {
          value = "feature.attributes." + output
        }
        if(field.fallback)
        {
          value = "("+value+") || '"+field.fallback+"'"
        }
        value = "{{ "+value +" }}";
      }
      html = "<span><b>"+ field.label +":</b> "+value+"</span>";
    }
  }
  return html;
};

geodash.popup.buildPopupTemplate = function(popup, layer, feature, state)
{
  var panes = popup.panes;
  var popupTemplate = "";
  //////////////////
  if(angular.isString(popup.title))
  {
    popupTemplate += "<h5 style=\"word-wrap:break-word;text-align:center;\">"+popup.title+"</h5>";
  }
  //////////////////
  var paneContents = [];
  if(Array.isArray(panes))
  {
    for(var i = 0; i < panes.length; i++)
    {
      var pane = panes[i];
      var popupFields = [];
      var popupCharts = [];
      if("fields" in pane)
      {
        for(var j = 0; j < pane.fields.length; j++)
        {
          var popupField = geodash.popup.buildField(pane.fields[j], layer, feature, state);
          if(popupField != undefined)
          {
            popupFields.push(popupField);
          }
        }
      }
      if("charts" in pane)
      {
        for(var j = 0; j < pane.charts.length; j++)
        {
          var popupChart = geodash.popup.buildChart(pane.charts[j], layer, feature, state);
          if(popupChart != undefined)
          {
            popupCharts.push(popupChart);
          }
        }
      }
      var paneContent = popupFields.join("<br>");
      if(popupCharts.length > 0)
      {
        paneContent += "<hr>" + popupCharts.join("<br>");
      }
      paneContents.push(paneContent);
    }
    //////////////////
    if(panes.length > 1)
    {
      var tabs = [];
      var pane = panes[0];
      var html_tab ="<li class=\"active\"><a data-toggle=\"tab\" href=\"#"+pane.id+"\">"+pane.tab.label+"</a></li>";
      tabs.push(html_tab);
      for(var i = 1; i < panes.length; i++)
      {
        pane = panes[i];
        html_tab = "<li><a data-toggle=\"tab\" href=\"#"+pane.id+"\">"+pane.tab.label+"</a></li>"
        tabs.push(html_tab);
      }
      var html_tabs = "<ul class=\"nav nav-tabs nav-justified\">"+tabs.join("")+"</ul>";
      ///////////////
      var paneContentsWithWrapper = [];
      var html_pane = "<div id=\""+panes[0].id+"\" class=\"tab-pane fade in active\">"+paneContents[0]+"</div>";
      paneContentsWithWrapper.push(html_pane);
      for(var i = 1; i < panes.length; i++)
      {
        html_pane = "<div id=\""+panes[i].id+"\" class=\"tab-pane fade\">"+paneContents[i]+"</div>";
        paneContentsWithWrapper.push(html_pane);
      }
      ///////////////
      popupTemplate += html_tabs + "<div class=\"tab-content\">"+paneContentsWithWrapper.join("")+"</div>";
    }
    else
    {
      popupTemplate += paneContents[0];
    }
  }
  return popupTemplate;
};

geodash.popup.buildPopupContent = function($interpolate, featureLayer, feature, state)
{
  var popupTemplate = geodash.popup.buildPopupTemplate(featureLayer.popup, featureLayer, feature, state);
  var ctx = {
    'layer': featureLayer,
    'feature': feature,
    'state': state
  };
  return $interpolate(popupTemplate)(ctx);
};

geodash.popup.openPopup = function($interpolate, featureLayer, feature, location, map, state)
{
  var popupContent = geodash.popup.buildPopupContent($interpolate, featureLayer, feature, state);
  var popup = new L.Popup({maxWidth: (featureLayer.popup.maxWidth || 400)}, undefined);
  popup.setLatLng(new L.LatLng(location.lat, location.lon));
  popup.setContent(popupContent);
  map.openPopup(popup);
};

geodash.tilemath = {
  "D2R": Math.PI / 180,
  "R2D": 180 / Math.PI
};

geodash.tilemath.point_to_bbox = function(x, y, z, digits)
{
  var radius = geodash.tilemath.point_to_radius(z);
  var e = x + radius; if(digits != undefined && digits >= 0){e = e.toFixed(digits);}
  var w = x - radius; if(digits != undefined && digits >= 0){w = w.toFixed(digits);}
  var s = y - radius; if(digits != undefined && digits >= 0){s = s.toFixed(digits);}
  var n = y + radius; if(digits != undefined && digits >= 0){n = n.toFixed(digits);}
  return [w, s, e, n];
};

geodash.tilemath.point_to_radius = function(z)
{
  return (geodash.config.click_radius || 4.0) / z;
};

geodash.tilemath.tms_to_bbox = function(x, y, z)
{
  var e = geodash.tilemath.tile_to_lon(x+1, z);
  var w = geodash.tilemath.tile_to_lon(x, z);
  var s = geodash.tilemath.tile_to_lat(y+1, z);
  var n = geodash.tilemath.tile_to_lat(y, z);
  return [w, s, e, n];
};


geodash.tilemath.tile_to_lon = function(x, z)
{
  return x / Math.pow(2, z) * 360-180;
};


geodash.tilemath.tile_to_lat = function(y, z)
{
  n = Math.pi - 2 * Math.PI * y / Math.pow(2,z);
  return ( R2D * Math.atan(0.5 * ( Math.exp(n) - Math.exp(-n))));
};

geodash.http = {};

geodash.http.build_promises = function($http, urls)
{
  var promises = [];
  for(var i = 0; i < urls.length; i++)
  {
    var url = urls[i];
    var config = {};
    var promise = $http.get(url, config);
    promises.push(promise);
  }
  return promises;
};
geodash.http.build_features = function(responses, fields_by_featuretype)
{
  var features = [];
  for(var i = 0; i < responses.length; i++)
  {
    var response = responses[i];
    if(response.status == 200)
    {
      var data = response.data;
      features = features.concat(geodash.codec.parseFeatures(data, fields_by_featuretype));
    }
  }
  return features;
};

geodash.layers = {};

geodash.layers.aggregate_fields = function(featureLayer)
{
  var fields = [];
  var panes = extract("popup.panes", featureLayer, undefined);
  if(panes != undefined)
  {
    for(var i = 0; i < panes.length; i++)
    {
      fields = fields.concat(panes[i].fields);
    }
  }
  return fields;
};
geodash.layers.init_baselayers = function(map, baselayers)
{
  var layers = {};
  for(var i = 0; i < baselayers.length; i++)
  {
      var bl = baselayers[i];
      var type = extract("source.type", bl, 'tile');
      var attribution = extract("source.attribution", bl, undefined);
      var url = undefined;
      if(type.toLowerCase() == "mapbox")
      {
        var mb_layers = extract("source.mapbox.layers", bl, undefined);
        var mb_access_token = extract("source.mapbox.access_token", bl, undefined);
        if(mb_layers == undefined || mb_access_token == undefined)
        {
          console.log("MapBox Layers missing config.", bl);
        }
        else
        {
          url = "http://{s}.tiles.mapbox.com/v4/"+mb_layers+"/{z}/{x}/{y}.png?access_token="+mb_access_token;
        }
      }
      else if(type.toLowerCase() == "gwc")
      {
        var gwc_url = extract("source.gwc.url", bl, undefined);
        var gwc_layers = extract("source.gwc.layers", bl, undefined);
        if(gwc_url == undefined || gwc_layers == undefined)
        {
          console.log("GWC Layers missing config.", bl);
        }
        else
        {
          url = gwc_url+(gwc_url.endsWith("/")?'':'/')+"service/tms/1.0.0/"+gwc_layers+"@EPSG:900913@png/{z}/{x}/{y}.png";
        }
      }
      else if(type.toLowerCase() in ["tile", "tiles"])
      {
        url = extract("source.tile.url", bl, undefined);
      }
      url = url || extract("source.url", bl, undefined);
      try{
        layers[bl.id] = L.tileLayer(url, {
            id: bl.id,
            attribution: attribution
        });
      }catch(err){console.log("Could not add baselayer "+i);}
  }
  return layers;
};
geodash.layers.init_featurelayer_post = function($scope, live, id, fl, visible)
{
  if(fl != undefined)
  {
    if(visible != undefined ? visible : true)
    {
      fl.addTo(live["map"]);
    }
    geodash.api.intend("layerLoaded", {'type':'featurelayer', 'layer': id, 'visible': visible}, $scope);
  }
  else
  {
    console.log("Could not add featurelayer "+id+" because it is undefined.");
  }
};
geodash.layers.init_featurelayer_wms = function($scope, live, map_config, id, layerConfig)
{
  var w = layerConfig.wms;
  if(extract("auth", layerConfig, "") == "basic")
  {
    var auth_url = w.url + (w.url.indexOf("?") != -1 ? '&' : '?') + "SERVICE=WMS&REQUEST=GetCapabilities"
    $.ajax({
      url: auth_url,
      type: "GET",
      dataType: "jsonp",
      jsonp: "callback",
      beforeSend: function(xhr){
        xhr.setRequestHeader("Authorization", "Basic "+btoa("null:null"));
        console.log(xhr);
      },
      error: function(){},
      success: function(){},
      complete: function(response){
        var options = {
          renderOrder: $.inArray(id, map_config.renderlayers),
          buffer: w.buffer || 0,
          version: w.version || "1.1.1",
          layers: geodash.codec.formatArray('layers', w, ''),
          styles: geodash.codec.formatArray('styles', w, ''),
          format: w.format || 'image/png',
          transparent: extract('transparent', w, true),
          attribution: extract("source.attribution", layerConfig, undefined)
        };
        var cql_filter = extract('cql_filter', w, undefined);
        if(angular.isDefined(cql_filter))
        {
          options["CQL_FILTER"] = cql_filter;
        }
        var fl = L.tileLayer.wms(w.url,options);
        live["featurelayers"][id] = fl;
        geodash.layers.init_featurelayer_post($scope, live, id, fl, layerConfig.visible);
      }
    });
  }
  else
  {
    var options = {
      renderOrder: $.inArray(id, map_config.renderlayers),
      buffer: w.buffer || 0,
      version: w.version || "1.1.1",
      layers: geodash.codec.formatArray('layers', w, ''),
      styles: geodash.codec.formatArray('styles', w, ''),
      format: w.format || 'image/png',
      transparent: angular.isDefined(w.transparent) ? w.transparent : true,
      attribution: extract("source.attribution", layerConfig, undefined)
    };
    var cql_filter = extract('cql_filter', w, undefined);
    if(angular.isDefined(cql_filter))
    {
      options["CQL_FILTER"] = cql_filter;
    }
    var fl = L.tileLayer.wms(w.url, options);
    live["featurelayers"][id] = fl;
    geodash.layers.init_featurelayer_post($scope, live, id, fl, layerConfig.visible);
  }
};
geodash.layers.init_featurelayer_wmts = function($scope, live, map_config, id, layerConfig)
{
  var w = layerConfig.wmts;
  if(extract("auth", layerConfig, "") == "basic")
  {
    var auth_url = w.url + (w.url.indexOf("?") != -1 ? '&' : '?') + "SERVICE=WMS&REQUEST=GetCapabilities"
    $.ajax({
      url: auth_url,
      type: "GET",
      dataType: "jsonp",
      jsonp: "callback",
      beforeSend: function(xhr){
        xhr.setRequestHeader("Authorization", "Basic "+btoa("null:null"));
      },
      error: function(){},
      success: function(){},
      complete: function(response){
        var fl = L.tileLayer.wmts(w.url, {
          renderOrder: $.inArray(id, map_config.renderlayers),
          version: w.version || "1.0.0",
          layers: geodash.codec.formatArray('layers', w, ''),
          styles: geodash.codec.formatArray('styles', w, ''),
          format: w.format || 'image/png',
          transparent: angular.isDefined(w.transparent) ? w.transparent : true,
          attribution: extract("source.attribution", layerConfig, undefined),
          tilematrixSet: "EPSG:3857",
          minZoom: extract("view.minZoom", layerConfig, 0),
          maxZoom: extract("view.maxZoom", layerConfig, 18),
          maxNativeZoom: extract("source.maxZoom", layerConfig, null)
        });
        live["featurelayers"][id] = fl;
        geodash.layers.init_featurelayer_post($scope, live, id, fl, layerConfig.visible);
      }
    });
  }
  else
  {
    var fl = L.tileLayer.wmts(w.url, {
      renderOrder: $.inArray(id, map_config.renderlayers),
      version: w.version || "1.0.0",
      layers: geodash.codec.formatArray('layers', w, ''),
      styles: geodash.codec.formatArray('styles', w, ''),
      format: w.format || 'image/png',
      transparent: angular.isDefined(w.transparent) ? w.transparent : true,
      attribution: extract("source.attribution", layerConfig, undefined),
      tilematrixSet: "EPSG:3857",
      minZoom: extract("view.minZoom", layerConfig, 0),
      maxZoom: extract("view.maxZoom", layerConfig, 18),
      maxNativeZoom: extract("source.maxZoom", layerConfig, null)
    });
    live["featurelayers"][id] = fl;
    geodash.layers.init_featurelayer_post($scope, live, id, fl, layerConfig.visible);
  }
};
geodash.layers.init_featurelayer_geojson = function($scope, live, map_config, id, layerConfig)
{
  var url = extract("geojson.url", layerConfig) || extract("source.url", layerConfig) || extract("url", layerConfig);
  $.ajax({
    url: url,
    dataType: "json",
    success: function(response){
      var fl = undefined;
      if(layerConfig.transform == "heatmap")
      {
        var heatLayerData = [];
        var maxIntensity = 0;
        for(var i = 0; i < response[0]["features"].length; i++)
        {
          var intensity = ("attribute" in layerConfig["heatmap"] && layerConfig["heatmap"]["attribute"] != "") ? response[0]["features"][i]["properties"][layerConfig["heatmap"]["attribute"]] : 1.0;
          heatLayerData.push([
            response[0]["features"][i]["geometry"]["coordinates"][1],
            response[0]["features"][i]["geometry"]["coordinates"][0],
            intensity
          ]);
          if(intensity > maxIntensity)
          {
            maxIntensity = intensity;
          }
        }
        for(var i = 0; i < heatLayerData.length; i++)
        {
          heatLayerData[i][2] = heatLayerData[i][2] / maxIntensity;
        }

        var canvas = L.heatCanvas();
        fl = L.heatLayer(heatLayerData, {
          "renderer": canvas,
          "attribution": layerConfig["source"]["attribution"],
          "radius": (layerConfig["heatmap"]["radius"] || 25),
          "blur": (layerConfig["heatmap"]["blur"] || 15),
          "max": (layerConfig["heatmap"]["max"] || 1.0),
          "minOpacity": (layerConfig["heatmap"]["minOpacity"] || 0.5)
        });
      }
      else
      {
        fl = L.geoJson(response, {
          attribution: layerConfig.source.attribution
        });
      }
      live["featurelayers"][id] = fl;
      geodash.layers.init_featurelayer_post($scope, live, id, fl, layerConfig.visible);
    }
  });
};
geodash.layers.init_featurelayer = function(id, layerConfig, $scope, live, map_config)
{
  if(layerConfig.enabled == undefined || layerConfig.enabled == true)
  {
    var t = extract("type", layerConfig, "").toLowerCase();
    if(t == "geojson")
    {
      geodash.layers.init_featurelayer_geojson($scope, live, map_config, id, layerConfig);
    }
    else if(t == "wms")
    {
      geodash.layers.init_featurelayer_wms($scope, live, map_config, id, layerConfig);
    }
    else if(t == "wmts")
    {
      geodash.layers.init_featurelayer_wmts($scope, live, map_config, id, layerConfig);
    }
  }
};
geodash.layers.init_featurelayers = function(featureLayers, $scope, live, map_config)
{
  $.each(featureLayers, function(i, layerConfig){
    geodash.layers.init_featurelayer(layerConfig.id, layerConfig, $scope, live, map_config);
  });
};

var geodashserver = {};

geodashserver.welcome = function()
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

geodash.config = {
  'click_radius': 2.0
};

geodash.init_dashboard = function(appName, mainElement)
{
  geodash.app = app = angular.module(appName, ['ngRoute', 'ngSanitize', 'ngCookies']);

  geodash.init.templates(app);
  geodash.init.filters(app);
  geodash.init.directives(app);

  app.factory('state', function(){return $.extend({}, geodash.initial_state);});
  app.factory('stateschema', function(){return $.extend({}, geodash.state_schema);});
  app.factory('map_config', function(){return $.extend({}, geodash.map_config);});
  app.factory('live', function(){
    return {
      "map": undefined,
      "baselayers": {},
      "featurelayers": {}
    };
  });
  
  // Initialize UI interaction for intents.
  // Listen's for events bubbling up to body element, so can initialize before children.
  geodash.init.listeners();

  /*
  init_geodashserver_controller_main will kick off a recursive search for controllers
  to add to the angular app/module.  However, the initialization code in
  app.controller(...function(){XXXXX}) won't actually execute until
  angular.bootstrap is called.  Therefore, each controller should Initialize
  in a breadth-first sequential order.

  If you miss a component with ng-controller, bootstrap will attempt
  to load it on its own within angular.bootstrap.  That'll error out
  and is not good.  So you NEED!!! to get to it first!!!!!!
  */

  geodash.init_controller_base(app);

  init_geodashserver_controller_main(mainElement, app);

  angular.bootstrap(document, [appName]);
};

geodash.meta = {};
geodash.meta.projects = [{"name":"geodash","version":"0.0.1","description":"geodash 0.0.1"},{"name":"geodashserver","version":"0.0.1","description":"GeoDash Server 1.x"}];
geodash.meta.plugins = [{"controllers":["GeoDashControllerBase.js","GeoDashControllerModal.js"],"directives":["svg.js","onLinkDone.js","onRepeatDone.js","geodashBtnClose.js","geodashBtnInfo.js","geodashBtn.js","geodashLabel.js","geodashTab.js","geodashTabs.js"],"enumerations":["dates.js"],"templates":["geodash_tab.tpl.html","geodash_tabs.tpl.html","geodash_btn_close.tpl.html","geodash_btn_info.tpl.html","geodash_btn.tpl.html","geodash_label.tpl.html"],"filters":["default.js","md2html.js","percent.js","tabLabel.js","as_float.js","add.js","title.js","as_array.js","sortItemsByArray.js","breakpoint.js","breakpoints.js","position_x.js","width_x.js","length.js","layer_is_visible.js","common/append.js","common/default_if_undefined.js","common/default_if_undefined_or_blank.js","common/extract.js","common/extractTest.js","common/inArray.js","common/not.js","common/prepend.js","common/parseTrue.js","common/ternary.js","common/ternary_defined.js","common/yaml.js","array/join.js","array/first.js","array/last.js","array/choose.js","format/formatBreakPoint.js","format/formatFloat.js","format/formatInteger.js","format/formatArray.js","format/formatMonth.js","math/eq.js","math/lte.js","math/gte.js","math/gt.js","string/replace.js","string/split.js","url/url_shapefile.js","url/url_geojson.js","url/url_kml.js","url/url_describefeaturetype.js"],"handlers":["clickedOnMap.js","hideLayer.js","hideLayers.js","layerLoaded.js","requestToggleComponent.js","showLayer.js","showLayers.js","switchBaseLayer.js","toggleComponent.js","zoomToLayer.js"],"schemas":["base.yml","baselayers.yml","featurelayers.yml","controls.yml","view.yml","pages.yml"],"modals":[],"project":"geodash","id":"base"},{"controllers":["controller_legend.js"],"directives":["geodashModalLayerCarto.js","geodashModalLayerMore.js","geodashModalLayerConfig.js","geodashSymbolCircle.js","geodashSymbolEllipse.js","geodashSymbolGraduated.js","geodashSymbolGraphic.js","geodashLegendBaselayers.js","geodashLegendFeaturelayers.js"],"templates":["modal/geodash_modal_layer_carto.tpl.html","modal/geodash_modal_layer_more.tpl.html","modal/geodash_modal_layer_config.tpl.html","symbol/symbol_circle.tpl.html","symbol/symbol_ellipse.tpl.html","symbol/symbol_graduated.tpl.html","symbol/symbol_graphic.tpl.html","legend_baselayers.tpl.html","legend_featurelayers.tpl.html"],"less":["legend.less"],"schemas":["legend_schema.yml"],"project":"geodash","id":"legend"},{"controllers":[],"directives":["geodashModalWelcome.js"],"templates":["modal/geodash_modal_welcome.tpl.html"],"project":"geodash","id":"welcome"},{"controllers":[],"directives":["geodashModalAbout.js"],"templates":["geodash_modal_about.tpl.html"],"project":"geodash","id":"about"},{"controllers":[],"directives":["geodashModalDownload.js"],"templates":["geodash_modal_download.tpl.html"],"project":"geodash","id":"download"},{"controllers":[],"directives":["geodashMapOverlays.js"],"templates":["map_overlays.tpl.html"],"less":["map_overlays.less"],"schemas":["map_overlays_schema.yml"],"project":"geodash","id":"overlays"},{"controllers":[],"directives":["geodashSidebarToggleLeft.js"],"templates":["geodash_sidebar_toggle_left.tpl.html"],"project":"geodash","id":"sidebar_toggle_left"},{"controllers":[],"directives":["geodashSidebarToggleRight.js"],"templates":["geodash_sidebar_toggle_right.tpl.html"],"project":"geodash","id":"sidebar_toggle_right"},{"controllers":[{"name":"controller_map_map","path":"controller_map_map.js","handlers":[{"event":"toggleComponent","handler":"toggleComponent"}]}],"directives":[],"templates":[],"less":["main_map.less"],"project":"geodashserver","id":"map_map"},{"controllers":["GeoDashServerControllerModalWelcome.js"],"directives":["geodashserverModalWelcome.js"],"templates":["modal_welcome_geodashserver.tpl.html"],"less":["geodashserver_welcome.less"],"modals":[{"name":"geodashserver_welcome","ui":{"mainClass":"","tabs":[{"target":"modal-geodashserver-welcome-intro","label":"Introduction"},{"target":"modal-geodashserver-welcome-about","label":"About"}]}}],"project":"geodashserver","id":"geodashserver_welcome"},{"controllers":["controller_sidebar_geodashserver.js","controller_modal_edit_field.js","controller_modal_edit_object.js","GeoDashControllerModalDashboardSecurity.js","GeoDashControllerModalDashboardConfig.js"],"directives":["geodashDashboardEditor.js","geodashModalEditField.js","geodashModalEditObject.js","geodashModalDashboardConfig.js","geodashModalDashboardSecurity.js"],"templates":["dashboard_editor.tpl.html","modal_edit_field.tpl.html","modal_edit_object.tpl.html","geodash_modal_dashboard_config.tpl.html","geodash_modal_dashboard_security.tpl.html"],"less":["sidebar.less","sidebar-toggle.less"],"modals":[{"name":"dashboard_config","ui":{"mainClass":"","tabs":[{"target":"modal-dashboard-config-projects","label":"Projects"},{"target":"modal-dashboard-config-plugins","label":"Plugins"},{"target":"modal-dashboard-config-directives","label":"Directives"},{"target":"modal-dashboard-config-templates","label":"Templates"},{"target":"modal-dashboard-config-filters","label":"Filters"},{"target":"modal-dashboard-config-yaml","label":"YAML"},{"target":"modal-dashboard-config-json","label":"JSON"}]}},{"name":"dashboard_security","ui":{"mainClass":"","tabs":[{"target":"modal-dashboard-security-pane-yaml","label":"YAML"},{"target":"modal-dashboard-security-pane-json","label":"JSON"}]}},{"name":"edit_field","ui":{"mainClass":"","tabs":[{"target":"modal-edit-field-pane-input","label":"Input"},{"target":"modal-edit-field-pane-yaml","label":"YAML"},{"target":"modal-edit-field-pane-json","label":"JSON"}]},"config":{"that":{"id":"geodash-modal-edit-field"},"workspace":{"workspace":"modaleditfield_workspace","workspace_flat":"modaleditfield_workspace_flat"},"schema":{"schema":"modaleditfield_schema","schema_flat":"modaleditfield_schema_flat"},"edit":{"target":"geodash-modal-edit-object"},"save":{"target":"geodash-sidebar-right","fields":{"workspace":"modaleditfield_workspace","workspace_flat":"modaleditfield_workspace_flat"}}}},{"name":"edit_object","ui":{"mainClass":"","tabs":[{"target":"modal-edit-object-pane-input","label":"Input"},{"target":"modal-edit-object-pane-yaml","label":"YAML"},{"target":"modal-edit-object-pane-json","label":"JSON"}]},"config":{"that":{"id":"geodash-modal-edit-object"},"workspace":{"workspace":"modaleditobject_workspace","workspace_flat":"modaleditobject_workspace_flat"},"schema":{"schema":"modaleditobject_schema","schema_flat":"modaleditobject_schema_flat"},"back":{"target":"geodash-modal-edit-field"},"save":{"target":"geodash-modal-edit-field","fields":{"modaleditfield_workspace":"modaleditobject_workspace","modaleditfield_workspace_flat":"modaleditobject_workspace_flat"}}}}],"project":"geodashserver","id":"geodashserver_sidebar"},{"controllers":[{"name":"controller_main","path":"controller_main.js","handlers":[{"event":"clickedOnMap","handler":"clickedOnMap"},{"event":"filterChanged","handler":"filterChanged"},{"event":"hideLayer","handler":"hideLayer"},{"event":"hideLayers","handler":"hideLayers"},{"event":"layerLoaded","handler":"layerLoaded"},{"event":"requestToggleComponent","handler":"requestToggleComponent"},{"event":"selectStyle","handler":"selectStyle"},{"event":"showLayer","handler":"showLayer"},{"event":"showLayers","handler":"showLayers"},{"event":"stateChanged","handler":"stateChanged"},{"event":"switchBaseLayer","handler":"switchBaseLayer"},{"event":"viewChanged","handler":"viewChanged"},{"event":"zoomToLayer","handler":"zoomToLayer"}]}],"directives":[],"templates":[],"handlers":["filterChanged.js","selectStyle.js","stateChanged.js","viewChanged.js"],"project":"geodashserver","id":"main"}];
geodash.meta.controllers = [{"name":"controller_map_map","handlers":[{"event":"toggleComponent","handler":"toggleComponent"}]},{"name":"controller_main","handlers":[{"event":"clickedOnMap","handler":"clickedOnMap"},{"event":"filterChanged","handler":"filterChanged"},{"event":"hideLayer","handler":"hideLayer"},{"event":"hideLayers","handler":"hideLayers"},{"event":"layerLoaded","handler":"layerLoaded"},{"event":"requestToggleComponent","handler":"requestToggleComponent"},{"event":"selectStyle","handler":"selectStyle"},{"event":"showLayer","handler":"showLayer"},{"event":"showLayers","handler":"showLayers"},{"event":"stateChanged","handler":"stateChanged"},{"event":"switchBaseLayer","handler":"switchBaseLayer"},{"event":"viewChanged","handler":"viewChanged"},{"event":"zoomToLayer","handler":"zoomToLayer"}]}];
geodash.meta.modals = [{"name":"geodashserver_welcome","ui":{"mainClass":"","tabs":[{"target":"modal-geodashserver-welcome-intro","label":"Introduction"},{"target":"modal-geodashserver-welcome-about","label":"About"}]}},{"name":"dashboard_config","ui":{"mainClass":"","tabs":[{"target":"modal-dashboard-config-projects","label":"Projects"},{"target":"modal-dashboard-config-plugins","label":"Plugins"},{"target":"modal-dashboard-config-directives","label":"Directives"},{"target":"modal-dashboard-config-templates","label":"Templates"},{"target":"modal-dashboard-config-filters","label":"Filters"},{"target":"modal-dashboard-config-yaml","label":"YAML"},{"target":"modal-dashboard-config-json","label":"JSON"}]}},{"name":"dashboard_security","ui":{"mainClass":"","tabs":[{"target":"modal-dashboard-security-pane-yaml","label":"YAML"},{"target":"modal-dashboard-security-pane-json","label":"JSON"}]}},{"name":"edit_field","config":{"that":{"id":"geodash-modal-edit-field"},"workspace":{"workspace":"modaleditfield_workspace","workspace_flat":"modaleditfield_workspace_flat"},"schema":{"schema":"modaleditfield_schema","schema_flat":"modaleditfield_schema_flat"},"edit":{"target":"geodash-modal-edit-object"},"save":{"target":"geodash-sidebar-right","fields":{"workspace":"modaleditfield_workspace","workspace_flat":"modaleditfield_workspace_flat"}}},"ui":{"mainClass":"","tabs":[{"target":"modal-edit-field-pane-input","label":"Input"},{"target":"modal-edit-field-pane-yaml","label":"YAML"},{"target":"modal-edit-field-pane-json","label":"JSON"}]}},{"name":"edit_object","config":{"that":{"id":"geodash-modal-edit-object"},"workspace":{"workspace":"modaleditobject_workspace","workspace_flat":"modaleditobject_workspace_flat"},"schema":{"schema":"modaleditobject_schema","schema_flat":"modaleditobject_schema_flat"},"back":{"target":"geodash-modal-edit-field"},"save":{"target":"geodash-modal-edit-field","fields":{"modaleditfield_workspace":"modaleditobject_workspace","modaleditfield_workspace_flat":"modaleditobject_workspace_flat"}}},"ui":{"mainClass":"","tabs":[{"target":"modal-edit-object-pane-input","label":"Input"},{"target":"modal-edit-object-pane-yaml","label":"YAML"},{"target":"modal-edit-object-pane-json","label":"JSON"}]}}];
geodash.templates = {};
geodash.templates["geodash_tab.tpl.html"] = "<li\n  role=\"presentation\"\n  ng-class=\"(active && active != \'false\') ? \'active\' : \'\'\">\n  <a\n    href=\"#{{ target }}\"\n    aria-controls=\"{{ target }}\"\n    role=\"tab\"\n    data-toggle=\"tab\"\n    style=\"padding-left:8px; padding-right: 8px; height: {{ height | default_if_undefined : \'auto\'}}\">{{ label }}</a>\n</li>\n";
geodash.templates["geodash_tabs.tpl.html"] = "<ul class=\"nav nav-tabs nav-justified\" role=\"tablist\">\n  <li\n    ng-repeat=\"x in ui.tabs track by $index\"\n    role=\"presentation\"\n    ng-class=\"$first ? \'active\' : \'\'\">\n    <a\n      href=\"#{{ x.target }}\"\n      aria-controls=\"{{ x.target }}\"\n      role=\"tab\"\n      data-toggle=\"tab\"\n      style=\"padding-left:8px; padding-right: 8px; height: {{ height | default_if_undefined : \'auto\'}}\">{{ x.label }}</a>\n  </li>\n</ul>\n";
geodash.templates["geodash_btn_close.tpl.html"] = "<button\n  type=\"button\"\n  class=\"close\"\n  data-dismiss=\"{{ dismiss | default_if_undefined: \'modal\' }}\"\n  aria-hidden=\"true\"><i class=\"fa fa-times\"></i></button>\n";
geodash.templates["geodash_btn_info.tpl.html"] = "<div\n  class=\"input-group-addon btn btn-primary\"\n  data-toggle=\"tooltip\"\n  data-placement=\"{{ placement | default_if_undefined : \'left\' }}\"\n  ng-attr-title=\"{{ info }}\">\n  <i class=\"fa fa-info-circle\"></i>\n</div>\n";
geodash.templates["geodash_btn.tpl.html"] = "<div\n  ng-class=\"[\'input-group-addon\',\'btn\',(\'btn-\'|add: mode),((mode == \'clear\' || mode ==\'off\') ? \'btn-danger\': \'\'),((mode == \'on\') ? \'btn-success\': \'\'),((mode == \'edit\') ? \'btn-primary btn-edit\': \'\')]\"\n  data-target=\"{{ target }}\"\n  data-toggle=\"{{ info | ternary_defined : \'tooltip\' : undefined }}\"\n  data-placement=\"{{ placement | default_if_undefined : \'left\' }}\"\n  ng-attr-title=\"{{ info }}\">\n  <i ng-class=\"[\'fa\',(mode == \'clear\' ? \'fa-times\' : \'\'),(mode == \'on\' ? \'fa-check\' : \'\'),(mode == \'off\' ? \'fa-circle-o\' : \'\'),(mode == \'edit\' ? \'fa-pencil-square-o\' : \'\')]\"></i>\n</div>\n";
geodash.templates["geodash_label.tpl.html"] = "<label for=\"{{ target }}\" class=\"col-sm-3 control-label\" ng-bind-html=\"content\"></label>\n";
geodash.templates["geodash_modal_layer_carto.tpl.html"] = "<div class=\"modal-dialog\" role=\"document\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button geodash-btn-close></button>\n      <h4 class=\"modal-title\" id=\"myModalLabel\">Layer / {{ layer.title }} / Cartography</h4>\n    </div>\n    <div class=\"modal-body\">\n      <div>\n        <!-- Nav tabs -->\n        <ul class=\"nav nav-tabs\" role=\"tablist\">\n          <p class=\"navbar-text\" style=\"margin-bottom:0px;\"><b>Select</b><br><b>a Style:</b></p>\n          <li\n            role=\"presentation\"\n            ng-class=\"$first ? \'active\' : \'\'\"\n            ng-repeat=\"style in layer.cartography track by $index\">\n            <a\n              class=\"geodash-intent\"\n              href=\"#modal-layer-carto-style-{{ style.id }}\"\n              aria-controls=\"modal-layer-carto-style-{{ style.id }}\"\n              data-intent-name=\"selectStyle\"\n              data-intent-data=\"{&quot;layer&quot;:&quot;{{ layerID }}&quot;,&quot;style&quot;:&quot;{{ style.id }}&quot;}\"\n              data-intent-ctrl=\"geodash-map-legend\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\"\n              ng-bind-html=\"style.title | default:\'Default\' | tabLabel\"></a>\n          </li>\n        </ul>\n        <!-- Tab panes -->\n        <div class=\"tab-content\">\n          <div\n            ng-class=\"$first ? \'tab-pane fade in active\' : \'tab-pane fade\'\"\n            ng-repeat=\"style in layer.cartography track by $index\"\n            id=\"modal-layer-carto-style-{{ style.id }}\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span><b>Attribute: </b><span>{{ style.attribute | default:\"Not styled by attribute\" }}</span></span><br>\n            <span><b>Mask: </b><span ng-bind-html=\"style.mask | md2html | default:\'No Mask\'\"></span></span><br>\n            <span><b>Description: </b><span ng-bind-html=\"style.description | md2html | default:\'Not specified\'\"></span></span>\n            <br>\n            <br>\n            <div\n              ng-if=\"style.type == \'graduated\'\"\n              geodash-symbol-graduated\n              style=\"style\"\n              container-width=\"{{ \'392px\' }}\">\n            </div>\n            <div\n              ng-if=\"style.legend.symbol.type == \'circle\'\"\n              geodash-symbol-circle\n              style=\"style\">\n            </div>\n            <div\n              ng-if=\"style.legend.symbol.type == \'graphic\'\"\n              geodash-symbol-graphic\n              style=\"style\">\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n    <div class=\"modal-footer\">\n      <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n    </div>\n  </div>\n</div>\n";
geodash.templates["geodash_modal_layer_more.tpl.html"] = "<div class=\"modal-dialog\" role=\"document\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button geodash-btn-close></button>\n      <h4 class=\"modal-title\" id=\"myModalLabel\">Layer / {{ layer.title }}</h4>\n    </div>\n    <div class=\"modal-body\">\n      <div>\n        <!-- Nav tabs -->\n        <ul class=\"nav nav-tabs\" role=\"tablist\">\n          <li role=\"presentation\" class=\"active\">\n            <a\n              href=\"#modal-layer-more-general\"\n              aria-controls=\"modal-layer-more-general\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">General</a>\n          </li>\n          <li ng-if=\"layer.wfs\" role=\"presentation\" class=\"\">\n            <a\n              href=\"#modal-layer-more-attributes\"\n              aria-controls=\"modal-layer-more-attributes\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">Attributes</a>\n          </li>\n          <li ng-if=\"layer.wms\" role=\"presentation\" class=\"\">\n            <a\n              href=\"#modal-layer-more-source\"\n              aria-controls=\"modal-layer-more-source\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">Source</a>\n          </li>\n          <li ng-if=\"layer.wms\" role=\"presentation\" class=\"\">\n            <a\n              href=\"#modal-layer-more-wms\"\n              aria-controls=\"modal-layer-more-wms\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">WMS</a>\n          </li>\n          <li ng-if=\"layer.wfs\" role=\"presentation\" class=\"\">\n            <a\n              href=\"#modal-layer-more-wfs\"\n              aria-controls=\"modal-layer-more-wfs\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">WFS</a>\n          </li>\n          <li ng-if=\"layer.wfs\" role=\"presentation\" class=\"\">\n            <a\n              href=\"#modal-layer-more-download\"\n              aria-controls=\"modal-layer-more-download\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">Download</a>\n          </li>\n        </ul>\n        <div class=\"tab-content\">\n          <div\n            id=\"modal-layer-more-general\"\n            class=\"tab-pane fade in active\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span ng-bind-html=\"layer.description | md2html | default:\'No description given.\'\"></span>\n            <br><br><b>Type:</b> {{ layer.type }}\n            <br><br><b>Source:</b> {{ layer.source.name | default:\"Not specified\" }}\n          </div>\n          <div\n            ng-if=\"layer.wfs\"\n            id=\"modal-layer-more-attributes\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <div>\n              Placeholder\n            </div>\n          </div>\n          <div\n            ng-if=\"layer.source\"\n            id=\"modal-layer-more-source\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span><b>Name:</b> {{ layer.source.name | default:\"Not specified\" }}</span><br>\n            <span><b>Attribution:</b> {{ layer.source.attribution | default:\"Not specified\" }}</span><br>\n            <span><b>URL:</b> {{ layer.source.url | default:\"Not specified\" }}</span><br>\n          </div>\n          <div\n            ng-if=\"layer.wms\"\n            id=\"modal-layer-more-wms\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span><b>URL:</b> {{ layer.wms.url | default:\"Not specified\" }}</span><br>\n            <span><b>Layers:</b> {{ layer.wms.layers|join:\', \'|default:\"Not specified\" }}</span><br>\n            <span><b>Styles:</b> {{ layer.wms.styles|join:\', \'|default:\"Not specified\" }}</span><br>\n            <span><b>Format:</b> {{ layer.wms.format | default:\"Not specified\" }}</span><br>\n            <span><b>Version:</b> {{ layer.wms.version | default:\"Not specified\" }}</span><br>\n            <span><b>Transparent:</b> {{ layer.wms.transparent | default:\"No\" }}</span><br>\n            <hr>\n            <span><a target=\"_blank\" href=\"{{ layer.wms.url }}?SERVICE=WMS&Request=GetCapabilities\">Capabilities</a><br>\n            <span><a target=\"_blank\" href=\"{{ layer.wms.url }}?SERVICE=WMS&Request=GetLegendGraphic&format=image/png&layer={{ layer.wms.layers|first }}\">Legend Graphic</a><br>\n          </div>\n          <div\n            ng-if=\"layer.wfs\"\n            id=\"modal-layer-more-wfs\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span><b>URL:</b> {{ layer.wfs.url | default:\"Not specified\" }}</span><br>\n            <span><b>Version:</b> {{ layer.wfs.version | default:\"Not specified\" }}</span><br>\n            <hr>\n            <span><a target=\"_blank\" href=\"{{ layer | url_describefeaturetype }}\">Describe Feature Type</a><br>\n          </div>\n          <div\n            ng-if=\"layer.wfs\"\n            id=\"modal-layer-more-download\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span><b>Download Shapefile</b>: <a target=\"_blank\" href=\"{{ layer | url_shapefile }}\">All</a>, <a target=\"_blank\" href=\"{{ layer | url_shapefile:state }}\">Current Extent</a><br>\n            <span><b>Download GeoJSON</b>: <a target=\"_blank\" href=\"{{ layer | url_geojson }}\">All</a>, <a target=\"_blank\" href=\"{{ layer | url_geojson:state }}\">Current Extent</a><br>\n            <span><b>Download Google Earth KML</b>: <a target=\"_blank\" href=\"{{ layer | url_kml }}\">All</a>, <a target=\"_blank\" href=\"{{ layer | url_kml:state }}\">Current Extent</a><br>\n          </div>\n        </div>\n      </div>\n    </div>\n    <div class=\"modal-footer\">\n      <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n    </div>\n  </div>\n</div>\n";
geodash.templates["geodash_modal_layer_config.tpl.html"] = "<div class=\"modal-dialog\" role=\"document\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button geodash-btn-close></button>\n      <h4 class=\"modal-title\" id=\"myModalLabel\">Layer / {{ layer.title }}</h4>\n    </div>\n    <div class=\"modal-body\">\n      <div>\n        <!-- Nav tabs -->\n        <ul class=\"nav nav-tabs\" role=\"tablist\">\n          <li class=\"active\" role=\"presentation\">\n            <a href=\"#modal-layer-config-input\"\n              aria-controls=\"modal-layer-config-input\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">Configure</a>\n          </li>\n          <li class=\"\" role=\"presentation\">\n            <a href=\"#modal-layer-config-output\"\n              aria-controls=\"modal-layer-config-output\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">Output</a>\n          </li>\n        </ul>\n        <!-- Tab panes -->\n        <div class=\"tab-content\">\n          <div\n            id=\"modal-layer-config-input\"\n            class=\"tab-pane fade in active\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <div class=\"form-group row\" style=\"margin:0; padding-top: 10px; padding-bottom: 10px;\">\n              <div class=\"col-md-3\"><h5>Title</h5></div>\n              <div class=\"col-md-9\">\n                <label for=\"layer-config-title\" class=\"sr-only control-label\">Title</label>\n                <input\n                  id=\"layer-config-title\"\n                  type=\"text\"\n                  class=\"form-control\"\n                  placeholder=\"Title ...\"\n                  data-geodash-field-type=\"text\"\n                  ng-model=\"layer.title\"\n                  ng-change=\"validateField()\"\n                  required\n                  value=\"{{ layer.title }}\">\n              </div>\n            </div>\n            <div class=\"form-group row\" style=\"margin:0; padding-top: 10px; padding-bottom: 10px;\">\n              <div class=\"col-md-3\"><h5>Description</h5></div>\n              <div class=\"col-md-9\">\n                <label for=\"layer-config-title\" class=\"sr-only control-label\">Description</label>\n                <input\n                  id=\"layer-config-description\"\n                  type=\"text\"\n                  class=\"form-control\"\n                  placeholder=\"Title ...\"\n                  data-geodash-field-type=\"text\"\n                  ng-model=\"layer.description\"\n                  ng-change=\"validateField()\"\n                  required\n                  value=\"{{ layer.Description }}\">\n              </div>\n            </div>\n          </div>\n          <div\n            id=\"modal-layer-config-output\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            {{ layer | json }}\n          </div>\n        </div>\n      </div>\n    </div>\n    <div class=\"modal-footer\">\n      <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n    </div>\n  </div>\n</div>\n";
geodash.templates["symbol_circle.tpl.html"] = "<div>\n  <svg width=\"100%\" height=\"100%\" version=\"1.0\" xmlns=\"http://www.w3.org/2000/svg\">\n    <circle\n      cx=\"50%\"\n      cy=\"50%\"\n      ng-r=\"{{ style.legend.symbol.radius }}\"\n      ng-fill=\"{{ style.styles.default.static.color }}\"\n      stroke-width=\"1\"\n      stroke=\"#000000\"></circle>\n  </svg>\n</div>\n";
geodash.templates["symbol_ellipse.tpl.html"] = "<div>\n  <svg width=\"100%\" height=\"100%\" version=\"1.0\" xmlns=\"http://www.w3.org/2000/svg\">\n    <ellipse\n      cx=\"50%\"\n      cy=\"50%\"\n      ng-rx=\"{{ style.legend.symbol.width }}\"\n      ng-ry=\"{{ style.legend.symbol.height }}\"\n      ng-fill=\"{{ style.styles.default.static.color }}\"\n      stroke-width=\"1\"\n      stroke=\"#000000\"></circle>\n  </svg>\n</div>\n";
geodash.templates["symbol_graduated.tpl.html"] = "<div>\n  <div\n    style=\"display: inline-block; vertical-align:top;\"\n    ng-bind-html=\"style.ramp.label.left | md2html\"></div>\n  <svg\n    ng-attr-width=\"{{ containerWidth }}\"\n    height=\"90px\"\n    version=\"1.0\"\n    xmlns=\"http://www.w3.org/2000/svg\">\n    <g>\n      <rect\n        ng-repeat=\"color in style.colors.ramp track by $index\"\n        ng-attr-x=\"{{ style.colors.ramp | length | position_x : $index : containerWidth : 26 }}px\"\n        ng-attr-y=\"{{ \'0\' }}\"\n        ng-attr-width=\"{{ style.colors.ramp | length | width_x : containerWidth : 26 }}px\"\n        height=\"50px\"\n        ng-attr-fill=\"{{ color }}\"\n        stroke-width=\"1\"\n        stroke=\"#000000\"/>\n    </g>\n    <g>\n      <text\n        ng-repeat=\"breakpoint in style | breakpoints track by $index\"\n        ng-attr-x=\"{{ style | breakpoints | length | add: -1 | position_x : $index : containerWidth : 26 }}px\"\n        ng-attr-y=\"{{ $index | choose : 68 : 82 }}px\"\n        text-anchor=\"middle\"\n        ng-attr-fill=\"{{ \'black\' }}\"\n        font-size=\"14px\"\n        text-decoration=\"underline\"\n        font-family=\"\'Open Sans\', sans-serif\">{{ style | breakpoint: $index | formatBreakpoint }}</text>\n    </g>\n  </svg>\n  <div\n    style=\"display: inline-block; vertical-align:top;\"\n    ng-bind-html=\"style.ramp.label.right | md2html\"></div>\n</div>\n";
geodash.templates["symbol_graphic.tpl.html"] = "<i class=\"fa fa-image\" style=\"color:black; font-size: 20px;\"></i>\n";
geodash.templates["legend_baselayers.tpl.html"] = "<div class=\"geodash-map-legend-baselayers geodash-radio-group\">\n  <div\n    ng-repeat=\"layer in baselayers track by $index\"\n    ng-init=\"layerIndex = $index\"\n    ng-if=\"layer.legend!==undefined\"\n    class=\"geodash-map-legend-item noselect\"\n    data-layer=\"{{ layer.id }}\">\n    <div class=\"geodash-map-legend-item-left\">\n      <div class=\"geodash-map-legend-item-icon geodash-map-legend-item-more\">\n        <a\n          class=\"geodash-intent\"\n          data-intent-ctrl=\"geodash-map-legend\"\n          data-intent-name=\"toggleModal\"\n          data-intent-data=\"{{ html5data(\'toggleModal\', \'geodash-modal-layer-more\', \'baselayer\', layer) }}\">\n          <i class=\"fa fa-info-circle\"></i>\n        </a>\n      </div><!--\n      --><div class=\"geodash-map-legend-item-icon geodash-map-legend-item-visibility\">\n           <a\n             ng-class=\" layer.id == state.view.baselayer ? \'geodash-map-legend-item-visibility-button geodash-intent geodash-radio geodash-on\' : \'geodash-map-legend-item-visibility-button geodash-intent geodash-radio\'\"\n             data-intent-name=\"switchBaseLayer\"\n             data-intent-data=\"{&quot;layer&quot;:&quot;{{ layer.id }}&quot;}\"\n             data-intent-class-on=\"geodash-on\"\n             data-intent-class-off=\"\"\n             data-intent-ctrl=\"geodash-map-legend\">\n             <i class=\"fa fa-eye geodash-on\"></i><i class=\"fa fa-eye-slash geodash-off\"></i>\n           </a>\n         </div><!--\n      --><div class=\"geodash-map-legend-item-symbol\" style=\"width: 10px;\"></div>\n    </div><!--\n    --><div class=\"geodash-map-legend-item-right\">\n      <div\n        class=\"geodash-map-legend-item-label\"\n        style=\"{{ layer.id == state.view.baselayer ? \'width: 100%;\' : \'width: 100%;opacity: 0.4;\' }}\">\n        <span ng-bind-html=\"layer.legend.label | default_if_undefined_or_blank : layer.title | md2html\"></span>\n      </div>\n    </div>\n  </div>\n</div>\n";
geodash.templates["legend_featurelayers.tpl.html"] = "<div class=\"geodash-map-legend-featurelayers\">\n  <div\n    ng-repeat=\"layer in featurelayers track by $index\"\n    ng-init=\"layerIndex = $index\"\n    ng-if=\"layer.legend!==undefined\"\n    class=\"geodash-map-legend-item noselect\"\n    data-layer=\"{{ layer.id }}\">\n    <div class=\"geodash-map-legend-item-left\">\n      <div class=\"geodash-map-legend-item-icon geodash-map-legend-item-config\" style=\"display:none;\">\n        <a\n          class=\"geodash-intent\"\n          data-intent-name=\"toggleModal\"\n          data-intent-data=\"{{ html5data(\'toggleModal\', \'geodash-modal-layer-config\', \'featurelayer\', layer) }}\"\n          data-intent-ctrl=\"geodash-map-legend\">\n          <i class=\"fa fa-cog\"></i>\n        </a>\n      </div><!--\n      --><div class=\"geodash-map-legend-item-icon geodash-map-legend-item-more\">\n        <a\n          class=\"geodash-intent\"\n          data-intent-name=\"toggleModal\"\n          data-intent-data=\"{{ html5data(\'toggleModal\', \'geodash-modal-layer-more\', \'featurelayer\', layer) }}\"\n          data-intent-ctrl=\"geodash-map-legend\">\n          <i class=\"fa fa-info-circle\"></i>\n        </a>\n      </div><!--\n      --><div class=\"geodash-map-legend-item-icon geodash-map-legend-item-visibility\">\n         <a\n           ng-class=\"layer.id | inArray : state.view.featurelayers | ternary : \'geodash-map-legend-item-visibility-button geodash-intent geodash-toggle\' : \'geodash-map-legend-item-visibility-button geodash-intent geodash-toggle geodash-off\'\"\n           data-intent-names=\"[&quot;showLayer&quot;,&quot;hideLayer&quot;]\"\n           data-intent-data=\"{&quot;layer&quot;:&quot;{{ layer.id }}&quot;}\"\n           data-intent-ctrl=\"geodash-map-legend\">\n           <i class=\"fa fa-eye geodash-on\"></i><i class=\"fa fa-eye-slash geodash-off\"></i>\n         </a>\n     </div><!--\n     --><div\n          ng-class=\"layer.type == \'geojson\' ? \'geodash-map-legend-item-icon geodash-map-legend-item-zoomto\': \'geodash-map-legend-item-icon geodash-map-legend-item-zoomto fade disabled\'\">\n        <a\n          class=\"geodash-map-legend-item-zoomto-button geodash-intent\"\n          data-intent-name=\"zoomToLayer\"\n          data-intent-data=\"{&quot;layer&quot;:&quot;{{ layer.id }}&quot;}\"\n          data-intent-ctrl=\"geodash-map-legend\">\n          <i class=\"fa fa-compress\"></i>\n        </a>\n      </div>\n    </div><!--\n    --><div class=\"geodash-map-legend-item-right\">\n      <div\n        ng-if=\"layer.cartography[0].legend.symbol\"\n        class=\"geodash-map-legend-item-symbol\">\n        <a\n          class=\"geodash-intent\"\n          data-intent-name=\"toggleModal\"\n          data-intent-data=\"{{ html5data(\'toggleModal\', \'geodash-modal-layer-carto\', \'featurelayer\', layer) }}\"\n          data-intent-ctrl=\"geodash-map-legend\">\n          <div ng-if=\"layer.cartography[0].legend.symbol.type == \'circle\'\">\n            <svg width=\"100%\" height=\"100%\" version=\"1.0\" xmlns=\"http://www.w3.org/2000/svg\">\n              <circle\n                cx=\"50%\"\n                cy=\"50%\"\n                ng-r=\"{{ layer.cartography[0].legend.symbol.radius }}\"\n                ng-fill=\"{{ layer.cartography[0].styles.default.static.color }}\"\n                stroke-width=\"1\"\n                stroke=\"#000000\"></circle>\n            </svg>\n          </div>\n          <div ng-if=\"layer.cartography[0].legend.symbol.type == \'ellipse\'\">\n            <svg width=\"100%\" height=\"100%\" version=\"1.0\" xmlns=\"http://www.w3.org/2000/svg\">\n              <ellipse\n                cx=\"50%\"\n                cy=\"50%\"\n                ng-rx=\"{{ layer.cartography[0].legend.symbol.width }}\"\n                ng-ry=\"{{ layer.cartography[0].legend.symbol.height }}\"\n                ng-fill=\"{{ layer.cartography[0].styles.default.static.color }}\"\n                stroke-width=\"1\"\n                stroke=\"#000000\"></circle>\n            </svg>\n          </div>\n          <div\n            ng-if=\"layer.cartography[0].legend.symbol.type == \'graduated\'\">\n            <svg\n              ng-attr-width=\"{{ layer.cartography[0].legend.symbol.width }}\"\n              height=\"100%\"\n              version=\"1.0\"\n              xmlns=\"http://www.w3.org/2000/svg\">\n              <rect\n                ng-repeat=\"color in layer.cartography[0].colors.ramp track by $index\"\n                ng-attr-x=\"{{ $index|percent:layer.cartography[0].colors.ramp.length }}%\"\n                y=\"0\"\n                ng-attr-width=\"{{ 1|percent:layer.cartography[0].colors.ramp.length }}%\"\n                ng-attr-height=\"{{ layer.cartography[0].legend.symbol.height }}\"\n                ng-attr-fill=\"{{ color }}\"\n                stroke-width=\"1\"\n                stroke=\"#000000\"/>\n            </svg>\n          </div>\n          <div\n            ng-if=\"layer.cartography[0].legend.symbol.type == \'graphic\'\">\n            <i class=\"fa fa-image\" style=\"color:black; font-size: 20px;\"></i>\n          </div>\n        </a>\n      </div><!--\n      --><div\n           class=\"geodash-map-legend-item-label\"\n           style=\"{{ layer.id | inArray : state.view.featurelayers | ternary : \'\' : \'opacity: 0.4;\' }}\">\n        <span ng-bind-html=\"layer.legend.label | default_if_undefined_or_blank : layer.title | md2html\"></span>\n      </div>\n    </div>\n  </div>\n</div>\n";
geodash.templates["geodash_modal_welcome.tpl.html"] = "<div class=\"modal-dialog\" role=\"document\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button geodash-btn-close></button>\n      <h4 class=\"modal-title\" id=\"myModalLabel\">{{ welcome.title }}</h4>\n    </div>\n    <div class=\"modal-body\">\n      <div>\n        <!-- Nav tabs -->\n        <ul class=\"nav nav-tabs\" role=\"tablist\">\n          <li role=\"presentation\" class=\"active\">\n            <a\n              href=\"#modal-welcome-general\"\n              aria-controls=\"modal-welcome-general\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">General</a>\n          </li>\n          <li role=\"presentation\" class=\"\">\n            <a\n              href=\"#modal-welcome-about\"\n              aria-controls=\"modal-welcome-about\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">About</a>\n          </li>\n        </ul>\n        <div class=\"tab-content\">\n          <div\n            id=\"modal-welcome-general\"\n            class=\"tab-pane fade in active\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span ng-bind-html=\"welcome.general | md2html | default:\'No body given.\'\"></span>\n          </div>\n          <div\n            id=\"modal-welcome-about\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span ng-bind-html=\"welcome.about | md2html | default:\'No body given.\'\"></span>\n          </div>\n        </div>\n      </div>\n    </div>\n    <div class=\"modal-footer\">\n      <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n    </div>\n  </div>\n</div>\n";
geodash.templates["geodash_modal_about.tpl.html"] = "<div class=\"modal-dialog\" role=\"document\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button geodash-btn-close></button>\n      <h4 class=\"modal-title\" id=\"myModalLabel\">{{ about.title }}</h4>\n    </div>\n    <div class=\"modal-body\">\n      <div>\n        <!-- Nav tabs -->\n        <ul class=\"nav nav-tabs\" role=\"tablist\">\n          <li\n            role=\"presentation\"\n            ng-class=\"$first ? \'active\' : \'\'\"\n            ng-repeat=\"pane in about.panes track by $index\">\n            <a\n              href=\"#{{ pane.id }}\"\n              aria-controls=\"{{ pane.id }}\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\"\n              ng-bind-html=\"pane.tab.label | default:\'Default\' | tabLabel\"></a>\n          </li>\n        </ul>\n        <!-- Tab panes -->\n        <div class=\"tab-content\">\n          <div\n            ng-class=\"$first ? \'tab-pane fade in active\' : \'tab-pane fade\'\"\n            ng-repeat=\"pane in about.panes track by $index\"\n            id=\"{{ pane.id }}\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span ng-bind-html=\"pane.content | md2html | default:\'No content given.\'\"></span>\n          </div>\n        </div>\n      </div>\n    </div>\n    <div class=\"modal-footer\">\n      <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n    </div>\n  </div>\n</div>\n";
geodash.templates["geodash_modal_download.tpl.html"] = "<div class=\"modal-dialog\" role=\"document\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button geodash-btn-close></button>\n      <h4 class=\"modal-title\" id=\"myModalLabel\">{{ download.title }}</h4>\n    </div>\n    <div class=\"modal-body\">\n      <div>\n        <!-- Nav tabs -->\n        <ul class=\"nav nav-tabs\" role=\"tablist\">\n          <li\n            role=\"presentation\"\n            ng-class=\"$first ? \'active\' : \'\'\"\n            ng-repeat=\"pane in download.panes track by $index\">\n            <a\n              href=\"#{{ pane.id }}\"\n              aria-controls=\"{{ pane.id }}\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\"\n              ng-bind-html=\"pane.tab.label | default:\'Default\' | tabLabel\"></a>\n          </li>\n        </ul>\n        <!-- Tab panes -->\n        <div class=\"tab-content\">\n          <div\n            ng-class=\"$first ? \'tab-pane fade in active\' : \'tab-pane fade\'\"\n            ng-repeat=\"pane in download.panes track by $index\"\n            id=\"{{ pane.id }}\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span ng-bind-html=\"pane.content | md2html | default:\'No content given.\'\"></span>\n          </div>\n        </div>\n      </div>\n    </div>\n    <div class=\"modal-footer\">\n      <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n    </div>\n  </div>\n</div>\n";
geodash.templates["map_overlays.tpl.html"] = "<div ng-class=\"[\'geodash-map-overlays\', ((editable | parseTrue) ? \'editable\': \'\')]\">\n  <div ng-repeat=\"overlay in map_config.overlays track by $index\">\n    <div\n      ng-if=\"overlay.type == \'text\'\"\n      data-overlay-index=\"{{ $index }}\"\n      data-overlay-type=\"text\"\n      class=\"geodash-map-overlay\"\n      height=\"{{ overlay.height | default_if_undefined : initial }}\"\n      width=\"{{ overlay.width | default_if_undefined : initial }}\"\n      style=\"{{ style(overlay.type, overlay) }}\"\n      ng-bind-html=\"overlay.text.content | md2html\"\n      on-link-done=\"overlayLoaded\">\n    </div>\n    <div\n      ng-if=\"overlay.type == \'image\'\"\n      data-overlay-index=\"{{ $index }}\"\n      data-overlay-type=\"image\"\n      class=\"geodash-map-overlay\"\n      style=\"display: inline-block; {{ style(overlay.type, overlay) }}\"\n      on-link-done=\"overlayLoaded\">\n      <img\n        ng-src=\"{{ overlay.image.url }}\"\n        width=\"{{ overlay.width }}\"\n        height=\"{{ overlay.height }}\">\n    </div>\n  </div>\n</div>\n";
geodash.templates["geodash_sidebar_toggle_left.tpl.html"] = "<div\n  id=\"geodash-map-sidebar-toggle-left\"\n  class=\"geodash-intent geodash-map-sidebar-toggle geodash-map-sidebar-toggle-left btn btn-primary sidebar-open sidebar-left-open\"\n  data-toggle=\"tooltip\"\n  data-placement=\"bottom\"\n  title=\"Click to toggle sidebar.\"\n  data-intent-name=\"requestToggleComponent\"\n  data-intent-data=\"{&quot;selector&quot;:&quot;{{ selector }}&quot;,&quot;component&quot;:&quot;sidebar&quot;,&quot;position&quot;:&quot;left&quot;}\"\n  data-intent-ctrl=\"geodash-map-sidebar-toggle-left\">\n  <div\n    style=\"padding: 4px;\">\n    <span class=\"icon-arrow-gt\">&gt;&gt;</span>\n    <span class=\"icon-arrow-lt\">&lt;&lt;</span>\n  </div>\n</div>\n";
geodash.templates["geodash_sidebar_toggle_right.tpl.html"] = "<div\n  id=\"geodash-map-sidebar-toggle-right\"\n  class=\"geodash-intent geodash-map-sidebar-toggle geodash-map-sidebar-toggle-right btn btn-primary sidebar-open sidebar-right-open\"\n  data-toggle=\"tooltip\"\n  data-placement=\"bottom\"\n  title=\"Click to toggle sidebar.\"\n  data-intent-name=\"requestToggleComponent\"\n  data-intent-data=\"{&quot;selector&quot;:&quot;{{ selector }}&quot;,&quot;component&quot;:&quot;sidebar&quot;,&quot;position&quot;:&quot;right&quot;}\"\n  data-intent-ctrl=\"geodash-map-sidebar-toggle-right\">\n  <div\n    style=\"padding: 4px;\">\n    <span class=\"icon-arrow-gt\">&gt;&gt;</span>\n    <span class=\"icon-arrow-lt\">&lt;&lt;</span>\n  </div>\n</div>\n";
geodash.templates["modal_welcome_geodashserver.tpl.html"] = "<div\n  id=\"geodash-modal-geodashserver-welcome\"\n  class=\"geodash-controller geodash-controller-modal geodash-modal modal fade geodash-geodashserver-welcome\"\n  tabindex=\"-1\"\n  role=\"dialog\"\n  aria-labelledby=\"myModalLabel\">\n  <div class=\"modal-dialog\" data-backdrop=\"static\" role=\"document\">\n    <div class=\"modal-content\">\n      <div class=\"modal-header\">\n        <h4 class=\"modal-title\" id=\"myModalLabel\">{{ welcome.title }}</h4>\n      </div>\n      <div class=\"modal-body\">\n        <div>\n          <!-- Nav tabs -->\n          <div geodash-tabs></div>\n          <div class=\"tab-content\">\n            <div\n              id=\"modal-geodashserver-welcome-intro\"\n              class=\"tab-pane fade in active\"\n              role=\"tabpanel\"\n              style=\"padding: 10px;\">\n              <span\n                class=\"welcome-body\"\n                ng-bind-html=\"welcome.intro | md2html | default:\'No body given.\'\"></span>\n              <hr>\n              <h3 class=\"welcome-body\">Get Started: Select a dashboard!</h3>\n              <div class=\"input-group select2-bootstrap-prepend select2-bootstrap-append\">\n                <input\n                  id=\"dashboard-input-backend\"\n                  name=\"dashboard-input-backend\"\n                  type=\"text\"\n                  class=\"form-control\"\n                  style=\"display:none;\"\n                  ng-model=\"dashboard\">\n                <span class=\"input-group-addon\" id=\"dashboard-addon\">Dashboard</span>\n                <input\n                  id=\"dashboard-input\"\n                  name=\"dashboard-input\"\n                  type=\"text\"\n                  class=\"typeahead form-control\"\n                  style=\"height: auto;\"\n                  placeholder=\"dashboard (e.g., Test, etc.)\"\n                  aria-describedby=\"dashboard-addon\"\n                  data-placeholder=\"dashboard (e.g., Test, etc.)\"\n                  data-initial-data=\"dashboards_typeahead\"\n                  data-backend=\"dashboard-input-backend\"\n                  data-template-empty=\"<div class=&quot;alert alert-danger empty-message&quot;>Unable to find dashboard</div>\">\n                <div\n                  class=\"input-group-addon btn btn-primary btn-show-options\"\n                  data-toggle=\"tooltip\"\n                  data-placement=\"bottom\"\n                  title=\"Show Options.\"\n                  ng-click=\"showOptions($event, \'#dashboard-input\')\">\n                  <i class=\"fa fa-chevron-down\"></i>\n                </div>\n                <div\n                  class=\"input-group-addon btn btn-danger btn-clear\"\n                  data-toggle=\"tooltip\"\n                  data-placement=\"bottom\"\n                  title=\"Clear dashboard selection.\"\n                  data-target=\"#dashboard-input\">\n                  <i class=\"fa fa-times\"></i>\n                </div>\n              </div>\n              <hr>\n              <ul class=\"nav nav-justified welcome-go\">\n                <li>\n                  <a\n                    ng-disabled=\"dashboard == undefined || dashboard == \'\'\"\n                    ng-class=\"dashboard == undefined || dashboard == \'\'  ? \'btn btn-default\' : \'btn btn-primary\' \"\n                    ng-href=\"{{ dashboard == undefined || dashboard == \'\' ? \'#\' : \'/dashboard/\'+dashboard }}\">Go!</a>\n                </li>\n              </ul>\n            </div>\n            <div\n              id=\"modal-geodashserver-welcome-about\"\n              class=\"tab-pane fade\"\n              role=\"tabpanel\"\n              style=\"padding: 10px;\">\n              <span ng-bind-html=\"welcome.about | md2html | default:\'No body given.\'\"></span>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n";
geodash.templates["dashboard_editor.tpl.html"] = "<div\n  class=\"geodash-dashboard-editor\">\n  <nav class=\"navbar navbar-default\">\n    <div class=\"container-fluid\">\n      <div class=\"navbar-header\">\n        <button\n          type=\"button\"\n          class=\"collapsed navbar-toggle\"\n          data-toggle=\"collapse\"\n          data-target=\"#geodash-editor-navbar-collapse\"\n          aria-expanded=\"false\">\n          <span class=\"sr-only\">Toggle navigation</span>\n          <span class=\"icon-bar\"></span>\n          <span class=\"icon-bar\"></span>\n          <span class=\"icon-bar\"></span>\n        </button>\n        <div class=\"navbar-brand\">\n          <p class=\"navbar-text\" style=\"color:rgb(85,85,85);font-size:30px;\">GeoDash Editor</p>\n        </div>\n      </div>\n      <div class=\"collapse navbar-collapse\" id=\"geodash-editor-navbar-collapse\">\n        <form class=\"navbar-form navbar-right\">\n          <button\n            type=\"button\"\n            class=\"btn btn-success\"\n            ng-click=\"saveConfig()\"\n            ng-disabled=\"\'change_geodashdashboard\' | inArray : perms | not\"\n          >Save</button>\n          <button\n            type=\"button\"\n            class=\"btn btn-success\"\n            ng-click=\"saveAsConfig()\"\n          >Save As ...</button>\n          <button type=\"button\" class=\"btn btn-default\">Reset</button>\n        </form>\n      </div>\n    </div>\n  </nav>\n  <form\n    class=\"form-horizontal simple-form\"\n    style=\"margin: 10px;\"\n    novalidate>\n    <ul class=\"nav nav-tabs nav-justified\" role=\"tablist\">\n      <li\n        ng-repeat=\"pane in editor.panes track by $index\"\n        ng-init=\"paneIndex = $index\"\n        role=\"presentation\"\n        ng-class=\"$first ? \'active\' : \'\'\">\n        <a\n          href=\"#{{ pane.id }}\"\n          aria-controls=\"{{ pane.id }}\"\n          role=\"tab\"\n          data-toggle=\"tab\"\n          style=\"padding-left:8px; padding-right: 8px; height: 62px;\"\n          ng-bind-html=\" pane.label | md2html\"></a>\n      </li>\n    </ul>\n    <div class=\"tab-content\">\n      <div\n        ng-class=\"$first ? \'tab-pane fade in active\' : \'tab-pane fade\'\"\n        ng-repeat=\"pane in fields_by_pane track by $index\"\n        ng-init=\"paneIndex = $index\"\n        id=\"{{ pane.id }}\"\n        role=\"tabpanel\"\n        style=\"padding: 10px;\">\n        <div\n          ng-repeat=\"field in pane.fields track by $index\"\n          ng-init=\"field_flat = (field | replace : \'.\' : \'__\')\"\n          ng-init=\"fieldIndex = $index\"\n          class=\"form-group\"\n          style=\"margin:0; padding-top: 10px; padding-bottom: 10px;\">\n          <div\n              ng-if=\"schema | extract : field : \'type\' | inArray: [\'text\', \'string\', \'markdown\', \'md\']\">\n            <label\n              for=\"editor-field-{{ field_flat }}\"\n              class=\"col-sm-3 control-label\"\n              ng-bind-html=\"schema | extract : field : \'label\'\"></label>\n            <div class=\"col-sm-9\">\n              <div\n                ng-if=\"schema | extract : field : \'multiline\' | default_if_undefined: \'false\' | inArray: [false, \'false\', \'no\', 0]\"\n                class=\"input-group\">\n                <div geodash-btn-info info=\"{{ schema | extract : field : \'description\' }}\"></div>\n                <input\n                  id=\"editor-field-{{ field_flat }}\"\n                  name=\"editor-field-{{ field_flat }}\"\n                  type=\"text\"\n                  class=\"form-control\"\n                  placeholder=\"{{ schema | extract : field : \'placeholder\' }}\"\n                  data-geodash-field-type=\"{{ schema | extract : field : \'type\' }}\"\n                  ng-required=\"schema | extract : field : \'required\'\"\n                  ng-value=\"workspace_flat | extract : field_flat\"\n                  ng-model=\"workspace_flat[field_flat]\"\n                  ng-change=\"validateField(field_flat)\">\n                <div\n                  ng-if=\"schema | extract : field : \'source\' | ternary_defined: true : false\"\n                  class=\"input-group-addon btn btn-primary btn-show-options\"\n                  data-toggle=\"tooltip\"\n                  data-placement=\"bottom\"\n                  title=\"Show Options.\"\n                  ng-click=\"showOptions($event, \'#editor-field-\' + field_flat)\">\n                  <i class=\"fa fa-chevron-down\"></i>\n                </div>\n                <div\n                  geodash-btn mode=\"edit\"\n                  target=\"#editor-field-{{ field_flat }}\"\n                  info=\"Edit field\"\n                  tooltip-placement=\"bottom\"\n                  class=\"geodash-intent\"\n                  data-intent-name=\"showModal\"\n                  data-intent-data=\"{{ html5data(\'showModal\', \'geodash-modal-edit-field\', field) }}\"\n                  data-intent-ctrl=\"{{ config.that.id }}\"></div>\n                <div\n                  geodash-btn mode=\"clear\"\n                  target=\"#editor-field-{{ field_flat }}\"\n                  info=\"Clear field\"\n                  tooltip-placement=\"bottom\"></div>\n              </div>\n              <div\n                ng-if=\"schema | extract : field : \'multiline\' | default_if_undefined: \'false\' | parseTrue\"\n                class=\"input-group\">\n                <div geodash-btn-info info=\"{{ schema | extract : field : \'description\' }}\"></div>\n                <textarea\n                  id=\"editor-field-{{ field_flat }}\"\n                  name=\"editor-field-{{ field_flat }}\"\n                  class=\"form-control\"\n                  placeholder=\"{{ schema | extract : field : \'placeholder\' }}\"\n                  rows=\"3\"\n                  data-geodash-field-type=\"{{ schema | extract : field : \'type\' }}\"\n                  ng-required=\"schema | extract : field : \'required\'\"\n                  style=\"max-width: 100%;\"\n                  ng-model=\"workspace_flat[field_flat]\"\n                  ng-change=\"validateField(field_flat)\"\n                  ng-bind-html=\"workspace_flat | extract : field_flat\"></textarea>\n                <a\n                  class=\"geodash-intent input-group-addon btn btn-primary btn-edit\"\n                  href=\"#\"\n                  data-intent-name=\"showModal\"\n                  data-intent-data=\"{{ html5data(\'showModal\', \'geodash-modal-edit-field\', field) }}\"\n                  data-intent-ctrl=\"{{ config.that.id }}\">\n                  <i class=\"fa fa-pencil-square-o \"></i>\n                </a>\n                <div\n                  geodash-btn mode=\"clear\"\n                  target=\"#editor-field-{{ field_flat }}\"\n                  info=\"Clear field\"\n                  tooltip-placement=\"bottom\"></div>\n              </div>\n            </div>\n            <div ng-show=\"form.$submitted || form.{{ field }}.$touched\">\n              <span ng-show=\"form.{{ field }}.$error.required\">{{ schema | extract : field : \'label\' }} is required.</span>\n            </div>\n          </div>\n          <div\n            ng-if=\"schema | extract : field : \'type\' | inArray: [\'int\', \'integer\']\">\n            <label\n              for=\"editor-field-{{ field_flat }}\"\n              class=\"col-sm-3 control-label\"\n              ng-bind-html=\"schema | extract : field : \'label\'\"></label>\n            <div class=\"col-sm-9 input-group\">\n              <div geodash-btn-info info=\"{{ schema | extract : field : \'description\' }}\"></div>\n              <input\n                id=\"editor-field-{{ field_flat }}\"\n                name=\"editor-field-{{ field_flat }}\"\n                type=\"number\"\n                class=\"form-control\"\n                placeholder=\"{{ schema | extract : field : \'placeholder\' }}\"\n                data-geodash-field-type=\"{{ schema | extract : field : \'type\' }}\"\n                ng-required=\"schema | extract : field : \'required\'\"\n                ng-attr-min=\"{{ schema | extract : field : \'minValue\' | default_if_undefined: \'\' }}\"\n                ng-attr-max=\"{{ schema | extract : field : \'maxValue\' | default_if_undefined: \'\' }}\"\n                ng-value=\"workspace_flat | extract : field_flat\"\n                ng-model=\"workspace_flat[field_flat]\"\n                ng-change=\"validateField(field_flat)\">\n              <div\n                geodash-btn mode=\"clear\"\n                target=\"#editor-field-{{ field_flat }}\"\n                info=\"Clear field\"\n                tooltip-placement=\"bottom\"></div>\n            </div>\n            <div ng-show=\"form.$submitted || form.{{ field }}.$touched\">\n              <span ng-show=\"form.{{ field }}.$error.required\">{{ schema | extract : field : \'label\' }} is required.</span>\n            </div>\n          </div>\n          <div\n            ng-if=\"schema | extract : field : \'type\' | inArray: [\'boolean\', \'checkbox\']\">\n            <label\n              for=\"editor-field-{{ field_flat }}\"\n              class=\"col-sm-3 control-label\"\n              ng-bind-html=\"schema | extract : field : \'label\'\"></label>\n            <div class=\"col-sm-9\">\n              <div class=\"input-group\">\n                <div geodash-btn-info info=\"{{ schema | extract : field : \'description\' }}\"></div>\n                <input\n                  id=\"editor-field-{{ field_flat }}\"\n                  name=\"editor-field-{{ field_flat }}\"\n                  type=\"text\"\n                  class=\"form-control\"\n                  ng-style=\"{\'font-weight\': \'bold\', \'color\': ((workspace_flat | extract : field_flat | parseTrue ) ? \'green\' : \'red\') }\"\n                  placeholder=\"{{ schema | extract : field : \'placeholder\' }}\"\n                  data-geodash-field-type=\"{{ schema | extract : field : \'type\' }}\"\n                  ng-required=\"schema | extract : field : \'required\'\"\n                  ng-value=\"workspace_flat | extract : field_flat\"\n                  ng-model=\"workspace_flat[field_flat]\"\n                  ng-change=\"validateField(field_flat)\"\n                  disabled>\n                <div\n                  geodash-btn mode=\"on\"\n                  target=\"#editor-field-{{ field_flat }}\"\n                  info=\"Set to true\"\n                  tooltip-placement=\"bottom\"></div>\n                <div\n                  geodash-btn mode=\"off\"\n                  target=\"#editor-field-{{ field_flat }}\"\n                  info=\"Set to false\"\n                  tooltip-placement=\"bottom\"></div>\n                <div\n                  geodash-btn mode=\"clear\"\n                  target=\"#editor-field-{{ field_flat }}\"\n                  info=\"Clear field\"\n                  tooltip-placement=\"bottom\"></div>\n              </div>\n            </div>\n          </div>\n          <div\n            ng-if=\"schema | extract : field : \'type\' | inArray: [\'stringarray\', \'textarray\']\">\n            <label\n              for=\"editor-field-{{ field_flat }}\"\n              class=\"col-sm-3 control-label\"\n              ng-bind-html=\"schema | extract : field : \'label\'\"></label>\n            <div class=\"col-sm-9\">\n              <div class=\"input-group\">\n                <div geodash-btn-info info=\"{{ schema | extract : field : \'description\' }}\"></div>\n                <div class=\"form-control\" style=\"height: auto;min-height: 28px;max-height: 70px;overflow-y:scroll;\">\n                  <span\n                    ng-repeat=\"x in workspace | extract : field track by $index\"\n                    style=\"width: 230px; height: 20px; text-overflow: ellipsis; display: block;white-space: nowrap; overflow: hidden;\"\n                    ng-bind-html=\"x\">\n                  </span>\n                </div>\n                <a\n                  class=\"geodash-intent input-group-addon btn btn-primary btn-edit\"\n                  href=\"#\"\n                  data-intent-name=\"showModal\"\n                  data-intent-data=\"{{ html5data(\'showModal\', \'geodash-modal-edit-field\', field) }}\"\n                  data-intent-ctrl=\"{{ config.that.id }}\">\n                  <i class=\"fa fa-pencil-square-o \"></i>\n                </a>\n                <div\n                  geodash-btn mode=\"clear\"\n                  target=\"#editor-field-{{ field_flat }}\"\n                  info=\"Clear field\"\n                  tooltip-placement=\"bottom\"></div>\n              </div>\n            </div>\n          </div>\n          <div\n            ng-if=\"schema | extract : field : \'type\' | inArray: [\'objectarray\', \'objarray\']\">\n            <label\n              for=\"editor-field-{{ field_flat }}\"\n              class=\"col-sm-3 control-label\"\n              ng-bind-html=\"schema | extract : field : \'label\'\"></label>\n            <div class=\"col-sm-9\">\n              <div class=\"input-group\">\n                <div geodash-btn-info info=\"{{ schema | extract : field : \'description\' }}\"></div>\n                <div\n                  class=\"form-control\"\n                  style=\"height: auto; max-width: 280px;min-height: 28px;max-height: 70px;overflow-y: scroll;\"\n                  disabled>\n                  <span\n                    ng-repeat=\"x in workspace| extract : field track by $index\"\n                    class=\"\"\n                    style=\"width: 230px; height: 20px; text-overflow: ellipsis; display: block;white-space: nowrap; overflow: hidden;\"\n                    ng-bind-html=\"x.title + \' (\'+x.id+\')\'\">\n                  </span>\n                </div>\n                <div\n                  geodash-btn mode=\"edit\"\n                  target=\"#editor-field-{{ field_flat }}\"\n                  info=\"Edit field\"\n                  tooltip-placement=\"bottom\"\n                  class=\"geodash-intent\"\n                  data-intent-name=\"showModal\"\n                  data-intent-data=\"{{ html5data(\'showModal\', \'geodash-modal-edit-field\', field) }}\"\n                  data-intent-ctrl=\"{{ config.that.id }}\"></div>\n                <div\n                  geodash-btn mode=\"clear\"\n                  target=\"#editor-field-{{ field_flat }}\"\n                  info=\"Clear field\"\n                  tooltip-placement=\"bottom\"></div>\n              </div>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n    <hr>\n    <div class=\"form-group\">\n      <div class=\"col-sm-offset-3 col-sm-9\">\n        <button\n          type=\"button\"\n          class=\"btn btn-success\"\n          ng-click=\"saveConfig()\"\n          ng-disabled=\"\'change_geodashdashboard\' | inArray : perms | not\"\n        >Save</button>\n        <button\n          type=\"button\"\n          class=\"btn btn-success\"\n          ng-click=\"saveAsConfig()\"\n        >Save As ...</button>\n        <button\n          type=\"button\"\n          class=\"btn btn-default\">Reset</button>\n        <a\n          class=\"geodash-intent btn btn-primary\"\n          data-intent-name=\"showModal\"\n          data-intent-data=\"{{ config.html5data.modal_dashboard_config }}\"\n          data-intent-ctrl=\"{{ config.that.id }}\">Config</a>\n        <a\n          class=\"geodash-intent btn btn-primary\"\n          data-intent-name=\"showModal\"\n          data-intent-data=\"{{ config.html5data.modal_dashboard_security }}\"\n          data-intent-ctrl=\"{{ config.that.id }}\">Security</a>\n      </div>\n    </div>\n  </form>\n</div>\n";
geodash.templates["modal_edit_field.tpl.html"] = "<div\n  id=\"geodash-modal-edit-field\"\n  class=\"geodash-controller geodash-controller-modal geodash-modal modal fade geodash-edit-field\"\n  tabindex=\"-1\"\n  role=\"dialog\"\n  aria-labelledby=\"myModalLabel\">\n  <div id=\"geodash-edit-field\" class=\"modal-dialog geodash-responsive\" data-backdrop=\"static\" role=\"document\">\n    <div\n      ng-if=\"showModal(path)\"\n      class=\"modal-content\">\n      <div class=\"modal-header\">\n        <button type=\"button\" class=\"close\" aria-hidden=\"true\" ng-click=\"go_back()\"><i class=\"fa fa-times\"></i></button>\n        <h4 id=\"myModalLabel\" class=\"modal-title\"><span>Edit</span><span ng-repeat-start=\"x in breadcrumbs track by $index\"> / </span><span ng-if=\"$last\" ng-bind-html=\"x.content\"></span><a ng-repeat-end ng-if=\"! $last\" ng-click=\"rollback($index)\" role=\"button\" ng-bind-html=\"x.content\"></a></h4>\n      </div>\n      <div class=\"modal-body\">\n        <div geodash-tabs></div>\n        <div class=\"tab-content\">\n          <div\n            id=\"modal-edit-field-pane-input\"\n            role=\"tabpanel\"\n            class=\"tab-pane fade\"\n            style=\"padding: 10px;\">\n            <div\n              ng-if=\"schema | extract : schemapath : \'type\' | inArray: [\'text\', \'string\', \'markdown\', \'md\']\">\n              <textarea\n                id=\"modal-edit-field-{{ path_flat }}\"\n                name=\"modal-edit-field-{{ path_flat }}\"\n                class=\"form-control\"\n                placeholder=\"{{ schema | extract : schemapath : \'placeholder\' }}\"\n                rows=\"15\"\n                data-geodash-field-type=\"{{ schema | extract : schemapath : \'type\' }}\"\n                ng-required=\"schema | extract : schemapath : \'required\'\"\n                style=\"max-width: 100%;\"\n                ng-model=\"value_edit_field\"\n                ng-change=\"validateModalField()\"></textarea>\n            </div>\n            <div\n              ng-if=\"schema | extract : schemapath : \'type\' | inArray: [\'textarray\', \'stringarray\']\">\n              <div class=\"input-group\">\n                <input\n                  id=\"editor-field-{{ path_flat }}-backend\"\n                  name=\"editor-field-{{ path_flat }}-backend\"\n                  type=\"text\"\n                  class=\"form-control\"\n                  style=\"display:none;\">\n                <div\n                  class=\"input-group-addon btn btn-primary\"\n                  data-toggle=\"tooltip\"\n                  data-placement=\"bottom\"\n                  ng-attr-title=\"{{ schema | extract : schemapath : \'description\' }}\">\n                  <i class=\"fa fa-info-circle\"></i>\n                </div>\n                <div\n                  id=\"editor-field-{{ path_flat }}-label\"\n                  name=\"editor-field-{{ path_flat }}-label\"\n                  class=\"input-group-addon\"\n                  ng-bind-html=\"schema | extract : schemapath : \'label\'\">\n                </div>\n                <input\n                  id=\"editor-field-{{ path_flat }}\"\n                  name=\"editor-field-{{ path_flat }}\"\n                  type=\"text\"\n                  class=\"typeahead form-control\"\n                  style=\"height: auto;\"\n                  data-geodash-field-type=\"{{ schema | extract : schemapath : \'type\' }}\"\n                  ng-required=\"schema | extract : schemapath : \'required\'\"\n                  aria-describedby=\"editor-field-{{ path_flat }}-label\"\n                  data-initial-data=\"{{ schema | extract : schemapath : \'source\' }}\"\n                  data-backend=\"editor-field-{{ path_flat }}-backend\"\n                  data-template-empty=\"<div class=&quot;alert alert-danger empty-message&quot;>Unable to find value</div>\"\n                  ng-keyup=\"keyUpOnField($event, path, path_flat)\">\n                <div\n                  class=\"input-group-addon btn btn-primary btn-show-options\"\n                  data-toggle=\"tooltip\"\n                  data-placement=\"bottom\"\n                  title=\"Show Options.\"\n                  ng-click=\"showOptions($event, \'#editor-field-\'+path_flat)\">\n                  <i class=\"fa fa-chevron-down\"></i>\n                </div>\n                <div\n                  class=\"input-group-addon btn btn-success btn-add\"\n                  data-toggle=\"tooltip\"\n                  data-placement=\"bottom\"\n                  title=\"Prepend to list of layers.\"\n                  ng-click=\"prependToField($event)\">\n                  <i class=\"fa fa-plus\"></i>\n                </div>\n                <div\n                  class=\"input-group-addon btn btn-danger btn-clear\"\n                  data-target=\"#editor-field-{{ path_flat }}\"\n                  data-toggle=\"tooltip\"\n                  data-placement=\"bottom\"\n                  title=\"Clear new layer text.\">\n                  <i class=\"fa fa-times\"></i>\n                </div>\n              </div>\n              <br>\n              <div\n                ng-repeat=\"x in workspace | extract : path track by $index\"\n                class=\"input-group\"\n                style=\"margin-bottom: 4px;\">\n                <div\n                  class=\"input-group-addon btn btn-default\"\n                  style=\"font-weight: bold;\"\n                  ng-bind-html=\"$index\">\n                </div>\n                <div\n                  ng-class=\"$first ? \'input-group-addon btn btn-default\' : \'input-group-addon btn btn-primary\'\"\n                  ng-disabled=\"$first\"\n                  ng-click=\"up($event, $index)\">\n                  <i class=\"fa fa-arrow-up\"></i>\n                </div>\n                <div\n                  ng-class=\"$last ? \'input-group-addon btn btn-default\' : \'input-group-addon btn btn-primary\'\"\n                  ng-disabled=\"$last\"\n                  ng-click=\"down($event, $index)\">\n                  <i class=\"fa fa-arrow-down\"></i>\n                </div>\n                <input\n                  id=\"editor-field-{{ path_flat }}-{{ $index }}\"\n                  name=\"editor-field-{{ path_flat }}-{{ $index }}\"\n                  type=\"text\"\n                  class=\"form-control\"\n                  ng-value=\"x\">\n                <div\n                  class=\"input-group-addon btn btn-danger btn-clear\"\n                  ng-click=\"subtractFromField($event, $index)\">\n                  <i class=\"fa fa-times\"></i>\n                </div>\n              </div>\n            </div>\n            <div\n              ng-if=\"schema | extract : schemapath : \'type\' | inArray: [\'objectarray\', \'objarray\']\">\n              <div>\n                <div\n                  class=\"btn btn-primary\"\n                  data-toggle=\"tooltip\"\n                  data-placement=\"bottom\"\n                  ng-attr-title=\"{{ schema | extract : schemapath : \'description\' }}\">\n                  <i class=\"fa fa-info-circle\"></i>\n                </div>\n                <div\n                  class=\"btn btn-success\"\n                  data-toggle=\"tooltip\"\n                  data-placement=\"bottom\"\n                  title=\"Prepend to list.\"\n                  ng-click=\"add_object()\">\n                  <i class=\"fa fa-plus\"></i>\n                </div>\n              </div>\n              <br>\n              <div\n                ng-repeat=\"x in workspace | extract : path track by $index\"\n                class=\"input-group\"\n                style=\"margin-bottom: 4px;\">\n                <div\n                  class=\"input-group-addon btn btn-default\"\n                  style=\"font-weight: bold;\"\n                  ng-bind-html=\"$index\">\n                </div>\n                <div\n                  ng-class=\"$first ? \'input-group-addon btn btn-default\' : \'input-group-addon btn btn-primary\'\"\n                  ng-disabled=\"$first\"\n                  ng-click=\"up($event, $index)\">\n                  <i class=\"fa fa-arrow-up\"></i>\n                </div>\n                <div\n                  ng-class=\"$last ? \'input-group-addon btn btn-default\' : \'input-group-addon btn btn-primary\'\"\n                  ng-disabled=\"$last\"\n                  ng-click=\"down($event, $index)\">\n                  <i class=\"fa fa-arrow-down\"></i>\n                </div>\n                <span\n                  id=\"editor-field-{{ path_flat }}-{{ $index }}\"\n                  name=\"editor-field-{{ path_flat }}-{{ $index }}\"\n                  type=\"text\"\n                  class=\"form-control btn btn-primary input-group-addon\"\n                  style=\"line-height: 1.42857143;\"\n                  ng-bind-html=\"x.id | default_if_undefined : (x | json)\"\n                  ng-click=\"edit_object($index)\"></span>\n                <a\n                  class=\"input-group-addon btn btn-primary\"\n                  href=\"#\"\n                  ng-click=\"edit_object($index)\">\n                  <i class=\"fa fa-pencil-square-o \"></i>\n                </a>\n                <div\n                  class=\"input-group-addon btn btn-danger btn-clear\"\n                  ng-click=\"subtractFromField($event, $index)\">\n                  <i class=\"fa fa-times\"></i>\n                </div>\n              </div>\n            </div>\n          </div>\n          <div\n            id=\"modal-edit-field-pane-yaml\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <h4 ng-bind-html=\"schema | extract : path : \'schema\' : \'verbose_singular\' | default_if_undefined : \'Field\' | append : \' as YAML\'\"></h4>\n            <pre style=\"word-wrap: break-word; white-space: pre-wrap;\">{{ workspace | extract : path | yaml : 8 }}</pre>\n          </div>\n          <div\n            id=\"modal-edit-field-pane-json\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <h4 ng-bind-html=\"schema | extract : path : \'schema\' : \'verbose_singular\' | default_if_undefined : \'Field\' | append : \' as JSON\'\"></h4>\n            <pre style=\"word-wrap: break-word; white-space: pre-wrap;\">{{ workspace | extract : path | json }}</pre>\n          </div>\n        </div>\n        <hr>\n        <div\n          class=\"btn btn-danger btn-clear\"\n          data-target=\"#modal-edit-field-{{ path_flat }}, #editor-field-{{ path_flat }}\">\n          <i class=\"fa fa-times\"></i>\n        </div>\n      </div>\n      <div class=\"modal-footer\">\n        <button\n          type=\"button\"\n          class=\"btn btn-success\"\n          ng-bind-html=\"save_label()\"\n          ng-click=\"save_object()\"></button>\n        <button\n          type=\"button\"\n          class=\"btn btn-default\"\n          ng-bind-html=\"back_label()\"\n          ng-click=\"go_back()\"></button>\n      </div>\n    </div>\n  </div>\n</div>\n";
geodash.templates["modal_edit_object.tpl.html"] = "<div\n  id=\"geodash-modal-edit-object\"\n  class=\"geodash-controller geodash-controller-modal geodash-modal modal fade geodash-edit-object\"\n  tabindex=\"-1\"\n  role=\"dialog\"\n  aria-labelledby=\"myModalLabel\">\n  <div id=\"geodash-edit-object\" class=\"modal-dialog geodash-responsive\" data-backdrop=\"static\" role=\"document\">\n    <div\n      ng-if=\"showModal(objectIndex)\"\n      class=\"modal-content\">\n      <div class=\"modal-header\">\n        <button type=\"button\" class=\"close\" aria-hidden=\"true\" ng-click=\"go_back()\"><i class=\"fa fa-times\"></i></button>\n        <h4 id=\"myModalLabel\" class=\"modal-title\"><span>Edit</span><span ng-repeat-start=\"x in breadcrumbs track by $index\"> / </span><span ng-if=\"$last\" ng-bind-html=\"x.content\"></span><a ng-repeat-end ng-if=\"! $last\" ng-click=\"rollback($index)\" role=\"button\" ng-bind-html=\"x.content\"></a></h4>\n      </div>\n      <div class=\"modal-body\">\n        <div geodash-tabs></div>\n        <div class=\"tab-content\">\n          <div\n            id=\"modal-edit-object-pane-input\"\n            role=\"tabpanel\"\n            class=\"tab-pane fade active in\"\n            style=\"padding: 10px;overflow-y: scroll; max-height:240px;\">\n            <form\n              novalidate\n              class=\"form-horizontal simple-form\"\n              ng-if=\"objectIndex != undefined\"\n              style=\"padding-bottom:20px;\">\n              <!--\n                Doesn\'t rerun ng-repeat beacuse object_schema.fields is the same\n                Need ng-repeat to be forced to run again when field changes.\n                Throw in a fake ng-if on objectIndex??\n              -->\n              <div\n                ng-repeat=\"object_field in object_fields track by $index\"\n                ng-init=\"objectFieldIndex = $index; object_field_id = object_field.id; object_field_path = (object_field.id | prepend : path : \'.\'); object_field_id_flat = (object_field.id | replace : \'.\' : \'__\' | prepend : path_flat : \'__\')\"\n                class=\"form-group\"\n                style=\"margin:0; padding-top: 10px; padding-bottom: 10px;\"\n                ng-if=\"when(object_field)\"\n                <!-- Start -->\n                <div\n                  ng-if=\"object_field | extract : \'type\' | inArray: [\'text\', \'template\', \'string\', \'markdown\', \'md\']\">\n                  <div geodash-label\n                    target=\"editor-object-field-{{ object_field_id_flat }}\"\n                    content=\"{{ object_field | extract : \'label\'}}\"></div>\n                  <div class=\"col-sm-9\" style=\"max-width: 600px;\">\n                    <div\n                      ng-if=\"object_field | extract : \'multiline\' | default_if_undefined: \'false\' | inArray: [false, \'false\', \'no\', 0]\"\n                      class=\"input-group\">\n                      <div\n                        geodash-btn-info info=\"{{ object_field | extract : \'description\' }}\"></div>\n                      <div\n                        ng-if=\"object_field | extract : \'type\' | inArray : [\'template\']\"\n                        class=\"input-group-addon btn btn-primary\"\n                        data-toggle=\"tooltip\"\n                        data-placement=\"bottom\"\n                        title=\"Can use Angular Templates and Filters (.e.g, feature.geometry.lat | number : 4)\"><i class=\"fa fa-code\"></i></div>\n                      <input\n                        ng-if=\"object_field | extract : \'options\' | default_if_undefined : [] | length | eq: 0\"\n                        id=\"editor-object-field-{{ object_field_id_flat }}\"\n                        name=\"editor-object-field-{{ object_field_id_flat }}\"\n                        type=\"text\"\n                        class=\"form-control\"\n                        placeholder=\"{{ object_field | extract : \'placeholder\' }}\"\n                        data-geodash-field-type=\"{{ object_field | extract : \'type\' }}\"\n                        ng-required=\"object_field | extract : \'required\'\"\n                        ng-value=\"workspace_flat | extract : object_field_id_flat\"\n                        ng-model=\"workspace_flat[object_field_id_flat]\"\n                        ng-change=\"validateField(object_field_id_flat)\">\n                      <input\n                        ng-if=\"object_field | extract : \'options\' | default_if_undefined : [] | length | gt: 0\"\n                        id=\"editor-object-field-{{ object_field_id_flat }}-backend\"\n                        name=\"editor-object-field-{{ object_field_id_flat }}-backend\"\n                        type=\"text\"\n                        class=\"form-control\"\n                        style=\"display:none;\"\n                        ng-value=\"workspace_flat | extract : object_field_id_flat\"\n                        ng-model=\"workspace_flat[object_field_id_flat]\"\n                        ng-change=\"validateField(object_field_id_flat)\">\n                      <input\n                        ng-if=\"object_field | extract : \'options\' | default_if_undefined : [] | length | gt: 0\"\n                        id=\"editor-object-field-{{ object_field_id_flat }}\"\n                        name=\"editor-object-field-{{ object_field_id_flat }}\"\n                        type=\"text\"\n                        class=\"typeahead form-control\"\n                        placeholder=\"{{ object_field | extract : \'placeholder\' }}\"\n                        data-geodash-field-type=\"{{ object_field | extract : \'type\' }}\"\n                        data-initial-data=\"{{ object_field | extract : \'options\' }}\"\n                        data-backend=\"editor-object-field-{{ object_field_id_flat }}-backend\"\n                        ng-value=\"workspace_flat | extract : object_field_id_flat\">\n                      <div\n                        ng-if=\"object_field | extract : \'options\' | default_if_undefined : [] | length | gt: 0\"\n                        class=\"input-group-addon btn btn-primary btn-show-options\"\n                        data-toggle=\"tooltip\"\n                        data-placement=\"bottom\"\n                        title=\"Show Options.\"\n                        ng-click=\"showOptions($event, \'#editor-object-field-\' + object_field_id_flat)\">\n                        <i class=\"fa fa-chevron-down\"></i>\n                      </div>\n                      <div\n                        geodash-btn mode=\"clear\"\n                        target=\"#editor-object-field-{{ object_field_id_flat }}\"\n                        info=\"Clear field\"\n                        tooltip-placement=\"bottom\"></div>\n                    </div>\n                    <div\n                      ng-if=\"object_field | extract : \'multiline\' | default_if_undefined: \'false\' | parseTrue\"\n                      class=\"input-group\">\n                      <div geodash-btn-info info=\"{{ object_field | extract : \'description\' }}\"></div>\n                      <textarea\n                        id=\"editor-object-field-{{ object_field_id_flat }}\"\n                        name=\"editor-object-field-{{ object_field_id_flat }}\"\n                        class=\"form-control\"\n                        placeholder=\"{{ object_field | extract : \'placeholder\' }}\"\n                        rows=\"3\"\n                        data-geodash-field-type=\"{{ object_field | extract : \'type\' }}\"\n                        ng-required=\"object_field | extract : \'required\'\"\n                        style=\"max-width: 100%;\"\n                        ng-model=\"workspace_flat[object_field_id_flat]\"\n                        ng-change=\"validateField(object_field_id_flat)\"\n                        ng-bind-html=\"workspace_flat | extract : object_field_id_flat\"></textarea>\n                      <div\n                        geodash-btn mode=\"clear\"\n                        target=\"#editor-object-field-{{ object_field_id_flat }}\"\n                        info=\"Clear field\"\n                        tooltip-placement=\"bottom\"></div>\n                    </div>\n                  </div>\n                </div>\n                <div ng-if=\"object_field | extract : \'type\' | inArray: [\'int\', \'integer\']\">\n                  <div>\n                    <div geodash-label\n                      target=\"editor-object-field-{{ object_field_id_flat }}\"\n                      content=\"{{ object_field | extract : \'label\'}}\"></div>\n                    <div class=\"col-sm-9\" style=\"max-width: 600px;\">\n                      <div class=\"input-group\">\n                        <div geodash-btn-info info=\"{{ object_field | extract : \'description\' }}\"></div>\n                        <input\n                          id=\"editor-object-field-{{ object_field_id_flat }}\"\n                          name=\"editor-object-field-{{ object_field_id_flat }}\"\n                          type=\"number\"\n                          class=\"form-control\"\n                          placeholder=\"{{ object_field | extract : \'placeholder\' }}\"\n                          data-geodash-field-type=\"{{ object_field | extract : \'type\' }}\"\n                          ng-required=\"object_field | extract : \'required\'\"\n                          ng-attr-min=\"{{ object_field | extract : \'minValue\' | default_if_undefined: \'\' }}\"\n                          ng-attr-max=\"{{ object_field | extract : \'maxValue\' | default_if_undefined: \'\' }}\"\n                          ng-value=\"workspace_flat | extract : object_field_id_flat\"\n                          ng-model=\"workspace_flat[object_field_id_flat]\"\n                          ng-change=\"validateField(object_field_id_flat)\">\n                        <div\n                          geodash-btn mode=\"clear\"\n                          target=\"#editor-object-field-{{ object_field_id_flat }}\"\n                          info=\"Clear field\"\n                          tooltip-placement=\"bottom\"></div>\n                      </div>\n                    </div>\n                  </div>\n                </div>\n                <div\n                  ng-if=\"object_field | extract : \'type\' | inArray: [\'boolean\', \'checkbox\']\"\n                  class=\"col-sm-offset-2 col-sm-10\">\n                  <div class=\"checkbox\">\n                    <label>\n                      <input\n                        type=\"checkbox\"\n                        ng-checked=\"workspace_flat | extract : object_field_id_flat\"\n                        ng-model=\"workspace_flat[object_field_id_flat]\"\n                        ng-change=\"validateField(object_field_id_flat)\"> {{ object_field | extract : \'label\' }}\n                    </label>\n                  </div>\n                </div>\n                <div ng-if=\"object_field | extract : \'type\' | inArray: [\'obj\', \'object\']\">\n                  <div geodash-label\n                    target=\"editor-object-field-{{ object_field_id_flat }}\"\n                    content=\"{{ object_field | extract : \'label\'}}\"></div>\n                  <div class=\"col-sm-9\" style=\"max-width: 600px;\">\n                    <div class=\"input-group\">\n                      <div geodash-btn-info info=\"{{ object_field | extract : \'description\' }}\"></div>\n                      <span\n                        id=\"editor-field-{{ field_flat }}-{{ $index }}\"\n                        name=\"editor-field-{{ field_flat }}-{{ $index }}\"\n                        type=\"text\"\n                        class=\"form-control btn btn-primary input-group-addon\"\n                        style=\"line-height: 1.42857143;\"\n                        ng-bind-html=\"verbose_title(object_field_id)\"\n                        ng-click=\"edit_object(object_field_id, objectFieldIndex)\"></span>\n                      <div\n                        target=\"#editor-object-field-{{ object_field_id_flat }}\"\n                        data-toggle=\"tooltip\"\n                        ng-attr-title=\"Edit field\"\n                        tooltip-placement=\"bottom\"\n                        class=\"input-group-addon btn btn-primary\"\n                        ng-click=\"edit_object(object_field_id, objectFieldIndex)\">\n                        <i class=\"fa fa-pencil-square-o\"></i></div>\n                      <div\n                        geodash-btn mode=\"clear\"\n                        target=\"#editor-object-field-{{ object_field_id_flat }}\"\n                        info=\"Clear field\"\n                        tooltip-placement=\"bottom\"></div>\n                    </div>\n                  </div>\n                </div>\n                <div ng-if=\"object_field | extract : \'type\' | inArray: [\'stringarray\', \'textarray\', \'templatearray\']\">\n                  <div geodash-label\n                    target=\"editor-object-field-{{ object_field_id_flat }}\"\n                    content=\"{{ object_field | extract : \'label\'}}\"></div>\n                  <div class=\"col-sm-9\" style=\"max-width: 600px;\">\n                    <div class=\"input-group\">\n                      <div geodash-btn-info info=\"{{ object_field | extract : \'description\' }}\"></div>\n                      <div\n                        class=\"form-control\"\n                        style=\"height: auto; min-height: 28px; max-height: 100px;overflow-y: scroll;\"\n                        disabled>\n                        <span\n                          ng-repeat=\"x in workspace | extract : object_field_path track by $index\"\n                          class=\"\"\n                          style=\"width: 400px; height: 20px; text-overflow: ellipsis; display: block;white-space: nowrap; overflow: hidden;\"\n                          ng-bind-html=\"x\">\n                        </span>\n                      </div>\n                      <div\n                        geodash-btn mode=\"clear\"\n                        target=\"#editor-object-field-{{ object_field_id_flat }}\"\n                        info=\"Clear field\"\n                        tooltip-placement=\"bottom\"></div>\n                    </div>\n                  </div>\n                </div>\n                <div\n                  ng-if=\"object_field | extract : \'type\' | inArray: [\'objectarray\', \'objarray\']\">\n                  <div geodash-label\n                    target=\"editor-object-field-{{ object_field_id_flat }}\"\n                    content=\"{{ object_field | extract : \'label\'}}\"></div>\n                  <div class=\"col-sm-9\" style=\"max-width: 600px;\">\n                    <div class=\"input-group\">\n                      <div geodash-btn-info info=\"{{ object_field | extract : \'description\' }}\"></div>\n                      <div\n                        class=\"form-control\"\n                        style=\"height: auto; min-height: 28px;max-height: 100px;overflow-y: scroll;\"\n                        disabled>\n                        <span\n                          ng-repeat=\"x in workspace | extract : object_field_path track by $index\"\n                          class=\"\"\n                          style=\"width: 400px; height: 20px; text-overflow: ellipsis; display: block;white-space: nowrap; overflow: hidden;\"\n                          ng-bind-html=\"x.id | default_if_undefined : (x | json) | prepend : $index : \' | \'\">\n                        </span>\n                      </div>\n                      <div\n                        target=\"#editor-object-field-{{ object_field_id_flat }}\"\n                        data-toggle=\"tooltip\"\n                        ng-attr-title=\"Edit field\"\n                        tooltip-placement=\"bottom\"\n                        class=\"input-group-addon btn btn-primary\"\n                        ng-click=\"edit_field(object_field_id, objectFieldIndex)\">\n                        <i class=\"fa fa-pencil-square-o\"></i></div>\n                      <div\n                        geodash-btn mode=\"clear\"\n                        target=\"#editor-object-field-{{ object_field_id_flat }}\"\n                        info=\"Clear field\"\n                        tooltip-placement=\"bottom\"></div>\n                    </div>\n                  </div>\n                </div>\n                <!-- End -->\n              </div>\n            </form>\n          </div>\n          <div\n            id=\"modal-edit-object-pane-yaml\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <h4 ng-bind-html=\"schema | extract : path : \'schema\' : \'verbose_singular\' | default_if_undefined : \'Object\' | append : \' as YAML\'\"></h4>\n            <pre style=\"word-wrap: break-word; white-space: pre-wrap;\">{{ workspace | extract : path | yaml : 8 }}</pre>\n          </div>\n          <div\n            id=\"modal-edit-object-pane-json\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <h4 ng-bind-html=\"schema | extract : path : \'schema\' : \'verbose_singular\' | default_if_undefined : \'Object\' | append : \' as JSON\'\"></h4>\n            <pre style=\"word-wrap: break-word; white-space: pre-wrap;\">{{ workspace | extract : path | json }}</pre>\n          </div>\n        </div>\n      </div>\n      <div class=\"modal-footer\">\n        <button\n          type=\"button\"\n          class=\"btn btn-success\"\n          ng-bind-html=\"save_label()\"\n          ng-click=\"save_object()\"></button>\n        <button\n          type=\"button\"\n          class=\"btn btn-default\"\n          ng-bind-html=\"back_label()\"\n          ng-click=\"go_back()\"></button>\n      </div>\n    </div>\n  </div>\n</div>\n";
geodash.templates["geodash_modal_dashboard_config.tpl.html"] = "<div\n  class=\"geodash-controller geodash-controller-modal geodash-modal modal fade geodash-dashboard-config\"\n  tabindex=\"-1\"\n  role=\"dialog\"\n  aria-labelledby=\"myModalLabel\">\n  <div class=\"modal-dialog geodash-responsive\" role=\"document\">\n    <div class=\"modal-content\">\n      <div class=\"modal-header\">\n        <button geodash-btn-close></button>\n        <h4 class=\"modal-title\" id=\"myModalLabel\">Configuration / {{ workspace.config.title }}</h4>\n      </div>\n      <div class=\"modal-body\">\n        <div>\n          <div geodash-tabs></div>\n          <div class=\"tab-content\">\n            <div\n              id=\"modal-dashboard-config-projects\"\n              class=\"tab-pane fade in active\"\n              role=\"tabpanel\"\n              style=\"padding: 10px;\">\n              <h3>Projects</h3>\n              <table class=\"table\">\n                <thead>\n                  <tr>\n                    <th>#</th>\n                    <th>Name</th>\n                    <th>Version</th>\n                    <th>Description</th>\n                  </tr>\n                </thead>\n                <tbody>\n                  <tr ng-repeat=\"project in meta.projects track by $index\">\n                    <th scope=\"row\" ng-bind-html=\"$index\"></th>\n                    <td ng-bind-html=\"project.name\"></td>\n                    <td ng-bind-html=\"project.version\"></td>\n                    <td ng-bind-html=\"project.description\"></td>\n                  </tr>\n                </tbody>\n              </table>\n            </div>\n            <div\n              id=\"modal-dashboard-config-plugins\"\n              class=\"tab-pane fade in active\"\n              role=\"tabpanel\"\n              style=\"padding: 10px;\">\n              <h3>Plugins</h3>\n              <table class=\"table\">\n                <thead>\n                  <tr>\n                    <th>#</th>\n                    <th>Project</th>\n                    <th>Name</th>\n                    <th>Version</th>\n                  </tr>\n                </thead>\n                <tbody>\n                  <tr ng-repeat=\"plugin in meta.plugins track by $index\">\n                    <th scope=\"row\" ng-bind-html=\"$index\"></th>\n                    <td ng-bind-html=\"plugin.project\"></td>\n                    <td ng-bind-html=\"plugin.id\"></td>\n                    <td ng-bind-html=\"plugin.version\"></td>\n                  </tr>\n                </tbody>\n              </table>\n            </div>\n            <div\n              id=\"modal-dashboard-config-directives\"\n              class=\"tab-pane fade in active\"\n              role=\"tabpanel\"\n              style=\"padding: 10px;\">\n              <h3>Directives</h3>\n              <table class=\"table\">\n                <thead>\n                  <tr>\n                    <th>#</th>\n                    <th>Name</th>\n                  </tr>\n                </thead>\n                <tbody>\n                  <tr ng-repeat=\"directive in meta.directives track by $index\">\n                    <th scope=\"row\" ng-bind-html=\"$index\"></th>\n                    <td ng-bind-html=\"directive\"></td>\n                  </tr>\n                </tbody>\n              </table>\n            </div>\n            <div\n              id=\"modal-dashboard-config-templates\"\n              class=\"tab-pane fade in active\"\n              role=\"tabpanel\"\n              style=\"padding: 10px;\">\n              <h3>Templates</h3>\n              <table class=\"table\">\n                <thead>\n                  <tr>\n                    <th>#</th>\n                    <th>Name</th>\n                  </tr>\n                </thead>\n                <tbody>\n                  <tr ng-repeat=\"template in meta.templates track by $index\">\n                    <th scope=\"row\" ng-bind-html=\"$index\"></th>\n                    <td ng-bind-html=\"template\"></td>\n                  </tr>\n                </tbody>\n              </table>\n            </div>\n            <div\n              id=\"modal-dashboard-config-filters\"\n              class=\"tab-pane fade in active\"\n              role=\"tabpanel\"\n              style=\"padding: 10px;\">\n              <h3>Filters</h3>\n              <table class=\"table\">\n                <thead>\n                  <tr>\n                    <th>#</th>\n                    <th>Name</th>\n                  </tr>\n                </thead>\n                <tbody>\n                  <tr ng-repeat=\"filter in meta.filters track by $index\">\n                    <th scope=\"row\" ng-bind-html=\"$index\"></th>\n                    <td ng-bind-html=\"filter\"></td>\n                  </tr>\n                </tbody>\n              </table>\n            </div>\n            <div\n              id=\"modal-dashboard-config-yaml\"\n              class=\"tab-pane fade\"\n              role=\"tabpanel\"\n              style=\"padding: 10px;\">\n              <nav class=\"navbar navbar-default\">\n                <div class=\"container-fluid\">\n                  <div class=\"navbar-header\">\n                    <button\n                      type=\"button\"\n                      class=\"collapsed navbar-toggle\"\n                      data-toggle=\"collapse\"\n                      data-target=\"#geodash-config-yaml-navbar-collapse\"\n                      aria-expanded=\"false\">\n                      <span class=\"sr-only\">Toggle navigation</span>\n                      <span class=\"icon-bar\"></span>\n                      <span class=\"icon-bar\"></span>\n                      <span class=\"icon-bar\"></span>\n                    </button>\n                    <div class=\"navbar-brand\">\n                      <p class=\"navbar-text\" style=\"color:rgb(85,85,85);font-size:24px;\">Dashboard Configration as YAML</p>\n                    </div>\n                  </div>\n                  <div class=\"collapse navbar-collapse\" id=\"geodash-config-yaml-navbar-collapse\">\n                    <div class=\"navbar-form navbar-right\">\n                      <a class=\"btn btn-primary\" data-toggle=\"collapse\" data-target=\"#geodash-config-yaml-preview\">Show/Hide</a>\n                      <a class=\"btn btn-primary\" href=\"/api/dashboard/config/geodash_dashboard_{{ workspace.config.slug}}.yml\" target=\"_blank\">Download</a>\n                    </div>\n                  </div>\n                </div>\n              </nav>\n              <pre\n                id=\"geodash-config-yaml-preview\"\n                class=\"collapse\"\n                style=\"word-wrap: break-word; white-space: pre-wrap;\">{{ workspace.config | yaml : 8 }}</pre>\n            </div>\n            <div\n              id=\"modal-dashboard-config-json\"\n              class=\"tab-pane fade\"\n              role=\"tabpanel\"\n              style=\"padding: 10px;\">\n              <nav class=\"navbar navbar-default\">\n                <div class=\"container-fluid\">\n                  <div class=\"navbar-header\">\n                    <button\n                      type=\"button\"\n                      class=\"collapsed navbar-toggle\"\n                      data-toggle=\"collapse\"\n                      data-target=\"#geodash-config-json-navbar-collapse\"\n                      aria-expanded=\"false\">\n                      <span class=\"sr-only\">Toggle navigation</span>\n                      <span class=\"icon-bar\"></span>\n                      <span class=\"icon-bar\"></span>\n                      <span class=\"icon-bar\"></span>\n                    </button>\n                    <div class=\"navbar-brand\">\n                      <p class=\"navbar-text\" style=\"color:rgb(85,85,85);font-size:24px;\">Dashboard Configration as JSON</p>\n                    </div>\n                  </div>\n                  <div class=\"collapse navbar-collapse\" id=\"geodash-config-json-navbar-collapse\">\n                    <div class=\"navbar-form navbar-right\">\n                      <a class=\"btn btn-primary\" data-toggle=\"collapse\" data-target=\"#geodash-config-json-preview\">Show/Hide</a>\n                      <a class=\"btn btn-primary\" href=\"/api/dashboard/config/geodash_dashboard_{{ workspace.config.slug }}.json\" target=\"_blank\">Download</a>\n                    </div>\n                  </div>\n                </div>\n              </nav>\n              <pre\n                id=\"geodash-config-json-preview\"\n                class=\"collapse\"\n                style=\"word-wrap: break-word; white-space: pre-wrap;\">{{ workspace.config | json }}</pre>\n            </div>\n          </div>\n        </div>\n      </div>\n      <div class=\"modal-footer\">\n        <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n      </div>\n    </div>\n  </div>\n</div>\n";
geodash.templates["geodash_modal_dashboard_security.tpl.html"] = "<div\n  class=\"geodash-controller geodash-controller-modal geodash-modal modal fade geodash-dashboard-security\"\n  tabindex=\"-1\"\n  role=\"dialog\"\n  aria-labelledby=\"myModalLabel\">\n  <div class=\"modal-dialog geodash-responsive\" role=\"document\">\n    <div class=\"modal-content\">\n      <div class=\"modal-header\">\n        <button geodash-btn-close></button>\n        <h4 class=\"modal-title\" id=\"myModalLabel\">Security / {{ workspace.config.title }}</h4>\n      </div>\n      <div class=\"modal-body\">\n        <div>\n          <div geodash-tabs></div>\n          <div class=\"tab-content\">\n            <div\n              id=\"modal-dashboard-security-pane-yaml\"\n              class=\"tab-pane fade\"\n              role=\"tabpanel\"\n              style=\"padding: 10px;\">\n              <nav class=\"navbar navbar-default\">\n                <div class=\"container-fluid\">\n                  <div class=\"navbar-header\">\n                    <button\n                      type=\"button\"\n                      class=\"collapsed navbar-toggle\"\n                      data-toggle=\"collapse\"\n                      data-target=\"#geodash-config-yaml-navbar-collapse\"\n                      aria-expanded=\"false\">\n                      <span class=\"sr-only\">Toggle navigation</span>\n                      <span class=\"icon-bar\"></span>\n                      <span class=\"icon-bar\"></span>\n                      <span class=\"icon-bar\"></span>\n                    </button>\n                    <div class=\"navbar-brand\">\n                      <p class=\"navbar-text\" style=\"color:rgb(85,85,85);font-size:24px;\">Security as YAML</p>\n                    </div>\n                  </div>\n                  <div class=\"collapse navbar-collapse\" id=\"geodash-security-yaml-navbar-collapse\">\n                    <div class=\"navbar-form navbar-right\">\n                      <a class=\"btn btn-primary\" data-toggle=\"collapse\" data-target=\"#geodash-security-yaml-preview\">Show/Hide</a>\n                      <a class=\"btn btn-primary\" href=\"/api/dashboard/security/geodash_dashboard_{{ workspace.config.slug}}.yml\" target=\"_blank\">Download</a>\n                    </div>\n                  </div>\n                </div>\n              </nav>\n              <pre\n                id=\"geodash-security-yaml-preview\"\n                class=\"collapse\"\n                style=\"word-wrap: break-word; white-space: pre-wrap;\">{{ workspace.security | yaml : 8 }}</pre>\n            </div>\n            <div\n              id=\"modal-dashboard-security-pane-json\"\n              class=\"tab-pane fade\"\n              role=\"tabpanel\"\n              style=\"padding: 10px;\">\n              <nav class=\"navbar navbar-default\">\n                <div class=\"container-fluid\">\n                  <div class=\"navbar-header\">\n                    <button\n                      type=\"button\"\n                      class=\"collapsed navbar-toggle\"\n                      data-toggle=\"collapse\"\n                      data-target=\"#geodash-config-json-navbar-collapse\"\n                      aria-expanded=\"false\">\n                      <span class=\"sr-only\">Toggle navigation</span>\n                      <span class=\"icon-bar\"></span>\n                      <span class=\"icon-bar\"></span>\n                      <span class=\"icon-bar\"></span>\n                    </button>\n                    <div class=\"navbar-brand\">\n                      <p class=\"navbar-text\" style=\"color:rgb(85,85,85);font-size:24px;\">Security as JSON</p>\n                    </div>\n                  </div>\n                  <div class=\"collapse navbar-collapse\" id=\"geodash-security-json-navbar-collapse\">\n                    <div class=\"navbar-form navbar-right\">\n                      <a class=\"btn btn-primary\" data-toggle=\"collapse\" data-target=\"#geodash-security-json-preview\">Show/Hide</a>\n                      <a class=\"btn btn-primary\" href=\"/api/dashboard/security/geodash_dashboard_{{ workspace.config.slug}}.json\" target=\"_blank\">Download</a>\n                    </div>\n                  </div>\n                </div>\n              </nav>\n              <pre\n                id=\"geodash-security-json-preview\"\n                class=\"collapse\"\n                style=\"word-wrap: break-word; white-space: pre-wrap;\">{{ workspace.security | json }}</pre>\n            </div>\n          </div>\n        </div>\n      </div>\n      <div class=\"modal-footer\">\n        <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n      </div>\n    </div>\n  </div>\n</div>\n";

var MONTHS_NUM = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
//Array(12).fill().map((x,i)=>i)

var MONTHS_LONG =[
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"];

var MONTHS_SHORT3 =
[
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec"];

var MONTHS_ALL = $.map(MONTHS_NUM, function(num, i){
  return {
    'num': num,
    'short3': MONTHS_SHORT3[i],
    'long': MONTHS_LONG[i]
  };
});

var DAYSOFTHEWEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'];

geodash.filters["default"] = function()
{
  return function(value, fallback)
  {
    return value || fallback;
  };
};

geodash.filters["md2html"] = function()
{
  return function(text)
  {
    if(text != undefined)
    {
      var converter = new showdown.Converter();
      html = converter.makeHtml(text);

      // Open Links in New Windows
      html = html.replace(new RegExp("(<a .*?)>(.*?)</a>", "gi"), '$1 target="_blank">$2</a>');

      // Replace New Line characters with Line Breaks
      html = html.replace(new RegExp('\n', 'gi'),'<br>');

      // Replace extra new lines before heading tags, which add their own margin by default
      html = html.replace(new RegExp("<br><br><(h\\d.*?)>", "gi"),'<br><$1>');

      // Replace extra new lines before paragraph tags, which add their own margin by default
      html = html.replace(new RegExp("<br><br><p>", "gi"),'<p>');

      // If one enclosing paragraph element, then flatten it.
      var matches = html.match(new RegExp("^<p(.*?)>(.*?)</p>", "gi"));
      if(Array.isArray(matches) && matches.length == 1)  // If only 1 match
      {
        if(matches[0] == html) // Fully enclosing
        {
          html = html.substring("<p>".length, html.length - "</p>".length);
        }
      }

      return html;
    }
    else
    {
      return "";
    }
  };
};

geodash.filters["percent"] = function()
{
  return function(value, denominator)
  {
    return 100.0 * value / denominator;
  };
};

geodash.filters["tabLabel"] = function()
{
  return function(value)
  {
    return value.split(" ").length == 2 ? value.replace(' ', '<br>') : value;
  };
};

geodash.filters["as_float"] = function()
{
  return function(value)
  {
    return 1.0 * value;
  };
};

geodash.filters["add"] = function()
{
  return function(value, arg)
  {
    if(Array.isArray(arg))
    {
      var arr = arg;
      return value + arr[value % arr.length];
    }
    else if(arguments.length > 2)
    {
      var arr = Array.prototype.slice.call(arguments, [1]);
      return value + arr[value % arr.length];
    }
    else
    {
      return value + arg;
    }
  };
};

geodash.filters["title"] = function()
{
  return function(value)
  {
    return $.type(value) === "string" ? value.toTitleCase() : value;
  };
};

geodash.filters["as_array"] = function()
{
  return function(value)
  {
    if($.isArray(value))
    {
      return value;
    }
    else
    {
      return $.map(value, function(item, key){
        return {'key': key, 'item': item};
      });
    }
  };
};

geodash.filters["sortItemsByArray"] = function()
{
  return function(value, arg)
  {
    if($.isArray(value))
    {
      value = $.grep(value,function(x, i){
        return $.inArray(x["key"], arg) != -1;
      });
      value.sort(function(a, b){
        return $.inArray(a["key"], arg) - $.inArray(a["key"], arg);
      });
      return value;
    }
    else
    {
      return value;
    }
  };
};

geodash.filters["breakpoint"] = function()
{
    return function(style, index)
    {
      var breakpoints = geodash.breakpoints[style.styles.default.dynamic.options.breakpoints];
      if(breakpoints != undefined && breakpoints.length > 0)
      {
        return breakpoints[index];
      }
      else
      {
        return -1;
      }
    };
};

geodash.filters["breakpoints"] = function()
{
    return function(style)
    {
      var breakpoints = geodash.breakpoints[style.styles.default.dynamic.options.breakpoints];
      if(breakpoints != undefined && breakpoints.length > 0)
      {
        return breakpoints;
      }
      else
      {
        return [];
      }
    };
};

geodash.filters["position_x"] = function()
{
    return function(domain, index, containerWidth, padding)
    {
      var parse_container_width = function(w)
      {
        return $.isNumeric(w) ? w : parseInt(w.substring(0, w.indexOf('px')), 10);
      };
      var actualWidth = parse_container_width(containerWidth) - (padding * 2);
      return padding + (actualWidth * index / domain);
    };
};

geodash.filters["width_x"] = function()
{
    return function(domain, containerWidth, padding)
    {
      var parse_container_width = function(w)
      {
        return $.isNumeric(w) ? w : parseInt(w.substring(0, w.indexOf('px')), 10);
      };
      var actualWidth = parse_container_width(containerWidth)  - (padding * 2);
      return actualWidth / domain;
    };
};

geodash.filters["len"] = geodash.filters["length"] = function()
{
  return function(value)
  {
    if(Array.isArray(value))
    {
      return value.length;
    }
    else if(angular.isString(value))
    {
      return value.length;
    }
    else
    {
      return 0;
    }
  };
};

geodash.filters["layer_is_visible"] = function()
{
  return function(layerID, state)
  {
    state = state || $("#geodash-main").scope().state;
    var visibleFeatureLayers = state.view.featurelayers;
    return (layerID == state.view.baselayer) || $.inArray(layerID, visibleFeatureLayers) != -1;
  };
};

geodash.filters["append"] = function()
{
  return function(value, arg)
  {
    if(Array.isArray(value))
    {
      if(Array.isArray(arg))
      {
        return value.concat(arg);
      }
      else
      {
        return value.push(arg);
      }
    }
    else if(angular.isString(value))
    {
      var arr = Array.prototype.slice.call(arguments, [1]);
      return value + arr.join("");
    }
    else
    {
      return value + arg;
    }
  };
};

geodash.filters["default_if_undefined"] = function()
{
  return function(value, fallback)
  {
    if(value != undefined && value != null)
    {
      return value;
    }
    else
    {
      return fallback;
    }
  };
};

geodash.filters["default_if_undefined_or_blank"] = function()
{
  return function(value, fallback)
  {
    if(value != undefined && value != null && value != "")
    {
      return value;
    }
    else
    {
      return fallback;
    }
  };
};

geodash.filters["extract"] = function()
{
  return function(node)
  {
    var keyChain = Array.prototype.slice.call(arguments, [1]);
    if(keyChain.length > 0)
    {
      return extract(expand(keyChain), node);
    }
    else
    {
      return null;
    }
  };
};

geodash.filters["extractTest"] = function()
{
  return function(node)
  {
    var keyChain = Array.prototype.slice.call(arguments, [1]);
    if(keyChain.length > 0)
    {
      return extract(expand(keyChain), node);
    }
    else
    {
      return null;
    }
  };
};

geodash.filters["inArray"] = function()
{
  return function(value, arr)
  {
      if(Array.isArray(arr))
      {
        return arr.indexOf(value) != -1;
      }
      else
      {
        return false;
      }
  };
};

geodash.filters["not"] = function()
{
  return function(value)
  {
    return ! value;
  };
};

geodash.filters["prepend"] = function()
{
  return function(value, arg)
  {
    if(Array.isArray(value))
    {
      if(Array.isArray(arg))
      {
        return arg.concat(value);
      }
      else
      {
        return [arg].concat(value);
      }
    }
    else if(angular.isString(value))
    {
      var arr = Array.prototype.slice.call(arguments, [1]);
      return arr.join("") + value;
    }
    else
    {
      return arg + value;
    }
  };
};

geodash.filters["parseTrue"] = function()
{
  return function(value)
  {
      return ['on', 'true', 't', '1', 1, true].indexOf(value) != -1;
  };
};

geodash.filters["ternary"] = function()
{
  return function(value, t, f)
  {
    return value ? t : f;
  };
};

geodash.filters["ternary_defined"] = function()
{
  return function(value, t, f)
  {
    if(value != undefined && value != null && value != "")
    {
      return t;
    }
    else
    {
      return f;
    }
  };
};

geodash.filters["yaml"] = function()
{
  return function(value, depth)
  {
    if(value != undefined)
    {
      return YAML.stringify(value, (depth || 4));
    }
    else
    {
      return "";
    }
  };
};

geodash.filters["join"] = function()
{
    return function(array, arg)
    {
        if(Array.isArray(array))
        {
            return array.join(arg);
        }
        else
        {
            return array;
        }
    };
};

geodash.filters["first"] = function()
{
    return function(array)
    {
        if (!Array.isArray(array))
        {
            return array;
        }
        return array[0];
    };
};

geodash.filters["last"] = function()
{
    return function(arr)
    {
        if (!Array.isArray(arr))
        {
            return arr;
        }

        if(arr.length == 0)
        {
            return undefined;
        }

        return arr[arr.length - 1];
    };
};

geodash.filters["choose"] = function()
{
  return function(value, arg)
  {
    if(Array.isArray(arg))
    {
      var arr = arg;
      return value + arr[value % arr.length];
    }
    else
    {
      var arr = Array.prototype.slice.call(arguments, [1]);
      return arr[value % arr.length];
    }
  };
};

geodash.filters["formatBreakpoint"] = function()
{
    return function(value)
    {
      if(Number.isInteger(value))
      {
        return geodash.filters["formatInteger"]()(value, 'delimited', ' ');
      }
      else if($.isNumeric(value))
      {
        return geodash.filters["formatFloat"]()(value, 2);
      }
      else
      {
        return "" + value;
      }
    };
};

geodash.filters["formatFloat"] = function()
{
  return function(value, decimals)
  {
    if(value != undefined && value !== "")
    {
      if(decimals != undefined)
      {
        return value.toFixed(decimals);
      }
      else
      {
        return value.toString();
      }
    }
    else
    {
      return "";
    }
  };
};

geodash.filters["formatInteger"] = function()
{
  return function(value, type, delimiter)
  {
    if(value != undefined && value !== "")
    {
      if(type == "delimited")
      {
        delimiter = delimiter || ',';
        var str = Math.round(value).toString(); // Round in case value is a float
        var pattern = new RegExp('(\\d+)(\\d{3})','gi');
        while(pattern.test(str)){str=str.replace(pattern,'$1'+ delimiter +'$2');}
        return str;
      }
      else
      {
        return Math.round(value).toString();
      }
    }
    else
    {
        return "";
    }
  };
};

geodash.filters["formatArray"] = function()
{
  return function(arr)
  {
      if(Array.isArray(arr))
      {
        if(arr.length == 0)
        {
          return "";
        }
        else if(arr.length == 1)
        {
          return arr[0];
        }
        else if(arr.length == 2)
        {
          return arr.join(" and ");
        }
        else // greater than 2
        {
          return arr.slice(0,-1).join(", ")+", and "+arr[arr.length - 1];
        }
      }
      else
      {
          return arr;
      }
  };
};

geodash.filters["formatMonth"] = function()
{
  return function(value, type)
  {
    if(value != undefined && value !== "")
    {
      if(type == "long")
      {
        return months_long[value-1];
      }
      else if(type == "short3" || type == "short_3")
      {
        return months_short_3[value-1];
      }
      else if(type == "int2")
      {
        return value < 10 ? ('0'+ value.toString()) : value.toString();
      }
      else
      {
        return value.toString();
      }
    }
    else
    {
      return ""
    }
  };
};

geodash.filters["eq"] = function()
{
  return function(value, arg)
  {
    if(angular.isNumber(value) && angular.isNumber(arg))
    {
      return value == arg;
    }
    else
    {
      return false;
    }
  };
};

geodash.filters["lte"] = function()
{
  return function(value, arg)
  {
    if(angular.isNumber(value) && angular.isNumber(arg))
    {
      return value <= arg;
    }
    else
    {
      return false;
    }
  };
};

geodash.filters["gte"] = function()
{
  return function(value, arg)
  {
    if(angular.isNumber(value) && angular.isNumber(arg))
    {
      return value >= arg;
    }
    else
    {
      return false;
    }
  };
};

geodash.filters["gt"] = function()
{
  return function(value, arg)
  {
    if(angular.isNumber(value) && angular.isNumber(arg))
    {
      return value > arg;
    }
    else
    {
      return false;
    }
  };
};

geodash.filters["replace"] = function()
{
  return function(value, oldSubstring, newSubstring)
  {
      if(angular.isString(value))
      {
        if(angular.isString(oldSubstring) && angular.isString(newSubstring))
        {
          if(oldSubstring == ".")
          {
            return value.replace(new RegExp('[.]', 'g'), newSubstring);
          }
          else
          {
            return value.replace(oldSubstring, newSubstring);
          }
        }
        else
        {
          return value;
        }
      }
      else
      {
        return "";
      }
  };
};

geodash.filters["split"] = function()
{
    return function(value, delimiter)
    {
        if(angular.isString(value))
        {
            return value.split(delimiter || ",");
        }
        else
        {
            return value;
        }
    };
};

geodash.filters["url_shapefile"] = function()
{
    return function(layer, state)
    {
        var url = "";
        if("wfs" in layer)
        {
          var typename = "";
          if("layers" in layer.wms)
          {
            typename = layer.wms.layers[0];
          }
          else if("layers" in layer.wfs)
          {
            typename = layer.wfs.layers[0];
          }
          var params = {
            "format_options": "charset:UTF-8",
            "typename": typename,
            "outputFormat": "SHAPE-ZIP",
            "version": "1.0.0",
            "service": "WFS",
            "request": "GetFeature"
          };
          if(state != undefined)
          {
            params["cql_filter"] = "BBOX("+layer.wfs.geometry+", "+state.view.extent+")";
          }
          var querystring = $.map(params, function(v, k){return encodeURIComponent(k) + '=' + encodeURIComponent(v);}).join("&");
          url = layer.wfs.url + "?" + querystring;
        }
        return url;
    };
};

geodash.filters["url_geojson"] = function()
{
    return function(layer, state)
    {
        var url = "";
        if("wfs" in layer)
        {
          var typename = "";
          if("layers" in layer.wms)
          {
            typename = layer.wms.layers[0];
          }
          else if("layers" in layer.wfs)
          {
            typename = layer.wfs.layers[0];
          }
          var params = {
            "format_options": "charset:UTF-8",
            "typename": typename,
            "outputFormat": "json",
            "version": "1.0.0",
            "service": "WFS",
            "request": "GetFeature"
          };
          if(state != undefined)
          {
            params["cql_filter"] = "BBOX("+layer.wfs.geometry+", "+state.view.extent+")";
          }
          var querystring = $.map(params, function(v, k){return encodeURIComponent(k) + '=' + encodeURIComponent(v);}).join("&");
          url = layer.wfs.url + "?" + querystring;
        }
        return url;
    };
};

geodash.filters["url_kml"] = function()
{
    return function(layer, state)
    {
        var url = "";
        if("kml" in layer)
        {
          var typename = "";
          if("layers" in layer.wms)
          {
            typename = layer.wms.layers[0];
          }
          else if("layers" in layer.wfs)
          {
            typename = layer.wfs.layers[0];
          }
          var params = {
            "mode": "download",
            "layers": typename
          };
          if(state != undefined)
          {
            params["cql_filter"] = "BBOX("+layer.wfs.geometry+", "+state.view.extent+")";
          }
          var querystring = $.map(params, function(v, k){return encodeURIComponent(k) + '=' + encodeURIComponent(v);}).join("&");
          url = layer.kml.url + "?" + querystring;
        }
        return url;
    };
};

geodash.filters["url_describefeaturetype"] = function()
{
    return function(layer)
    {
        var url = "";
        if("wfs" in layer)
        {
          var version = layer.wfs.version || "1.0.0";
          var params = {
            "service": "WFS",
            "request": "DescribeFeatureType",
            "version": version,
            "outputFormat": "application/json"
          };

          var typename = "";
          if("layers" in layer.wms)
          {
            typename = layer.wms.layers.unique().join(",");
          }
          else if("layers" in layer.wfs)
          {
            typename = layer.wfs.layers.unique().join(",");
          }
          if(version == "1.1.0" || version == "1.0.0")
          {
            params["typeName"] = typename;
          }
          else
          {
            params["typeNames"] = typename;
          }

          var querystring = $.map(params, function(v, k){return encodeURIComponent(k) + '=' + encodeURIComponent(v);}).join("&");
          url = layer.wfs.url + "?" + querystring;
        }
        return url;
    };
};

geodash.handlers["clickedOnMap"] = function($scope, $interpolate, $http, $q, event, args) {
  console.log('event', event);
  console.log('args', args);
  //
  var $scope = geodash.api.getScope("geodash-main");
  var z = $scope.state.view.z;
  var visibleFeatureLayers = $scope.state.view.featurelayers;
  console.log("visibleFeatureLayers", visibleFeatureLayers);
  var featurelayers_by_featuretype = {};
  var fields_by_featuretype = {};
  var urls = [];
  for(var i = 0; i < visibleFeatureLayers.length; i++)
  {
    var fl = geodash.api.getFeatureLayer(visibleFeatureLayers[i], {"scope": $scope});
    if("wfs" in fl && fl.wfs != undefined)
    {
      var params = {
        service: "wfs",
        version: extract("wfs.version", fl, '1.0.0'),
        request: "GetFeature",
        srsName: "EPSG:4326",
      };

      var targetLocation = new L.LatLng(args.lat, args.lon);
      var bbox = geodash.tilemath.point_to_bbox(args.lon, args.lat, z, 4).join(",");
      var typeNames = extract('wfs.layers', fl, undefined) || extract('wms.layers', fl, undefined) || [] ;
      if(angular.isString(typeNames))
      {
        typeNames = typeNames.split(",");
      }
      for(var j = 0; j < typeNames.length; j++)
      {
        typeName = typeNames[j];
        var url = fl.wfs.url + "?" + $.param($.extend(params, {typeNames: typeName, bbox: bbox}));
        urls.push(url);
        fields_by_featuretype[typeName.toLowerCase()] = geodash.layers.aggregate_fields(fl);
        featurelayers_by_featuretype[typeName.toLowerCase()] = fl;
        if(!typeName.toLowerCase().startsWith("geonode:"))
        {
          featurelayers_by_featuretype["geonode:"+typeName.toLowerCase()] = fl;
        }
      }
    }
  }

  $q.all(geodash.http.build_promises($http, urls)).then(function(responses){
    var features = geodash.http.build_features(responses, fields_by_featuretype);
    console.log("Features: ", features);
    if(features.length > 0 )
    {
      var featureAndLocation = geodash.vecmath.getClosestFeatureAndLocation(features, targetLocation);
      var fl = featurelayers_by_featuretype[featureAndLocation.feature.featuretype] || featurelayers_by_featuretype["geonode:"+featureAndLocation.feature.featuretype];
      $scope.$broadcast("openPopup", {
        'featureLayer': fl,
        'feature': featureAndLocation.feature,
        'location': {
          'lon': featureAndLocation.location.lng,
          'lat': featureAndLocation.location.lat
        }
      });
    }
  });
};

geodash.handlers["hideLayer"] = function($scope, $interpolate, $http, $q, event, args) {
    console.log('event', event);
    console.log('args', args);
    var $scope = geodash.api.getScope("geodash-main");
    var layer = args.layer;
    var i = $.inArray(layer, $scope.state.view.featurelayers);
    if(i != -1)
    {
      $scope.state.view.featurelayers.splice(i, 1);
      $scope.refreshMap($scope.state);
    }
};

geodash.handlers["hideLayers"] = function($scope, $interpolate, $http, $q, event, args) {
    console.log('event', event);
    console.log('args', args);
    var $scope = geodash.api.getScope("geodash-main");
    var layers = args.layers;
    for(var i = 0; i < layers.length; i++)
    {
      var layer = args.layers[i];
      var j = $.inArray(layer, $scope.state.view.featurelayers);
      if(j != -1)
      {
        $scope.state.view.featurelayers.splice(j, 1);
        $scope.refreshMap($scope.state);
      }
    }
};

geodash.handlers["layerLoaded"] = function($scope, $interpolate, $http, $q, event, args) {
    var $scope = geodash.api.getScope("geodash-main");
    var type = args.type;
    var layer = args.layer;
    var visible = args.visible != undefined ? args.visible : true;
    if(type == "featurelayer")
    {
      if(visible)
      {
        $scope.state.view.featurelayers.push(layer);
      }
    }
    else if(type == "baselayer")
    {
      $scope.state.view.baselayer = layer;
    }
};

geodash.handlers["requestToggleComponent"] = function($scope, $interpolate, $http, $q, event, args) {
  geodash.api.getScope("geodash-main").$broadcast("toggleComponent", args);
};

geodash.handlers["showLayer"] = function($scope, $interpolate, $http, $q, event, args) {
    console.log('event', event);
    console.log('args', args);
    var $scope = geodash.api.getScope("geodash-main");
    var layer = args.layer;
    if($.inArray(layer, $scope.state.view.featurelayers) == -1)
    {
      $scope.state.view.featurelayers.push(layer);
      $scope.refreshMap($scope.state);
    }
};

geodash.handlers["showLayers"] = function($scope, $interpolate, $http, $q, event, args) {
    console.log('event', event);
    console.log('args', args);
    var $scope = geodash.api.getScope("geodash-main");
    var layers = args.layers;
    for(var i = 0; i < layers.length; i++)
    {
      var layer = layers[i];
      if($.inArray(layer, $scope.state.view.featurelayers) == -1)
      {
        $scope.state.view.featurelayers.push(layer);
        $scope.refreshMap($scope.state);
      }
    }
};

geodash.handlers["switchBaseLayer"] = function($scope, $interpolate, $http, $q, event, args) {
    console.log('event', event);
    console.log('args', args);
    var $scope = geodash.api.getScope("geodash-main");
    $scope.state.view.baselayer = args.layer;
    $scope.refreshMap($scope.state);
};

geodash.handlers["toggleComponent"] = function($scope, $interpolate, $http, $q, event, args) {
  console.log('event', event);
  console.log('args', args);
  //
  var component = args.component;
  var position = args.position;
  var classes = component+"-open "+component+"-"+position+"-open";
  $(args.selector).toggleClass(classes);
  setTimeout(function(){
    $scope.live["map"].invalidateSize({
      animate: true,
      pan: false
    });
  },2000);
};

geodash.handlers["zoomToLayer"] = function($scope, $interpolate, $http, $q, event, args) {
    var $scope = geodash.api.getScope("geodash-main");
    var layer = args.layer;
    var i = $.inArray(layer, $scope.state.view.featurelayers);
    if(i != -1)
    {
      $scope.$broadcast("changeView", {'layer': layer});
    }
};

geodash.handlers["filterChanged"] = function($scope, $interpolate, $http, $q, event, args) {
  console.log('event', event);
  console.log('args', args);
  $scope.$apply(function () {
    $scope.state.filters[args["layer"]] = $.extend(
      $scope.state.filters[args["layer"]],
      args["filter"]);
    var url = buildPageURL($interpolate, $scope.map_config, $scope.state);
    if(url != undefined)
    {
      history.replaceState($scope.state, "", url);
    }
    $scope.refreshMap($scope.state);
  });
};

geodash.handlers["selectStyle"] = function($scope, $interpolate, $http, $q, event, args) {
    console.log('event', event);
    console.log('args', args);
    $scope.$apply(function () {
        $scope.state.styles[args["layer"]] = args["style"];
        var url = buildPageURL($interpolate, $scope.map_config, $scope.state);
        if(url != undefined)
        {
          history.replaceState($scope.state, "", url);
        }
        $scope.refreshMap($scope.state);
    });
};

geodash.handlers["stateChanged"] = function($scope, $interpolate, $http, $q, event, args) {
  console.log('event', event);
  console.log('args', args);
  $scope.$apply(function () {
    $scope.state = $.extend($scope.state, args);
    var url = buildPageURL($interpolate, $scope.map_config, $scope.state);
    if(url != undefined)
    {
      history.replaceState($scope.state, "", url);
    }
    $scope.refreshMap($scope.state);
  });
};

geodash.handlers["viewChanged"] = function($scope, $interpolate, $http, $q, event, args) {
  console.log('event', event);
  console.log('args', args);
  $scope.state.view = $.extend($scope.state.view, args);
  var url = buildPageURL($interpolate, $scope.map_config, $scope.state);
  if(url != undefined)
  {
    history.replaceState($scope.state, "", url);
  }
};

geodash.directives["ngX"] = function(){
  return {
    scope: true,
    link: function ($scope, $element, attrs){
      $scope.$watch(attrs.ngX, function(value) {
        $element.attr('x', value);
      });
    }
  };
};
geodash.directives["ngY"] = function(){
  return {
    scope: true,
    link: function ($scope, $element, attrs){
      $scope.$watch(attrs.ngY, function(value) {
        $element.attr('y', value);
      });
    }
  };
};
geodash.directives["ngWidth"] = function(){
  return {
    scope: true,
    link: function ($scope, $element, attrs){
      $scope.$watch(attrs.ngWidth, function(value) {
        $element.attr('width', value);
      });
    }
  };
};
geodash.directives["ngR"] = function(){
  return {
    scope: true,
    link: function ($scope, $element, attrs){
      $scope.$watch(attrs.ngR, function(value) {
        $element.attr('r', value);
      });
    }
  };
};
geodash.directives["ngFill"] = function(){
  return {
    scope: true,
    link: function ($scope, $element, attrs){
      $scope.$watch(attrs.ngFill, function(value) {
        $element.attr('fill', value);
      });
    }
  };
};

geodash.directives["onLinkDone"] = function(){
  return {
    restriction: 'A',
    link: function($scope, element, attributes ) {
      $scope.$emit(attributes["onLinkDone"] || "link_done", {
        'element': element,
        'attributes': attributes
      });
    }
  };
};

geodash.directives["onRepeatDone"] = function(){
  return {
    restriction: 'A',
    link: function($scope, element, attributes ) {
      $scope.$emit(attributes["onRepeatDone"] || "repeat_done", {
        'element': element,
        'attributes': attributes
      });
    }
  };
};

geodash.directives["geodashBtnClose"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      'dismiss': '@target'
    },
    templateUrl: 'geodash_btn_close.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.directives["geodashBtnInfo"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      'placement': '@placement',
      'info': '@info'
    },
    templateUrl: 'geodash_btn_info.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.directives["geodashBtn"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      'mode': '@mode',
      'target': '@target',
      'info': '@info',
      'placement': '@tooltipPlacement'
    },
    templateUrl: 'geodash_btn.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.directives["geodashLabel"]= function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      'target': '@target',
      'content': '@content'
    },
    templateUrl: 'geodash_label.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.directives["geodashTab"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      'target': '@target',
      'label': '@label',
      'active': '@active',
      'height': '@height'
    },  // Inherit exact scope from parent controller
    templateUrl: 'geodash_tab.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.directives["geodashTabs"]= function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: true,
    templateUrl: 'geodash_tabs.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.directives["geodashModalLayerCarto"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    //scope: {
    //  layer: "=layer"
    //},
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'geodash_modal_layer_carto.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.directives["geodashModalLayerMore"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'geodash_modal_layer_more.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geodash.directives["geodashModalLayerConfig"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'geodash_modal_layer_config.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geodash.directives["geodashSymbolCircle"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      style: "=style"
    },
    templateUrl: 'symbol_circle.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geodash.directives["geodashSymbolEllipse"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      style: "=style"
    },
    templateUrl: 'symbol_ellipse.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geodash.directives["geodashSymbolGraduated"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      style: "=style",  // Text binding / one-way binding
      containerWidth: "@" // Text binding / one-way binding
    },
    templateUrl: 'symbol_graduated.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geodash.directives["geodashSymbolGraphic"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      style: "=style"
    },
    templateUrl: 'symbol_graduated.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geodash.directives["geodashLegendBaselayers"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'legend_baselayers.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geodash.directives["geodashLegendFeaturelayers"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'legend_featurelayers.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geodash.directives["geodashModalWelcome"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'geodash_modal_welcome.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.directives["geodashModalAbout"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'geodash_modal_about.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.directives["geodashModalDownload"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'geodash_modal_download.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.directives["geodashMapOverlays"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      'editable': '@editable'
    },
    templateUrl: 'map_overlays.tpl.html',
    link: function ($scope, element, attrs){

      $scope.map_config = $scope.$parent.map_config;
      $scope.map_config_flat = $scope.$parent.map_config_flat;

      $scope.style = function(type, overlay)
      {
        var styleMap = {};

        $.extend(styleMap,{
          "top": extract("position.top", overlay, 'auto'),
          "bottom": extract("position.bottom", overlay, 'auto'),
          "left": extract("position.left", overlay, 'auto'),
          "right": extract("position.right", overlay, 'auto'),
          "padding": extract("padding", overlay, '0'),
          "background": extract("background", overlay, 'transparent'),
          "opacity": extract("opacity", overlay, '1.0'),
          "width": extract("width", overlay, 'initial'),
          "height": extract("height", overlay, 'initial')
        });

        if(type == "text")
        {
          $.extend(styleMap, {
            "font-family": extract("text.font.family", overlay, 'Arial'),
            "font-size": extract("text.font.size", overlay, '12px'),
            "font-style": extract("text.font.style", overlay, 'normal'),
            "text-shadow": extract("text.shadow", overlay, 'none')
          });
        }
        else if(type == "image")
        {

        }
        return $.map(styleMap, function(value, style){
          return style+": "+value
        }).join(";") +";";
      };

      if(geodash.api.parseTrue($scope.editable))
      {
        $(element).on('mouseenter', '.geodash-map-overlay', function(event, args){
          $(this).draggable('enable');
          $('.geodash-map-grid').addClass('on');
        });

        $(element).on('mouseleave', '.geodash-map-overlay', function(event, args){
          $(this).draggable('disable');
          $('.geodash-map-grid').removeClass('on');
        });

        $scope.$on("overlayLoaded", function(event, args) {

          console.log("overlayLoaded", event, args);
          var overlayType = args.attributes.overlayType;
          var overlayElement = $(args.element);

          var container = overlayElement.parents(".geodash-map:first");

          if(overlayType == "text")
          {
            /*overlayElement.resizable({
              "containment": container,
              "helper": "ui-resizable-helper"
            });*/
          }
          else if(overlayType == "image")
          {
            //See: http://stackoverflow.com/questions/10703450/draggable-and-resizable-in-jqueryui-for-an-image-is-not-working
            /*$("img", overlayElement).resizable({
              "containment": container,
              "helper": "ui-resizable-helper"
            });*/
          }

          overlayElement.draggable({
            "containment": container,
            start: function(event, args) {
              // http://www.w3schools.com/cssref/pr_class_cursor.asp
              $(this).css('cursor', '-webkit-grabbing');
            },
            drag: function(event, args) {

            },
            stop: function(event, args) {
              // http://www.w3schools.com/cssref/pr_class_cursor.asp
              $(this).css('cursor', 'pointer');
              console.log(event, args);
              var newPosition = args.position;
              var overlayIndex = $(this).data('overlay-index');
              var scope = geodash.api.getScope("geodash-sidebar-right");
              if(scope != undefined)
              {
                var mapWidth = container.width();
                var mapHeight = container.height();

                scope.map_config_flat["overlays__"+overlayIndex+"__position__top"] = newPosition.top < (mapHeight / 2.0) ? newPosition.top+'px' : 'auto';
                scope.map_config_flat["overlays__"+overlayIndex+"__position__bottom"] = newPosition.top >= (mapHeight / 2.0) ? (mapHeight - newPosition.top)+'px' : 'auto';
                scope.map_config_flat["overlays__"+overlayIndex+"__position__left"] = newPosition.left < (mapWidth / 2.0) ? newPosition.left+'px' : 'auto';
                scope.map_config_flat["overlays__"+overlayIndex+"__position__right"] = newPosition.left >= (mapWidth / 2.0) ? (mapWidth - newPosition.left)+'px' : 'auto';

                setTimeout(function(){
                  scope.validateFields([
                    "overlays__"+overlayIndex+"__position__top",
                    "overlays__"+overlayIndex+"__position__bottom",
                    "overlays__"+overlayIndex+"__position__left",
                    "overlays__"+overlayIndex+"__position__right"
                  ])
                }, 0);
              }
            }
          });
        });

      }
    }
  };
};

geodash.directives["geodashSidebarToggleLeft"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      "selector": "@selector"
    },
    templateUrl: 'geodash_sidebar_toggle_left.tpl.html',
    link: function ($scope, $element, attrs){
      setTimeout(function(){

        $('[data-toggle="tooltip"]', $element).tooltip();

      },10);
    }
  };
};

geodash.directives["geodashSidebarToggleRight"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      "selector": "@selector"
    },
    templateUrl: 'geodash_sidebar_toggle_right.tpl.html',
    link: function ($scope, $element, attrs){
      setTimeout(function(){

        $('[data-toggle="tooltip"]', $element).tooltip();

      },10);
    }
  };
};

geodash.directives["geodashserverModalWelcome"] = function(){
  return {
    controller: geodash.controllers.controller_modal_geodashserver_welcome,
    restrict: 'EA',
    replace: true,
    scope: {},
    //scope: {
    //  layer: "=layer"
    //},
    //scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'modal_welcome_geodashserver.tpl.html',
    link: function ($scope, $element, attrs)
    {

      setTimeout(function(){
        geodash.init.typeahead($element);
        geodashserver.welcome();
      }, 10);

    }
  };
};

geodash.directives["geodashDashboardEditor"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'dashboard_editor.tpl.html',
    link: function ($scope, $element, attrs)
    {
      setTimeout(function(){
        $('[data-toggle="tooltip"]', $element).tooltip();

        geodash.init.typeahead(
          $element,
          $scope.workspace.config.featurelayers,
          $scope.workspace.config.baselayers);
      },0);
    }
  };
};

geodash.directives["geodashModalEditField"] = function(){
  return {
    controller: geodash.controllers.controller_modal_edit_field,
    replace: true,
    //require: undefined,
    restrict: 'EA',
    scope: {},
    //scope: true,
    templateUrl: 'modal_edit_field.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.directives["geodashModalEditObject"] = function(){
  return {
    controller: geodash.controllers.controller_modal_edit_object,
    restrict: 'EA',
    replace: true,
    scope: {},
    //scope: true,
    templateUrl: 'modal_edit_object.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.directives["geodashModalDashboardConfig"] = function(){
  return {
    controller: geodash.controllers.controller_modal_dashboard_config,
    restrict: 'EA',
    replace: true,
    scope: {},
    templateUrl: 'geodash_modal_dashboard_config.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.directives["geodashModalDashboardSecurity"] = function(){
  return {
    controller: geodash.controllers.controller_modal_dashboard_security,
    restrict: 'EA',
    replace: true,
    scope: {},
    templateUrl: 'geodash_modal_dashboard_security.tpl.html',
    link: function ($scope, element, attrs){}
  };
};

geodash.controllers.GeoDashControllerBase = function(
  $scope, $element, $controller, state, map_config, live)
{
  //$scope.map_config = map_config;
};

geodash.controllers.GeoDashControllerModal = function(
  $scope, $element, $controller, $timeout, state, map_config, live)
{
  angular.extend(this, $controller('GeoDashControllerBase', {$element: $element, $scope: $scope}));

  $scope.showOptions = geodash.ui.showOptions;

  $scope.stack = {
    'head': undefined, //backtrace[0]
    'prev': undefined, //backtrace[1]
    'backtrace': [] // Full list to include states from other modals
  };

  $scope.showModal = function(x)
  {
    if(angular.isString(x))
    {
      return x != "";
    }
    else if(angular.isNumber(x))
    {
      return x >= 0;
    }
    else
    {
      return true;
    }
  };

  $scope.pop = function()
  {
    var removed = $scope.stack.backtrace.shift();
    $scope.update_stack();
    $scope.update_main(removed);
    $scope.update_ui(removed, $scope.stack.backtrace);
  };
  $scope.update_stack = function(backtrace)
  {
    if(angular.isDefined(backtrace))
    {
      $scope.stack.backtrace = backtrace;
    }
    if($scope.stack.backtrace.length >= 2)
    {
      $scope.stack.head = $scope.stack.backtrace[0];
      $scope.stack.prev = $scope.stack.backtrace[1];
    }
    else if($scope.stack.backtrace.length == 1)
    {
      $scope.stack.head = $scope.stack.backtrace[0];
      $scope.stack.prev = undefined;
    }
    else
    {
      $scope.stack.head = undefined;
      $scope.stack.prev = undefined;
    }
  };
  $scope.update_main = function(removed)
  {
    if(angular.isDefined($scope.stack.head))
    {
      if($scope.stack.head.modal == removed.modal)
      {
        $.each($scope.stack.head, function(key, value){ $scope[key] = value;});
      }
    }
  };
  $scope.update_breadcrumbs = function()
  {
    var breadcrumbs = [];
    if(angular.isDefined(extract('stack.backtrace', $scope)))
    {
      for(var i = $scope.stack.backtrace.length - 1; i >= 0; i--)
      {
        var x = $scope.stack.backtrace[i];
        if(angular.isDefined(x.objectIndex))
        {
          var obj = extract(x.path_array, x.workspace);
          var content = extract('title', obj) || extract('id', obj) || x.objectIndex;
          var link = "#";
          var bc = {'content': content, 'link': link};
          breadcrumbs.push(bc);
        }
        else
        {
          var keyChain = x.schemapath_array || x.basepath_array;
          if(angular.isDefined(keyChain))
          {
            var f = extract(keyChain, x.schema);
            if(angular.isDefined(f))
            {
              var t = extract("type", f);
              var content = undefined;
              var link = "#";
              if(t == "object")
              {
                content = extract("schema.verbose_singular", f) || extract("label", f);
              }
              else if(t == "objectarray" || t == "stringarray" || t == "textarray" || t == "templatearray")
              {
                content = extract("schema.verbose_plural", f) || extract("label", f);
              }
              else
              {
                content = extract("label", f);
              }
              var bc = {'content': content, 'link': link};
              breadcrumbs.push(bc);
            }
          }
        }
      }
      $scope.breadcrumbs = breadcrumbs;
    }
    return breadcrumbs;
  };
  $scope.update_ui = function(removed, backtrace)
  {
    if(angular.isDefined($scope.stack.head))
    {
      if($scope.stack.head.modal == removed.modal)
      {
        $scope.update_breadcrumbs();
        $timeout(function(){
          var m = $("#"+$scope.stack.head.modal);
          $('[data-toggle="tooltip"]',m).tooltip();
          geodash.init.typeahead(
            m,
            $scope.workspace.config.featurelayers,
            $scope.workspace.config.baselayers);
        },0);
      }
      else
      {
        var oldModal = removed.modal;
        var newModal = $scope.stack.head.modal;
        $("#"+oldModal).modal('hide');
        $("#"+newModal).modal({'backdrop': 'static', 'keyboard':false});
        //var newScope = geodash.api.getScope(newModal);
        // newScope.clear(); Should have already happened in clear_all
        $timeout(function(){
          var newScope = geodash.api.getScope(newModal);
          newScope.update_stack(backtrace);
          $.each(newScope.stack.head, function(key, value){ newScope[key] = value;});
          newScope.update_breadcrumbs();
          $("#"+newModal).modal('show');
          $timeout(function(){
            var m =  $("#"+newModal);
            $('[data-toggle="tooltip"]',m).tooltip();
            geodash.init.typeahead(
              m,
              newScope.workspace.config.featurelayers,
              newScope.workspace.config.baselayers);
          },0);
        },0);
      }
    }
    else
    {
      $("#"+removed.modal).modal('hide');
    }
  };

  $scope.clear = function()
  {
    $scope.clear_all(1);
  };
  $scope.clear_all = function(count)
  {
    var backtrace = $scope.stack.backtrace;
    if(backtrace.length > 0)
    {
      var clear_array = [
        "workspace", "workspace_flat",
        "schema", "schema_flat",
        "basepath", "basepath_flat", "basepath_array",
        "schemapath", "schemapath_flat", "schemapath_array",
        "objectIndex",
        "path", "path_flat", "path_array",
        "breadcrumbs"];
      var scopes = {};
      var s = undefined;
      for(var i = 0; i < count && i < backtrace.length; i++)
      {
        var x = backtrace[i];
        if(angular.isUndefined(s))
        {
          var m = extract('modal', x);
          s = angular.isDefined(m) ? geodash.api.getScope(m) : $scope;
        }
        $.each(x, function(key, value){ s[key] = undefined; });
        $.each(clear_array, function(index, value){ s[value] = undefined; });
      }
    }
  };

  $scope.push = function(x, backtrace)
  {
    $scope.clear(); // Clean Old Values
    x = $scope.expand(x)
    $scope.update_stack([x].concat(backtrace || $scope.stack.backtrace));
    $.each($scope.stack.head, function(key, value){ $scope[key] = value; });
    $scope.update_breadcrumbs();
  };

  $scope.expand = function(x)
  {
    if(angular.isDefined(x))
    {
      if(angular.isDefined(x.schemapath))
      {
        x.schemapath_flat = x.schemapath.replace(new RegExp("\\.", "gi"), "__");
        x.schemapath_array = x.schemapath.split(".");
      }

      if(angular.isDefined(x.basepath))
      {
        x.basepath_array = x.basepath.split(".");
        if(angular.isDefined(x.schemapath))
        {
          x.object_fields = extract(x.schemapath_array.concat(["schema", "fields"]), x.schema, []);
        }
        else
        {
          x.object_fields = extract(x.basepath_array.concat(["schema", "fields"]), x.schema, []);
        }
        if(angular.isDefined(x.objectIndex))
        {
          x.path = x.basepath + "." + x.objectIndex;
          x.path_flat = x.path.replace(new RegExp("\\.", "gi"), "__");
          x.path_array = x.basepath_array.concat([x.objectIndex]);
        }
        else
        {
          x.path = x.basepath;
          x.path_flat = x.path.replace(new RegExp("\\.", "gi"), "__");
          x.path_array = x.path.split(".");
        }
      }
      else if(angular.isDefined(x.path))
      {
        x.path_flat = x.path.replace(new RegExp("\\.", "gi"), "__");
        x.path_array = x.path.split(".");
      }
      if(angular.isDefined(x.workspace))
      {
        x.workspace_flat = geodash.api.flatten(x.workspace);
      }
      if(angular.isDefined(x.schema))
      {
        x.schema_flat = geodash.api.flatten(x.schema);
      }
    }
    return x;
  };

  $scope.rollback = function(index)
  {
    var count = angular.isDefined(index) ? ($scope.stack.backtrace.length - index - 1) : 1;
    $scope.clear_all(count);
    $timeout(function(){
      var removed = $scope.stack.backtrace[0];
      $scope.update_stack($scope.stack.backtrace.slice(count));
      $scope.update_main(removed);
      $scope.update_ui(removed, $scope.stack.backtrace);
    },0);
  };

  $scope.go_back = function()
  {
    $scope.clear();
    $timeout(function(){$scope.pop();},0);
  };

  $scope.edit_field = function(field_id, field_index)
  {
    var schemapath = $scope.stack.head.path;
    if(angular.isDefined($scope.stack.head.schemapath_array) && angular.isDefined(field_index))
    {
      schemapath = $scope.stack.head.schemapath + ".schema.fields."+field_index;
    }
    var x = {
      'modal': 'geodash-modal-edit-field',
      'prev': $scope.stack.head.modal,
      'workspace': $scope.stack.head.workspace,
      'schema': $scope.stack.head.schema,
      'basepath': $scope.stack.head.path,
      'schemapath': schemapath,
      'objectIndex': field_id
    };
    console.log('New X:');
    console.log(x);

    if($scope.stack.head.modal == x.modal)
    {
      // https://groups.google.com/forum/#!search/string$20input$20ng-repeat%7Csort:relevance/angular/VD77QR1J6uQ/sh-9HNkZu4IJ
      $scope.clear();
      $timeout(function(){$scope.push(x);},0);
    }
    else
    {
      $("#"+$scope.stack.head.modal).modal('hide');
      geodash.api.getScope(x.modal).push(x, $scope.stack.backtrace);
      $("#"+x.modal).modal({'backdrop': 'static','keyboard':false});
      $("#"+x.modal).modal('show');
      $timeout(function(){ $('[data-toggle="tooltip"]', $("#"+x.modal)).tooltip(); },0);
    }
  };

  $scope.add_object = function(field_id)
  {
    var value = extract($scope.stack.head.path, $scope.stack.head.workspace);
    var length = angular.isDefined(value) ? value.length : 0;
    $scope.edit_object(length);
  };

  $scope.edit_object = function(field_id, field_index)
  {
    var schemapath = $scope.stack.head.schemapath || $scope.stack.head.path;
    if(angular.isDefined($scope.stack.head.schemapath) && angular.isDefined(field_index))
    {
      schemapath = $scope.stack.head.schemapath + ".schema.fields."+field_index;
    }
    var x = {
      'modal': 'geodash-modal-edit-object',
      'prev': $scope.stack.head.modal,
      'workspace': $scope.stack.head.workspace,
      'schema': $scope.stack.head.schema,
      'basepath': $scope.stack.head.path,
      'schemapath': schemapath,
      'objectIndex': field_id
    };
    console.log('New X:');
    console.log(x);

    if($scope.stack.head.modal == x.modal)
    {
      // https://groups.google.com/forum/#!search/string$20input$20ng-repeat%7Csort:relevance/angular/VD77QR1J6uQ/sh-9HNkZu4IJ
      $scope.clear();
      $timeout(function(){
        $scope.push(x);
        $timeout(function(){
          var m = $("#"+x.modal);
          $('[data-toggle="tooltip"]', m).tooltip();
          geodash.init.typeahead(m, $scope.workspace.config.featurelayers, $scope.workspace.config.baselayers);
        },0);
      },0);
    }
    else
    {
      $("#"+$scope.stack.head.modal).modal('hide');
      var targetScope = geodash.api.getScope(x.modal);
      var backtrace = $scope.stack.backtrace;
      targetScope.clear();
      $timeout(function(){
        targetScope.push(x, backtrace);
        var m = $("#"+x.modal);
        m.modal({'backdrop': 'static','keyboard':false});
        m.modal('show');
        $timeout(function(){
          $('[data-toggle="tooltip"]', m).tooltip();
          geodash.init.typeahead(m, $scope.workspace.config.featurelayers, $scope.workspace.config.baselayers);
        },0);
      },0);
    }
  };

  $scope.save_object = function()
  {
    var workspace = $scope.workspace;
    var workspace_flat = $scope.workspace_flat;
    $scope.clear_all(2);
    $timeout(function(){
      // By using $timeout, we're sure the template was reset (after we called $scope.clear)
      //var ret = $scope.stack.list.shift();
      var saved = $scope.stack.backtrace.shift();
      if($scope.stack.backtrace.length > 0)
      {
        var backtrace = $scope.stack.backtrace;
        backtrace[0]['workspace'] = workspace;
        backtrace[0]['workspace_flat'] = workspace_flat;
        $scope.update_stack(backtrace);
        if($scope.stack.head.modal == saved.modal)
        {
          $.each($scope.stack.head, function(key, value){ $scope[key] = value;});
          $scope.workspace = $scope.stack.head.workspace = workspace;
          $scope.workspace_flat = $scope.stack.head.workspace_flat = workspace_flat;
          $scope.update_breadcrumbs();
        }
        else
        {
          var oldModal = saved.modal;
          var newModal = $scope.stack.head.modal;
          $("#"+oldModal).modal('hide');
          $("#"+newModal).modal({'backdrop': 'static', 'keyboard':false});
          $timeout(function(){
            var newScope = geodash.api.getScope(newModal);
            newScope.update_stack(backtrace);
            $.each(newScope.stack.head, function(key, value){ newScope[key] = value;});
            newScope.update_breadcrumbs();
            $("#"+newModal).modal('show');
            $timeout(function(){
              var m = $("#"+newModal);
              $('[data-toggle="tooltip"]', m).tooltip();
              geodash.init.typeahead(m, $scope.workspace.config.featurelayers, $scope.workspace.config.baselayers);
            },0);
          },0);
        }
      }
      else
      {
        var targetScope = geodash.api.getScope("geodash-sidebar-right");
        targetScope.workspace = workspace;
        targetScope.workspace_flat = workspace_flat;
        $("#"+saved.modal).modal('hide');
      }
    },0);
  };

  $scope.modal_title = function()
  {
    var breadcrumbs = [];
    for(var i = $scope.stack.backtrace.length - 1; i >= 0; i--)
    {
      var x = $scope.stack.backtrace[i];
      if(angular.isDefined(x.objectIndex))
      {
        var obj = extract(x.path_array, x.workspace);
        breadcrumbs.push(extract('title', obj) || extract('id', obj) || x.objectIndex);
      }
      else
      {
        var f = extract(x.schemapath_array || x.basepath_array, x.schema);
        if(angular.isDefined(f))
        {
          var t = extract("type", f);
          if(t == "object")
          {
            breadcrumbs.push(extract("schema.verbose_singular", f) || extract("label", f));
          }
          else if(t == "objectarray" || t == "stringarray" || t == "textarray" || t == "templatearray")
          {
            breadcrumbs.push(extract("schema.verbose_plural", f) || extract("label", f));
          }
          else
          {
            breadcrumbs.push(extract("label", f));
          }
        }
      }
    }
    return "Edit / " + breadcrumbs.join(" / ");
  };

  $scope.back_label = function()
  {
    var label = "Cancel";
    if(angular.isDefined($scope.stack.head) && $scope.stack.backtrace.length > 1)
    {
      var x = $scope.stack.backtrace[1];
      var t = extract((x.schemapath_array || x.basepath_array), x.schema);
      if(t.type == "objectarray" && angular.isNumber($scope.stack.head.objectIndex))
      {
        label = "Back to "+(extract("schema.verbose_plural", t) || extract("label", t));
      }
      else
      {
        label = "Back to "+(extract("schema.verbose_singular", t) || extract("label", t));
      }
    }
    return label;
  };

  $scope.save_label = function()
  {
    var label = "";
    if(angular.isDefined($scope.stack.head))
    {
      var x = $scope.stack.head;
      var t = extract((x.schemapath_array || x.basepath_array), x.schema);
      if(t.type == "objectarray" && (! angular.isDefined($scope.stack.head.objectIndex)))
      {
        label = "Save "+(extract("schema.verbose_plural", t) || extract("label", t) || "Object");
      }
      else
      {
        label = "Save "+(extract("schema.verbose_singular", t) || "Object");
      }
    }
    else
    {
      label = "Save";
    }
    return label;
  };
};

geodash.controllers["controller_legend"] = function(
  $scope,
  $element,
  $controller,
  state,
  map_config,
  live)
{
  angular.extend(this, $controller('GeoDashControllerBase', {$element: $element, $scope: $scope}));
  //
  $scope.map_config = map_config;
  $scope.state = state;
  //////////////
  // Watch

  $scope.html5data = function()
  {
    var args = arguments;
    var zero_lc = args[0].toLowerCase();
    if(zero_lc == "togglemodal")
    {
      var id = args[1];
      var layerType = args[2];
      var layer = args[3];
      return {
        "id": args[1],
        "static": {
          "layerID": layer.id,
        },
        "dynamic" : {
          "layer": [layerType, layer.id]
        }
      };
    }
    else
    {
      return "";
    }
  };

  $scope.updateVariables = function(){
    var arrayFilter = $scope.map_config.legendlayers;

    if("baselayers" in $scope.map_config && $scope.map_config.baselayers != undefined)
    {
      var baselayers = $.grep($scope.map_config.baselayers,function(x, i){ return $.inArray(x["id"], arrayFilter) != -1; });
      baselayers.sort(function(a, b){ return $.inArray(a["id"], arrayFilter) - $.inArray(b["id"], arrayFilter); });
      $scope.baselayers = baselayers;
    }
    else
    {
      $scope.baselayers = [];
    }

    if("featurelayers" in $scope.map_config && $scope.map_config.featurelayers != undefined)
    {
      //var featurelayers = $.map($scope.map_config.featurelayers, function(item, key){ return {'key': key, 'item': item}; });
      var featurelayers = $.grep($scope.map_config.featurelayers,function(x, i){ return $.inArray(x["id"], arrayFilter) != -1; });
      featurelayers.sort(function(a, b){ return $.inArray(a["id"], arrayFilter) - $.inArray(b["id"], arrayFilter); });
      $scope.featurelayers = featurelayers;
    }
    else
    {
      $scope.featurelayers = [];
    }

  };
  $scope.updateVariables();
  $scope.$watch('map_config.featurelayers', $scope.updateVariables);
  $scope.$watch('map_config.legendlayers', $scope.updateVariables);
  $scope.$watch('state', $scope.updateVariables);
  //////////////
  var jqe = $($element);

  $scope.$on("refreshMap", function(event, args){
    console.log('args: ', args);

    $scope.state = args.state;
    /*
    $scope.$apply(function()
    {
      $scope.state = args.state;
    });*/

  });
};

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

var init_map = function(opts)
{
  var map = L.map('map',
  {
    attributionControl: geodash.api.opt_b(opts, "attributionControl", false),
    zoomControl: geodash.api.opt_b(opts, "zoomControl", false),
    minZoom: geodash.api.opt_i(opts, "minZoom", 3),
    maxZoom: geodash.api.opt_i(opts, "maxZoom", 18)
  });

  map.setView(
    [geodash.api.opt_i(opts,["latitude", "lat"],0), geodash.api.opt_i(opts,["longitude", "lon", "lng", "long"], 0)],
    geodash.api.opt_i(opts, ["zoom", "z"], 0));

  $.each(geodash.api.opt_j(opts, "listeners"), function(e, f){
    map.on(e, f);
  });

  return map;
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
      var c = e.latlng;
      var delta = {
        "lat": c.lat,
        "lon": c.lng
      };
      geodash.api.intend("clickedOnMap", delta, $scope);
    },
    zoomend: function(e){
      var delta = {
        "extent": live["map"].getBounds().toBBoxString(),
        "z": live["map"].getZoom()
      };
      geodash.api.intend("viewChanged", delta, $scope);
    },
    dragend: function(e){
      var c = live["map"].getCenter();
      var delta = {
        "extent": live["map"].getBounds().toBBoxString(),
        "lat": c.lat,
        "lon": c.lng
      };
      geodash.api.intend("viewChanged", delta, $scope);
    },
    moveend: function(e){
      var c = live["map"].getCenter();
      var delta = {
        "extent": live["map"].getBounds().toBBoxString(),
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
  live["map"] = init_map({
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
  var baseLayers = geodash.layers.init_baselayers(live["map"], map_config["baselayers"]);
  $.extend(live["baselayers"], baseLayers);
  // Load Default/Initial Base Layer
  //var baseLayerID = $.grep(map_config[])
  var baseLayerID = map_config["view"]["baselayer"] || map_config["baselayers"][0].id;
  //var baseLayerID = map_config["baselayers"][0].id;
  live["baselayers"][baseLayerID].addTo(live["map"]);
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

geodash.controllers["controller_modal_geodashserver_welcome"] = function($scope, $element, $controller)
{
  angular.extend(this, $controller('GeoDashControllerModal', {$element: $element, $scope: $scope}));
  var m = $.grep(geodash.meta.modals, function(x, i){ return x['name'] == 'geodashserver_welcome';})[0];
  $scope.config = m.config;
  $scope.ui = m.ui;
  $scope.html5data = geodashserver.html5data;
  $scope.updateValue = geodash.api.updateValue;
  $scope.showOptions = geodash.ui.showOptions;
};

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
          "workspace": ["source", "workspace"],
          "workspace_flat": ["source", "workspace_flat"]
        }
      },
      "modal_dashboard_security": {
        "id": "geodash-modal-dashboard-security",
        "dynamic": {
          "workspace": ["source", "workspace"],
          "workspace_flat": ["source", "workspace_flat"]
        }
      }
    }
  };
  /////////////////////
  $scope.perms = geodash.perms;
  $scope.editor = geodash.initial_data["data"]["editor"];
  /////////////////////
  // Accessible by Editor
  $scope.workspace = {
    "config": map_config,
    "security": geodash.initial_data["data"]["security"]
  };
  $scope.workspace_flat = geodash.api.flatten($scope.workspace, undefined);
  $scope.schema = {
    "config": geodash.initial_data["data"]["map_config_schema"],
    "security": geodash.initial_data["data"]["security_schema"]
  };
  $scope.schema_flat = geodash.api.flatten($scope.schema, undefined);
  /////////////////////
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

        if("section" in pane && pane.section in $scope.schema.config)
        {
          fields_all = fields_all.concat($.map($scope.schema.config[pane.section], function(value, key){
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
  $scope.$watch('schema', $scope.updateVariables);

  var jqe = $($element);

  $scope.validateFields = function(field_flat_array)
  {
    for(var i = 0; i < field_flat_array.length; i++)
    {
      $scope.validateField(field_flat_array[i]);
    }
  };
  $scope.validateField = function(field_flat)
  {
    // Update map_config
    if(field_flat.indexOf("__") == -1)
    {
      $scope.workspace[field_flat] = $scope.workspace_flat[field_flat];
    }
    else
    {
      var keyChain = field_flat.split("__");
      var target = $scope.workspace;
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
          target.push($scope.workspace_flat[field_flat]);
        }
      }
      else
      {
        target[finalKey] = $scope.workspace_flat[field_flat];
      }
    }
  };

  //$scope.showOptions = function($event, field, field_flat)
  // $("#editor-field-"+field_flat);

  $scope.addToField = function($event, field, field_flat)
  {
    var currentValue = extract(field.split("."), $scope.workspace);
    if(Array.isArray(currentValue))
    {
      var valueToAdd = $("#editor-field-"+field_flat).val();
      if(angular.isString(valueToAdd) && valueToAdd != "")
      {
        var newValue = currentValue.push(valueToAdd);
        $scope.workspace[field] = newValue;
        $.each(geodash.api.flatten(newValue), function(i, x){
          $scope.workspace_flat[field_flat+"__"+i] = x;
        });
      }
    }
    else if(angular.isString(currentValue))
    {
      var valueToAdd = $("#editor-field-"+field_flat).val();
      if(angular.isString(valueToAdd) && valueToAdd != "")
      {
        $scope.workspace_flat[field_flat] = currentValue + "," + valueToAdd;
        $scope.validateField(field_flat);
      }
    }
    else if(angular.isNumber(currentValue))
    {
      var valueToAdd = $("#editor-field-"+field_flat).val();
      if(angular.isString(valueToAdd) && valueToAdd != "")
      {
        $scope.workspace_flat[field_flat] = currentValue + parseFloat(valueToAdd);
        $scope.validateField(field_flat);
      }
    }
    $("#editor-field-"+field_flat).val(null);
    try{
      $("#editor-field-"+field_flat).typeahead('val', null);
      $("#editor-field-"+field_flat).typeahead('close');
    }catch(err){}
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
      var payload = {
        'config': $scope.workspace.config,
        'security': $scope.workspace.security
      };
      $http.post('/api/dashboard/'+slug+'/config/save', payload, httpConfig).success(function(data)
      {
        console.log(data);
        if(data.success)
        {
          if(data.config.slug != slug)
          {
            window.location.href = '/dashboard/'+data.config.slug;
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
      if($scope.workspace.config.slug == slug)
      {
        alert("Cannot save as.  Need to specify new unique slug.");
        return 1;
      }

      var httpConfig = {
          'headers': {
            'Content-Type': 'application/json',
            'X-CSRFToken': $cookies['csrftoken']
          }
      };
      var payload = {
        'config': $scope.workspace.config,
        'security': $scope.workspace.security
      };
      $http.post('/api/dashboard/config/new', payload, httpConfig).success(function(data)
      {
        console.log(data);
        if(data.success)
        {
          window.location.href = '/dashboard/'+data.config.slug;
        }
        else
        {
            window.alert(data.message);
        }
      });
    }
  };
};

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

  $scope.validateModalField = function()
  {
    $scope.value_edit_field = $("#modal-edit-field-"+$scope.path_flat).val();

    $scope.workspace_flat[$scope.path_flat] = $scope.value_edit_field;

    $scope.updateValue(
      $scope.path_flat,
      $scope.workspace_flat,
      $scope.workspace);
  };

  $scope.updateValues = function(field_flat_array)
  {
    for(var i = 0; i < field_flat_array.length; i++)
    {
      $scope.updateValue(
        field_flat_array[i],
        $scope.workspace_flat,
        $scope.workspace);
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

  $scope.keyUpOnField = function($event)
  {
    if($event.keyCode == 13)
    {
      $scope.prependToField($event);
    }
  };

  $scope.prependToField = function($event)
  {
    var currentValue = extract($scope.path_array, $scope.workspace);
    var t = extract(($scope.schemapath_array || $scope.basepath_array), $scope.schema).type;
    if(t == "stringarray" || t == "textarray" || t == "templatearray" || t == "objectarray")
    {
      var valueToAdd = $("#editor-field-"+$scope.path_flat).val();
      if(angular.isString(valueToAdd) && valueToAdd != "")
      {
        var newValue = angular.isDefined(currentValue) ? [valueToAdd].concat(currentValue) : [valueToAdd];
        $scope.setValue($scope.path_flat, newValue, $scope.workspace);  // field, value, target
        $.each(geodash.api.flatten(newValue), function(i, x){
          $scope.workspace_flat[$scope.path_flat+"__"+i] = x;
        });
      }
    }
    else if(angular.isString(currentValue))
    {
      var valueToAdd = $("#editor-field-"+$scope.path_flat).val();
      if(angular.isString(valueToAdd) && valueToAdd != "")
      {
        $scope.workspace_flat[$scope.path_flat] = valueToAdd + "," + currentValue;
        $scope.setValue($scope.path_flat, $scope.workspace_flat[$scope.path_flat], $scope.workspace);  // field, value, target
      }
    }

    $("#editor-field-"+$scope.path_flat).val(null);
    try{
      $("#editor-field-"+$scope.path_flat).typeahead('val', null);
      $("#editor-field-"+$scope.path_flat).typeahead('close');
    }catch(err){}
  };

  $scope.subtractFromField = function($event, $index)
  {
    var currentValue = extract($scope.path_array, $scope.workspace);
    var t = extract(($scope.schemapath_array || $scope.basepath_array), $scope.schema).type;
    if(t == "stringarray" || t == "textarray" || t == "templatearray" || t == "objectarray")
    {
      currentValue.splice($index, 1);
      $scope.setValue($scope.path_flat, currentValue, $scope.workspace);  // field, value, target
      $.each(geodash.api.flatten(currentValue), function(i, x){
        $scope.workspace_flat[$scope.path_flat+"__"+i] = x;
      });
      delete $scope.workspace_flat[$scope.path_flat+"__"+(currentValue.length)];
    }
    else if(angular.isString(currentValue))
    {
      $scope.workspace_flat[$scope.path_flat] = currentValue.substring(0, $index) + currentValue.substring($index + 1);
      $scope.setValue($scope.path_flat, $scope.workspace_flat[$scope.path_flat], $scope.workspace);  // field, value, target
    }
    else if(angular.isNumber(currentValue))
    {
      $scope.workspace_flat[$scope.path_flat] = currentValue - $("#editor-field-"+$scope.path_flat).val();
      $scope.setValue($scope.path_flat, $scope.workspace_flat[$scope.path_flat], $scope.workspace);  // field, value, target
    }
    $("#editor-field-"+$scope.path_flat).val(null);
    try{
      $("#editor-field-"+$scope.path_flat).typeahead('val', null);
      $("#editor-field-"+$scope.path_flat).typeahead('close');
    }catch(err){}
  };

};

geodash.controllers["controller_modal_edit_object"] = function($scope, $element, $controller)
{

  angular.extend(this, $controller('GeoDashControllerModal', {$element: $element, $scope: $scope}));
  //////////////////////////////////
  var m = $.grep(geodash.meta.modals, function(x, i){ return x['name'] == 'edit_object';})[0];
  $scope.config = m.config;
  $scope.ui = m.ui;
  //////////////////////////////////
  $scope.html5data = geodashserver.html5data;
  $scope.updateValue = geodash.api.updateValue;
  //////////////////////////////////
  $scope.showOptions = geodash.ui.showOptions;
  //////////////////////////////////
  //////////////////////////////////

  $scope.when = function(object_field)
  {
    if(extract("when.field", object_field, undefined) != undefined)
    {
      var keyChain = $scope.stack.head.path_array.concat(
        object_field.when.field.split(".")
      );
      var value = extract(keyChain, $scope.stack.head.workspace);
      var arr = object_field.when.values || [];
      return $.inArray(value, arr) != -1;
    }
    else
    {
      return true;
    }
  };

  $scope.verbose_title = function(objectIndex)
  {
    if(angular.isDefined($scope.stack.head))
    {
      var keyChain = angular.isDefined(objectIndex) ?
        $scope.stack.head.path_array.concat([objectIndex]) :
        $scope.stack.head.path_array;
      var obj = extract(keyChain, $scope.stack.head.workspace);
      return extract('title', obj) || extract('id', obj) || objectIndex || $scope.stack.head.objectIndex;
    }
    else
    {
      return "";
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
      $scope.workspace_flat,
      $scope.workspace);

    $scope["object"] = extract(
      expand($scope.path_array),
      $scope.workspace);
  };

};

geodash.controllers["controller_modal_dashboard_security"] = function($scope, $element, $controller)
{
  angular.extend(this, $controller('GeoDashControllerModal', {$element: $element, $scope: $scope}));
  var m = $.grep(geodash.meta.modals, function(x, i){ return x['name'] == 'dashboard_security';})[0];
  $scope.config = m.config;
  $scope.ui = m.ui;
  $scope.html5data = geodashserver.html5data;
  $scope.updateValue = geodash.api.updateValue;
  $scope.showOptions = geodash.ui.showOptions;
};

geodash.controllers["controller_modal_dashboard_config"] = function($scope, $element, $controller)
{
  angular.extend(this, $controller('GeoDashControllerModal', {$element: $element, $scope: $scope}));
  var m = $.grep(geodash.meta.modals, function(x, i){ return x['name'] == 'dashboard_config';})[0];
  $scope.config = m.config;
  $scope.ui = m.ui;
  $scope.html5data = geodashserver.html5data;
  $scope.updateValue = geodash.api.updateValue;
  $scope.showOptions = geodash.ui.showOptions;
};

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
