'use strict';

var PromiseA = require('bluebird');
//var dns = PromiseA.promisifyAll(require('dns'));
var https = PromiseA.promisifyAll(require('https'));
var os = require('os');

function requestAsync(opts) {
  return new PromiseA(function (resolve, reject) {
    var req = https.request(opts, function (res) {
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

module.exports = function (opts) {
  var promises = [];
  var interfaces = os.networkInterfaces();
  var ifacenames = Object.keys(interfaces).filter(function (ifacename) {
    // http://www.freedesktop.org/wiki/Software/systemd/PredictableNetworkInterfaceNames/
    // https://wiki.archlinux.org/index.php/Network_configuration#Device_names
    // we do not include tun and bridge devices because we're trying
    // to see if any physical interface is internet-connected first
    return /^(en|sl|wl|ww|eth|net|lan|wifi|inet)/.test(ifacename);
  });
  var ifaces = ifacenames.reduce(function (all, ifacename) {
    var ifs = interfaces[ifacename];

    ifs.forEach(function (iface) {
      if (!iface.internal && !/^fe80/.test(iface.address)) {
        all.push(iface);
      }
    });

    return all;
  }, []);

  /*
  // TODO how to support servername
  promises.push(dns.resolve4Async(hostname).then(function (ips) {
    return ips.map(function (ip) {
      return {
        address: ip
      , family: 'IPv4'
      };
    });
  }));

  promises.push(dns.resolve6Async(hostname).then(function (ips) {
    return ips.map(function (ip) {
      return {
        address: ip
      , family: 'IPv6'
      };
    });
  }));
  */

  function parseIp(ip) {
    if (!/\d+\.\d+\.\d+\.\d+/.test(ip) && !/\w+\:\w+/.test(ip)) {
      return PromiseA.reject(new Error("bad response '" + ip + "'"));
    }

    return ip;
  }

  function ignoreEinval(err) {
    if ('EINVAL' === err.code) {
      if (opts.debug) {
        console.warn('[HP] tried to bind to invalid address:');
        console.warn(err.stack);
      }
      return null;
    }

    return PromiseA.reject(err);
  }

  if (opts.debug) {
    console.log('[HP] external ip opts:');
    console.log(opts);

    console.log('[HP] external ifaces:');
    console.log(ifaces);
  }

  ifaces.forEach(function (iface) {
    promises.push(requestAsync({
      family: iface.family
    , method: 'GET'
    , headers: {
        Host: opts.hostname
      }
    , localAddress: iface.address
    , servername: opts.hostname   // is this actually sent to tls.connect()?
    , hostname: opts.hostname     // if so we could do the DNS ourselves
                                  // and use the ip address here
    , port: opts.port || 443
    , pathname: opts.pathname || opts.path || '/'
    }).then(parseIp, ignoreEinval).then(function (addr) {
      return {
        family: iface.family
      , address: addr
      };
    }));
  });

  return PromiseA.all(promises).then(function (results) {
    if (opts.debug) {
      console.log('[HP] got all ip address types');
      console.log(results);
    }

    return results;
  }, function (err) {
    console.error('[HP] error');
    console.error(err);
  });
};
