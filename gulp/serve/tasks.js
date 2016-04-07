import gulp from 'gulp';
import browserSync from 'browser-sync';

gulp.task('devserver', ()=> {
    let server = browserSync.create();

    server.init({
        server: {
            baseDir: 'dist',
            middleware: historyApiMiddleware({ index: '/index.html' })
        }
    });

    gulp.watch('dist/**/*', server.reload);
});
