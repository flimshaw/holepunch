'use strict';

var PromiseA = require('bluebird');

module.exports.create = function (args) {
  var promises = [];

  if (args.debug) {
    console.log('[HP] create holepuncher');
    console.log(args);
  }

  // TODO determine if we have a AAAA local ip or not
  // TODO get A and AAAA records
  if (-1 !== args.protocols.indexOf('none')) {
    promises.push(PromiseA.any(args.ipifyUrls.map(function (ipifyUrl) {
      var getIp = require('./lib/external-ip');

      return getIp({ hostname: ipifyUrl, debug: args.debug });
    })).then(function (ips) {
      return ips.map(function (ip) {
        // TODO attempt loopback
        return ip;
      });
    }));
  }

  return PromiseA.all(promises).then(function (results) {
    if (args.debug) {
      console.log('[HP] all done');
      console.log(results);
    }
  });
};
