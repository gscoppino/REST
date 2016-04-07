(function (root) {

  // Store setTimeout reference so promise-polyfill will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var setTimeoutFunc = setTimeout;

  function noop() {
  }

  // Use polyfill for setImmediate for performance gains
  var asap = (typeof setImmediate === 'function' && setImmediate) ||
    function (fn) {
      setTimeoutFunc(fn, 1);
    };

  var onUnhandledRejection = function onUnhandledRejection(err) {
    console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
  };

  // Polyfill for Function.prototype.bind
  function bind(fn, thisArg) {
    return function () {
      fn.apply(thisArg, arguments);
    };
  }

  var isArray = Array.isArray || function (value) {
    return Object.prototype.toString.call(value) === '[object Array]';
  };

  function Promise(fn) {
    if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new');
    if (typeof fn !== 'function') throw new TypeError('not a function');
    this._state = 0;
    this._handled = false;
    this._value = undefined;
    this._deferreds = [];

    doResolve(fn, this);
  }

  function handle(self, deferred) {
    while (self._state === 3) {
      self = self._value;
    }
    if (self._state === 0) {
      self._deferreds.push(deferred);
      return;
    }
    self._handled = true;
    asap(function () {
      var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
      if (cb === null) {
        (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
        return;
      }
      var ret;
      try {
        ret = cb(self._value);
      } catch (e) {
        reject(deferred.promise, e);
        return;
      }
      resolve(deferred.promise, ret);
    });
  }

  function resolve(self, newValue) {
    try {
      // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
      if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.');
      if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
        var then = newValue.then;
        if (newValue instanceof Promise) {
          self._state = 3;
          self._value = newValue;
          finale(self);
          return;
        } else if (typeof then === 'function') {
          doResolve(bind(then, newValue), self);
          return;
        }
      }
      self._state = 1;
      self._value = newValue;
      finale(self);
    } catch (e) {
      reject(self, e);
    }
  }

  function reject(self, newValue) {
    self._state = 2;
    self._value = newValue;
    finale(self);
  }

  function finale(self) {
    if (self._state === 2 && self._deferreds.length === 0) {
      setTimeout(function() {
        if (!self._handled) {
          onUnhandledRejection(self._value);
        }
      }, 1);
    }
    
    for (var i = 0, len = self._deferreds.length; i < len; i++) {
      handle(self, self._deferreds[i]);
    }
    self._deferreds = null;
  }

  function Handler(onFulfilled, onRejected, promise) {
    this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
    this.onRejected = typeof onRejected === 'function' ? onRejected : null;
    this.promise = promise;
  }

  /**
   * Take a potentially misbehaving resolver function and make sure
   * onFulfilled and onRejected are only called once.
   *
   * Makes no guarantees about asynchrony.
   */
  function doResolve(fn, self) {
    var done = false;
    try {
      fn(function (value) {
        if (done) return;
        done = true;
        resolve(self, value);
      }, function (reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      });
    } catch (ex) {
      if (done) return;
      done = true;
      reject(self, ex);
    }
  }

  Promise.prototype['catch'] = function (onRejected) {
    return this.then(null, onRejected);
  };

  Promise.prototype.then = function (onFulfilled, onRejected) {
    var prom = new Promise(noop);
    handle(this, new Handler(onFulfilled, onRejected, prom));
    return prom;
  };

  Promise.all = function () {
    var args = Array.prototype.slice.call(arguments.length === 1 && isArray(arguments[0]) ? arguments[0] : arguments);

    return new Promise(function (resolve, reject) {
      if (args.length === 0) return resolve([]);
      var remaining = args.length;

      function res(i, val) {
        try {
          if (val && (typeof val === 'object' || typeof val === 'function')) {
            var then = val.then;
            if (typeof then === 'function') {
              then.call(val, function (val) {
                res(i, val);
              }, reject);
              return;
            }
          }
          args[i] = val;
          if (--remaining === 0) {
            resolve(args);
          }
        } catch (ex) {
          reject(ex);
        }
      }

      for (var i = 0; i < args.length; i++) {
        res(i, args[i]);
      }
    });
  };

  Promise.resolve = function (value) {
    if (value && typeof value === 'object' && value.constructor === Promise) {
      return value;
    }

    return new Promise(function (resolve) {
      resolve(value);
    });
  };

  Promise.reject = function (value) {
    return new Promise(function (resolve, reject) {
      reject(value);
    });
  };

  Promise.race = function (values) {
    return new Promise(function (resolve, reject) {
      for (var i = 0, len = values.length; i < len; i++) {
        values[i].then(resolve, reject);
      }
    });
  };

  /**
   * Set the immediate function to execute callbacks
   * @param fn {function} Function to execute
   * @private
   */
  Promise._setImmediateFn = function _setImmediateFn(fn) {
    asap = fn;
  };
  
  Promise._setUnhandledRejectionFn = function _setUnhandledRejectionFn(fn) {
    onUnhandledRejection = fn;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Promise;
  } else if (!root.Promise) {
    root.Promise = Promise;
  }

})(this);
(function(self) {
  'use strict';

  if (self.fetch) {
    return
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)

    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var list = this.map[name]
    if (!list) {
      list = []
      this.map[name] = list
    }
    list.push(value)
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    var values = this.map[normalizeName(name)]
    return values ? values[0] : null
  }

  Headers.prototype.getAll = function(name) {
    return this.map[normalizeName(name)] || []
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)]
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    Object.getOwnPropertyNames(this.map).forEach(function(name) {
      this.map[name].forEach(function(value) {
        callback.call(thisArg, value, name, this)
      }, this)
    }, this)
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    reader.readAsArrayBuffer(blob)
    return fileReaderReady(reader)
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    reader.readAsText(blob)
    return fileReaderReady(reader)
  }

  var support = {
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob();
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  function Body() {
    this.bodyUsed = false


    this._initBody = function(body) {
      this._bodyInit = body
      if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (!body) {
        this._bodyText = ''
      } else if (support.arrayBuffer && ArrayBuffer.prototype.isPrototypeOf(body)) {
        // Only support ArrayBuffers for POST method.
        // Receiving ArrayBuffers happens via Blobs, instead.
      } else {
        throw new Error('unsupported BodyInit type')
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8')
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type)
        }
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        return this.blob().then(readBlobAsArrayBuffer)
      }

      this.text = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text')
        } else {
          return Promise.resolve(this._bodyText)
        }
      }
    } else {
      this.text = function() {
        var rejected = consumed(this)
        return rejected ? rejected : Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body
    if (Request.prototype.isPrototypeOf(input)) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = input
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body)
  }

  Request.prototype.clone = function() {
    return new Request(this)
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function headers(xhr) {
    var head = new Headers()
    var pairs = xhr.getAllResponseHeaders().trim().split('\n')
    pairs.forEach(function(header) {
      var split = header.trim().split(':')
      var key = split.shift().trim()
      var value = split.join(':').trim()
      head.append(key, value)
    })
    return head
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this.type = 'default'
    this.status = options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = options.statusText
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
    this.url = options.url || ''
    this._initBody(bodyInit)
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request
      if (Request.prototype.isPrototypeOf(input) && !init) {
        request = input
      } else {
        request = new Request(input, init)
      }

      var xhr = new XMLHttpRequest()

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL')
        }

        return;
      }

      xhr.onload = function() {
        var status = (xhr.status === 1223) ? 204 : xhr.status
        if (status < 100 || status > 599) {
          reject(new TypeError('Network request failed'))
          return
        }
        var options = {
          status: status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        }
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})(typeof self !== 'undefined' ? self : this);

