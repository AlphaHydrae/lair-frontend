angular.module('lair').directive('propertiesEditor', function() {
  return {
    restrict: 'E',
    controller: 'PropertiesEditorCtrl',
    controllerAs: 'ctrl',
    templateUrl: '/modules/properties/properties.html',
    scope: {
      model: '=model'
    }
  };
});
