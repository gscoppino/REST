import babel from 'rollup-plugin-babel';
import istanbul from 'rollup-plugin-istanbul';

import babel_istanbul from 'babel-istanbul';
import { buildExternalHelpers as buildBabelHelpers } from 'babel-core';

export default {
    rollup: {
        plugins: [
            // Transform ES2015 to ES5 for all spec files, sans module imports/exports
            babel({
                include: 'tests/*.spec.js',
                exclude: ['src/*.js', 'node_modules/**']
            }),
            // Instrument source code so that code coverage can be determined.
            // Babel is used during instrumentation to transform ES2015 to ES5
            // for all source files, sans module imports/exports
            istanbul({
                include: 'src/*.js',
                exclude: ['tests/*.spec.js', 'node_modules/**'],
                instrumenter: babel_istanbul
            })
        ]
    },
    bundle: {
        format: 'iife', // Transpiled ES5 exported as a global module.
        sourceMap: 'inline', // For use by Karma in stack traces and code coverage
        intro: buildBabelHelpers() // Global helpers for transpiled JS to use in the browser.
    }
};