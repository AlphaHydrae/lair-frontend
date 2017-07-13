angular.module('lair').factory('polling', function($q) {

  var service = {
    poll: poll
  };

  return service;

  function poll(poller, predicate, options) {
    options = _.extend({
      tries: 10,
      wait: 1000
    }, options);

    var state = {
      try: 0,
      wait: options.wait
    };

    return pollRecursive(poller, predicate, options, state);
  }

  function pollRecursive(poller, predicate, options, state) {
    return poller().then(function(result) {
      return $q.when(predicate.apply(undefined, arguments)).then(function(successful) {
        if (successful) {
          return result;
        } else if (state.try >= options.tries - 1) {
          return $q.reject(new Error('Polling failed after ' + options.tries + ' tries'));
        }

        var deferred = $q.defer();

        setTimeout(function() {
          deferred.resolve();
        }, state.wait);

        return deferred.promise.then(function() {
          state.try++;
          state.wait += options.wait;
          return pollRecursive(poller, predicate, options, state);
        });
      });
    })
  }
});
