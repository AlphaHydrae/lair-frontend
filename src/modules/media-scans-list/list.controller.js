angular.module('lair').controller('MediaScansListCtrl', function(mediaScans, $scope, showMediaScanDialog, tables) {

  tables.create($scope, 'mediaScansList', {
    url: '/media/scans',
    params: {
      include: 'source'
    }
  });

  $scope.columns = $scope.currentUserIs('admin') ? 6 : 5;

  $scope.scanDuration = mediaScans.getDuration;
  $scope.scanIsInProgress = mediaScans.isInProgress;
  $scope.scanIsProcessed = mediaScans.isProcessed;
  $scope.scanIsScanning = mediaScans.isScanning;

  $scope.showMediaScan = function(scan) {
    if (mediaScans.isInProgress(scan)) {
      return;
    }

    showMediaScanDialog.open($scope, {
      mediaScanId: scan.id
    });
  };
});
