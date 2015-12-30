'use strict';

var PromiseA = require('bluebird');
var https = PromiseA.promisifyAll(require('https'));
var http = PromiseA.promisifyAll(require('http'));

function requestAsync(opts) {
  return new PromiseA(function (resolve, reject) {
    var httpr = (false === opts.secure) ? http : https;

    var req = httpr.request(opts, function (res) {
      var data = '';

      res.on('error', function (err) {
        if (opts.debug) {
          console.error('[Error] HP: bad request:');
          console.error(err);
        }
        reject(err);
      });
      res.on('data', function (chunk) {
        if (opts.debug > 2) {
          console.log('HP: request chunk:');
          console.log(chunk);
        }
        data += chunk.toString('utf8');
      });
      res.on('end', function () {
        if (opts.debug > 2) {
          console.log('HP: request complete:');
          console.log(data);
        }
        resolve(data);
      });
    });

    req.on('error', reject);
    req.end();
  });
}

module.exports = requestAsync;
