// nomadvm: The Nomad Virtual Machine reference implementation
//
// MIT License
//
// Copyright (c) 2024 La Crypta
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * ...
 *
 * @packageDocumentation
 * @module
 */

/**
 * Regular expression all identifiers must adhere to.
 *
 * Only 7-bit ASCII alphanumeric characters and underscores are allowed, underscores may not start an identifier name.
 *
 */
export const _identifierRegExp: RegExp = /^[a-z]\w*$/i;

/**
 * Forbidden identifier names.
 *
 * The following JavaScript name classes are forbidden:
 *
 * - [reserved words](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#reserved_words) (including strict mode reserved words and reserved words in module code or async function bodies),
 * - [future reserved words](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#future_reserved_words) (including future reserved words in older standards),
 * - [identifiers with special meanings](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#identifiers_with_special_meanings), and
 * - [standard built-in objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects).
 *
 */
export const _forbiddenWords: string[] = [
  'AggregateError',
  'Array',
  'ArrayBuffer',
  'AsyncFunction',
  'AsyncGenerator',
  'AsyncGeneratorFunction',
  'AsyncIterator',
  'Atomics',
  'BigInt',
  'BigInt64Array',
  'BigUint64Array',
  'Boolean',
  'DataView',
  'Date',
  'Error',
  'EvalError',
  'FinalizationRegistry',
  'Float32Array',
  'Float64Array',
  'Function',
  'Generator',
  'GeneratorFunction',
  'Infinity',
  'Int16Array',
  'Int32Array',
  'Int8Array',
  'InternalError',
  'Intl',
  'Iterator',
  'JSON',
  'Map',
  'Math',
  'NaN',
  'Number',
  'Object',
  'Promise',
  'Proxy',
  'RangeError',
  'ReferenceError',
  'Reflect',
  'RegExp',
  'Set',
  'SharedArrayBuffer',
  'String',
  'Symbol',
  'SyntaxError',
  'TypeError',
  'URIError',
  'Uint16Array',
  'Uint32Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'WeakMap',
  'WeakRef',
  'WeakSet',
  'abstract',
  'arguments',
  'as',
  'async',
  'await',
  'boolean',
  'break',
  'byte',
  'case',
  'catch',
  'char',
  'class',
  'const',
  'continue',
  'debugger',
  'decodeURI',
  'decodeURIComponent',
  'default',
  'delete',
  'do',
  'double',
  'else',
  'encodeURI',
  'encodeURIComponent',
  'enum',
  'escape',
  'eval',
  'eval',
  'export',
  'extends',
  'false',
  'final',
  'finally',
  'float',
  'for',
  'from',
  'function',
  'get',
  'globalThis',
  'goto',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'int',
  'interface',
  'isFinite',
  'isNaN',
  'let',
  'long',
  'native',
  'new',
  'null',
  'of',
  'package',
  'parseFloat',
  'parseInt',
  'private',
  'protected',
  'public',
  'return',
  'set',
  'short',
  'static',
  'super',
  'switch',
  'synchronized',
  'this',
  'throw',
  'throws',
  'transient',
  'true',
  'try',
  'typeof',
  'undefined',
  'unescape',
  'var',
  'void',
  'volatile',
  'while',
  'with',
  'yield',
];

/**
 * Validate the given identifier and return it if valid.
 *
 * @param name - The identifier to validate.
 * @returns The validated identifier.
 * @throws {Error} if the given identifier fails regular expression validation.
 * @throws {Error} if the given identifier is forbidden.
 */
export const identifier = (name: string): string => {
  if (!_identifierRegExp.test(name)) {
    throw new Error(`identifier must adhere to '${_identifierRegExp.toString()}'`);
  } else if (_forbiddenWords.includes(name)) {
    throw new Error('identifier must not be a forbidden word');
  }
  return name;
};

/**
 * ASCII codes of all allowed characters in function source code.
 *
 * No Unicode characters are allowed, only a subset of 7-bit ASCII characters are allowed:
 *
 * - control characters: `\\t\\n\\f\\r`,
 * - alphanumeric characters: `0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`,
 * - additional printable symbols: ` !"#$%&'()*+,-./:;<=>?@[\]^_\`{|}~`.
 *
 */
export const _codeAscii: number[] = [
  0x09, 0x0a, 0x0c, 0x0d, 0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2d, 0x2e,
  0x2f, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x3b, 0x3c, 0x3d, 0x3e, 0x3f, 0x40, 0x41,
  0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51, 0x52, 0x53, 0x54,
  0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x5b, 0x5c, 0x5d, 0x5e, 0x5f, 0x60, 0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67,
  0x68, 0x69, 0x6a, 0x6b, 0x6c, 0x6d, 0x6e, 0x6f, 0x70, 0x71, 0x72, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a,
  0x7b, 0x7c, 0x7d, 0x7e,
];

/**
 * Validate the given function source code and return it if valid.
 *
 * @param code - The function source code to validate.
 * @returns The validated function source code.
 * @throws {Error} if the given function source code contains disallowed characters.
 * @throws {Error} if the given function source code is not a valid strict mode function body.
 */
export const functionCode = (code: string): string => {
  if (code.split('').some((c: string): boolean => !_codeAscii.includes(c.codePointAt(0) ?? 0))) {
    throw new Error('expected function code to only contain printable ASCII characters, HT, LF, FF, or CR');
  }
  try {
    /* eslint-disable-next-line @typescript-eslint/no-implied-eval */
    void Function(`"use strict"; ${code}`);
  } catch {
    throw new Error('function code must be a valid strict-mode Function body');
  }
  return code;
};

