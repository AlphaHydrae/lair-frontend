angular.module('lair')

  .run(function() {
    angular.module('infinite-scroll').value('THROTTLE_MILLISECONDS', 1000);
  })

;
