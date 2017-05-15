angular.module('lair').config(function(env, $logProvider) {
  $logProvider.debugEnabled(env !== 'production');
});
