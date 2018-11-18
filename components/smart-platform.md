
@TODO channel spec: the stateRoot contains lastEventHash; events should always be linked by containing a hash to the previous event, to ensure an immutable data structure; however, we should decide merkelize all events, in order to allow people ot check if events are genuine

"are there other usecases besides AdEx" - "a dex", pun intended, lol
"is this for ethereum?" technically it can be done on any programmable blockchain platform; it can even be done on BTC using the UTXO model, similarly to how lightning works; unfortunately we need RSMC

@TODO BTC version; this will be pretty easy to do on top of UTXO's and scripts; when opening a channel, two tx-es are created with the same inputs (advertiser funds), one being a spendable by multisig of validators, the other being a timelocked tx spendable by the advertiser (returns funds to advertiser); to advance the channel, the validators sign new TX-es which contain the msig TX output as an input, and many outputs (the balances tree); to invalidate old tx, we can use a similar scheme as the LN (RSMC); since this is so similar to the LN, can it be built on top, and can it be compatible?
@TODO BTC: actually, we can do a slightly less trustless model which does not require RSMC; the advertiser signs the tx and gives it to the publisher; the publisher validator does not sign it (or just doesn't reveal); once the channel is exhausted, then they sign it and it can be broadcast; this is suboptimal since publishers don't have a constant revenue guarantee that they can verify; alternatively, the publisher validator could sign and reveal the sig to the publishers, but if one of them leaks it, that will allow the advertiser to broadcast it early; or them to do so themselves
@TODO can the LN play in here? 


@TODO describe validator stack events mempool: a sorted set, where `insert` and `find` work via a binary search, we pop items from the beginning (oldest first) to clean it up; describe messages between validators too: ProposeNewState, SignNewState, RequestEventsBeIncluded; consider a Heartbeat message; also, each node should keep an internal ledger of who else from the validator set is online - if 1/3 or more is offline, stop showing the ad (stop participating in bidding);  also we should keep from who we observed which event, so that we can see if the events we didn't see were observed by the supermajority; also think of IP guarantees here, since it's the only thing preventing events from being just re-broadcasted; ANOTHEr security measure is have the user sign the event for every validator separately

@TODO validator stack DB structure, including a table `channels_onchain` which is populated by the blockchain-specific adapter (which consists of a continuous process that populates the table, AND an interface to sign and provide merkle proofs); this is important for having an agnostic system

@TODO describe internal ledgers in the validator stack: there's one on which events were provably observed by other users; and one for how many fees are claimed (ClaimValidationFee, can be created by a validator to make them claim a fee)

@TODO validator stack: might need a restriction on the max publishers, or on min spend per publisher; since otherwise it might not be worth it for a publisher to withdraw

@TODO encrypt user's data in the SDK? with a key from the nodes?
@TODO homomorphic encryption or some kind of obfuscation of the data in the SDK? how can this be done? maybe nucypher?

