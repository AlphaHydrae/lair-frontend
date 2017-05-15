angular.module('lair').filter('basename', function() {
  return function(input) {
    return input ? input.replace(/.*\//, '') : input;
  };
});
