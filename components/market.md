# AdEx Market

The `adex-market` (currently named `adex-node`) is the RESTful service responsible for the discovery of advertising demand and other AdEx nodes on the network.

## Ad Units, slots

It practically serves as a back-end to the dapp to help store your ad units, campaigns and ad slot information. As a publisher, you use the market to discover demand from advertisers.

## AdEx Sentry node discovery

Any party can query the market to discover `adex-sentry` nodes which represent validators.

Validators are identified by their Ethereum address in the Channel data structure, but in order to send events to them, you need the HTTPS address of their `adex-sentry` node. In order to find the HTTPS address, you can query the `adex-market`. In the future, this may be further trust-minimized by employing ENS and DNSSEC. However, using a centralized entity for discovery is not really implying trust, because we can always perform a handshake with the validator to verify that they control the given address. 
