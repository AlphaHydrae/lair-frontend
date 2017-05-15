const _ = require('lodash');
const autoprefixer = require('gulp-autoprefixer');
const chain = require('gulp-chain');
const clean = require('gulp-clean');
const concat = require('gulp-concat');
const config = require('./config');
const cssmin = require('gulp-cssmin');
const filter = require('gulp-filter');
const fs = require('fs');
const gulp = require('gulp');
const gulpIf = require('gulp-if');
const handlebars = require('gulp-compile-handlebars');
const handlebarsCompiler = require('handlebars');
const inject = require('gulp-inject');
const less = require('gulp-less');
const livereload = require('gulp-livereload');
const ngAnnotate = require('gulp-ng-annotate');
const nodemon = require('gulp-nodemon');
const path = require('path');
const prettify = require('gulp-html-prettify');
const prettyBytes = require('pretty-bytes');
const rev = require('gulp-rev');
const revDeleteOriginal = require('gulp-rev-delete-original');
const revReplace = require('gulp-rev-replace');
const runSequence = require('run-sequence');
const slm = require('gulp-slm');
const streamQueue = require('streamqueue');
const stylus = require('gulp-stylus');
const through = require('through2');
const uglify = require('gulp-uglify');
const useref = require('gulp-useref');
const util = require('gulp-util');
const watch = require('gulp-watch');

const PluginError = util.PluginError;

const buildDir = config.path('build');
const srcDir = config.path('src');
let templateWrapper;

const src = {
  index: 'index.slm',
  fonts: [ 'node_modules/bootstrap/dist/fonts/*.*', 'node_modules/font-awesome/fonts/*.*' ],
  images: 'node_modules/jquery-ui-dist/images/*.*',
  js: '**/*.js',
  less: '**/*.less',
  static: [ 'favicon.ico', 'robots.txt' ],
  styl: '**/*.styl',
  templates: [ '**/*.slm', '!index.slm' ]
};

const filters = {
  none: () => filter([ 'none' ]),
  noCssLib: () => filter([ '**/*', '!bootstrap.css', '!font-awesome.css' ], { restore: true }),
  noRev: () => filter([ '**/*', '!index.html', '!favicon.ico', '!robots.txt' ], { restore: true })
};

gulp.task('build:clean', function() {
  return gulp.src(buildDir, { read: false })
    .pipe(clean());
});

gulp.task('build:fonts', function() {
  return gulp.src(src.fonts)
    .pipe(gulp.dest(path.join(buildDir, 'fonts')));
});

gulp.task('build:images', function() {
  return gulp.src(src.images)
    .pipe(gulp.dest(path.join(buildDir, 'images')));
});

gulp.task('build:less', function() {
  return buildSrc(src.less)
    .pipe(compileLess());
});

gulp.task('build:styl', function() {
  return buildSrc(src.styl)
    .pipe(compileStylus());
});

gulp.task('build:js', function() {

  let stream = buildSrc(src.js);

  if (config.env == 'production') {
    const templatesStream = buildSrc(src.templates)
      .pipe(slm(getSlmOptions()))
      .pipe(wrapTemplate());

    stream = streamQueue({ objectMode: true }, stream, templatesStream);
  }

  return stream.pipe(compileJavaScript());
});

gulp.task('build:index', function() {
  return buildSrc(src.index)
    .pipe(compileIndex());
});

gulp.task('build:prod:rev', function() {
  if (config.env != 'production') {
    return;
  }

  const noCssLib = filters.noCssLib();
  const noRevFilter = filters.noRev();

  return gulp.src('**/*', { cwd: buildDir })
    .pipe(noCssLib)
    .pipe(noRevFilter)
    .pipe(rev())
    .pipe(revDeleteOriginal())
    .pipe(gulp.dest(buildDir))
    .pipe(noRevFilter.restore)
    .pipe(revReplace())
    .pipe(tap(file => util.log(`${util.colors.yellow(file.relative)} ${util.colors.magenta(prettyBytes(file.contents.length))}`)))
    .pipe(gulp.dest(buildDir))
    .pipe(filters.none())
    .pipe(noCssLib.restore)
    .pipe(clean());
});

gulp.task('build:prod:useref', function() {
  if (config.env != 'production') {
    return;
  }

  return gulp.src('index.html', { cwd: buildDir })
    .pipe(useref({
      base: config.root,
      searchPath: [ '.', 'build' ]
    }))
    .pipe(gulpIf('**/*.js', uglify()))
    .pipe(gulpIf('**/*.css', cssmin({
      keepSpecialComments: 0
    })))
    .pipe(gulp.dest(buildDir));
});

gulp.task('build:prod', sequence('build:prod:useref', 'build:prod:rev'));

gulp.task('build:static', function() {
  return buildSrc(src.static)
    .pipe(toBuildDir());
});

gulp.task('build:templates', function() {
  if (config.env == 'production') {
    return;
  }

  return buildSrc(src.templates)
    .pipe(compileTemplate());
});

gulp.task('build', sequence('build:clean', [ 'build:fonts', 'build:images', 'build:js', 'build:less', 'build:static', 'build:styl', 'build:templates' ], 'build:index', 'build:prod'));

