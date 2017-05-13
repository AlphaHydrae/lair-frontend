angular.module('lair.mediaIdent.dialog').factory('mediaIdentDialog', function($uibModal) {

  var service = {
    open: function($scope, options) {
      options = _.extend({}, options);

      var scope = $scope.$new();
      _.extend(scope, _.pick(options, 'mediaDirectory'));

      var modal = $uibModal.open({
        size: 'lg',
        scope: scope,
        controller: 'MediaIdentDialogCtrl',
        templateUrl: '/modules/media-ident-dialog/dialog.html'
      });

      return modal;
    }
  };

  return service;
});
