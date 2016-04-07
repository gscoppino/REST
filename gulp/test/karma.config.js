import ROLLUP_CONFIG from './rollup.config';

export default {
    frameworks: ['jasmine'],
    files: [
        'node_modules/promise-polyfill/promise.js',
        'node_modules/whatwg-fetch/fetch.js',
        'tests/**/*.spec.js'
    ],
    preprocessors: {
        'tests/**/*.spec.js': ['rollup', 'sourcemap']
    },
    rollupPreprocessor: ROLLUP_CONFIG,
    browsers: ['PhantomJS'],
    port: 9876,
    concurrency: Infinity,
    reporters: ['progress', /*'coverage'*/],
    /*coverageReporter: {
        dir: 'dist/coverage',
        reporters: [
            { type: 'text' },
            { type: 'html', subdir: 'html' }
        ]
    },*/
    colors: true
};
