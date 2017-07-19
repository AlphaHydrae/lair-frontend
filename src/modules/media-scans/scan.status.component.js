angular.module('lair').component('scanStatus', {
  controller: 'ScanStatusCtrl',
  controllerAs: 'scanStatusCtrl',
  templateUrl: '/modules/media-scans/scan.status.component.html',
  bindings: {
    scan: '<'
  }
}).controller('ScanStatusCtrl', function(mediaScans) {

  var scanStatusCtrl = this;
  scanStatusCtrl.scanIsInProgress = mediaScans.isInProgress;
});
