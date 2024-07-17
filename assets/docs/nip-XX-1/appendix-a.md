# Appendix A - Predefined Nomad Dependencies --- DRAFT

The Nomad execution environment is purposefully barren: it consists of the predefined global objects found in any JavaScript implementation and nothing more.
Even then, many of the predefined objects are required to be redefined so as to provide an idempotent execution environment (eg. `Math.random` returning `NaN`).

We acknowledge that in order to write useful Nomad scripts, one may require additional tools not provided by this extremely curated setting.

To that end, a number of _predefined dependencies_ is provided.
These dependencies are addressed as any other Nomad event would (they have an `.id` field associated to them, can be used in an `n:import` tag, etc.), but their executable body is not present in relays _per se_, but rather provided by the Nomad runtime itself.

In this appendix, we'll present how these predefined dependencies are realized, how they're future-proofed, and what they are concretely.

## Pseudo-Event Definition

A _Nomad pseudo-event_ is an event stating that a specific predefined dependency **MAY** be available to importing Nomad events running in supporting runtimes.
Since _all_ predefined dependencies are expected to be imported, all Nomad pseudo-events **MUST** bear the `internal` metadata tag.

A Nomad pseudo-event has the form:

```javascript
{
  "id": ...,
  "pubkey": ...,
  "created_at": 0,
  "kind": 1337,
  "tags": [
    ["n:metadata", "internal"],
    ["n:metadata", "predefined", "{predefined_name}"],
  ],
  "content": "",
  "sig": ...,
}
```

Note:

- The private key _S_ is **deterministically** derived from the `{predefined_name}`.
- The value of `.created_at` **MUST** be 0.
- The value of `.content` **MUST** be empty.

