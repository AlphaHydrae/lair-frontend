angular.module('lair.scrapers').factory('scrapers', function($uibModal) {

  var service = {
    openErrorModal: function($scope, scrapId) {

      var scope = $scope.$new();
      scope.scrapId = scrapId;

      var modal = $uibModal.open({
        size: 'lg',
        scope: scope,
        controller: 'ScraperErrorModalCtrl',
        templateUrl: '/modules/scrapers/scrapers.error.html'
      });

      return modal.result;
    },

    openSupportModal: function($scope) {

      var modal = $uibModal.open({
        size: 'lg',
        scope: $scope,
        templateUrl: '/modules/scrapers/scrapers.supported.html'
      })

      return modal.result;
    }
  };

  return service;
});
