import gulp from 'gulp';

import './gulp/build/js/tasks';
import './gulp/test/tasks';
//import './gulp/serve/tasks';

gulp.task('build', ['build:js']);
gulp.task('watch', ['watch:js']);
gulp.task('develop', ['watch', 'devserver']);