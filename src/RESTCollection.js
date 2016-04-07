import RESTApi from './RESTApi';
import RESTItem from './RESTItem';
import { isValidID } from './helpers';

class RESTCollection extends RESTApi {

    constructor(URI, options) {
        super(URI, options);
        this._cache = {};
        this._promises = {};
    }

    reset() {
        this._cache = {};
        this._promises = {};
    }

    sync(response) {
        let isArray = Array.isArray(response);
        let resources = (isArray ? response : Array.of(response))
            .map(resource => {
                if (!this._cache[resource.id])
                    this._cache[resource.id] = new RESTItem(`${this.baseURI}${resource.id}`, this.params, resource);
                else
                    Object.assign(this._cache[resource.id], resource);

                return this._cache[resource.id];
            });

        if (resources.length > 1 || isArray) return resources;
        else return resources[0];
    }

    /* HTTP */

    get(resource, forceGet) {
        if (!resource || !isValidID(resource.id))
            throw new Error();

        if (this._cache[resource.id] && !forceGet)
            return Promise.resolve(this.cache[resource.id]);

        if (!this._promises[resource.id]) {
            this._promises[resource.id] = fetch(`${this.baseURI}${resource.id}`, {
                method: 'GET',
                headers: this.headers['GET']
            })
                .then(response => response.json())
                .then(resource => this.sync(resource))
                .then((resource) => {
                    this._promises[resource.id] = null;
                    return resource;
                });
        }

        return this._promises[resource.id];
    }

    getList() {
        if (!this._promises['list']) {
            this._promises['list'] = fetch(`${this.baseURI}`, {
                method: 'GET',
                headers: this.headers['GET']
            })
                .then(response => response.json())
                .then(resourceList => this.sync(resourceList))
                .then((resourceList) => {
                    this._promises['list'] = null;
                    return resourceList;
                });
        }

        return this._promises['list'];
    }

    post(newResource) {
        if (newResource && newResource.id)
            throw new Error();

        return fetch(`${this.baseURI}`, {
            method: 'POST',
            headers: this.headers['POST'],
            body: JSON.stringify(newResource)
        })
            .then(response => response.json())
            .then(resource => this.sync(resource));
    }

    put(resource) {
        if (!resource || !isValidID(resource.id))
            throw new Error();

        return fetch(`${this.baseURI}${resource.id}`, {
            method: 'PUT',
            headers: this.headers['PUT'],
            body: JSON.stringify(resource)
        })
            .then(response => response.json())
            .then(resource => this.sync(resource));
    }

    patch(resource) {
        if (!resource || !isValidID(resource.id))
            throw new Error();

        return fetch(`${this.baseURI}${resource.id}`, {
            method: 'PATCH',
            headers: this.headers['PATCH'],
            body: JSON.stringify(resource)
        })
            .then(response => response.json())
            .then(resource => this.sync(resource));
    }

    delete(resource) {
        if (!resource || !isValidID(resource.id))
            throw new Error();

        return fetch(`${this.baseURI}${resource.id}`, {
            method: 'DELETE',
            headers: this.headers['DELETE']
        })
            .then(() => { this._cache[resource.id] = null; });
    }
}

export default RESTCollection;