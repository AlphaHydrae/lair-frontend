angular.module('lair').config(function($authProvider, googleClientId) {
  $authProvider.google({
    clientId: googleClientId
  });

  $authProvider.tokenPrefix = 'lair.satellizer';
});
