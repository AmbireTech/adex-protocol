# Smart platform

The `adex-smart-platform` is an alternative part of the AdEx protocol where all interactions for a certain campaign (large piece of demand) are recorded on a state channel between the demand side (advertiser) and a delegated (by the demand) `adex-smart-platform` node. Both sides track all events related to the campaign, but the delegated node also performs some duties similar to a DSP, SSP and an exchange - therefore called a "smart platform".

Whoever interacts on the smart platform does not need `adex-market` and `adex-ocean-validator`.

This design is similar to what [AdMarket](https://github.com/adchain/admarket). Unlike AdMarket, the state channel does not imply 3 participating parties, but 2. The events (including impressions) are sent to both. If the event is, for some reason, received by one side only (e.g. network issues), the sides have to come to an agreement whether to record it or not. If the advertiser (demand) decides to underreport, or the publisher (supply) decides to overreport, the other side can always settle the channel and end relationship.

The way this works is the following:

1. The advertiser (demand) starts a campaign with a total budget and certain parameters (ad units, targeting, min/max price per impression/click/etc.); this translates to opening a state channel with a certain smart platform node; at this point the advertiser delegates two nodes: one that represents them, and one that represents publishers (called the "smart platform")
2. Publishers who've registered on this particular smart platform will query it every time someone opens their website/app; the query will happen on the client side (in the browser/app), much like regular header bidding; the AdEx SDK will select one of those bids and relay that selection to both participants in the state channel
3. The user will generate some events (impressions, clicks, page closed, etc.) and send them to the participants in the state channel
4. The events will be registered in the state channel, creating a message that can be checkpointed on-chain after each state transition
5. Should the publisher decide to withdraw their earnings, they will checkpoint the channels they've earned from and withdraw


Each state channel message is `(seq, stateRoot, sigA, sigB)` and can be checkpointed on-chain by anyone, as long as `sigA` and `sigB` are valid and `seq` is higher than the previous checkpointed `seq`. This message can also be used to settle the channel.

The `stateRoot` is a `hash(channelId, balancesRoot, eventsRoot)`

@TODO balancesRoot allows to withdraw but not more than the overall channel deposit
@TODO benefits
@TODO how a publisher would withdraw their earnings
@TODO all things of the email

