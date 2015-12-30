'use strict';

//var PromiseA = require('bluebird').Promise;
var natUpnp = require('holepunch-upnp');

function upnpForward(opts) {
  return natUpnp.createClient({ timeout: 3000 }).then(function (client) {
    return client.portMapping({
      public: opts.external || opts.public || opts.internal
    , private: opts.internal || opts.private || opts.public || opts.external
    , ttl: opts.ttl || 0
    }).then(function (result) {
      if (opts.debug) {
        console.log('[HP] upnp result');
        console.log(result);
      }
      return result;
    });
    /*.then(function () {
      var promitter = client.getMappings();

      promitter.on('entry', function (entry, i) {
        console.log('entry', i);
        console.log(entry);
      }).then(function (mappings) {
        console.log('mappings');
        console.log(mappings);
      });

      return promitter;
    });*/
  });
}

module.exports = function (args, ips, portInfo) {
  // TODO ips.forEach
  return upnpForward({
    debug: args.debug
  , private: portInfo.internal
  , public: portInfo.external
  // , localAddress: ip.localAddress
  });
};

module.exports.upnpForward = upnpForward;

/*
client.portUnmapping({
  public: 80
});

.findGateway().then(function (stuff) {
      console.log('[a] gateway');
      console.log(stuff.gateway);
      console.log('[a] address');
      console.log(stuff.address);
    }).then(function () {
      return client
*/

/*
client.getMappings({ local: true }, function(err, results) {
  console.log('local mappings', results);
});

client.externalIp(function(err, ip) {
  console.log('ext-ip', ip);
});
*/

function usage() {
  console.warn("");
  console.warn("node helpers/upnp-forward [public port] [private port] [ttl]");
  console.warn("");
}

function run() {
  var pubPort = parseInt(process.argv[2], 10) || 0;
  var privPort = parseInt(process.argv[3], 10) || pubPort;
  var ttl = parseInt(process.argv[4], 10) || 0;
  var options = { public: pubPort, private: privPort, ttl: ttl };

  if (!pubPort) {
    usage();
    return;
  }

  exports.upnpForward(options).then(function () {
    console.log('done');
  }).catch(function (err) {
    console.error('[HP] Error: upnpForward:');
    console.error(err.stack);
    return PromiseA.reject(err);
  });
}

if (require.main === module) {
  run();
  return;
}
