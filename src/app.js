angular.module('lair', [
  'angular-clipboard',
  'angular-storage',
  'angularMoment',
  'infinite-scroll',
  'ngInflection',
  'ngSanitize',
  'prettyBytes',
  'satellizer',
  'smart-table',
  'ui.bootstrap',
  'ui.date',
  'ui.gravatar',
  'ui.router',
  'ui.select',
  'ui.sortable'
])

  .constant('version', '{{ version }}')
  .constant('env', '{{ env }}')
  .constant('googleClientId', '{{ googleClientId }}')

;
