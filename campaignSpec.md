## Overview

The `spec` field within each channel describes the campaign it's associated with.

`campaignSpec` refers to the format of describing ad campaigns.

If a channel is associated with a campaign (in practice, all channels created by the AdEx dapp are), it's `spec` field would be set to an IPFS hash to a JSON blob of [the `campaignSpec` wrapper](#campaignSpec-wrapper).

Within the validator stack, the `campaignSpec` can be either downloaded from IPFS by the watcher or submitted directly to the Sentry.

### campaignSpec wrapper

Because the `campaignSpec` format needs to be able to evolve rapidly, we require that channels point to a wrapper that also contains the format version

* `version`: a semver version of the format
* `body`: the `campaignSpec` body

Example: `{ "version": "1.0.0-alpha",  "body": "..." }`

### campaignSpec format: v1.0.0-alpha

**NOTE:** this format is unstable, it might change a lot

**NOTE:** all monetary values are represented as a string that represents a decimal BigNumber in the channel asset unit (BigNumString)

**NOTE:** currently, we use separate `leader`/`follower` fields for validators rather than using an array of validators; this is because [Validator stack implementation](https://github.com/adexnetwork/adex-validator-stack-js), which this version of the format is intended to work with, only supports 2 validators

* `adUnits`: an array of AdUnit
* `leader`: a Validator, corresponding to `channel.validators[0]`; also called "Advertiser-side Platform"
* `follower`: a Validator, corresponding to `channel.validators[1]`; also called "Publisher-side Platform"
* `maxPerImpression`: BigNumStr, a maximum payment per impression
* `minPerImpression`: BigNumStr, minimum payment offered per impression
* `targeting`: an array of TargetingTag, optional
* `created`: a millisecond timestamp of when the campaign was created

#### AdUnit

* `type`: string, the type of the ad unit; currently, possible values are: `legacy_250x250`, `legacy_468x60`, `legacy_336x280`, `legacy_728x90`, `legacy_120x600`, `legacy_160x600` see [IAB ad unit guidelines](https://www.soflaweb.com/standard-banner-sizes-iab-ad-unit-guidelines/) and `iab_flex_{adUnitName}` (see [IAB's new ad portfolio](https://www.iab.com/newadportfolio/) and [PDF](https://www.iab.com/wp-content/uploads/2017/08/IABNewAdPortfolio_FINAL_2017.pdf))
* `url`: string, a URL to the resource (usually PNG); must use the `ipfs://` protocol, to guarantee data immutability
* `targeting`: an array of TargetingTag, optional

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
