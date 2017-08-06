angular.module('lair').controller('FileExplorerCtrl', function(api, auth, $location, $log, polling, $q, $scope, scrapers, showMediaFileDialog, $stateParams) {
  // TODO: investigate infinite loop bug when changing directory while analyzing

  var fileModal;
  var fileShown = $stateParams.file;
  var directoryAnalysisPoll;
  var refreshMoreUnanalyzedFiles;
  var refreshUnanalyzedFilesPromise;
  var refreshFilesBatchSize = 60;

  $scope.$on('$destroy', function() {
    if (directoryAnalysisPoll) {
      directoryAnalysisPoll.cancel();
      directoryAnalysisPoll = undefined;
    }
  });

  $scope.mediaFilesList = {
    records: [],
    httpSettings: {
      url: '/media/files',
      params: {
        include: [ 'filesCount', 'linkedFilesCount', 'mediaUrl' ]
      }
    },
    infiniteOptions: {
      enabled: false
    }
  };

  $scope.$watch('mediaFilesList.mediaSource', function(value, oldValue) {
    if (value) {

      $location.search('source', value.id);

      var directory;
      if (oldValue && value != oldValue) {
        directory = '/';
        delete $scope.operationTriggered;
      } else {
        directory = $stateParams.directory || '/';
      }

      var params = $scope.mediaFilesList.httpSettings.params;
      _.extend(params, {
        directory: directory,
        deleted: $stateParams.deleted || 0,
        maxDepth: 1,
        sourceId: value.id
      });

      resetBreadcrumbs();

      $scope.mediaFilesList.infiniteOptions.enabled = true;

      fetchFilesCount(value);
    }
  });

  $scope.$watchGroup([ 'mediaFilesList.mediaSource', 'mediaFilesList.httpSettings.params.directory' ], function(values, oldValues) {
    if (values[0] && values[1] && (!oldValues[0] || !oldValues[1] || values[0].id != oldValues[0].id || values[1] != oldValues[1])) {
      refreshMoreUnanalyzedFiles = false;
      updateCurrentDirectory(values[0], values[1]);
    }
  });

  $scope.$watch('currentDirectory', function(value, oldValue) {
    if (value && (!oldValue || value.id != oldValue.id)) {
      pollDirectoryAnalysisProgress(value);
    }
  });

  // TODO: add text search
  $scope.$on('$locationChangeSuccess', function() {

    var search = $location.search(),
        params = $scope.mediaFilesList.httpSettings.params;

    if (search.source != params.sourceId) {
      var mediaSource = _.find($scope.mediaSources, { id: search.source });
      if (mediaSource) {
        $scope.mediaFilesList.mediaSource = mediaSource;
      }
    }

    if ((search.directory || '/') != params.directory) {
      params.directory = search.directory || '/';
      resetBreadcrumbs();
    }

    if ((search.deleted || 0) != params.deleted) {
      params.deleted = search.deleted;
    }

    if (search.file != fileShown) {
      $scope.openFile(search.file);
    }
  });

  $scope.$watch('mediaFilesList.httpSettings.params.directory', function(directory) {
    $location.search('directory', directory && directory != '/' ? directory : null);
  });

  $scope.$watch('mediaFilesList.httpSettings.params.deleted', function(deleted) {
    $location.search('deleted', deleted ? deleted : null);
  });

  api.all({
    url: '/media/sources',
    params: {
      userId: auth.currentUser.id,
      include: 'scanPaths'
    }
  }).then(function(sources) {
    $scope.mediaSources = sources;
    if (sources.length && !$scope.mediaFilesList.mediaSource) {
      $scope.mediaFilesList.mediaSource = _.find(sources, { id: $stateParams.source }) || sources[0];
    }
  });

  $scope.breadcrumbs = [];

  $scope.openDirectory = function(path) {

    var params = $scope.mediaFilesList.httpSettings.params,
        currentDirectory = params.directory;

    params.directory = path;

    var index = _.indexOf($scope.breadcrumbs, path);
    if (index >= 0) {
      $scope.breadcrumbs.splice(index + 1, $scope.breadcrumbs.length - index - 1);
    } else if (path.indexOf(params.currentDirectory + '/') === 0) {
      $scope.breadcrumbs.push(path);
    } else {
      resetBreadcrumbs();
    }
  };

  $scope.openFile = function(fileOrId) {
    if (!fileOrId) {
      if (fileModal) {
        fileModal.dismiss();
      }
      fileShown = undefined;
      return;
    }

    var file;
    var fileId;
    if (fileOrId.id) {
      file = fileOrId;
      fileId = fileOrId.id;
    } else {
      fileId = fileOrId;
    }

    fileShown = fileId;
    $location.search('file', fileId);

    fileModal = showMediaFileDialog.open({
      file: file,
      fileId: fileId
    });

    fileModal.result.finally(function() {
      fileModal = undefined;
      $location.search('file', null);
    });
  };

  $scope.openRoot = function() {
    $scope.breadcrumbs.length = 0;
    $scope.mediaFilesList.httpSettings.params.directory = '/';
  };

  $scope.showSupportedScrapers = function() {
    scrapers.openSupportModal();
  };

  $scope.onFilesUpdated = function(files) {
    updateDirectoryMessage();
  };

  $scope.cleanupSource = function(source) {
    delete $scope.operationTriggered;

    return api({
      method: 'POST',
      url: '/media/sources/' + source.id + '/cleanup'
    }).then(function() {
      $scope.operationTriggered = 'Cleanup triggered';
    });
  };

  $scope.reanalyzeSource = function(source) {
    delete $scope.operationTriggered;

    return api({
      method: 'POST',
      url: '/media/sources/' + source.id + '/analysis'
    }).then(function() {
      $scope.operationTriggered = 'Analysis triggered';

      var filesPromise = refreshFiles($scope.mediaFilesList.records.slice());
      var directoryPromise = refreshCurrentDirectory().then(function(directory) {
        $scope.currentDirectoryUnanalyzedFilesCount = directory.unanalyzedFilesCount;
        pollDirectoryAnalysisProgress(directory);
      });

      return $q.all([
        filesPromise,
        directoryPromise
      ]);
    });
  };

  if (fileShown) {
    $scope.openFile(fileShown);
  }

  $scope.getFileStatus = function(file) {
    if (fileIsBeingAnalyzed(file)) {
      return 'analyzing';
    } else if (file.deleted) {
      return 'deleted';
    } else if (nfoIs(file, 'duplicate')) {
      return 'duplicateNfo';
    } else if (nfoIs(file, 'invalid')) {
      return 'invalidNfo';
    } else if (directoryHasUnlikedFiles(file)) {
      return 'unlinkedFiles';
    } else if (fileIsUnlinked(file)) {
      return 'unlinked';
    }
  };

  $scope.fileIsPending = function(file) {
    return _.includes([ 'analyzing' ], $scope.getFileStatus(file));
  };

  $scope.fileHasError = function(file) {
    return _.includes([ 'deleted', 'duplicateNfo', 'invalidNfo' ], $scope.getFileStatus(file));
  };

  $scope.fileHasWarning = function(file) {
    return _.includes([ 'unlinkedFiles', 'unlinked' ], $scope.getFileStatus(file));
  };

  $scope.getAnalysisProgress = function() {
    if (!$scope.currentDirectory || !$scope.currentDirectory.unanalyzedFilesCount) {
      return;
    }

    var progress = $scope.currentDirectoryUnanalyzedFilesCount - $scope.currentDirectory.unanalyzedFilesCount;
    return Math.round(progress * 100 / $scope.currentDirectoryUnanalyzedFilesCount);
  };

  function fileIsBeingAnalyzed(file) {
    return !file.deleted && ((file.type == 'file' && !file.analyzed) || (file.type == 'directory' && file.unanalyzedFilesCount));
  }

  function nfoIs(file, error) {
    return !file.deleted && file.type == 'file' && file.extension == 'nfo' && file.nfoError == error;
  }

  function directoryHasUnlikedFiles(file) {
    return !file.deleted && file.type == 'directory' && file.linkedFilesCount < file.filesCount;
  }

  function fileIsUnlinked(file) {
    return !file.deleted && file.type == 'file' && file.extension != 'nfo' && !file.mediaUrlId;
  }

  function updateCurrentDirectory(source, path) {
    api({
      url: '/media/files',
      params: {
        sourceId: source.id,
        path: path
      }
    }).then(function(res) {
      if (!res.data.length) {
        return;
      }

      $scope.currentDirectory = res.data[0];
      $scope.currentDirectoryUnanalyzedFilesCount = res.data[0].unanalyzedFilesCount;
    });
  }

  function pollDirectoryAnalysisProgress(directory) {
    if (directoryAnalysisPoll) {
      directoryAnalysisPoll.cancel();
      directoryAnalysisPoll = undefined;
    }

    if (directory.deleted || !directory.unanalyzedFilesCount) {
      return;
    }

    $log.debug('Polling analysis progress of directory', directory.path);
    directoryAnalysisPoll = polling.poll(refreshCurrentDirectory, directoryIsAnalyzed);
  }

  function directoryIsAnalyzed(directory, previous) {
    if (!directory.unanalyzedFilesCount) {
      $log.debug('Refreshing all remaining unanalyzed files');
      refreshFiles(_.shuffle(getUnanalyzedFiles())).then(updateDirectoryMessage);
    } else if (!previous || directory.unanalyzedFilesCount !== previous.unanalyzedFilesCount) {
      refreshUnanalyzedFiles();
    }

    return !directory.unanalyzedFilesCount;
  }

  function refreshUnanalyzedFiles() {

    var unanalyzed = _.some($scope.mediaFilesList.records, fileIsBeingAnalyzed);
    if (!unanalyzed) {
      return $q.when();
    } else if (refreshUnanalyzedFilesPromise) {
      refreshMoreUnanalyzedFiles = true;
      return refreshUnanalyzedFilesPromise;
    }

    $log.debug('Refreshing unanalyzed files');
    refreshUnanalyzedFilesPromise = refreshUnanalyzedFilesRecursive();
    return refreshUnanalyzedFilesPromise;
  }

  function refreshUnanalyzedFilesRecursive() {
    var batch = _.shuffle(getUnanalyzedFiles()).slice(0, refreshFilesBatchSize);
    return refreshFilesBatch(batch).then(function() {
      if (refreshMoreUnanalyzedFiles) {
        refreshMoreUnanalyzedFiles = false;
        $log.debug('Refreshing more unanalyzed files');
        return refreshUnanalyzedFilesRecursive();
      }

      $log.debug('Done refreshing unanalyzed files');
      refreshUnanalyzedFilesPromise = undefined;
    });
  }

  function refreshFiles(files) {
    return $q.when(refreshUnanalyzedFilesPromise).then(function() {

      var promise = $q.when();

      if (files.length) {
        var n = Math.ceil(files.length / refreshFilesBatchSize);
        for (var i = 0; i < n; i++) {
          promise = promise.then((function(i) {
            return refreshFilesBatch(files.slice(i * refreshFilesBatchSize, i * refreshFilesBatchSize + refreshFilesBatchSize));
          })(i));
        }
      }

      return promise;
    });
  }

  function refreshFilesBatch(files) {
    $log.debug('Refreshing', files.length, 'files');

    return api({
      url: '/media/files',
      params: {
        id: _.map(files, 'id')
      }
    }).then(function(res) {
      _.each(res.data, function(file) {
        var index = _.findIndex($scope.mediaFilesList.records, { id: file.id });
        if (index >= 0) {
          $scope.mediaFilesList.records[index] = file;
        }
      });

      return res.data;
    });
  }

  function getUnanalyzedFiles(files) {
    return _.filter($scope.mediaFilesList.records, fileIsBeingAnalyzed);
  }

  function refreshCurrentDirectory() {
    if (!$scope.currentDirectory) {
      throw new Error('Current directory is not set');
    }

    return api({
      url: '/media/files',
      params: {
        id: $scope.currentDirectory.id
      }
    }).then(function(res) {
      $scope.currentDirectory = res.data[0];
      return $scope.currentDirectory;
    });
  }

  function resetBreadcrumbs() {

    $scope.breadcrumbs.length = 0;

    var directory = $scope.mediaFilesList.httpSettings.params.directory || '/';

    if (directory == '/') {
      return;
    }

    var previousDirectory = directory,
        completed = false,
        currentDirectory;

    while (!completed) {
      currentDirectory = previousDirectory.replace(/\/[^\/]+$/, '');
      if (currentDirectory != previousDirectory) {
        $scope.breadcrumbs.unshift(previousDirectory);
        previousDirectory = currentDirectory;
      } else {
        completed = true;
      }
    };
  }

  function fetchFilesCount(source) {
    api({
      url: '/media/files',
      params: {
        sourceId: source.id,
        path: '/'
      }
    }).then(function(res) {
      $scope.sourceFilesCount = res.data.length ? res.data[0].filesCount : 0;
    });
  }

  function updateDirectoryMessage() {
    delete $scope.directoryMessage;
    delete $scope.directoryMessageType;
    delete $scope.nfoFile;
    delete $scope.duplicateNfoCount;

    var files = $scope.mediaFilesList.records;
    var nfoFile = _.find(files, { type: 'file', deleted: false, extension: 'nfo' }),
        duplicateNfoCount = _.filter(files, { nfoError: 'duplicate' }).length;

    var statuses = _.compact(_.uniq(_.map(files, $scope.getFileStatus)));

    if (_.includes(statuses, 'analyzing')) {
      $scope.directoryMessageType = 'info';
      $scope.directoryMessage = 'analyzing';
    } else if (_.includes(statuses, 'duplicateNfo')) {
      $scope.directoryMessageType = 'error';
      $scope.directoryMessage = 'duplicateNfo';
      $scope.duplicateNfoCount = duplicateNfoCount;
    } else if (_.includes(statuses, 'invalidNfo')) {
      $scope.directoryMessageType = 'error';
      $scope.directoryMessage = 'invalidNfo';
      $scope.nfoFile = nfoFile;
    } else if (_.includes(statuses, 'unlinked')) {
      $scope.directoryMessageType = 'warning';
      $scope.directoryMessage = 'unlinked';
    } else if (_.includes(statuses, 'unlinkedFiles')) {
      $scope.directoryMessageType = 'warning';
      $scope.directoryMessage = 'unlinkedFiles';
    }
  }
});
