# OUTPACE

## Off-chain Unidirectional Trustless PAyment ChannEls

OUTPACE is a system for unidirectional one-to-many payment channels based on the primitives laid out in [OCEAN.md](/OCEAN.md).

## Specification

Each channel is `(creator, deposit, validUntil, validators[], spec)`, where:

Each payment channel message is `(stateRoot, signatures)` and can be used to withdraw at anytime, as long as `signatures` are valid for a supermajority of the validators. Unlike other payment channels, `sequence` is not needed. Because of the strict unidirectional property of the payment channel, any message can be used to withdraw at any time safely.

What the validators sign is `hash(channelHash, stateRoot)`, where `stateRoot` is a merkle root of `(latestEventHash, balance1, balance2...)`

The first validator is known as the leader - they are responsible for proposing new states - they will sort the events, apply them to the state and sign. Each new state may apply more than one new event, allowing for higher throughput. Once the leader signs the new state, all the other validators will validate and sign too.

The leader does not have special privileges - they are just assigned to propose the new states. For a state to be valid, a supermajority of validators still needs to sign.

The minimal trustless setup has two validators, where the leading one is protecting the interests of the demand (advertiser), and the second one is protecting the interests of the supply (publishers).

Furthermore:

1. events might be bundled into one state advancement
2. at each next state, `sum(balances)` must be >= to `sum(previous.balances)`
3. at each next state, for every address x, `balances[x]` must be >= to `previous.balances[x]`
4. at each next state `sum(balances)` must always be <= channel.totalDeposit
5. at any time, only one balance entry per address must exist in the tree

If a validator receives a state where one of the constraints (2-5) is broken, they will not sign the state.



