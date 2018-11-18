# AdEx validator stack

@TODO describe the implementation: it should be on top of SQL, as this allows easy abstraction and using both embedded dbs (sqlite) and normal dbms (postgresql); or, another similar abstraction that works

@TODO authentication: a way for a user to prove they control a given addr (HTTP authentication header with a signed msg?), and expose the validator `init` message so that other people can know that this really is the given validator

## Diagram

## Redundancy

@TODO there can be multiple sentry nodes

## Flow

@TODO explain what the flow is FOR; all processes that require the validator stack

* negotiate validators
* create a channel (ethereum, polkadot, whatever)
* upload campaignSpec to the market, and potentially to validators (IPFS?)
* each validator would go through these states for a channel: UNKNOWN, CONFIRMED (on-chain finality), LIVE (we pulled campaignSpec and received a `init` msg from other validators) (other states: EXHAUSTED, EXPIRED, VIOLATED_CONSTRAINTS)
* SDK asks all publisher-side platforms for ACTIVE channels, sorts by price, takes top N; applies targeting on those top N, and signs a message using the user's keypair on which campaign was chosen and at what price


@TODO: negotiating the validators MAY be based on deposit/stake

## Core client library


## Sentry

@TODO nginx, ip restrictions

## API

@TODO http://restcookbook.com/HTTP%20Methods/put-vs-post/
GET /channel/:id/status - get channel status, and the validator sig(s); should each node maintain all sigs? also, remaining funds in the channel and remaining funds that are not claimed on chain (useful past validUntil); AND the health, perceived by each validator
PUT /channel/:id/update - should this be a PUT? the idea here is that we foce an update of the status

GET /channel/tree - getthe full balances tree; you can use that to generate proofs

POST /channel/events
GET /channel/events

POST /channel/validator-events


### Validator messages

`init`
@TODO validator `init` message;  all validators exchange the init, once each observes all others the channel is considered LIVE

`user_events`
@TODO There should be a special msg in the payment channel that should be send to the consensus leader: `need_missed_events`/`user_events`, where the publishers stop working with the channel/campaign unless those events are included or at least some part of them; that would be determined by `missed_event_threshold`

Each has to be signed by the validator themselves


@TODO describe validator stack events mempool: a sorted set, where `insert` and `find` work via a binary search, we pop items from the beginning (oldest first) to clean it up; describe messages between validators too: ProposeNewState, SignNewState, RequestEventsBeIncluded; consider a Heartbeat message; also, each node should keep an internal ledger of who else from the validator set is online - if 1/3 or more is offline, stop showing the ad (stop participating in bidding);  also we should keep from who we observed which event, so that we can see if the events we didn't see were observed by the supermajority; also think of IP guarantees here, since it's the only thing preventing events from being just re-broadcasted; ANOTHEr security measure is have the user sign the event for every validator separately


## OUTPACE validator worker

@TODO this is where the signing key is handled; describe how this can work: randomly generated keypair, HSM ?

@TODO configuration parameters `{ batching: { maxEvents, maxTime } }`

@TODO: describe the `stateRoot` and what the `eventHash` is and what it is for

@TODO validator stack DB structure, including a table `channels_onchain` which is populated by the blockchain-specific adapter (which consists of a continuous process that populates the table, AND an interface to sign and provide merkle proofs); this is important for having an agnostic system
@TODO describe internal ledgers in the validator stack: there's one on which events were provably observed by other users; and one for how many fees are claimed (ClaimValidationFee, can be created by a validator to make them claim a fee)
@TODO validator stack: might need a restriction on the max publishers, or on min spend per publisher; since otherwise it might not be worth it for a publisher to withdraw

## Watcher

@TODO elaborate on the blockchain-agnostic design

## Reports worker
