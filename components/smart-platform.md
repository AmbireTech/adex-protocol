# Smart platform

The `adex-smart-platform` is an alternative part of the AdEx protocol where all interactions for a certain campaign (large piece of demand) are recorded on a state channel between the demand side (advertiser) and a delegated (by the demand) `adex-smart-platform` node. Both sides track all events related to the campaign, but the delegated node also performs some duties similar to a DSP, SSP and an exchange - therefore called a "smart platform".

Whoever interacts on the smart platform does not need `adex-market` and `adex-ocean-validator`.

This design is similar to what [AdMarket](https://github.com/adchain/admarket). Unlike AdMarket, the state channel does not imply 3 participating parties, but 2. The events (including impressions) are sent to both. If the event is, for some reason, received by one side only (e.g. network issues), the sides have to come to an agreement whether to record it or not. If the advertiser (demand) decides to underreport, or the publisher (supply) decides to overreport, the other side can always settle the channel and end relationship.
