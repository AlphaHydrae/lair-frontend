angular.module('lair').factory('showMediaFileDialog', function($uibModal) {

  var service = {
    open: function(resolve) {

      var modal = $uibModal.open({
        resolve: _.mapValues(resolve || {}, function(value) {
          return _.isFunction(value) ? value : function() { return value; }
        }),
        component: 'showMediaFileDialog'
      });

      return modal;
    }
  };

  return service;
}).component('showMediaFileDialog', {
  controller: 'ShowMediaFileDialogCtrl',
  controllerAs: 'dialogCtrl',
  templateUrl: '/modules/media-files-show-dialog/dialog.html',
  bindings: {
    dismiss: '&',
    resolve: '<'
  }
}).controller('ShowMediaFileDialogCtrl', function(api, auth, $log, polling, $q) {

  var dialogCtrl = this;
  dialogCtrl.analyze = analyze;
  dialogCtrl.getStateClass = getStateClass;

  auth.addAuthFunctions(this);

  if (dialogCtrl.resolve.file) {
    dialogCtrl.file = dialogCtrl.resolve.file;
  } else {
    fetchFile(dialogCtrl.resolve.fileId).then(function(res) {
      dialogCtrl.file = res.data;
    });
  }

  function analyze() {
    dialogCtrl.analyzing = true;
    dialogCtrl.analysisFailed = false;

    $q.when()
      .then(analyzeFile)
      .then(pollFileAnalysis)
      .catch(function(err) {
        $log.warn(err);
        dialogCtrl.analysisFailed = true;
      });
  }

  function getStateClass() {
    if (_.includes([ 'created', 'changed' ], dialogCtrl.file.state)) {
      return 'text-info';
    } else if (_.includes([ 'unlinked' ], dialogCtrl.file.state)) {
      return 'text-warning';
    } else if (_.includes([ 'deleted', 'invalid', 'duplicated' ])) {
      return 'text-danger';
    } else {
      return 'text-success';
    }
  }

  function fetchFile(id) {
    return api({
      url: '/media/files/' + id,
      params: {
        include: 'mediaUrl'
      }
    });
  }

  function analyzeFile() {
    return api({
      method: 'POST',
      url: '/media/files/' + dialogCtrl.file.id + '/analysis'
    });
  }

  function pollFileAnalysis() {
    return polling.poll(function() {
      return fetchFile(dialogCtrl.file.id).then(function(res) {
        return res.data;
      });
    }, function(file) {
      return file.analyzed;
    }).then(function(file) {
      dialogCtrl.file = file;
    }).finally(function() {
      dialogCtrl.analyzing = false;
    });
  }
});
