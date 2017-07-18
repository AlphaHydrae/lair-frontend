angular.module('lair').controller('UserFormCtrl', function($scope, userRoles) {
  $scope.roles = userRoles;
});
