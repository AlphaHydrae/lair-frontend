angular.module('lair').factory('mediaScans', function() {

  var service = {
    isInProgress: function(scan) {
      return scan && (scan.state == 'created' || scan.state == 'scanning' || scan.state == 'scanned' || scan.state == 'processing');
    },

    getDuration: function(scan) {
      if (!scan) {
        return;
      }

      var endTime;
      if (scan.state == 'processed') {
        endTime = moment(scan.processedAt).valueOf();
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
