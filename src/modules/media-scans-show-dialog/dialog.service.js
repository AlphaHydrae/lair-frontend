angular.module('lair').factory('showMediaScanDialog', function($uibModal) {

  var service = {
    open: function($scope, options) {
      options = _.extend({}, options);

      var scope = $scope.$new();
      _.extend(scope, _.pick(options, 'mediaScan', 'mediaScanId'));

      var modal = $uibModal.open({
        size: 'lg',
        scope: scope,
        controller: 'ShowMediaScanDialogCtrl',
        templateUrl: '/modules/media-scans-show-dialog/dialog.html'
      });

      return modal.result;
    }
  };

  return service;
}).controller('ShowMediaScanDialogCtrl', function(api, mediaScans, $uibModalInstance, $scope) {

  var mediaScanId = _.get($scope, 'mediaScan.id', $scope.mediaScanId);
  if (!$scope.mediaScan && mediaScanId) {
    fetchMediaScan(mediaScanId);
  }

  var page = 0;
  $scope.changes = [];
  $scope.currentPage = 1;
  $scope.changesPageLinks = [];
  $scope.pageSize = 100;
  $scope.scanDuration = mediaScans.getDuration;

  $scope.$watch('mediaScan.id', function(value) {
    if (value && $scope.mediaScan.changedFilesCount >= 1 && mediaScans.isProcessed($scope.mediaScan)) {
      showChangesPage($scope.currentPage);
    }
  });

  $scope.showChangesPage = showChangesPage;
  $scope.getChangesRange = getChangesRange;
  $scope.retry = retryProcessing;
  $scope.reanalyze = reanalyze;

  function reanalyze() {
    api({
      method: 'POST',
      url: '/media/scans/' + mediaScanId + '/analysis'
    }).then(function() {
      $uibModalInstance.dismiss();
    });
  }

  function retryProcessing() {
    api({
      method: 'POST',
      url: '/media/scans/' + mediaScanId + '/retry'
    }).then(function() {
      $uibModalInstance.dismiss();
    });
  }

  function getChangesRange() {
    var start = ($scope.currentPage - 1) * $scope.pageSize;
    var end = Math.min($scope.currentPage * $scope.pageSize - 1, $scope.mediaScan.changedFilesCount);
    return start + '-' + end;
  }

  function fetchMediaScan(id) {
    api({
      url: '/media/scans/' + id,
      params: {
        include: [ 'errors', 'source' ]
      }
    }).then(function(res) {
      $scope.mediaScan = res.data;
    });
  }

  function showChangesPage(page) {
    if ($scope.changes.length && page == $scope.currentPage) {
      return;
    }

    $scope.currentPage = page;

    api({
      url: '/media/scans/' + mediaScanId + '/files',
      params: {
        include: 'data',
        start: (page - 1) * $scope.pageSize,
        number: $scope.pageSize
      }
    }).then(function(res) {
      $scope.changes = res.data;
      updateChangesPageLinks();
    });
  }

  function updateChangesPageLinks() {

    var numberOfPages = Math.ceil($scope.mediaScan.changedFilesCount / $scope.pageSize);
    if (numberOfPages <= 1) {
      $scope.changesPageLinks = [];
      delete $scope.lastPage;
    } else if (numberOfPages <= 5) {
      $scope.changesPageLinks = _.map(new Array(numberOfPages), function(i) {
        return i + 1;
      });
      $scope.lastPage = numberOfPages;
    } else {

      $scope.changesPageLinks = [ $scope.currentPage ];
      addPageLinks($scope.changesPageLinks, Math.max(1, $scope.currentPage - 2));
      addPageLinks($scope.changesPageLinks, Math.min(numberOfPages, $scope.currentPage + 2));
      addPageLinks($scope.changesPageLinks, Math.max(1, $scope.currentPage - 4));
      addPageLinks($scope.changesPageLinks, Math.min(numberOfPages, $scope.currentPage + 4));

      $scope.lastPage = numberOfPages;
    }
  }

  function addPageLinks(links, limit) {
    if (links.length >= 5) {
      return;
    }

    var direction = 1;
    if (limit <= links[0]) {
      direction = -1;
    } else if (limit < links[links.length - 1]) {
      throw new Error('Limit ' + limit + ' inconsistent with links ' + JSON.stringify(links));
    }

    while (links.length < 5 && direction > 0 ? (limit - links[links.length - 1] > 0) : (links[0] - limit > 0)) {
      if (direction > 0) {
        links.push(links[links.length - 1] + 1);
      } else {
        links.unshift(links[0] - 1);
      }
    }
  }
});
