## AdSlot

Ad Slot represents Publisher ad space entity for displaying [Ad Units][Ad Unit] with the following fields:

##### Spec properties (added to [ipfs] and can NOT be modified) 

* `ipfs`: string, valid [ipfs] hash of spec props below
* `type`: string, the type of the ad slot that will match [Ad Unit] `type`
* `tags`: an array of [TargetingTag], meant for discovery between publishers/advertisers
* `owner`: user address from the session
* `created`: number, UTC timestamp in milliseconds, used as nonce for escaping duplicated spec [ipfs] hashes

##### Non spec properties (not added to ipfs and CAN be modified*)

* `title`: string, the name of the unit used in platform UI
* `description`: string, arbitrary text used in platform UI
* `fallbackUnit`: string, valid [ipfs] hash for [Ad Unit] object. It will be used as fallback data. It is optional
* `archived`: boolean, user can change it - used for filtering in platform UI
* `modified`: number, UTC timestamp in milliseconds, changed every time modifiable property is changed


[Ad Unit]: https://github.com/AdExNetwork/adex-protocol/blob/master/campaignSpec.md#adunit
[TargetingTag]: https://github.com/AdExNetwork/adex-protocol/blob/master/campaignSpec.md#targetingtag
[ipfs]: https://ipfs.io/