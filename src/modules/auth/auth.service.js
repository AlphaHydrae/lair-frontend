angular.module('lair').factory('auth', function(appStore, $auth, $log, $rootScope, tokenAuth) {

  var service = {
    roles: [ 'admin', 'mediaManager' ],

    authenticate: function(provider, authCredentials) {
      if (provider === 'token') {
        return tokenAuth.authenticate(authCredentials).then(signIn);
      } else {
        return $auth.authenticate(provider).then(signIn);
      }
    },

    unauthenticate: function() {
      $auth.logout().then(function() {
        appStore.remove('auth.user');
        delete service.currentUser;
        delete $rootScope.currentUser;
        $log.debug('User has signed out');
      });
    },

    isAuthenticated: $auth.isAuthenticated,

    updateCurrentUser: function(user) {
      if (user.id == service.currentUser.id) {
        service.currentUser = user;
        $rootScope.currentUser = service.currentUser;
        appStore.set('auth.user', service.currentUser);
      }
    },

    currentUserIs: function() {
      if (!service.currentUser) {
        return false;
      }

      var requiredRoles = Array.prototype.slice.call(arguments);
      var unknownRoles = _.difference(requiredRoles, service.roles);
      if (unknownRoles.length) {
        throw new Error('Unknown roles ' + unknownRoles.join(', '));
      }

      var currentUserRoles = service.currentUser.roles || [];
      if (_.includes(currentUserRoles, 'admin')) {
        return true;
      }

      return _.intersection(currentUserRoles, requiredRoles).length == requiredRoles.length;
    },

    addAuthFunctions: function($scope) {
      $scope.currentUserIs = service.currentUserIs;
    }
  };

  if ($auth.isAuthenticated()) {
    service.currentUser = appStore.get('auth.user');
    $rootScope.currentUser = service.currentUser;
  }

  function signIn(response) {

    var user = response.data.user;
    service.currentUser = user;
    $rootScope.currentUser = user;
    appStore.set('auth.user', user);

    $log.debug('User ' + user.email + ' has signed in');

    return response;
  }

  return service;
});
