# AdEx Market

The `adex-market` (formerly named `adex-node`) is the RESTful service responsible for the discovery of advertising demand and supply.

To be more precise, it facilitates submission and tracking of campaigns, as well as user registrations.


## Tracking all campaigns

The primary job of the market is to allow for advertisers to register their campaigns, and to track the campaign state after.

This is accomplished by querying each individual validator about the channel state periodically.

**Please note:** each publisher should rely on their publisher-side platform to track the demand for them. The Market only aggregates the information from vaidators to facilitate discovery.

## Configuration

The Market must be configured with a list of validators beforehand, as well as whether we want to enable further methods of discovery.

e.g.

```
{
	initialValidators: ['https://one.adex.network', 'https://thirdpartyvalidator.network'],
	discover Validators: {
		enabled: true
	}
}
```


## AdEx Validator (Sentry node) discovery

Currently, the only method of discovering validators that are not in the configuration set, is by scanning channels and aggregating validator information from the `campaignSpec` field of the channels it scrapes.

For example, if we start with one validator in `initialValidators`, and it reports 3 channels, each of these 3 channels will have one more validator that we'll discover. If we repeat this cycle, we will discover even more channels and validators.

Discovery methods we plan to implement in the future:

* [AdEx Registry](https://github.com/adexnetwork/adex-protocol#registry)
* ENS + DNSSEC
* Kademlia DHT

Even though the AdEx Registry is the only method here that ensures validator reputation, any method is valuable if we want the market to be aware of as many validators/campaigns as possible.


## API

### campaigns

### users

### validators

Validators are identified by their Ethereum address in the `Channel` data structure, but in order to send events to them, you need the HTTPS address of their Sentry node.
In order to find the HTTPS address, you can query this resource.

#### GET /validators

Returns all validators this Market knows of.

#### GET /validators/status=status

Allows filtering returned validators by status (active, offline).

#### GET /validators?addr=ethereumAddress

Returns all validators with that Ethereum address. It should usually return one validator.



## Internals

### Discovery loop

Every tick, 


### Status loop


## Discovering campaigns without a Market service

In reality, running a Market service is nothing more than an optimization: the same procedures described in [internals](#internals) could be ran directly at the dApp or the SDK. The Market service aggregates all this data so that the dApp/SDK don't need to send requests to every validator in the network on every user impression.

However, we also provide an ability to use the `adex-market` repository as a library: if you only want to pull demand from a few validators, you can do that directly in your usecase without depending on another service.


