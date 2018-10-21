# AdEx Market

The `adex-market` (currently named `adex-node`) is the RESTful service responsible for the discovery of advertising bids and OCEAN validator nodes.

## Ad Units, slots, bids

It practically serves as a back-end to the dapp to help store your ad units, campaigns, bids and ad slot information. As a publisher, you use the market to discover bids from advertisers. 

## OCEAN Validator discovery

Any party can query the market to discover OCEAN validators.

Validators are identified by their Ethereum address in the Commitment data structure, but in order to send events to them, you need their HTTPS address. In order to find the HTTPS address, you can query the `adex-market`. In the future, this may be further decentralized by employing ENS and DNSSEC. Using a centralized entity for discovery is not implying trust, because we can always perform a handshake with the OCEAN validator to verify that they control the given address. 
