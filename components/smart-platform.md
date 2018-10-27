# Smart platform

The `adex-smart-platform` is an alternative part of the AdEx protocol where all interactions for a certain campaign (large piece of demand) are recorded on a unidirectional payment channel between the demand side (advertiser) and a delegated (by the demand) `adex-smart-platform` node. Both sides track all events related to the campaign, but the delegated node also performs some duties similar to a DSP, SSP and an exchange - therefore called a "smart platform".

Whoever interacts on the smart platform does not need `adex-market` and `adex-ocean-validator` - this is essentially an alternative of that architecture.

This design is similar to what [AdMarket](https://github.com/adchain/admarket). Unlike AdMarket, the payment channel is based on our [OCEAN design](/OCEAN.md) - which means it can have any number of validators, and 2/3 supermajority of signed messages would advance the state. However, in the real world, our design can be used with 2 participants only (demand and supply) while still keeping the system trustless. The events (including impressions) are sent to both. If the event is, for some reason, received by one side only (e.g. network issues), the sides have to come to an agreement whether to record it or not. If the advertiser (demand) decides to underreport, or the publisher (supply) decides to overreport, the other side can always stop advancing the channel and withdraw their funds.

The way this works is the following:

1. The advertiser (demand) starts a campaign with a total budget and certain parameters (ad units, targeting, min/max price per impression/click/etc.); this translates to opening a payment channel with a certain smart platform node; at this point the advertiser delegates two nodes: one that represents them, and one that represents publishers (called the "smart platform")
2. Publishers who've registered on this particular smart platform will query it every time someone opens their website/app; the query will happen on the client side (in the browser/app), much like regular header bidding; the AdEx SDK will select one of those bids and relay that selection to both participants in the payment channel
3. The user will generate some events (impressions, clicks, page closed, etc.) and send them to the participants in the payment channel
4. The events will be registered in the payment channel, creating a message that can be checkpointed on-chain after each state transition
5. Should the publisher decide to withdraw their earnings, they can withdraw from any number of channels at once by providing a merkle proof of their earnings


## Specification

Each payment channel message is `(balancesRoot, eventsRoot, signatures)` and can be used to withdraw at anytime, as long as `signatures` are valid for a supermajority of the validators. Unlike other payment channels/state channels, `sequence` is not needed. Because of the strict unidirectional property of the payment channel, any message can be used to withdraw at any time safely.

What the validators sign is `hash(channelId, balancesRoot, eventsRoot)`.

The leader in advancing the state is the demand (advertiser) - they will sort the events, apply them to the state and sign. Each new state may apply more than one new event, allowing for higher throughput. Once the leader signs the new state, all the other validators (normally the supply) will validate and sign too.

## Privacy

Only the advertiser and the smart platform nodes would know the full event history. Sensitive and valuable data is kept private to the parties that have accumulated it, 

However, they may choose to reveal certain info to certain parties and trustlessly prove it's true via the merkle root of the state (`stateRoot`). For example, each publisher would constantly receive a proof that their earnings are contained in the state (balances) tree. This guarantees they may withdraw at any time.

Please note that the entire balances tree will be revealed to everyone at all times, (1) to allow earners (publishers) to observe it's validity and (2) it will be revealed on-chain anyway once everyone withdraws.

Same goes for aggregated analytics and reporting - any part can be trustlessly revealed to any party.

Individual events can be retrieved by proving you control an address, via a signed message, involved in a subset of events - this applies for end users, advertisers and publishers. This means that even users can get all events they've generated, trustlessly. However, a publisher cannot see the events that another publisher generated.


## References

@TODO merkle proofs, unidirectional payment channels


------------------------------

@TODO the stateRoot is a merkle root of (previousStateRoot, eventsRoot, balance...)
@TODO balancesRoot allows to withdraw but not more than the overall channel deposit
@TODO benefits: continuous guarantee that you can withdraw your earnings, UX, bid selection, etc.
@TODO how a publisher would withdraw their earnings; describe gas costs - each merkle proof is log 2 hashes; ~18 words need to be passed as args

@TODO impl adex-smart-platform: rust? simple API, on top of SQL (sqlite/postgres both supported) and tokio for networking (zap?); WASM state transition function
@TODO can adex-smart-platform be designed in a blockchain-agnostic way; the blockchain interface should allow to enumerate channels, sign a channel state update
@TODO describe the `adex-smart-platform` node implementation: performance is critical;  needs to easily scale horizontally and sharding needs to be thought of; needs merkle trees too, but the channel would merely be open with (deposit, timeout) and advanced with (seq, stateRoot, sigA, sigB); the channel can be checkpointed at any time, or settled (remaining funds returned to whoever opened it)

@TODO header bidding spec; On each open of a publisher website, it would pull all bids from the operator and select a bid (campaign), and send events

@TODO channel full spec: validator logic same as OCEAN, except no rewards (rewards can be included in the balance tree); only channelStart (locks up a deposit), channelWithdraw, channelTimeout; timeouts are for extreme byzantine cases (validators offline)
@TODO channel spec: describe channelWithdraw (array of `channelHash, (stateRoot,signatures), merkleProof`); describe on-chain guarantees against double spending and why they work in a unidirectional channel; global withdrawn[channel] and withdrawnByAddr[channel][spender] where `require(addr!=advertiser)` is not allowed to withdraw; also `assert(available > alreadyWithdrawn)`
@TODO channel spec: when you withdrawFromChannels, should state messages be used to checkpoint on-chain or just for the withdraw? we should, to prevent the advertiser timing out the channel; it's a security consideration
@TODO channel spec: explain why sequence is not needed
@TODO channel spec: explain why challenge period is not needed
@TODO channel spec: the worst byzantine case if the validators do not allow the advertiser to close their campaign (exhaust the channel by paying the remainder to themselves)
@TODO channel spec: since we only check for supermajority now w/o rewarding, we can check `require(supermajority(validators, sigs))`; validator rewards can be added to the balances tree - the publisher-side (smart platform) would add themselves a reward and the advertiser might authorize it

events might be bundled into one sequence advancement
at each next seq, sum(balances) must be >= to sum(previous.balances)
at each next seq, every balances[x] must be >= to previous.balances[x]
sum(balances) must never > channel.totalDeposit

with an OCEAN-style validator structure:
at each state transition, the leading validator (validators[0] ?) proposes a new state, and other validators sign it 
adapting the current contracts is super easy; new states: Unknown, Active, TimedOut; functions: channelStart, channelWithdraw (does not change state/checkpoint, only changes withdrawn[channel] and withdrawnByAddr[channel][spender]), channelTimeout; the bid is removed, you pass channel at the beginning;

@TODO channel spec: describe timeouts, and how they're really last resort; if you expect the channel to be exhausted in 1m, the timeout should be 3x that (3m)

@TODO channel spec: decide whether the contract would still have deposit/withdraw entry points or just add those to channelStart and channelWithdraw

@TODO one more interesting spec thing to think about: pre-paying for impressions: the leader would sign a state update that PAYS first, and the impression will be shown after

@TODO should we have some sort of link between msgs in the channel - do we gain anything from it? e.g. hashing the previous state root as well

@TODO describe at what point (how many unreported events) the smart platform (publisher/supply) would decide to untrust the channel; or at which point an individual publisher might stop trusting it (e.g. invalid balances tree)
@TODO a nice privacy preserving property would be that the platform wouldn't reveal which wallet (in terms of revenue in the balances part of the state tree) belongs to which publisher; that way you can't see where the money from an advertising campaign is flowing, even if everyone withdrawls

@TODO: consider libp2p for communicating between payment channel participants
@TODO Mention the off chain complexity cost, in reaching consensus especially when one party missed an event
@TODO There should be a special msg in the state channel that should be send to the consensus leader: `need_missed_events` or something like that - where the follower(s) say that they won’t continue signing unless those events are included or at least some part of them; that would be determined by `missed_event_treshold`

@TODO sidenote, the smart contract itself will be suspiciously simple so it has to be well documented

@TODO blog post about benefits, use cases of the unidirectional payment channel model with multiple validaotrs; perhaps it can even be used in a DEX
@TODO questions that arise
"But what if someone goes offline?"
"but what if someone uses older state?"
"what if the parties mutually agree to close the channel early?" - explain how, on mutual agreement, the paying party can withdraw their funds out; the timeout only exists for extreme byzantine cases
"are 2 validators enough" - if the validators have opposing interests, yes; in this case, the model is exactly as in any payment channel - party A will send micropayments to party B, and if party A stops paying, party B can stop delivering their service and withdraw theire earnings without much loss (Use (1))
"what does leading validator imply?"


@TODO describe canceling a campaign (exhausting a channel) with a consensus, cancellation fee that goes to the publisher smart platform

@TODO btc version; this will be pretty easy to do on top of UTXO's and scripts; when opening a channel, two tx-es are created with the same inputs (advertiser funds), one being a spendable by multisig of validators, the other being a timelocked tx spendable by the advertiser (returns funds to advertiser); to advance the channel, the validators sign new TX-es which contain the msig TX output as an input, and many outputs (the balances tree); to invalidate old tx, we can use a similar scheme as the LN; since this is so similar to the LN, can it be built on top, and can it be compatible?
@TODO can the LN play in here? 

@TODO describe the possibility to reward users with tokens (via the balances tree); However the economic incentives work against us as they incentivize users to forge; although if the users masquerade as publishers, it should be the same thing; Anyway, memory-bound PoW and ip limits should be considered; and/or using the ip in the sig

@TODO describe importance of validators staying available

@TODO describe the bidding system: between the smart platform and the publisher/user; maybe send bid{matchToCpmRatio, minCpm}; then we calculate match rating (floating point, 0 to 1, depending on targeting) and the bid price is `max(matchToCpmRatio*match, minCpm)`; as for the match ratio, that can actually be defined as; every ad gets a match rating `sum(targetingTags.filter(tag in userTags).map(x => x.weight))`, and then all match ratings will be scaled between 0 and 1, where 1 represents the highest match rating
