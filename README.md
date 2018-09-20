# AdEx Protocol

## Intro

AdEx originated in 2017 as a decentralized ad exchange for digital advertising, and subsequently evolved into a full protocol for decentralized digital advertising.

The AdEx protocol facilitates trading of advertising space/time, as well as the subsequent verification and proof that it actually occured. Essentially, it covers all interactions between publishers, advertisers and end users. The protocol combines traditional peer-to-peer technology, cryptography and blockchain.

The rationale for creating the AdEx protocol was to create an open-source, transparent and fraud proof replacement to the entire existing adtech stack, therefore providing a better alternative to the existing situation in adtech. For more information on our rationale, see the [business case whitepaper](https://www.adex.network/adex/AdEx-Whitepaper-v.8.pdf).

The AdEx team also develops an open source dApp built on top of the Ethereum implementation of the protocol, available at https://beta.adex.network ([GitHub Repository](https://github.com/AdExNetwork/adex-dapp))

The AdEx protocol is designed to be completely invisible to end users, while improving their internet experience (generally encouraging quality ads).

However, the AdEx protocol is not designed to be a drop-in solution in the existing adtech stack: it's rather designed to replace it completely. In the future, we may develop shims and various ways of integrating some of our components into an existing stack.

## Terminology

### Events

Events, in the context of the SDK or the off-chain event aggregation, mean anything that a user does in regard to a digital ad - for example, click, impression, closing of the webpage, etc. Events are usually broadcasted as signed messages.

### Custom events

Custom events usually refer to events that are publisher-defined. For example, if you're a publisher with an e-commerce website, you might choose to send an event for product purchases.

### Goals

When we refer to "Goals", we mean impressions, clicks or any other thing you want achieved with your digital ad, for example a registration to your service.

### Bids

Advertising Bids are bids of certain amount of token for a certain number of ad goals: for example, "10 ADX for 1000 clicks", or "100 DAI for 10 registrations".

### Delivery period

The delivery period refers to the on-chain commitment between a publisher and an advertiser that the condition of the bid will be delivered.

### Off-chain event aggregation (OCEAN)

**O**ff-**c**hain **e**vent **a**ggregatio**n** (**OCEAN**) is our approach to scaling. Within AdEx, anything between the beginning and the end of a delivery period is tracked off-chain (e.g. clicks, impressions), and committed on-chain by the validators at the end.

### OCEAN channel

An OCEAN channel is an on-chain committment that off-chain events that meet certain conditions will transpire during a certain time period.

The delivery period (`DeliveryPeriod`) is a specific use of an OCEAN channel.

The result of an OCEAN channel can be used in on-chain logic. In the case of the delivery period, the reward will be sent to the publisher on success, or back to the advertiser on failure.

### Validators

In the context of AdEx, this could mean two things:

1) OCEAN validators, responsible for tracking ad impressions/clicks and submitting the proof on-chain
2) the proof-of-stake validators in a Cosmos/Polkadot implementation of AdEx

Throughout the protocol docs, "validators", "AdEx validators" and "OCEAN validators" would mean the former. To refer to the latter, we would use the term "PoS validators".


## Components

### Marketplace

The primary role of the marketplace is to facilitate bid discovery and trading. The marketplace keeps a database of all bids that are currently valid, and allows publishers/advertisers to query that list in order to find what they need.

The marketplace can aid the bid discovery process by implementing better ways to match bids with publishers.

Furthermore, it can help provide privacy if needed by allowing bids to be exchanged only within private grups of publishers/advertisers.

The marketplace is currently implemented in the `adex-node` repository.

#### Bid

A bid is a composite of the following properties:

* adexCore
* token
* tokenAmount
* oceanDescriptor - validators, goal, etc.

Bids are not meant to be interacted with directly by publishers/advertisers, rather they will be handled programatically. For example, if you're an advertiser, you'd set a campaign with a budget and targets, and the dApp would automatically portion this out to individual bids.

### Core

The AdEx protocol builds on top of blockchain technology to facilitate the parts that need achieving consensus in a trustless, decentralized manner. This part is commonly referred as the "AdEx Core".

* adex-core - responsible for the on-chain part: payments, validator voting on the success of delivery periods

