angular.module('lair').controller('MediaScansListCtrl', function(api, mediaScans, polling, $log, $scope, showMediaScanDialog, tables) {

  tables.create($scope, 'mediaScansList', {
    url: '/media/scans',
    params: {
      include: 'source'
    }
  });

  var polls = [];
  $scope.columns = $scope.currentUserIs('admin') ? 6 : 5;

  $scope.scanDuration = mediaScans.getDuration;
  $scope.scanIsInProgress = mediaScans.isInProgress;
  $scope.scanIsProcessed = mediaScans.isProcessed;
  $scope.scanIsScanning = mediaScans.isScanning;
  $scope.showMediaScan = showMediaScan;

  $scope.$on('mediaScansList.refreshed', function(event, list) {
    trackInProgressScans(list.records);
  });

  function showMediaScan(scan) {
    if (mediaScans.isInProgress(scan)) {
      return;
    }

    showMediaScanDialog.open($scope, {
      mediaScanId: scan.id
    });
  }

  function trackInProgressScans(scans) {
    _.each(polls, function(poll) {
      poll.cancel();
    });

    polls.length = 0;

    polls = _.map(_.filter(scans, mediaScans.isInProgress), function(scan) {

      var poll = polling.poll(_.partial(pollScanStatus, scan), _.partial(mediaScans.isStopped, scan));

      poll.catch(function(err) {
        $log.warn('Scan analysis timed out', err);
      });

      return poll;
    });
  }

  function pollScanStatus(scan) {
    return api({
      url: '/media/scans/' + scan.id
    }).then(function(res) {
      return _.extend(scan, res.data);
    });
  }
});
