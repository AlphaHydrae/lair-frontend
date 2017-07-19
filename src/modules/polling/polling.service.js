angular.module('lair').factory('polling', function($q, $log) {

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
      enabled: true,
      try: 0,
      wait: options.wait
    };

    var pollHandle = {};

    pollHandle.promise = pollRecursive(poller, predicate, options, state);
    pollHandle.then = function(onResolved, onRejected) {
      return pollHandle.promise.then(onResolved, onRejected);
    };
    pollHandle.catch = function(onRejected) {
      return pollHandle.promise.then(undefined, onRejected);
    };

    pollHandle.cancel = function() {
      state.enabled = false;
    };

    return pollHandle;
  }

  function pollRecursive(poller, predicate, options, state) {
    if (!state.enabled) {
      $log.debug('Polling canceled after ' + (state.try + 1) + ' tries');
      return;
    }

    return poller().then(function(result) {
      return $q.when(predicate.apply(undefined, arguments)).then(function(successful) {
        if (successful) {
          return result;
        } else if (state.try >= options.tries - 1) {
          return $q.reject(new Error('Polling failed after ' + options.tries + ' tries'));
        } else if (!state.enabled) {
          $log.debug('Polling canceled after ' + (state.try + 1) + ' tries');
          return;
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
