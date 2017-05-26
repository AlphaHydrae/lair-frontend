angular.module('lair').component('mediaCompareFiles', {
  controller: 'MediaCompareFilesCtrl',
  controllerAs: 'compareFilesCtrl',
  templateUrl: '/modules/media-compare-files/compare-files.html',
  bindings: {
    category: '<',
    user1: '<',
    user2: '<'
  }
}).controller('MediaCompareFilesCtrl', function(api, $scope, titles) {

  var compareFilesCtrl = this;
  compareFilesCtrl.secondaryTitle = titles.secondaryTitle;

  compareFilesCtrl.filters = {};
  compareFilesCtrl.sources = {};

  compareFilesCtrl.fingerprints = {
    user1: [],
    user2: []
  };

  compareFilesCtrl.comparisons = [];

  api({
    url: '/users'
  }).then(function(res) {
    compareFilesCtrl.users = res.data;
  });

  compareFilesCtrl.$onChanges = function(changes) {
    if (changes.user1 && changes.user1.currentValue) {
      fetchSources(1, changes.user1.currentValue.id);
    }

    if (changes.user2 && changes.user2.currentValue) {
      fetchSources(2, changes.user2.currentValue.id);
    }
  };

  $scope.$watchGroup([ 'compareFilesCtrl.filters.source1', 'compareFilesCtrl.filters.source2' ], function(values) {

    var source1Id = values[0],
        source2Id = values[1];

    if (source1Id && source2Id) {
      compareFilesCtrl.comparisons = [];
      fetchNextFingerprints(source1Id, source2Id);
    }
  });

  function fetchNextFingerprints(source1Id, source2Id, start) {

    start = start || 0
    compareFilesCtrl.fetchingFingerprints = true;
    compareFilesCtrl.fetchingFingerprintsPercentage = compareFilesCtrl.fetchingFingerprintsPercentage || 0;

    api({
      url: '/media/fingerprints',
      params: {
        start: start,
        number: 100,
        sourceId: [ source1Id, source2Id ],
        category: compareFilesCtrl.category
      }
    }).then(function(res) {

      compareFilesCtrl.fetchingFingerprintsPercentage = res.pagination().percentage;

      _.each(res.data, compareFingerprint);

      if (res.pagination().hasMorePages()) {
        fetchNextFingerprints(source1Id, source2Id, start + res.data.length);
      } else {
        compareFilesCtrl.fetchingFingerprints = false;
      }
    });
  }

  function compareFingerprint(fingerprint) {

    var userNumber = fingerprint.sourceId == compareFilesCtrl.filters.source1 ? 1 : 2,
        userFingerprints = compareFilesCtrl.fingerprints['user' + userNumber],
        otherUserNumber = userNumber == 1 ? 2 : 1,
        otherUserFingerprints = compareFilesCtrl.fingerprints['user' + otherUserNumber];

    var correspondingFingerprint = _.find(otherUserFingerprints, { mediaUrlId: fingerprint.mediaUrlId });
    if (correspondingFingerprint) {
      otherUserFingerprints.splice(otherUserFingerprints.indexOf(correspondingFingerprint), 1);
      addFingerprintComparison(userNumber == 1 ? fingerprint : correspondingFingerprint, userNumber == 1 ? correspondingFingerprint : fingerprint);
    } else {
      userFingerprints.push(fingerprint);
    }
  }

  function addFingerprintComparison(f1, f2) {

    var result = 'identical';
    if (f1.contentSize != f2.contentSize || f1.contentFilesCount != f2.contentFilesCount) {
      result = 'contentDifferent';
    } else if (f1.totalSize != f2.totalSize || f1.totalFilesCount != f2.totalFilesCount) {
      result = 'totalDifferent';
    } else {
      return;
    }

    api({
      url: '/works',
      params: {
        mediaUrlId: f1.mediaUrlId
      }
    }).then(function(res) {
      if (!res.data.length) {
        $log.warn('Could not find work for media url ' + f1.mediaUrlId);
        return;
      }

      compareFilesCtrl.comparisons.push({
        work: res.data[0],
        f1: f1,
        f2: f2,
        result: result
      });
    });
  }

  function fetchSources(userNumber, userId) {
    api.all({
      url: '/media/sources',
      params: {
        userId: userId
      }
    }).then(function(sources) {
      compareFilesCtrl.sources['user' + userNumber] = sources;
    });
  }
});
