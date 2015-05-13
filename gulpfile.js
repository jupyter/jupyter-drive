var ts = require('gulp-typescript');
var gulp = require('gulp');

gulp.task('js', function() {
    var tsResult = gulp.src('jupyterdrive/ts/*.ts')
                       .pipe(ts({
                            declarationFiles: true,
                            noExternalResolve: true,
                            target: 'ES5',
                            module: 'amd',
                       }));
    
    return tsResult.js.pipe(gulp.dest('jupyterdrive/gdrive')) ;
});
