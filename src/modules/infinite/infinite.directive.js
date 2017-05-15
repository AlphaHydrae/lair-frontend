angular.module('lair').directive('infinite', function() {
  return {
    restrict: 'E',
    templateUrl: '/modules/infinite/infinite.html',
    controller: 'InfiniteCtrl',
    transclude: true,
    scope: {
      records: '=',
      httpSettings: '=',
      infiniteOptions: '=',
      onFetched: '&?',
      onRecordsUpdated: '&?'
    }
  };
});
