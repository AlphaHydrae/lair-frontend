angular.module('lair').controller('WorksListCtrl', function(explorer, $scope) {
  explorer.openFromLocation($scope);
});
