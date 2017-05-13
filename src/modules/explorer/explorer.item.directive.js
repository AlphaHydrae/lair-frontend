angular.module('lair.explorer').directive('explorerItem', function() {
  return {
    templateUrl: '/modules/explorer/explorer.item.html',
    controller: 'ExplorerItemCtrl',
    scope: {
      item: '=',
      params: '='
    }
  };
});
