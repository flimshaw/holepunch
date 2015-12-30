'use strict';

var PromiseA = require('bluebird');
var loopback = require('./loopback-listener');

module.exports.create = function (args) {
  if (args.debug) {
    console.log('[HP] create holepuncher');
    console.log(args);
  }

  var servers = loopback.create(args);
  var promises = [];

  if (args.debug) {
    console.log('[HP] create servers');
    console.log(servers);
  }

  if (-1 !== args.protocols.indexOf('none')) {
    promises.push(PromiseA.any(args.ipifyUrls.map(function (ipifyUrl) {
      var getIp = require('./external-ip');

      return getIp({ hostname: ipifyUrl, debug: args.debug });
    })).then(function (ips) {
      // TODO how (if at all) should ip.address === ip.localAddress be treated differently?
      // TODO check local firewall?
      // TODO would it ever make sense for a public ip to respond to upnp?
      var requestAsync = require('./request');

      return PromiseA.all(ips.map(function (ip) {
        return requestAsync({
          secure: false
        , hostname: ip.address
        , path: '/api/com.daplie.loopback'
        , servername: 'daplie.invalid'
        , localAddress: ip.localAddress
        , port: 65080
        , headers: {
            Host: 'daplie.invalid'
          }
        });
      }));
    }));
  }

  return PromiseA.all(promises).then(function (results) {
    if (args.debug) {
      console.log('[HP] all done');
      console.log(results);
    }
  });
};
