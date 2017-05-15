angular.module('lair').directive('languageSelect', function() {
  return {
    restrict: 'E',
    scope: {
      languages: '=',
      model: '=ngModel',
      multiple: '='
    },
    templateUrl: '/modules/forms/forms.languageSelect.html',
    controller: function($scope) {

      $scope.updateSelection = function(selected) {
        if ($scope.multiple) {
          $scope.model = _.map(selected, 'tag');
        } else {
          $scope.model = selected.tag;
        }
      };

      $scope.groupCommonLanguages = function(language) {
        return language.used ? 'Common' : 'Other';
      };
    }
  };
});
