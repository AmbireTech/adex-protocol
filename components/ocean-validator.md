# OCEAN validator

`adex-ocean-validator` is a RESTful service designed to serve as an OCEAN validator.

When it's initiated for the first time, it will generate itself an Ethereum keypair and print the address. You can use this address, along with the HTTPS endpoint the validator is available at, to appoint it as a validator for commitments.

POST `/commitment/{commitmentId}/event` - post a new event for the given commitment

GET `/commitment/{commitmentId}/finalize` - if the commitment is finalized, it will return the final `vote` and `signature` that can be used with `adex-protocol-eth`; else, it will return a 404

GET `/commitment/{commitmentId}/events?sig={sign(hash(commitmentId, validatorAddr))}` - will return all events where the signer is participating (as a user, advertiser or publisher)

GET `/commitment/{commitmentId}/eventsAggrByType?sig={sign(hash(commitmentId, validatorAddr))}` - same as the previous, but aggregates by type

@TODO separate sub-service for importing commitments into our DB, from eth (or from anything else)
@TODO handshake endpoint prove we control the addr)
@TODO ensure this is relatively chain agnostic
@TODO separate sub-service for relaying; might be a separate repo
