angular.module('lair').component('mediaCompareWorks', {
  controller: 'MediaCompareWorksCtrl',
  controllerAs: 'compareWorksCtrl',
  templateUrl: '/modules/media-compare-works/compare-works.html',
  bindings: {
    category: '<',
    user1: '<',
    user2: '<'
  }
}).controller('MediaCompareWorksCtrl', function(api, titles) {

  var compareWorksCtrl = this;
  compareWorksCtrl.secondaryTitle = titles.secondaryTitle;

  clear();

  compareWorksCtrl.$onChanges = function() {
    if (compareWorksCtrl.category && compareWorksCtrl.user1 && compareWorksCtrl.user2) {
      fetchNextMissingWorks(1, compareWorksCtrl.user2.id, compareWorksCtrl.user1.id);
      fetchNextMissingWorks(2, compareWorksCtrl.user1.id, compareWorksCtrl.user2.id);
    } else {
      clear();
    }
  };

  function fetchNextMissingWorks(userNumber, owner, notOwner, start) {

    compareWorksCtrl['fetchingMissingWorksUser' + userNumber] = true;

    if (!start) {
      start = 0;
      compareWorksCtrl.missingWorks['user' + userNumber] = [];
      compareWorksCtrl.missingWorksPercentage['user' + userNumber] = 100;
      compareWorksCtrl['fetchedMissingWorksUser' + userNumber] = false;
    }

    api({
      url: '/works',
      params: {
        start: start,
        number: 100,
        categories: compareWorksCtrl.category,
        ownerIds: [ owner ],
        notOwnedBy: notOwner
      }
    }).then(function(res) {

      compareWorksCtrl.missingWorksPercentage['user' + userNumber] = res.pagination().percentage;
      compareWorksCtrl.missingWorks['user' + userNumber] = compareWorksCtrl.missingWorks['user' + userNumber].concat(res.data);

      if (res.pagination().hasMorePages()) {
        fetchNextMissingWorks(userNumber, owner, notOwner, start + res.data.length);
      } else {
        compareWorksCtrl['fetchingMissingWorksUser' + userNumber] = false;
        compareWorksCtrl['fetchedMissingWorksUser' + userNumber] = true;
      }
    });
  }

  function clear() {
    compareWorksCtrl.missingWorks = {};
    compareWorksCtrl.missingWorksPercentage = {};
    compareWorksCtrl.fetchingMissingWorksUser1 = false;
    compareWorksCtrl.fetchingMissingWorksUser2 = false;
    compareWorksCtrl.fetchedMissingWorksUser1 = false;
    compareWorksCtrl.fetchedMissingWorksUser2 = false;
  }
});
