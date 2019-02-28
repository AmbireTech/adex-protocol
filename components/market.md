# AdEx Market

The `adex-market` (formerly named `adex-node`) is the RESTful service responsible for the discovery of advertising demand and supply.

To be more precise, it facilitates submission and tracking of campaigns, as well as user registrations.

**NOTE:** in AdEx, a campaign is a superset of a channel; when talking about the Market, we will use "campaign", but when pulling information from the validators, we are usually interacting with the `/channel` Sentry API

## Tracking all campaigns

The primary job of the market is to allow for advertisers to register their campaigns, and to track the campaign state after.

This is accomplished by querying each individual validator about the channel state periodically.

**Please note:** each publisher should rely on their publisher-side platform to track the demand for them. The Market only aggregates the information from vaidators to facilitate discovery.

## Configuration

The Market must be configured with a list of validators beforehand, as well as whether we want to enable further methods of discovery.

For example:


```json
{
	"initialValidators": ["https://one.adex.network", "https://thirdpartyvalidator.network"],
	"discoverValidators": {
		"enabled": true
	}
}
```


## AdEx Validator (Sentry node) discovery

Currently, the only method of discovering validators that are not in the configuration set, is by scanning channels and aggregating validator information from the [`campaignSpec`][campaignSpec] field of the channels it scrapes.

For example, if we start with one validator in `initialValidators`, and it reports 3 channels, each of these 3 channels will have one more validator that we'll discover. If we repeat this cycle, we will discover even more channels and validators.

Discovery methods we plan to implement in the future:

