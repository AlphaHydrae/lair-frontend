angular.module('lair').factory('mediaUrls', function($q) {

  var providers = [
    {
      name: 'anidb'
    },
    {
      name: 'imdb'
    }
  ];

  var service = {
    loadProviders: function() {
      return $q.when(providers);
    }
  };

  return service;
});
