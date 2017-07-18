angular.module('lair').controller('OwnDialogCtrl', function($scope) {

  $scope.dateOptions = {
    dateFormat: 'yy-mm-dd',
    firstDay: 1
  };

  $scope.ownership = {
    itemId: $scope.item.id,
    gottenAt: new Date()
  };

  $scope.create = function() {
    $scope.$emit('ownership', $scope.ownership, $scope.item);
  };
});
