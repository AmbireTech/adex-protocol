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

**NOTE:** all monetary values are represented as a string that represents a decimal BigNumber in the channel asset unit

* `adUnits`: an array of `{ url: string, size: string }`
* `validators`: an array of `{ addr: string, url: string, fee: BigNumStr }`; validators must directly correspond to the channel validators (same count and order)
* `maxPerImpression`: BigNumStr, a maximum payment per impression
* `minPerImpression`: BigNumStr, minimum payment offered per impression
* `targeting`: an array of `{ tag: string, score: uint }`

@TODO max events per user? also, how to define a "user"?
