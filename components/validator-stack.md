# AdEx validator stack

## In progress

This document is currently a work in progress.

However, there is an actual reference implementation of the validator stack here: https://github.com/adexnetwork/adex-validator-stack-js

## Diagram

## Redundancy

@TODO there can be multiple sentry nodes

## Flow

@TODO explain EWT/JWT authentication

@TODO explain what the flow is FOR; all processes that require the validator stack

* negotiate validators
* create a channel (ethereum, polkadot, whatever)
* upload campaignSpec to the market, and potentially to validators (IPFS?)
* each validator would go through these states for a channel: `UNKNOWN`, `CONFIRMED` (on-chain finality), `LIVE` (we pulled campaignSpec and received a `init` msg from other validators) (other states: `EXHAUSTED`, `EXPIRED`, `VIOLATED_CONSTRAINTS`)
* SDK asks all publisher-side platforms for ACTIVE channels, sorts by price, takes top N; applies targeting on those top N, and signs a message using the user's keypair on which campaign was chosen and at what price


@TODO: negotiating the validators MAY be based on deposit/stake

## Components

### Core client library

@TODO name adex-lib.js ? adex-client.js ?

### Sentry

The Sentry is responsible for all the RESTful APIs and communication.

Furthermore, the Sentry is the point that receives events from users, and it is it's job to impose limits described in the `campaignSpec` (e.g. max 10 events per user) and other sanity checks (e.g. limits per IP). Basically, any event that the sentry puts in the database will be counted by the validator worker.

@TODO nginx, ip restrictions

#### API

@TODO http://restcookbook.com/HTTP%20Methods/put-vs-post/

##### Do not require authentication, can be cached:

GET /channel/:id/status - get channel status, and the validator sig(s); should each node maintain all sigs? also, remaining funds in the channel and remaining funds that are not claimed on chain (useful past validUntil); AND the health, perceived by each validator

GET /channel/:id/tree - get the full balances tree; you can use that to generate proofs

GET /channel/list

##### Requires authentication, can be cached:

GET /channel/:id/events/:user

##### Requires authentication:

POST /channel/events

POST /channel/validator-messages


#### Validator messages

Each validator message has to be signed by the validator themselves

OUTPACE generic:

* `NewState`: proposes a new state
* `ApproveState`: approves a `NewState`
* `Heartbeat`: validators send that periodically; once there is a Heartbeat for every validator, the channel is considered `LIVE`
* `ReportObservedEvents` adex-specific extra flags: IsCampaignUnhealthy (also document campaign's MissedEventsThreshold)

AdEx specific:

* SetImpressionPrice: set the current price the advertiser is willing to pay per impression; also allows to set a per-publisher price

Each message must be individually signed by the validator who's emitting it.


@TODO describe validator stack events mempool: a sorted set, where `insert` and `find` work via a binary search, we pop items from the beginning (oldest first) to clean it up; each node should keep an internal ledger of who else from the validator set is online - if 1/3 or more is offline, stop showing the ad (stop participating in bidding);  also we should keep from who we observed which event, so that we can see if the events we didn't see were observed by the supermajority; also think of IP guarantees here, since it's the only thing preventing events from being just re-broadcasted; ANOTHER security measure is have the user sign the event for every validator separately


### OUTPACE validator worker

@TODO this is where the signing key is handled; describe how this can work: randomly generated keypair, HSM ?

@TODO configuration parameters `{ batching: { maxEvents, maxTime } }`

@TODO validator stack DB structure, including a table `channels_onchain` which is populated by the blockchain-specific adapter (which consists of a continuous process that populates the table, AND an interface to sign and provide merkle proofs); this is important for having an agnostic system
@TODO describe internal ledgers in the validator stack: there's one on which events were provably observed by other users; and one for how many fees are claimed (ClaimValidationFee, can be created by a validator to make them claim a fee)
@TODO validator stack: might need a restriction on the max publishers, or on min spend per publisher; since otherwise it might not be worth it for a publisher to withdraw

@TODO describe the problem that a few publishers might chose a channel when there's a small amount of funds left, and this will create a race where only the first impression would get paid; we can solve that by paying in advance, but this is impractical since it requires 2 communication hops (1 commit, 1 payment)

### Watcher

@TODO elaborate on the blockchain-agnostic design

### Reports worker


## Bidding process

Each campaign has a total budget, and a maximum amount that the advertiser is willing to pay per impression.

Other than that, the advertiser may adjust the amount that they want to pay dynamically, during the course of the campaign. They may also adjust the amount for each individual publisher. This is done by sending a validator message to the publisher-side platform.

On every impression, the SDK (running on the publisher's website/app) will pull all active and healthy campaigns from a configurable list of publisher-side platforms.

Then, it will sort them by the price the advertisers are willing to pay (as reported by the publisher-side platforms), take only top N (where N is configurable by the publisher), and run the targeting process between these top N.

By adjusting N, the publisher can decide the balance between UX (more appropriate ads shown to the users) and revenue.


## DB structure

* Channels
* States
* StateTrees
* Events - ObservedByUs, ObservedByOthers
* ValidatorEvents
