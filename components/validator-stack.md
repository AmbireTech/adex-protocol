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

For more information check the [ethereum EIP#1341](https://github.com/ethereum/EIPs/issues/1341).

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

    Lists `Channel`s that are part of the `Validator`.

    Query parameters:

    * `page` (optional): int, default: `0`
        **NB:** First page is with value `0`
    * `validUntil` (optional): int, in seconds, default: `Now` (current date & time) - filters the results by `Channel validUntil >= Query validUntil`
    * `creator` (optional): string - fetches only channels with this Channel creator (address prefixed with `0x`, e.g. `0xce07CbB7e054514D590a0262C93070D838bFBA2e`)
    * `validator` (optional): string - fetches only channels with the specified validator (address prefixed with `0x`, e.g. `0xce07CbB7e054514D590a0262C93070D838bFBA2e`)

    Response:

    * `channels` - List of `Channel`s - check the `POST /channel` for detailed explanation of the `Channel` object
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
                        {"ipfs":"QmQfBbv4efohxQWYwKuTD4puaBx9mhPneCVkHxNLYcXZV5","type":"legacy_300x250","mediaUrl":"ipfs://QmPRiy54hJAktBMRwB1P4ptHxXKQ5eRpQuD1C891VzXed2","mediaMime":"image/jpeg","targetUrl":"https://www.adex.network/blog/adx-trading-competition-binance/?utm_source=adex_PUBHOSTNAME&utm_medium=banner&utm_campaign=Binance%20trading%20comp&utm_content=1_legacy_300x250","owner":"0x033Ed90e0FeC3F3ea1C9b005C724D704501e0196","created":1600689820025},
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

    **NB:** Limitation of the returned `Channel`s of the `/channel/list` endpoint is handled by a configuration value (`CHANNELS_FIND_LIMIT` from `GET /cfg` endpoint) set in `sentry`.

* POST /channel
    Creating a new `Channel`. This request should consists of:

    * Header Content-Type: `application/json`
    * Request body: JSON of the `Channel` object

    The `Channel` object consists of:
    * `id`: String - `0x` prefixed representation of the 32 bytes in hex of the `Channel` Id
    * `creator`: String - `0x` prefixed representation of the 20 bytes in hex of the `creator`'s address
    * `deposit_asset`: String - `0x` prefixed representation of the 20 bytes in hex of the `deposit asset` of the `Channel`
    * `deposit_amount`: BigNum - the `Channel` `deposit amount`
    * `valid_until`: int, seconds since Epoch
    * `targeting_rules`: (optional) array of [`Targeting rules`][Targeting and Bidding] - this field is used for updating the `Targeting rules`, since the `Channel Spec` rules are **immutable**
    * `spec`: `CampaignSpec` object - The `Channel Spec` is identical to the `CampaignSpec` with additional `Validator` object validation. For detailed information of the `CampaignSpec` object refer to [campaignSpec](../campaignSpec.md#campaignspec-format-v100).
        Additional `Validator` object validation:
        * `id` - should be `0x` prefixed representation of the 20 bytes in hex of the validator address
        * `fee_addr`: (optional) if not set `id` will be used - should be `0x` prefixed representation of the 20 bytes in hex of the address

    Example body:

    ```json
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
                {"ipfs":"QmQfBbv4efohxQWYwKuTD4puaBx9mhPneCVkHxNLYcXZV5","type":"legacy_300x250","mediaUrl":"ipfs://QmPRiy54hJAktBMRwB1P4ptHxXKQ5eRpQuD1C891VzXed2","mediaMime":"image/jpeg","targetUrl":"https://www.adex.network/blog/adx-trading-competition-binance/?utm_source=adex_PUBHOSTNAME&utm_medium=banner&utm_campaign=Binance%20trading%20comp&utm_content=1_legacy_300x250","owner":"0x033Ed90e0FeC3F3ea1C9b005C724D704501e0196","created":1600689820025},
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
    ```


* POST /channel/validate

    Same as `POST /channel` with 1 difference - it only validates the channel and does not save it to the database.

* GET /channel/:id/status

    * `channel` - the Channel object, refer to `POST /channel` for detailed explanation of the full Channel object.

    Example response:

    ```json
    {
        "channel": {
            "id": "0x061d5e2a67d0a9a10f1c732bca12a676d83f79663a396f7d87b3e30b9b411088",
            "depositAsset": "0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359",
            "depositAmount": "1000",
            "creator": "0x033Ed90e0FeC3F3ea1C9b005C724D704501e0196",
            "validUntil": 4102444800,
            "spec": {
                "minPerImpression": "1",
                "maxPerImpression": "10",
                "pricingBounds": {
                    "CLICK": {
                        "min": "0",
                        "max": "0"
                    }
                },
                "withdrawPeriodStart": 4073414400000,
                "validators": [
                    {
                        "id": "0xce07CbB7e054514D590a0262C93070D838bFBA2e",
                        "url": "https://jerry.moonicorn.network",
                        "fee": "0"
                    },
                    {
                        "id": "0x2892f6C41E0718eeeDd49D98D648C789668cA67d",
                        "url": "https://tom.moonicorn.network",
                        "fee": "35000000000000000000",
                        "feeAddr": "0xe3C19038238De9bcc3E735ec4968eCd45e04c837"
                    }
                ]
            }
        }
    }
    ```


* GET /channel/:id/validator-messages

    Retrieve the last N (see `limit` query parameter) Validator messages of a Channel from a Validator, optionally filtered by types of message.

    Route parameters:
    * `id`: string - `0x` prefixed address of the Channel

    Query parameters:

    * `limit` (optional): int - Limits the returned `Validator Messages`, configuration value `MSGS_FIND_LIMIT` (see `GET /cfg` route) is used if no value is passed.
        **NB:** `MSGS_FIND_LIMIT` is used as maximum value for `limit`, if `limit` is set higher then `MSGS_FIND_LIMIT` will be used instead.

* GET /channel/:id/validator-messages/:uid/:type?

    Retrieve the last N (see `limit` query parameter) Validator messages of a Channel from a Validator, optionally filtered by types of message.

    Route parameters:

    * `id`: string - `0x` prefixed address of the Channel
    * `uid`: string - `0x` prefixed address of a Validator address - filters messages that are received only from this Validator address
    * `type` (optional): string - Validator message type(s) - filters the messages by types.
        Available types (see [Validator messages](#validator-messages) for more details):
        - `ApproveState`
        - `NewState`
        - `RejectState`
        - `Heartbeat`
        - `Accounting`

        Multiple types are allowed by separating them with a space `" "` (URL encoded as a `+`).

        Example: `.../NewState+RejectState`

    Query parameters:

    * `limit` (optional): int - Limits the returned `Validator Messages`, configuration value `MSGS_FIND_LIMIT` (see `GET /cfg` route) is used if no value is passed.
        **NB:** `MSGS_FIND_LIMIT` is used as maximum value for `limit`, if `limit` is set higher then `MSGS_FIND_LIMIT` will be used instead.


* GET /channel/:id/last-approved

    Returns the last `NewState` and corresponding `ApprovedState` approved from the validator. If one of them is missing then empty response is returned.

    Query parameters:

    * `withHeartbeat` (optional): string, allowed values: `true` - when this parameter is set then the last 2 Heartbeats from each of the Channel Validators will be returned for a maximum of 4 Heartbeats returned.

    Response:

    * `lastApproved`: a map with:
        * `newState` - `NewState` object | `null`
        * `approveState` - `ApproveState` object | `null`
    * `heartbeats` (only if `withHeartbeat=true` is set): an array of `Heartbeat`s - 0 to 4 heartbeats (maximum of 2 from each validator).

    Example of empty response (missing either `NewState` or `ApproveState`):

    ```json
    {
        "lastApproved":
        {
            "newState": null,
            "approveState": null,
        }
    }
    ```


    Example response **without** `withHeartbeat=true`:

    ```json
    {
        "lastApproved":
        {
            "newState":
            {
                "from": "0xce07CbB7e054514D590a0262C93070D838bFBA2e",
                "msg":
                {
                    "type": "NewState",
                    "balances":
                    {
                        "0xd5860D6196A4900bf46617cEf088ee6E6b61C9d6": "27030822000000000000",
                        "0x5d62321228bC75936dd29f9c129f8DbDfcB93264": "7887627600000000000",
                    },
                    "stateRoot": "b30eab8eb8206ce2377eb5030a3ff3d9dcfae66be1ffda30265c726d2b0634f8",
                    "signature": "0x311615c8006511aec4ee6c48680db83f065c82f937229499f19e9de5dc18f4fe295900b597a587069636f185f5753c6ddde1af5f6bcb20d25480c36decbba58a1c",
                },
                "received": "2020-09-29T23:35:17.450Z"
            },
            "approveState":
            {
                "from": "0x2892f6C41E0718eeeDd49D98D648C789668cA67d",
                "msg":
                {
                    "type": "ApproveState",
                    "stateRoot": "b30eab8eb8206ce2377eb5030a3ff3d9dcfae66be1ffda30265c726d2b0634f8",
                    "signature": "0xa7737479df071f0df7c694c65093b68abae80d20ab6d71bd5c58aa675db2799c436b75dda9e1443def0ba77e43387d7e344f0e2771780c83d440854ff70812841b",
                    "isHealthy": true
                },
                "received": "2020-09-29T23:35:55.930Z"
            }
        }
    }
    ```

    Example response **with** `withHeartbeat=true`:

    ```json
    {
        "lastApproved":
        {
            "newState":
            {
                "from": "0xce07CbB7e054514D590a0262C93070D838bFBA2e",
                "msg":
                {
                    "type": "NewState",
                    "balances":
                    {
                        "0xd5860D6196A4900bf46617cEf088ee6E6b61C9d6": "27030822000000000000",
                        "0x5d62321228bC75936dd29f9c129f8DbDfcB93264": "7887627600000000000",
                    },
                    "stateRoot": "b30eab8eb8206ce2377eb5030a3ff3d9dcfae66be1ffda30265c726d2b0634f8",
                    "signature": "0x311615c8006511aec4ee6c48680db83f065c82f937229499f19e9de5dc18f4fe295900b597a587069636f185f5753c6ddde1af5f6bcb20d25480c36decbba58a1c",
                },
                "received": "2020-09-29T23:35:17.450Z"
            },
            "approveState":
            {
                "from": "0x2892f6C41E0718eeeDd49D98D648C789668cA67d",
                "msg":
                {
                    "type": "ApproveState",
                    "stateRoot": "b30eab8eb8206ce2377eb5030a3ff3d9dcfae66be1ffda30265c726d2b0634f8",
                    "signature": "0xa7737479df071f0df7c694c65093b68abae80d20ab6d71bd5c58aa675db2799c436b75dda9e1443def0ba77e43387d7e344f0e2771780c83d440854ff70812841b",
                    "isHealthy": true
                },
                "received": "2020-09-29T23:35:55.930Z"
            }
        },
        "heartbeats": [
            {
                "from": "0xce07CbB7e054514D590a0262C93070D838bFBA2e",
                "msg": {
                    "type": "Heartbeat",
                    "timestamp": "2020-10-15T10:43:40.184Z",
                    "signature": "0x523b022dc09594baee3d520ad5759bdec71649ee185be0041be83516bc6355b95c450a0597456ff7d1c834205ec57ed14d6a95cb144fc8277a47083ef85ba7d31b",
                    "stateRoot": "cd3142f7cd23b93bba361af8ee761c09ff779f81ed4891596cab92621e5f339c"
                },
                "received": "2020-10-15T10:43:40.272Z"
            },
            {
                "from": "0xce07CbB7e054514D590a0262C93070D838bFBA2e",
                "msg": {
                    "type": "Heartbeat",
                    "timestamp": "2020-10-15T10:42:20.338Z",
                    "signature": "0xee7dbf3693e04429bad4e2f15eb95cb26102cd3248fa312f4e9def5a4c9b9fc1478decbe6a4f427e82561cbfd14f58733c949f0d3f75ae75ae394cfdbadfe6c01c",
                    "stateRoot": "7cfa0a75bb29aef3e082c39a9e884ef8923aed4a398a5d8ef3a7ea6d3b85ea63"
                },
                "received": "2020-10-15T10:42:20.468Z"
            },
            {
                "from": "0x2892f6C41E0718eeeDd49D98D648C789668cA67d",
                "msg": {
                    "type": "Heartbeat",
                    "signature": "0x38e819b5e0d939992ee46ac78e6b0d10d5d79e49b14b9438278cfc181ed1e8986c622e94639ca52d0b4b33bfd61a2c25d57858d8743bf1e73a47d6176730b6ba1c",
                    "stateRoot": "c7e16ea2246d3f76e96e966c62cce291dfe3c913fd047d255275b90fa8cc9fec",
                    "timestamp": "2020-10-15T10:43:08.815Z"
                },
                "received": "2020-10-15T10:43:08.981Z"
            },
            {
                "from": "0x2892f6C41E0718eeeDd49D98D648C789668cA67d",
                "msg": {
                    "type": "Heartbeat",
                    "signature": "0xcc4e9cd43fabc97a176f4fd23f8cbb2d148dbc978b0b889a68c76d2ee42531427856da832c1d26f591e0d391a611372958a8aaff3f41f16100254296e7a884d81b",
                    "stateRoot": "72788f92ad8f4591e28ee8100f88520ebb4558c614d1924ca5e72f62a9874af0",
                    "timestamp": "2020-10-15T10:41:48.731Z"
                },
                "received": "2020-10-15T10:41:48.905Z"
            }
        ]
    }
    ```

* GET /channel/:id/events-aggregates **(auth required)**

    Retrieves the last N (configuration value `EVENTS_FIND_LIMIT` of the `GET /cfg` route) `Events Aggregates` which contain the events: count and payouts.

    `Events Aggregates` are snapshots of all events (e.g. `IMPRESSION`, `CLICK`, etc.) between 2 particular points in time with their respective count and payouts for the channel.

    If the Authenticated (see [Authentication and Authorization with Ethereum Web Tokens](#authentication-and-authorization-with-ethereum-web-tokens)) session address is part of the `ChannelSpec Validators` then all of the `Events Aggregates`, otherwise only the aggregates from this particular address of `IMPRESSION` events will be returned.

    Query parameters:

    * `after` (optional): int, in milliseconds - filters the `Events Aggregates` created after the specified date & time in milliseconds from epoch

    Example response:

    ```json
    {
        "channel": {
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
                    {"ipfs":"QmQfBbv4efohxQWYwKuTD4puaBx9mhPneCVkHxNLYcXZV5","type":"legacy_300x250","mediaUrl":"ipfs://QmPRiy54hJAktBMRwB1P4ptHxXKQ5eRpQuD1C891VzXed2","mediaMime":"image/jpeg","targetUrl":"https://www.adex.network/blog/adx-trading-competition-binance/?utm_source=adex_PUBHOSTNAME&utm_medium=banner&utm_campaign=Binance%20trading%20comp&utm_content=1_legacy_300x250","owner":"0x033Ed90e0FeC3F3ea1C9b005C724D704501e0196","created":1600689820025},
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
        },
        "events": [
            {
                "channelId": "0x7996bc363acd9e5cf5354da7feb76008f0fbb129b74a565d65ee04e963380d63",
                "created": "2020-10-05T12:58:05.780Z",
                "events": {
                    "CLICK": {
                        "eventCounts": {
                            "0xce07CbB7e054514D590a0262C93070D838bFBA2e": 3
                        },
                        "eventPayouts": {
                            "0xce07CbB7e054514D590a0262C93070D838bFBA2e": "300000000000000"
                        }
                    },
                    "IMPRESSION": {
                        "eventCounts": {
                            "0x2892f6C41E0718eeeDd49D98D648C789668cA67d": 5
                        },
                        "eventPayouts": {
                            "0x2892f6C41E0718eeeDd49D98D648C789668cA67d": "500000000000000"
                        }
                    }
                },
                "totals": {
                    "CLICK": {
                        "eventCounts": "3",
                        "eventPayouts": "1"
                    },
                    "IMPRESSION": {
                        "eventCounts": "5",
                        "eventPayouts": "1"
                    },
                },
                "earners": [
                    "0xce07CbB7e054514D590a0262C93070D838bFBA2e",
                    "0x2892f6C41E0718eeeDd49D98D648C789668cA67d"
                ]
            },
            ...
        ]
    }
    ```

    There is a special case if there is a `CLOSE` event

* POST /channel/:id/validator-messages **(auth required)**

    Create new `Channel` `Validator Message`s. The Authenticated (see [Authentication and Authorization with Ethereum Web Tokens](#authentication-and-authorization-with-ethereum-web-tokens)) session address **must** be part of the `Channel`'s validators (`channel.spec.validators`), otherwise `401 Unauthorized` will be returned.

    Request should consist of:
    * Header Content-Type: `application/json`
    * Request body:
        * `messages`: array of the `Validator Message`s to be created for the `Channel`.

    Examples request:

    ```json
    {
        "messages": [
            {
                "type": "NewState",
                "balances":
                {
                    "0xd5860D6196A4900bf46617cEf088ee6E6b61C9d6": "27030822000000000000",
                    "0x5d62321228bC75936dd29f9c129f8DbDfcB93264": "7887627600000000000",
                },
                "stateRoot": "b30eab8eb8206ce2377eb5030a3ff3d9dcfae66be1ffda30265c726d2b0634f8",
                "signature": "0x311615c8006511aec4ee6c48680db83f065c82f937229499f19e9de5dc18f4fe295900b597a587069636f185f5753c6ddde1af5f6bcb20d25480c36decbba58a1c",
            },
            {
                "type": "Heartbeat",
                "timestamp": "2020-10-15T10:43:40.184Z",
                "signature": "0x523b022dc09594baee3d520ad5759bdec71649ee185be0041be83516bc6355b95c450a0597456ff7d1c834205ec57ed14d6a95cb144fc8277a47083ef85ba7d31b",
                "stateRoot": "cd3142f7cd23b93bba361af8ee761c09ff779f81ed4891596cab92621e5f339c"
            },
        ]
    }
    ```

    Successful response:

    ```json
    {
        "success": true
    }
    ```

* POST /channel/:id/events

    Insert new `Channel` `Event`s to the validator. The Authenticated (see [Authentication and Authorization with Ethereum Web Tokens](#authentication-and-authorization-with-ethereum-web-tokens)) session address **must** be part of the `Channel`'s validators (`channel.spec.validators`), otherwise `401 Unauthorized` will be returned.

    **Available `Event`s**:

    * `IMPRESSION` (payout event): Impression event has occurred
    * `CLICK` (payout event): Click event has occurred
    * `CLOSE`: Close the payment `Channel`
    * `UPDATE_TARGETING`: Update `targetingRules` of the `Channel` and not the `channel.spec` ([`campaignSpec`](../campaignSpec.md))

    If any of the events fail the checks (like access, validation, event submission limits, etc) described bellow, the whole request will be rejected and no events will be taken into account.

    **Request checks:**

    1. Authenticated session address **must** be part of the `Channel`'s validators (`channel.spec.validators`), otherwise `401 Unauthorized` will be returned (already described above).
    * `Channel` should still be valid (`channel.validUntil > NOW`) otherwise `400 Bad Request` will be returned with response body:

    ```json
    {
        "success": false,
        "statusCode": 400,
        "message": "channel is expired"
    }
    ```

    2. If the request has a `CLOSE` event, it should contain **only** a `CLOSE` event, and it can be send:
        * only by the `Channel` creator (`channel.creator`) if the *withdraw period* **hasn't** started
        OR
        * by any of the `Channel` validators (`channel.spec.validators`) if the *withdraw period* **has** started

    Otherwise it will return an `403 Forbidden` response.

    Error response:

    ```json
    {
        "success": false,
        "statusCode": 403
    }
    ```

    **NB:** *Withdraw period* has started when `NOW > channel.spec.withdrawPeriodStart`

    3. If the request has a `UPDATE_TARGETING` event, it should contain **only** an `UPDATE_TARGETING` event and it can be send **only** by the `Channel`'s creator (`channel.creator`) otherwise an `403 Forbidden` response will be returned.

    Error response:

    ```json
    {
        "success": false,
        "statusCode": 403
    }
    ```

    4. Payout events (see bellow) are accepted **only** if the `Channel`'s *withdraw period* **hasn't** started, otherwise a `400 Bad Request` response will be returned:

    Error response:

    ```json
    {
        "success": false,
        "statusCode": 400,
        "message": "channel is in withdraw period"
    }
    ```

    **NB:** *Withdraw period* has started when `NOW > channel.spec.withdrawPeriodStart`

    5. If `CF-IPCountry` header is set to `XX` (used by [CloudFlare](https://cloudflare.com) for clients without country code data) or if the [`Referer`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer) header hostname is either `localhost` or `127.0.0.1` a `403 Forbidden` response will be returned.

    Error response:

    ```json
    {
        "success": false,
        "statusCode": 403,
        "message": "event submission restricted"
    }
    ```

    6. Next the `Event Submission Rules` (`channel.spec.eventSubmission`) are applied, you can check [CampaignSpec EventSubmissionRule](../campaignSpec.md#EventSubmissionRule) for more details. If rate limits apply a response `429 Too Many Requests` will be returned with body:

    ```json
    {
        "success": false,
        "statusCode": 429,
        "message": "{Message}"
    }
    ```

    Where `{Message}` is one of the following:
    * `rateLimit: only allows 1 event`
    * `rateLimit: unauthenticated request`
    * `rateLimit: too many requests`

    **NB:** This list may include other messages in the future for features like bot prevention.

    7. If the request includes `Payout Events` (`CLICK` and `IMPRESSION`), there should always be a payout to an address after applying `Targeting rules` (see [Targeting and Bidding][Targeting and Bidding] for more information) or an error response will be returned with a **custom** `469` Http status code:

    ```json
    {
        "success": false,
        "statusCode": 469,
        "message": "no event payout"
    }
    ```

    Successful response (`200 OK`):

    ```json
    {
        "success": true
    }
    ```

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

Each validator message has to be signed by the validator themselves.

OUTPACE generic:

* `NewState`: proposes a new state
* `ApproveState`: approves a `NewState`
* `Heartbeat`: validators send that periodically; once there is a Heartbeat for every validator, the channel is considered `LIVE`
* `RejectState`: sent back to a validator that proposed an invalid `NewState`
* `Accounting`: aggregated state of the balances before and after applied validator fees

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

Other than that, the advertiser may adjust the amount that they want to pay dynamically, as well as [`Targeting rules`][Targeting and Bidding], during the course of the campaign. They may also adjust the amount for each individual publisher through the [`Targeting rules`][Targeting and Bidding]. This is done by sending a validator message (`UPDATE_TARGETING`) to both validators.


## DB structure

* Channels
* Messages
* EventAggregates

[Targeting and Bidding]: ../targetingAndBidding.md
