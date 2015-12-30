# holepunch

A node.js library (api) and command (cli) for using UPnP SSDP
and ZeroConf (Bonjour) NAT-PMP
to make home and office devices and services Internet-accessible.

## Progress

it now works :-)

still in development

```bash
git clone git@github.com:Daplie/holepunch.git

pushd holepunch

node bin/holepunch.js --debug
```

## Install

**Commandline Tool**
```bash
npm install --global holepunch
```

**node.js Library**
```
npm install --save holepunch
```

## Commandline (CLI)

```bash
holepunch --help
```

```
holepunch --plain-ports 80,65080 --tls-ports 443,65443
```

TODO `--prebound-ports 22`

```
Usage:
  holepunch.js [OPTIONS] [ARGS]

Options:
      --debug BOOLEAN       show traces and logs

      --plain-ports STRING  Port numbers to test with plaintext loopback.
                            (default: 65080)
                            (formats: <port>,<internal:external>)

      --tls-ports STRING    Port numbers to test with tls loopback.
                            (default: null)

      --ipify-urls STRING   Comma separated list of URLs to test for external ip.
                            (default: api.ipify.org)

      --protocols STRING    Comma separated list of ip mapping protocols.
                            (default: none,upnp,pmp)

      --rvpn-configs STRING Comma separated list of Reverse VPN config files in
                            the order they should be tried. (default: null)

  -h, --help                Display help and usage details
```

## API

```javascript
var punch = require('holepunch');
```

## Non-Root

You **do not need root** to map ports, but you may need root to test them.

If you're cool with allowing all node programs to bind to privileged ports, try this:

```bash
sudo setcap 'cap_net_bind_service=+ep' /usr/local/bin/node
```

# License

MPL-2.0
