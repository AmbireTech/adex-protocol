@TODO consider explaining OCEAN as a concept and what "validator stack" can potentially mean

@TODO channel spec: the stateRoot contains lastEventHash; events should always be linked by containing a hash to the previous event, to ensure an immutable data structure; however, we should decide merkelize all events, in order to allow people ot check if events are genuine

@TODO a nice privacy preserving property would be that the platform wouldn't reveal which wallet (in terms of revenue in the balances part of the state tree) belongs to which publisher; that way you can't see where the money from an advertising campaign is flowing, even if everyone withdrawls

@TODO blog post about benefits, use cases of the unidirectional payment channel model with multiple validators; perhaps it can even be used in a DEX if we can atomically interleave a value transfer between two unidirectional payment channels; can be done with something similar to HTLC
@TODO questions that arise
"But what if someone goes offline?"
"but what if someone uses older state?"
"what if the parties mutually agree to close the channel early?" - explain how, on mutual agreement, the paying party can withdraw their funds out; the timeout only exists for extreme byzantine cases
"are 2 validators enough" - if the validators have opposing interests, yes; in this case, the model is exactly as in any payment channel - party A will send micropayments to party B, and if party A stops paying, party B can stop delivering their service and withdraw theire earnings without much loss (Use (1))
"what does leading validator imply?" - they only propose new states, but can't authorize spending without a total supermajority
"are there other usecases besides AdEx" - "a dex", pun intended, lol
"is this for ethereum?" technically it can be done on any programmable blockchain platform; it can even be done on BTC using the UTXO model, similarly to how lightning works; unfortunately we need RSMC

@TODO BTC version; this will be pretty easy to do on top of UTXO's and scripts; when opening a channel, two tx-es are created with the same inputs (advertiser funds), one being a spendable by multisig of validators, the other being a timelocked tx spendable by the advertiser (returns funds to advertiser); to advance the channel, the validators sign new TX-es which contain the msig TX output as an input, and many outputs (the balances tree); to invalidate old tx, we can use a similar scheme as the LN (RSMC); since this is so similar to the LN, can it be built on top, and can it be compatible?
@TODO BTC: actually, we can do a slightly less trustless model which does not require RSMC; the advertiser signs the tx and gives it to the publisher; the publisher validator does not sign it (or just doesn't reveal); once the channel is exhausted, then they sign it and it can be broadcast; this is suboptimal since publishers don't have a constant revenue guarantee that they can verify; alternatively, the publisher validator could sign and reveal the sig to the publishers, but if one of them leaks it, that will allow the advertiser to broadcast it early; or them to do so themselves
@TODO can the LN play in here? 


@TODO when describing OUTPACE, lean on ameen's "a way for two or more entities to privately make updates to some state that only they control"; OCEAN spec should include state transition fn as well; OUTPACE extension should include the balance tree and restrictions; also, when describing OCEAN/OUTPACE emphasize privacy


@TODO describe `adex-smart-platform` events mempool: a sorted set, where `insert` and `find` work via a binary search, we pop items from the beginning (oldest first) to clean it up; describe messages between validators too: ProposeNewState, SignNewState, RequestEventsBeIncluded; consider a Heartbeat message; also, each node should keep an internal ledger of who else from the validator set is online - if 1/3 or more is offline, stop showing the ad (stop participating in bidding);  also we should keep from who we observed which event, so that we can see if the events we didn't see were observed by the supermajority; also think of IP guarantees here, since it's the only thing preventing events from being just re-broadcasted; ANOTHEr security measure is have the user sign the event for every validator separately

@TODO adex-smart-platform DB structure, including a table `channels_onchain` which is populated by the blockchain-specific adapter (which consists of a continuous process that populates the table, AND an interface to sign and provide merkle proofs); this is important for having an agnostic system

@TODO describe internal ledgers in adex-smart-platform: there's one on which events were provably observed by other users; and one for how many fees are claimed (ClaimValidationFee, can be created by a validator to make them claim a fee)

@TODO adex-smart-platform: might need a restriction on the max publishers, or on min spend per publisher; since otherwise it might not be worth it for a publisher to withdraw

@TODO adex-smart-platform parameters: e.g. `{ batching: { maxEvents, maxTime } }`

@TODO you can do an affiliate network, by rewarding the publisher if someone bought something on the site of the advertiser; in other words, adex can be used as an affiliates platform

@TODO encrypt user's data in the SDK? with a key from the nodes?

@TODO homomorphic encryption or some kind of obfuscation of the data in the SDK? how can this be done? maybe nucypher?

@TODO validator fees can be paid via the OUTPACE channels themselves; the fees can even by dynamic/ongoing

@TODO describe the idea of users implicitly outbidding advertisers, if they want to pay for content rather than see ads; the flow of money is `{user OR advertiser} -> publisher` in that case; and `advertiser -> {publisher OR user}` in case the user is rewarded for attention
