## AdSlot

Ad Slot represents Publisher ad space entity for displaying [Ad Units][Ad Unit] with the following fields:

##### Spec properties (added to [ipfs] and can NOT be modified) 
* `type`: string, the type of the ad slot that will match [Ad Unit] `type`
* `tags`: an array of [TargetingTag], meant for discovery between publishers/advertisers
* `owner`: user address from the session
* `createdOn`: number, UTC timestamp in milliseconds, used as nonce for escaping duplicated spec [ipfs] hashes

##### Non spec properties (not added to ipfs and CAN be modified*)
* `ipfs`: string, valid [ipfs] hash of spec props *can NOT be modified. Unit should be 
* `title`: string, the name of the unit used in platform UI
* `description`: string, arbitrary text used in platform UI
* `fallbackMediaUrl`: string, a URL to the resource (usually PNG); must use the `ipfs://` protocol, to guarantee data immutability. It will be displayed int the ad slot space if there are no active campaigns for that slot
* `fallbackMediaMime`: string, MIME type of the media, possible values at the moment are: `image/jpeg`, `image/png`
* `fallbackTargetUrl`: string, a URL to that will be open in case of non active campaigns
* `archived`: boolean, user can change it - used for filtering in platform UI
* `modifiedOn`: number, UTC timestamp in milliseconds, changed every time modifiable property is changed


[Ad Unit]: https://github.com/AdExNetwork/adex-protocol/blob/master/campaignSpec.md#adunit
[TargetingTag]: https://github.com/AdExNetwork/adex-protocol/blob/master/campaignSpec.md#targetingtag