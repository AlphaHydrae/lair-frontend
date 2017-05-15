angular.module('lair').controller('ScraperErrorModalCtrl', function(api, $uibModalInstance, $scope) {

  api({
    url: '/media/scraps/' + $scope.scrapId,
    params: {
      include: [ 'contents', 'errors', 'warnings' ]
    }
  }).then(function(res) {

    $scope.scrap = res.data;

    var contents = $scope.scrap.contents,
        contentType = $scope.scrap.contentType;

    if (contents) {
      switch (contentType) {
        case 'application/json':

          try {
            $scope.scrap.contents = JSON.stringify(JSON.parse(contents), null, '  ');
          } catch (err) {
            // Nothing to do.
          }

          break;
      }
    }
  });

  $scope.retry = function() {
    api({
      method: 'POST',
      url: '/media/scraps/' + $scope.scrapId + '/retry'
    }).then(function() {
      $uibModalInstance.dismiss();
    });
  };
});
