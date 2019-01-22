# AdEx Market

The `adex-market` (formerly named `adex-node`) is the RESTful service responsible for the discovery of advertising demand and supply.

To be more precise, it facilitates submission and tracking of campaigns, as well as user registrations.


## Tracking all campaigns

The primary job of the market is to allow for advertisers to register their campaigns, and to track the campaign state after.

This is accomplished by querying each individual validator about the channel state periodically.

**Please note:** each publisher should rely on their publisher-side platform to track the demand for them. The market only tracks whether the campaign is valid, active and has funds left - it does not track whether it's correctly paying out to publishers.

## AdEx Sentry node discovery

Validators are identified by their Ethereum address in the `Channel` data structure, but in order to send events to them, you need the HTTPS address of their Sentry node.

In order to find the HTTPS address, you can query the `adex-market` to get the `campaignSpec` of a channel. The `campaignSpec` contains a description of each validator, including their HTTPS endpoint.

In the future, this may be further trust-minimized by employing ENS and DNSSEC. However, using a centralized entity for discovery is not really implying trust, because we can always perform a handshake with the validator to verify that they control the given address.


## API

### GET `/campaigns/active`

Get all camapigns that are currently active (there's an active, non-exhausted OUTPACE channel for them)

Additional query parameters:

`?advertiser=` - filter by advertiser

`?validator=` - filter by validator

#### GET `/campaigns/inactive`

Get all campaigns where their OUTPACE channel is either timed out, or exhausted

