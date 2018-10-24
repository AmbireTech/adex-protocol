# Smart platform

The `adex-smart-platform` is an alternative part of the AdEx protocol where all interactions for a certain campaign (large piece of demand) are recorded on a state channel between the demand side (advertiser) and a delegated (by the demand) `adex-smart-platform` node. Both sides track all events related to the campaign, but the delegated node also performs some duties similar to a DSP, SSP and an exchange - therefore called a "smart platform".

Whoever interacts on the smart platform does not need `adex-market` and `adex-ocean-validator` - this is essentially an alternative of that architecture.

This design is similar to what [AdMarket](https://github.com/adchain/admarket). Unlike AdMarket, the state channel does not imply 3 participating parties, but 2. The events (including impressions) are sent to both. If the event is, for some reason, received by one side only (e.g. network issues), the sides have to come to an agreement whether to record it or not. If the advertiser (demand) decides to underreport, or the publisher (supply) decides to overreport, the other side can always settle the channel and end relationship.

The way this works is the following:

1. The advertiser (demand) starts a campaign with a total budget and certain parameters (ad units, targeting, min/max price per impression/click/etc.); this translates to opening a state channel with a certain smart platform node; at this point the advertiser delegates two nodes: one that represents them, and one that represents publishers (called the "smart platform")
2. Publishers who've registered on this particular smart platform will query it every time someone opens their website/app; the query will happen on the client side (in the browser/app), much like regular header bidding; the AdEx SDK will select one of those bids and relay that selection to both participants in the state channel
3. The user will generate some events (impressions, clicks, page closed, etc.) and send them to the participants in the state channel
4. The events will be registered in the state channel, creating a message that can be checkpointed on-chain after each state transition
5. Should the publisher decide to withdraw their earnings, they will checkpoint the channels they've earned from, provide merkle proofs that the earnings are contained in the `stateRoot`, and withdraw


Each state channel message is `(seq, stateRoot, sigA, sigB)` and can be checkpointed on-chain by anyone, as long as `sigA` and `sigB` are valid and `seq` is higher than the previous checkpointed `seq`. This message can also be used to settle the channel. The history of those messages will be publically accessible.

The `stateRoot` is a `hash(channelId, balancesRoot, eventsRoot)`

The leader in advancing the state is the advertiser - they will sort the events, apply them to the state and sign. Each new state may apply more than one new event, allowing for higher throughput. Once they sign the new state, the smart platform will verify and sign itself.

## Privacy

Only the advertiser and the smart platform nodes would know the full event history. Sensitive and valuable data is kept private to the parties that have accumulated it, 

However, they may choose to reveal certain info to certain parties and trustlessly prove it's true via the merkle root of the state (`stateRoot`). For example, each publisher would constantly receive a proof that their earnings are contained in the state tree. This guarantees they may withdraw at any time.

Same goes for aggregated analytics and reporting - any part can be trustlessly revealed to any party.

Individual events can be retrieved by proving you control an address, via a signed message, involved in a subset of events - this applies for end users, advertisers and publishers. This means that even users can get all events they've generated, trustlessly. However, a publisher cannot see the events that another publisher generated.


@TODO introduce the concept of state tree, say a few things about merkle proofs, state channels
@TODO balancesRoot allows to withdraw but not more than the overall channel deposit
@TODO benefits
@TODO how a publisher would withdraw their earnings; describe gas costs - each merkle proof is log 2 hashes
@TODO all things of the email
@TODO impl adex-smart-platform: simple API, on top of SQL (sqlite/postgres both supported) and tokio for networking (zap?)
@TODO describe the `adex-smart-platform` node implementation: performance is critical;  needs to easily scale horizontally and sharding needs to be thought of; needs merkle trees too, but the channel would merely be open with (deposit, timeout) and advanced with (seq, stateRoot, sigA, sigB); the channel can be checkpointed at any time, or settled (remaining funds returned to whoever opened it)
@TODO header bidding spec; On each open of a publisher website, it would pull all bids from the operator and select a bid (campaign), and send events
@TODO channel spec: describe withdraw, withdrawFromChannel(s) (array of `checkpointState(seq,stateRoot,sigA,sigB), merkleProof`); describe on-chain guarantees against double spending and why they work in a unidirectional channel; global withdrawnPerChannel and withdrawn[channel][addr] where `require(addr!=advertiser)` is not allowed to withdraw; also `assert(available > alreadyWithdrawn)`
@TODO channel spec: when you withdrawFromChannels, should state messages be used to checkpoint on-chain or just for the withdraw? we should, to prevent the advertiser timing out the channel; it's a security consideration
@TODO should we have some sort of link between msgs in the channel - do we gain anything from it? e.g. hashing the previous state root as well
@TODO describe at what point (how many unreported events) the smart platform (publisher/supply) would decide to untrust the channel
@TODO a nice privacy preserving property would be that the platform wouldn't reveal which wallet (in terms of revenue in the balances part of the state tree) belongs to which publisher; that way you can't see where the moeny from an advertising campaign is flowing, even if everyone withdrawls

