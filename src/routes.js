angular.module('lair.routes', [ 'ui.router' ])

  .config(function($stateProvider) {

    $stateProvider

      .state('home', {
        url: '^/',
        reloadOnSearch: false,
        controller: 'HomeCtrl',
        templateUrl: '/modules/home/home.html'
      })

      .state('profile', {
        url: '^/profile',
        controller: 'ProfileCtrl',
        templateUrl: '/modules/profile/profile.html'
      })

      .state('works', {
        abstract: true,
        url: '^/works',
        template: '<div ui-view />'
      })

      .state('works.list', {
        url: '^/works?explore',
        reloadOnSearch: false,
        controller: 'WorksListCtrl',
        templateUrl: '/modules/works-list/list.html'
      })

      .state('works.new', {
        url: '^/works/new',
        controller: 'NewWorkCtrl',
        templateUrl: '/modules/works-new/new.html'
      })

      .state('works.edit', {
        url: '/:workId/edit',
        controller: 'EditWorkCtrl',
        templateUrl: '/modules/works-edit/edit.html'
      })

      .state('items', {
        abstract: true,
        url: '^/items',
        template: '<div ui-view />'
      })

      .state('items.new', {
        url: '^/items/new?workId',
        controller: 'NewItemCtrl',
        templateUrl: '/modules/items-new/new.html'
      })

      .state('items.edit', {
        url: '/:itemId/edit',
        controller: 'EditItemCtrl',
        templateUrl: '/modules/items-edit/edit.html'
      })

      .state('collections', {
        abstract: true,
        url: '^/collections',
        template: '<div ui-view />'
      })

      .state('collections.list', {
        url: '^/collections',
        reloadOnSearch: false,
        controller: 'CollectionsListCtrl',
        templateUrl: '/modules/collections-list/list.html'
      })

      .state('collections.edit', {
        url: '/:id/edit',
        controller: 'EditCollectionCtrl',
        templateUrl: '/modules/collections-edit/edit.html'
      })

      .state('ownerships', {
        abstract: true,
        url: '^/ownerships',
        template: '<div ui-view />'
      })

      .state('ownerships.list', {
        url: '^/ownerships',
        controller: 'OwnershipsListCtrl',
        templateUrl: '/modules/ownerships-list/list.html'
      })

      .state('files', {
        abstract: true,
        url: '^/files',
        template: '<div ui-view />'
      })

      .state('files.explorer', {
        url: '?source&directory&deleted',
        reloadOnSearch: false,
        controller: 'FileExplorerCtrl',
        templateUrl: '/modules/files-explorer/explorer.html'
      })

      .state('mediaCompare', {
        url: '^/media/compare',
        controller: 'MediaCompareCtrl',
        templateUrl: '/modules/media-compare/compare.html'
      })

      .state('mediaIdent', {
        url: '^/media/ident?source&directory&completed',
        reloadOnSearch: false,
        controller: 'MediaIdentCtrl',
        templateUrl: '/modules/media-ident/ident.html'
      })

      .state('mediaScans', {
        abstract: true,
        url: '^/mediaScanning',
        template: '<div ui-view />'
      })

      .state('mediaScans.list', {
        url: '',
        reloadOnSearch: false,
        controller: 'MediaScansListCtrl',
        templateUrl: '/modules/media-scans-list/list.html'
      })

      .state('mediaUrls', {
        abstract: true,
        url: '^/mediaScraping',
        template: '<div ui-view />'
      })

      .state('mediaUrls.list', {
        url: '?show&warnings&provider&providerId&search',
        reloadOnSearch: false,
        controller: 'MediaUrlsListCtrl',
        templateUrl: '/modules/media-urls-list/list.html'
      })

      .state('images', {
        abstract: true,
        url: '^/images',
        template: '<div ui-view />'
      })

      .state('images.missing', {
        url: '/missing',
        templateUrl: '/modules/images-missing/missing.html'
      })

      .state('events', {
        abstract: true,
        url: '^/events',
        template: '<div ui-view />'
      })

      .state('events.list', {
        url: '^/events',
        controller: 'EventsListCtrl',
        templateUrl: '/modules/events-list/list.html'
      })

      .state('status', {
        url: '^/status',
        controller: 'StatusCtrl',
        templateUrl: '/modules/status/status.html'
      })

      .state('users', {
        abstract: true,
        url: '^/users',
        template: '<div ui-view />'
      })

      .state('users.list', {
        url: '^/users',
        controller: 'UsersListCtrl',
        templateUrl: '/modules/users-list/list.html'
      })

      .state('users.new', {
        url: '/new',
        controller: 'NewUserCtrl',
        templateUrl: '/modules/users-new/new.html'
      })

      .state('users.edit', {
        url: '/:id',
        controller: 'EditUserCtrl',
        templateUrl: '/modules/users-edit/edit.html'
      })

      .state('collection', {
        url: '^/:userName/:collectionName?explore',
        reloadOnSearch: false,
        controller: 'CollectionCtrl',
        templateUrl: '/modules/collections-show/show.html'
      })

    ;

  })

;
