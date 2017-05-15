angular.module('lair').directive('editCollectionLinks', function() {
  return {
    restrict: 'E',
    templateUrl: '/modules/collections-edit/edit.links.html',
    controller: 'EditCollectionLinksCtrl',
    scope: {
      collection: '=',
      enabled: '='
    }
  };
});