#### DeliveryPeriod

A delivery period is an on-chain committment between an advertiser and a publisher that a certain `Bid` would be executed (delivered). Once a delivery period starts, the token amount from the bid is locked (escrowed) so that the advertiser can't spend it during the time. If the delivery period ends successfully (determined by the OCEAN validators), the token amount will be transferred to the publisher. Otherwise, it will be returned back to the advertiser.

Furthermore, OCEAN validators would be rewarded by the advertiser.

### OCEAN

* adex-node - responsible for tracking events for the purposes of validating delivery periods and providing reports

OCEAN validators and event producers (end users) need to communicate between themselves in a transport-agnostic way, so using libp2p is recommended.

The on-chain part of OCEAN is currently implemented in `adex-core`, and the off-chain part in `adex-node`.

### SDK

* adex-sdk - responsible for displaying ads, sending events, collecting and storing the user profile

The primary implementation is `adex-sdk`, which is designed for the web.

#### The AdEx Profile

The AdEx Profile is a user-facing part of the SDK that allows the user to see what data the SDK has collected about them and possibly modify it to their liking. Since this data is not uploaded anywhere, it's significant is limited to the ad selection process. So, an end user might want to modify this if they don't want to see ads of a certain type.


### Analytics


### Identity system


## Implementations

### Ethereum

### Cosmos/Polkadot

### Bitcoin


## Appendix

### Preventing fraud/Sybil attacks

One of the main challenges of the AdEx protocol is preventing faking impressions/clicks.

This is mitigated in a few ways:

1) Traditional adtech methods, such as IP whitelists/blacklists
2) Requiring a proof of work challenge to be solved in order to submit a click/impression message, therefore making it more expensive than the reward you'd get for the corresponding event
3) the SDK allows publishers to "vouch" for users of their website/app, for example if a user registers on your website and verifies a valid phone number; that allows users to gain reputation as "real" users, and therefore more conservative advertisers may define in their Bids that their goal is to only target users above a certain threshold
4) publishers integrating the SDK may opt to show a captcha to users, the first time the user's cryptographic identity is created; this essentially means the user will solve the captcha once for all sites that integrate AdEx; they will need to solve the captcha again if they clear localStorage or change their browser

### Scalability

Because impressions and clicks are tracked off-chain (see OCEAN), the real bottleneck in the AdEx protocol is the opening and settling of bids, since it is the only part that has to be done on-chain.

This architecture allows AdEx to scale sufficiently even on chains with lower throughput, as long as actors are willing to trade off granularity in their ad spacetime trading.

While it is technically possible to bid for a small number of impressions/clicks (e.g. 1 impression), it is not economically viable as the transaction fees to settle the bid would probably outweigh the reward.

### Targeting

### Privacy of publishers/advertisers



### Privacy of the end-user

Privacy of end users is protected by having all of the information that the system learns about them stored only their own browser by our SDK. The SDK is designed in a way that it will learn about the user, but keep that information locally and never reveal it to anyone or anything. This is made possible by moving the process of selecting an ad to show to the users' browser. 

A further advantage to this approach is that the user may easily control what kinds of ads they see, without this being revealed to third parties.

While it is possible to derive a rough approximation of what the user preferences are using historical data (events) on which ads were selected for a particular user, this approach still reveals very little, because:

1) Users are only identified by an anonymous ID (pubkey) which is not linked to any identifyable data like name/email/IP
2) This approach requires a lot of data being collected by one party; while this is technically possible, the default is that validators only collect events they're interested in (related to bids they validate)

### Rewarding end-users

Rewarding end users for their attention is a concept that we've intentionally left out, mostly because it highly incentivizes fake traffic/Sybil attacks.

However, we are planning on providing easy ways for publishers to reward users with various crypto assets for actions that they consider appropriate and difficult to fake. For example, if you, as an end user, actually engage with the website, register, prove your real identity and buy one of their products, you'd get a bonus that the publisher has set aside from their bid reward.

One of the ways to achieve that is by having a payment channel directly between the end user and the publisher. The publisher, having access to all the events (including the custom events) in the OCEAN channels they're involved in, can determine how much they reward every given end user.



### Adoption
