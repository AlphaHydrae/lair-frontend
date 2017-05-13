angular.module('lair.works.form').directive('workRelationship', function() {
  return {
    restrict: 'E',
    controller: 'WorkRelationshipCtrl',
    templateUrl: '/modules/works-form/form.relationship.html',
    scope: {
      relationship: '=',
      onRemove: '&'
    }
  };
});
