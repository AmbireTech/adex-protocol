## Overview

The `spec` field within each channel describes the campaign it's associated with.

`campaignSpec` refers to the format of describing ad campaigns.

If a channel is associated with a campaign (in practice, all channels created by the AdEx dapp are), it's on-chain `spec` field would be set to a sha256 hash of the JSON blob of the `channel.spec` field.

Within the validator stack, the `spec` is submitted as part of the POST `/channel` request.

### campaignSpec wrapper

Because the `campaignSpec` format needs to be able to evolve rapidly, we can use a wrapper that also contains the format version.

**Please note,** this wrapper format is not in use as of Q1 2019 (v4.0). If we decide to use it later, we can obsolete the `channel.spec` field and introduce another field which contains this wrpaper.

* `version`: a semver version of the format
* `body`: the `campaignSpec` body

Example: `{ "version": "1.0.0-beta",  "body": "..." }`

### campaignSpec format: v1.0.0-beta2

**NOTE:** all monetary values are represented as a string that represents a decimal BigNumber in the channel asset unit (BigNumString)

* `title`: string, used mostly for advertisers own info
* `validators`: an array of [Validator](#validator) objects; should always be 2 elements, first being the leader, second being the follower
* `pricingBounds`: a map of `evType` -> `Bounds`, where `Bounds` is an object that has `min`/`max`, both of them BigNumStr; defines the min/max prices for events; e.g. `{ CLICK: { min: "0", max: "1000" } }`
* `maxPerImpression`: BigNumStr, a maximum payment per impression; **OBSOLETE**, only used if `pricingBounds` is missing an `IMPRESSION` entry
* `minPerImpression`: BigNumStr, minimum payment offered per impression; **OBSOLETE**, only used if `pricingBounds` is missing an `IMPRESSION` entry
* `targeting`: optional, an array of [TargetingTag](#targetingtag)
* `minTargetingScore`: optional, Number; minimum targeting score
* `eventSubmission`: [EventSubmission](#eventsubmission) object, applies to event submission (POST `/channel/:id/events`)
* `created`: Number, a millisecond timestamp of when the campaign was created
* `activeFrom`: optional, Number, a millisecond timestamp representing the time you want this campaign to become active; used by the [`AdViewManager`](https://github.com/AdExNetwork/adex-adview-manager)
* `nonce`: BigNumStr, a random number to ensure the campaignSpec hash is unique
* `withdrawPeriodStart`: Number, a millisecond timestamp of when the campaign should enter a withdraw period (no longer accept any events other than `CHANNEL_CLOSE`); a sane value should be lower than `channel.validUntil * 1000` and higher than `created`; it is strongly recommended to set this at least one month prior to `channel.validUntil * 1000`, to allow enough time for earnings to be claimed by everyone
* `adUnits`: optional, an array of [AdUnit](#Adunit)
* `priceMultiplicationRules`: optional, an array of [PriceMultiplicationRules](#pricemultiplicationrules)
* `priceDynamicAdjustment`: `bool` Enable dynamic price adjustment. The implementation detail is [here](#dynamic-price-adjustment)

#### Validator

* `id`: string, the corresponding value in `channel.validators`
* `url`: string, a HTTPS URL to the validator's sentry
* `fee`: BigNumStr, the total fee that will be paid out to this validator when they distribute the whole remaining channel deposit
* `feeAddr`: string, an address where the fee would be received; optional - if it's not provided, `id` will be used

#### TargetingTag

* `tag`: string, arbitrary tag name
* `score`: number, from 0 to 100

**NOTE:** the [Adview](https://github.com/adexnetwork/adex-adview-manager) will use this by intersecting it with the user's `TargetingTag` array, multiplying the scores of all `TargetingTag`s with the same `tag`, and summing all the products. For example, if a certain `AdUnit` has `[{tag: 'location_US', score: 5}, { tag: 'location_UK', score: 8 }]`, and the user has `[{ tag: 'location_UK', score: 100 }]`, the end result will be 800.


#### EventSubmission

Rules that apply to submitting events

* `allow`: array of `EventSubmissionRule`; for each POST to `/channel/:id/events`, the first rule that matches will apply

**NOTE:** submission rules (limits) apply to channels as a whole, rather than individual ad units. This means that, a single campaign will only be counted once per the `rateLimit` window, no matter how many ad units are shown to the user

##### EventSubmissionRule

* `uids`: array of user IDs that this rule applies to; leave `null` for applying to everyone (note that subsequent rules in `allow` won't match); set to `[null]` to apply to requests without authentication
* `evTypes`: array of event types that this rule applies to; leave `null` for applying to all events
* `rateLimit`: optional, object describing the rate limit to apply; for, this takes `{ type, timeframe }`, where `timeframe` is a number of milliseconds; `type` can be `"ip"` or `"uid"`
   * the `"ip"` type limits by the user IP; it won't allow multiple events to be submitted with one request
   * the `"uid"` type limits by the user ID; it won't allow any event submissions if the request is not authenticated

##### Examples

`{ allow: [{ uids: null, rateLimit: { type: "ip", timeframe: 1000 } }] }` - this will allow everyone to submit events, at a rate of 1 event per second per IP

`{ allow: [{ uids: null }] }` - this will allow everyone to submit events with no limit

`{ allow: [{ uids: null, rateLimit: { type: "ip", timeframe: 1000 } }, { uids: null, rateLimit: { type: "uid", timeframe: 1000 } }] }` - will apply both an IP limit and a SID limit

`{ allow: [{ uids: [channel.creator] }, { uids: null, rateLimit: { type: "ip", timeframe: 1000 } }] }` - this will allow the creator to submit as many events as they like, but everyone else will be restricted to 1 event per second per IP

#### PriceMultiplicationRules

One of `multiplier` or `amount` is mandatory and `multiplier` is a float, `amount` is a BigNumber. All the others are optional and are arrays of possible values to match where not providing it means "match everything" e.g. not providing a publisher means "match any publisher".

In cases where an event matches more than one rule if any of the rules is a fixed `amount` rule, we apply the first fixed `amount` rule and ignore the rest, but if all the matching rules are `multiplier` we apply them all to the event's `pricingBounds.min` price.

* `multiplier / amount`: multiplier or amount in float & BigNumber format respectively
* `evType`: an (optional) array of event types e.g. `['IMPRESSION']`
* `publisher`: an (optional) array of publisher ids e.g. `['0x2992f6C41E0718eeeDd49D98D648C789668cA66d']`
* `osType`: an (optional) array of mobile/desktop operating system types e.g. `['Android', 'macosx']`
* `country`: an (optional) array of country of request origin e.g `['US', 'UK']`

##### Examples

`{ multiplier: 1.2, evType: ['IMPRESSION'], country: ['US'] }` - A rule to multiply only impression event from the US by 1.2

`{ amount: '10000', evType: ['IMPRESSION'], country: ['US'] }` - A rule that sets a fixed amount for only impression event from the US

`{ amount: '10000', evType: ['CLICK'], country: ['US'], publisher: ['0x', '0y'], osType: ['Android'] }` - A rule that sets a fixed amount for only click events from the US created by publisher `0x`, `0y` and from `Android` devices

`{ amount: '10000', country: ['US'] }` - A rule that sets a fixed amount for all event types (i.e. impressions, click) from publishers in the `US`

`{ amount: '1' }` - A rule that sets a fixed amount for any event / country / osType / publisher

#### AdUnit

##### Spec properties (added to [ipfs] and can NOT be modified) 

* `ipfs`: string, valid [ipfs] hash of spec props below
* `type`: string, the type of the ad unit; currently, possible values are: `legacy_300x250`, `legacy_250x250`, `legacy_240x400`, `legacy_336x280`, `legacy_180x150`, `legacy_300x100`, `legacy_720x300`, `legacy_468x60`, `legacy_234x60`, `legacy_88x31`, `legacy_120x90`, `legacy_120x60`, `legacy_120x240`, `legacy_125x125`, `legacy_728x90`, `legacy_160x600`, `legacy_120x600`, `legacy_300x600`, see [IAB ad unit guidelines](https://www.soflaweb.com/standard-banner-sizes-iab-ad-unit-guidelines/) and `iab_flex_{adUnitName}` (see [IAB's new ad portfolio](https://www.iab.com/newadportfolio/) and [PDF](https://www.iab.com/wp-content/uploads/2017/08/IABNewAdPortfolio_FINAL_2017.pdf))
* `mediaUrl`: string, a URL to the resource (usually PNG); must use the `ipfs://` protocol, to guarantee data immutability
* `mediaMime`: string, MIME type of the media, possible values at the moment are: `image/jpeg`, `image/png`
* `targetUrl`: string, the advertised URL
* `targeting`: an array of [TargetingTag](#TargetingTag)
* `minTargetingScore`: optional, Number; minimum targeting score
* `tags`: an array of [TargetingTag](#TargetingTag), optional, meant for discovery between publishers/advertisers
* `owner`: user address from the session
* `created`: number, UTC timestamp in milliseconds, used as nonce for escaping duplicated spec [ipfs] hashes

##### Non spec properties (not added to ipfs and CAN be modified)

* `title`: string, the name of the unit used in platform UI
* `description`: string, arbitrary text used in platform UI
* `archived`: boolean, user can change it - used for filtering in platform UI
* `modified`: number, UTC timestamp in milliseconds, changed every time modifiable property is changed

[ipfs]: https://ipfs.io/


##### Dynamic Price Adjustment

*WARNING:* this is **not** supported yet

Generate price steps from min/max price defined in `pricingBounds`; this can happen either based on a fixed step (e.g 0.01/1000) or by dividing the min/max difference by some number (e.g. 30 to produce 30 steps), or by some combination every hour, retrieve the total from the campaign for the last hour, hourlyVolume; calculate the (deposit - totalPaidOut) / hoursUntilWithdrawPeriodStart as targetHourlyVolume; if `hourlyVolume` > `targetHourlyVolume`, step the price down, and vice versa.
