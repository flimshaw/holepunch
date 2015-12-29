'use strict';

var scmp = require('scmp');

function middleware(opts) {
  var key = opts.key;
  var val = opts.value;
  var vhost = opts.vhost;
  var pathnamePrefix = opts.prefix || '/.well-known/com.daplie.loopback/';
  var defaultHostname = 'loopback.daplie.invalid';

  if (!key) {
    opts.key = require('crypto').randomBytes(8).toString('hex');
  }
  if (!val) {
    opts.value = require('crypto').randomBytes(16).toString('hex');
  }
  if (!vhost && vhost !== false) {
    vhost = defaultHostname;
  }
  if ('/' !== pathnamePrefix[pathnamePrefix.length - 1]) {
    pathnamePrefix += '/';
  }

  return function (req, res, next) {
    var hostname = (req.hostname || req.headers.host || '').toLowerCase();
    var urlpath = (req.pathname || req.url);

    if (vhost !== false && vhost !== hostname) {
      if (opts.debug) {
        console.log("[HP] Host '" + hostname + "' failed to match '" + vhost + "'");
      }
      next();
      return;
    }

    if (0 !== urlpath.indexOf(pathnamePrefix)) {
      if (opts.debug) {
        console.log("[HP] Pathname '" + urlpath + "'"
          + " failed to match '" + pathnamePrefix + "'");
      }
      next();
      return;
    }

    if (scmp(key, urlpath.substr(pathnamePrefix.length, key.length))) {
      if (opts.debug) {
        console.log("[HP] Pathname '" + urlpath + "'"
          + " failed to match '" + pathnamePrefix + key + "'");
      }
      next();
      return;
    }

    res.setHeader('Content-Type', 'text/plain');
    res.end(val);
  };
}

module.exports = middleware;