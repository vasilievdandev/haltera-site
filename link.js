// Reads a Haltera share link (the format of src/domain/share-link.ts): https://haltera.app/p#…
// (a plan) or /w#… (a finished workout); the data is base64url JSON after the `#`.
// Plain ES5-ish script for the browser; also loaded by the app's tests to check both agree.
var HalteraLink = (function () {
  var ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

  function decode(data) {
    if (!/^[A-Za-z0-9_-]*$/.test(data) || data.length % 4 === 1) throw new Error('bad data');
    var hex = '';
    for (var i = 0; i < data.length; i += 4) {
      var chunk = data.slice(i, i + 4);
      var n = 0;
      for (var k = 0; k < 4; k++)
        n = (n << 6) | (k < chunk.length ? ALPHABET.indexOf(chunk[k]) : 0);
      var bytes = [(n >> 16) & 255];
      if (chunk.length > 2) bytes.push((n >> 8) & 255);
      if (chunk.length > 3) bytes.push(n & 255);
      for (var b = 0; b < bytes.length; b++)
        hex += '%' + (bytes[b] < 16 ? '0' : '') + bytes[b].toString(16);
    }
    // UTF-8 bytes → text.
    return decodeURIComponent(hex);
  }

  /** { type: 'p' | 'w', data } or null. */
  function readLink(url) {
    var match = /^(?:https?:\/\/[^/]+)?\/?(p|w)(?:\.html)?\/?(?:\?[^#]*)?#([A-Za-z0-9_-]+)$/.exec(
      url,
    );
    if (!match) return null;
    try {
      var data = JSON.parse(decode(match[2]));
      if (!data || typeof data !== 'object') return null;
      return { type: match[1], data: data };
    } catch (e) {
      return null;
    }
  }

  return { readLink: readLink };
})();

if (typeof module !== 'undefined') module.exports = HalteraLink;
