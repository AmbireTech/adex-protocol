# OUTPACE

@TODO explain merkle proofs?

## Off-chain Unidirectional Trustless PAyment ChannEls

OUTPACE is a system for unidirectional one-to-many payment channels built on OCEAN (Off-chain Event AggregatioN).

@TODO introduce OCEAN as a concept and spec in a few short sentences

OCEAN defines that we aggregate off-chain events with a certain aggregation function, and a certain committee of validators is delegated to run this aggregation function and sign a new state. If 2/3 or more signatures are collected, the state is considered valid.

OUTPACE builds on this to allow creating a simple one-to-many payment channel: each state represents a balance tree, where the sum of balances and individual balances can only increase (therefore unidirectional). This allows any party to withdraw at any time, as long as their balance is in the tree and `>0`. The withdrawn amounts are accounted for on-chain.

## What makes it a good fit

Each AdEx campaign maps to one OUTPACE channel, where the advertiser locks up a certain budget (the channel deposit) which is paid out to multiple parties (publishers, validators, possibly even users).

In case the advertiser decides to close the campaign, this can happen with the explicit agreement of the validators: they'd add a new balance entry for the advertiser, with the unspent portion of the total deposit, and sign the new state. This would allow the advertiser to withdraw their balance.

## Unidirectional


@TODO channel spec: explain why sequence is not needed

@TODO channel spec: explain why challenge period is not needed

@TODO channel spec: describe channelWithdraw; describe on-chain guarantees against double spending and why they work in a unidirectional channel; global withdrawn[channel] and withdrawnByAddr[channel][spender]; also `assert(available > alreadyWithdrawn)`

## Specification

Each channel is `(creator, deposit, validUntil, validators[], spec)`, where:

Each payment channel message is `(stateRoot, signatures)` and can be used to withdraw at anytime, as long as `signatures` are valid for a supermajority of the validators. Unlike other payment channels, `sequence` is not needed. Because of the strict unidirectional property of the payment channel, any message can be used to withdraw at any time safely.

What the validators sign is `hash(channelHash, stateRoot)`, where `stateRoot` is a merkle root of `(latestEventHash, balance1, balance2...)`

The first validator (`validators[0]`) is known as the leader - they are responsible for proposing new states - they will sort the events, apply them to the state and sign. Each new state may apply more than one new event, allowing for higher throughput. Once the leader signs the new state, all the other validators will validate and sign too.

The leader does not have special privileges - they are just assigned to propose the new states. For a state to be valid, a supermajority of validators still needs to sign.

The minimal trustless setup has two validators, where the leading one is protecting the interests of the demand (advertiser), and the second one is protecting the interests of the supply (publishers).

Furthermore:

1. events might be bundled into one state advancement
2. at each next state, `sum(balances)` must be >= to `sum(previous.balances)`
3. at each next state, for every address x, `balances[x]` must be >= to `previous.balances[x]`
4. at each next state `sum(balances)` must always be <= `channel.totalDeposit`
5. at any time, only one balance entry per address must exist in the tree

If a validator receives a state where one of the constraints (2-5) is broken, they will not sign the state.

### States

* `Unknown`: the channel does not exist yet
* `Active`: the channel exists, has a deposit, and it's within the valid period
* `Expired`: the channel exists, but it's no longer valid
* `Exhausted`: this is a meta-state that's not reflected on-chain; it means Active, but all funds in the channel are spent

### On-chain

* `channelOpen(channel)`: open an OUTPACE channel
* `channelWithdraw(channel, state, signatures, merkleProof, amount)`: allows anyone who earned from this channel to withdraw their earnings by providing `(state, signatures)` and `merkleProof`
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


