'use strict';

var punch = require('../');

function touch() {
  punch({
    mappings: [
      { internal: 80
      , external: 80
      , secure: false
      , loopback: false
      }
    , { internal: 65080
      , external: 65080
      , secure: false
      , loopback: false
      }
    , { internal: 65443
      , external: 65443
      , secure: false
      , loopback: false
      }
    , { internal: 443
      , external: 443
      , secure: false
      , loopback: false
      }
    , { internal: 65022
      , external: 65022
      , secure: false
      , loopback: false
      }
    , { internal: 22
      , external: 22
      , secure: false
      , loopback: false
      }
    ]
  , upnp: true
  , pmp: true
  , debug: true
  }).then(function (results) {
    console.log('map results');
    console.log(results);
  });
}

setInterval(touch, 90 * 60 * 1000);
touch();
