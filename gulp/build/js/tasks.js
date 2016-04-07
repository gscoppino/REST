import gulp from 'gulp';
import { rollup } from 'rollup';
import ROLLUP_CONFIG from './rollup.config';

gulp.task('build:js', ()=> {
    return rollup(ROLLUP_CONFIG.rollup)
        .then((bundle)=> bundle.write(ROLLUP_CONFIG.bundle))
        .then(()=> {
            return gulp.src('dist/**/*.js*').pipe(gulp.dest('demo'));
        });
});

gulp.task('watch:js', ()=> gulp.watch('src/**/*.js', ['build:js']));