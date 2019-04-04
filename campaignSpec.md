## Overview

The `spec` field within each channel describes the campaign it's associated with.

`campaignSpec` refers to the format of describing ad campaigns.

If a channel is associated with a campaign (in practice, all channels created by the AdEx dapp are), it's `spec` field would be set to an [IPFS] hash to a JSON blob of [the `campaignSpec` wrapper](#campaignSpec-wrapper).

Within the validator stack, the `campaignSpec` can be either downloaded from [IPFS] by the watcher or submitted directly to the Sentry.

### campaignSpec wrapper

Because the `campaignSpec` format needs to be able to evolve rapidly, we require that channels point to a wrapper that also contains the format version

* `version`: a semver version of the format
* `body`: the `campaignSpec` body

Example: `{ "version": "1.0.0-alpha",  "body": "..." }`

### campaignSpec format: v1.0.0-alpha

**NOTE:** this format is unstable, it might change a lot

**NOTE:** all monetary values are represented as a string that represents a decimal BigNumber in the channel asset unit (BigNumString)

* `adUnits`: an array of [AdUnit](#Adunit)
* `validators`: an array of Validator objects; should always be 2 elements, first being the leader, second being the follower
* `maxPerImpression`: BigNumStr, a maximum payment per impression
* `minPerImpression`: BigNumStr, minimum payment offered per impression
* `targeting`: an array of TargetingTag, optional
* `created`: Number, a millisecond timestamp of when the campaign was created
* `nonce`: BigNumStr, a random number to ensure the campaignSpec hash is unique
* `gracePeriodStart`: Number, a millisecond timestamp of when the campaign should enter a grace period (no longer accept any events other than `CHANNEL_CLOSE`); a sane value should be lower than `channel.validUntil * 1000` and higher than `created`; it is recommended to set this at least one month prior to `channel.validUntil * 1000`

#### AdUnit

##### Spec properties (added to [ipfs] and can NOT be modified) 

* `type`: string, the type of the ad unit; currently, possible values are: `legacy_250x250`, `legacy_468x60`, `legacy_336x280`, `legacy_728x90`, `legacy_120x600`, `legacy_160x600` see [IAB ad unit guidelines](https://www.soflaweb.com/standard-banner-sizes-iab-ad-unit-guidelines/) and `iab_flex_{adUnitName}` (see [IAB's new ad portfolio](https://www.iab.com/newadportfolio/) and [PDF](https://www.iab.com/wp-content/uploads/2017/08/IABNewAdPortfolio_FINAL_2017.pdf))
* `mediaUrl`: string, a URL to the resource (usually PNG); must use the `ipfs://` protocol, to guarantee data immutability
* `mediaMime`: string, MIME type of the media, possible values at the moment are: `image/jpeg`, `image/png`
* `targetUrl`: string, the advertised URL
* `targeting`: an array of [TargetingTag](TargetingTag), optional
* `tags`: an array of [TargetingTag](#TargetingTag), meant for discovery between publishers/advertisers
* `owner`: user address from the session
* `created`: number, UTC timestamp in milliseconds, used as nonce for escaping duplicated spec [ipfs] hashes

##### Non spec properties (not added to ipfs and CAN be modified*)

* `ipfs`: string, valid [ipfs] hash of spec props *can NOT be modified. Unit should be accessible by this [ipfs] hash
* `title`: string, the name of the unit used in platform UI
* `description`: string, arbitrary text used in platform UI
* `archived`: boolean, user can change it - used for filtering in platform UI
* `modified`: number, UTC timestamp in milliseconds, changed every time modifiable property is changed

#### Validator

* `addr`: string, the corresponding value in `channel.validators`
* `url`: string, a HTTPS URL to the validator's sentry
* `fee`: BigNumStr, the total fee that will be paid out to this validator when they distribute the whole remaining channel deposit

#### TargetingTag

* `tag`: string, arbitrary tag name
* `score`: number, from 0 to 100

**NOTE:** the SDK will use this by intersecting it with the user's `TargetingTag` array, multiplying the scores of all `TargetingTag`s with the same `tag`, and summing all the products. For example, if a certain `AdUnit` has `[{tag: 'location_US', score: 5}, { tag: 'location_UK', score: 8 }]`, and the user has `[{ tag: 'location_UK', score: 100 }]`, the end result will be 800.

@TODO max events per user? also, how to define a "user"?
@TODO cancellation fee? may make fund distribution math more complex...; however, paying out the full validator fee is essentially *like* a cancellation fee

[ipfs]: https://ipfs.io/
