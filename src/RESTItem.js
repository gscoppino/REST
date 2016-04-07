import RESTApi from './RESTApi';
import { ensureURIHasNoLeadingSlash } from './helpers';

class RESTItem extends RESTApi {

    constructor(URI, options, data) {
        super(URI, options);
        Object.assign(this, data);
    }

    getNestedResource(path) {
        path = ensureURIHasNoLeadingSlash(path);

        return fetch(`${this.baseURI}${path}`, {
            method: 'GET'
        }).then(response => response.json());
    }

    // May not keep this method
    // path can be like 'orders' or 'orders/1'
    getNestedApi(apiInstance, path) {
        path = ensureURIHasNoLeadingSlash(path);

        return fetch(`${this.baseURI}${path}`, {
            method: 'GET'
        })
            .then(response => response.json())
            .then(resource => {
                if (apiInstance.routes[path])
                    return apiInstance.routes[path].sync(resource);
                else
                    return resource;
            });
    }

    nestedPost(nestedEndpoint) {
        nestedEndpoint = ensureURIHasNoLeadingSlash(nestedEndpoint);
        return fetch(`${this.baseURI}${nestedEndpoint}`, {
            method: 'POST'
        }).then(response => {
            return response.json();
        });
    }

    nestedPatch(nestedEndpoint, id) {
        if (!isValidID(id))
            throw new Error('REST: patch: invalid value provided for id: ${id}.');

        nestedEndpoint = ensureURIHasNoLeadingSlash(nestedEndpoint);

        return fetch(`${this.baseURI}${nestedEndpoint}/${id}`, {
            method: 'PATCH'
        }).then(response => {
            return response.json();
        });
    }

    nestedPut(nestedEndpoint, id) {
        if (!isValidID(id))
            throw new Error('REST: put: invalid value provided for id: ${id}.');

        nestedEndpoint = ensureURIHasNoLeadingSlash(nestedEndpoint);

        return fetch(`${this.baseURI}${nestedEndpoint}/${id}`, {
            method: 'PUT'
        }).then(response => {
            return response.json();
        });
    }

    nestedDelete(nestedEndpoint, id) {
        if (!isValidID(id))
            throw new Error('REST: put: invalid value provided for id: ${id}.');

        nestedEndpoint = ensureURIHasNoLeadingSlash(nestedEndpoint);

        return fetch(`${this.baseURI}${nestedEndpoint}/${id}`, {
            method: 'DELETE'
        }).then(response => {
            return response.json();
        });
    }
}

export default RESTItem;