var RESTApi = (function () {
    'use strict';

    var babelHelpers = {};

    babelHelpers.classCallCheck = function (instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    };

    babelHelpers.createClass = function () {
      function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
          var descriptor = props[i];
          descriptor.enumerable = descriptor.enumerable || false;
          descriptor.configurable = true;
          if ("value" in descriptor) descriptor.writable = true;
          Object.defineProperty(target, descriptor.key, descriptor);
        }
      }

      return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
      };
    }();

    babelHelpers.inherits = function (subClass, superClass) {
      if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
      }

      subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
          value: subClass,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
      if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    };

    babelHelpers.possibleConstructorReturn = function (self, call) {
      if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      }

      return call && (typeof call === "object" || typeof call === "function") ? call : self;
    };

    babelHelpers;

    function isValidURI(URI) {
        // A base URI can be a domain eg. "http://example.com"
        // or it could be a path on the origin domain eg. "/example/"
        return URI && typeof URI === 'string';
    }

    function isValidNestedURI(URI) {
        // A nested URI can only be a path on a baseURI.
        return isValidURI && URI !== '/' && !URI.startsWith('http');
    }

    function formatURI(URI) {
        // If the URI is a path on the origin domain
        // ensure that one leading slash and one trailing slash
        // are present in the URI. If the URI is a crossorigin
        // URI, only apply the trailing slash.
        if (URI.startsWith('http')) return ensureURIHasOneTrailingSlash(URI.trim());else return ensureURIHasOneLeadingSlash(ensureURIHasOneTrailingSlash(URI.trim()));
    }

    function formatNestedURI(URI) {
        // Since the baseURI always has a trailing slash
        // remove the leading slash from the nested URI
        // if present.
        return ensureURIHasNoLeadingSlash(ensureURIHasOneTrailingSlash(URI.trim()));
    }

    function ensureURIHasNoLeadingSlash(URI) {
        if (URI === '/') return URI;
        if (!URI.startsWith('/')) return URI;
        return ensureURIHasNoLeadingSlash(URI.slice(1));
    }

    function ensureURIHasOneLeadingSlash(URI) {
        if (URI === '/') return URI;
        if (!URI.startsWith('/')) return '/' + URI;
        return ensureURIHasOneLeadingSlash(URI.slice(1));
    }

    function ensureURIHasOneTrailingSlash(URI) {
        if (URI === '/') return URI;
        if (!URI.endsWith('/')) return URI + '/';
        return ensureURIHasOneTrailingSlash(URI.slice(0, -1));
    }

    function isValidID$1(id) {
        return Number.isSafeInteger(id);
    }

    var RESTApi = function () {
        function RESTApi(baseURI, options) {
            var _this = this;

            babelHelpers.classCallCheck(this, RESTApi);

            if (!isValidURI(baseURI)) throw new Error('Error instantiating RESTApi: baseURI not provided or not of type string.');

            this.params = options || {};

            this.baseURI = formatURI(baseURI);
            this.routes = {};

            if (this.params.headers) {
                this.headers = Object.assign({}, Api.defaultHeaders, this.params.headers);
            } else {
                this.headers = RESTApi.defaultHeaders;
            }

            if (this.params.routes) {
                Object.keys(this.params.routes).forEach(function (key) {
                    return _this.useNestedRoute(key, _this.params.routes[key]);
                });
            }
        }

        babelHelpers.createClass(RESTApi, [{
            key: 'useCollection',
            value: function useCollection(nestedURI, options) {
                if (!isValidNestedURI(nestedURI)) throw new Error('RESTApi: Invalid value provided for collection: ' + nestedURI + '.');

                nestedURI = formatNestedURI(nestedURI);
                if (this.routes.hasOwnProperty(nestedURI)) throw new Error('RESTApi: Collection already registered: ${nestedURI}.');

                this.routes[nestedURI] = new RESTCollection('' + this.baseURI + nestedURI, Object.assign({}, this.params, options));
                return this.routes[nestedURI];
            }
        }]);
        return RESTApi;
    }();

    RESTApi.defaultHeaders = {
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

    var RESTItem = function (_RESTApi) {
        babelHelpers.inherits(RESTItem, _RESTApi);

        function RESTItem(URI, options, data) {
            babelHelpers.classCallCheck(this, RESTItem);

            var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(RESTItem).call(this, URI, options));

            Object.assign(_this, data);
            return _this;
        }

        babelHelpers.createClass(RESTItem, [{
            key: 'getNestedResource',
            value: function getNestedResource(path) {
                path = ensureURIHasNoLeadingSlash(path);

                return fetch('' + this.baseURI + path, {
                    method: 'GET'
                }).then(function (response) {
                    return response.json();
                });
            }

            // May not keep this method
            // path can be like 'orders' or 'orders/1'

        }, {
            key: 'getNestedApi',
            value: function getNestedApi(apiInstance, path) {
                path = ensureURIHasNoLeadingSlash(path);

                return fetch('' + this.baseURI + path, {
                    method: 'GET'
                }).then(function (response) {
                    return response.json();
                }).then(function (resource) {
                    if (apiInstance.routes[path]) return apiInstance.routes[path].sync(resource);else return resource;
                });
            }
        }, {
            key: 'nestedPost',
            value: function nestedPost(nestedEndpoint) {
                nestedEndpoint = ensureURIHasNoLeadingSlash(nestedEndpoint);
                return fetch('' + this.baseURI + nestedEndpoint, {
                    method: 'POST'
                }).then(function (response) {
                    return response.json();
                });
            }
        }, {
            key: 'nestedPatch',
            value: function nestedPatch(nestedEndpoint, id) {
                if (!isValidID(id)) throw new Error('REST: patch: invalid value provided for id: ${id}.');

                nestedEndpoint = ensureURIHasNoLeadingSlash(nestedEndpoint);

                return fetch('' + this.baseURI + nestedEndpoint + '/' + id, {
                    method: 'PATCH'
                }).then(function (response) {
                    return response.json();
                });
            }
        }, {
            key: 'nestedPut',
            value: function nestedPut(nestedEndpoint, id) {
                if (!isValidID(id)) throw new Error('REST: put: invalid value provided for id: ${id}.');

                nestedEndpoint = ensureURIHasNoLeadingSlash(nestedEndpoint);

                return fetch('' + this.baseURI + nestedEndpoint + '/' + id, {
                    method: 'PUT'
                }).then(function (response) {
                    return response.json();
                });
            }
        }, {
            key: 'nestedDelete',
            value: function nestedDelete(nestedEndpoint, id) {
                if (!isValidID(id)) throw new Error('REST: put: invalid value provided for id: ${id}.');

                nestedEndpoint = ensureURIHasNoLeadingSlash(nestedEndpoint);

                return fetch('' + this.baseURI + nestedEndpoint + '/' + id, {
                    method: 'DELETE'
                }).then(function (response) {
                    return response.json();
                });
            }
        }]);
        return RESTItem;
    }(RESTApi);

    var RESTCollection = function (_RESTApi) {
        babelHelpers.inherits(RESTCollection, _RESTApi);

        function RESTCollection(URI, options) {
            babelHelpers.classCallCheck(this, RESTCollection);

            var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(RESTCollection).call(this, URI, options));

            _this._cache = {};
            _this._promises = {};
            return _this;
        }

        babelHelpers.createClass(RESTCollection, [{
            key: 'reset',
            value: function reset() {
                this._cache = {};
                this._promises = {};
            }
        }, {
            key: 'sync',
            value: function sync(response) {
                var _this2 = this;

                var isArray = Array.isArray(response);
                var resources = (isArray ? response : Array.of(response)).map(function (resource) {
                    if (!_this2._cache[resource.id]) _this2._cache[resource.id] = new RESTItem('' + _this2.baseURI + resource.id, _this2.params, resource);else Object.assign(_this2._cache[resource.id], resource);

                    return _this2._cache[resource.id];
                });

                if (resources.length > 1 || isArray) return resources;else return resources[0];
            }

            /* HTTP */

        }, {
            key: 'get',
            value: function get(resource, forceGet) {
                var _this3 = this;

                if (!resource || !isValidID$1(resource.id)) throw new Error();

                if (this._cache[resource.id] && !forceGet) return Promise.resolve(this.cache[resource.id]);

                if (!this._promises[resource.id]) {
                    this._promises[resource.id] = fetch('' + this.baseURI + resource.id, {
                        method: 'GET',
                        headers: this.headers['GET']
                    }).then(function (response) {
                        return response.json();
                    }).then(function (resource) {
                        return _this3.sync(resource);
                    }).then(function (resource) {
                        _this3._promises[resource.id] = null;
                        return resource;
                    });
                }

                return this._promises[resource.id];
            }
        }, {
            key: 'getList',
            value: function getList() {
                var _this4 = this;

                if (!this._promises['list']) {
                    this._promises['list'] = fetch('' + this.baseURI, {
                        method: 'GET',
                        headers: this.headers['GET']
                    }).then(function (response) {
                        return response.json();
                    }).then(function (resourceList) {
                        return _this4.sync(resourceList);
                    }).then(function (resourceList) {
                        _this4._promises['list'] = null;
                        return resourceList;
                    });
                }

                return this._promises['list'];
            }
        }, {
            key: 'post',
            value: function post(newResource) {
                var _this5 = this;

                if (newResource && newResource.id) throw new Error();

                return fetch('' + this.baseURI, {
                    method: 'POST',
                    headers: this.headers['POST'],
                    body: JSON.stringify(newResource)
                }).then(function (response) {
                    return response.json();
                }).then(function (resource) {
                    return _this5.sync(resource);
                });
            }
        }, {
            key: 'put',
            value: function put(resource) {
                var _this6 = this;

                if (!resource || !isValidID$1(resource.id)) throw new Error();

                return fetch('' + this.baseURI + resource.id, {
                    method: 'PUT',
                    headers: this.headers['PUT'],
                    body: JSON.stringify(resource)
                }).then(function (response) {
                    return response.json();
                }).then(function (resource) {
                    return _this6.sync(resource);
                });
            }
        }, {
            key: 'patch',
            value: function patch(resource) {
                var _this7 = this;

                if (!resource || !isValidID$1(resource.id)) throw new Error();

                return fetch('' + this.baseURI + resource.id, {
                    method: 'PATCH',
                    headers: this.headers['PATCH'],
                    body: JSON.stringify(resource)
                }).then(function (response) {
                    return response.json();
                }).then(function (resource) {
                    return _this7.sync(resource);
                });
            }
        }, {
            key: 'delete',
            value: function _delete(resource) {
                var _this8 = this;

                if (!resource || !isValidID$1(resource.id)) throw new Error();

                return fetch('' + this.baseURI + resource.id, {
                    method: 'DELETE',
                    headers: this.headers['DELETE']
                }).then(function () {
                    _this8._cache[resource.id] = null;
                });
            }
        }]);
        return RESTCollection;
    }(RESTApi);

    return RESTApi;

}());
//# sourceMappingURL=rest.js.map