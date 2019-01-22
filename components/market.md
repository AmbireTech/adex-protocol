# AdEx Market

The `adex-market` (formerly named `adex-node`) is the RESTful service responsible for the discovery of advertising demand and supply.

To be more precise, it facilitates submission and tracking of campaigns, as well as user registrations.


## Tracking all campaigns

The primary job of the market is to allow for advertisers to register their campaigns, and to track the campaign state after.

This is accomplished by querying each individual validator about the channel state periodically.

**Please note:** each publisher should rely on their publisher-side platform to track the demand for them. The Market only aggregates the information from vaidators to facilitate discovery.

## AdEx Validator (Sentry node) discovery

Validators are identified by their Ethereum address in the `Channel` data structure, but in order to send events to them, you need the HTTPS address of their Sentry node.

In order to find the HTTPS address, you can query the [valiators resource](#validators). It will return data aggregated from the `campaignSpec` field of every channel, which contains a description of each validator, including their HTTPS endpoint.

In the future, this may be further trust-minimized by employing ENS and DNSSEC. However, using a centralized entity for discovery is not really implying trust, because we can always perform a handshake with the validator to verify that they control the given address.


## API

### campaigns

### users

### validators


## Internals

### Discovery loop

### Status loop
