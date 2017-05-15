angular.module('lair').directive('gallery', function() {
  return {
    restrict: 'E',
    controller: 'GalleryCtrl',
    templateUrl: '/modules/gallery/gallery.html',
    scope: {
      records: '=',
      collection: '=',
      collectionModified: '=',
      displayEnabled: '=',
      displayType: '=',
      onSelect: '&',
      selected: '&'
    }
  };
});
