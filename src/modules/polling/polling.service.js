angular.module('lair').factory('polling', function($q, $log) {

  var service = {
    poll: poll
  };

  return service;

  function poll(poller, predicate, options) {
    options = _.extend({
      backoff: 1000,
      backoffCondition: _.isEqual.bind(_),
      tries: 10,
      totalTries: 1000,
      wait: 2000
    }, options);

    var state = {
      enabled: true,
      id: uuid.v4(),
      totalTry: 0,
      try: 0,
      wait: options.wait
    };

    var promise = $q.when(pollRecursive(poller, predicate, options, state));
    promise.cancel = function() {
      state.enabled = false;

      if (state.timeout && state.timeoutDeferred) {
        clearTimeout(state.timeout);

        var message = 'Polling canceled after ' + (state.try + 1) + ' tries';
        state.timeoutDeferred.reject(new Error(message));
        $log.debug(message);
      }
    };

    return promise;
  }

  function pollRecursive(poller, predicate, options, state) {
    if (!state.enabled) {
      $log.debug('Polling canceled after ' + (state.try + 1) + ' tries');
      return;
    } else if (state.totalTry === 0) {
      $log.debug('Poll ' + state.id + ' starting');
    }

    return poller().then(function(pollResult) {
      return $q.when(predicate.call(undefined, pollResult, state.previous)).then(function(successful) {
        if (successful) {
          return pollResult;
        } else if (state.try >= options.tries - 1 || state.totalTry >= options.totalTries - 1) {
          return $q.reject(new Error('Polling failed after ' + (state.totalTry + 1) + ' tries'));
        } else if (!state.enabled) {
          $log.debug('Polling canceled after ' + (state.try + 1) + ' tries');
          return;
        }

        return $q.when(options.backoffCondition(pollResult, state.previous)).then(function(backoff) {
          state.previous = pollResult;

          if (backoff) {
            state.try++;
            state.wait += options.backoff;
            $log.debug('Poll ' + state.id + ' backing off by ' + options.backoff + ', waiting ' + state.wait + 'ms');
          } else {
            if (state.totalTry === 0) {
              state.try++;
            } else {
              state.try = 0;
            }

            state.wait = options.wait;
            $log.debug('Poll ' + state.id + (state.totalTry === 0 ? '' : ' backoff reset,') + ' waiting ' + state.wait + 'ms');
          }

          state.totalTry++;

          state.timeoutDeferred = $q.defer();
          state.timeout = setTimeout(function() {
            state.timeoutDeferred.resolve();
          }, state.wait);

          return state.timeoutDeferred.promise.then(function() {
            return pollRecursive(poller, predicate, options, state);
          });
        });
      });
    })
  }
});