/**
 * Validate the given dependency map and return them if valid.
 *
 * @param dependencies - The dependency map to validate.
 * @returns The validated dependency map (as a new object).
 * @see {@link identifier} for additional exceptions thrown.
 */
export const dependencyMap = (dependencies: Map<string, string>): Map<string, string> => {
  Array.from(dependencies.entries()).forEach(([key, value]: [string, string]): void => {
    identifier(key);
    identifier(value);
  });

  return new Map<string, string>(dependencies.entries());
};

/**
 * Regular expression all event names must adhere to.
 *
 * Event names consist of "segments", separated by `:`.
 * Each segment consists of alphanumeric characters, `.`, or `-`.
 *
 */
export const _eventRegex: RegExp = /^[\w/.-]+(?::[\w/.-]+)*$/i;

/**
 * Validate the given event name and return it if valid.
 *
 * All event names must adhere to the following ABNF:
 *
 * ```ini
 * segment = 1*( ALPHA / DIGIT / "/" / "_" / "." / "-" )
 * event-name = segment *( ":" segment )
 * ```
 *
 * @param name - The event name to validate.
 * @returns The validated event name.
 * @throws {Error} if the given event name fails regular expression validation.
 */
export const event = (name: string): string => {
  if (!_eventRegex.test(name)) {
    throw new Error(`event name must adhere to ${_eventRegex.toString()}`);
  }

  return name;
};

/**
 * Regular expression all event name filters must adhere to.
 *
 * Event name filters consist of "segments", separated by `:`.
 * Each segment consists of alphanumeric characters, `.`, or `-`, or a _wildcard_.
 * Wildcards can be `*` or `**`.
 *
 */
export const _filterRegex: RegExp = /^(?:\*\*?|[\w/.-]+)(?::(?:\*\*?|[\w/.-]+))*$/i;

/**
 * Validate the given event name filter and return it if valid.
 *
 * All event name filters must adhere to the following ABNF:
 *
 * ```ini
 * filter-segment = "*" / "**" / 1*( ALPHA / DIGIT / "/" / "_" / "." / "-" )
 * filter = filter-segment *( ":" filter-segment )
 * ```
 *
 * @param filter - The event name filter to validate.
 * @returns The validated event name filter.
 * @throws {Error} if the given event name filter fails regular expression validation.
 * @throws {Error} if the given event name filter contains an adjacent pair of `**` wildcards.
 */
export const filter = (filter: string): string => {
  if (!_filterRegex.test(filter)) {
    throw new Error(`event name filter must adhere to ${_filterRegex.toString()}`);
  } else if (-1 != filter.indexOf('**:**')) {
    throw new Error('event name filter must not contain consecutive ** wildcards');
  }

  return filter;
};

/**
 * Validate the given value is non-negative.
 *
 * @param datum - The value to validate.
 * @returns The validated value.
 * @throws {Error} if the given value is not a safe integer (cf. {@link !Number.isSafeInteger}).
 * @throws {Error} if the given value value is negative.
 */
export const nonNegativeInteger = (datum: number): number => {
  if (!Number.isSafeInteger(datum)) {
    throw new Error('expected datum to be a safe integer');
  } else if (datum < 0) {
    throw new Error('expected datum to be non-negative');
  }
  return datum;
};

/**
 * The time delta value to allow.
 *
 * This is half of the [maximum delay value](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#maximum_delay_value) for {@link !setTimeout} (applicable to {@link !setInterval} as well).
 *
 */
export const _timeDeltaLimit: number = 1 << 30;

/**
 * Validate the given time delta value.
 *
 * @param delta - The time delta value to validate.
 * @returns The validated time delta value.
 * @throws {Error} if the given time delta value is larger than the maximum time delta value allowed.
 * @see {@link nonNegativeInteger} for additional exceptions thrown.
 */
export const timeDelta = (delta: number): number => {
  if (_timeDeltaLimit < nonNegativeInteger(delta)) {
    throw new Error(`expected time delta to be at most ${_timeDeltaLimit.toString()}`);
  }
  return delta;
};

/**
 * The type of an arguments map intended to be forwarded to a dependency.
 *
 */
export type ArgumentsMap = Map<string, unknown>;

/**
 * Validate the given arguments map and return them if valid.
 *
 * @param args - The arguments map to validate.
 * @returns The validated arguments map (as a new object).
 * @throws {Error} if the given arguments map is not an object.
 * @see {@link identifier} for additional exceptions thrown.
 */
export const argumentsMap = (args: Map<unknown, unknown>): ArgumentsMap => {
  Array.from(args.keys()).forEach((id: unknown) => 'string' === typeof id && identifier(id));

  return args as ArgumentsMap;
};

/**
 * Validate the given argument is an enclosure identifier and return it if valid.
 *
 * An enclosure identifier is a sequence of identifiers (as per {@link identifier}) separated by periods (`"."`).
 *
 * @param ns - The argument to validate.
 * @returns The validated enclosure identifier.
 * @throws {Error} if the given argument is not a valid enclosure identifier.
 * @see {@link identifier} for additional exceptions thrown.
 */
export const enclosure = (ns: string): string => {
  return ns
    .split('.')
    .map((part: string): string => identifier(part))
    .join('.');
};
