# NIP-XX-2: Nostracts --- DRAFT

`draft`
`optional`

`depends:nip-xx-1`

`tag:n`

> [!note]
> The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119.txt).

## Motivation

This proposal builds upon [NIP-XX-1: Nomad](../nip-XX-1/nomad.md) and provides a form of _smart contracts_ for NOSTR.

## Short Description

A new _global_ short tag (ie. `n`) is reserved that includes the event id of a Nomad event.
This Nomad script is used to validate the tagged event, paving the road to smart contacts in NOSTR.

## Overview

First, we present the peculiarities of [Nostract Definitions](#nostract-definitions), these being Nomad events with a twist.

Next, we define the [Nostract Usage](#nostract-usage) conventions, including the nostract-specific semantics, and metadata handling.

We follow with a series of nostract [examples](#examples).

We close with some [FAQs](#faqs).

## Nostract Definitions

...

### `nostract` Metadata Identifier

In order to define a nostract, a [Nomad](../nip-XX-1/nomad.md) event **MUST** bear the `nostract` metadata tag.
Such a tag has the form:

```javascript
[
  "n:metadata",
  "nostract",
  "eager",       // OPTIONAL, mutually exclusive with "lazy"
  "eventually",  // OPTIONAL, mutually exclusive with "nevermore", "pure", and "volatile"
  "lazy",        // OPTIONAL, mutually exclusive with "eager"
  "nevermore",   // OPTIONAL, mutually exclusive with "eventually", "pure", and "volatile"
  "pure",        // OPTIONAL, mutually exclusive with "eventually", "nevermore", and "volatile"
  "volatile",    // OPTIONAL, mutually exclusive with "eventually", "nevermore", and "pure"
];
```

where:

- **`eager`:**
  Optional metadata argument used to indicate that the nostract **SHOULD** be eagerly run.

  This metadata identifier **MUST NOT** be used alongside the `lazy` metadata argument.

- **`eventually`:**
  Optional metadata argument used to indicate that the nostract's `true` result **MAY** be cached indefinitely.

  This metadata identifier **MUST NOT** be used alongside the `nevermore`, `pure`, or `volatile` metadata arguments.

- **`lazy`:**
  Optional metadata argument used to indicate that the nostract **SHOULD** only be run on demand.

  This metadata identifier **MUST NOT** be used alongside the `eager` metadata argument.

- **`nevermore`:**
  Optional metadata argument used to indicate that the nostract's `false` result **MAY** be cached indefinitely.

  This metadata identifier **MUST NOT** be used alongside the `eventually`, `pure`, or `volatile` metadata arguments.

- **`pure`:**
  Optional metadata argument used to indicate that the nostract's result **MAY** be cached indefinitely.

  This metadata identifier **MUST NOT** be used alongside the `eventually`, `nevermore`, or `volatile` metadata arguments.

- **`volatile`:**
  Optional metadata argument used to indicate that the nostract's result **SHOULD NOT** be cached at all.

  This metadata identifier **MUST NOT** be used alongside the `eventually`, `nevermore`, or `pure` metadata arguments.

This yields the following possible combinations:

|      `eager`       |       `lazy`       |     |    `eventually`    |    `nevermore`     |       `pure`       |     `volatile`     |
| :----------------: | :----------------: | :-: | :----------------: | :----------------: | :----------------: | :----------------: |
|        :x:         |        :x:         |     |        :x:         |        :x:         |        :x:         |        :x:         |
|        :x:         |        :x:         |     | :white_check_mark: |        :x:         |        :x:         |        :x:         |
|        :x:         |        :x:         |     |        :x:         | :white_check_mark: |        :x:         |        :x:         |
|        :x:         |        :x:         |     |        :x:         |        :x:         | :white_check_mark: |        :x:         |
|        :x:         |        :x:         |     |        :x:         |        :x:         |        :x:         | :white_check_mark: |
| :white_check_mark: |        :x:         |     |        :x:         |        :x:         |        :x:         |        :x:         |
| :white_check_mark: |        :x:         |     | :white_check_mark: |        :x:         |        :x:         |        :x:         |
| :white_check_mark: |        :x:         |     |        :x:         | :white_check_mark: |        :x:         |        :x:         |
| :white_check_mark: |        :x:         |     |        :x:         |        :x:         | :white_check_mark: |        :x:         |
| :white_check_mark: |        :x:         |     |        :x:         |        :x:         |        :x:         | :white_check_mark: |
|        :x:         | :white_check_mark: |     |        :x:         |        :x:         |        :x:         |        :x:         |
|        :x:         | :white_check_mark: |     | :white_check_mark: |        :x:         |        :x:         |        :x:         |
|        :x:         | :white_check_mark: |     |        :x:         | :white_check_mark: |        :x:         |        :x:         |
|        :x:         | :white_check_mark: |     |        :x:         |        :x:         | :white_check_mark: |        :x:         |
|        :x:         | :white_check_mark: |     |        :x:         |        :x:         |        :x:         | :white_check_mark: |

> [!tip]
> To minimize spurious ambiguities, it is **RECOMMENDED** to list optional arguments alphabetically.

Any number of `"nostract"` metadata tags **MAY** be attached, the resulting optional arguments being the union of all the optional arguments found in all `"nostract"` metadata tags.

As nostracts are themselves `external` nomads, it is **RECOMMENDED** to attach the `external` metadata tag as well, yielding the following general form for nostracts' `.tags` field:

```javascript
[
  ...,
  [
    "n:metadata",
    "nostract",
    "eager",       // OPTIONAL
    "eventually",  // OPTIONAL
    "lazy",        // OPTIONAL
    "nevermore",   // OPTIONAL
    "pure",        // OPTIONAL
    "volatile",    // OPTIONAL
  ],
  ...,
  ["n:metadata", "external"],
  ...,
]
```

### The `nostr/nomad/nostract/isValid` Predefined Dependency

Conforming implementations **MAY** provide the `nostr/nomad/nostract/isValid` predefined dependency.

This predefined dependency behaves as if it contained the following equivalent Nomad code:

```typescript
return async function (event: NostrEvent, nostractId: string): boolean {
  ...
};
```

Where `NostrEvent` is as defined in [NIP-XX-1](../nip-XX-1/nomad.md), Appendix A, _"Predefined Nomad Dependencies List"_.
Its corresponding pseudo-event is:

```json
{
  "id": "33eec55291dada3962aba824daf87ccba9544344ee6885df775b66dabe2391fa",
  "pubkey": "1bca4e909fb2b8eb27aee2f703d2392aef70e504f7119a5c82ec91f60c5d4288",
  "created_at": 0,
  "kind": 1337,
  "tags": [
    ["n:metadata", "internal"],
    ["n:metadata", "predefined", "nostr/nomad/nostract/isValid"]
  ],
  "content": "",
  "sig": "4678a3ccb936c0a40a83e9ec10ac16d593f3dd5beba1fe6e7211490bc52355b5eabb426bdd3da5320f4a0c658de2a75cdd4d04eb89863f26d33216a1d20c44a7"
}
```

When this function is called from within a Nomad script, the host will run the nostract validation procedure outlined [below](#nostract-usage) on the given event, and return `true` if all nostracts within it pass validation, and `false` otherwise.

> [!CAUTION]
> Care must be taken when allowing for this predefined dependency in untrusted code: this effectively allows for a recursive application of the validation procedure proper.
> Even when Nomad code can be an arbitrary function body, all of their dependencies constitute a [DAG](https://en.wikipedia.org/wiki/Directed_acyclic_graph) and are known before the validation procedure is started; this predefined function allows for arbitrary calls to the validation procedure not necessarily known at "`REQ`-time".
> It is **RECOMMENDED** that conforming implementations limit the "depth" to which this predefined dependency can be called, or apply any other means of limiting potential abuses by malicious actors.

## Nostract Usage

Once defined, a nostract may be attached to a _carrier_ event.
The carrier event (once parsed and validated as a NOSTR event) **MUST** be passed on to the Nomad script under the `event` parameter.
Furthermore, the nostracts's `.id` field **MUST** be passed under the `nostractId` parameter.
If the nostract's execution returns `true`, the event is deemed _valid_, otherwise, it is deemed _invalid_.

An `"n"` tag has the form:

```javascript
{
  ...,
  "tags": [
    ...,
    ["n", "{nostract_event_id}"],
    ...,
  ],
  ...,
}
```

where:

- **`{nostract_event_id}`:**
  This value **MUST** be a valid NOSTR event `.id`, consisting of 64 hexadecimal characters (lowercase).
  This **MUST** be the `.id` of a Nomad event (ie. a `kind:1337` event itself), containing both `nostract` and `external` metadata identifiers.

Any number of `"n"` tags **MAY** be attached to any one event, but it makes no sense to have identical `"n"` tags.

...

## Examples

...

### Witnesses

ACA VA UN VALIDADOR QUE TOMA UN VALIDADOR Y LOS PARAMETROS QUE SE LE PASAN Y TE VALIDA QUE EL RESULTADO SEA EL DADO

...

### Bridges / Oracles

...

### Userland NIP Implementations

...

#### NIP-13 - Proof of Work

Here's a nostract code that will validate that the event it is attached to indeed contains a valid [NIP-13](https://github.com/nostr-protocol/nips/blob/master/13.md) proof of work:

```javascript
// this variable will hold the number of leading 0 bits
let num0s = 0;

// break the ID into 32-bit blocks and fast-forward the count as long as they are 0
for (let i = 0; i < 64; i += 8) {
  const current = parseInt(event.id.substring(i, i + 8), 16);
  num0s += Math.clz32(current);
  if (current) {
    break;
  }
}

// although NIP-13 is unclear as to how to manage multiple "nonce" tags, we take the conservative
//   approach and consider multiple "nonce" tags as describing differing levels of difficulty,
//   considering only the highest of them
return event.tags.every(tag => tag[0] !== "nonce" || parseInt(tag[2]) <= num0s);
```

The resulting NOSTR event (signed with the private key `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` and having a `.created_at` value of `0`) results in:

```json
{
  "id": "deb0a6c5783e593655deb27fb92e847bf27c835b64ea06b2ecba3bfe852f684a",
  "pubkey": "4646ae5047316b4230d0086c8acec687f00b1cd9d1dc634f6cb358ac0a9a8fff",
  "created_at": 0,
  "kind": 1337,
  "tags": [
    ["n:metadata", "nostract", "pure"],
    ["n:metadata", "external"]
  ],
  "content": "// this variable will hold the number of leading 0 bits\nlet num0s = 0;\n\n// break the ID into 32-bit blocks and fast-forward the count as long as they are 0\nfor (let i = 0; i < 64; i += 8) {\n  const current = parseInt(event.id.substring(i, i + 8), 16);\n  num0s += Math.clz32(current);\n  if (current) {\n    break;\n  }\n}\n\n// although NIP-13 is unclear as to how to manage multiple \"nonce\" tags, we take the conservative\n//   approach and consider multiple \"nonce\" tags as describing differing levels of difficulty,\n//   considering only the highest of them\nreturn event.tags.every(tag => tag[0] !== \"nonce\" || parseInt(tag[2]) <= num0s);\n",
  "sig": "7c8461229bad916279eacdadbd5e411f870f3bf4d0527f63266d1043ccbe109f11225b97567e588c0c7068506c683c03236a2831130dfa398efcc9739930d041"
}
```

Reproducing (somewhat) the example given in the [NIP-13](https://github.com/nostr-protocol/nips/blob/master/13.md) documented alluded to above (again, signed with the private key `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` and having a `.created_at` value of `0`):

```json
{
  "id": "00000ce3f96030949eb89ee34cb5aad49f6cf7171bb08707ff4ac0814ca2bfcb",
  "pubkey": "4646ae5047316b4230d0086c8acec687f00b1cd9d1dc634f6cb358ac0a9a8fff",
  "created_at": 0,
  "kind": 1,
  "tags": [
    ["n", "deb0a6c5783e593655deb27fb92e847bf27c835b64ea06b2ecba3bfe852f684a"],
    ["nonce", "280426", "20"]
  ],
  "content": "It's just me mining my own business",
  "sig": "6e01899eb7f37e0e2ea463d86b4a2315174850883ca2e43a388e6e5f009a2079a99ff39014d6f4616c26893d1f4f38dfd996e2aec984b01ab627f659b4264717"
}
```

#### NIP-69 - Polls

Here's a nostract code that will validate that the event it is attached to has a `.kind:6969` schema, as specified in the [NIP-69](https://github.com/nostr-protocol/nips/pull/320) "polls" proposal:

```javascript
// extract all distinct relays from the "p" tags
const pRelays = new Set(event.tags.filter((tag) => tag[0] === "p").map((tag) => tag[2]));

// verify there's a single relay specified (may be "undefined")
if (1 !== pRelays.size) {
  return false;
}

// let this be the relay to check against
const [relay] = Array.from(pRelays);

// verify the resulting relay is not undefined
if (undefined === relay) {
  return false;
}

// verify that all "e" tags target the same relay
if (event.tags.filter((tag) => tag[0] === "e").some((tag) => tag[2] !== relay)) {
  return false;
}

// verify the content is not empty
if (event.content === "") {
  return false;
}

// extract all "poll_option" tags
const pollOptionTags = event.tags.filter((tag) => tag[0] === "poll_option");

// verify there are at least two poll options
if (pollOptionTags.length < 2) {
  return false;
}

// verify all indexes are numeric
if (pollOptionTags.some((tag) => !(/^\d+$/.test(tag[1]) && tag[2].length))) {
  return false;
}

// verify there are no repeated indexes
if (new Set(pollOptionTags.map((tag) => parseInt(tag[1]))).size !== pollOptionTags.length) {
  return false;
}

// verify there are no repeated descriptions
if (new Set(pollOptionTags.map((tag) => tag[2])).size !== pollOptionTags.length) {
  return false;
}

// verify all "closed_at" tags have numeric values
if (event.tags.some((tag) => tag[0] === "closed_at" && !/^\d+$/.test(tag[1]))) {
  return false;
}

// extract all "value_maximum" tags
const valueMaximum = Math.min(
  ...event.tags
    .filter((tag) => tag[0] === "value_maximum")
    .map((tag) => (/^\d+$/.test(tag[1]) ? parseInt(tag[1]) : NaN)),
);

// extract all "value_minimum" tags
const valueMinimum = Math.max(
  ...event.tags
    .filter((tag) => tag[0] === "value_minimum")
    .map((tag) => (/^\d+$/.test(tag[1]) ? parseInt(tag[1]) : NaN)),
);

// verify that the final "value_maximum" is not less than the final "value_minimum"
// NOTE: we do it this way so as to catch the cases in which these values are NaN
if (!(valueMinimum <= valueMaximum)) {
  return false;
}

// extract all "consensus_threshold" tags
const consensusThreshold = Math.max(
  ...event.tags
    .filter((tag) => tag[0] === "consensus_threshold")
    .map((tag) => (/^\d+$/.test(tag[1]) ? parseInt(tag[1]) : NaN)),
);

// verify they all have numeric values
// NOTE: we do it this way so as to catch the cases in which this values is NaN
if (!(consensusThreshold <= 100)) {
  return false;
}
```

The resulting NOSTR event (signed with the private key `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` and having a `.created_at` value of `0`) results in:

```json
{
  "id": "95273930b8cc8ff626788b3e4210b899ff230b6b3a485558a03eb7580cc73c1c",
  "pubkey": "4646ae5047316b4230d0086c8acec687f00b1cd9d1dc634f6cb358ac0a9a8fff",
  "created_at": 0,
  "kind": 1337,
  "tags": [
    ["n:metadata", "nostract", "pure"],
    ["n:metadata", "external"]
  ],
  "content": "// extract all distinct relays from the \"p\" tags\nconst pRelays = new Set(event.tags.filter((tag) => tag[0] === \"p\").map((tag) => tag[2]));\n\n// verify there's a single relay specified (may be \"undefined\")\nif (1 !== pRelays.size) {\n  return false;\n}\n\n// let this be the relay to check against\nconst [relay] = Array.from(pRelays);\n\n// verify the resulting relay is not undefined\nif (undefined === relay) {\n  return false;\n}\n\n// verify that all \"e\" tags target the same relay\nif (event.tags.filter((tag) => tag[0] === \"e\").some((tag) => tag[2] !== relay)) {\n  return false;\n}\n\n// verify the content is not empty\nif (event.content === \"\") {\n  return false;\n}\n\n// extract all \"poll_option\" tags\nconst pollOptionTags = event.tags.filter((tag) => tag[0] === \"poll_option\");\n\n// verify there are at least two poll options\nif (pollOptionTags.length < 2) {\n  return false;\n}\n\n// verify all indexes are numeric\nif (pollOptionTags.some((tag) => !(/^d+$/.test(tag[1]) && tag[2].length))) {\n  return false;\n}\n\n// verify there are no repeated indexes\nif (new Set(pollOptionTags.map((tag) => parseInt(tag[1]))).size !== pollOptionTags.length) {\n  return false;\n}\n\n// verify there are no repeated descriptions\nif (new Set(pollOptionTags.map((tag) => tag[2])).size !== pollOptionTags.length) {\n  return false;\n}\n\n// verify all \"closed_at\" tags have numeric values\nif (event.tags.some((tag) => tag[0] === \"closed_at\" && !/^d+$/.test(tag[1]))) {\n  return false;\n}\n\n// extract all \"value_maximum\" tags\nconst valueMaximum = Math.min(\n  ...event.tags\n    .filter((tag) => tag[0] === \"value_maximum\")\n    .map((tag) => (/^d+$/.test(tag[1]) ? parseInt(tag[1]) : NaN)),\n);\n\n// extract all \"value_minimum\" tags\nconst valueMinimum = Math.max(\n  ...event.tags\n    .filter((tag) => tag[0] === \"value_minimum\")\n    .map((tag) => (/^d+$/.test(tag[1]) ? parseInt(tag[1]) : NaN)),\n);\n\n// verify that the final \"value_maximum\" is not less than the final \"value_minimum\"\n// NOTE: we do it this way so as to catch the cases in which these values are NaN\nif (!(valueMinimum <= valueMaximum)) {\n  return false;\n}\n\n// extract all \"consensus_threshold\" tags\nconst consensusThreshold = Math.max(\n  ...event.tags\n    .filter((tag) => tag[0] === \"consensus_threshold\")\n    .map((tag) => (/^d+$/.test(tag[1]) ? parseInt(tag[1]) : NaN)),\n);\n\n// verify they all have numeric values\n// NOTE: we do it this way so as to catch the cases in which this values is NaN\nif (!(consensusThreshold <= 100)) {\n  return false;\n}\n",
  "sig": "e4b9381e6237301f709ebb7e3c56091cdf0b0d19fec1f0a394b73f232ca4677b66a36af349680a50150cf12976e2405da927233bbdec9ac181bad1ed0155393b"
}
```

Usage is as above.

### SNTs: Simple NOSTR Tokens

The nostracts mechanism is, surprisingly, sufficient to implement a form of token standard.
There are some [limitations](#limitations), but within these, it is very much doable.

To that effect, we'll use a simple ledger-like architecture, with a single new event type (eg. `2222`), to communicate token transference.
Token transfers consist of a series of amounts to be sent to a number of public keys.
In this example, we'll start off with some pre-assigned tokens, but any other seeding system may be accommodated.

The transfer event will have the form:

```json
{
  ...,
  "kind": 2222,
  ...,
  "tags": [
    ...,
    ["p", "{destination_pubkey}"],
    ...,
    ["n", "{ledger_nostract_id}"],
    ...
  ],
  ...,
  "content": "{transfer_content}",
  ...
}
```

Where `{destination_pubkey}` is a public key mentioned in the content's output block (see below).
The `{transfer_content}` is the JSON serialization of an object of the following form:

```json
{
  ...,
  "{destination_pubkey}": "{amount}",
  ...
}
```

Where the `{amount}` is given as a string to avoid any problems parsing and serializing arbitrary-precision numbers.

These events need to adhere to the following syntactic rules:

1. The event's `.pubkey` **MUST NOT** appear among the `"p"` tags' values.
2. The parsed `.content`'s keys and the `"p"` tags' values **MUST** contain the same elements.
3. The parsed `.content` **MUST NOT** be an empty object.

In order for one such event to be valid, we must ensure that, until the event's `.created_at` time, at no point has the event `.pubkey`'s balance dipped below 0, and that whatever balance remains is enough to cover the transfers in the event in question.

The following nostract code _template_ can be used to that end (but, please, **do** read the [limitations](#limitations) below!):

```javascript
const CONSENSUS_RELAYS = [
  // MISSING: COMPLETE WItH A LIST OF TRUSTWORTHY RELAYS
];
const INITIAL_LEDGER = {
  // MISSING: COMPLETE WITH A MAPPING FROM PUBKEY TO INITIAL BALANCE
};

// ------------------------------------------------------------------------------------------------

/**
 * Compare two arrays for exact equality.
 *
 */
function arrayEq(left, right) {
  return left.length === right.length || left.every((v, i) => v === right[i]);
}

/**
 * Return the comparison index associated to the given NOSTR event.
 *
 */
function eventIdx(e) {
  return BigInt(`0x${e.created_at.toString(16)}${e.id}`);
}

/**
 * Compare two NOSTR events according to their comparison index.
 *
 */
function eventCmp(left, right) {
  const [leftIdx, rightIdx] = [eventIdx(left), eventIdx(right)];

  if (leftIdx < rightIdx) {
    return -1;
  } else if (leftIdx === rightIdx) {
    return 0;
  } else {
    return 1;
  }
}

/**
 * Retrieve events that pass the threshold for the consensus relays, sorted.
 *
 */
function consensualEvents(filters) {
  const threshold = CONSENSUS_RELAYS.length >> 1;
  return Array.from(
    Map.groupBy(
      Array.fromAsync(reqOnce(filters, CONSENSUS_RELAYS)),
      ({ id }) => id,
    ).entries(),
  )
    .filter(([_, events]) => threshold < events.length)
    .map(([_, events]) => events[0])
    .toSorted(eventCmp)
  ;
}

/**
 * Check that the given transfer event has the correct shape, return `false` if not,
 * or the converted object otherwise.
 *
 */
function shapeOk(transfer) {
  const content = JSON.parse(transfer.content);

  return ('object' === typeof content
    && null !== content
    && !(transfer.pubkey in content)
    && 0 < Object.keys(content).length
    && Object.values(content).every(v => 'string' === typeof v && /^[1-9][0-9]*$/.test(v))
    && arrayEq(
      transfer.tags.filter(([tag]) => "p" === tag).map(([_, pubkey]) => pubkey).toSorted(),
      Object.keys(content).toSorted(),
    )
  )
    ? Object.fromEntries(Object.entries(content).map((k, v) => [k, BigInt(v)]))
    : false
  ;
}

// ------------------------------------------------------------------------------------------------

// check that the current event is syntactically valid.
const currentTransferContent = shapeOk(event);
if (false === currentTransferContent) {
  return false;
}

// retrieve all transfer events involving the current pubkey, and calculate the resulting balance,
//   collapsing to a negative value if it ever dips below 0, or if an invalid event is encountered
//   along the way
let currentBalance = consensualEvents([
  { kinds: [2222], until: event.created_at, "#n": [nostractId], authors: [event.pubkey] },
  { kinds: [2222], until: event.created_at, "#n": [nostractId], "#p": [event.pubkey] },
])
  .reduce(
    (balance, transfer) => {
      if (0n <= balance) {
        const transferContent = shapeOk(transfer);
        if (false === transferContent) {
          balance = -1n;
        } else if (event.pubkey === transfer.pubkey) {
          balance -= Object.values(transferContent).reduce((a, v) => a + v);
        } else {
          balance += transferContent[event.pubkey] ?? 0n;
        }
      }

      return balance;
    },
    INITIAL_LEDGER[event.pubkey] ?? 0n,
  )
;

// check that the current balance is enough to cover the transfers made
if (currentBalance < Object.values(currentTransferContent).reduce((a, v) => a + v)) {
  return false;
}

return true;
```

We refer to this as a _template_ because the variables `CONSENSUS_RELAYS` and `INITIAL_LEDGER` **MUST** be set before this can be published as a Nomad event proper.

Using `["wss://relay1.example.com", "wss://relay2.example.com", "wss://relay3.example.com"]` for `CONSENSUS_RELAYS` and `{"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef": 1_000_000_000n}` for `INITIAL_LEDGER` yields the following NOSTR event (signed with the private key `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` and having a `.created_at` value of `0`):

```json
{
  "id": "eb4082d326b811385b1d6f088efd840feef6170e6d8bf43da8c5d39b6c32a4f2",
  "pubkey": "4646ae5047316b4230d0086c8acec687f00b1cd9d1dc634f6cb358ac0a9a8fff",
  "created_at": 0,
  "kind": 1337,
  "tags": [
    ["n:metadata", "nostract", "nevermore"],
    ["n:metadata", "external"],
    ["n:import", "reqOnce", "40582291d04af6ba88e886549013a879d1b2583d3372dd3b47d30f97f347bdff"]
  ],
  "content": "const CONSENSUS_RELAYS = [\n  \"wss://relay1.example.com\",\n  \"wss://relay2.example.com\",\n  \"wss://relay3.example.com\",\n];\nconst INITIAL_LEDGER = {\n  \"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\": 1_000_000_000n,\n};\n\n// ------------------------------------------------------------------------------------------------\n\n/**\n * Compare two arrays for exact equality.\n *\n */\nfunction arrayEq(left, right) {\n  return left.length === right.length || left.every((v, i) => v === right[i]);\n}\n\n/**\n * Return the comparison index associated to the given NOSTR event.\n *\n */\nfunction eventIdx(e) {\n  return BigInt(`0x${e.created_at.toString(16)}${e.id}`);\n}\n\n/**\n * Compare two NOSTR events according to their comparison index.\n *\n */\nfunction eventCmp(left, right) {\n  const [leftIdx, rightIdx] = [eventIdx(left), eventIdx(right)];\n\n  if (leftIdx < rightIdx) {\n    return -1;\n  } else if (leftIdx === rightIdx) {\n    return 0;\n  } else {\n    return 1;\n  }\n}\n\n/**\n * Retrieve events that pass the threshold for the consensus relays, sorted.\n *\n */\nfunction consensualEvents(filters) {\n  const threshold = CONSENSUS_RELAYS.length >> 1;\n  return Array.from(\n    Map.groupBy(\n      Array.fromAsync(reqOnce(filters, CONSENSUS_RELAYS)),\n      ({ id }) => id,\n    ).entries(),\n  )\n    .filter(([_, events]) => threshold < events.length)\n    .map(([_, events]) => events[0])\n    .toSorted(eventCmp)\n  ;\n}\n\n/**\n * Check that the given transfer event has the correct shape, return `false` if not,\n * or the converted object otherwise.\n *\n */\nfunction shapeOk(transfer) {\n  const content = JSON.parse(transfer.content);\n\n  return ('object' === typeof content\n    && null !== content\n    && !(transfer.pubkey in content)\n    && 0 < Object.keys(content).length\n    && Object.values(content).every(v => 'string' === typeof v && /^[1-9][0-9]*$/.test(v))\n    && arrayEq(\n      transfer.tags.filter(([tag]) => \"p\" === tag).map(([_, pubkey]) => pubkey).toSorted(),\n      Object.keys(content).toSorted(),\n    )\n  )\n    ? Object.fromEntries(Object.entries(content).map((k, v) => [k, BigInt(v)]))\n    : false\n  ;\n}\n\n// ------------------------------------------------------------------------------------------------\n\n// check that the current event is syntactically valid.\nconst currentTransferContent = shapeOk(event);\nif (false === currentTransferContent) {\n  return false;\n}\n\n// retrieve all transfer events involving the current pubkey, and calculate the resulting balance,\n//   collapsing to a negative value if it ever dips below 0, or if an invalid event is encountered\n//   along the way\nlet currentBalance = consensualEvents([\n  { kinds: [2222], until: event.created_at, \"#n\": [nostractId], authors: [event.pubkey] },\n  { kinds: [2222], until: event.created_at, \"#n\": [nostractId], \"#p\": [event.pubkey] },\n])\n  .reduce(\n    (balance, transfer) => {\n      if (0n <= balance) {\n        const transferContent = shapeOk(transfer);\n        if (false === transferContent) {\n          balance = -1n;\n        } else if (event.pubkey === transfer.pubkey) {\n          balance -= Object.values(transferContent).reduce((a, v) => a + v);\n        } else {\n          balance += transferContent[event.pubkey] ?? 0n;\n        }\n      }\n\n      return balance;\n    },\n    INITIAL_LEDGER[event.pubkey] ?? 0n,\n  )\n;\n\n// check that the current balance is enough to cover the transfers made\nif (currentBalance < Object.values(currentTransferContent).reduce((a, v) => a + v)) {\n  return false;\n}\n\nreturn true;\n",
  "sig": "dbce525468d2735586b343e94d61bf722baf0176527b35592268c53b86632ac1364015916f82d43522e24d49e627c75ddd75ac799746e7d1f6866185e67a8399"
}
```

Notice the usage of the `"n:import"` tag to pull the [`nostr/reqOnce` predefined dependency](../nip-XX-1/appendix-a.md#the-nostrreqonce-predefined-dependency) (using the, admittedly uninspired, `reqOnce` name).

With this Nomad event published, the following is an example of a valid transfer:

```json
{
  "id": "cc2b1410e51ab61955e3549cf51c3b084c72ac8538c6d72183c7587d99e95145",
  "pubkey": "4646ae5047316b4230d0086c8acec687f00b1cd9d1dc634f6cb358ac0a9a8fff",
  "created_at": 1000,
  "kind": 2222,
  "tags": [
    ["n", "eb4082d326b811385b1d6f088efd840feef6170e6d8bf43da8c5d39b6c32a4f2"],
    ["p", "0101010101010101010101010101010101010101010101010101010101010101"]
  ],
  "content": "{\n  \"0101010101010101010101010101010101010101010101010101010101010101\": \"1000000000\"\n}",
  "sig": "c39918ac4ff2cd61f43824c10685bf3f09e23254e54f3750104a0d8d337b546a606cc8f0afe8c99f345d98a73c3a76fd88b058849b33e8d3114ffc94c4ce11e9"
}
```

This transfers the totality of `4646ae5047316b4230d0086c8acec687f00b1cd9d1dc634f6cb358ac0a9a8fff`'s funds (the public key associated to `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`) to the public key `0101010101010101010101010101010101010101010101010101010101010101`.

After publishing this event to at least half of the `CONSENSUS_RELAYS`, the following transfer would be invalid:

```json
{
  "id": "06daa733073ac7e6eeefdd3c6b9fef54b4a4deed55ebf4d131f25e83497547ab",
  "pubkey": "4646ae5047316b4230d0086c8acec687f00b1cd9d1dc634f6cb358ac0a9a8fff",
  "created_at": 2000,
  "kind": 2222,
  "tags": [
    ["n", "eb4082d326b811385b1d6f088efd840feef6170e6d8bf43da8c5d39b6c32a4f2"],
    ["p", "0202020202020202020202020202020202020202020202020202020202020202"]
  ],
  "content": "{\n  \"0202020202020202020202020202020202020202020202020202020202020202\": \"1000000000\"\n}",
  "sig": "31e80fd881f3eaf477424919a45cc247f44a565d3a7305bc49e9fc73a754dfa4e9eeff6ad9b282cd700382419d018237e0ed5846dd7e63fc280190144b0330ac"
}
```

As it tries to transfer the totality of `4646ae5047316b4230d0086c8acec687f00b1cd9d1dc634f6cb358ac0a9a8fff`'s funds _again_ to the public key `0202020202020202020202020202020202020202020202020202020202020202`.

Notice the values of the `.created_at` fields in each case.

#### Limitations

NOSTR being "timeless" (getting a bit [philosophical](../nip-XX-1/nomad.md#philosophical-musings) now) makes things a bit difficult for us when trying to sequence transfers in a linear manner.
Publishing a double-spend transfer would not allow the double-spend to go through, as it would make **both** transfers invalid, the problem is precisely that it makes **all** transfers for that same public key from that point on invalid.

This could lead to "time-travel" attacks, where a public key publishes a message signed in the past to enough relays in the `CONSENSUS_RELAYS` list, making history invalid from a certain point on.

A "practical" solution to this is to simply place your trust on trustworthy relays, that will not allow past-dated transfers to be published, and wait for that window to lapse before considering a transference "confirmed".

...

## FAQs

...
