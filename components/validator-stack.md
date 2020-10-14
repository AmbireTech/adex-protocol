# AdEx validator stack

#### Reference implementations of the validator stack

* *JavaScript (Node.js)*: https://github.com/adexnetwork/adex-validator
* *Rust*: https://github.com/AdExNetwork/adex-validator-stack-rust
    As of October 2020 the Rust implementation of Sentry is lacking behind the JavsScript implementation.

#### As of the v0.4 milestone (2019-04) of the reference implementation, most of this document is outdated, except Bidding process, which is not part of the validator stack anyway

-----------------------

## Architecture

The validator stack is split in two discrete parts:

* The Sentry handles HTTP(S) requests from the outside world, and communicates with the underlying database:
    *NB:* _MongoDB_ is used in the JS reference implementation & Postgres in the Rust reference implementation
* The Worker communicates with the Sentry and periodically generates new signed OUTPACE states

A single validator can be a leader or a follower, in the context of an OUTPACE channel. The architecture is the same in both cases, but the Worker's role is different: a leader is solely responsible for producing new states, while the follower is responsible for signing the states provided by the leader, but only if they are valid.


## Redundancy

The Sentry is a stateless microservice, which means it can scale horizontally. This is usually done for performance reasons, but it also provides added redundancy.

@TODO db abstraction


## Flow

### Authentication and Authorization with Ethereum Web Tokens

We use the [`AUTHORIZATION`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization) HTTP request header for both Authentication and Authorization of the request using Ethereum Web Tokens.

