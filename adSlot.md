## Ad Slot

Ad Slot represents Publisher ad space entity for displaying [Ad Units][Ad Unit] with the following fields:

* `type`: string, the type of the ad slot that will match [Ad Unit] `type`
* `fallbackMediaUrl`: string, a URL to the resource (usually PNG); must use the `ipfs://` protocol, to guarantee data immutability. It will be displayed int the ad slot space if there are no active campaigns for that slot
* `fallbackTargetUrl`: string, a URL to that will be open in case of non active campaigns
* `tags`: an array of [TargetingTag], meant for discovery between publishers/advertisers
* `owner`: user address from the session


[Ad Unit]: https://github.com/AdExNetwork/adex-protocol/blob/master/campaignSpec.md#adunit
[TargetingTag]: https://github.com/AdExNetwork/adex-protocol/blob/master/campaignSpec.md#targetingtag