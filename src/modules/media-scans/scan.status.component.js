angular.module('lair').component('scanStatus', {
  controller: 'ScanStatusCtrl',
  controllerAs: 'scanStatusCtrl',
  templateUrl: '/modules/media-scans/scan.status.component.html',
  bindings: {
    scan: '<'
  }
}).controller('ScanStatusCtrl', function(mediaScans) {

  var scanStatusCtrl = this;
  scanStatusCtrl.scanIsInProgress = _.partial(mediaScans.isInProgress, scanStatusCtrl.scan);
  scanStatusCtrl.getAnalysisProgress = getAnalysisProgress;

  function getAnalysisProgress() {
    if (scanStatusCtrl.scan.analysisProgress === undefined) {
      return 0;
    }

    return scanStatusCtrl.scan.analysisProgress * 100;
  }
});
