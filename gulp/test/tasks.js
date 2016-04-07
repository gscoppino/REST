import gulp from 'gulp';
import karma from 'karma';
import KARMA_CONFIG from './karma.config';

gulp.task('test', (done)=> {
    KARMA_CONFIG.singleRun = true;
    KARMA_CONFIG.autoWatch = false;
    new karma.Server(KARMA_CONFIG, (exitCode)=> {
        process.exit(exitCode);
        done();
    }).start();
});

gulp.task('watch:test', ()=> {
    KARMA_CONFIG.singleRun = false;
    KARMA_CONFIG.autoWatch = true;
    new karma.Server(KARMA_CONFIG).start();
});