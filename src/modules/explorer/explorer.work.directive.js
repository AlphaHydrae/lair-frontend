angular.module('lair.explorer').directive('explorerWork', function() {
  return {
    templateUrl: '/modules/explorer/explorer.work.html',
    controller: 'ExplorerWorkCtrl',
    scope: {
      work: '=',
      params: '='
    }
  };
});
