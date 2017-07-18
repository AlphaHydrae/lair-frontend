angular.module('lair').factory('authTokenDialog', function($uibModal) {

  var service = {
    open: function($scope, options) {
      options = _.extend({}, options);

      var scope = $scope.$new();

      var modal = $uibModal.open({
        scope: scope,
        controller: 'AuthTokenDialogCtrl',
        controllerAs: 'authTokenDialogCtrl',
        templateUrl: '/modules/auth-token-dialog/dialog.html'
      });

      return modal.result;
    }
  };

  return service;
}).controller('AuthTokenDialogCtrl', function(api, authTokenScopes, $scope, $uibModalInstance) {

  var authTokenDialogCtrl = this;

  authTokenDialogCtrl.scopes = authTokenScopes;
  authTokenDialogCtrl.token = {
    scopes: []
  };

  authTokenDialogCtrl.dateOptions = {
    changeMonth: true,
    changeYear: true,
    dateFormat: 'yy-mm-dd',
    firstDay: 1,
    minDate: moment().startOf('day').toDate()
  };

  authTokenDialogCtrl.authorized = _.reduce(authTokenScopes, function(memo, scope) {
    memo[scope.name] = false;
    return memo;
  }, {});

  authTokenDialogCtrl.isScopeEnabled = isScopeEnabled;
  authTokenDialogCtrl.toggleScope = toggleScope;
  authTokenDialogCtrl.toggleAllScopes = toggleAllScopes;
  authTokenDialogCtrl.isTokenValid = isTokenValid;
  authTokenDialogCtrl.generateToken = generateToken;

  $scope.$watch('authTokenDialogCtrl.token', function() {
    delete authTokenDialogCtrl.generatedToken;
  }, true);

  $scope.$watch('authTokenDialogCtrl.authorized', function() {
    authTokenDialogCtrl.token.scopes = _.map(getAuthorizedScopes(), 'name')
  }, true);

  function isTokenValid() {
    return _.some(authTokenScopes, function(scope) {
      return isScopeAuthorized(scope.name);
    });
  }

  function isScopeEnabled(scope) {
    return scope.name == 'all' || !isScopeAuthorized('all');
  }

  function toggleAllScopes() {

    var someNotAuthorized = _.some(authTokenScopes, function(scope) {
      return !isScopeAuthorized(scope.name);
    });

    if (someNotAuthorized) {
      toggleScope(_.find(authTokenScopes, { name: 'all' }));
    } else {
      _.each(authTokenScopes, function(scope) {
        setScopeAuthorized(scope.name, false);
      });
    }
  }

  function toggleScope(scope, $event) {
    if (!isScopeEnabled(scope)) {
      return;
    }

    if (!$event || !$($event.target).is('input[type="checkbox"]')) {
      setScopeAuthorized(scope.name, !isScopeAuthorized(scope.name));
    }

    if (scope.name == 'all' && isScopeAuthorized(scope.name)) {
      _.each(authTokenScopes, function(scope) {
        setScopeAuthorized(scope.name, true);
      });
    }
  }

  function isScopeAuthorized(name) {
    return authTokenDialogCtrl.authorized[name];
  }

  function setScopeAuthorized(name, authorized) {
    authTokenDialogCtrl.authorized[name] = authorized;
  }

  function getAuthorizedScopes() {
    return _.filter(authTokenScopes, function(scope) {
      return isScopeAuthorized(scope.name);
    });
  }

  function processToken(data) {
    if (data.expiresAt) {
      data.expiresAt = moment(data.expiresAt).endOf('day').toDate()
    }

    return data;
  }

  function generateToken() {
    return api({
      method: 'POST',
      url: '/tokens',
      data: processToken(authTokenDialogCtrl.token)
    }).then(function(res) {
      authTokenDialogCtrl.generatedToken = res.data.token;
    });
  }
});
