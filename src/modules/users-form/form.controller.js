angular.module('lair').controller('UserFormCtrl', function(auth, $scope) {
  $scope.roles = auth.roles;
});
