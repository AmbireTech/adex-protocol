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

1) OCEAN validators, responsible for tracking ad impressions/clicks and submitting the proof on-chain; the validator set (can also be called a committee) is defined by the OCEAN channel (Commitment)
2) the proof-of-stake validators in a Cosmos/Polkadot implementation of AdEx

Throughout the protocol docs, "validators", "AdEx validators" and "OCEAN validators" would mean the former. To refer to the latter, we would use the term "PoS validators".

#### Observers

The observers are delegated to collect events in relation to a certain campaign. All validators of a campaign (OUTPACE channel) are, by definition, observers of all events related to it.

However, in practice, it's possible to have additional observers who are not validators - for example, a publisher's node might observe all events related to the ad units of the publisher, without necessarily being validators.



## Components

### Marketplace

The primary role of the marketplace is to facilitate demand/supply discovery and trading. The marketplace keeps a database of all campaigns that are currently valid, and allows publishers/advertisers to query that list in order to find what they need.

It also allows privacy if needed by allowing campaigns to be exchanged only within private grups of publishers/advertisers.

The marketplace is currently implemented in the `adex-node` repository.

### Campaign

@TODO OUTPACE channel
@TODO describe what is a campaign, what does it's data descriptor look like, and how does it map to the OCEAN/OUTPACE channel

### Core

@TODO update

The AdEx protocol builds on top of blockchain technology to facilitate the parts that need achieving consensus in a trustless, decentralized manner. This part is commonly referred as the "AdEx Core".

The Core has to implement the `Commitment`, and everything related to moving funds between advertisers and publishers.

The Ethereum implementation of this component is called `adex-protocol-eth`.

#### Commitment

@TODO: update; merge stuff from components/

A delivery commitment is an on-chain committment between an advertiser and a publisher that a certain `Bid` would be executed (delivered). Once a delivery commitment starts, the reward for the bid is locked (escrowed) so that the advertiser can't spend it during the time. If the delivery commitment resolves successfully (determined by the OCEAN validators), the reward will be transferred to the publisher. Otherwise, it will be returned back to the advertiser.

Furthermore, OCEAN validators would be rewarded by the advertiser.

The `Commitment` is an implementation of OCEAN channel that also contains information about the original `Bid`. The channel is used to track all the events related to this bid and determine the outcome.

A commitment has a `validUntil` date, determined by the `bid` timeout and the time it was created (`now + bid.timeout`). Before this date, validators can submit their signed votes - if there is a supermajority, that vote will be acted upon (reward transferred to the publisher or back to the advertiser). Once we are past the `validUntil` date, we revert the commitment, returning the funds back to the advertiser.


### SDK

The primary implementation is `adex-sdk`, which is designed for the web.

The SDK is responsible for displaying ads, sending events to the `adex-node` (OCEAN channel), and collecting and storing the user profile.

@TODO

#### The AdEx Lounge

The AdEx Lounge (previously called Profile) is a user-facing part of the SDK that allows the user to see what data the SDK has collected about them and possibly modify it to their liking. Since this data is not uploaded anywhere, it's significant is limited to the ad selection process. So, an end user might want to modify this if they don't want to see ads of a certain type.


### Analytics

Analytics are provided by the validators, programatically. The validators are usually the publisher, advertiser and an impartial validator on the network. The user data is anonymous anyway, but having this design where the data only propagates to the validators further improves privacy.

The validators are currently not rewarded financially for aggregating the entire dataset and providing analytics reports, but since they're often the advertiser/publisher themselves, they have an obvious incentive to do so.

Furthermore, this ensures that both parties get their analytics reports from aggregating the data directly from the users, which ensures reporting transparency.


## Appendix

### Preventing fraud/Sybil attacks

One of the main challenges of the AdEx protocol is preventing faking impressions/clicks.

This is mitigated in a few ways:

1) Traditional adtech methods, such as IP whitelists/blacklists
2) Requiring a proof of work challenge to be solved in order to submit a click/impression message, therefore making it more expensive than the reward you'd get for the corresponding event
3) the SDK allows publishers to "vouch" for users of their website/app, for example if a user registers on your website and verifies a valid phone number; that allows users to gain reputation as "real" users, and therefore more conservative advertisers may define in their Bids that their goal is to only target users above a certain threshold
4) publishers integrating the SDK may opt to show a captcha to users, the first time the user's cryptographic identity is created; this essentially means the user will solve the captcha once for all sites that integrate AdEx; they will need to solve the captcha again if they clear localStorage or change their browser

### Scalability

@TODO; not a bottleneck anymore

Because impressions and clicks are tracked off-chain (see OCEAN), the real bottleneck in the AdEx protocol is the opening and settling of bids, since it is the only part that has to be done on-chain.

This architecture allows AdEx to scale sufficiently even on chains with lower throughput, as long as actors are willing to trade off granularity in their ad spacetime trading.

While it is technically possible to bid for a small number of impressions/clicks (e.g. 1 impression), it is not economically viable as the transaction fees to settle the bid would probably outweigh the reward.

### Targeting

@TODO

### Privacy of publishers/advertisers

There's nothing in AdEx requiring advertisers/publishers to identify with anything other than a cryptographic identity, so one entity may use as many identities as they want to help preserve their privacy.


### Privacy of the end-user

Privacy of end users is protected by having all of the information that the system learns about them stored only their own browser by our SDK. The SDK is designed in a way that it will learn about the user, but keep that information locally and never reveal it to anyone or anything. This is made possible by moving the process of selecting an ad to show to the user's browser. 

A further advantage to this approach is that the user may easily control what kinds of ads they see, without this being revealed to third parties.

While it is possible to derive a rough approximation of what the user preferences are using historical data (events) on which ads were selected for a particular user, this approach still reveals very little, because:

1) Users are only identified by an anonymous ID (pubkey) which is not linked to any identifyable data like name/email/IP
2) This approach requires a lot of data being collected by one party; while this is technically possible, the default is that validators only collect events they're interested in (related to campaigns they validate)

### Rewarding end-users

@TODO

Rewarding end users for their attention is a concept that we've intentionally left out, mostly because it highly incentivizes fake traffic/Sybil attacks.

However, we are planning on providing easy ways for publishers to reward users with various crypto assets for actions that they consider appropriate and difficult to fake. For example, if you, as an end user, actually engage with the website, register, prove your real identity and buy one of their products, you'd get a bonus that the publisher has set aside from their bid reward.

One of the ways to achieve that is by having a payment channel directly between the end user and the publisher. The publisher, having access to all the events (including the custom events) in the OCEAN channels they're involved in, can determine how much they reward every given end user.


### Real-time bidding

@TODO

Real-time bidding is something we intentionally left out of the protocol, primarily because it relies on some details about the user being propagated around the network to the exchange.

While from a scalability perspective, real-time bidding can be implemented using off-chain scaling solutions such as OCEAN and state channels, the privacy tradeoff is too big.

However, multiple bids may be delivered at the same time in the same ad slot, with the targeting decision happening in the user's browser (see ["Privacy of the end-user"](#privacy-of-the-end-user)), so the benefits of targeting are still there. This is somewhat similar to the ad tech concept of Header Bidding, which is a technique that shift bid processing/selection to the browser.

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
