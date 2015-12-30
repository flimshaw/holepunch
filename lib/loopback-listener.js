'use strict';

var http = require('http');
var https = require('https');
var express = require('express');

var middleware = module.exports.middleware = require('./middleware');

module.exports.create = function (opts) {
  var httpsOptions = opts.httpsOptions || require('localhost.daplie.com-certificates');
  var results = {
    plainServers: []
  , tlsServers: []
  };
  var app = express();

  app.use('/', middleware(opts));

  (opts.plainPorts||[]).forEach(function (plainPort) {
    var plainServer = http.createServer();
    plainServer.__plainPort = plainPort;
    plainServer.on('request', app);
    results.plainServers.push(plainServer);
  });

  (opts.tlsPorts||[]).forEach(function (tlsPort) {
    var tlsServer = https.createServer(httpsOptions);
    tlsServer.__tlsPort = tlsPort;
    tlsServer.on('request', app);
    results.tlsServers.push(tlsServer);
  });

  function onListen() {
    /*jshint validthis: true*/
    var server = this;
    var addr = server.address();
    var proto = 'honorCipherOrder' in server ? 'https' : 'http';

    console.info('Listening on ' + proto + '://' + addr.address + ':' + addr.port);
  }

  process.nextTick(function () {
    results.plainServers.forEach(function (plainServer) {
      plainServer.listen(
        plainServer.__plainPort.internal || plainServer.__plainPort.port
      , plainServer.__plainPort.address || '0.0.0.0'
      , onListen
      );
    });
    results.tlsServers.forEach(function (tlsServer) {
      tlsServer.listen(
        tlsServer.__tlsPort.internal || tlsServer.__tlsPort.port
      , tlsServer.__tlsPort.address || '0.0.0.0'
      , onListen
      );
    });
  });

  results.key = opts.key;
  results.value = opts.value;
  results.loopbackHostname = opts.loopbackHostname;
  results.loopbackPrefix = opts.loopbackPrefix;

  return results;
};
