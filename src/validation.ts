'use strict';

import type { DependencyObject } from './dependency';

/**
 * Regular expression all identifiers must adhere to.
 *
 * Only 7-bit ASCII alphanumeric characters and underscores are allowed, underscores may not start an identifier name.
 *
 */
const identifierRegExp: RegExp = /^[a-z][_a-z0-9]*$/i;

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
const forbiddenWords: string[] = [
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
 * @throws {Error} If the given identifier fails regular expression validation.
 * @throws {Error} If the given identifier is forbidden.
 */
const identifier = (name: string): string => {
  if (!identifierRegExp.test(name)) {
    throw new Error(`identifier must adhere to '${identifierRegExp.toString()}'`);
  } else if (forbiddenWords.includes(name)) {
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
const codeAscii: number[] = [
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
 * @throws {Error} If the given function source code contains disallowed characters.
 * @throws {Error} If the given function source code is not a valid strict mode function body.
 */
const functionCode = (code: string): string => {
  if (code.split('').some((c: string): boolean => !codeAscii.includes(c.codePointAt(0) ?? 0))) {
    throw new Error('expected function code to only contain printable ASCII characters, HT, LF, FF, or CR');
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
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
const dependencyMap = (dependencies: Map<string, string>): Map<string, string> => {
  [...dependencies.entries()].forEach(([key, value]: [string, string]): void => {
    identifier(key);
    identifier(value);
  });

  return new Map<string, string>(dependencies.entries());
};

/**
 * Validate the given dependency object and return it if valid.
 *
 * @param dependency - The dependency object to validate.
 * @returns The validated dependency object.
 * @throws {Error} If the given dependency object is not a non-`null` `object`.
 * @throws {Error} If the given dependency object does not contain a `name` property.
 * @throws {Error} If the given dependency object does not contain a `code` property.
 * @throws {Error} If the given dependency object does not contain a `dependencies` property.
 * @see {@link identifier} for additional exceptions thrown.
 * @see {@link functionCode} for additional exceptions thrown.
 * @see {@link dependencyMap} for additional exceptions thrown.
 */
const dependencyObject = (dependency: DependencyObject): DependencyObject => {
  return {
    name: identifier(dependency.name),
    code: functionCode(dependency.code),
    dependencies: dependencyMap(dependency.dependencies),
  };
};

/**
 * Validate the given value is non-negative.
 *
 * @param datum - The value to validate.
 * @returns The validated value.
 * @throws {Error} If the given value is not a safe integer (cf. {@link Number.isSafeInteger}).
 * @throws {Error} If the given value value is negative.
 */
const nonNegativeInteger = (datum: number): number => {
  if (!Number.isSafeInteger(datum)) {
    throw new Error('expected datum to be a safe integer');
  } else if (datum < 0) {
    throw new Error('expected datum to be non-negative');
  }
  return datum;
};

/**
 * The maximum boot timeout value to allow.
 *
 */
const timeoutLimit: number = 1 << 30;

/**
 * Validate the given boot timeout value.
 *
 * @param timeout - The boot timeout value to validate.
 * @returns The validated boot timeout value.
 * @throws {Error} If the given timeout value is larger than the maximum boot timeout value allowed.
 * @see {@link nonNegativeInteger} for additional exceptions thrown.
 */
const timeout = (timeout: number): number => {
  if (timeoutLimit < nonNegativeInteger(timeout)) {
    throw new Error(`expected timeout to be at most ${timeoutLimit.toString()}`);
  }
  return timeout;
};

/**
 * Validate the given arguments map and return them if valid.
 *
 * @param args - The arguments map to validate.
 * @returns The validated arguments map (as a new object).
 * @throws {Error} If the given arguments map is not an object.
 * @see {@link identifier} for additional exceptions thrown.
 */
const argumentsMap = (args: Map<string, unknown>): Map<string, unknown> => {
  [...args.keys()].forEach(identifier);

  return args;
};

/**
 * Validate the given argument is a namespace identifier and return it if valid.
 *
 * A namespace identifier is a sequence of identifiers (as per {@link identifier}) separated by periods (`"."`).
 *
 * @param ns - The argument to validate.
 * @returns The validated namespace identifier.
 * @throws {Error} If the given argument is not a valid namespace identifier.
 * @see {@link identifier} for additional exceptions thrown.
 */
const namespace = (ns: string): string => {
  return ns
    .split('.')
    .map((part: string): string => identifier(part))
    .join('.');
};

export {
  identifier,
  functionCode,
  dependencyMap,
  dependencyObject,
  timeout,
  argumentsMap,
  namespace,
  nonNegativeInteger,
};
