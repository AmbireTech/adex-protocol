# OCEAN

## Introducing OCEAN

When building blockchain applications (dApps), we often face the challenge of how to take as many things as possible off-chain, while retaining the benefits of the underlying decentralized/trustless consensus.

The main reason we want to do that, is that, by design, a decentralized consensus means that every validator/miner in the network has to compute the result of all transactions, therefore making it expensive to use on-chain transactions for every action in your dApp. Plus, most actions in a dApp do not actually require changing a global ledger.

The most known ways for off-chain scaling are sidechains and state channels, but we felt like our case did not fit in any of those scaling solutions. What we came up with felt quite natural for us, so we decided to share it around and we discovered it might be useful for more projects.

**O**ff-**c**hain **e**vent **a**ggregatio**n** (**OCEAN**) is a very simple way to scale dApps: in a nutshell, it means certain events happen off-chain and then finally the overall result of those events gets committed to the chain, therefore providing the underlying security. Sounds a lot like a state channel, right?

In fact, OCEAN is very different. A state channel is usually an interaction between two parties only, where those two parties finalize it themselves. OCEAN defines validators beforehand, who are supposed to observe interactions between any number of parties, and then vote the overall result on-chain.

An OCEAN flow goes like this:

1. A commitment is written to the blockchain, definining the end goal for the OCEAN channel (e.g. 100 click events, signed by different whitelisted pub keys), the validators, the validator rewards and the channel timeout
2. The off-chain events transpire and the validators record them
3. Within the timeout, the validators sign their vote, and over 2/3 signatures for the same vote value are gathered and committed to the chain; the channel is considered finalized, and you can handle the result however you wish on-chain
4. Beyond the timeout, the channel is considered expired and is reverted

Within AdEx, anything between the beginning and the end of a delivery commitment is tracked off-chain (e.g. clicks, impressions), and committed on-chain by the validators (usually the publisher, advertiser and an arbiter) at the end. A 'success' vote means the publisher will get paid, and a 'failure' vote means the funds will be returned back to the advertiser.

You can see a working implementation of OCEAN here: https://github.com/adexnetwork/adex-protocol-eth

You can think of an OCEAN channel as a mini one block blockchain with predelegated validators. This is especially useful when:

1) there is a clear, logical and game theoretically sound way to pick validators
2) there are clear start/end points of your dApp logic that correspond to opening/closing of OCEAN channels, where the result at the end would define important actions (e.g. funds being transferred)
3) there are interactions within a lot of parties (not ones that have ever interacted with the blockchain), that need to be resolved (settled) relatively quickly

To make this more clear, here's an explanation of the AdEx usecase:

1) the publisher and advertiser have opposing interests, so a logical validator set will be (publisher, advertiser, arbiter)
2) when the publisher accepts to deliver an advertising bid, that's a new OCEAN channel, that gets resolved when they prove that they delivered it, and upon resolution the funds would be paid out to them
3) the interactions happen between publishers, advertisers and any number end-users, where the end-users do have an automatically generated cryptographic identity but have no Ether

## Usecases

While the current implementation is specific to AdEx (validating impressions/clicks of bids), we believe that there are many other possible usecases for OCEAN, for example:

* AdEx: real-time bidding
* Social network: poll voting
* Sidechain: you can implement a PoS sidechain where every block is an OCEAN channel, and the final committed vote is a merkle root of all the chain state; every finalization would save the new validator set on-chain, allowing validators to bond/unbond; since the merkle root is committed on a PoW chain, long range attacks are not feasible

## Is it trustless?

By itself, OCEAN relies completely on the validators you delegate on the opening of an OCEAN channel. So it is as trustless as the method you use to delegate the validators. A good OCEAN implementation should (1) delegate validators who don't stand to gain from their own malfeasance (2) incentivize voting by validator rewards and (3) implement stake and slashing if possible.

In most cases, most of your OCEAN validators would be the most important participants in the interaction themselves, along with third-party mediators.

## Comparison

### State channels

State channels are designed for interactions between two parties. You can use state channels for multi-party interactions, but that's usually a network of multiple two-party state channels.

OCEAN channels are designed to handle multi-party interactions in a much easier way, with much easier exits to the chain. For example, in a multi-party state channel network, each of the channels will have to exit before you could actually transfer a token reward out, while in OCEAN, you'd only require finalizing a single OCEAN channel.

The trust model is different in that state channels rely on the participants to resolve the channel on-chain, while OCEAN relies on delegated validators. When you scale that to multiple parties, however, it starts to look similar: you can have all the participants in the interactions be the validators on OCEAN. Should some validators decide to group together and act malicious, if they're less than 2/3, they risk stalling the OCEAN channel and letting it timeout, therefore possibly getting slashed (depending on the implementation).

There's much more to be said on the trade offs of both approaches, so expect a follow up post on this later this year.

### Plasma

Most Plasma designs are sidechains for fund/NFT transfer, while an OCEAN can be used for any arbitrary events/computation.

In a dApp design, a Plasma chain would be expected to always stay open, meanwhile OCEAN channels would get opened/closed all the time.

Plasma delegates a single validator, but does it's best to allow users to exit, should the validator misbehave. In OCEAN, we trust the validators completely, so delegating the validators in a fair and trustless manner is critical.

Something interesting to mention is that you can implement a sidechain using OCEAN as well, by implementing PoS with slashing. Each block would be a separate OCEAN channel, getting resolved by a vote for the correct state merkle root. The state would contain the new validator set, since it might be changed if someone gets slashed. The next OCEAN channel (for the next block) would only respect votes from the new validator set.

Compared to Plasma, this OCEAN-based sidechain will not have the exit guarantees, instead shifting the trust into the validators, and relying on a PoS system to ensure they behave correctly. We will publish a follow-up on this usecase of OCEAN later this year.


## When should I use OCEAN?

Generally, it depends on how the logic of your dApp works.

If the interactions are state transitions, are strictly ordered, and often flow between two parties, you probably need state channel.

If the interactions are mostly fund transfers, you probably need a network of payment channels or Plasma.

If, however, interactions have a complex flow and you need to exit on-chain often, we recommend you look into OCEAN.


## Protocol

The OCEAN protocol is very loosely defined, allowing each particular design/implementation to extend it and refine it for the particular purpose.

The basic building blocks are:

* `startCommitment(*any args*) -> commitment`: starts a commitment with specific goals, `validUntil` and `validators`; logic on how to determine those is up to the application
* `finalizeCommitment(commitment, vote, signatures)`: finalizes a commitment with a `vote`; `signatures` is an array of signatures, each index corresponding to the given index of `validators`; a validator must sign `keccak256(commitmentId, vote)`; whether the validators will be rewarded and what will happen on specific votes is up to the application
* `timeoutCommitment(commitment)`: called to clean-up after a timed out commitment and perform the revert; this is not needed on systems where you can define your own block start/end behavior, such as Cosmos/Polkadot

For a deep dive into the protocol, we have a working implementation at https://github.com/AdExNetwork/adex-protocol-eth and a protocol description at https://github.com/AdExNetwork/adex-protocol.