angular.module('lair').component('scanFileCounts', {
  controller: 'ScanFileCountsCtrl',
  controllerAs: 'scanFileCountsCtrl',
  templateUrl: '/modules/media-scans/scan.file-counts.component.html',
  bindings: {
    scan: '<'
  }
}).controller('ScanFileCountsCtrl', function(mediaScans) {

  var scanFileCountsCtrl = this;
  scanFileCountsCtrl.scanIsProcessed = _.partial(mediaScans.isProcessed, scanFileCountsCtrl.scan);
});
