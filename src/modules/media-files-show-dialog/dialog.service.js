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
}).controller('ShowMediaFileDialogCtrl', function(api, auth) {

  var dialogCtrl = this;
  dialogCtrl.analyze = analyze;
  dialogCtrl.getStateClass = getStateClass;

  auth.addAuthFunctions(this);

  if (dialogCtrl.resolve.file) {
    dialogCtrl.file = dialogCtrl.resolve.file;
  } else {
    api({
      url: '/media/files/' + dialogCtrl.resolve.fileId,
      params: {
        include: 'mediaUrl'
      }
    }).then(function(res) {
      dialogCtrl.file = res.data;
    });
  }

  function analyze() {
    console.log('Not yet implemented');
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
});
