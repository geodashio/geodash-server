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
