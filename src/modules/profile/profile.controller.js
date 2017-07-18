angular.module('lair').controller('ProfileCtrl', function(api, auth, authTokenDialog, forms, $scope) {

  $scope.user = _.omit($scope.currentUser, 'activeAt');

  $scope.save = saveProfile;
  $scope.reset = resetModifiedUser;
  $scope.openAuthTokenDialog = openAuthTokenDialog;
  $scope.$watch('user', resetModifiedUser);

  $scope.changed = function() {
    return !forms.dataEquals($scope.user, $scope.modifiedUser);
  };

  function openAuthTokenDialog() {
    authTokenDialog.open($scope);
  }

  function saveProfile() {
    api({
      method: 'PATCH',
      url: '/users/' + $scope.user.id,
      data: $scope.modifiedUser
    }).then(function(res) {
      $scope.user = res.data;
      auth.updateCurrentUser(res.data);
    });
  }

  function resetModifiedUser() {
    $scope.modifiedUser = angular.copy($scope.user);
  }
});