The `AUTHORIZATION` header must be set with [`Bearer`](https://tools.ietf.org/html/rfc6750) scheme that includes the encoded **EWT** (Ethereum Web Tokens) token string.

This **EWT** string is composed of **3** encoded parts separated by `.` which must be at least **16** characters long:

1. Header
2. Payload
3. Token

Example: `header.payload.token`

#### Verification of EWT string:

##### Message

The verification starts with the encoded `header.payload` part of the EWT string.

We use the `Keccak256` to encode the following data in *32* bytes:

1. "\x19Ethereum Signed Message:\n"
2. Length of the string, e.g. `header.payload` is `14`
3. At the end we include the string itself, e.g. `header.payload`

The final string that will be encoded will look like this:

`\x19Ethereum Signed Message:\n14header.payload`

##### Decoding the Signer address

1. We decode the *signature* (i.e. the `Token` part of the `AUTHORIZATION` header string) using `base64` with URL-safe character set without padding configuration.

2. We parse this *signature* to Electrum notation - signature encoded as RSV (V in "Electrum" notation)

3. We recover the *Public key* using the *signature* and the encoded *message* (see [Message](#message))

4. We then use the *Public key* to get the actual **`Signer address`** that signed the `AUTHORIZATION` header.

##### Decoding the Payload

We decode the `Payload` part of the `AUTHORIZATION` header with `base64` again using URL-safe character set without padding configuration.

Decoding the `Payload` should result in a JSON string with the following fields:

* `id` - string - "0x" prefixed address of the validator this request is intended for
* `era` - number - `current Date & Time milliseconds / 60 000` or simply the current date and time minutes passed from epoch in milliseconds
* `address` - string - "0x" prefixed address (TODO: what is it used for?)
* `identity` - null | string, "0x" prefixed address of an identity owned by the validator

**NB:** The identity is used to check the privileges using the relayer:
* See [Relayer Privileges](./relayer.md#privileges) for more details on *privileges*
* See [Authorization](#2-authorization)

##### Verified Payload

The `Verified Payload` contains the decoded `Signer address` and `Payload` from the `AUTHENTICATION` header.

#### Authentication token and Authorization

Using the `Verified Payload` we perform 2 more checks:

##### 1. Was this Authentication toke intended for this validator?

We check if the `Payload` `id` is the same as the validator address, if it's not, then this token was not intended for this validator.

##### 2. Authorization

If a `Payload` `identity` was set, we call the [Relayer](./relayer.md) using the Signer address of the Authentication token (who should be the owner of the `identity`) and a non-zero privilege, i.e. `privilege > 0`.

### @TODO explain what the flow is FOR; all processes that require the validator stack

* negotiate validators
* create a channel (ethereum, polkadot, whatever)
* upload campaignSpec to the market, and potentially to validators (IPFS?)
* each validator would go through these states for a channel: `UNKNOWN`, `CONFIRMED` (on-chain finality), `LIVE` (we pulled campaignSpec and received a `init` msg from other validators) (other states: `EXHAUSTED`, `EXPIRED`, `VIOLATED_CONSTRAINTS`)
* AdView asks all publisher-side platforms for ACTIVE channels, sorts by targeting score, takes top N, then sorts by price and takes top M - then randomly chooses an ad from the remaining, and signs a message using the user's keypair on which campaign was chosen and at what price


@TODO: negotiating the validators MAY be based on deposit/stake


## Components

### Sentry

The Sentry is responsible for all the RESTful APIs and communication.

Furthermore, the Sentry is the point that receives events from users, and it is it's job to impose limits described in the `campaignSpec` (e.g. max 10 events per user) and other sanity checks (e.g. limits per IP). Basically, any event that the sentry puts in the database will be counted by the validator worker.

Multiple Sentry nodes can be spawned at the same time, and they can be across different servers/data centers. This will ensure redundancy and near-100% uptime. Furthermore, even if the OUTPACE worker crashes, as long as the events are recorded, channels will always be able to recover when the worker starts up again.

@TODO nginx, ip restrictions

#### API

@TODO http://restcookbook.com/HTTP%20Methods/put-vs-post/

##### Channel information: public, can be cached

* GET /channel/list
    Query params:

    * `page` (optional): int, default: `0`
        **NB:** First page is with value `0`
    * `validUntil` (optional): int, in seconds, default: `Now` (current date & time) - filters the results by `Channel validUntil >= Query validUntil`
    * `creator` (optional): string - fetches only channels with this Channel creator (address prefixed with `0x`, e.g. `0xce07CbB7e054514D590a0262C93070D838bFBA2e`)
    * `validator` (optional): string - fetches only channels with the specified validator (address prefixed with `0x`, e.g. `0xce07CbB7e054514D590a0262C93070D838bFBA2e`)

    Response:

    * `channels` - List of the channels (TODO: explain the channel json)
    * `total` - total number of pages
    * `totalPages` - same as `total`
    * `page` - the number of page that was requested

    Response example:

    ```json
    {
        "channels":
        [
            {
                "id": "0x7996bc363acd9e5cf5354da7feb76008f0fbb129b74a565d65ee04e963380d63",
                "creator": "0x033Ed90e0FeC3F3ea1C9b005C724D704501e0196",
                "depositAsset": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
                "depositAmount": "500000000000000000000",
                "validUntil": 1602587940,
                "spec":
                {
                    "title": "Binance trading comp",
                    "adUnits":
                    [
                        {"ipfs":"QmQfBbv4efohxQWYwKuTD4puaBx9mhPneCVkHxNLYcXZV5","type":"legacy_300x250","mediaUrl":"ipfs://QmPRiy54hJAktBMRwB1P4ptHxXKQ5eRpQuD1C891VzXed2","mediaMime":"image/jpeg","targetUrl":"https://www.adex.network/blog/adx-trading-competition-binance/?utm_source=adex_PUBHOSTNAME&utm_medium=banner&utm_campaign=Binance%20trading%20comp&utm_content=1_legacy_300x250","targeting":[],"owner":"0x033Ed90e0FeC3F3ea1C9b005C724D704501e0196","created":1600689820025},
                    ],
                    "validators":
                    [
                        {"id":"0xce07CbB7e054514D590a0262C93070D838bFBA2e","url":"https://jerry.moonicorn.network","fee":"0"},
                        {"id":"0x2892f6C41E0718eeeDd49D98D648C789668cA67d","url":"https://tom.moonicorn.network","fee":"35000000000000000000","feeAddr":"0xe3C19038238De9bcc3E735ec4968eCd45e04c837"}
                    ],
                    "pricingBounds":
                    {
                        "IMPRESSION": {"min":"100000000000000","max":"150000000000000"}
                    },
                    "maxPerImpression": "150000000000000",
                    "minPerImpression": "100000000000000",
                    "targetingRules":
                    [
                        {"if":[{"in":[["AU","CA","CH","DE","GB","IE","IS","LU","NL","NO","SE","SG","US"],{"get":"country"}]},{"set":["price.IMPRESSION",{"bn":"150000000000000000"}]}]},
                        {"if":[{"in":[["AD","AE","AG","AR","AT","AW","BB","BE","BH","BM","BN","BS","CK","CL","CW","CY","CZ","DK","EE","ES","FI","FK","FO","FR","GD","GF","GI","GL","GP","GQ","GR","HK","HR","HU","IC","IL","IT","JP","KR","KW","KY","LI","LT","LV","MC","MO","MQ","MT","NZ","OM","PF","PL","PT","QA","RU","SA","SC","SI","SM","SK","TT","TW","UY","VA","VE","VG","VI"],{"get":"country"}]},{"set":["price.IMPRESSION",{"bn":"150000000000000000"}]}]},
                        {"if":[{"in":[["AL","AO","AZ","BA","BG","BR","BW","BY","BZ","CN","CO","CR","CU","DO","DZ","EC","FJ","GA","IQ","IR","JM","JO","KZ","LB","LC","LY","ME","MK","MN","MU","MX","MY","NA","PA","PE","PY","RO","RS","SR","TH","TN","TR","TV","VC","ZA"],{"get":"country"}]},{"set":["price.IMPRESSION",{"bn":"150000000000000000"}]}]},
                        {"onlyShowIf":{"undefined":[[],{"get":"userAgentOS"}]}}
                    ],
                    "minTargetingScore": null,
                    "created": 1601119169830,
                    "nonce": "91435658526621140049841607517946237384784204309386341933594170269202382085017",
                    "withdrawPeriodStart": 1601291940000,
                    "eventSubmission":
                    {
                        "allow": [{"uids":["0x033Ed90e0FeC3F3ea1C9b005C724D704501e0196","0xce07CbB7e054514D590a0262C93070D838bFBA2e","0x2892f6C41E0718eeeDd49D98D648C789668cA67d"]},{"uids":null,"rateLimit":{"type":"ip","timeframe":300000}}]
                    },
                    "activeFrom": 1601119140641
                },
            }
        ],
        "total": 1,
        "totalPages": 1,
        "page": 0
    }
    ```

    **NB:** Limitation of the returned Channels of the `/channel/list` endpoint is handled by a configuration value (`CHANNELS_FIND_LIMIT` from `GET /cfg` endpoint) set in `sentry`.


* POST /channel

* POST /channel/validate

Same as `POST /channel` with 1 difference - it only validates the channel and does not save it in the database.

* GET /channel/:id/status

* GET /channel/:id/validator-messages

* GET /channel/:id/last-approved

* GET /channel/:id/validator-messages/:uid/:type? **(auth required)**

* GET /channel/:id/events-aggregates **(auth required)**

* POST /channel/:id/validator-messages **(auth required)**

* POST /channel/:id/events
    Requires the validator to be part of the `channel.spec.validators`

* GET /cfg
    Returns the configuration values in JSON with each key being in `SCREAMING_SNAKE_CASE`.
    For up to date information of the values check:

    * Development configuration:
        JS implementation: https://github.com/AdExNetwork/adex-validator/blob/master/cfg/dev.js
        Rust implementation: https://github.com/AdExNetwork/adex-validator-stack-rust/blob/master/docs/config/dev.toml

    * Production configuration:
        JS implementation: https://github.com/AdExNetwork/adex-validator/blob/master/cfg/prod.js
        Rust implementation https://github.com/AdExNetwork/adex-validator-stack-rust/blob/master/docs/config/prod.toml

#### Validator messages

Each validator message has to be signed by the validator themselves

OUTPACE generic:

* `NewState`: proposes a new state
* `ApproveState`: approves a `NewState`
* `Heartbeat`: validators send that periodically; once there is a Heartbeat for every validator, the channel is considered `LIVE`
* `RejectState`: sent back to a validator that proposed an invalid `NewState`

AdEx specific:

* SetImpressionPrice: set the current price the advertiser is willing to pay per impression; also allows to set a per-publisher price

Each message must be individually signed by the validator who's emitting it.


### OUTPACE validator worker

@TODO this is where the signing key is handled; describe how this can work: randomly generated keypair, HSM ?

@TODO describe blockchains-specific adapters

@TODO validator stack: might need a restriction on the max publishers, or on min spend per publisher; since otherwise it might not be worth it for a publisher to withdraw

@TODO describe the problem that a few publishers might chose a channel when there's a small amount of funds left, and this will create a race where only the first impression would get paid; we can solve that by paying in advance, but this is impractical since it requires 2 communication hops (1 commit, 1 payment)

### Reports worker


## Bidding process

This is described fully in [targeting and bidding](/targetingAndBidding.md). This paragraph only describes the validator's role in it.

Each campaign has a total budget, and the minimum/maximum amounts that the advertiser is willing to pay per impression.

Other than that, the advertiser may adjust the amount that they want to pay dynamically, as well as targeting rules, during the course of the campaign. They may also adjust the amount for each individual publisher through the targeting rules. This is done by sending a validator message (`UPDATE_TARGETING`) to both validators.


## DB structure

* Channels
* Messages
* EventAggregates
