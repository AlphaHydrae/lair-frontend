angular.module('lair', [
  'angularMoment',
  'ngInflection',
  'ngSanitize',
  'prettyBytes',
  'satellizer',
  'smart-table',
  'ui.bootstrap',
  'ui.date',
  'ui.router',
  'ui.select',
  'ui.sortable',
  'lair.auth',
  'lair.collections.edit',
  'lair.collections.list',
  'lair.collections.show',
  'lair.companies',
  'lair.files.explorer',
  'lair.events.list',
  'lair.home',
  'lair.people',
  'lair.profile',
  'lair.routes',
  'lair.images',
  'lair.images.missing',
  'lair.media.compare',
  'lair.mediaIdent',
  'lair.mediaScans.list',
  'lair.mediaUrls.list',
  'lair.scrapers',
  'lair.scrapers.label',
  'lair.works.new',
  'lair.works.edit',
  'lair.works.list',
  'lair.items.new',
  'lair.items.edit',
  'lair.ownerships.list',
  'lair.status',
  'lair.users.edit',
  'lair.users.list',
  'lair.users.new'
])

  // configuration
  .constant('version', '{{ version }}')
  .constant('env', '{{ env }}')
  .constant('googleClientId', '{{ googleClientId }}')

  // enable debug log unless in production
  .config(function(env, $logProvider) {
    $logProvider.debugEnabled(env !== 'production');
  })

  // satellizer
  .config(function($authProvider, googleClientId) {
    $authProvider.google({
      clientId: googleClientId
    });
  })

  // angular-ui-select
  .config(function(uiSelectConfig) {
    uiSelectConfig.theme = 'bootstrap';
  })
;
