angular.module('lair.collections.edit').directive('editCollectionLinks', function() {
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
