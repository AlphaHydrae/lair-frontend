angular.module('lair')
  .constant('userRoles', [ 'admin', 'mediaManager' ])
  .constant('authTokenScopes', [
    {
      name: 'all',
      description: 'All actions'
    },
    {
      name: 'media:scanning',
      description: 'Manage media scanners, settings & sources, scan media files'
    }
  ]);
