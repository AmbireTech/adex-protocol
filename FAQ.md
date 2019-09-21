## What is AdEx?
[AdEx](https://www.adex.network) is a new-generation solution aiming to address and correct some of the most prominent inefficiencies of the online advertising industry: user privacy misuse, ad fraud, lack of transparency in reporting, etc.

The underlying technology is called the AdEx protocol, which facilitates trading of advertising space/time, as well as the subsequent verification and proof that it actually occurred. Essentially, it covers all interactions between publishers, advertisers and end users. The protocol combines traditional peer-to-peer technology, cryptography and blockchain-based payment channels.

## What problems does AdEx solve? 
AdEx addresses some of the most prominent inefficiencies of the contemporary advertising landscape: ad fraud, unclear and misleading campaign reporting, exuberant fees, many middlemen and compromised end user privacy. 

## Can I use AdEx?
If you're a publisher/advertiser, we've created a web application where you can monetize your website or advertise your product, called the [AdEx Platform](https://platform.adex.network).

## What can I use AdEx for? 
The AdEx protocol is intended mainly for display advertising, however its use is not limited to that. It can be applied to a number of different use cases - for example influencer marketing; content micropayments; affiliate marketing; product placement; and so on.

The revenue model could be CPC, CPM, CPA or time-based ad property rentals. This makes the protocol usable for physical world advertising (billboards, point-of-sale advertising, guerilla installations, etc.) as well. 

## Why does AdEx need a blockchain?
We use Ethereum for payment channels, a mechanism for micropayments. This allows us to be non-custodial, not rely on payment processors (which also take hefty fees), and securely pay for each impression individually, with no withdraw thresholds.

Per-impression micropayments are also the backbone of our transparency, since they also double as reporting data.

## What cryptocurrency does the AdEx platform use?
We use [DAI](https://makerdao.com/dai/), which is a so-called stablecoin: it's pegged to the US dollar, so that 1 DAI = 1 USD. When using AdEx, you only need DAI, since fees are paid in it too. You can read our guide on [how to get DAI](https://medium.com/adex-network-tips-and-tricks/how-to-get-dai-stablecoin-1660e8d76faa).

## Is AdEx an ad network?
Yes, in the sense that AdEx performs the same role as an ad network: it connects advertisers to publishers.

The difference is that AdEx is more of a technical solution (protocol) that facilitates this. We have no custordy of funds, collect no data, and cannot censor ads. This is why we describe AdEx as a "decentralized advertising network".

## What fees do I pay to use AdEx?
We charge absolutely no fees or commissions for using the AdEx Platform itself. However, you may be required to pay a tiny fee for the validators that you use.

The way the validator consensus works implies that channel validators have to represent opposite sides; if they don't, the channel should not be used. This means that at one point or another you may end up using a third-party validator. 

Running the validator stack requires computational resources and the third-party validator may require [a small fee](https://github.com/AdExNetwork/adex-protocol#validator-fees).

Furthermore, you need to pay Ethereum network fees when withdrawing funds or opening campaigns. In the AdEx Platform, all fees are paid in DAI.

## How do I sign up for AdEx?
You go to the [Platform](https://platform.adex.network) and follow the instructions.

## Do I need a crypto wallet to sign up for AdEx?
You can also sign up for AdEx with no crypto wallet at all, only by entering an email. This way, an in-browser wallet will be created for you. However, we recommend using a crypto wallet, since the security is much better. If you sign up with an email only, you can always upgrade your account by linking a secure crypto wallet, such as Trezor, Ledger or Metamask.

## What wallets can I use to create an AdEx account?
You can sign up for AdEx with Trezor, Ledger or Metamask.

## How to integrate AdEx on my website?
The simplest way is by copy-pasting a HTML snippet that you will be presented on the Platform when you create an ad slot. More sophisticated integrations are possible using the [adview-manager](https://github.com/adexnetwork/adex-adview-manager).

## How do you ensure campaign reporting transparency? 
The information that marketers get about their campaigns generally comes from the same source - the ad serving network - and is not objectively verifiable. This means that there is no mechanism to protect marketers and advertisers from [losses caused by bugs or even by malicious intent](https://www.nytimes.com/2016/11/17/technology/facebook-acts-to-restore-trust-after-overstating-video-views.html). 

In order to avoid this, we are introducing real-time tracking and reporting where the exact same data is easily accessible by each advertiser or publisher. The reporting data is derived directly from the users from the SDK to the publisher's validator and the advertiser's validator, and this guarantees reporting transparency.

## How do you ensure the privacy of end users? 
We don't collect any data about the user. Instead, we use [contextual targeting](https://medium.com/the-adex-blog/why-we-use-contextual-targeting-d49f3ecf0acf).

In the future, we may introduce behavioral targeting, while still preserving privacy: all of the information can be collected through the [AdEx AdView](https://github.com/AdExNetwork/adex-protocol#adview) into the user’s local storage. This information never leaves the device of the user, and they are able to clear it at any time.  

When we implement this, end users will be presented with the AdEx Lounge - a user-facing part of AdEx that will allow them to see what type of data has the AdView collected about them and modify it. Once again, it's important to note that all of the targeting data resides in the user's browser and never get sent to anyone as an additional layer of privacy. The end result of this is minimizing the possibility of user data/metadata sales to third parties; of exploiting information about consumer purchasing habits; etc.

## How does AdEx solve ad fraud?
There are many different types of ad fraud. For example, an ad network may under-report to publishers to generate more revenue. This is something we completely eliminate thanks to our transparent reporting.

Unfortunately, fake clicks/impressions are still possible in any advertising system. However, we provide plenty of ways to mitigate them that you can read about on [our blog](https://medium.com/the-adex-blog/how-adex-prevents-ad-fraud-314637939946) or [spec](https://github.com/adexnetwork/adex-protocol#preventing-fraudsybil-attacks).

## Does AdEx support targeting?
We use [contextual targeting](https://medium.com/the-adex-blog/why-we-use-contextual-targeting-d49f3ecf0acf), which is a method of targeting the ads based on the page content (i.e. context). Each publisher can provide use any data they want/have to tune the targeting for their case.

## How are fees paid in DAI if you're on the Ethereum network?
On Ethereum, gas fees are paid in ETH. However, we made our own [abstraction](https://github.com/adexnetwork/adex-protocol#identity) that allows fees to be paid in DAI.

## Does AdEx offer real-time bidding?
No. However, AdEx advertisers can take advantage of header bidding, which is quickly replacing real-time bidding anyway. 

Header bidding is the process of pulling all the bids in the browser, evaluating them and then sending the preferred bids to the ad exchange. In AdEx, there is no classic ad exchange, but what we do is even more convenient: we pull all information about demand (campaigns, bids) in the browser, and directly select the bid depending on what we know about the user, therefore implementing targeting without revealing the user's profile.

## What is the relationship to OpenRTB?
[OpenRTB](https://github.com/InteractiveAdvertisingBureau/openrtb/blob/master/OpenRTB%20v3.0%20FINAL.md) is an open standard for real-time bidding, and along with [AdCOM](https://github.com/InteractiveAdvertisingBureau/AdCOM), it covers how most components in a modern ad tech supply chain should communicate. Because AdEx also incorporates payments, and does not allow revealing user data, it's different enough to be considered an alternative standard that you can use in place of OpenRTB.

That said, AdEx does not try to reinvent the wheel, and therefore (1) can interoperate with OpenRTB in certain situations and (2) will support using AdCOM formats in near future

## How does AdEx compare to Google Ads?
AdEx tries to achieve the same general goal: provide a platform that allows advertisers to place ads and publishers to monetize their content.

However, AdEx has a few important distinctions:

* AdEx aims at completely preserving the privacy of the end user, with no personal data collection
* Minimized fees: fees in AdEx are less than 5%, while Google Ads will only give you [51% or 68%](https://support.google.com/adsense/answer/180195?hl=en) of your actual revenue
* It is regulated by its users: there is no central authority which controls which ads are allowed to run, or what content is allowed to monetize; the publishers can decide which ads they deem acceptable
* There are no withdraw thresholds/limitations: you can withdraw any amount at any time; and you get paid in the DAI cryptocurrency
* Transparent reporting: statistical data is sent directly to the publisher and advertiser

## How does AdEx compare to BAT?
AdEx is focused on improving the digital advertising landscape by introducing a drop-in solution that works similarly to existing ones (e.g. Google Ads), but with privacy preservation and minimized fees.

The Basic Attention Token (BAT) takes a different approach: users of the Brave browser (which blocks all ads) get rewarded for seeing whitelisted ads. Once this happens, they can choose to reward the publishers, and/or withdraw the token. As of 2019, BAT only works within the Brave browser and withdraws are not live yet.

Another prominent difference is that AdEx uses DAI for payments, which is price-stable (pegged to 1 USD).

Those are two completely different approaches, and we believe both can coexist.

It's worth noting that AdEx provides the technical ability to pay users for their attention, but it's up to the publishers whether they will do it, and how.

## Do you have a bug bounty program?
Yes, we do. We offer rewards for security vulnerabilities that coders discover after every major release of the AdEx Platform. [Read more about the AdEx bug bounty.](https://medium.com/the-adex-blog/announcing-the-adex-bug-bounty-a5a6e0621094)

## Where can I meet the AdEx team? 
We attend a number of various events around the world. Follow us on social media to see which conferences, meetups or hackathons we are going to (we usually announce at least a couple of weeks in advance of each event).


# FAQ - ADX

## What is the purpose of the ADX token
The ADX token is used for staking if you're running an [AdEx validator](https://github.com/adexnetwork/adex-protocol#validator-stack-platform). Staking your ADX will register your validator in a global registry where your visibility will be proportional to your staked amount.

The staked amount will be slashed if your validator misbehaves (i.e. an economic punishment will be applied to the misbehaving validator).

We are currently working on the specification of the AdEx Registry, however you can [track the progress here](https://github.com/AdExNetwork/adex-protocol/issues/7).

## Why don't you use ADX in the platform?
Because the ADX token was made specifically for our staking mechanism, and it's value is determined by the free market by trading. We want our users to transact in a price-stable currency such as DAI.

## How can I get ADX tokens? 
If you haven’t acquired ADX tokens during our token generation campaign, you may do so at a number of exchanges such as Binance and Bittrex.


# FAQ - Technical

## What is the AdEx Registry?
The AdEx Registry is a mechanism to ensure infrastructure uptime by holding participants accountable, through staking/slashing. The Registry uses our native token, ADX.

## What are validators and validator stacks? 
[OCEAN](https://github.com/AdExNetwork/adex-protocol#off-chain-event-aggregation-ocean)/[OUTPACE](https://github.com/AdExNetwork/adex-protocol/blob/master/OUTPACE.md) validators are responsible for tracking ad impressions/clicks and signing the state. The validator set (can also be called a committee) is defined by the OUTPACE channel. Validators receive data from the AdEx SDK. 

A majority of validators is required in order to achieve a valid signed state. 

A [validator stack](https://github.com/AdExNetwork/adex-protocol/blob/master/components/validator-stack.md) is a collective term for all off-chain components responsible of handling events, managing OUTPACE channels and generating analytical reports.

## What are custom events? 
[Custom events](https://github.com/AdExNetwork/adex-protocol#custom-events) are events defined by the advertiser or by the publisher. For example: an advertiser who is an online retailer may wish to set a purchase of a product as a conversion goal, rather than pay for clicks or impression; setting this as a conversion is a custom event.

## What is OCEAN?
[OCEAN](https://medium.com/the-adex-blog/introducing-ocean-alternative-layer-2-scalability-7d24bb22ebe4) stands for “off-chain event aggregation”. This is a [Layer 2](https://github.com/AdExNetwork/adex-protocol#layer-2) scalability solution that helps us handle a high number of events off-chain while retaining all the benefits of a trustless consensus. 

## What is OUTPACE?
[OUTPACE](https://github.com/AdExNetwork/adex-protocol/blob/master/OUTPACE.md) is a unidirectional payment channel based on OCEAN. OUTPACE allows for creating a simple one-to-many payment channel, where each participating party can withdraw their available balance (advertising budget or ad earnings) at any time. The withdrawn amounts are accounted for on-chain.


# FAQ - Platform

## Do you have real-time reporting?
Yes. Each impression/event results in an immediate micropayment to the publisher, and both sides can see this data in real time as it happens.

## What are the supported ad formats?
Currenly, only display ads: all the classical banner sizes are supported, along with the [IAB new ad portfolio](https://www.iab.com/newadportfolio/). We also support video banners.

## What is the average CPM?
Check out our [Explorer](https://explorer.adex.network) to see the average CPM per ad slot size, in real time.

## How to get DAI to advertise?
Check out [our guide](https://medium.com/adex-network-tips-and-tricks/how-to-get-dai-stablecoin-1660e8d76faa).

If you just want to get started and you have a solid use case, we can give you a grant, [contact us](https://join.adex.network/).

