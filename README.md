# AdEx Protocol

## Intro

AdEx originated in 2017 as a decentralized ad exchange for digital advertising, and subsequently evolved into a full protocol for decentralized digital advertising.

The AdEx protocol facilitates trading of advertising space/time, as well as the subsequent verification and proof that it actually occurred. Essentially, it covers all interactions between publishers, advertisers and end users. The protocol combines traditional peer-to-peer technology, cryptography and blockchain.

The rationale for creating the AdEx protocol was to create an open-source, transparent and fraud proof replacement to the entire existing ad tech stack. By introducing real-time tracking and reporting directly accessible to each advertiser and publisher, and dropping the need for most intermediaries, we dramatically reduce the ability for any side to report wrong data to others for their own financial gain. For more information on our rationale, see the [business case whitepaper](https://www.adex.network/adex/AdEx-Whitepaper-v.8.pdf).

The AdEx team also develops an open source dApp built on top of the Ethereum implementation of the protocol, available at https://beta.adex.network ([GitHub Repository](https://github.com/AdExNetwork/adex-dapp))

The AdEx protocol is designed to be completely invisible to end users, while improving their internet browsing experience (generally encouraging quality ads and unobtrusive experience).

This document assumes basic familiarity with computer science, blockchain and adtech.

### Benefits

* Transparent reporting for all sides
* Minimized trust
* Minimized fees
* Users [in control](#the-adex-lounge) of [their data](#sdk)
* Blockchain agnostic
* Token/currency agnostic
* Browser/runtime agnostic


### Terminology


#### Supply side

Throughout these docs, "supply side", "publisher" or "publishers" all refer to entities who sell ad inventory.

#### Demand side

Throughout these docs "demand side", "advertiser", "advertisers" or "buyers" all refer to entities who buy ad inventory.

#### Users

When we refer to "users", we mean end-users: not of AdEx itself, but of the publishers. In other words, the users who see the ads, but might not even be aware of AdEx's existence.

#### Events

Events, in the context of the SDK or the off-chain event aggregation, mean anything that a user does in regard to a digital ad - for example, click, impression, closing of the web page, etc. Events are usually broadcast as signed messages.

#### Custom events

Custom events usually refer to events that are publisher-defined. For example, if you're a publisher with an e-commerce website, you might choose to send an event for product purchases.

#### Campaigns

Ad campaigns are traditionally defined as "coordinated series of linked advertisements with a single idea or theme". In AdEx, they further represent a intent to spend a certain budget towards spreading those advertisements: essentially, a big piece of demand.

Campaigns are created with a total budget (e.g. 5000 DAI) and a specification of the desired result: e.g. purchase as many impressions as possible for this ad, with a maximum allowed price per impression and targeting information.

The cryptocurrencies that can be used for a campaign depend on what [Core](#core) is used and what it supports: e.g. the Ethereum implementation supports all ERC20 tokens.

In the AdEx protocol, one campaign always maps to one payment channel called **OUTPACE**.

#### Layer 2

Layer 2 refers to blockchain scaling solutions which allow financial transactions or other state transitions to happen very fast, off the blockchain, while still being enforceable or eventually being committed to the underlying blockchain.

Ideally, layer 2 solutions allow throughput levels seen in centralized system, while still being as trust-less and censorship resistant as blockchains.

In AdEx, we use two scaling primitives that we defined: **OCEAN** and **OUTPACE**.

#### Off-chain event aggregation (OCEAN)

**OCEAN** stands for **O**ff-**c**hain **e**vent **a**ggregatio**n**. 

An OCEAN channel is defined on-chain with a validator set, timeout and a definition of what we're looking to get achieved off-chain. Then, the validators observe off-chain events, and the leading validator (`validators[0]`) would propose new states, and the rest of the validators may check and sign those new states.

If a state is signed by a supermajority (>=2/3) of validators, it can be used to enforce a result on-chain.

#### Ocean-based unidirectional trust-less payment channel (OUTPACE)

**OUTPACE** stands for **O**cean-based **u**nidirectional **t**rustless **pa**yment **c**hann**e**l

This is a concept that builds on **OCEAN**, where each channel also has a deposit and a `validUntil` date, and each state represents a tree of balances.

The state transition function enforces a few simple rules for each next state: (1) the sum of all balances in the state can only increase, (2) each individual balance can only increase and (3) the total sum of the balances can never exceed the channel deposit.

Because of these constraints, an OUTPACE channel does not need sequences or challenge periods.

The initially delegated validators sign every new state, and a state signed by a supermajority (>=2/3) of validators is considered valid.

One advertising campaign is mapped to a single OUTPACE channel, where the deposit is the entire campaign budget, and the validators are normally the advertiser and a publisher-side [platforms](#validator-stack-platform). That allows the advertiser to make micropayments to multiple publishers (one micropayment per impression), and the publishers are able to withdraw their earnings at any point.

The possible states of an OUTPACE channel are:

* Unknown: the channel does not exist yet
* Active: the channel exists, has a deposit, and it's within the valid period
* Expired: the channel exists, but it's no longer valid
* Exhausted: this is a meta-state that's not reflected on-chain; it means Active, but all funds in the channel are spent

For a full explanation, see [OUTPACE](/OUTPACE.md).

#### Validators

In the context of AdEx, this could mean two things:

1) **OCEAN**/**OUTPACE** validators, responsible for tracking ad impressions/clicks and signing the state. The validator set (can also be called a committee) is defined by the OUTPACE channel
2) the proof-of-stake validators in a Cosmos/Polkadot implementation of AdEx

Throughout the protocol docs, "validators", "AdEx validators" and "OUTPACE validators" would mean the former. To refer to the latter, we would use the term "PoS validators".

Each validator must have a keypair and a publicly accessible HTTPS endpoint for receiving events from the SDK.

#### Observers

The observers are delegated to collect events in relation to a certain campaign. All validators of a campaign (OUTPACE channel) are, by definition, observers of all events related to it.

However, in practice, it's possible to have additional observers who are not validators - for example, a publisher's node might observe all events related to the ad units of the publisher, without necessarily being validators.

Each observer must have a publicly accessible HTTPS endpoint for receiving events from the SDK.

#### Platform

Platform refers to the entire [validator stack](#validator-stack-platform), which is a set of software components that all validators/observers need to run.

To prevent confusion with the normal terms "supply-side platform" (SSP) and "demand-side platform" (DSP), we will use "publisher-side platform" and "advertiser-side platform".



## Flow

The entire flow is:

1. The advertiser (demand) starts a [campaign](#campaign) with a total budget and certain parameters (ad units, targeting, min/max price per impression/click/etc.); this translates to opening an [OUTPACE channel](#outpace); at this point the advertiser delegates two validators: one that represents them (advertiser-side [platform](#validator-stack-platform)), and one that represents publishers (publisher-side [platform](#validator-stack-platform))
2. Publishers will query the network for available demand every time someone opens their website/app; the query will happen on the client side (in the browser/app), much like regular header bidding; the [AdEx SDK](#sdk) will select one of those bids and relay that selection to the validators
3. The user will generate events (impressions, clicks, page closed, etc.) and send them to the validators
4. The events will be reflected by the validators, creating a new state; each valid impression event is turned into a micropayment to a publisher; publishers will be immediately able to use that state to withdraw their earnings
5. Should the publisher decide to withdraw their earnings, they can withdraw from any number of channels at once
6. As long as the state keeps advancing, publishers have a constant guarantee of their revenue; should the state stop advancing, publishers can immediately stop serving ads

The benefits of this approach are:

* The only on-chain transactions are a deposit operation (which creates a campaign and a channel, `channelOpen`) and a withdraw (allowing any party to withdraw earnings, `channelWithdraw`)
* Publishers have a constant guarantee that they can withdraw their latest earnings on-chain
* Since **OUTPACE** is one-to-many, a campaign can be executed by multiple publishers
* If new states are no longer created (someone is no longer offline or is malicious), publishers can immediately stop delivering ads for this campaign (channel)
* Allows off-chain negotiations: advertisers can bid for impressions in real time
* All data, other than payments, is kept off-chain

Each campaign has a duration, normally in the range of 2-12 weeks. An OUTPACE channel should have 2-3 times as long of a duration, in order to allow extra time for publishers to withdraw their revenue.

### Closing a campaign

If an advertiser wants to close a campaign, they sign a new state, which distributes the remaining deposit: most of it goes to the advertiser's wallet, and a small part goes to the publisher platform as a cancellation fee.

The publisher-side platform recognizes this as an intention to close the campaign, and signs the state as well, therefore allowing the advertiser to withdraw their unspent funds. With this, the channel is considered exhausted, and it no longer represents any demand.

While it is possible for a publisher-side platform to refuse to approve the state, they gain nothing from doing so: (1) the advertiser has decided to cancel the campaign, meaning they won't sign any new states with new payments to publishers anyway (2) after a channel is no longer valid, they still get their unspent deposit back and (3) the publisher-side platform gets compensated with a cancellation fee.

### Validator consensus

In a minimal setup, we have two validators defending opposite interests (advertiser-side platform, publisher-side platform).

This setup, by itself, does not imply any additional trust: each new state has to be approved by both the paying side and the receiving side (essentially, a 2 out of 2 setup). Essentially, the sender signs a new state, which pays more to the receiver, but we require both to sign off, otherwise the sender would be able to arbitrarily manipulate the balances. To understand more, you can read [Understanding payment channels](https://blog.chainside.net/understanding-payment-channels-4ab018be79d4) or [state channels](https://www.jeffcoleman.ca/state-channels/).

However, in OUTPACE, unlike in regular state/payment channels, we separate participants from signing parties (validators), and allow any arbitrary number of validators.

We do that because:

* Sometimes we need a third party to resolve conflicts created by natural discrepancies (e.g. an event was received by 1 out of 2 parties, and there's no tie breaker)
* Maintaining liveness is critical; in a 2 out of 2 setup, 1 party going down means that the channel stalls
* The publisher needs to trust the publisher-side platform, read on to [Trust implications](#trust-implications)

### Trust implications

For a state to be valid, it requires 2/3 or more validator signatures. In a setup with the minimum number of validators, 2, this can only mean 2 signatures.

As you many have noticed, we imply that multiple publishers delegate a single "publisher-side platform". This means that a consortium of publishers assume that a given publisher-side platform will act in their interest.

Generally, even without trusting the platform, the publishers will receive constant guarantees for their revenue.

However, if the publisher-side platform and the advertiser-side platform both become malicious, they can sign a new state, allowing them to withdraw the channel balance together.

This attack is only possible if >=2/3 (in this case, all 2 out of 2) validators become malicious, but it wouldn't be a problem in a regular payment channel setup where one of the signers is the actual participant.

There are a number of mitigations that we believe are sufficient:

1. The publisher-side platform should actually be operated by publishers
2. There could more than 2 validators (this also solves natural discrepancies and liveness issues)
3. Anyone can run publisher-side platforms, so we expect different publishers grouping together to create multiple platforms


### Liveness implications

It's absolutely essential that validators stay online, all of the time. If more than 1/3rd go offline, no new states can be produced (threshold for a valid state is >=2/3 signatures), meaning that the micropayments from the advertiser to the publishers are essentially stopped.

If this happens, the publishers can immediately stop delivering ads for the given campaign mapped to the stalled channel, therefore not losing anything. The [market component](#market) is responsible for monitoring the state of all channels, and keeping track of which ones are active and non-exhausted.

Should the validator(s) come online again, everything can resume as normal.

The possibility of validators going offline is mitigated by (1) the architecture of [the validator stack](#validator-stack-platform) - there's always a sentry node and (2) the ability of OUTPACE to work with any arbitrary number of validators.

## Components

### Core

The AdEx protocol builds on top of blockchain technology to facilitate the parts that need achieving consensus in a trust-less, decentralized manner. This part is commonly referred as the "AdEx Core".

The Core has to implement everything related to moving funds between advertisers and publishers. To be more precise, it provides an implementation of OUTPACE channels (unidirectional payment channel), and every advertiser's campaign maps to one OUTPACE channel with a certain deposit.

The channel is created with the following information:

* `deposit`: total monetary deposit; on Ethereum, this is denoted in `tokenAddr` and `tokenAmount`
* `validUntil`: the date until this channel is valid; this is also the period within the publishers can withdraw, so it should be longer than the actual specified campaign length (e.g. 3x longer)
* `validators`: an array of all the validators who're responsible for signing new state; one of them should represent the advertiser, and the other the publishers
* `spec`: describes all the campaign criteria: e.g. buy as many impressions as possible, with a maximum price they're willing to pay for impressions, and how long they want to achieve it for (campaign duration); this is stored as arbitrary bytes (32); in the dApp, we encode the criteria directly in there, but it can be used to reference a JSON descriptor stored on IPFS

The Ethereum implementation of this component is called [`adex-protocol-eth`](https://github.com/AdExNetwork/adex-protocol-eth). While the current running implementation of AdEx is the Ethereum one, we are also experimenting with [Cosmos](https://github.com/AdExNetwork/adex-protocol-cosmos) and [Polkadot](https://github.com/AdExNetwork/adex-protocol-substrate).

The on-chain interactions are:

* `channelOpen(channel)`: open an OUTPACE channel
* `channelWithdraw(state, signatures, merkleProof, amount)`: allows anyone who earned from this channel to withdraw their earnings by providing `(state, signatures)` and `merkleProof`
* `channelExpiredWithdraw(channel)`: allows the channel creator to withdraw the remaining deposit in a channel after it expired; not needed on blockchain platforms where we can define our own "end block" function, like Cosmos/Polkadot

For more information on how the payment channels work, see [OUTPACE](/OUTPACE.md).

### Market

The primary role of the market is to facilitate demand/supply discovery and trading. The marketplace keeps record of all campaigns that are currently valid, and allows publishers/advertisers to query that list in order to find what they need.

The market needs to track all on-chain OUTPACE channels and needs to constantly monitor their liveness (>=2/3 validators online and producing new states) and state.

Additional privacy can be achieved by having groups of publishers/advertisers run their own instances of the market - that way, campaigns will be visible only within their private group.

The market is currently implemented in the `adex-node` repository.


### Validator stack ("platform")

The validator stack is a collective term for all off-chain components responsible of handling events, managing OUTPACE channels and generating analytical reports.

Full list of functionalities and the respective components:

1. Collecting events from users; this includes filtering the events and ensuring their validity (`adex-sentry`)
2. Serve as a validator of the OUTPACE channels (`adex-outpace-validator-worker`)
3. Generating analytical reports (`adex-reports-worker`)
4. Providing RESTful APIs for access to reports, events and OUTPACE channel data (`adex-sentry`)


In a normal setup, each of the nominated validators for an OUTPACE channel would run a full validator stack setup.

#### campaignSpec

In the [Core](#core), each OUTPACE channel has it's own `spec`, which is an arbitrary blob of bytes designed to contain any additional information for this channel.

In the AdEx Protocol, we use that field for a specification of the advertising campaign.

The `campaignSpec` value is a 32-byte IPFS hash of a JSON file, using the SHA2-256 digest function.

If you're a dApp builder, it is recommended that you pin this file on your own IPFS nodes. However, this file will also be permenantly stored by the [Market](#market) when it's uploaded to it.

For the JSON file specification, see [`campaignSpec.md`](/campaignSpec.md).

#### Paying by impression (CPM) or by click (CPC)

It's possible to pay for advertising in any way by configuring the campaign goal - e.g. by impression, by click, or even my number of user registrations (CPA).

However, the default option is always impressions and we believe that this creates the best incentives. Paying by click implies more risk and unpredictability, since the publishers will be pushing impressions out without prior knowledge of how much a certain ad will convert.

Ultimately, the raw resource the publisher provides is impressions, and the conversion rate of the ad depends mostly on the advertiser.

#### Analytical reports

The validators of an OUTPACE channel are usually two instances of the platform: one represents the advertiser, and the other represents multiple publishers.

This means they receive all the data related to this OUTPACE channel, therefore allowing them to aggregate it into useful reports (via the `adex-reports-worker` component).

This architecture ensures that both parties get their analytics reports by aggregating the data directly from the users, which ensures reporting transparency.


### SDK

The primary implementation is [`adex-adview`](https://github.com/AdExNetwork/adex-adview), which is designed for the web.

The SDK is responsible for:

1. Creating a cryptographic identity (keypair) for the user, if they don't already have one, and persisting it in their browser
2. Pulling all possible demand (campaigns, bids) from the market (the `adex-market`)
3. Picking which ad to show depending on the user: this means running a quick blind auction, and picking an ad depending on a combination of price and targeting
4. Generating events (impressions, clicks), signing them with the keypair, and sending them to all validators and observers of the given ad
5. Learning more about the user, and storing this in their browser

Notice a common pattern here: **all sensitive information never leaves the user's browser**, and this is achieved by shifting the process of targeting (selecting ads) to the browser itself.

There's currently no native mobile implementations, but the adview can be easily wrapped into a `WebView` on iOS/Android, and it will work as expected, at a small performance cost.

#### Learning about the user

The SDK builds a profile of the user and learns about them through the publishers. Each publisher who integrates the SDK has the ability to "tell" the SDK what they know. The incentive for this is built-in: the publisher wants better targeted ads, which should yield higher revenue.

On each next impression, the SDK will aggregate all the data reported by all publishers, in a weighted way, and use that to match to an ad.

In other words, it won't be possible for a single publisher to poison the data.

#### Blacklisting ads

Users can blacklist ads, very similarly to how ads on Google/Facebook have a cross icon on the top right corner. Once you do, this will be saved locally so this ad will never be shown to you, but also reported to all publisher-side platforms the SDK is aware of.

While a publisher-side platform may choose to ignore such an event, it's mostly in the interest of publishers to keep track of the most blacklisted ads and possibly stop serving them altogether.

An additional improvement on the SDK would be to allow users to gossip blacklists directly between each other, therefore eliminating the ability of publisher-side platforms to act together and ignore blacklist events. This feature is not trivial, as it requires a reliable sybil resistance mechanism.


#### Security

The keypair is saved in `localStorage`. However it never holds any funds, it merely serves to identify users anonymously

In case `localStorage` is deleted, the user will receive a new keypair and the system will start learning about them again - which is actually intended behavior (e.g. using incognito mode in the browser).


### The AdEx Lounge

The AdEx Lounge (called "AdEx Profile" in the original whitepaper) is a user-facing part of AdEx that allows the user to see what data the SDK has collected about them and possibly modify it to their liking.

In practice, the Lounge is a web application that runs on the same domain as the adview and therefore reads from the same `localStorage`. That allows it to present to the user what the SDK has learned about them.

The user may choose to delete some of that data. It should be noted that this data was never uploaded anywhere anyway, and it only affects targeting.

With OUTPACE channels, it's possible for users to earn monetary rewards as well, so the Lounge may be used at some point to allow for users to withdraw their funds.

There's no public implementation of the lounge yet.




## Appendix

### Preventing fraud/Sybil attacks

One of the main challenges of the AdEx protocol is preventing fake impressions/clicks.

This is mitigated in a few ways:

1) Traditional adtech methods, such as IP whitelists/blacklists
2) The SDK has to send each event to each validator, and the platform(s) will keep an internal ledger of IPs events came from and impose a limit
3) Requiring a proof of work challenge to be solved in order to submit a click/impression message, therefore making it more expensive than the reward you'd get for the corresponding event
4) the SDK allows publishers to "vouch for" users of their website/app, for example if a user registers on your website and verifies a valid phone number; that allows users to gain reputation as "real" users, and therefore more conservative advertisers may define in their campaigns to only target users above a certain threshold
5) publishers integrating the SDK may opt to show a captcha to users, the first time the user's cryptographic identity is created; this essentially means the user will solve the captcha once for all sites that integrate AdEx; they will need to solve the captcha again if they clear `localStorage` or change their browser

It should be noted that such a system is, by definition, always gameable. AdEx tries to make it as hard as possible. We believe the transparent reporting/analytics aspect of the system, combined with the "custom events", which allow you to track end results (e.g. registrations, purchases, etc.), ensure that the incentives for fraud are significantly reduced.

### Scalability

Because impressions and clicks are tracked and rewarded off-chain, the only on-chain bottleneck of AdEx is depositing/withdrawing funds. We think the current capacity of the Ethereum network is enough for thousands of advertisers and publishers, assuming they withdraw once every 2-3 weeks.

We are also experimenting with implementations on top of Cosmos (https://github.com/AdExNetwork/adex-protocol-cosmos) and Polkadot (https://github.com/AdExNetwork/adex-protocol-substrate). With possibility of interoperable blockchains designed only to handle OUTPACE channels, the scalability of AdEx is more or less unlimited. 

### Autonomous regulation

Ultimately, AdEx is completely censorship resistant since anyone can run their own [Market](#market) and [Platform](#validator-stack-platform) and do whatever they want with them.

However, there's plenty of situations where you need control, for example, as a publisher, you may want your website to be free of deceptive ads (malvertising).

The AdEx components provide multiple ways for the system to self regulate:

* Publishers can whitelist or blacklist advertisers or ad units
* Advertisers can whitelist or blacklist publishers, topics (tags) or individual ad slots
* Users can blacklist ad units, advertisers and even topics (tags)

Further down the line, reputation systems could be developed to make it easier for participants to push low quality or deceptive ads out.

### Privacy of publishers/advertisers

There's nothing in AdEx requiring advertisers/publishers to identify with anything other than a cryptographic identity. Information that might reveal more (e.g. ad unit info, web addresses, creatives) is kept off-chain and and revealed to any parties only with explicit consent.

Furthermore, the full event history is distributed across validators/observers. Each validator will only collect the full event history for the channels they're validating.

In other words, sensitive and valuable data is kept private to the parties that have accumulated it.

Anyone in the network can query any validators for events, but only for the events that they're involved in. For example, if you're a publisher/advertiser/user, you can query all validators to get the events related to you.

Please note that the entire balances tree will be revealed to everyone at all times, (1) to allow earners (publishers) to observe it's validity and (2) it will be revealed on-chain anyway once everyone withdraws.

### Privacy of the end-user

Privacy of end users is protected by having all of the information that the system learns about them stored only their own browser by our SDK's `localStorage`. The SDK is designed in a way that it will learn about the user, but keep that information locally and never reveal it to anyone or anything. This is made possible by moving the process of selecting an ad to show to the user's browser, somewhat similar to header bidding. 

A further advantage to this approach is that the user may easily control what kinds of ads they see, without this being revealed to third parties.

While it is possible to derive a rough approximation of what the user preferences are using historical data (events) on which ads were selected for a particular user, this approach still reveals very little, because:

1) Users are only identified by an anonymous ID (pubkey) which is not linked to any identifiable data like name/email/IP
2) This approach requires a lot of data being collected by one party; while this is technically possible, the default is that validators only collect events they're interested in (related to campaigns they validate)


### Rewarding end-users for attention

Through OUTPACE channels, it's possible that users are rewarded for certain events, with mutual agreement between the validators.

However, this is currently left out (not implemented), mostly because it makes it might make it easier to perform Sybil attacks and earn from fake traffic.

We do intend to implement this in the Smart Platform once we analyze the implications and risks. It must be noted that this feature can be implemented very easily with **OUTPACE** and the Smart Platform.

Users would be able to see their earned rewards and withdraw them through the AdEx Lounge UI.


### Real-time bidding / Header Bidding

Real-time bidding (RTB) is something we intentionally left out of the protocol, primarily because it relies on some details about the user being propagated around the network to the exchange.

While from a scalability perspective, real-time bidding can be implemented using off-chain scaling solutions, the privacy trade-off is too big.

However, header bidding is very rapidly replacing RTB in the adtech industry. Header bidding is when all the bids are pulled in the browser, evaluated and then the preferred bids are sent to the ad exchange. In AdEx, there is no classic ad exchange, but what we do is even more convenient: we pull all information about demand (campaigns, bids) in the browser, and directly select the bid depending on what we know about the user, therefore implementing targeting without revealing the user's profile.

In other words, **in AdEx, advertisers can bid for an impression in real-time**, but we do not implement traditional real-time bidding.


### AdEx Liquidity Network

@TODO describe pools of ADX/DAI/ETH/etc. that may be used to convert funds on spot; think about Uniswap?

### Oracle-based advertising

@TODO oracle based advertising

### Harberger Ads

@TODO harberger ads
