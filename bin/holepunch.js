#!/usr/bin/env node
'use strict';

var cli = require('cli');
//var mkdirp = require('mkdirp');

// TODO link with RVPN service: server, email, domains, agree-tos
// TODO txt records for browser plugin: TXT _http.example.com _https.example.com
cli.parse({
  debug: [ false, " show traces and logs", 'boolean', false ]
, 'plain-ports': [ false, " Port numbers to test with plaintext loopback. (default: 65080) (formats: <port>,<internal:external>)", 'string' ]
//, 'plain-ports': [ false, " Port numbers to test with plaintext loopback. (default: 65080) (formats: <port>,<internal:external>,<internal:external1|external2>)", 'string' ]
, 'tls-ports': [ false, " Port numbers to test with tls loopback. (default: null)", 'string' ]
, 'ipify-urls': [ false, " Comma separated list of URLs to test for external ip. (default: api.ipify.org)", 'string' ]
, 'protocols': [ false, " Comma separated list of ip mapping protocols. (default: none,upnp,pmp)", 'string' ]
, 'rvpn-configs': [ false, " Comma separated list of Reverse VPN config files in the order they should be tried. (default: null)", 'string' ]
// TODO allow standalone, webroot, etc
});

// ignore certonly and extraneous arguments
cli.main(function(_, options) {
  console.log('');
  var args = {};
  var hp = require('../');

  function parsePorts(portstr) {
    var parts = portstr.split(':');
    var opts = {
      internal: parseInt(parts[0], 10)
    , external: (parts[1]||parts[0]).split('|').map(function (port) {
        return parseInt(port, 10);
      })[0]
    };

    return opts;
  }

  function exists(x) {
    return x;
  }

  if (options.debug) {
    console.log('[HP CLI] options');
    console.log(options);
  }

  args.debug = options.debug;
  args.plainPorts = options['plain-ports'];
  args.tlsPorts = options['tls-ports'];
  args.protocols = options.protocols;
  args.ipifyUrls = options['ipify-urls'];
  args.rvpnConfigs = options['rvpn-configs'];

  if ('false' === args.ipifyUrls || false === args.ipifyUrls) {
    args.ipifyUrls = [];
  } else {
    args.ipifyUrls = (args.ipifyUrls || 'api.ipify.org').split(',');
  }
  if ('false' === args.protocols || false === args.protocols) {
    args.protocols = [];
  } else {
    args.protocols = (args.protocols || 'none,upnp,pmp').split(',');
  }
  // Coerce to string. cli returns a number although we request a string.
  args.tlsPorts = (args.tlsPorts || "").toString().split(',').filter(exists).map(parsePorts);
  args.rvpnConfigs = (args.rvpnConfigs || "").toString().split(',').filter(exists);
  if ('false' === args.plainPorts || false === args.plainPorts) {
    args.plainPorts = [];
  } else {
    args.plainPorts = (args.plainPorts || "65080").toString().split(',').map(parsePorts);
  }

  return hp.create(args).then(function () {
    console.log('wishing wanting waiting');
    //process.exit(0);
  });
});
