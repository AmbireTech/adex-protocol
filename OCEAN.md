# OCEAN

## Introducing OCEAN

When building blockchain applications (dApps), we often face the challenge of how to take as many things as possible off-chain, while retaining the benefits of the underlying decentralized/trustless consensus.

The main reason we want to do that, is that, by design, a decentralized consensus means that every validator/miner in the network has to compute the result of all transactions, therefore making it expensive to use on-chain transactions for every action in your dApp. Plus, most actions in a dApp do not actually require changing a global ledger.

The most known ways for off-chain scaling are sidechains and state channels, but we felt like our case did not fit in any of those scaling solutions @TODO what we made felt quite natural for us, and after that we discovered that it might be useful for more people

**O**ff-**c**hain **e**vent **a**ggregatio**n** (**OCEAN**) is a very simple way to scale dApps.

@TODO
Within AdEx, anything between the beginning and the end of a delivery period is tracked off-chain (e.g. clicks, impressions), and committed on-chain by the validators at the end.


## Usecases

* AdEx: validaitng impressions/clicks of bids
* AdEx: real-time bidding
* Social network: poll voting

## Comparison

## Protocol