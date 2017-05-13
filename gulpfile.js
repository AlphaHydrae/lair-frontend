const _ = require('lodash');
const chain = require('gulp-chain');
const clean = require('gulp-clean');
const config = require('./config');
const gulp = require('gulp');
const gulpIf = require('gulp-if');
const handlebars = require('gulp-compile-handlebars');
const inject = require('gulp-inject');
const livereload = require('gulp-livereload');
const minimatch = require('minimatch');
const ngAnnotate = require('gulp-ng-annotate');
const nodemon = require('gulp-nodemon');
const prettify = require('gulp-html-prettify');
const runSequence = require('run-sequence');
const slm = require('gulp-slm');
const stylus = require('gulp-stylus');
const through = require('through2');
const util = require('gulp-util');
const watch = require('gulp-watch');

const buildDir = config.path('build');
const srcDir = config.path('src');

const src = {
  index: 'index.slm',
  js: '**/*.js',
  styl: '**/*.styl',
  templates: [ '**/*.slm', '!index.slm' ]
};

gulp.task('build:clean', function() {
  return gulp.src(buildDir)
    .pipe(clean({ read: false }));
})

gulp.task('build:styl', function() {
  return gulp.src(src.styl, { cwd: srcDir })
    .pipe(compileStylus());
});

gulp.task('build:js', function() {
  return gulp.src(src.js, { cwd: srcDir })
    .pipe(compileJavaScript());
});

gulp.task('build:index', function() {
  return gulp.src(src.index, { cwd: srcDir })
    .pipe(compileIndex());
});

gulp.task('build:templates', function() {
  return gulp.src(src.templates, { cwd: srcDir })
    .pipe(compileTemplate());
});

gulp.task('build', sequence('build:clean', [ 'build:js', 'build:styl', 'build:templates' ], 'build:index'));

gulp.task('dev', sequence('build', [ 'server', 'watch' ]));

gulp.task('server', function() {
  livereload.listen();

  return nodemon({
    script: 'server/app.js',
    ext: 'js',
    watch: [ 'config/**/*.js', 'server/**/*.js' ],
    ignore: [ '.git', 'build', 'node_modules', 'src', 'vendor' ],
    stdout: false
  }).on('readable', function() {
    this.stdout.on('data', function(chunk) {
      if (/Listening on port /.test(chunk)) {
        livereload.changed(__dirname);
      }
    });

    this.stdout.pipe(process.stdout);
    this.stderr.pipe(process.stderr);
  });
});

gulp.task('watch:build', function() {
  return watch('**/*.*', { cwd: buildDir }, function(file) {
    livereload.changed(file.relative);
  });
});

gulp.task('watch:index', function() {
  return watch(src.index, { cwd: srcDir }, function(file) {
    return gulp.src(file.path, { cwd: srcDir })
      .pipe(compileIndex());
  });
});

gulp.task('watch:js', function() {
  return watch(src.js, { cwd: srcDir }, function(file) {
    return gulp.src(file.path, { cwd: srcDir })
      .pipe(compileJavaScript())
      .pipe(handleAssetChange());
  });
});

gulp.task('watch:styl', function() {
  return watch(src.styl, { cwd: srcDir }, function(file) {
    return gulp.src(file.path, { cwd: srcDir })
      .pipe(compileStylus())
      .pipe(handleAssetChange());
  });
});

gulp.task('watch:templates', function() {
  return watch(src.templates, { cwd: srcDir }, function(file) {
    return gulp.src(file.path, { cwd: srcDir })
      .pipe(compileTemplate());
  });
});

gulp.task('watch', sequence([ 'watch:build', 'watch:index', 'watch:js', 'watch:styl', 'watch:templates' ]));

gulp.task('default', [ 'dev' ]);

function compileIndex() {
  return chain(function(stream) {
    return stream
      .pipe(slm(getSlmOptions()))
      .pipe(prettify())
      .pipe(inject(gulp.src([ '**/*.css', '**/*.js' ], { cwd: buildDir, read: false })))
      .pipe(gulp.dest(buildDir));
  })();
}

function compileJavaScript() {
  return chain(function(stream) {

    const locals = getClientConfig();
    const options = {};

    return stream
      .pipe(gulpIf(file => minimatch(file.relative, 'app.js'), handlebars(locals, options)))
      .pipe(ngAnnotate())
      .pipe(gulp.dest(buildDir));
  })();
}

function compileStylus() {
  return chain(function(stream) {
    return stream
      .pipe(stylus())
      .pipe(gulp.dest(buildDir));
  })();
}

function compileTemplate() {
  return chain(function(stream) {
    return stream
      .pipe(slm(getSlmOptions()))
      .pipe(prettify())
      .pipe(gulp.dest(buildDir));
  })();
}

function getSlmOptions() {
  const locals = getClientConfig();
  return {
    locals: locals
  };
}

function getClientConfig() {
  return _.pick(config, 'env', 'googleClientId', 'liveReloadUrl', 'version');
}

function sequence() {
  var tasks = _.toArray(arguments);
  return function(callback) {
    return runSequence.apply(undefined, [].concat(tasks).concat([ callback ]));
  };
}

function rebuildIndex() {
  return through.obj(function(file, enc, callback) {
    debouncedRebuildIndex();
    callback(null, file);
  });
}

var debouncedRebuildIndex = _.debounce(function() {
  util.log('Rebuilding index');
  return gulp.src('index.slm', { cwd: srcDir })
    .pipe(compileIndex());
}, 500);

function handleAssetChange() {
  return through.obj(function(file, enc, callback) {
    if (file.event == 'change') {
      // Ignore changes
    } else if (file.event == 'add') {
      // If the asset is a new file, rebuild and reload the index to include it
      debouncedRebuildIndex();
    } else if (file.event == 'unlink') {
      // If the asset was deleted, rebuild and reload the index to omit it
      debouncedRebuildIndex();
    } else if (!_.has(file, 'event')) {
      throw new Error('File does not appear to be from gulp-watch (it has no `event` property)');
    } else {
      throw new Error('Unsupported gulp-watch event type ' + JSON.stringify(file.event));
    }

    callback(undefined, file);
  });
}