gulp.task('dev', sequence('build', [ 'server', 'watch' ]));

gulp.task('server', function() {
  livereload.listen();

  return nodemon({
    script: 'server.js',
    ext: 'js',
    watch: [ 'config.js', 'server.js' ],
    ignore: [ '.git', 'build', 'node_modules', 'src' ],
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
  return watchSrc(src.index, function(file) {
    return buildSrc(file.path)
      .pipe(compileIndex());
  });
});

gulp.task('watch:js', function() {
  return watchSrc(src.js, function(file) {
    return buildSrc(file.path)
      .pipe(compileJavaScript())
      .pipe(handleAssetChange());
  });
});

gulp.task('watch:styl', function() {
  return watchSrc(src.styl, function(file) {
    return buildSrc(file.path)
      .pipe(compileStylus())
      .pipe(handleAssetChange());
  });
});

gulp.task('watch:templates', function() {
  return watchSrc(src.templates, function(file) {
    return buildSrc(file.path)
      .pipe(compileTemplate());
  });
});

gulp.task('watch', sequence([ 'watch:build', 'watch:index', 'watch:js', 'watch:styl', 'watch:templates' ]));

gulp.task('default', [ 'dev' ]);

function compileIndex() {
  return chain(function(stream) {

    const injections = gulp
      .src([ '**/*.css', '**/*.js' ], { cwd: buildDir, read: false })
      .pipe(filters.noCssLib());

    return stream
      .pipe(slm(getSlmOptions()))
      .pipe(prettify())
      .pipe(inject(injections))
      .pipe(toBuildDir());
  })();
}

function compileJavaScript() {
  return chain(function(stream) {

    const locals = getClientConfig();
    const options = {};

    stream = stream
      .pipe(gulpIf('app.js', handlebars(locals, options)))
      .pipe(ngAnnotate())

    if (config.env == 'production') {
      stream = stream
        .pipe(concat('app.js'));
    }

    return stream.pipe(toBuildDir());
  })();
}

function compileLess() {
  return chain(function(stream) {
    return stream
      .pipe(less({
        paths: [ 'build', 'node_modules' ]
      }))
      .pipe(toBuildDir());
  })();
}

function compileStylus() {
  return chain(function(stream) {
    stream = stream.pipe(stylus())

    if (config.env == 'production') {
      stream = stream
        .pipe(concat('app.css'));
    }

    return stream
      .pipe(autoprefixer())
      .pipe(toBuildDir());
  })();
}

function compileTemplate() {
  return chain(function(stream) {
    return stream
      .pipe(slm(getSlmOptions()))
      .pipe(prettify())
      .pipe(toBuildDir());
  })();
}

function toBuildDir() {
  return chain(function(stream) {
    return stream
      .pipe(gulpIf(config.env != 'production', tap(file => util.log(util.colors.yellow(file.relative)))))
      .pipe(gulp.dest(buildDir));
  })();
}

function tap(func) {
  return through.obj(function(file, enc, callback) {
    func(file);
    callback(undefined, file);
  });
}

function wrapTemplate() {
  return through.obj(function(file, enc, callback) {
    if (file.isStream()) {
      return callback(new PluginError('gulp-wrap-template', 'Streaming not supported'));
    }

    const templateWrapper = getTemplateWrapper();

    if (file.isBuffer()) {
      try {
        file.contents = new Buffer(templateWrapper({
          templateUrl: JSON.stringify(`/${file.relative}`),
          templateContents: JSON.stringify(file.contents.toString())
        }));
      } catch(e) {
        e.message = 'Handlebars template error in ' + file.relative + '; ' + e.message;
        return callback(new PluginError('gulp-wrap-template', e));
      }
    }

    callback(null, file);
  });
}

function getSlmOptions() {
  const locals = getClientConfig();
  return {
    locals: locals
  };
}

function getTemplateWrapper() {
  if (!templateWrapper) {
    templateWrapper = handlebarsCompiler.compile(fs.readFileSync(config.path('src', 'template.js.hbs'), 'utf8'));
  }

  return templateWrapper;
}

function getClientConfig() {
  return _.pick(config, 'env', 'googleClientId', 'liveReloadUrl', 'version');
}

function rebuildIndex() {
  return through.obj(function(file, enc, callback) {
    debouncedRebuildIndex();
    callback(null, file);
  });
}

var debouncedRebuildIndex = _.debounce(function() {
  util.log('Rebuilding index');
  return buildSrc('index.slm')
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

function buildSrc(files, options) {
  return gulp.src(files, _.extend({}, options, { cwd: srcDir }));
}

function sequence(...tasks) {
  return function(callback) {
    return runSequence.apply(undefined, [].concat(tasks).concat([ callback ]));
  };
}

function watchSrc(files, options, callback) {
  if (_.isFunction(options)) {
    callback = options;
    options = {};
  }

  return watch(files, _.extend({}, options, { cwd: srcDir }), function(file) {
    return callback(gulp.src(file.path, { cwd: srcDir }), file);
  });
}
