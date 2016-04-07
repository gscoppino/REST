import { isValidID } from './helpers';

class Resource {
    constructor(resource, baseURI) {
        Object.assign(this, resource);
        this._baseURI = baseURI;
    }

    nestedGet(nestedEndpoint, id) {
        return fetch(`${this._baseURI}${this.id}/${nestedEndpoint}/${id}`, {
            method: 'get'
        }).then(response => {
            return response.json();
        });
    }

    getNestedList(nestedEndpoint) {
        return fetch(`${this._baseURI}${this.id}/${nestedEndpoint}/`, {
            method: 'get'
        }).then(response => {
            return response.json();
        });
    }

    nestedPost(nestedEndpoint) {
        return fetch(`${this._baseURI}${this.id}/${nestedEndpoint}/`, {
            method: 'post'
        }).then(response => {
            return response.json();
        });
    }

    nestedPatch(nestedEndpoint, id) {
        if (!isValidID(id))
            throw new Error('REST: patch: invalid value provided for id: ${id}.');

        return fetch(`${this._baseURI}${this.id}/${nestedEndpoint}/${id}`, {
            method: 'patch'
        }).then(response => {
            return response.json();
        });
    }

    nestedPut(nestedEndpoint, id) {
        if (!isValidID(id))
            throw new Error('REST: put: invalid value provided for id: ${id}.');

        return fetch(`${this._baseURI}${this.id}/${nestedEndpoint}/${id}`, {
            method: 'put'
        }).then(response => {
            return response.json();
        });
    }
}

export default Resource;