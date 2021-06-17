## Glossary

Throughout this document, "AdEx Profile" refers to the system described in #15, also called Lounge.

## Overview

This document describes the specification of the targeting and bidding system in AdEx.

This system spans across almost all components: AdView, Market, Validator.

It's designed with the following goals:
* Ability to "strict match" (e.g. "Only News websites") while combining it with other requirements (e.g. "only tier 1 traffic" or "exclude tier 3 traffic")
* Clarity: targeting rules are easy to understand (e.g. "only audiences from tier 2 traffic, in News websites")
* Ability to combine different requirements logically (e.g. "is a young male or a middle aged female")
* Ability to strictly exclude certain audiences (e.g. "no incentive traffic" or "exclude those publishers")
* Ability to set a different impression price based on publisher, location, OS, etc.
* Ability to set a frequency cap, e.g. "only show this ad once per 24 hours to a user"
* Ability to modify the targeting on the fly, after the campaign has been created, also allowing the campaign to be paused

To achieve this, and other use cases (see ["Use cases"](#use-cases)), while ensuring future flexibility and overall simplicity, we use a system based on logical rules. The `campaignSpec` will define all rules under `spec.targetingRules`, and each rule can use various input variables (e.g. `publisherId`, `country`) to affect the output variables (whether to show the ad, price). Using a validator event, the creator may change the rules dynamically during the campaign's lifetime (to learn how, read the Validator section).

The targeting is **set on a campaign level** (unlike the previous system, which was on ad unit level). The reason is that this is the common behavior on most networks, is more intuitive, easier to implement, and we can still specify targeting based on the ad unit itself thanks to the rule system.

Since it also allows targeting to affect the offered impression price, it also changes the way the bidding system works. Unlike the previous system, there's no "targeting score", but a higher price may be offered through targeting rules. **This means the bidding algorithm is simply to apply all targeting rules, and show the ad that pays highest for the impression (first price auction).**

**This rule-based system is sufficiently flexible to comprehensively describe what audience should be matched and how it should be priced, therefore eliminating the need for implementing various features separately.**

The rules are defined as JavaScript objects/in JSON, and are lisp-inspired: object literals are used to invoke functions (`{ FUNC: [args] }`, e.g. `{ and: [true, false] }`). Each non-object literal is treated as a value, using JS's own type system (allowing easy implementation in JS and in Rust using `serde_json::Value`). Evaluating a rule may result in two types of errors: `TypeError` and `UndefinedVar`. All variables have a specific type.

**Basic code example:**
```javascript
// rule to match websites that are either News or Bitcoin
{ onlyShowIf: { intersects: [{ get: 'adSlot.categories' }, ['News', 'Bitcoin']] } }

// note: `{ onlyShowIf: X }` is equivalent to `{ if: [X, { set: ['show', false] }] }`

// rule to match websites that are both News and Bitcoin
{ onlyShowIf: { and: [
   { in: [{ get: 'adSlot.categories' }, 'News'] },
   { in: [{ get: 'adSlot.categories' }, 'Bitcoin'] }
] } }

// multiply the price 2 if the publisher is stremio
// keep in mind, pricingBounds apply
{ if: [
   { eq: [{ get: 'publisherId' }, '0xd5860D6196A4900bf46617cEf088ee6E6b61C9d6'] },
   { set: ['price.IMPRESSION', { mul: [2, { get: 'price.IMPRESSION' }] }] }
] }

// frequency capping, show once per 5 mins
{ onlyShowIf: { gt: [{ get: 'adView.secondsSinceCampaignImpression' }, 300] } }
// NOTE: it is not possible for rules that use adView. or adSlot. variables to change the price, since they're not defined on the validator

// disable incentive traffic and specific publishers, with two separate rules
{ onlyShowIf: { nin: [{ get: 'adSlot.categories' }, 'Incentive']  } }
{ onlyShowIf: { nin: [['badPublisher1', 'badPublisher2'], { get: 'publisherId' }] } }

// disable incentive traffic and specific publishers, with one rule
{ onlyShowIf: { and: [
  { nin: [{ get: 'adSlot.categories' }, 'Incentive']  },
  { nin: [['badPublisher1', 'badPublisher2'], { get: 'publisherId' }]  }
] } }

// if category is Bitcoin, set boost and increase price
{ if: [
   { in: [{ get: 'adSlot.categories' }, 'Bitcoin'] },
   { do: [
      { set: [ 'boost', 2 ] },
      { set: [ 'price.IMPRESSION', { mul: [{ get: 'price.IMPRESSION' }, 2] }] }
    ] }
] }

// show the ad if the user has set that they like News
// note that if the user has never set Profile preferences, this rule will be ignored
{ onlyShowIf: { in: [{ get: 'adView.profilePreferredCategories' }, 'News'] } }

// only show if the user has set their ad preferences using the profile
{ onlyShowIf: { get: 'adView.hasCustomPreferences' } }
// same, but written differently
{ set: ['show', { get: 'adView.hasCustomPreferences' }] }

// if the ad unit/slot type is legacy_728x90, only show it in Bulgaria
{ if: [
   { eq: [{ get: 'adSlotType' }, 'legacy_728x90'] },
   { onlyShowIf: { eq: [{ get: 'country' }, 'BG'] } }
] }

// only show the ad in adult websites and at late hours
{ onlyShowIf: { and: [
   { in: [{ get: 'adSlot.categories' }, 'Adult'] },
   { gt: [
       { mod: [{ get: 'secondsSinceEpoch' }, 86400] },
       79200
   ] }
] } }

// only show in high ranking websites; note that a rank of 0 means "no rank"
{ onlyShowIf: { between: [{ get: 'adSlot.alexaRank' }, 1, 100000] } }

// multiple rules can be applied at a time

// adSlot.rules for a publisher, to set a min CPM of 0.24
{onlyShowIf: {gt: [{ get: 'price.IMPRESSION' }, {bn: '240000000000000'}]}}
```
See [aip31.js](https://github.com/AdExNetwork/aips/blob/master/examples/aip31.js) for more, including a partially implemented execution engine, which is pretty simple.

Example in `campaignSpec` JSON:
```json
{
   "targetingRules": [{ "onlyShowIf": { "nin": [{ "get": "adSlot.categories" }, "Incentive"]  } }]
}
```

**Error handling/unmatched rules:** Rules that result in an `UndefinedVar` error will be ignored and won't affect output variables. The reason is that some variables will not be accessible on the Market/Validator (e.g. [AdEx Profile](#15) settings/preferences), but they will be accessible on the AdView. The Market will be able to match as many rules as possible, therefore narrowing down the campaign list, and the AdView will handle the rest.

That way we can optimize data transfer, while still preserving user privacy, by partially applying targeting server-side and then applying the rest (that depends on sensitive data) client side.

As a security feature, the Validators can log/flag events which don't match targeting, as this may mean a publisher is trying to manipulate the system.

The same rules system will be used for ad slots (`adSlot.rules`), but must only allow setting the `show` variable. This will enable publishers to have precise control over which ads are excluded, set a min CPM, and will enable the PMP use case.

### Separation of concerns
This targeting system allows many features that are not usually considered targeting, but ultimately still boil down to narrowing down the audience and pricing of your campaigns (for example, frequency capping).

As such, there are specific things which are out-of-scope:
* Limiting earning for publishers based on our internal platform policies (e.g. insecure accounts can't earn more than X, low Alexa rank publishers can't earn more than Y, banned accounts, max N of campaigns a publisher can earn from)
* Limiting spam/manipulation attempts: this is handled by `EventSubmissionRules`, which are enforced in the Validator
* Preventing other manipulation attempts, such as excessive clicks or events that come from the wrong referrer; this is handled by additional fraud protection mechanisms

Targeting, however, is enforced on every component involved in the supply chain (AdView, Market, Validator).


## Implementation in the Platform and UX

In the Platform, the rule-based system will be hidden behind a simple UI for setting campaign targeting, that will allow customizing 3 main parameters:

* Categories: can choose from multiple categories
* Geotargeting: can choose from multiple tiers, can include/exclude; advanced setting will be available to include/exclude specific countries
   * Add English speaking countries as a separate tier, so that they can be easily selected
* Publisher: can choose from multiple publishers; can set a whitelist/blacklist; initially this could just be a flag that will hardcode only the "trusted" publishers belonging to the select categories; all active publishers will be listed publically by their most used hostnames; in this list, we can also show the average publisher CTR and it's deviation from the network-wide average CTR

This UI will be a step in the "new campaign" dialog, but can also we used when the campaign is already created to modify the targeting on the fly.

There will be a checkbox "Limit average daily spending" which will limit average daily spending to total budget divided by the campaign duration in days. Internally, this will use do `{ onlyShowIf: { lt: [{ get: 'campaignTotalSpent' }, { div: [{ mul: [{ get: 'campaignSecondsActive' }, { get: 'campaignBudget' }] }, { get: 'campaignSecondsDuration' }] }] } }`, or ensure the spend is always under `campaignSecondsActive/campaignSecondsDuration * campaignBudget`.

Later on, we can add another checkbox "Show campaign to recommended traffic for [lower CPM]". This will show the campaign to other traffic besides your set targeting, determined by us, for a much lower CPM. For example, if you only selected 5 publishers and tier 1 countries, we will also show this campaign to a set of other pre-determined publishers, for a lower CPM.

For added convenience, you will be able to save your targeting settings as "Audiences" and load them at a later point in time.

**Recommended CPM:** the UI will recommend a CPM range (min/max) depending on your targeting parameters. If you tweak that, you will be warned that your campaign may not run well or not be cost efficient. Internally, the rules we generate based on the settings will set a higher price for certain categories/publishers/countries.

All of this means that ad units will no longer require entering targeting tags, and "Only show if targeting matches" will not exist.

**NOTE:** as you may be able to tell, the UI only allows a tiny fraction of what's possible with the new targeting system. This gives us room to introduce new targeting features based on user demand, while keeping the UI simple.

### Default excluded categories

By default, some categories will be pre-added to the excluded list. Currently the only such category is Incentivized (IAB25-7), but more may be added in the future.

### Publisher UX

Publishers will no longer have to set tags for their ad slots. They will be categorized by us.

When creating ad slots, publishers should be able to configure a few things:

- "Allow adult content": whether to allow advertising adult content (gambling/pornography; perhaps, if publishers request it, we should allow setting those individually)
- min CPM: leave that with a safe default and hide it under Advanced settings

All of those configurations will be implemented via `adSlot.rules`


## Auto-categorization

Auto-categorization is a responsibility of the Market and is based on various APIs.

Furthermore, we'll have a manual override (`webshrinkerCategoryOverrides` in `websites`) so that we can manually categorize certain websites that were not sufficiently well categorized by the APIs we use.


There's also a custom way of detecting incentive traffic websites (faucets, autosurfers, etc.).

For advertisers, Google Vision will be used for suggeting categories when opening campaigns, except if adult content is detected, in which case the ad will only match such publishers by default. Allowing this to be unset will require manually allowing it to the advertiser (through setting a flag in their `identityDeployData.meta`). This logic will be enforced on the Platform, but for further security, we can enforce it on the Market too.

We can categorize the advertisers' websites too, to obtain further data about that advertiser.

For the categories, we use the IAB taxonomy: it even has IAB25-7 (Incentivized), with one addition to it: IAB13-ADX1 (Cryptocurrency), because there's no such category in IAB's taxonomy (closest is IAB13-11, stocks).

## Implementation in /units-for-slot (Market)

The Market must apply all the rules that do not result in an error, and use that to filter campaigns, sort them by price, and return top N (where N is a configuration). This logic is shared with the AdView (old impl in `adview-manager` crate), but executed with less input variables.

The Market should also apply `adSlot.rules` to additionally filter results based on publisher requirements (e.g. min CPM). This replaces the previous filtering by min CPM, and the issue should be renamed from `NO_UNITS_FOR_MINCPM` to `NO_UNITS_FOR_ADSLOTRULES`.

Do not forget that there are other criteria for filtering campaigns as well, such as ad unit type, as well as platform policies (limits of earning, limits of number of campaigns a publisher can earn from, etc.). In fact, those should be applied before applying targeting.

If we return `NO_UNITS_FOR_TARGETING` in `issues`, we should also return the first M (configurable) rules that excluded units from targeting.

In the market implementation, all the targeting input variables are set in `routes/units-for-slot.js`.

### Performance

Performance may turn out to be critical since we will have to apply all campaign rules and `adSlot.rules` for each ad unit separately, because of the `adUnitId` variable. If this is an issue, we can drop the variables, but it's unlikely that it will help, since most campaigns have a few (one or two) ad units of a particular type - and we first filter ad units by type before applying targeting.

## Implementation in the AdView and bidding algorithm

The steps that the AdView goes through to select an ad are:

- retrieve campaigns from the Market (`/units-for-slot`) - those will already be filtered to return only the active and healthy ones containing an adUnit with the correct adUnit type
- targeting rules will be applied; they were already applied in `/units-for-slot`, but in the AdView we have more variables available
- the ad units will already have a calculated impression price for them, returned by /units-for-slot; apply all the targeting rules with the additional `adView.` variables; sort all units and pick one with the highest impression price; if there are multiple with the same price, we'll apply random selection
- we will not apply `adSlot.rules`; those will be applied by /units-for-slot; the reason for this is that we don't want to allow publishers to read `adView.` variables, since that way they can "read" those variables by finding out if ads collapsed or not, therefore exposing private user information
- /units-for-slot will also return info about the adSlot and the fallback adUnit, so we don't need to retrieve those separately
- keeps a log of what ads were shown (to apply freq capping rules, i.e. `adView.secondsSinceCampaignImpression`)

**NOTE:** Rules that use `adView.*` variables cannot influence the price because they're only applied on the AdView. The validators have the final say on the price, as they administer the payment channels. This is why we use the `price` calculated by the Market, which has access to the same variables as the validators.

**NOTE:** Second-price auctions cannot be applied here, because the validators only know the price that the winning campaign is willing to pay, as other campaigns may be managed by different validators.

### Sticky slots and adjusted impression price

Before AIP31, we randomized the bidding process to avoid showing the same ads every time. Since we can use proper bidding and frequency capping now, this means campaign will be shown only once for a specific period of time.

However, the previous behavior meant that an ad may be shown multiple times for a specific period, while only paying once for it because of `eventSubmission`. So this new behavior "devalues" impressions.

**To solve this problem, once an unit wins the bidding for an impression, it must "stick" in that slot for as long as the `eventSubmission` `rateLimit.timeframe` is set.** This ensures the fair value is extracted from each impression, but at the same time bidding is fair, because campaigns that have reached an `eventSubmission` limit will not participate in the bidding.

Another underlying problem is that campaigns with different `eventSubmission` `rateLimit.timeframe`  essentially have different earnings-over-time values of their impression. **To solve this, the AdView should sort by `price/max(1, seconds)`**.

https://github.com/AdExNetwork/adex-adview-manager/issues/63

### Bidding algorithm in practice

As previously mentioned, the AdView always chooses the campaign that pays the highest.

However, in practice most campaigns have frequency capping rules, which ensures they won't win the auction if they've won recently, which leads to proper ad rotation: every few minutes, a different ad is displayed.

The "every few minutes" part comes from the "impression stickiness" rule, which is that a certain ad slot will only run one auction for a specific amount of time, and then stick with the result of that auction for this time. This solves a few problems: first, it ensures impressions are priced fairly even if the publisher page is often refreshed and second, load on the Market is reduced.

Here's how these things interact: most campaigns will have frequency capping set to 15 minutes. This, combined with a stickiness of 2 minutes, means that no matter how many times an ad slot is refreshed, it will go through roughly 15/2 (rounded up to 8) campaigns for 15 minutes (assuming that many match this ad slot).


## Implementation in the Validator

It's necessary to implement it in the validator, so it can determine the payout (price) of the event.

All the global variables will be set. The price will be clamped to the min/max as defined by `pricingBounds`. If `show` is set to false at any point, we'll return a custom HTTP error code.

In the validator, all the targeting input variables are set in `services/sentry/lib/getPayout`.

### Dynamically updating `targetingRules`

Since `targetingRules` will be part of the `spec`, it cannot be updated as the spec is immutable. However, we will allow an event that updates it, by storing the updated `targetingRules` on the top-level of the campaign object. As such, you should get the targeting rules by `campaign.targetingRules || campaign.spec.targetingRules || []`

## Use cases
* Standard category-based targeting ("only show this campaign on news websites")
* Allowing the advertiser to exclude certain "risky" audiences such as incentive traffic, from specific countries, of specific publishers, etc.; further down the line, they can exclude users without the Profile too
* Further targeting based on AdEx Profile preferences (narrowing down the audience)
* Allowing logical combination of rules (or, and), e.g. "only show this ad unit if the audience is from this place or likes this"
* Budget caps: limit daily spending
* Frequency capping: which can also eliminate a lot of the logic set by the AdView and allow advertisers to choose what frequency capping they want for themselves. Again, this can be combined with logic, e.g. "only show this ad once per day, except if the user likes this category, in which case show it once per hour"
* Time-based targeting: show ads only at a certain time of day
* Dynamically adjusted pricing: increase/decrease the price based on whether the campaign spend is running ahead/behind schedule; replaces "dynamic price adjustment algo" in #6
* Private marketplaces (PMPs)

## Targeting DSL

### Functions

If a function is invoked with incompatible types, evaluation will throw a `TypeError`. If a math function is invoked with numeric, but different types, it will try to cast all the arguments to a BigNumber. For example, the expression `{ mul: [{ get: 'price.IMPRESSION' }, 2] }` would evaluate to a BigNumber.

* math (div, mul, mod, add, sub, max, min)
* variables (get, set)
* syntax sugar (onlyShowIf; perhaps setMul, setAdd which are equivalent to `*=` and `+=`)
* price helpers: (**obsolete** ~~getPriceInUSD will return the currently set price for a specific event, approximated in USD; this is useful for the ad slot rules, as it allows setting min CPM regardless of asset type~~ see #67 for more details)
* logic (or, and, not)
* flow control (if, ifNot, ifElse, do)
* comparison (lt, gt, gte, eq, neq, nin, in, intersects, between)
* reading from arrays (at)
* strings (split, endsWith, startsWith)
* type casts (bn: casts a string to a BigNumber)

### Variables

All input/output variables have a specific type, which is one of `boolean`, `f64`/`Number`, `BigNumber`, `String`

**NOTE: rules that use variables that are only accessible on the AdView cannot change the price, since it's ultimately determined by the validator.**

#### Output variables

* `show`: default `true`: whether to show the ad
* `boost`: default `1.0`: the boost is a number between 0 and 5 that increases the likelyhood for the ad to be chosen if there is random selection applied on the AdView (multiple ad candidates with the same price)
* `price.{eventType}`, for example `price.IMPRESSION`: default is the min of the bound of event type (e.g. value of `pricingBounds.IMPRESSION.min`); this is a `BigNumber`

Output variables can be set any number of times by different rules, except `show`: **if `show` is at any point set to `false`, we stop executing rules and don't show the ad**.

When taking the final price, we always apply `pricingBounds` by [clamping](https://en.wikipedia.org/wiki/Clamping_(graphics)).

#### Input variables

* AdView scope, accessible only on the AdView
  * `adView.secondsSinceCampaignImpression` - seconds since this campaign last registered an impression for the publisher
  * `adView.hasCustomPreferences` -  whether we have custom preferences set through the profile; while this one may be passed to the Market as a query param, we won't use it there to maintain a consistent (with the validator) set of input variables, and consistent scope naming (`adView.`)
  * `adView.navigatorLanguage` - the `navigator.language` on the client side; cannot be a market variable, because it's not accessible server-side (there is a header, but there's also caching)
* Global scope, accessible everywhere
   * adSlotId
   * adSlotType
   * publisherId
   * country
   * eventType
   * secondsSinceEpoch
   * userAgentOS - follows the convention of https://github.com/faisalman/ua-parser-js#methods (OS name)
   * userAgentBrowserFamily - follows the convention of https://github.com/faisalman/ua-parser-js#methods (browser name)
* Global scope, accessible everywhere, campaign-dependant
   * adUnitId
   * *adUnitCategories*: this is unused but reserved for a list of auto-detected categories of the ad unit, determined by the campaign itself and/or the Market (the market has to have the final say if we want it to be secure, i.e. avoid sensitive content appearing for publishers); this is useful together with `adSlot.rules` to exclude certain types of ads
   * advertiserId
   * campaignId
   * campaignTotalSpent
   * campaignSecondsActive
   * campaignSecondsDuration
   * campaignBudget
   * eventMinPrice
   * eventMaxPrice
   * publisherEarnedFromCampaign
* adSlot scope, accessible on Market and AdView:
   * categories
   * hostname
   * alexaRank

The validator may know the hostname because of the referrer, but that variable is under `adSlot` scope (`adSlot.hostname`). We could set another variable (e.g. `validator.referrerHostname`) for extra protection, but it's better to rely on external fraud detection systems to block the publishers who cause discrepancies.

**TODO**: page context: categories determined by the page context

### BigNumber casts

If different numerical types are passed to a function that takes numbers (e.g. `mul`), it will always cast both to BigNumber. BigNumbers have no decimals (they're integers) so some rules need to be adapted with this in mind.

For example, `{ div: [{ mul: [{ get: 'campaignSecondsActive' }, { get: 'campaignBudget' }] }, { get: 'campaignSecondsDuration' }] }` needs to be used for `campaignSecondsActive/campaignSecondsDuration * campaignBudget`, otherwise `campaignSecondsActive/campaignSecondsDuration` will result to a number between 0 and 1, which will always be cast to 0 since the BigNumber cast floors.

### Determinism

Determinism is nice to have but not a strict requirement. Even if the DSL is deterministic itself, in the real world, timing variables will vary between execution contexts (eg `secondsSinceEpoch` between the AdView and the Validator).

It's possible to have nondeterministic execution because of floating point math and because of implementation differences.

However, those differences should be rare and at worst, they'll result in a small percentage of impressions being overpaid/underpaid. Also, in theory different numbers might be seen across the two validators for each campaign, but this is already happening due to the asynchronous nature of networks, and is accounted for using the campaign health system.

Finally, if the campaign has rules which intentionally create differences (not sure how one would do this, maybe leveraging FP arithmetic; but let's say we had a variable for ms and the rule is `{ onlyShowAd: { eq: [{ mod: [{get: 'millisecondsSinceEpoch', 2}] }, 1] } }`), then the campaign may quickly become unhealthy and stop executing - which protects the publishers.

## Private marketplaces (PMPs)

PMPs are partially built in: thanks to the flexibility of targeting rules and the ability for ad slots to contain rules themselves (`adSlot.rules`), publishers can choose to only work with particular advertisers and vice versa. The Market will only return the campaigns if the rules permit it, which means that private campaigns will effectively stay hidden.

To ensure campaigns are not revealed in other places of the platform or in JSON responses from the market, we can introduce a `private` flag for both to indicate not to return them in standard responses (e.g. `/campaigns?all`). The same flag can be used for ad slots to stop the publisher from showing in public lists (currently there is no such list; the campaign stats reveals publishers but only the ones that displayed the campaign).

## Alternative pricing models

By default, AdEx uses a CPM model: targeting rules set `price.IMPRESSION`, and this price is used in auctions.

However, a price for any event can be set, including clicks, leads, acquisitions or other user actions, so all sorts of models are theoretically possible: CPC, CPL, CPA. To allow such campaigns to bid fairly against CPM campaigns, we have to [estimate](https://github.com/AdExNetwork/adex-market/issues/126) the CPM of such a campaign.

Also, since the bidding system takes into account [how long the ad appears for](#sticky-slots-and-adjusted-impression-price), you get some advantages from the proposed [cost-pre-hour](https://aboutus.ft.com/en-gb/announcements/financial-times-rolls-out-cost-per-hour-advertising-metric/) model. A real cost-per-hour model is possible too, by modifying the AdView in such a way that it will send a "time tick" event.

