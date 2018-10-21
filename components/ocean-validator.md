# OCEAN validator node

`adex-ocean-validator` is a RESTful service designed to serve as an OCEAN validator.

When it's initiated for the first time, it will generate itself an Ethereum keypair and print the address. You can use this address, along with the HTTPS endpoint the validator is available at, to appoint it as a validator for commitments.

POST `/eth/commitment/{commitmentId}/event` - post a new event for the given commitment

GET `/eth/commitment/{commitmentId}/finalize` - if the commitment is finalized, it will return the final `vote` and `signature`; else, it will return a 404

GET `/eth/commitment/{commitmentId}/events?sig={sign(hash(commitmentId, validatorAddr))}` - will return all events where the signer is participating (as a user, advertiser or publisher)

@TODO separate sub-service for importing commitments into our DB, from eth (or from anything else)
@TODO separate sub-service for relaying; might be a separate repo
@TODO should we divide everything by /eth or just allow generating solidity-verifyable or other signatures on /finalize; cocmmitmentIds will be unique between chains anyway
