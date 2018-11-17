# AdEx validator stack

@TODO describe the implementation: it should be on top of SQL, as this allows easy abstraction and using both embedded dbs (sqlite) and normal dbms (postgresql); or, another similar abstraction that works

@TODO authentication: a way for a user to prove they control a given addr (HTTP authentication header with a signed msg?), and expose the validator `init` message so that other people can know that this really is the given validator

## Diagram

## Redundancy

@TODO there can be multiple sentry nodes

## Flow

* negotiate validators
* create a channel (ethereum, polkadot, whatever)
* upload campaignSpec to the market, and potentially to validators (IPFS?)
* each validator would go through these states for a channel: UNKNOWN, CONFIRMED (on-chain finality), LIVE (we pulled campaignSpec and received a `init` msg from other validators) (other states: EXHAUSTED, TIMEDOUT)
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

Each has to be signed by the validator themselves


## OUTPACE validator worker

@TODO this is where the signing key is handled; describe how this can work: randomly generated keypair, HSM ?

## Watcher

@TODO elaborate on the blockchain-agnostic design

## Reports worker
