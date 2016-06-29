import RESTCollection from './RESTCollection';
import { isValidURI, isValidNestedURI,
         formatURI, formatNestedURI } from './helpers';

class RESTApi {
    static defaultHeaders = {
        GET: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        POST: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        PUT: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        PATCH: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        DELETE: {}
    };

    constructor(baseURI, options) {
        if (!isValidURI(baseURI))
            throw new Error('Error instantiating RESTApi: baseURI not provided or not of type string.');

        this.params = options || {};

        this.baseURI = formatURI(baseURI);
        this.routes = {};

        if (this.params.headers) {
            this.headers = Object.assign({}, RESTApi.defaultHeaders, this.params.headers);
        } else {
            this.headers = RESTApi.defaultHeaders;
        }

        if (this.params.routes) {
            Object.keys(this.params.routes).forEach(key => this.useCollection(key, this.params.routes[key]));
        }
    }

    useCollection(nestedURI, options) {
        if (!isValidNestedURI(nestedURI))
            throw new Error(`RESTApi: Invalid value provided for collection: ${nestedURI}.`);

        nestedURI = formatNestedURI(nestedURI);
        if (this.routes.hasOwnProperty(nestedURI))
            throw new Error('RESTApi: Collection already registered: ${nestedURI}.');

        this.routes[nestedURI] = new RESTCollection(`${this.baseURI}${nestedURI}`, Object.assign({}, this.params, options));
        return this.routes[nestedURI];
    }
}

export default RESTApi;
