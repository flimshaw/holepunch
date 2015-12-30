'use strict';

var PromiseA = require('bluebird');
var loopback = require('./loopback-listener');

module.exports.create = function (args) {
  if (args.debug) {
    console.log('[HP] create holepuncher');
    console.log(args);
  }

  var servers = loopback.create(args);
  //var promises = [];

  if (args.debug) {
    console.log('[HP] create servers');
    console.log(servers);
  }

  function getExternalIps() {
    return PromiseA.any(args.ipifyUrls.map(function (ipifyUrl) {
      var getIp = require('./external-ip');

      return getIp({ hostname: ipifyUrl, debug: args.debug });
    }));
  }

  function testOpenPort(ip, portInfo) {
    var requestAsync = require('./request');

    if (args.debug) {
      console.log('[HP] hostname', args.loopbackHostname);
    }

    return requestAsync({
      secure: portInfo.secure
    , rejectUnauthorized: false
    , hostname: ip.address
      // '/.well-known/com.daplie.loopback/'
    , path: args.loopbackPrefix + args.key
      // 'loopback.daplie.invalid'
    , servername: args.loopbackHostname
    , localAddress: ip.localAddress
    , port: portInfo.external || portInfo.internal
    , headers: {
        // 'loopback.daplie.invalid'
        Host: args.loopbackHostname
      }
    }).then(function (val) {
      if (args.debug) {
        console.log('[HP] loopback test reached', val);
      }

      if (val !== args.value) {
        return PromiseA.reject(new Error("invalid loopback token value"));
      }

      ip.validated = true;

      ip.ports.push(portInfo);
      portInfo.ips.push(ip);

      return portInfo;
    }, function (err) {
      if (args.debug) {
        console.error('[HP] loopback test err');
        console.error(err.stack);
      }

      return PromiseA.reject(err);
    });
  }

  function testPort(opts) {
    // TODO should ip.address === ip.localAddress be treated differently?
    // TODO check local firewall?
    // TODO would it ever make sense for a public ip to respond to upnp?

    // TODO should we pass any or require all?
    opts.portInfo.ips = [];

    return PromiseA.any(opts.ips.map(function (ip) {
      ip.ports = [];

      if (opts.debug) {
        console.log('[HP] no pretest', opts.pretest);
      }

      if (!opts.pretest) {
        return ip;
      }

      return testOpenPort(ip, opts.portInfo);
    }));
  }

  return getExternalIps().then(function (ips) {
    var pretest = (-1 !== args.protocols.indexOf('none'));
    var portInfos = args.plainPorts.map(function (info) {
      info.secure = false;
      return info;
    }).concat(args.tlsPorts.map(function (info) {
      info.secure = true;
      return info;
    }));

    return PromiseA.all(portInfos.map(function (info) {
      // TODO clone-merge args
      return testPort({
        portInfo: info
      , ips: ips
      , pretest: pretest
      });
    })).then(function (portInfos) {
      if (args.debug) {
        console.log('[HP] all done on the first try');
        console.log(portInfos);
      }
      return portInfos;
    }, function () {
      // at least one port could not be mapped
      var mappers = [];

      if (-1 !== args.protocols.indexOf('upnp')
        ||  -1 !== args.protocols.indexOf('ssdp')
      ) {
        mappers.push(require('./upnp'));
      }

      if (-1 !== args.protocols.indexOf('pmp')
        || -1 !== args.protocols.indexOf('nat-pmp')
      ) {
        mappers.push(require('./pmp'));
      }

      return PromiseA.all(portInfos.map(function (portInfo) {
        return PromiseA.any(mappers.map(function (fn) {
          var p = fn(args, ips, portInfo);

          if (portInfo.ips.length) {
            return portInfo;
          }

          return p;
        }));
      })).then(function () {
        if (args.debug) {
          console.log("[HP] all ports successfully mapped");
          console.log(portInfos);
        }

        return portInfos;
      });
    }).then(function () {
      return portInfos;
    }, function (err) {
      console.warn('[HP] RVPN not implemented');
      console.warn(err.stack);
      return portInfos;
    });
  });
};
