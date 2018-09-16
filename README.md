# AdEx Protocol


## Intro

AdEx originated in 2017 as a decentralized ad exchange for digital advertising, and subsequently evolved into a full protocol for decentralized digital advertising.

The AdEx protocol facilitates trading of advertising space/time, as well as the subsequent verification and proof that it actually occured. Essentially, it covers all interactions between publishers, advertisers and end users.

The rationale for creating the AdEx protocol was to create an open-source, transparent and fraud proof replacement to the entire existing adtech stack, therefore providing a better alternative to the existing situation in adtech. For more information on our rationale, see the [business case whitepaper](https://www.adex.network/adex/AdEx-Whitepaper-v.8.pdf).

The AdEx team also develops an open source dApp built on top of the Ethereum implementation of our protocol, available at https://beta.adex.network ([GitHub Repository](https://github.com/AdExNetwork/adex-dapp))

The AdEx protocol is designed to be completely invisible to end users, while improving their internet experience (generally encouraging quality ads).

However, the AdEx protocol is not designed to be a drop-in solution in the existing adtech stack: it's rather designed to replace it completely. In the future, we may develop shims and various ways of integrating some of our components into an existing stack.

## Terminology

Validators - in the context of AdEx, this could mean two things: (1) entities running the adex-node, responsible for tracking ad impressions/clicks and submitting the proof on-chain or (2) the proof-of-stake validators in a Cosmos/Polkadot implementation of AdEx

## Components

The AdEx protocol builds on top of blockchain technology to facilitate the parts that need achieving consensus in a trustless, decentralized manner. This part is commonly referred as the "on-chain part" or "adex-core".

Other than that, the AdEx protocol consists of a few open-source modules.

This is the full list of components:

* adex-core - responsible for the on-chain part: payments, validator voting
* adex-node - responsible for tracking events for the purposes of validating bids and providing reports
* adex-sdk - responsible for displaying ads @TODO
