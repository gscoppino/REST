import babel from 'rollup-plugin-babel';
import fs from 'fs';
import resolve from 'resolve';

export default {
    rollup: {
        entry: 'src/index.js',
        plugins: [
            // Transform ES2015 to ES5, sans module imports/exports
            babel({
                include: 'src/*.js',
                exclude: 'node_modules/**'
            })
        ]
    },
    bundle: {
        dest: 'dist/rest.js',
        banner: fs.readFileSync(resolve.sync('promise-polyfill')) +
                fs.readFileSync(resolve.sync('whatwg-fetch')),
        format: 'iife',
        moduleName: 'RESTApi',
        sourceMap: true
    }
};