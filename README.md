# AdEx Protocol


## Intro

AdEx originated in 2017 as a decentralized ad exchange for digital advertising, and subsequently evolved into a full protocol for decentralized digital advertising.

The AdEx protocol facilitates trading of advertising space/time, as well as the subsequent verification and proof that it actually occured. Essentially, it covers all interactions between publishers, advertisers and end users.

The rationale for creating the AdEx protocol was to create an open-source, transparent and fraud proof replacement to the entire existing adtech stack, therefore providing a better alternative to the existing situation in adtech. For more information on our rationale, see the [business case whitepaper](https://www.adex.network/adex/AdEx-Whitepaper-v.8.pdf).

The AdEx team also develops an open source dApp built on top of the Ethereum implementation of our protocol, available at https://beta.adex.network ([GitHub Repository](https://github.com/AdExNetwork/adex-dapp))

The AdEx protocol is designed to be completely invisible to end users, while improving their internet experience (generally encouraging quality ads).

However, the AdEx protocol is not designed to be a drop-in solution in the existing adtech stack: it's rather designed to replace it completely. In the future, we may develop shims and various ways of integrating some of our components into an existing stack.

## Terminology

### Goals

When we refer to "Goals", we mean impressions, clicks or any other thing you want achieved with your digital ad, for example a registration to your service.

### Bids

Advertising Bids are bids of certain amount of token for a certain number of ad goals: for example, "10 ADX for 1000 clicks", or "100 DAI for 10 registrations".

### Delivery period

The delivery period refers to the on-chain commitment between a publisher and an advertiser that the condition of the bid will be delivered.

### Off-chain event aggregation

Off-Chain Event AggregatioN (OCEAN) is our approach to scaling. Within AdEx, anything between the beginning and the end of a delivery period is tracked off-chain (e.g. clicks, impressions), and committed on-chain by the validators at the end.

### Validators

In the context of AdEx, this could mean two things:

1) entities running the adex-node, responsible for tracking ad impressions/clicks and submitting the proof on-chain
2) the proof-of-stake validators in a Cosmos/Polkadot implementation of AdEx

Throughout the protocol docs, "validators" or "AdEx validators" would mean (1). To refer to (2), we would use the term "PoS validators".

## Components

The AdEx protocol builds on top of blockchain technology to facilitate the parts that need achieving consensus in a trustless, decentralized manner. This part is commonly referred as the "on-chain part" or "adex-core".

Other than that, the AdEx protocol consists of a few open-source modules.

This is the full list of components:

* adex-core - responsible for the on-chain part: payments, validator voting
* adex-node - responsible for tracking events for the purposes of validating bids and providing reports
* adex-sdk - responsible for displaying ads @TODO
