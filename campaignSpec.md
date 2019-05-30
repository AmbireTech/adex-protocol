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

### campaignSpec format: v1.0.0-beta

**NOTE:** all monetary values are represented as a string that represents a decimal BigNumber in the channel asset unit (BigNumString)

* `title`: string, used mostly for advertisers own info
* `validators`: an array of [Validator](#validator) objects; should always be 2 elements, first being the leader, second being the follower
* `maxPerImpression`: BigNumStr, a maximum payment per impression
* `minPerImpression`: BigNumStr, minimum payment offered per impression
* `targeting`: optional, an array of [TargetingTag](#targetingtag)
* `minTargetingScore`: optional, Number; minimum targeting score
* `eventSubmission`: [EventSubmission](#eventsubmission) object, applies to event submission (POST `/channel/:id/events`)
* `created`: Number, a millisecond timestamp of when the campaign was created
* `activeFrom`: optional, Number, a millisecond timestamp representing the time you want this campaign to become active; used by the [`AdViewManager`](https://github.com/AdExNetwork/adex-adview-manager)
* `nonce`: BigNumStr, a random number to ensure the campaignSpec hash is unique
* `withdrawPeriodStart`: Number, a millisecond timestamp of when the campaign should enter a withdraw period (no longer accept any events other than `CHANNEL_CLOSE`); a sane value should be lower than `channel.validUntil * 1000` and higher than `created`; it is recommended to set this at least one month prior to `channel.validUntil * 1000`
* `adUnits`: optional, an array of [AdUnit](#Adunit)


#### Validator

* `id`: string, the corresponding value in `channel.validators`
* `url`: string, a HTTPS URL to the validator's sentry
* `fee`: BigNumStr, the total fee that will be paid out to this validator when they distribute the whole remaining channel deposit

#### TargetingTag

* `tag`: string, arbitrary tag name
* `score`: number, from 0 to 100

**NOTE:** the SDK will use this by intersecting it with the user's `TargetingTag` array, multiplying the scores of all `TargetingTag`s with the same `tag`, and summing all the products. For example, if a certain `AdUnit` has `[{tag: 'location_US', score: 5}, { tag: 'location_UK', score: 8 }]`, and the user has `[{ tag: 'location_UK', score: 100 }]`, the end result will be 800.


#### EventSubmission

Rules that apply to submitting events

* `allow`: array of `EventSubmissionRule`; for each POST to `/channel/:id/events`, the first rule that matches will apply

##### EventSubmissionRule

* `uids`: array of used IDs that this rule applies to; leave `null` for applying to everyone (note that subsequent rules in `allow` won't match); set to `[null]` to apply to requests without authentication
* `rateLimit`: optional, object describing the rate limit to apply; for, this takes `{ type: "ip", timeframe }`, where `timeframe` is a number; later, `{ type: "uid", timeframe }` will be added

##### Examples

`{ allow: [{ uids: null, rateLimit: { type: "ip", timeframe: 1000 } }] }` - this will allow everyone to submit events, at a rate of 1 event per second per IP

`{ allow: [{ uids: [channel.creator] }, { uids: null, rateLimit: { type: "ip", timeframe: 1000 } }] }` - this will allow the creator to submit as many events as they like, but everyone else will be restricted to 1 event per second per IP


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
