geodash.directives["geodashserverModalWelcome"] = function(){
  return {
    controller: ['$scope', function($scope) {}],
    restrict: 'EA',
    replace: true,
    //scope: {
    //  layer: "=layer"
    //},
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'modal_welcome_geodashserver.tpl.html',
    link: function ($scope, $element, attrs)
    {

      setTimeout(function(){
        geodash.init.typeahead($element);
        geodashserver.welcome({'scope': $scope});
      }, 10);

    }
  };
};
