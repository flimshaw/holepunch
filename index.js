'use strict';

var PromiseA = require('bluebird');
var requestAsync = PromiseA.promisify(require('request'));

module.exports.create = function (args) {
  var promises = [];

  if (args.debug) {
    console.log('[HP] create holepuncher');
    console.log(args);
  }

  // TODO determine if we have a AAAA local ip or not
  // TODO get A and AAAA records
  if (-1 !== args.protocols.indexOf('none')) {
    promises.push(PromiseA.some(args.ipifyUrls.map(function (ipifyUrl) {
      return requestAsync('https://' + ipifyUrl).then(function (resp) {
        var ip = (resp.body || '').toString('ascii');

        if (!/\d+\.\d+\.\d+\.\d+/.test(ip) && !/\w+\:\w+/.test(ip)) {
          return PromiseA.reject(new Error("bad response '" + resp.body + "'"));
        }

        return ip;
      });
    }), 1));
  }

  return PromiseA.all(promises).then(function (results) {
    if (args.debug) {
      console.log('[HP] all done');
      console.log(results);
    }
  });
};
