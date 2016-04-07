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
    if (URI.startsWith('http'))
        return ensureURIHasOneTrailingSlash(URI.trim());
    else
        return ensureURIHasOneLeadingSlash(ensureURIHasOneTrailingSlash(URI.trim()));
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
    if (!URI.startsWith('/')) return `/${URI}`;
    return ensureURIHasOneLeadingSlash(URI.slice(1));
}

function ensureURIHasOneTrailingSlash(URI) {
    if (URI === '/') return URI;
    if (!URI.endsWith('/')) return `${URI}/`;
    return ensureURIHasOneTrailingSlash(URI.slice(0, -1));
}


function isValidID(id) {
    return Number.isSafeInteger(id);
}

export { isValidURI, isValidNestedURI,
         formatURI, formatNestedURI,
         ensureURIHasNoLeadingSlash, ensureURIHasOneLeadingSlash, ensureURIHasOneTrailingSlash,
         isValidID };