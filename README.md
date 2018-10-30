# AdEx Protocol

## Intro

AdEx originated in 2017 as a decentralized ad exchange for digital advertising, and subsequently evolved into a full protocol for decentralized digital advertising.

The AdEx protocol facilitates trading of advertising space/time, as well as the subsequent verification and proof that it actually occured. Essentially, it covers all interactions between publishers, advertisers and end users. The protocol combines traditional peer-to-peer technology, cryptography and blockchain.

The rationale for creating the AdEx protocol was to create an open-source, transparent and fraud proof replacement to the entire existing adtech stack. By introducing real-time tracking and reporting directly accessible to each advertiser and publisher, and dropping the need for most intermediaries, we dramatically reduce the ability for any side to report wrong data to others for their own financial gain. For more information on our rationale, see the [business case whitepaper](https://www.adex.network/adex/AdEx-Whitepaper-v.8.pdf).

The AdEx team also develops an open source dApp built on top of the Ethereum implementation of the protocol, available at https://beta.adex.network ([GitHub Repository](https://github.com/AdExNetwork/adex-dapp))

The AdEx protocol is designed to be completely invisible to end users, while improving their internet browsing experience (generally encouraging quality ads and unobtrusive experience).

### Terminology


#### Supply side

Throughout these docs, "supply side", "publisher" or "publishers" all refer to entities who sell ad inventory.

#### Demand side

Throughout these docs "demand side", "advertiser", "advertisers" or "buyers" all refer to entities who buy ad inventory.

#### Users

When we refer to "users", we mean end-users: not of AdEx itself, but of the publishers. In other words, the users who see the ads, but might not even be aware of AdEx's existance.

#### Events

Events, in the context of the SDK or the off-chain event aggregation, mean anything that a user does in regard to a digital ad - for example, click, impression, closing of the webpage, etc. Events are usually broadcasted as signed messages.

#### Custom events

Custom events usually refer to events that are publisher-defined. For example, if you're a publisher with an e-commerce website, you might choose to send an event for product purchases.

#### Campaigns

Ad campaigns are traditionally defined as "coordinated series of linked advertisements with a single idea or theme". In AdEx, they further represent a intent to spend a certain budget towards spreading those advertisements.

Campaigns are created with a total budget (e.g. 5000 DAI) and a specification of the desired result: e.g. purchase as many impressions as possible for this ad, with a maximum allowed price per impression and targeting information.

In the AdEx protocol, one campaign always maps to one payment channel called OUTPACE.

#### Layer 2

Layer 2 refers to blockchain scaling solutions which allow financial transactions or other state transitions to happen very fast, off the blockchain, while still being enforcable or eventually being committed to the underlying blockchain.

Ideally, layer 2 solutions allow throughput levels seen in centralized system, while still being as trustless and censorship resistant as blockchains.

In AdEx, we use two in-house scaling primitives: OCEAN and OUTPACE.

#### Off-chain event aggregation (OCEAN)

**OCEAN** stands for **O**ff-**c**hain **e**vent **a**ggregatio**n**. 

An OCEAN channel is defined on-chain with a valiator set, timeout and a definition of what we're looking to get achieved off-chain. Then, the validators observe off-chain events, and the leading validator (`validators[0]`) would propose new states, and the rest of the validators may check and sign those new states.

If a state is signed by a supermajority (>=2/3) of validators, it can be used to enforce a result on-chain.

#### Ocean-based unidirectional trustless payment channel (OUTPACE)

**OUTPACE** stands for **O**cean-based **u**nidirectional **t**rustless **pa**yment **c**hann**e**l

This is a concept that builds on **OCEAN**, where each channel also has a deposit and each state represents a tree of balances.

The state transition function enforces a few simple rules for each next state: (1) the sum of all balances in the state can only increase, (2) each individual balance can only increase and (3) the total sum of the balances can never exceed the channel deposit.

Because of these constraints, an OUTPACE channel does not need sequences or challenge periods.

The initially delegated validators sign every new state, and a state signed by a supermajority (>2/3) of validators is considered valid.

One advertising campaign is mapped to a single OUTPACE channel, where the deposit is the entire campaign budget, and the validators are normally the advertiser and a publisher-side smart platform. That allows the advertiser to make micropayments to multiple publishers (one micropayment per impression), and the publishers are able to withdraw their earnings at any point.

For a full explanation, see [OUTPACE.md](/OUTPACE.md).

#### Validators

In the context of AdEx, this could mean two things:

1) OCEAN/OUTPACE validators, responsible for tracking ad impressions/clicks and signing the state. The validator set (can also be called a committee) is defined by the OUTPACE channel
2) the proof-of-stake validators in a Cosmos/Polkadot implementation of AdEx

