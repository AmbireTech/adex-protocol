# AdEx Protocol

## Intro

AdEx originated in 2017 as a decentralized ad exchange for digital advertising, and subsequently evolved into a full protocol for decentralized digital advertising.

The AdEx protocol facilitates trading of advertising space/time, as well as the subsequent verification and proof that it actually occured. Essentially, it covers all interactions between publishers, advertisers and end users. The protocol combines traditional peer-to-peer technology, cryptography and blockchain.

The rationale for creating the AdEx protocol was to create an open-source, transparent and fraud proof replacement to the entire existing adtech stack. By introducing real-time tracking and reporting directly accessible to each advertiser and publisher, and dropping the need for most intermediaries, we dramatically reduce the ability for any side to report wrong data to others for their own financial gain. For more information on our rationale, see the [business case whitepaper](https://www.adex.network/adex/AdEx-Whitepaper-v.8.pdf).

The AdEx team also develops an open source dApp built on top of the Ethereum implementation of the protocol, available at https://beta.adex.network ([GitHub Repository](https://github.com/AdExNetwork/adex-dapp))

The AdEx protocol is designed to be completely invisible to end users, while improving their internet browsing experience (generally encouraging quality ads and unobtrusive experience).

### Terminology

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

One advertising campaign is mapped to a single OUTPACE channel, where the deposit is the entire campaign budget, and the validators are normally the advertiser and an SSP. That allows the advertiser to make micropayments to multiple publishers (one micropayment per impression), and the publishers are able to withdraw their earnings at any point.

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
* `campaignSpec`: describes what the advertiser wants to achieve from the campaign: e.g. buy as many impressions as possible, with a maximum price they're willing to pay for impressions, and how long they want to achieve it for (campaign length)
* `validUntil`: the date until this channel is valid; this is also the period within the publishers can withdraw, so it should be longer than the actual specified campaign length (e.g. 3x longer)

The Ethereum implementation of this component is called `adex-protocol-eth`.

@TODO better word for `campaignSpec` ?
@TODO describe on chain methods

### Smart Platform

@TODO describe off chain interactions, OUTPACE channels, including campaign specs, cancelling campaigns, what the campaign duration means, what the channel timeout means

### SDK

@TODO

The primary implementation is `adex-sdk`, which is designed for the web.

The SDK is responsible for displaying ads, sending events to the `adex-node` (OCEAN channel), and collecting and storing the user profile.


#### The AdEx Lounge

@TODO

The AdEx Lounge (previously called Profile) is a user-facing part of the SDK that allows the user to see what data the SDK has collected about them and possibly modify it to their liking. Since this data is not uploaded anywhere, it's significant is limited to the ad selection process. So, an end user might want to modify this if they don't want to see ads of a certain type.


### Analytics

Analytics are provided by the validators, programatically. The validators are usually the advertiser and a platform represending the publishers (SSP). The user data is anonymous anyway, but having this design where the data only propagates to the validators further improves privacy, even between publishers/advertisers themselves.

The validators are currently not incentivized financially for aggregating the entire dataset and providing analytics reports, but since they're often the advertiser/publisher themselves, they have an obvious incentive to do so.

Furthermore, this ensures that both parties get their analytics reports from aggregating the data directly from the users, which ensures reporting transparency.


## Appendix

### Preventing fraud/Sybil attacks

One of the main challenges of the AdEx protocol is preventing fake impressions/clicks.

This is mitigated in a few ways:

1) Traditional adtech methods, such as IP whitelists/blacklists
2) Requiring a proof of work challenge to be solved in order to submit a click/impression message, therefore making it more expensive than the reward you'd get for the corresponding event
3) the SDK allows publishers to "vouch" for users of their website/app, for example if a user registers on your website and verifies a valid phone number; that allows users to gain reputation as "real" users, and therefore more conservative advertisers may define in their Bids that their goal is to only target users above a certain threshold
4) publishers integrating the SDK may opt to show a captcha to users, the first time the user's cryptographic identity is created; this essentially means the user will solve the captcha once for all sites that integrate AdEx; they will need to solve the captcha again if they clear localStorage or change their browser

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

### Real-time bidding

Real-time bidding (RTB) is something we intentionally left out of the protocol, primarily because it relies on some details about the user being propagated around the network to the exchange.

While from a scalability perspective, real-time bidding can be implemented using off-chain scaling solutions such as OCEAN, the privacy tradeoff is too big.

However, header bidding is very rapidly replacing RTB in the adtech industry. Header bidding is when all the bids are pulled in the browser, evaluated and then the preferred bids are sent to the ad exchange. In AdEx, there is no classic ad exchange, but what we do is even more convenient: we pull all information about demand (campaigns, bids) in the browser, and directly select the bid depending on what we know about the user, therefore implementing targeting without revealing the user's profile.

In other words, in AdEx, advertisers can bid for an impression in real-time, but we do not implement classic real-time bidding.

### Header bidding

@TOOD header bidding. is real time

### Smart Platform, state channels

@TODO

The AdEx Smart Platform an alternative to OCEAN+bid provisioning where the demand side (e.g. the advertiser) would create a full campaign with a certain budget and maximum price per click/impression/other goal, and this would get mapped a state channel with a delegated node from the network that represents the publishers, called "the smart platform node".

Then, using that state channel, the campaign would be executed by various different publishers, all competing for the best price per goal they can offer. Despite the fact the state channel is only between two parties (advertiser and the smart platform), the state represented by the channel will contain a tree of the publisher's earnings, and they can withdraw as soon as someone checkpoints the channel on-chain. The channel is similar to a uni-directional payment channel, as with each next message (sequence), the advertiser balance would decrease and the total earnings by the publishers would increase.

Once the entire campaign budget is exhausted, the channel can be settled or renewed by depositing more.

Despite the interactions being only between two parties, the model is trustless - if the demand would not recognize events and accept the new state, the supply (publishers) can immediately stop serving impressions and exit by settling the channel.

This would eliminate the need for bid provisioning and make it easier to maximize revenue, but it is more complicated to execute.

In this case, publishers may withdraw their earnings at any time, by checkpointing all channels (representing advertiser campaigns) they earned from.

See [smart-platform.md](/components/smart-platform.md) for details on how this may be realized.
