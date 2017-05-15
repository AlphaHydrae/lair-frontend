angular.module('lair').controller('UsersListCtrl', function(api, $scope, tables) {
  tables.create($scope, 'usersList', {
    url: '/users'
  });
});