Throughout the protocol docs, "validators", "AdEx validators" and "OUTPACE validators" would mean the former. To refer to the latter, we would use the term "PoS validators".

#### Observers

The observers are delegated to collect events in relation to a certain campaign. All validators of a campaign (OUTPACE channel) are, by definition, observers of all events related to it.

However, in practice, it's possible to have additional observers who are not validators - for example, a publisher's node might observe all events related to the ad units of the publisher, without necessarily being validators.



## Components

### Marketplace

The primary role of the marketplace is to facilitate demand/supply discovery and trading. The marketplace keeps a database of all campaigns that are currently valid, and allows publishers/advertisers to query that list in order to find what they need.

It also allows privacy if needed by allowing campaigns to be exchanged only within private grups of publishers/advertisers.

The marketplace is currently implemented in the `adex-node` repository.

### Core

The AdEx protocol builds on top of blockchain technology to facilitate the parts that need achieving consensus in a trustless, decentralized manner. This part is commonly referred as the "AdEx Core".

The Core has to implement everything related to moving funds between advertisers and publishers. To be more precise, it provides an implementation of OUTPACE channels (unidirectional payment channel), and every advertiser's campaign maps to one OUTPACE channel with a certain deposit.

The channel is created with the following information:

* `deposit`: total monetary deposit; on Ethereum, this is denoted in `tokenAddr` and `tokenAmount`
* `validUntil`: the date until this channel is valid; this is also the period within the publishers can withdraw, so it should be longer than the actual specified campaign length (e.g. 3x longer)
* `spec`: describes all the campaign criteria: e.g. buy as many impressions as possible, with a maximum price they're willing to pay for impressions, and how long they want to achieve it for (campaign duration); this is stored as arbitrary bytes (32); in the dApp, we encode the criteria directly in there, but it can be used to reference a JSON descriptor stored on IPFS

The Ethereum implementation of this component is called [`adex-protocol-eth`](https://github.com/AdExNetwork/adex-protocol-eth).

The on-chain interactions are:

* `channelOpen(deposit, timeout, spec, validators)`: open an OUTPACE channel
* `channelWithdraw(state, signatures, merkleProof)`: allows anyone who earned from this channel to withdraw their earnings by providing `(state, signatures)` and `merkleProof`
* `channelWithdrawTimeout()`: allows the channel creator to withdraw the remaining deposit in a channel after a timeout; not needed on blockchain platforms where we can define our own "end block" function, like Cosmos/Polkadot

### Smart Platform

The smart platform is a server designed to handle most of the off-chain parts of the AdEx protocol:

1. Collect events coming from the users
2. Build analytics/reports on them
3. Serve as a validator of the OUTPACE channels
4. Participate in a bidding process for each impression

@TODO describe "publisher-side smart platform"
@TODO describe off chain interactions, OUTPACE channels, including campaign specs, cancelling campaigns, what the campaign duration means, what the channel timeout means
@TODO full spec in components/ ; and describe why two vlaidators are sufficient

#### Analytics

The validators of an OUTPACE channel are usually two instances of the smart platform software: one represents the advertiser, and the other represents multiple publishers.

This means they receive all the data related to this OUTPACE channel, therefore allowing them to aggregate it into useful reports.

This architecture ensures that both parties get their analytics reports by aggregating the data directly from the users, which ensures reporting transparency.


### SDK

The primary implementation is [`adex-adview`](https://github.com/AdExNetwork/adex-adview), which is designed for the web.

The SDK is responsible for:

1. Creating a cryptographic identity (keypair) for the user, if they don't already have one, and persisting it in their browser
2. Pulling all possible demand (campaigns, bids) from the network (namely, the smart platform)
3. Picking which ad to show depending on the user: this means running a quick blind auction, and picking an ad depending on a combination of price and targeting
4. Generating events (impressions, clicks), signing them with the keypair, and sending them to all validators and observers of the given ad
5. Learning more about the user, and storing this in their browser

Notice a common pattern here: **all sensitive information never leaves the user's browser**, and this is achieved by shifting the process of targeting (selecting ads) to the browser itself.

There's currently no native mobile implementations, but the adview can be easily wrapped into a `WebView` on iOS/Android, and it will work as expected, at a small performance cost.

#### Learning about the user

The SDK builds a profile of the user and learns about them through the publishers. Each publisher who integrates the SDK has the ability to "tell" the SDK what they know. The incentive for this is built-in: the publisher wants better targeted ads, which should yield higher revenue.

On each next impression, the SDK will aggregate all the data reported by all publishers, in a weighted way, and use that to match to an ad.

In other words, it won't be possible for a single publisher to poison the data.


### The AdEx Lounge

The AdEx Lounge (called "AdEx Profile" in the original whitepaper) is a user-facing part of AdEx that allows the user to see what data the SDK has collected about them and possibly modify it to their liking.

In practice, the Lounge is a web application that runs on the same domain as the adview and therefore reads from the same `localStorage`. That allows it to present to the user what the SDK has learnt about them.

The user may choose to delete some of that data. It should be noted that this data was never uploaded anywhere anyway, and it only affects targeting.

With OUTPACE channels, it's possible for users to earn monetary rewards as well, so the Lounge may be used at some point to allow for users to withdraw their funds.

There's no public implementation of the lounge yet.


## Appendix

### Preventing fraud/Sybil attacks

One of the main challenges of the AdEx protocol is preventing fake impressions/clicks.

This is mitigated in a few ways:

1) Traditional adtech methods, such as IP whitelists/blacklists
2) The SDK has to send each event to each validator, and the smart platform(s) will keep an internal ledger of IPs events came from and impose a limit
3) Requiring a proof of work challenge to be solved in order to submit a click/impression message, therefore making it more expensive than the reward you'd get for the corresponding event
4) the SDK allows publishers to "vouch for" users of their website/app, for example if a user registers on your website and verifies a valid phone number; that allows users to gain reputation as "real" users, and therefore more conservative advertisers may define in their Bids that their goal is to only target users above a certain threshold
5) publishers integrating the SDK may opt to show a captcha to users, the first time the user's cryptographic identity is created; this essentially means the user will solve the captcha once for all sites that integrate AdEx; they will need to solve the captcha again if they clear `localStorage` or change their browser

