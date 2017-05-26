angular.module('lair').controller('MediaCompareCtrl', function(api, $log, $q, $scope, titles, works) {

  $scope.filters = {};

  _.extend($scope, _.pick(works, 'categories'));

  api({
    url: '/users'
  }).then(function(res) {
    $scope.users = res.data;
  });

  $scope.$watch('filters.user1', function(value) {
    if (value) {
      $scope.users2 = _.filter($scope.users, function(user) {
        return user.id != value.id;
      });
    } else {
      delete $scope.users2;
    }
  });
});
