angular.module('lair').factory('appStore', function(store) {
  return store.getNamespacedStore('lair');
});
