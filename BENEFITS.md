# Benefits of the AdEx Network protocol for decentralized advertising 

We began building AdEx Network as an alternative to the array of problems faced by the advertising industry today. 

As global advertising and marketing investments continue to grow exponentially around the world, we see a significant shift in the importance carried by different advertising mediums: while TV has always until now been king for advertisers, it is rapidly being outrun by online & digital channels. Experts forecast that search and social advertising will be accountable for about 67% of ad spend growth by 2020 ([source](https://www.zenithmedia.com/insights/global-intelligence-issue-07-2018/search-and-social-to-drive-67-of-adspend-growth-by-2020/)). These two mediums are run by a mere four players: Facebook, Twitter, Google and Oath. In recent months, all of these large ad property providers (and [Facebook in particular](https://www.nytimes.com/2018/04/18/business/media/facebook-advertisers-privacy-data.html)) have faced criticism in regard to doctored reporting and selling user data to their partners - and with good reason. 

Nonetheless, advertisers continue their complicated relationship with the aforementioned giants for lack of an alternative. 

The need of such an alternative solution is most ostensible now, when online advertising has outspent TV for the first time since the coexistence of the two mediums. In 2018, the global spend on online reached 44.9% compared to 31.2% for TV. 

Despite its huge growth, however, the online advertising industry struggles with a lot of issues. The ones that affect it the most are lack of transparency in reporting, a myriad of middlemen, high fees and commissions, ad fraud and violating end users’ privacy.  That’s why 2018 is a fruitful moment for an impactful disruption of the online marketing landscape. This is  and this is where decentralized ad exchanges such as AdEx come in.

## Transparent reporting for all sides

Campaign results reporting is a nightmare for every marketer who dares to use more than one advertising platform (say - Google Ads and Facebook ads). Things get even more complicated if an agency is used and/or the marketer implements internal reporting to track results. 

Data discrepancies often go beyond the margins of statistical deviations, and networks often explain these mismatches with the variety of KPIs used (e.g. clicks vs. impressions). Many users even report errors in reporting within different tools by the same provider - for example between Google Ads and Google Analytics reports; the reason for this is the different methodology used by Google for tracking website visits and ad server clicks. 

In addition to that, all the information that marketers get about their campaigns generally comes from the same source - the ad serving network - and is not objectively verifiable. This means that there is no mechanism to protect marketers and advertisers from [losses caused by bugs or even by malicious intent](https://www.nytimes.com/2016/11/17/technology/facebook-acts-to-restore-trust-after-overstating-video-views.html). 

In order to avoid this, we are introducing real-time tracking and reporting that is easily accessible by each advertiser or publisher. This reporting is aggregated through the [OUTPACE](https://github.com/AdExNetwork/adex-protocol/blob/master/OUTPACE.md) channels and is verified by their validators via the adex-reports-worker component. The reporting data is derived directly from the users, and this guarantees reporting transparency.

## Minimized trust required

By utilizing event verification through validators stacks, the AdEx protocol eliminates the need of additional parties or authorities who would oversee the validity of campaigns and their respective payments. 

Validators are responsible for tracking ad delivery. They are assigned by both advertisers and publishers, and need to sign every new state related to an ad delivery within the AdEx ecosystem. Only states signed by a supermajority are considered valid. 

We allow any arbitrary number of validators. We do this for a number of reasons, such as allowing for tiebreakers in conflicts created by natural discrepancies; maintaining channel liveness, etc.

In addition to this, AdEx allows for delegating the so called observers - these can be but are not necessarily validators as well. Observers can monitor various events of an advertising campaign by receiving events information from the AdEx SDK. Just as validators, observers can and should be assigned by both advertisers and publisher to make sure no additional overseeing authority is required for trust. 

## Minimized fees

In a traditional setting, an advertiser is charged fees for their use of demand-side platforms (DSPs). The average programmatic commissions are usually within the 10-12% range, however they can go up to 20% or even 30%. 

This translates to smaller advertising budgets going to supply-side platforms (SSPs) and publishers. 

More often than not, providers and middlemen are open and upfront about the fees they charge, however this is not always the case. 

With AdEx, advertisers currently benefit from commission-free advertising. This means that 100% of their advertising budgets go to the actual campaigns - and to publishers. In the future, small fees will be introduced, however these will be miniscule in comparison to the industry average. 

## End users in control of their data

Unlike other ad serving providers, AdEx gives users full control of their data.

All of the information that AdEx uses for user targeting is collected through [the AdEx SDK](https://github.com/AdExNetwork/adex-protocol#sdk) into the user’s local storage. This information never leaves the device of the user, and they are able to clear it at any time. 

In the future, we will introduce the AdEx Lounge - a user-facing part of AdEx that allows you to  see what type of data has the SDK collected about you and modify it. 

Once again, it's important to note that all of the targeting data resides in the user's browser and never get sent to anyone as an additional layer of privacy. 

The end result of this is minimizing the possibility of user data/metadata sales to third parties; exploiting information about consumer purchasing habits, etc. 

## Blockchain-, token- and browser agnostic

The AdEx SDK is 100% browser-agnostic; it’s always loaded from the same domain adex.network in order to ensure that it reads and writes to the same localStorage of the user. Explained simply, there are no limitations imposed by the browser(s) used by end users - the AdEx targeting and ad delivery functions flawlessly in any web browser. 

In addition to this, we are currently experimenting with Polkadot and Cosmos - the two most promising solutions for blockchain interoperability. Successful Cosmos and Polkadot implementations will mean that advertisers and publishers will be able to use AdEx within any blockchain ecosystem and use any token or cryptocurrency to transact with.

## Wide variety of use cases

The AdEx protocol is intended mainly for display advertising, however its use is not limited to that. It can be applied to a number of different use cases - for example influencer marketing; content micropayments; affiliate marketing; product placement; and so on. 

The revenue model could be CPC, CPM, CPA or time-based ad property rentals. This makes the protocol usable for physical world advertising (billboards, point-of-sale advertising, guerilla installations, etc.) as well. 
