angular.module('lair.auth').controller('AuthCtrl', function(auth, $log, $uibModal, $scope) {

  $scope.isAuthenticated = auth.isAuthenticated;

  $scope.showLoginDialog = function() {

    var modal = $uibModal.open({
      size: 'sm',
      templateUrl: '/modules/auth/auth.login.html',
      controller: 'LoginCtrl',
      windowClass: 'loginDialog'
    });

    modal.result.then(undefined, function() {
      $log.debug('User did not sign in');
    });
  };

  $scope.signOut = auth.unauthenticate;
});