A TypeScript reference implementation of exactly _how_ this is done is given below (using [`@noble/curves`](https://github.com/paulmillr/noble-curves) and [`@noble/hashes`](https://github.com/paulmillr/noble-hashes)):

```typescript
import { mod } from "@noble/curves/abstract/modular";
import {
  bytesToHex,
  numberToBytesBE,
  bytesToNumberBE,
} from "@noble/curves/abstract/utils";
import { secp256k1, schnorr } from "@noble/curves/secp256k1";
import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha256";

function buildPredefinedDependencyEvent(predefinedName: string): object {
  const created_at: number = 0;
  const kind: number = 1337;
  const tags: string[][] = [
    ["n:metadata", "internal"],
    ["n:metadata", "predefined", predefinedName],
  ];
  const content: string = "";

  const encoder: TextEncoder = new TextEncoder();
  const privkey: Uint8Array = numberToBytesBE(
    // re-implement @noble/curves/abstract/modular.hashToPrivateScalar
    //   without the annoying deprecation notice
    mod(
      bytesToNumberBE(hkdf(sha256, encoder.encode(predefinedName), undefined, undefined, 48)),
      secp256k1.CURVE.n - 1n,
    ) + 1n,
    32,
  );
  const pubkey: string = bytesToHex(schnorr.getPublicKey(privkey));
  const idBytes: Uint8Array = sha256(encoder.encode(JSON.stringify([0, pubkey, created_at, kind, tags, content])));

  const id: string = bytesToHex(idBytes);
  const sig: string = bytesToHex(schnorr.sign(idBytes, privkey, new Uint8Array(32)));

  return { id, pubkey, created_at, kind, tags, content, sig };
}
```

Note how the event as a whole is deterministically determined by the `{predefined_name}` (the `@noble/curves/secp256k1.schnorr.sign` function will use a random 32-byte block if none given, in this case, we're using a bock of 32 `0` bytes).

The `{predefined_name}` has no semantics attached to it other than making it easier for people to talk about the predefined dependency in question, all importing is done via the pseudo-event's `.id` field.

## Pseudo-Relay Definition

In order to future-proof predefined Nomad definitions, the `{recommended_relay_url}` on an `n:import` tag **MAY** be set to `wss://nomad.invalid.org/{predefined_name}`[^invalid-url].
This acts both as a double-check against the imported `{predefined_event_id}`, and as a failsafe for the case in which an implementation has no knowledge of the `{predefined_event_id}` in question and tries to query a relay for it.

[^invalid-url]: The choice of domain name is backed by the semantics outlined on [RFC-6761](https://www.rfc-editor.org/rfc/rfc6761.txt).

This makes the form of a predefined `n:import` tag become:

```javascript
[
  "n:import",
  "{identifier}",
  "{predefined_event_id}",
  "wss://nomad.invalid.org", // OPTIONAL
];
```

## Predefined Nomad Dependencies List

The following sections present the predefined dependencies that **MUST** be provided in all conforming implementations.

Examples and specifications will be presented in TypeScript for documentation purposes, event though Nomad deals solely in JavaScript.

The following TypeScript definition are assumed throughout:

```typescript
type Filter = {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  since?: number;
  until?: number;
  limit?: number;
} & {
  [_ in `#${"a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z"}`]?: string[];
} & {
  [_ in `#${"A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z"}`]?: string[];
};

type NostrEvent = {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
} & {
  [_: string]: unknown;
};
```

The `Filter` type represents the type of a NOSTR filter (ie. that passed to relays on a `REQ` message), while the `NostrEvent` represents the type of a NOSTR event proper (that may contain additional root-level elements).

### The `nostr/reqOnce` Predefined Dependency

This predefined dependency behaves as if it contained the following equivalent Nomad code:

```typescript
return async function* (filters: Filter[], suggestedRelays?: string[]): AsyncIterable<NostrEvent> {
  ...
};
```

Notice how the Nomad script returns a _generator function_, meaning that importing the _result_ of running this will result in this generator function being imported.

The corresponding [pseudo-event](#pseudo-event-definition) is:

```json
{
  "id": "40582291d04af6ba88e886549013a879d1b2583d3372dd3b47d30f97f347bdff",
  "pubkey": "b928c41fe3ec2db82ef09116f905ff8f128d3210bb33a2cde8ce042b0b4d4f89",
  "created_at": 0,
  "kind": 1337,
  "tags": [
    ["n:metadata", "internal"],
    ["n:metadata", "predefined", "nostr/reqOnce"]
  ],
  "content": "",
  "sig": "84b0bfc761fbde4bf36c37a877f5372988c7e7ff6f67c97816596085b7587d1c972acd85548f047a80ed083084ca1632ce8226ca2c33fcb23ee3b8af55f69ad4"
}
```

When this function is called from within a Nomad script, the host will parse the given `filters`, and **MAYBE** use the `suggestedRelays` list, sending a `REQ` message with the given `filters`, and closing the connection on reception of an `EOSE` message.
As messages are received, they're asynchronously `yield`ed to the calling Nomad script.

### The `nostr/req` Predefined Dependency

This predefined dependency behaves as if it contained the following equivalent Nomad code:

```typescript
return async function* (filters: Filter[], suggestedRelays?: string[]): AsyncIterable<NostrEvent> {
  ...
};
```

Notice how the Nomad script returns a _generator function_, meaning that importing the _result_ of running this will result in this generator function being imported.

The corresponding [pseudo-event](#pseudo-event-definition) is:

```json
{
  "id": "c71f8024e151d1532613a04846f90cb3edf67c0e9544b88a618c5e970edfbcb3",
  "pubkey": "2b4f286e312e54fdb93992515c9d19fc9f2c8cd5d2a123ee7aed679e36dedb85",
  "created_at": 0,
  "kind": 1337,
  "tags": [
    ["n:metadata", "internal"],
    ["n:metadata", "predefined", "nostr/req"]
  ],
  "content": "",
  "sig": "affa533e955858a0e5c7470fcb533575899c631dcce88541c2986ec953a72dc002175498af23b296367c1c9bdc62252b4ccce4f26a23ad49e573373de424c288"
}
```

When this function is called from within a Nomad script, the host will parse the given `filters`, and **MAYBE** use the `suggestedRelays` list, sending a `REQ` message with the given `filters`.
As messages are received, they're asynchronously `yield`ed to the calling Nomad script.
Note that, unlike the [`nomad/reqOnce` predefined dependency](#the-nostrreqonce-predefined-dependency), `EOSE` messages are ignored and events will be generated by this function _ad infinitum_.

### The `nostr/nomad/run` Predefined Dependency

...

```typescript
return async function (nomadEventId: string, parameters: [ [name: string]: JsonAble ]): Promise<JsonAble> {
  ...
};
```

...

```json
{
  "id": "b9e247be2ab17ae60f61f3679066d37342e91a0f3e726ed64495ccf38b7bf9ad",
  "pubkey": "53acf47ae4a85c8eab1161f6d505b7274b3f5782253c9a152d37454b6f58fdcb",
  "created_at": 0,
  "kind": 1337,
  "tags": [
    ["n:metadata", "internal"],
    ["n:metadata", "predefined", "nostr/nomad/run"]
  ],
  "content": "",
  "sig": "acb82afcbc1d3fbc8847dcae342c3ea0e4b62434cac214fb2e31e6ec1962d6a4342d8bf7c25f8c4a99c5bbeaee05060170490e74c22b587c0f93c8e9117b9156"
}
```

...
