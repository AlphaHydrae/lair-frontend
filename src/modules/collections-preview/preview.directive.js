angular.module('lair').directive('collectionPreview', function() {
  return {
    restrict: 'E',
    templateUrl: '/modules/collections-preview/preview.html',
    controller: 'CollectionPreviewCtrl',
    scope: {
      collection: '=',
      autoUpdate: '='
    },
    link: function($scope, element) {

      var e = $(element);
      $scope.countVisibleElements = function() {
        return e.find('.elements .element:visible').length;
      };
    }
  };
});
