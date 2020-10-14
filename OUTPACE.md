# OUTPACE

Note: this spec assumes you're familiar with merkle [trees](https://en.wikipedia.org/wiki/Merkle_tree)/[proofs](https://medium.com/crypto-0-nite/merkle-proofs-explained-6dd429623dc5) and somewhat familiar with [state channels](https://www.learnchannels.org).

## Off-chain Unidirectional Trustless PAyment ChannEls

OUTPACE is a system for unidirectional one-to-many payment channels built on [OCEAN (Off-chain Event AggregatioN)](https://medium.com/the-adex-blog/introducing-ocean-alternative-layer-2-scalability-7d24bb22ebe4).

OCEAN defines that we aggregate off-chain events with a certain aggregation function, and a certain committee of validators is delegated to run this aggregation function and sign a new state. Unlike regular state channels, OCEAN defines that there can be any arbitrary number of validators and arbitrary rules for when new states are produced. If 2/3 or more validators sign a state, it is considered valid.

OUTPACE builds on this to allow creating a simple one-to-many payment channel: each state represents a balance tree, where the sum of balances and individual balances can only increase (therefore unidirectional). This allows any party to withdraw at any time, as long as their balance is in the tree and `>0`. The withdrawn amounts are accounted for on-chain.

## What makes it a good fit

Each AdEx campaign maps to one OUTPACE channel, where the advertiser locks up a certain budget (the channel deposit) which is paid out to multiple parties (publishers, validators, possibly even users).

In case the advertiser decides to close the campaign, this can happen with the explicit agreement of the validators: they'd add a new balance entry for the advertiser, with the unspent portion of the total deposit, and sign the new state. This would allow the advertiser to withdraw their balance.

## Unidirectional

Keeping the channels unidirectional allows OUTPACE to stay simple, and not rely on challenge periods and watchtowers. To read why, check out [Introducing OUTPACE](https://medium.com/the-adex-blog/introducing-outpace-off-chain-unidirectional-trustless-payment-channels-243a08e152a).

@TODO channel spec: describe channelWithdraw; describe on-chain guarantees against double spending and why they work in a unidirectional channel; global withdrawn[channel] and withdrawnByAddr[channel][spender]; also `assert(available > alreadyWithdrawn)`

@TODO answer the question "but what if someone uses older state?"

## Specification

@TODO should we cover OCEAN: events, validators, aggregation function, rules for when new states are produced

Each channel is `(creator, deposit, validUntil, validators[], spec)`, where:

What the validators sign (`signedState`) is `hash(channelHash, balancesRoot)`, where `balancesRoot` is a merkle root of `(balance1, balance2...)`. If we require inclusion proofs of extra information (e.g. related to events or the latest Ethereum block hash), then we should use a separate tree, and require that the validators sign `hash(channelHash, balancesRoot, extraRoot)` (if we include extra hashes in the balances tree, we allow attacks where the extra hash is actually a balance leaf).

Each payment channel message is `(signedState, signatures)` and can be used to withdraw at anytime, as long as `signatures` are valid for a supermajority of the validators. Unlike other payment channels, `sequence` is not needed. Because of the strict unidirectional property of the payment channel, any message can be used to withdraw at any time safely.

An important aspect of this is privacy: even though micropayments happen on a per-event basis, the event history itself is only accessible to the validators.

The first validator (`validators[0]`) is the leader - they are responsible for proposing new states - they will sort the events, apply them to the state and sign. Each new state may apply more than one new event, allowing for higher throughput. Once the leader signs the new state, all the other validators will validate and sign too.

The leader does not have special privileges - they are just assigned to propose the new states. For a state to be valid, a supermajority of validators still needs to sign. However, it is required that the leader is the one who provided the channel deposit, to align the incentives correctly (they can't "steal" their own funds).

The minimal trustless setup has two validators, where the leading one is protecting the interests of the demand (advertiser), and the second one is protecting the interests of the supply (publishers).

Furthermore:

1. events might be bundled into one state advancement
2. at each next state, `sum(balances)` must be >= to `sum(previous.balances)`
3. at each next state, for every address x, `balances[x]` must be >= to `previous.balances[x]`
4. at each next state `sum(balances)` must always be <= `channel.totalDeposit`
5. at any time, only one balance entry per address must exist in the tree

#### Refusal to sign on rules violation

If a validator receives a state where one of the rules (2-5) is violated, they will not sign the state.

### States

* `Unknown`: the channel does not exist yet
* `Active`: the channel exists, has a deposit, and it's within the valid period
* `Expired`: the channel exists, but it's no longer valid
* `Exhausted`: this is a meta-state that's not reflected on-chain; it means Active, but all funds in the channel are spent

### On-chain

* `channelOpen(channel)`: open an OUTPACE channel
* `channelWithdraw(channel, state, signatures, merkleProof, amount)`: allows anyone who earned from this channel to withdraw their earnings by providing `(state, signatures)` and `merkleProof`; can be called multiple times, and will always withdraw the difference between what you previously withdrew and the `amount`; this difference is called "outstanding amount"
* `channelExpiredWithdraw(channel)`: allows the channel creator to withdraw the remaining deposit in a channel after it expired; not needed on blockchain platforms where we can define our own "end block" function, like Cosmos/Polkadot

The on-chain accounting that has to be done is:

```
states: channelId -> channelState
withdrawnByChannel: channelId -> amount
withdrawn: (channelId, account) -> amount
```

First of all, we need to track the state of each channel. The possible states are `{Unknown, Active, Expired}`.

Secondly, we need to ensure that it's not possible for anyone to withdraw more than the total channel balance, even if the balances tree allows to. This is why we track the total withdrawn amount per channel.

Finally, we track how much each account has withdrawn in total: if a new balance leaf appears in the tree giving them a higher balance, and they've already withdrawn some, they should only be able to withdraw the difference.

### In practice / user experience

In practice, advertisers open a channel every time they open a campaign - campaigns and channels are mapped 1:1. In terms of user experience, you simply have to choose the campaign deposit and parameters, sign a transaction, and the campaign/channel will be open.

Publishers may earn from multiple campaigns, meaning that to withdraw/spend all their funds, `channelWithdraw` has to be called for each one. The process of calling `channelWithdraw` for all channels is called "sweeping". Thanks to the fact that AdEx accounts [are smart contracts](./README.md#identity), many calls can be made in one transaction, allowing to sweep all earned funds without having to ask the user to sign multiple transactions.

Furthermore, we have a mechanism called "routine authorizations", where you can authorize a relayer to sweep channels for you.

#### Dust amounts, also called "potential revenue"

Sometimes, you may have earned an amount from a channel that is smaller than the cost of calling `channelWithdraw`. In this case, this revenue is not counted, because it represents a net negative if you were to spend it.

This problem is similar to Bitcoin dust.

It is also the reason for impressions [not always resulting in revenue](./FAQ.md#why-are-there-impressions-but-no-revenue).

However, because there's a limit to the max amount of channels you can earn from, and the cost of doing a `channelWithdraw` is relatively small, this problem only manifests itself with really low earnings (under 3.5 DAI per week).

