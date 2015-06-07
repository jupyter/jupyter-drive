var ts = require('gulp-typescript');
var gulp = require('gulp');
var watch = require('gulp-watch');
var concat = require('gulp-concat');
var merge = require('merge2');
var insert = require('gulp-insert');
var sourcemaps = require('gulp-sourcemaps');

var tsProject = ts.createProject({
    declarationFiles: true,
    noExternalResolve: false,
    sortOutput: true,
    target: 'ES5',
    module: 'amd',
});


gulp.task('watch', ['js'], function() {
    gulp.watch('jupyterdrive/ts/*.ts', ['js']);
    gulp.watch('jupyterdrive/js/*.js', ['js']);
    gulp.watch('typings/*/*.ts', ['js']);
    gulp.watch('gulpfile.js', ['js']);
});

gulp.task('js', function() {
    console.log('=========== Rebuilding JS ===========')

    var tsResult = gulp.src([
                                'jupyterdrive/ts/*.ts',
                                'typings/*.d.ts',
                                'typings/*/**.d.ts',
                            ])
                       .pipe(sourcemaps.init())
                       .pipe(ts(tsProject));
    return merge([
        tsResult.dts.pipe(gulp.dest('jupyterdrive/gdrive')),
        tsResult.js
            .pipe(insert.prepend('// AUTOMATICALY GENERATED FILE, see cooresponding .ts file\n'))
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest('jupyterdrive/gdrive'))
    ]);
});

var typedoc = require('gulp-typedoc');
gulp.task('docs', function() {
  return gulp.src(['./jupyterdrive/ts/*.ts',
    'typings/requirejs/*',
    //'typings/ipython/*',
    //'typings/jquery/*',
    'typings/es6-promise/*',])
    .pipe(typedoc({
      module: "commonjs", 
      out: './docs',
      name: 'Jupyter drive',
      target: 'ES5',
      mode: 'file',
      includeDeclarations: true }));
});
