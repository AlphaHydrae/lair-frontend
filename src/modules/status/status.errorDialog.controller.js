angular.module('lair').controller('ImageUploadErrorDialogCtrl', function(api, $scope) {
  api({
    url: '/images/' + $scope.selectedImage.id + '/uploadError'
  }).then(function(res) {
    $scope.uploadError = res.data;
  });
});
