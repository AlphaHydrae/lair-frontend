angular.module('lair').factory('mediaScans', function() {

  var processedStates = [ 'processed', 'analyzed' ];
  var progressStates = [ 'created', 'scanning', 'scanned', 'processing', 'processed' ];
  var scanningStates = [ 'created', 'scanning' ];

  var service = {
    isInProgress: function(scan) {
      return scan && _.includes(progressStates, scan.state);
    },

    isScanning: function(scan) {
      return scan && _.includes(scanningStates, scan.state);
    },

    isProcessed: function(scan) {
      return scan && _.includes(processedStates, scan.state);
    },

    isStopped: function(scan) {
      return !service.isInProgress(scan);
    },

    getDuration: function(scan) {
      if (!scan) {
        return;
      }

      var endTime;
      if (scan.state == 'analyzed') {
        endTime = moment(scan.analyzedAt).valueOf();
      } else if (scan.state == 'processingFailed') {
        endTime = moment(scan.processingFailedAt).valueOf();
      } else if (scan.state == 'canceled') {
        endTime = moment(scan.canceledAt).valueOf();
      } else if (service.isInProgress(scan)) {
        endTime = new Date().getTime();
      }

      if (!endTime) {
        return;
      }

      return endTime - moment(scan.createdAt).valueOf();
    }
  };

  return service;
});
