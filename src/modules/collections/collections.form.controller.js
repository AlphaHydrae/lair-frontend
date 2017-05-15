angular.module('lair').controller('CollectionFormCtrl', function(forms, works, $scope) {

  $scope.categories = works.categories.slice();

  $scope.changed = function() {
    return !forms.dataEquals($scope.collection, $scope.modifiedCollection, 'user');
  };
});