It should be noted that such a system is, by definition, always gameable. AdEx tries to make it as hard as possible. We believe the transparent reporting/analytics aspect of the system, combined with the "custom events", which allow you to track end results (e.g. registrations, purchases, etc.), ensure that the incentives for fraud are significantly reduced.

### Scalability

Because impressions and clicks are tracked and rewarded off-chain (see OCEAN/OUTPACE), the only on-chain bottleneck of AdEx is depositing/withdrawing funds. We think the current capacity of the Ethereum network is enough for thousands of advertisers and publishers, assuming they withdraw once every 2-3 weeks.

We are also experimenting with implementations on top of Cosmos (https://github.com/AdExNetwork/adex-protocol-cosmos) and Polkadot (https://github.com/AdExNetwork/adex-protocol-substrate). With possibility of interoperable blockchains designed only to handle OUTPACE channels, the scalability of AdEx is more or less unlimited. 

### Targeting

@TODO

### Privacy of publishers/advertisers

@TODO take this from components/smart-platform

There's nothing in AdEx requiring advertisers/publishers to identify with anything other than a cryptographic identity, so one entity may use as many identities as they want to help preserve their privacy.


### Privacy of the end-user

Privacy of end users is protected by having all of the information that the system learns about them stored only their own browser by our SDK's `localStorage`. The SDK is designed in a way that it will learn about the user, but keep that information locally and never reveal it to anyone or anything. This is made possible by moving the process of selecting an ad to show to the user's browser, somewhat similar to header bidding. 

A further advantage to this approach is that the user may easily control what kinds of ads they see, without this being revealed to third parties.

While it is possible to derive a rough approximation of what the user preferences are using historical data (events) on which ads were selected for a particular user, this approach still reveals very little, because:

1) Users are only identified by an anonymous ID (pubkey) which is not linked to any identifyable data like name/email/IP
2) This approach requires a lot of data being collected by one party; while this is technically possible, the default is that validators only collect events they're interested in (related to campaigns they validate)

### Rewarding end-users for attention

Through OUTPACE channels, it's possible that users are rewarded for certain events, with mutual agreement between the validators.

However, this is currently left out (not implemented), mostly because it makes it might make it easier to perform Sybil attacks and earn from fake traffic.

We do intend to implement this in the Smart Platform once we analyze the implications and risks. It must be noted that this feature can be implemented very easily with OUTPACE and the Smart Platform.

Users would be able to see their earned rewards and withdraw them through the AdEx Lounge UI.

### Real-time bidding / Header Bidding

Real-time bidding (RTB) is something we intentionally left out of the protocol, primarily because it relies on some details about the user being propagated around the network to the exchange.

While from a scalability perspective, real-time bidding can be implemented using off-chain scaling solutions such as OCEAN, the privacy tradeoff is too big.

However, header bidding is very rapidly replacing RTB in the adtech industry. Header bidding is when all the bids are pulled in the browser, evaluated and then the preferred bids are sent to the ad exchange. In AdEx, there is no classic ad exchange, but what we do is even more convenient: we pull all information about demand (campaigns, bids) in the browser, and directly select the bid depending on what we know about the user, therefore implementing targeting without revealing the user's profile.

In other words, in AdEx, advertisers can bid for an impression in real-time, but we do not implement classic real-time bidding.
