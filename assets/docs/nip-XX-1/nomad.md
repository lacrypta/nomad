# NIP-XX-1: Nomad --- DRAFT

`draft`
`optional`

`kind:1337`

`tag:n:import`
`tag:n:metadata`

> [!note]
> The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119.txt).

---

1. [Motivation](#motivation)
2. [Short Description](#short-description)
3. [Overview](#overview)
4. [Preliminary Definitions](#preliminary-definitions)
   1. [Simple Identifier](#simple-identifier)
   2. [Simple Body](#simple-body)
   3. [Simple Path](#simple-path)
5. [Nomad Syntax](#nomad-syntax)
   1. [The `n:import` Tag](#the-nimport-tag)
   2. [The `n:metadata` Tag](#the-nmetadata-tag)
      1. [The `predefined` Metadata Identifier](#the-predefined-metadata-identifier)
      2. [The `internal` Metadata Identifier](#the-internal-metadata-identifier)
      3. [The `external` Metadata Identifier](#the-external-metadata-identifier)
   3. [Validation](#validation)
6. [Nomad Semantics](#nomad-semantics)
   1. [_External_ Execution](#external-execution)
   2. [_Internal_ Execution](#internal-execution)
   3. [General Execution Procedure](#general-execution-procedure)
      1. [The `internal` / `external` Metadata Identifiers](#the-internal--external-metadata-identifiers)
      2. [Dealing with Imports and Script Parameters](#dealing-with-imports-and-script-parameters)
7. [FAQs](#faqs)
   1. [Why do we need a Virtual Machine?](#why-do-we-need-a-virtual-machine)
   2. [Why is there no "version" in Nomad?](#why-is-there-no-version-in-nomad)
   3. [Why use JavaScript?](#why-use-javascript)
   4. [How is this "unstoppable" or "uncensorable"?](#how-is-this-unstoppable-or-uncensorable)
   5. [Why is NOSTR used?](#why-is-nostr-used)
8. [Philosophical Musings](#philosophical-musings)

---

## Motivation

This proposal aims to provide a NOSTR-powered **uncensorable**, **decentralized**, and **highly available** application repository framework.

## Short Description

A new event kind is reserved for the publication of JavaScript source code.
Events of this kind can in turn declare other such events as dependencies, thus enabling behavioral composition.
Additionally, they may have associated metadata, so as to tailor their interpretation by complying clients.

The code therein is expected to be executed in a secure, curated, and idempotent execution environment, a reference implementation of which is provided as part of this proposal.

## Overview

First, we deal with some [Preliminary Definitions](#preliminary-definitions).

Next, we present the [Nomad Syntax](#nomad-syntax), the mechanism by which users may publish code to relays to make it available to consumers.

Next, we define the [Nomad Semantics](#nomad-semantics): the expected semantics for code execution, importing, and metadata handling.

We follow with a series of [FAQs](#faqs), and close with some [Philosophical Musings](#philosophical-musings).

A couple of appendixes is included as well:

- [Appendix A](./appendix-a) deals with the predefined dependencies that conforming implementations need to provide to Nomad scripts.
- [Appendix B](./appendix-b) lists the standard global objects that conforming implementations need to make available to Nomad code.
- [Appendix C](./appendix-c) specifies the virtual machine interface proper, with all of its exposed functionalities.

## Preliminary Definitions

In what follows, we'll define some terms to be used throughout the specification.

### Simple Identifier

A _simple identifier_ **MUST** be a string containing a valid JavaScript identifier name, satisfying the following regular expression: `/^[a-zA-Z][_a-zA-Z0-9]*$/`.
Additionally, this value **MUST NOT** be:

- a JavaScript [reserved word](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#reserved_words) (including strict mode reserved words and reserved words in module code or async function bodies), nor
- a [future reserved word](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#future_reserved_words) (including future reserved words in older standards), nor
- an [identifier with special meaning](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#identifiers_with_special_meanings), nor
- the names of [standard built-in objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects).

> [!note]
> Note that, in particular, identifiers as such defined **MAY NOT** start with an underscore (`_`) nor contain any dollar signs (`$`).
>
> Note as well, that although JavaScript identifiers [may contain any arbitrary Unicode code points or be specified by escape sequences](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#identifiers), this is **NOT** allowed here.
>
> Furthermore, the forbidden identifier names boil down to: `AggregateError`, `Array`, `ArrayBuffer`, `AsyncFunction`, `AsyncGenerator`, `AsyncGeneratorFunction`, `AsyncIterator`, `Atomics`, `BigInt`, `BigInt64Array`, `BigUint64Array`, `Boolean`, `DataView`, `Date`, `Error`, `EvalError`, `FinalizationRegistry`, `Float32Array`, `Float64Array`, `Function`, `Generator`, `GeneratorFunction`, `Infinity`, `Int16Array`, `Int32Array`, `Int8Array`, `InternalError`, `Intl`, `Iterator`, `JSON`, `Map`, `Math`, `NaN`, `Number`, `Object`, `Promise`, `Proxy`, `RangeError`, `ReferenceError`, `Reflect`, `RegExp`, `Set`, `SharedArrayBuffer`, `String`, `Symbol`, `SyntaxError`, `TypeError`, `URIError`, `Uint16Array`, `Uint32Array`, `Uint8Array`, `Uint8ClampedArray`, `WeakMap`, `WeakRef`, `WeakSet`, `abstract`, `arguments`, `as`, `async`, `await`, `boolean`, `break`, `byte`, `case`, `catch`, `char`, `class`, `const`, `continue`, `debugger`, `decodeURI`, `decodeURIComponent`, `default`, `delete`, `do`, `double`, `else`, `encodeURI`, `encodeURIComponent`, `enum`, `escape`, `eval`, `eval`, `export`, `extends`, `false`, `final`, `finally`, `float`, `for`, `from`, `function`, `get`, `globalThis`, `goto`, `if`, `implements`, `import`, `in`, `instanceof`, `int`, `interface`, `isFinite`, `isNaN`, `let`, `long`, `native`, `new`, `null`, `of`, `package`, `parseFloat`, `parseInt`, `private`, `protected`, `public`, `return`, `set`, `short`, `static`, `super`, `switch`, `synchronized`, `this`, `throw`, `throws`, `transient`, `true`, `try`, `typeof`, `undefined`, `unescape`, `var`, `void`, `volatile`, `while`, `with`, and `yield`.

### Simple Body

A _simple body_ **MUST** be a string consisting of valid JavaScript asynchronous function body code (ie. code that may legally be used as the sole argument to the standard-but-indirectly-available [`AsyncFunction` constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction/AsyncFunction)) under _strict mode_ (ie. preceded by `"use strict";`), and most likely **SHOULD** contain at least one `return` statement.
Alternatively, if `body` contains the prospective simple body, the following JavaScript code **MUST NOT** throw:

```javascript
new (Object.getPrototypeOf(async function () {}).constructor)(`"use strict"; ${body}`);
```

> [!warning]
> Note that a simple body is not expected to be a `Generator`, thus, you **MAY NOT** use `yield` _within its global scope_.
> Incidentally, you **MAY** use `yield` in an internally-defined function within the body proper.

Furthermore, a simple body **MUST** consist solely of the following byte values:

- `0x09`, `0x0a`, `0x0c`, `0x0d`, or
- `0x20` to `0x7e`.

These are the ASCII values of:

- horizontal tab,
- line feed,
- form feed,
- carriage return, and
- all [printable characters](https://en.wikipedia.org/wiki/ASCII#Printable_characters).

> [!note]
> As is the case [above](#simple-identifier), whereas JavaScript allows for arbitrary code points to be a part of a function body, we do **NOT**: if they're required, they can be built up from escape sequences.

### Simple Path

A _simple path_ **MUST** be a string consisting of one or more [simple identifiers](#simple-identifier) separated by slashes (`/`).

## Nomad Syntax

A _Nomad event_ is a `kind:1337` event of the form:

```javascript
{
    ...,
    "kind": 1337,
    ...,
    "tags": [
        ...,
        [
          "n:import",
          "{identifier}",
          "{nomad_event_id}",
          "{recommended_relay_url}",                // optional
        ],                                          // optional
        ...,
        [
          "n:metadata",
          "{identifier}",
          "{arg[1]}", "{arg[2]}", ..., "{arg[n]}",  // optional
        ],                                          // optional
        ...,
    ],
    ...,
    "content": ...,
    ...,
}
```

Note that `1337` is an _enumerated kind_, meaning it is a _regular_ event: relays **MUST** store and return them to clients for an indefinite amount of time.
Furthermore, `kind:1337` events are _non-deletable_ events[^non-deletable]: upon receiving a `kind:5` event targeting a `kind:1337` event, relays **MUST** ignore it and not forward it.

[^non-deletable]: There's a precedent for _non-deletable_ events in [NIP-09's _"Deleting a Deletion"_](https://github.com/nostr-protocol/nips/blob/master/09.md#deleting-a-deletion) section.

A Nomad event's `.tag` field **MAY** contain any number of `n:import` or `n:metadata` tags.

A Nomad event's `.content` field **MUST** be a [simple body](#simple-body); we'll call the `.content` of a Nomad event a _Nomad script_ or simply _a Nomad_.

### The `n:import` Tag

An `n:import` tag **MUST** have the following form:

```javascript
[
  "n:import",
  "{identifier}",
  "{nomad_event_id}",
  "{recommended_relay_url}",  // optional
]
```

where:

- **`{identifier}`:**
  This value **MUST** be a [simple identifier](#simple-identifier).
- **`{nomad_event_id}`:**
  This value **MUST** be a valid NOSTR event `.id`, consisting of 64 lowercase hexadecimal characters.
  This **MUST** be the `.id` of a Nomad event (ie. a `kind:1337` event itself).

- **`{recommended_relay_url}`:**
  This value, if present, **MUST** be a valid NOSTR relay URL.

If two instances of this tag have the same `{identifier}`, then they **MUST** have the same `{nomad_event_id}` field, but may differ in their `{recommended_relay_url}` fields.
On the other hand, the same `{nomad_event_id}` **MAY** appear more than once, even on tags with different `{identifier}` values.

### The `n:metadata` Tag

An `n:metadata` tag **MUST** have the following form:

```javascript
[
  "n:metadata",
  "{identifier}",
  "{arg[1]}", "{arg[2]}", ..., "{arg[n]}",  // optional
]
```

where:

- **`{identifier}`:**
  This value **MUST** be a [simple identifier](#simple-identifier).

- **`{arg[1]}`, `{arg[2]}`, ..., `{arg[n]}`:**
  These **MUST** be zero or more arbitrary strings.

If two instances of this tag have the same `{identifier}`, then they **MUST** also have the same list of arguments (byte-by-byte equal, that is).

The `{identifier}` is expected to serve as a way of modifying the _execution mode_ for the Nomad event it is attached to.
The current specification defines the following _metadata identifiers_:

- **`predefined`:** used for [predefined Nomad dependencies](./appendix-a).
- **`internal`:** used in the [general execution procedure](#general-execution-procedure).
- **`external`:** used in the [general execution procedure](#general-execution-procedure), but also as a semantic marker of sorts.

Future specifications may further define additional metadata `{identifier}` values in order to tailor how events are validated and interpreted.

> [!TIP]
> In order to avoid future conflicts, it is **RECOMMENDED** that non-standardized `n:metadata` identifiers start with `x-`, so as to make absolutely apparent the fact that they're intended for experimental or non-standard purposes.

#### The `predefined` Metadata Identifier

A `predefined` metadata identifier has the form:

```javascript
["n:metadata", "predefined". "{predefined_name}"]
```

where:

- **`{predefined_name}`:**
  This value **MUST** be a [simple path](#simple-path).

See the [general execution procedure](#general-execution-procedure) for its intended semantics.

#### The `internal` Metadata Identifier

An `internal` metadata identifier has the form (note the absence of arguments):

```javascript
["n:metadata", "internal"]
```

See the [general execution procedure](#general-execution-procedure) for its intended semantics.

#### The `external` Metadata Identifier

An `external` metadata identifier has the form (note the absence of arguments):

```javascript
["n:metadata", "external"]
```

See the [general execution procedure](#general-execution-procedure) for its intended semantics.

### Validation

In order for a NOSTR event to be a valid Nomad event, it **MUST** be a valid NOSTR event, and furthermore the following conditions need to be satisfied:

1. The `.kind` field **MUST** equal `1337`.
2. For any two `n:import` tags in `.tags` with identical `{identifier}` parts their `{nomad_event_id}` parts **MUST** be equal (but their `{recommended_relay_url}` parts **MAY** differ).
3. For any two `n:metadata` tags in `.tags` with identical `{identifier}` parts their arguments **MUST** be identical (byte-by-byte equal).
4. For every `n:import` tag in `.tags`:
    1. Their `{nomad_event_id}` part **MUST** be the `.id` field of a NOSTR event that is itself valid according to these rules.
    2. Their `{identifier}` part **MUST** be a valid [simple identifier](#simple-identifier).
    3. Their `{recommended_relay_url}` part **MUST** be a _syntactically_ valid Secure WebSocket URL.
5. For every `n:metadata` tag in `.tags`:
    1. Their `{identifier}` part **MUST** be a valid [simple identifier](#simple-identifier).
    2. The event as a whole **MUST** be valid according to the validation rules the metadata definition for `{identifier}` establishes.
6. The `.content` field **MUST** be a valid [simple body](#simple-body).

Note that this is simply a _syntactic_ validation: Nomad events may still be invalid by virtue of their dynamic behavior.

## Nomad Semantics

Execution of Nomad event with id `id` (a `string`), querying `relays` (a list of `string`s), and parameters `params` (a mapping from `string`s to arbitrary values), comes in two _flavours_:

- **external:** denoted as `executeExternal(id, relays, params)`, it's the main execution form, used when executing a Nomad script on the "outer" scope.
- **internal:** denoted as `executeInternal(id, relays, params)`, used to execute imported and predefined scripts.

Both of these are very similar, but differ in their handling the resulting value.
To that end, we define the `toJsonResult` procedure first, that takes an arbitrary `data` parameter and proceeds as follows:

> 1. Let `result` be the result of executing:
>
>    ```javascript
>    JSON.stringify(data);
>    ```
>
> 2. If the previous operation threw, return `FAILURE`.
> 3. If `result` is `undefined`, return `FAILURE`.
> 4. Return `result`.

Now, we'll treat each execution procedure in turn.

### _External_ Execution

An `executeExternal(id, relays, params)` call proceeds as follows:

> 1. Query `relays` for the event with id `id`, call the result `e`.
> 2. If `e` is empty, return `FAILURE`.
> 3. if `e` is not valid according to the [validation procedure](#validation) above, return `FAILURE`.
> 4. If `e.tags` does not contain an `n:metadata` tag with an `external` metadata identifier, return `FAILURE`.
> 5. If `e.tags` contains an `n:metadata` tag with a `predefined` metadata identifier, then:
>    1. If `id` is not recognized as a [predefined dependency](./appendix-a) by the executing agent, return `FAILURE`.
>    2. Let `result` be the result of executing the [predefined dependency](./appendix-a).
>    3. Return the result of calling `toJsonResult(result)`.
>
> 6. Let `imports` be a new empty mapping with `string` keys and arbitrary values.
> 7. For each `n:import` tag in `e.tags`, call it `t`, do:
>    1. Let `name` be `t[1]` (ie, the `{identifier}` part of an `n:import` tag).
>    2. If `name` is a key in `params`, return `FAILURE`.
>    3. Let `iid` be `t[2]` (ie. the `{nomad_event_id}` part of an `n:import` tag).
>    4. Let `rrelays` be `[t[3]]` (ie. the `{recommended_relay_url}` part of an `n:import` tag), or `[]` if `t[3]` does not exist.
>    5. Let `value` be the result of calling `executeInternal(iid, [...rrelays, ...relays], {})`.
>    6. If `value` is `FAILURE`, return `FAILURE`.
>    7. Assign `value` to `imports[name]`.
> 8. Let `body` be the result of prepending `'"use strict";'` to `e.content`.
> 9. Let `importedNames` be the keys of `imports`, and `importedValues` their corresponding values.
> 10. Let `paramNames` be the keys of `params`, and `paramValues` their corresponding values.
> 11. Let `result` be the result of executing:
>
>     ```javascript
>     await (new AsyncFunction(
>       ...importedNames, ...paramNames, body,
>     ))(
>       ...importedValues, ...paramValues,
>     );
>     ```
>
> 12. If the previous operation threw, return `FAILURE`.
> 13. Return the result of executing `toJsonResult(result)`.

### _Internal_ Execution

An `executeInternal(id, relays, params)` call proceeds very similarly:

> 1. Query `relays` for the event with id `id`, call the result `e`.
> 2. If `e` is empty, return `FAILURE`.
> 3. if `e` is not valid according to the [validation procedure](#validation) above, return `FAILURE`.
> 4. If `e.tags` does not contain an `n:metadata` tag with an `internal` metadata identifier, return `FAILURE`.
> 5. If `e.tags` contains an `n:metadata` tag with a `predefined` metadata identifier, then:
>    1. If `id` is not recognized as a [predefined dependency](./appendix-a) by the executing agent, return `FAILURE`.
>    2. Return the result of executing the [predefined dependency](./appendix-a).
> 6. Let `imports` be a new empty mapping with `string` keys and arbitrary values.
> 7. For each `n:import` tag in `e.tags`, call it `t`, do:
>    1. Let `name` be `t[1]` (ie, the `{identifier}` part of an `n:import` tag).
>    2. If `name` is a key in `params`, return `FAILURE`.
>    3. Let `iid` be `t[2]` (ie. the `{nomad_event_id}` part of an `n:import` tag).
>    4. Let `rrelays` be `[t[3]]` (ie. the `{recommended_relay_url}` part of an `n:import` tag), or `[]` if `t[3]` does not exist.
>    5. Let `value` be the result of calling `executeInternal(iid, [...rrelays, ...relays], {})`.
>    6. If `value` is `FAILURE`, return `FAILURE`.
>    7. Assign `value` to `imports[name]`.
> 8. Let `body` be the result of prepending `'"use strict";'` to `e.content`.
> 9. Let `importedNames` be the keys of `imports`, and `importedValues` their corresponding values.
> 10. Let `paramNames` be the keys of `params`, and `paramValues` their corresponding values.
> 11. Let `result` be the result of executing:
>
>     ```javascript
>     await (new AsyncFunction(
>       ...importedNames, ...paramNames, body,
>     ))(
>       ...importedValues, ...paramValues,
>     )
>     ```
>
> 12. If the previous operation threw, return `FAILURE`.
> 13. Return `result`.

---

Conforming agents **MAY** _execute_ a Nomad event.
This is done by spinning up a **Nomad Virtual Machine**, and submitting the Nomad event in question for execution, taking `n:import` tags into account.
Any number of _named_ parameters **MAY** be passed to it, and differing `n:metadata` identifiers **MAY** stipulate for specific parameter names to be passed in specific execution contexts.

Abstractly, a Nomad execution procedure interface looks like:

```typescript
type JsonAble = number | string | boolean | null | JsonAble[] | { [_: string]: JsonAble };

declare function execute(nomadEvent: object, parameters: { [_: string]: JsonAble }): JsonAble;
```

Where the `nomadEvent` parameter receives a whole NOSTR event, and the `parameters` parameter receives a mapping from argument names to argument values.
The arguments given **MUST** be serializable as JSON, so as to be able to be communicated to the Nomad Virtual Machine running the Nomad script proper.

### General Execution Procedure

Upon a Nomad event _e_ being submitted for execution, the following steps take place:

1. **Import Closure / Validation:** the `n:import` tags found on _e_ are scanned, the event ids therein mentioned collected, and this process is recursively repeated for every Nomad event mentioned; all collected events are themselves [validated](#validation).
    If given, `{recommended_relay_url}` values **MAY** be used first (repeated `{identifier}` values with matching `{nomad_event_id}` values representing multiple relay URLs to query for the same import).

    If any of these collections fails (ie. because the relays used have no knowledge of the required event), execution as a whole fails.

    The result of this procedure is a [DAG](https://en.wikipedia.org/wiki/Directed_acyclic_graph) specifying all the Nomad events collected and related to each other via their import relations.
2. **Topological Import Sorting:** the Nomad events collected in the previous step are [topologically sorted](https://en.wikipedia.org/wiki/Topological_sorting), using the events' `.id` fields' numerical values as a tie-breakers.

    This will yield a linear ordering of all the Nomad events with _e_ in the last position.

    Finally, every Nomad event already _installed_ in the Nomad Virtual Machine is removed from this list, so as to only keep "new" events in it.
3. **VM Enclosure Creation:** the Nomad Virtual Machine is able to isolate a set of Nomad events so as to limit their interaction with already installed Nomads.
    This step stipulates the creation of one such temporary "enclosure" so as to limit Nomad interactions during set-up.
4. **Dependencies Installation:** all but the last event in the list (ie. _e_) are now _installed_ into the created enclosure.
    Installation entails execution and caching of the result, so as to make it available to importing Nomads.
5. **Script Execution:** now _e_ is ready to be executed; based on _e_'s `n:metadata` tags, the actual execution mode may change somewhat, but it will eventually entail asking the Nomad Virtual Machine to execute _e_'s `.content` within the enclosure created above, and report the return value as the ultimate result altogether, passing any given parameters forward.

#### The `internal` / `external` Metadata Identifiers

An `internal` metadata identifier has the form (note the absence of arguments):

```javascript
["n:metadata", "internal"]
```

This identifier is intended to signal that the result of executing this Nomad event's `.content` field is _not_ JSON-able, and to be used exclusively as an import by other Nomad events in their `n:import` tags.

If the Nomad event being executed at the "top level" (ie. _e_ above) contains an `internal` metadata identifier, the execution procedure **MUST** stop immediately.

Likewise, an `external` metadata identifier has the form:

```javascript
["n:metadata", "external"]
```

This identifier signals that the result of executing this Nomad event's `.content` field _is_ JSON-able.

If the Nomad event being executed at the "top level" (ie. _e_ above) does not contain an `external` metadata identifier, the execution procedure **MAY** stop immediately.

#### Dealing with Imports and Script Parameters

When a Nomad event contains a valid `n:import` tag with `{identifier}` _x_ and `{nomad_event_id}` _i_, the event's `.content` will be executed in an environment that contains a local variable named _x_, the contents of which will be the frozen result of executing the Nomad event indicated by _i_.

By mean of example, consider this Nomad event:

```javascript
{
  "id": "0101010101010101010101010101010101010101010101010101010101010101",
  ...,
  "kind": 1337,
  "tags": [
    ["n:metadata", "internal"]
  ],
  "content": "return { hello: (x) => `Hello ${x}!!`, goodbye: (x) => `Goodbye ${x}!!` };",
  ...,
}
```

Now, let's use it as a import in a new Nomad event:

```javascript
{
  "id": "0202020202020202020202020202020202020202020202020202020202020202",
  ...,
  "kind": 1337,
  "tags": [
    ["n:import", "say", "0101010101010101010101010101010101010101010101010101010101010101"],
    ["n:metadata", "external"]
  ],
  "content": "let sayHello = say.hello('foo'); let sayGoodbye = say.goodbye('bar'); return `${sayHello}...${sayGoodbye}`;",
  ...,
}
```

Upon executing this second Nomad event, the result should be a single string:

```javascript
"Hello foo!!...Goodbye bar!!"
```

Note how the variable `say` needed not be defined in the Nomad script's body, but was rather provided by the Nomad runtime.
Note as well, how the first Nomad event is free to return whatever it wishes to, since it is merely being used as an import dependency, there's no restriction on its result being JSON-able; on the contrary, the second Nomad event is _forced_ to return a JSON-able result, for it must be communicated to the host system via JSON encoding.

In a similar vein, certain `n:metadata` identifiers **MAY** require the Nomad runtime (or the framework using the Nomad runtime) to pass additional parameters to the Nomad event being executed.
Parameters in this sense are **always** named: ie. named parameters are used exclusively, and each `n:metadata` identifier **MUST** specify the names expected to be used.

By way of example, consider the following Nomad event (nb. the `x-with-current-time` is merely an example and inconsequential):

```javascript
{
  "id": "0303030303030303030303030303030303030303030303030303030303030303",
  ...,
  "kind": 1337,
  "tags": [
    ["n:metadata", "x-with-current-time"],
    ["n:metadata", "external"]
  ],
  "content": "return currentTime.toString();",
  ...,
}
```

Note how the variable `currentTime` is neither defined within the Nomad script's body, nor imported via an `n:import` tag, it is rather provided by the Nomad runtime because of the `x-with-current-time` identifier in the `n:metadata` tag.

There's more that can be done with the Nomad runtime as it stands today, and, this being a living standard, it is expected to evolve from its current status.

## FAQs

...

### Why do we need a Virtual Machine?

...

### Why is there no "version" in Nomad?

...

### Why use JavaScript?

...

### How is this "unstoppable" or "uncensorable"?

...

### Why is NOSTR used?

...

## Philosophical Musings

...