* [AdEx Registry](https://github.com/adexnetwork/adex-protocol#registry)
* ENS + DNSSEC
* Kademlia DHT

Even though the AdEx Registry is the only method here that ensures validator reputation, any method is valuable if we want the market to be aware of as many validators/campaigns as possible.


## API

### campaigns

#### GET /campaigns

This will return all campaigns (paginated to a maximum of 100 results, through `?limit` and `?skip`)

By default, this will return all the `Active` or `Ready` campaigns. Use `?status` to get campaigns with a different status. You can filter by multiple status values, e.g. `?status=Ready,Active`

Each campaign will have:

* id
* status
* creator
* validUntil
* [campaignSpec]
* depositAsset
* depositAmount

#### GET /campaigns/:id

This will return detailed information about each campaign, such as:

* leaderBalanceTree
* followerBalanceTree


### validators

Validators are identified by their Ethereum address in the `Channel` data structure, but in order to send events to them, you need the HTTPS address of their Sentry node.
In order to find the HTTPS address, you can query this resource.

#### GET /validators

Returns all validators this Market knows of.

#### GET /validators/status=status

Allows filtering returned validators by status (active, offline).

#### GET /validators?addr=ethereumAddress

Returns all validators with that Ethereum address. It should usually return one validator.


### users

#### POST /user

Allows publishers/advertisers to register by providing a signed message. This will work even if you're using an [Identity contract]: in this case you need to provide a signed message which recovers an address that has at least `Transactions` privilege level at time of submission.

Registration is not mandatory. The only purpose here is to signal your intent to be displayed as an advertiser/publisher in the Explorer.

#### GET /user/list

Lists registered users 

`?hasInteracted` - adresses that have interacted with channels (opened or withdrew from channels)


### stats

#### GET /stats

Returns:

* publisherCount - all the registered publishers where `hasInteracted` is true
* advertiserCount - all the registered advertisers where `hasInteracted` is true
* anonPublisherCount - count of all non-registered earners that appear in campaign balance trees (that are not validators)
* anonAdvertiserCount - count of all non-registered advertisers (creators of campaigns)
* campaignCount
* campaignsByStatus: campaigns by status, counted
* totalSpentFundsByAssetType

At some point, we may add a method that returns an aggregated list of all ad units found in [`campaignSpec`][campaignSpec] fields of known campaigns.

## Advertiser and Publisher data

This routes requires user [authentication][auth] with `x-user-signature` header.

Advertisers can add and get their [Ad Units][Ad Unit] and Publishers [Ad Slots][Ad Slot]

### auth

#### POST /auth

Post body params:

* `identity`: string, identity contract address, will be used `owner` prop in [Ad unit] and [Ad Slot]
* `address`: string, user eth address which signs the `authToken`, we check if the address has `privileges > 0` in the `identity` contract address
* `signature`: string, signature of the signed hash param 
* `mode`: number, the way data is signed. `0` for EIP signature (Metamask), `1` for ETH Personal sig (GETH, LEDGER), `2` for Trezor (Legacy)
* `authToken`: number, random integer  
* `hash`: string, hash of the signed typed data `[{ type: 'uint', name: 'Auth token', value: authToken }]`

Returns user session in JSON format:

* `status`: `"OK"` if `address` match the recovered address from `signature`, `mode`, and `hash`, and has `privileges > 0` in the `identity` contract address
* `identity`: string, the verified identity
* `signature`: string, checked signature to be used as `x-user-signature` header for accessing `/media`, `/unit`, and `/slot` endpoints
* `expiryTime`: number, UTC timestamp in milliseconds until the session is active

### media

#### POST /media

Accepts `Multipart form data` with `media` field for the media blob and `media-type` field for the media type and returns ipfs hash/

Returns:

* `ipfs`, string with [ipfs] hash 

### Ad Units

#### POST /unit

Accepts JSON in valid [Ad Unit] format.
Adds the data from the [Ad Unit] to ipfs

Returns:

[Ad Unit] JSON plus ipfs hash

#### GET /unit
Use `?limit` and `?skip` for pagination. 

Returns aray with user's [Ad Units][Ad Unit].

#### GET /unit/:id

Returns [Ad Unit] bi it's [ipfs] hash

### Ad Slots

#### POST /slot
Accepts JSON in valid [Ad Slot] format.
Adds the data from the [Ad Slot] to ipfs

Returns:

[Ad Slot] JSON plus ipfs hash

#### GET /slot
Use `?limit` and `?skip` for pagination. 

Returns aray with user's [Ad Slots][Ad Slot].

## Internals

### Discovery loop

Every tick, we go through all the validators, and:

1. query the `/channel/list`
2. for each channel, we create a corresponding campaign entry (if we didn't already)
3. for each channel, we record every validator that we didn't know of

### Status loop

This loop starts with all the campaigns that we know of.

For each campaign:

1. It queries `/channel/:id/validator-messages` of every validator
2. Determines the status from all of the responses
3. Saves the status and a timestamp of when the status was last updated

The status is determined:

* `Initializing`: there are no messages at all for at least one validator
* `Offline`: at least one validator doesn't have a recent `Heartbeat` message
* `Disconnected`: validators have recent `Heartbeat` messages, but they don't seem to be propagating messages between one another (the majority of Heartbeats are not found on both validators)
* `Invalid`: there are recent `NewState` messages, but the follower does not issue or propagate `ApproveState`
* `Unhealthy`: there are recent `NewState` and `ApproveState`, but the `ApproveState` reports unhealthy
* `Ready`: both validators have a recent `Heartbeat` but a `NewState` has never been emitted
* `Active`: there are recent `NewState`, `ApproveState` and `Heartbeat`'s, and the `ApproveState` reports healthy
* `Exhausted`: all of the funds in the channel have been distributed
* `Expired`: the channel is expired

For simplicity, initial implementations might merge `Disconnected` and `Invalid`

Later, we will add detailed status reports: for example, "validator A is offline: has not produced any messages since ..."

For discussion, see https://github.com/AdExNetwork/adex-market/issues/1


## Discovering campaigns without a Market service: adex-market library

In reality, running a Market service is nothing more than an optimization: the same procedures described in [internals](#internals) could be ran directly at the dApp or the SDK. The Market service aggregates all this data so that the dApp/SDK don't need to send requests to every validator in the network on every user impression.

However, we also provide an ability to use the `adex-market` repository as a library: if you only want to pull demand from a few validators, you can do that directly in your usecase without depending on another service.

The library exposes both the discovery loop and the status loop.


## Full process to get discovered

The full process to get your campaign discovered by the dApp/SDK is:

1. Create a campaign; this creates an OUTPACE channel on the Ethereum blockchain
2. Send the campaign/channel information to every validator you've elected
3. Once each validator ensures that the channel exists, and there are funds locked up in it, it will start returning it in `/channel/list` and issuing `Heartbeat` messages
4. At this stage, the Market will discover it
5. Once both validators have issued a `Heartbeat`, the status will turn into `Ready`

Channels that are `Ready` or `Active` will be considered by the SDK


## Explorer

The AdEx Explorer is a user interface directly on top of the Market, designed to provide all the detailed information the Market contains in an accessible way.

It uses third-party APIs to provide extra information that's not available in the Market, for example:

* Provides a list of all channels on the Ethereum blockchain that are not associated with a validator
* Provides the USD/EUR value of campaign deposits


[campaignSpec]: https://github.com/AdExNetwork/adex-protocol/blob/master/campaignSpec.md
[Ad Unit]: https://github.com/AdExNetwork/adex-protocol/blob/master/campaignSpec.md#adunit
[Ad Slot]: https://github.com/AdExNetwork/adex-protocol/blob/master/adSlot.md
[auth]: #auth
[ipfs]: https://ipfs.io/
[Identity contract]: https://github.com/AdExNetwork/adex-protocol-eth/blob/master/contracts/extra/Identity.sol