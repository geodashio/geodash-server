geodash.directives["geodashModalDashboardSecurity"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'geodash_modal_dashboard_security.tpl.html',
    link: function ($scope, element, attrs){}
  };
};
