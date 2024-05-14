'use strict';

/* global NomadVM */
/* global DependencyObject */
/* global EventCaster */
/* global Validation */
/* global WorkerEventCaster */

/**
 * The code the {@link Worker} will end up executing.
 *
 * NOTE: it is IMPERATIVE that this be an arrow function, so that it may be executed in the global scope with access to the {@link Worker}'s `this`.
 *
 * @returns {void}
 */
const workerRunner = () => {
  'use strict';

  const STARTUP = Date.now();

  // --------------------------------------------------------------------------------------------

  /**
   * Tunnel index to use to signal boot completion.
   *
   * @type {number}
   */
  const BOOT_TUNNEL = 0;

  /**
   * Maximum number of import declarations in a NOMAD execution / install.
   *
   * @type {number}
   */
  const IMPORT_LIMIT = 1024;

  /**
   * Maximum number of arguments in a NOMAD execution.
   *
   * @type {number}
   */
  const ARGUMENTS_LIMIT = 1024;

  // --------------------------------------------------------------------------------------------
  // -- Expose Standard Classes -----------------------------------------------------------------
  // --------------------------------------------------------------------------------------------

  this.AsyncFunction = async function () {}.constructor;
  this.GeneratorFunction = function* () {}.constructor;
  this.AsyncGeneratorFunction = async function* () {}.constructor;

  // this.ArrayIteratorPrototype = Object.getPrototypeOf(new Array()[Symbol.iterator]());
  // this.StringIteratorPrototype = Object.getPrototypeOf(new String()[Symbol.iterator]());
  // this.MapIteratorPrototype = Object.getPrototypeOf(new Map()[Symbol.iterator]());
  // this.SetIteratorPrototype = Object.getPrototypeOf(new Set()[Symbol.iterator]());
  // this.RegExpIteratorPrototype = Object.getPrototypeOf(new RegExp()[Symbol.matchAll]());
  // this.GeneratorIteratorPrototype = Object.getPrototypeOf(this.GeneratorFunction()());
  // this.AsyncGeneratorIteratorPrototype = Object.getPrototypeOf(this.AsyncGeneratorFunction()());

  // --------------------------------------------------------------------------------------------
  // -- Back-Up global entities -----------------------------------------------------------------
  // --------------------------------------------------------------------------------------------

  const _addEventListener = addEventListener;
  const _eval = eval;
  const _postMessage = postMessage;
  const _setTimeout = setTimeout;
  const _Date_now = Date.now;

  const _Array = Array;
  const _Date = Date;
  const _Error = Error;
  const _Function = Function;
  const _Map = Map;
  const _Number = Number;
  const _Object = Object;
  const _Promise = Promise;
  const _RegExp = RegExp;
  const _Set = Set;
  const _Symbol = Symbol;
  const _WeakSet = WeakSet;

  const _Reflect = Reflect;

  const _JSON = JSON;
  const _Math = Math;

  // --------------------------------------------------------------------------------------------
  // -- Shimming --------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------

  /**
   * Shim for {@link Array.fromAsync}.
   *
   * Needed because: Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimArrayFromAsync = () => {
    if (undefined === this.Array.fromAsync) {
      // ref: https://github.com/es-shims/array-from-async/blob/main/index.mjs
      this.Array.fromAsync = async function (items, mapfn, thisArg) {
        const isConstructor = (obj) => {
          const prox = new Proxy(obj, {
            construct() {
              return prox;
            },
          });
          try {
            new prox();
            return true;
          } catch {
            return false;
          }
        };

        if (Symbol.asyncIterator in items || Symbol.iterator in items) {
          const result = null !== this && isConstructor(this) ? new this() : Array(0);

          let i = 0;
          for await (const v of items) {
            if (Number.MAX_SAFE_INTEGER < i) {
              throw TypeError('Input is too long and exceeded Number.MAX_SAFE_INTEGER times.');
            }

            if (mapfn) {
              result[i] = await mapfn.call(thisArg, v, i);
            } else {
              result[i] = v;
            }
            i++;
          }

          result.length = i;
          return result;
        } else {
          const { length } = items;
          const result = null !== this && isConstructor(this) ? new this(length) : Array(length);

          let i = 0;

          while (i < length) {
            if (Number.MAX_SAFE_INTEGER < i) {
              throw TypeError('Input is too long and exceeded Number.MAX_SAFE_INTEGER times.');
            }

            const v = await items[i];
            if (mapfn) {
              result[i] = await mapfn.call(thisArg, v, i);
            } else {
              result[i] = v;
            }
            i++;
          }

          result.length = i;
          return result;
        }
      };
    }
  };

  /**
   * Shim for {@link ArrayBuffer}.
   *
   * Needed because: Firefox has problems dealing with resizing.
   *
   * @returns {void}
   */
  const shimArrayBuffer = () => {
    // TODO: add shim for ArrayBuffer
  };

  /**
   * Shim for {@link Atomics.waitAsync}.
   *
   * Needed because: Firefox has no support.
   *
   * @returns {void}
   */
  const shimAtomicsWaitAsync = () => {
    // TODO: add shim for Atomics.waitAsync
  };

  /**
   * Shim for {@link FinalizationRegistry}.
   *
   * Needed because: Firefox has no support for non-registered symbols as target.
   *
   * @returns {void}
   */
  const shimFinalizationRegistry = () => {
    // TODO: add shim for FinalizationRegistry
  };

  /**
   * Shim for {@link Iterator}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorConstructor = () => {
    // TODO: add shim for Iterator
  };

  /**
   * Shim for {@link Iterator.from}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorFrom = () => {
    // TODO: add shim for Iterator.from
  };

  /**
   * Shim for {@link Iterator.prototype.drop}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorPrototypeDrop = () => {
    // TODO: add shim for Iterator.prototype.drop
  };

  /**
   * Shim for {@link Iterator.prototype.every}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorPrototypeEvery = () => {
    // TODO: add shim for Iterator.prototype.every
  };

  /**
   * Shim for {@link Iterator.prototype.filter}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorPrototypeFilter = () => {
    // TODO: add shim for Iterator.prototype.filter
  };

  /**
   * Shim for {@link Iterator.prototype.find}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorPrototypeFind = () => {
    // TODO: add shim for Iterator.prototype.find
  };

  /**
   * Shim for {@link Iterator.prototype.flatMap}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorPrototypeFlatMap = () => {
    // TODO: add shim for Iterator.prototype.flatMap
  };

  /**
   * Shim for {@link Iterator.prototype.forEach}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorPrototypeForEach = () => {
    // TODO: add shim for Iterator.prototype.forEach
  };

  /**
   * Shim for {@link Iterator.prototype.map}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorPrototypeMap = () => {
    // TODO: add shim for Iterator.prototype.map
  };

  /**
   * Shim for {@link Iterator.prototype.reduce}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorPrototypeReduce = () => {
    // TODO: add shim for Iterator.prototype.reduce
  };

  /**
   * Shim for {@link Iterator.prototype.some}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorPrototypeSome = () => {
    // TODO: add shim for Iterator.prototype.some
  };

  /**
   * Shim for {@link Iterator.prototype.take}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorPrototypeTake = () => {
    // TODO: add shim for Iterator.prototype.take
  };

  /**
   * Shim for {@link Iterator.prototype.toArray}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorPrototypeToArray = () => {
    // TODO: add shim for Iterator.prototype.toArray
  };

  /**
   * Shim for {@link Map.groupBy}.
   *
   * Needed because: Samsung has no support.
   *
   * @returns {void}
   */
  const shimMapGroupBy = () => {
    if (undefined === this.Map.groupBy) {
      this.Map.groupBy = function (items, callbackFn) {
        const result = new Map();
        let i = 0;
        for (const item of items) {
          const key = callbackFn(item, i++);
          if (result.has(key)) {
            result.get(key).push(item);
          } else {
            result.set(key, [item]);
          }
        }
        return result;
      };
    }
  };

  /**
   * Shim for {@link Promise.withResolvers}.
   *
   * Needed because: Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimPromiseWithResolvers = () => {
    if (undefined === this.Promise.withResolvers) {
      // ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers#description
      this.Promise.withResolvers = function () {
        let resolve, reject;
        return {
          promise: new Promise((res, rej) => {
            resolve = res;
            reject = rej;
          }),
          resolve,
          reject,
        };
      };
    }
  };

  /**
   * Shim for {@link Set.prototype.difference}.
   *
   * Needed because: Firefox, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimSetPrototypeDifference = () => {
    if (undefined === this.Set.prototype.difference) {
      this.Set.prototype.difference = function (other) {
        const result = new Set();
        for (const element of this) {
          if (!other.has(element)) {
            result.add(element);
          }
        }
        return result;
      };
    }
  };

  /**
   * Shim for {@link Set.prototype.intersection}.
   *
   * Needed because: Firefox, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimSetPrototypeIntersection = () => {
    if (undefined === this.Set.prototype.intersection) {
      this.Set.prototype.intersection = function (other) {
        const result = new Set();
        for (const element of this) {
          if (other.has(element)) {
            result.add(element);
          }
        }
        return result;
      };
    }
  };

  /**
   * Shim for {@link Set.prototype.isDisjointFrom}.
   *
   * Needed because: Firefox, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimSetPrototypeIsDisjointFrom = () => {
    if (undefined === this.Set.prototype.isDisjointFrom) {
      this.Set.prototype.isDisjointFrom = function (other) {
        for (const element of this) {
          if (other.has(element)) {
            return false;
          }
        }
        return true;
      };
    }
  };

  /**
   * Shim for {@link Set.prototype.isSubsetOf}.
   *
   * Needed because: Firefox, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimSetPrototypeIsSubsetOf = () => {
    if (undefined === this.Set.prototype.isSubsetOf) {
      this.Set.prototype.isSubsetOf = function (other) {
        for (const element of this) {
          if (!other.has(element)) {
            return false;
          }
        }
        return true;
      };
    }
  };

  /**
   * Shim for {@link Set.prototype.isSupersetOf}.
   *
   * Needed because: Firefox, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimSetPrototypeIsSupersetOf = () => {
    if (undefined === this.Set.prototype.isSupersetOf) {
      this.Set.prototype.isSupersetOf = function (other) {
        for (const element of other.keys()) {
          if (!this.has(element)) {
            return false;
          }
        }
        return true;
      };
    }
  };

  /**
   * Shim for {@link Set.prototype.symmetricDifference}.
   *
   * Needed because: Firefox, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimSetPrototypeSymmetricDifference = () => {
    if (undefined === this.Set.prototype.symmetricDifference) {
      this.Set.prototype.symmetricDifference = function (other) {
        const result = new Set();
        for (const element of this) {
          if (!other.has(element)) {
            result.add(element);
          }
        }
        for (const element of other.keys()) {
          if (!this.has(element)) {
            result.add(element);
          }
        }
        return result;
      };
    }
  };

  /**
   * Shim for {@link Set.prototype.union}.
   *
   * Needed because: Firefox, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimSetPrototypeUnion = () => {
    if (undefined === this.Set.prototype.union) {
      this.Set.prototype.union = function (other) {
        const result = new Set();
        for (const element of this) {
          result.add(element);
        }
        for (const element of other.keys()) {
          result.add(element);
        }
        return result;
      };
    }
  };

  /**
   * Shim for {@link WeakMap}.
   *
   * Needed because: Firefox has no support for non-registered symbols as target.
   *
   * @returns {void}
   */
  const shimWeakMap = () => {
    // TODO: add shim for WeakMap
  };

  /**
   * Shim for {@link WeakRef}.
   *
   * Needed because: Firefox has no support for non-registered symbols as target.
   *
   * @returns {void}
   */
  const shimWeakRef = () => {
    // TODO: add shim for WeakRef
  };

  /**
   * Shim for {@link WeakSet}.
   *
   * Needed because: Firefox has no support for non.registered symbols as target.
   *
   * @returns {void}
   */
  const shimWeakSet = () => {
    // TODO: add shim for WeakSet
  };

  // --------------------------------------------------------------------------------------------
  // -- Patching --------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------

  /**
   * Patch {@link eval}.
   *
   * This makes it so that only [indirect eval](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#direct_and_indirect_eval) is available.
   *
   * @returns {void}
   */
  const patchEval = () => {
    this.eval = (script) => _eval?.(`"use strict"; ${script}`);
  };

  /**
   * Patch {@link Object}.
   *
   * This makes it so that {@link Object.prototype.toLocaleString} maps to {@link Object.prototype.toString}.
   *
   * @returns {void}
   */
  const patchObject = () => {
    this.Object.prototype.toLocaleString = this.Object.prototype.toString;
  };

  /**
   * Patch {@link Number}.
   *
   * This makes it so that {@link Number.prototype.toLocaleString} maps to {@link Number.prototype.toString}.
   *
   * @returns {void}
   */
  const patchNumber = () => {
    this.Number.prototype.toLocaleString = this.Number.prototype.toString;
  };

  /**
   * Patch {@link BigInt}.
   *
   * This makes it so that {@link BigInt.prototype.toLocaleString} maps to {@link BigInt.prototype.toString}.
   *
   * @returns {void}
   */
  const patchBigInt = () => {
    this.BigInt.prototype.toLocaleString = this.BigInt.prototype.toString;
  };

  /**
   * Patch {@link Math}.
   *
   * This makes it so that {@link Math.random} always returns {@link NaN}.
   *
   * @returns {void}
   */
  const patchMath = () => {
    this.Math.random = () => NaN;
  };

  /**
   * Patch {@link Date}.
   *
   * This makes it so that:
   *
   * - {@link Date} will return {@link NaN} for the current date.
   * - {@link Date.now} will return {@link NaN}.
   * - {@link Date.prototype.getDate} maps to {@link Date.prototype.getUTCDate}.
   * - {@link Date.prototype.getDay} maps to {@link Date.prototype.getUTCDay}.
   * - {@link Date.prototype.getFullYear} maps to {@link Date.prototype.getUTCFullYear}.
   * - {@link Date.prototype.getHours} maps to {@link Date.prototype.getUTCHours}.
   * - {@link Date.prototype.getMilliseconds} maps to {@link Date.prototype.getUTCMilliseconds}.
   * - {@link Date.prototype.getMinutes} maps to {@link Date.prototype.getUTCMinutes}.
   * - {@link Date.prototype.getMonth} maps to {@link Date.prototype.getUTCMonth}.
   * - {@link Date.prototype.getSeconds} maps to {@link Date.prototype.getUTCSeconds}.
   * - {@link Date.prototype.setDate} maps to {@link Date.prototype.setUTCDate}.
   * - {@link Date.prototype.setFullYear} maps to {@link Date.prototype.setUTCFullYear}.
   * - {@link Date.prototype.setHours} maps to {@link Date.prototype.setUTCHours}.
   * - {@link Date.prototype.setMilliseconds} maps to {@link Date.prototype.setUTCMilliseconds}.
   * - {@link Date.prototype.setMinutes} maps to {@link Date.prototype.setUTCMinutes}.
   * - {@link Date.prototype.setMonth} maps to {@link Date.prototype.setUTCMonth}.
   * - {@link Date.prototype.setSeconds} maps to {@link Date.prototype.setUTCSeconds}.
   * - {@link Date.prototype.getTimezoneOffset} will return `0`.
   * - {@link Date.prototype.toDateString} will return {@link Date.prototype.toISOString}'s date part.
   * - {@link Date.prototype.toTimeString} will return {@link Date.prototype.toISOString}'s time part.
   * - {@link Date.prototype.toString} maps to {@link Date.prototype.toISOString}.
   * - {@link Date.prototype.toLocaleDateString} maps to {@link Date.prototype.toDateString}.
   * - {@link Date.prototype.toLocaleString} maps to {@link Date.prototype.toString}.
   * - {@link Date.prototype.toLocaleTimeString} maps to {@link Date.prototype.toTimeString}.
   *
   * @returns {void}
   */
  const patchDate = () => {
    /**
     * Either construct a new {@link Date} instance or use as a function to obtain the {@link Date.toISOString} output.
     *
     * This patch is intended to remove access to the current date / time.
     * It strives to remove any implementation-dependent behavior from the {@link Date} constructor.
     *
     * @param {...unknown} args - Construction / execution arguments.
     * @returns {string | Date} The {@link Date.toISOString} output (if called as a function), or the constructed {@link Date} instance (if used as a constructor).
     * @see {@link https://stackoverflow.com/a/70860699} for the original code adapted to fit our needs.
     */
    this.Date = function Date(...args) {
      const between = (left, mid, right) => left <= mid && mid <= right;
      const validTs = (ts) => between(-8640000000000000, ts, 8640000000000000);

      let ts = NaN;
      if (1 === args.length) {
        const [arg] = args;
        switch (typeof arg) {
          case 'number':
            if (validTs(arg)) {
              ts = arg;
            }
            break;
          case 'string':
            {
              const parse = (str, def) => {
                const num = _Number.parseInt(str, 10);
                _Number.isNaN(num) ? def : num;
              };
              const toPaddedDecimal = (num, padding, withSign = false) =>
                (withSign ? (num < 0 ? '-' : '+') : '') + _Math.abs(num).toString().padStart(padding, '0');

              const match = arg.match(
                /^(?<year>\d{4}|[+-]\d{6})(?:-(?<month>\d\d)(?:-(?<day>\d\d))?)?(?:T(?<hours>\d\d):(?<minutes>\d\d)(?::(?<seconds>\d\d)(?:\.(?<milliseconds>\d{1,3}))?)?)?(?:Z|(?<tzHours>[+-]\d\d):(?<tzMinutes>\d\d))?$/,
              );
              if (null !== match && '-000000' !== match.groups.year) {
                const year = parse(match.groups.year, NaN);
                const month = parse(match.groups.month, 1);
                const day = parse(match.groups.day, 1);
                const hours = parse(match.groups.hours, 0);
                const minutes = parse(match.groups.minutes, 0);
                const seconds = parse(match.groups.seconds, 0);
                const milliseconds = parse(match.groups.milliseconds, 0);
                const tzHours = parse(match.groups.tzHours, 0);
                const tzMinutes = parse(match.groups.tzMinutes, 0);
                const daysInMonth = [
                  31,
                  28 + (0 === year % 400 || (0 !== year % 100 && 0 === year % 4)),
                  31,
                  30,
                  31,
                  30,
                  31,
                  31,
                  30,
                  31,
                  30,
                  31,
                ];
                if (
                  !_Number.isNaN(year) &&
                  between(1, month, 12) &&
                  between(1, day, daysInMonth[month - 1]) &&
                  between(0, hours, 24) &&
                  between(0, minutes, 59) &&
                  between(0, seconds, 59) &&
                  between(0, milliseconds, 999) &&
                  between(-23, tzHours, 23) &&
                  between(0, tzMinutes, 59)
                ) {
                  const sYear = between(0, year, 9999) ? toPaddedDecimal(year, 4) : toPaddedDecimal(year, 6, true);
                  const sMonth = toPaddedDecimal(month, 2);
                  const sDay = toPaddedDecimal(day, 2);
                  const sHours = toPaddedDecimal(hours, 2);
                  const sMinutes = toPaddedDecimal(minutes, 2);
                  const sSeconds = toPaddedDecimal(seconds, 2);
                  const sMilliseconds = toPaddedDecimal(milliseconds, 3);
                  const sTzHours = toPaddedDecimal(tzHours, 2, true);
                  const sTzMinutes = toPaddedDecimal(tzMinutes, 2);
                  const sTz = 0 === tzHours && 0 === tzMinutes ? 'Z' : `${sTzHours}:${sTzMinutes}`;
                  const parsed = _Date.parse(
                    `${sYear}-${sMonth}-${sDay}T${sHours}:${sMinutes}:${sSeconds}.${sMilliseconds}${sTz}`,
                  );
                  if (validTs(parsed)) {
                    ts = parsed;
                  }
                }
              }
            }
            break;
          case 'object':
            if (arg instanceof Date) {
              const time = arg.getTime();
              if (validTs(time)) {
                ts = time;
              }
            }
            break;
        }
      } else {
        const utc = _Date.UTC(...args);
        if (validTs(utc)) {
          ts = utc;
        }
      }
      return new.target ? _Reflect.construct(new.target === Date ? _Date : new.target, [ts]) : new _Date(ts).toString();
    };
    _Object.defineProperty(this.Date, 'length', {
      value: _Date.length,
      configurable: true,
    });
    _Date.prototype.constructor = this.Date;
    this.Date.prototype = _Date.prototype;
    this.Date.parse = _Date.parse;
    this.Date.UTC = _Date.UTC;
    this.Date.now = () => NaN;
    this.Date.prototype.getDate = this.Date.prototype.getUTCDate;
    this.Date.prototype.getDay = this.Date.prototype.getUTCDay;
    this.Date.prototype.getFullYear = this.Date.prototype.getUTCFullYear;
    this.Date.prototype.getHours = this.Date.prototype.getUTCHours;
    this.Date.prototype.getMilliseconds = this.Date.prototype.getUTCMilliseconds;
    this.Date.prototype.getMinutes = this.Date.prototype.getUTCMinutes;
    this.Date.prototype.getMonth = this.Date.prototype.getUTCMonth;
    this.Date.prototype.getSeconds = this.Date.prototype.getUTCSeconds;
    this.Date.prototype.getTimezoneOffset = () => 0;
    this.Date.prototype.setDate = this.Date.prototype.setUTCDate;
    this.Date.prototype.setFullYear = this.Date.prototype.setUTCFullYear;
    this.Date.prototype.setHours = this.Date.prototype.setUTCHours;
    this.Date.prototype.setMilliseconds = this.Date.prototype.setUTCMilliseconds;
    this.Date.prototype.setMinutes = this.Date.prototype.setUTCMinutes;
    this.Date.prototype.setMonth = this.Date.prototype.setUTCMonth;
    this.Date.prototype.setSeconds = this.Date.prototype.setUTCSeconds;
    this.Date.prototype.toString = this.Date.prototype.toISOString;
    this.Date.prototype.toDateString = function () {
      return this.toISOString().split('T')[0];
    };
    this.Date.prototype.toTimeString = function () {
      return this.toISOString().split('T')[1];
    };
    this.Date.prototype.toLocaleDateString = this.Date.prototype.toDateString;
    this.Date.prototype.toLocaleString = this.Date.prototype.toString;
    this.Date.prototype.toLocaleTimeString = this.Date.prototype.toTimeString;
  };

  /**
   * Patch {@link String}.
   *
   * This makes it so that:
   *
   * - {@link String.prototype.localeCompare} performs a byte-wise comparison.
   * - {@link String.prototype.toLocaleLowerCase} maps to {@link String.prototype.toLowerCase}.
   * - {@link String.prototype.toLocaleUpperCase} maps to {@link String.prototype.toUpperCase}.
   *
   * @returns {void}
   */
  const patchString = () => {
    this.String.prototype.localeCompare = function (compareString) {
      return this < compareString ? -1 : compareString < this ? 1 : 0;
    };
    this.String.prototype.toLocaleLowerCase = this.String.prototype.toLowerCase;
    this.String.prototype.toLocaleUpperCase = this.String.prototype.toUpperCase;
  };

  /**
   * Patch {@link Array}.
   *
   * This makes it so that {@link Array.prototype.toLocaleString} maps to {@link Array.prototype.toString}.
   *
   * @returns {void}
   */
  const patchArray = () => {
    this.Array.prototype.toLocaleString = this.Array.prototype.toString;
  };

  /**
   * Patch {@link TypedArray}.
   *
   * This makes it so that:
   *
   * - {@link Int8Array.prototype.toLocaleString} maps to {@link Int8Array.prototype.toString}.
   * - {@link Uint8Array.prototype.toLocaleString} maps to {@link Uint8Array.prototype.toString}.
   * - {@link Uint8ClampedArray.prototype.toLocaleString} maps to {@link Uint8ClampedArray.prototype.toString}.
   * - {@link Int16Array.prototype.toLocaleString} maps to {@link Int16Array.prototype.toString}.
   * - {@link Uint16Array.prototype.toLocaleString} maps to {@link Uint16Array.prototype.toString}.
   * - {@link Int32Array.prototype.toLocaleString} maps to {@link Int32Array.prototype.toString}.
   * - {@link Uint32Array.prototype.toLocaleString} maps to {@link Uint32Array.prototype.toString}.
   * - {@link BigInt64Array.prototype.toLocaleString} maps to {@link BigInt64Array.prototype.toString}.
   * - {@link BigUint64Array.prototype.toLocaleString} maps to {@link BigUint64Array.prototype.toString}.
   * - {@link Float32Array.prototype.toLocaleString} maps to {@link Float32Array.prototype.toString}.
   * - {@link Float64Array.prototype.toLocaleString} maps to {@link Float64Array.prototype.toString}.
   *
   * @returns {void}
   */
  const patchTypedArray = () => {
    this.Int8Array.prototype.toLocaleString = this.Int8Array.prototype.toString;
    this.Uint8Array.prototype.toLocaleString = this.Uint8Array.prototype.toString;
    this.Uint8ClampedArray.prototype.toLocaleString = this.Uint8ClampedArray.prototype.toString;
    this.Int16Array.prototype.toLocaleString = this.Int16Array.prototype.toString;
    this.Uint16Array.prototype.toLocaleString = this.Uint16Array.prototype.toString;
    this.Int32Array.prototype.toLocaleString = this.Int32Array.prototype.toString;
    this.Uint32Array.prototype.toLocaleString = this.Uint32Array.prototype.toString;
    this.BigInt64Array.prototype.toLocaleString = this.BigInt64Array.prototype.toString;
    this.BigUint64Array.prototype.toLocaleString = this.BigUint64Array.prototype.toString;
    this.Float32Array.prototype.toLocaleString = this.Float32Array.prototype.toString;
    this.Float64Array.prototype.toLocaleString = this.Float64Array.prototype.toString;
  };

  /**
   * Patch {@link RegExp}.
   *
   * This makes it so that the following deprecated static properties are removed:
   *
   * - {@link RegExp.$1}, {@link RegExp.$2}, {@link RegExp.$3}, {@link RegExp.$4}, {@link RegExp.$5}, {@link RegExp.$6}, {@link RegExp.$7}, {@link RegExp.$8}, {@link RegExp.$9}.
   * - {@link RegExp.input}, {@link RegExp.$_}.
   * - {@link RegExp.lastMatch}, {@link RegExp.$&}.
   * - {@link RegExp.lastParen}, {@link RegExp.$+}.
   * - {@link RegExp.leftContext}, {@link RegExp.$`}.
   * - {@link RegExp.rightContext}, {@link RegExp.$'}.
   *
   * @returns {void}
   */
  const patchRegExp = () => {
    /**
     * Wrapper around {@link RegExp} constructor so as to hide deprecated static properties (needed in Firefox).
     *
     * @param {...any} args - Constructor arguments.
     * @returns {RegExp} The constructed {@link RegExp}.
     */
    this.RegExp = function RegExp(...args) {
      return new.target ? _Reflect.construct(new.target === RegExp ? _RegExp : new.target, args) : _RegExp(...args);
    };
    _Object.defineProperty(this.RegExp, 'length', {
      value: _RegExp.length,
      configurable: true,
    });
    _RegExp.prototype.constructor = this.RegExp;
    this.RegExp.prototype = _RegExp.prototype;
    this.RegExp[_Symbol.species] = _RegExp[_Symbol.species];
  };

  // --------------------------------------------------------------------------------------------
  // -- Deep Freezing ---------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------

  /**
   * Recursively call {@link Object.freeze} on {@link this}.
   *
   * @returns {void}
   */
  const deepFreezeThis = () => {
    /**
     * Freeze the given object and all its ancestry and accessible properties.
     *
     * This function will recurse on the whole hierarchical ancestry freezing every object in its path.
     * Additionally, it will freeze all non-computed properties, as well as the getter / setters themselves found.
     *
     * @param {any} subject - Object to freeze.
     * @param {WeakSet} processed - Set of objects already frozen so as to prevent infinite recursion and speed the process up.
     * @returns {void}
     */
    const deepFreeze = (subject, processed = new _WeakSet()) => {
      if (null === subject || ('object' !== typeof subject && 'function' !== typeof subject)) {
        return;
      }
      let current = subject;
      do {
        if (processed.has(current)) {
          break;
        }
        processed.add(current);
        _Object.freeze(current);

        const descriptors = _Object.getOwnPropertyDescriptors(current);
        for (const key of _Object.getOwnPropertyNames(current).concat(_Object.getOwnPropertySymbols(current))) {
          if ('get' in descriptors[key]) {
            _Object.freeze(descriptors[key].get);
          }
          if ('set' in descriptors[key]) {
            _Object.freeze(descriptors[key].set);
          }
          if ('value' in descriptors[key]) {
            deepFreeze(descriptors[key].value, processed);
          }
        }
        current = _Object.getPrototypeOf(current);
      } while (null !== current);
    };

    deepFreeze(this);
  };

  // --------------------------------------------------------------------------------------------
  // -- Low-Level JSON Messaging ----------------------------------------------------------------
  // --------------------------------------------------------------------------------------------

  /**
   * Post the JSON string associated to the given data to the host {@link NomadVM}.
   *
   * @param {object} data - Data to post to the host {@link NomadVM}.
   * @returns {void}
   * @see {@link NomadVM.#postJsonMessage} for a more comprehensive treatment.
   */
  const postJsonMessage = (data) => {
    _postMessage(_JSON.stringify(data));
  };

  /**
   * Post a `resolve` message to the host {@link NomadVM}.
   *
   * A `resolve` message has the following form:
   *
   * ```json
   * {
   *   name: "resolve",
   *   tunnel: <int>,
   *   payload: <unknown>
   * }
   * ```
   *
   * Where:
   *
   * - `tunnel` is the index of the VM-side tunnel awaiting a response.
   * - `payload` is any resolution result being returned.
   *
   * @param {number} tunnel - The tunnel index to resolve.
   * @param {unknown} payload - The payload to use for resolution.
   * @returns {void}
   */
  const postResolveMessage = (tunnel, payload) => {
    postJsonMessage({ name: 'resolve', tunnel, payload });
  };

  /**
   * Post a `reject` message to the host {@link NomadVM}.
   *
   * A `reject` message has the following form:
   *
   * ```json
   * {
   *   name: "reject",
   *   tunnel: <int>,
   *   error: <string>
   * }
   * ```
   *
   * Where:
   *
   * - `tunnel` is the index of the VM-side tunnel awaiting a response.
   * - `error` is the rejection's error string.
   *
   * @param {number} tunnel - The tunnel index to reject.
   * @param {string} error - The error message to use for {@link Error} construction in the {@link NomadVM}.
   * @returns {void}
   */
  const postRejectMessage = (tunnel, error) => {
    postJsonMessage({ name: 'reject', tunnel, error });
  };

  /**
   * Post an `emit` message to the host {@link NomadVM}.
   *
   * An `emit` message has the following form:
   *
   * ```json
   * {
   *   name: "emit",
   *   event: <string>,
   *   args: <unknown[]>
   * }
   * ```
   *
   * Where:
   *
   * - `event` is the event name being emitted on the VM.
   * - `args` is an array of optional event arguments.
   *
   * @param {string} event - The event name to emit.
   * @param {Array<unknown>} args - The arguments to associate to the given event.
   * @returns {void}
   */
  const postEmitMessage = (event, args) => {
    postJsonMessage({ name: 'emit', event, args });
  };

  /**
   * Post a `call` message to the host {@link NomadVM}.
   *
   * A `call` message has the following form:
   *
   * ```json
   * {
   *   name: "call",
   *   namespace: <string>,
   *   tunnel: <int>,
   *   idx: <int>,
   *   args: <unknown[]>,
   * }
   * ```
   *
   * Where:
   *
   * - `namespace` is the WW-side namespace that is awaiting the call's result.
   * - `tunnel` is the WW-side tunnel index awaiting the call's result.
   * - `idx` is the function index being called.
   * - `args` is an array of optional call arguments.
   *
   * @param {string} namespace - The namespace to use.
   * @param {number} tunnel - The tunnel index where the call result is expected.
   * @param {number} idx - The function index to call in the {@link NomadVM}.
   * @param {Array<unknown>} args - The arguments to forward to the function call itself.
   * @returns {void}
   */
  const postCallMessage = (namespace, tunnel, idx, args) => {
    postJsonMessage({
      name: 'call',
      namespace,
      tunnel,
      idx,
      args,
    });
  };

  // --------------------------------------------------------------------------------------------
  // -- Event Management ------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------

  /**
   * Glob-enabled Event Caster ({@link Worker}-side implementation).
   *
   * @inner
   * @see {@link EventCaster} for a more detailed treatment.
   */
  class WorkerEventCaster {
    /**
     * Validate the given callback and return it if valid.
     *
     * @param {unknown} callback - The callback to validate.
     * @returns {Function} The validated callback value.
     * @throws {Error} If the given callback is not a `Function` instance.
     * @see {@link Validation.validateCallback} for a more detailed treatment.
     */
    static validateCallback(callback) {
      if (!(callback instanceof _Function)) {
        throw new _Error('expected callback to be a function');
      }

      return callback;
    }

    /**
     * Regular expression all event names must adhere to.
     *
     * @type {RegExp}
     * @private
     * @see {@link EventCaster.#eventRegex} for a more detailed treatment.
     */
    static #eventRegex = /^[.a-z0-9-]+(?::[.a-z0-9-]+)*$/i;

    /**
     * Validate the given event name and return it if valid.
     *
     * @param {unknown} name - The event name to validate.
     * @returns {string} The validated event name.
     * @throws {Error} If the given event name is not a `string`.
     * @throws {Error} If the given event name fails regular expression validation.
     * @see {@link EventCaster.validateEvent} for a more detailed treatment.
     */
    static validateEvent(name) {
      if ('string' !== typeof name) {
        throw new _Error('event name must be a string');
      } else if (!WorkerEventCaster.#eventRegex.test(name)) {
        throw new _Error(`event name must adhere to ${WorkerEventCaster.#eventRegex}`);
      }

      return name;
    }

    /**
     * Regular expression all event name filters must adhere to.
     *
     * @type {RegExp}
     * @private
     * @see {@link EventCaster.#filterRegex} for a more detailed treatment.
     */
    static #filterRegex = /^(?:\*\*?|[.a-z0-9-]+)(?::(?:\*\*?|[.a-z0-9-]+))*$/i;

    /**
     * Validate the given event name filter and return it if valid.
     *
     * @param {unknown} filter - The event name filter to validate.
     * @returns {string} The validated event name filter.
     * @throws {Error} If the given event name filter is not a `string`.
     * @throws {Error} If the given event name filter fails regular expression validation.
     * @see {@link EventCaster.validateFilter} for a more detailed treatment.
     */
    static validateFilter(filter) {
      if ('string' !== typeof filter) {
        throw new _Error('event name filter must be a string');
      } else if (!WorkerEventCaster.#filterRegex.test(filter)) {
        throw new _Error(`event name filter must adhere to ${WorkerEventCaster.#filterRegex}`);
      } else if (-1 != filter.indexOf('**:**')) {
        throw new _Error('event name filter must not contain consecutive ** wildcards');
      }

      return filter;
    }

    /**
     * Turn an event name filter into a filtering {@link RegExp}.
     *
     * @param {unknown} filter - The event name filter to transform.
     * @returns {RegExp} The transformed event name filter.
     * @private
     * @see {@link WorkerEventCaster.validateFilter} for additional exceptions thrown.
     * @see {@link EventCaster.#filterToRegExp} for a more detailed treatment.
     */
    static #filterToRegExp(filter) {
      return new _RegExp(
        '^' +
          WorkerEventCaster.validateFilter(filter)
            .split(':')
            .map((part) => {
              switch (part) {
                case '*':
                  return '[.A-Za-z0-9-]+';
                case '**':
                  return '?[.A-Za-z0-9-]+(?::[.A-Za-z0-9-]+)*';
                default:
                  return part.replace(/\./g, '\\.');
              }
            })
            .join(':')
            .replace(/^\?/g, '') +
          '$',
      );
    }

    /**
     * The event listener map.
     *
     * @type {Map.<Function, Set.<RegExp>>}
     * @private
     * @see {@link EventCaster.#listeners} for a more detailed treatment.
     */
    #listeners = new _Map();

    /**
     * Attach the given callback to the event caster, triggered on events matching the given filter.
     *
     * @param {unknown} filter - Event name filter to assign the listener to.
     * @param {unknown} callback - Callback to call on a matching event being cast.
     * @returns {WorkerEventCaster} `this`, for chaining.
     * @see {@link WorkerEventCaster.#filterToRegExp} for additional exceptions thrown.
     * @see {@link WorkerEventCaster.validateCallback} for additional exceptions thrown.
     * @see {@link EventCaster.on} for additional exceptions thrown.
     */
    on(filter, callback) {
      if (!this.#listeners.has(WorkerEventCaster.validateCallback(callback))) {
        this.#listeners.set(callback, new Set());
      }
      this.#listeners.get(callback).add(WorkerEventCaster.#filterToRegExp(filter));

      return this;
    }

    /**
     * Attach the given callback to the event caster, triggered on events matching the given filter, and removed upon being called once.
     *
     * @param {unknown} filter - Event name filter to assign the listener to.
     * @param {unknown} callback - Callback to call on a matching event being cast.
     * @returns {WorkerEventCaster} `this`, for chaining.
     * @see {@link WorkerEventCaster.on} for additional exceptions thrown.
     * @see {@link EventCaster.once} for a more detailed treatment.
     */
    once(filter, callback) {
      const wrapped = (...args) => {
        callback.apply(undefined, args);
        this.off(wrapped);
      };
      return this.on(filter, wrapped);
    }

    /**
     * Remove the given callback from the listeners set.
     *
     * @param {unknown} callback - The callback to remove.
     * @returns {WorkerEventCaster} `this`, for chaining.
     * @see {@link EventCaster.off} for a more detailed treatment.
     */
    off(callback) {
      this.#listeners.delete(callback);
      return this;
    }

    /**
     * Cast the given event with the given arguments and trigger any matching listeners.
     *
     * @param {unknown} name - The event name to cast.
     * @param {...unknown} args - Any additional arguments o associate to the cast event.
     * @returns {WorkerEventCaster} `this`, for chaining.
     * @see {@link WorkerEventCaster.validateEvent} for additional exceptions thrown.
     * @see {@link EventCaster.cast} for a more detailed treatment.
     */
    cast(name, ...args) {
      WorkerEventCaster.validateEvent(name);

      for (let [callback, filters] of this.#listeners.entries()) {
        if (filters.values().some((filter) => filter.test(name))) {
          _setTimeout(callback.apply(undefined, [name, ...args]));
        }
      }

      return this;
    }
  }

  // --------------------------------------------------------------------------------------------
  // -- Namespace Framework ---------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------

  /**
   * The type of a WW-side tunnel descriptor.
   *
   * @typedef SimpleTunnelDescriptor
   * @type {object}
   * @internal
   * @property {Function} resolve - Resolution callback.
   * @property {Function} reject - Rejection callback.
   */

  /**
   * The type of a Namespace object.
   *
   * @typedef NamespaceObject
   * @type {object}
   * @internal
   * @property {Object<string, unknown>} installedDependencies - Dependencies installed in the namespace.
   * @property {WorkerEventCaster} eventCaster - Event caster for this namespace.
   * @property {Set<string>} linked - Set of linked namespaces (for event propagation).
   * @property {boolean} muted - Whether this namespace is muted for the host.
   * @property {Array<SimpleTunnelDescriptor>} tunnels - List of active tunnels in this namespace.
   * @property {Set<string>} subs - Set of sub-namespaces inheriting from this one.
   * @property {?string} sup - The parent namespace, or `null` if none.
   */

  /**
   * Active namespace map.
   *
   * @type {Map<string, NamespaceObject>}
   */
  const namespaces = new _Map();

  /**
   * Retrieve the given namespace's data.
   *
   * @param {string} namespace - Namespace to retrieve.
   * @returns {NamespaceObject} The namespace data associated with the given namespace name.
   * @throws {Error} If the given namespace does not exist.
   */
  const getNamespace = (namespace) => {
    if (!namespaces.has(namespace)) {
      throw new _Error(`namespace ${namespace} does not exist`);
    }
    return namespaces.get(namespace);
  };

  /**
   * Add the given namespace to the active namespaces mapping, using the given parent namespace.
   *
   * @param {string} namespace - Namespace to add.
   * @param {string} parent - Parent namespace to use as base.
   * @returns {void}
   * @throws {Error} If the given namespace already exists.
   */
  const addNamespace = (namespace, parent = null) => {
    if (namespaces.has(namespace)) {
      throw new _Error(`namespace ${namespace} already exists`);
    }

    parent ??= null;

    let proto = null;
    if (parent !== null) {
      const { installedDependencies: parentInstalledDependencies, subs: parentSubs } = getNamespace(parent);
      proto = parentInstalledDependencies;
      parentSubs.add(namespace);
    }

    namespaces.set(namespace, {
      installedDependencies: _Object.create(proto),
      eventCaster: new WorkerEventCaster(),
      linked: new _Set(),
      muted: false,
      tunnels: [],
      subs: new Set(),
      sup: parent,
    });
  };

  /**
   * Remove the given namespace (with its children) and reject all of their awaiting tunnels.
   *
   * @param {string} namespace - Namespace to remove.
   * @returns {Array<string>} The removed namespaces (the one given, and any transitive children of it).
   */
  const removeNamespace = (namespace) => {
    const { tunnels, subs } = getNamespace(namespace);
    namespaces.delete(namespace);

    const result = [namespace];
    subs.forEach((subNamespace) => {
      result.push(...removeNamespace(subNamespace));
    });

    const error = new _Error('deleting namespace');
    tunnels.forEach(({ reject }, tunnel) => {
      delete tunnels[tunnel];
      reject(error);
    });

    return result;
  };

  /**
   * Cast the given user event with the given arguments in the given namespace and its linked namespaces; cast towards the host if not muted.
   *
   * @param {string} namespace - Namespace to use.
   * @param {string} name - Event name to cast.
   * @param {...unknown} args - Arguments to cast alongside the event.
   * @returns {void}
   */
  const castUserInNamespace = (namespace, name, ...args) => {
    const { eventCaster, linked, muted } = getNamespace(namespace);
    eventCaster.cast(`user:${name}`, ...args);
    for (const linkedNamespace in linked) {
      getNamespace(linkedNamespace).eventCaster.cast(`user:${name}`, ...args);
    }
    if (!muted) {
      postEmitMessage(`${namespace}:user:${name}`, args);
    }
  };

  /**
   * Cast the given host event with the given arguments in the given namespace and its linked namespaces.
   *
   * @param {string} namespace - Namespace to use.
   * @param {string} name - Event name to cast.
   * @param {...unknown} args - Arguments to cast alongside the event.
   * @returns {void}
   */
  const castHostInNamespace = (namespace, name, ...args) => {
    const { eventCaster, linked } = getNamespace(namespace);
    eventCaster.cast(`host:${name}`, ...args);
    for (const linkedNamespace in linked) {
      getNamespace(linkedNamespace).eventCaster.cast(`host:${name}`, ...args);
    }
  };

  /**
   * Retrieve a list of all installed dependencies in a given namespace (and its ancestors).
   *
   * @param {string} namespace - Namespace to use.
   * @returns {Array<string>} List of installed dependency names.
   */
  const listInstalled = (namespace) => {
    const result = [];
    for (const dep in getNamespace(namespace).installedDependencies) {
      result.push(dep);
    }
    return result;
  };

  /**
   * Retrieve a list of all namespaces the given one links to.
   *
   * @param {string} namespace - Namespace to use.
   * @returns {Array<string>} List of linked namespace names.
   */
  const listLinkedTo = (namespace) => {
    return _Array.from(getNamespace(namespace).linked.values()).sort();
  };

  /**
   * Retrieve a list of all namespaces the given one is linked from.
   *
   * @param {string} namespace - Namespace to use.
   * @returns {Array<string>} List of linking namespace names.
   */
  const listLinkedFrom = (namespace) => {
    getNamespace(namespace);
    return _Array
      .from(
        namespaces
          .entries()
          .filter(([, { linked }]) => linked.has(namespace))
          .map(([name]) => name),
      )
      .sort();
  };

  /**
   * Determine whether the given namespace is muted.
   *
   * @param {string} namespace - Namespace to use.
   * @returns {boolean} Whether the given namespace is muted or not.
   */
  const isMuted = (namespace) => {
    return getNamespace(namespace).muted;
  };

  /**
   * Retrieve a list of all namespaces in the given one's ancestry (the result will start with the given namespace and move "upwards" in the ancestry chain).
   *
   * @param {string} namespace - Namespace to use.
   * @returns {Array<string>} List of namespace names in the ancestry chain.
   */
  const getAncestors = (namespace) => {
    const result = [];
    for (let current = namespace; null !== current; current = getNamespace(current).sup) {
      result.push(current);
    }
    return result;
  };

  /**
   * Retrieve a list of all children namespaces of the given one.
   *
   * @param {string} namespace - Namespace to use.
   * @returns {Array<string>} List of children namespace names.
   */
  const getChildren = (namespace) => {
    return _Array.from(getNamespace(namespace).subs).sort();
  };

  /**
   * Retrieve the number of pending tunnels in the given namespace.
   *
   * @param {string} namespace - Namespace to use.
   * @returns {number} The number of pending tunnels in the given namespace.
   */
  const pendingTunnels = (namespace) => {
    return getNamespace(namespace).tunnels.filter((x) => undefined !== x).length;
  };

  // --------------------------------------------------------------------------------------------
  // -- Tunnelling Framework --------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------

  /**
   * Create a new tunnel (cf. {@link NomadVM.#tunnels}) on the given namespace, with the given resolution and rejection callbacks, returning the index of the created tunnel.
   *
   * @param {string} namespace - Namespace to add the tunnel on.
   * @param {Function} resolve - The resolution callback.
   * @param {Function} reject - The rejection callback.
   * @returns {number} The created tunnel's ID.
   */
  const addTunnel = (namespace, resolve, reject) => {
    const { tunnels } = getNamespace(namespace);
    return tunnels.push({ resolve, reject }) - 1;
  };

  /**
   * Remove the given tunnel ID from the given namespace, and return its former resolution / rejection callbacks.
   *
   * @param {string} namespace - The namespace to use.
   * @param {number} tunnel - The tunnel to remove.
   * @returns {{reject: Function, resolve: Function}} The resolution / rejection callbacks that used to be at the given index.
   * @throws {Error} If the given tunnel ID does not exist.
   */
  const removeTunnel = (namespace, tunnel) => {
    const { tunnels } = getNamespace(namespace);
    if (!(tunnel in tunnels)) {
      throw new _Error('tunnel does not exist');
    }
    const result = tunnels[tunnel];
    delete tunnels[tunnel];
    return result;
  };

  /**
   * Resolve the given tunnel in the given namespace ID with the given arguments, removing the tunnel from the namespace's tunnels list.
   *
   * @param {string} namespace - Namespace to use.
   * @param {number} tunnel - Tunnel to resolve.
   * @param {unknown} arg - Argument to pass on to the resolution callback.
   * @returns {void}
   * @see {@link NomadVM.removeTunnel} for additional exceptions thrown.
   */
  const resolveTunnel = (namespace, tunnel, arg) => {
    removeTunnel(namespace, tunnel).resolve(arg);
  };

  /**
   * Reject the given tunnel in the given namespace ID with the given error object, removing the tunnel from the namespace's tunnels list.
   *
   * @param {string} namespace - Namespace to use.
   * @param {number} tunnel - Tunnel to reject.
   * @param {Error} error - {@link Error} to pass on to the rejection callback.
   * @returns {void}
   * @see {@link NomadVM.removeTunnel} for additional exceptions thrown.
   */
  const rejectTunnel = (namespace, tunnel, error) => {
    removeTunnel(namespace, tunnel).reject(error);
  };

  // --------------------------------------------------------------------------------------------
  // -- Dependency Management -------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------

  /**
   * Execute the given dependency in the given namespace passing in the given arguments map in a secure context and return its result.
   *
   * The dependency code will be executed with access to each dependency name mapped to the installed dependency's value.
   * Additionally, every value in the dependency map will be exposed as a variable.
   * Furthermore, the dependency is execute in the global context, in strict mode.
   *
   * @param {string} namespace - Namespace to use.
   * @param {DependencyObject} dependency - Dependency to execute.
   * @param {Map<string, unknown>} args - Arguments map to use.
   * @returns {unknown} The result of executing the given dependency.
   * @throws {Error} If there are any missing dependencies.
   * @throws {Error} If any argument would shadow an imported dependency.
   */
  const executeDependency = (namespace, dependency, args) => {
    const { installedDependencies, eventCaster } = getNamespace(namespace);
    const importedNames = _Object.keys(dependency.dependencies);
    {
      if (IMPORT_LIMIT < importedNames.length) {
        throw new _Error(`too many imports 1024 < ${importedNames.length}`);
      }
      const missing = importedNames.filter((name) => !(dependency.dependencies[name] in installedDependencies));
      if (0 !== missing.length) {
        throw new _Error(
          `missing dependencies: [${_Array
            .from(new _Set(missing.map((name) => dependency.dependencies[name])))
            .join(', ')}]`,
        );
      }
    }
    const argumentNames = [...args.keys()];
    {
      if (ARGUMENTS_LIMIT < argumentNames.length) {
        throw new _Error(`too many arguments 1024 < ${argumentNames.length}`);
      }
      const shadowed = argumentNames.filter((name) => name in dependency.dependencies);
      if (0 < shadowed.length) {
        throw new _Error(`shadowing arguments [${_Array.from(new _Set(shadowed)).join(', ')}]`);
      }
    }

    const __events__ = _Object.create(null);
    const __on = (filter, callback) => {
      eventCaster.on(filter, callback);
      return __events__;
    };
    const __once = (filter, callback) => {
      eventCaster.once(filter, callback);
      return __events__;
    };
    const __off = (callback) => {
      eventCaster.off(callback);
      return __events__;
    };
    const __cast = (name, ...args) => {
      castUserInNamespace(namespace, name, ...args);
      return __events__;
    };
    __events__.on = (...args) => __on(...args);
    __events__.once = (...args) => __once(...args);
    __events__.off = (...args) => __off(...args);
    __events__.cast = (...args) => __cast(...args);

    // ref: https://stackoverflow.com/a/34523915
    return new _Function(
      '__events__',
      ...importedNames,
      ...argumentNames,
      //
      `"use strict"; if (true) { ${dependency.code}; } return null;
    `,
    ).call(
      undefined,
      __events__,
      ...importedNames.map((importedName) => installedDependencies[dependency.dependencies[importedName]]),
      ...argumentNames.map((argumentName) => args.get(argumentName)),
    );
  };

  /**
   * Install the given dependency in the given namespace by executing in a secure context and caching its result.
   *
   * @param {string} namespace - Namespace to use.
   * @param {DependencyObject} dependency - Dependency to execute.
   * @returns {void}
   * @throws {Error} If there are any missing dependencies.
   * @see {@link NomadVM.executeDependency} for further execution context details.
   */
  const installDependency = (namespace, dependency) => {
    const { installedDependencies } = getNamespace(namespace);
    if (dependency.name in installedDependencies) {
      throw new _Error(`duplicate dependency ${dependency.name}`);
    }
    const result = executeDependency(namespace, dependency, new _Map());
    if ('object' === typeof result) {
      installedDependencies[dependency.name] = _Object.freeze(result);
    } else {
      installedDependencies[dependency.name] = result;
    }
  };

  /**
   * Declare the given function index as a predefined function under the given name in the given namespace.
   *
   * @param {string} namespace - Namespace to use.
   * @param {number} idx - Function index to use for execution.
   * @param {string} name - Function name to use for registration.
   * @returns {void}
   * @throws {Error} If the given name is already in use.
   */
  const addPredefined = (namespace, idx, name) => {
    const { installedDependencies } = getNamespace(namespace);
    if (name in installedDependencies) {
      throw new _Error(`duplicate dependency ${name}`);
    }
    const __predefined = _Object.freeze(
      (...args) =>
        new _Promise((resolve, reject) => {
          postCallMessage(namespace, addTunnel(namespace, resolve, reject), idx, args);
        }),
    );
    installedDependencies[name] = (...args) => __predefined(...args);
  };

  // --------------------------------------------------------------------------------------------
  // -- Boot Sequence ---------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------

  try {
    // ------------------------------------------------------------------------------------------
    // -- Worker Steps --------------------------------------------------------------------------
    // ------------------------------------------------------------------------------------------

    // -- Shimming ------------------------------------------------------------------------------

    {
      shimArrayFromAsync();
      shimArrayBuffer();
      shimAtomicsWaitAsync();
      shimFinalizationRegistry();
      shimIteratorConstructor();
      shimIteratorFrom();
      shimIteratorPrototypeDrop();
      shimIteratorPrototypeEvery();
      shimIteratorPrototypeFilter();
      shimIteratorPrototypeFind();
      shimIteratorPrototypeFlatMap();
      shimIteratorPrototypeForEach();
      shimIteratorPrototypeMap();
      shimIteratorPrototypeReduce();
      shimIteratorPrototypeSome();
      shimIteratorPrototypeTake();
      shimIteratorPrototypeToArray();
      shimMapGroupBy();
      shimPromiseWithResolvers();
      shimSetPrototypeDifference();
      shimSetPrototypeIntersection();
      shimSetPrototypeIsDisjointFrom();
      shimSetPrototypeIsSubsetOf();
      shimSetPrototypeIsSupersetOf();
      shimSetPrototypeSymmetricDifference();
      shimSetPrototypeUnion();
      shimWeakMap();
      shimWeakRef();
      shimWeakSet();
    }

    // -- Pruning -------------------------------------------------------------------------------

    {
      /**
       * Whitelist of properties to keep in the global context.
       *
       * @type {Array<Object<string, string | symbol>>}
       */
      const keep = _Object.create(null);
      keep['this'] = [
        'globalThis',
        'Infinity',
        'NaN',
        'undefined',
        // "eval", // ---> Patch to use indirect eval every time (cf.: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#direct_and_indirect_eval)
        'isFinite',
        'isNaN',
        'parseFloat',
        'parseInt',
        'decodeURI',
        'decodeURIComponent',
        'encodeURI',
        'encodeURIComponent',
        // "escape", // Deprecated
        // "unescape", // Deprecated
        'Object',
        'Function',
        'Boolean',
        'Symbol',
        'Error',
        'AggregateError',
        'EvalError',
        'RangeError',
        'ReferenceError',
        'SyntaxError',
        'TypeError',
        'URIError',
        'Number',
        'BigInt',
        'Math',
        'Date', // ---> Patch to disable current time
        'String',
        'RegExp',
        'Array',
        'Int8Array',
        'Uint8Array',
        'Uint8ClampedArray',
        'Int16Array',
        'Uint16Array',
        'Int32Array',
        'Uint32Array',
        'BigInt64Array',
        'BigUint64Array',
        'Float32Array',
        'Float64Array',
        'Map',
        'Set',
        'WeakMap',
        'WeakSet',
        'ArrayBuffer',
        'DataView',
        'Atomics',
        'JSON',
        'WeakRef',
        'FinalizationRegistry',
        'Iterator',
        'Promise',
        'GeneratorFunction',
        'AsyncGeneratorFunction',
        'AsyncFunction',
        'Proxy',
        'Reflect',
        // "SharedArrayBuffer", // Inter-agent communication not supported
        // "Intl", // Internationalization not supported
        // "TEMPORARY", // ???
        // "PERSISTENT", // ???
        'Events',
      ];
      keep['Object.prototype'] = [
        'constructor',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
        // "toLocaleString", // ---> Object.prototype.toString
        'toString',
        'valueOf',
      ];
      keep['Function.prototype'] = keep['Object.prototype'].concat([
        // "arguments", // Deprecated
        // "caller", // Deprecated
        'apply',
        'bind',
        'call',
        Symbol.hasInstance,
      ]);
      keep['Function.instance'] = keep['Function.prototype'].concat(['length', 'name']);
      keep['Object'] = keep['Function.instance'].concat([
        'prototype',
        'assign',
        'create',
        'defineProperties',
        'defineProperty',
        'keys',
        'values',
        'entries',
        'fromEntries',
        'hasOwn',
        'getOwnPropertyDescriptor',
        'getOwnPropertyDescriptors',
        'getOwnPropertyNames',
        'getOwnPropertySymbols',
        'is',
        'setPrototypeOf',
        'getPrototypeOf',
        'groupBy',
        'preventExtensions',
        'freeze',
        'seal',
        'isExtensible',
        'isFrozen',
        'isSealed',
        // "__proto__", // Deprecated
        // "__defineGetter__", // Deprecated
        // "__defineSetter__", // Deprecated
        // "__lookupGetter__", // Deprecated
        // "__lookupSetter__", // Deprecated
      ]);
      keep['Boolean.prototype'] = keep['Object.prototype'];
      keep['Symbol'] = keep['Function.instance'].concat([
        'prototype',
        'asyncIterator',
        'hasInstance',
        'isConcatSpreadable',
        'iterator',
        'match',
        'matchAll',
        'replace',
        'search',
        'species',
        'split',
        'toPrimitive',
        'toStringTag',
        'unscopables',
        'for',
        'keyFor',
      ]);
      keep['Symbol.prototype'] = keep['Object.prototype'].concat([
        'description',
        Symbol.toPrimitive,
        Symbol.toStringTag,
      ]);
      keep['Error'] = keep['Function.instance'].concat(['prototype']);
      keep['Error.prototype'] = keep['Object.prototype'].concat(['name']);
      keep['AggregateError'] = keep['Error'];
      keep['AggregateError.prototype'] = keep['Error.prototype'];
      keep['EvalError'] = keep['Error'];
      keep['EvalError.prototype'] = keep['Error.prototype'];
      keep['RangeError'] = keep['Error'];
      keep['RangeError.prototype'] = keep['Error.prototype'];
      keep['ReferenceError'] = keep['Error'];
      keep['ReferenceError.prototype'] = keep['Error.prototype'];
      keep['SyntaxError'] = keep['Error'];
      keep['SyntaxError.prototype'] = keep['Error.prototype'];
      keep['TypeError'] = keep['Error'];
      keep['TypeError.prototype'] = keep['Error.prototype'];
      keep['URIError'] = keep['Error'];
      keep['URIError.prototype'] = keep['Error.prototype'];
      keep['Number'] = keep['Function.instance'].concat([
        'prototype',
        'EPSILON',
        'MAX_SAFE_INTEGER',
        'MAX_VALUE',
        'MIN_SAFE_INTEGER',
        'MIN_VALUE',
        'NaN',
        'NEGATIVE_INFINITY',
        'POSITIVE_INFINITY',
        'isFinite',
        'isInteger',
        'isNaN',
        'isSafeInteger',
        'parseFloat',
        'parseInt',
      ]);
      keep['Number.prototype'] = keep['Object.prototype'].concat([
        'toExponential',
        'toFixed',
        'toPrecision',
        // "toLocaleString", // ---> Number.prototype.toString
      ]);
      keep['BigInt'] = keep['Function.instance'].concat(['prototype', 'asIntN', 'asUintN']);
      keep['BigInt.prototype'] = keep['Object.prototype'].concat([
        Symbol.toStringTag,
        // "toLocaleString", // ---> BigInt.prototype.toString
      ]);
      keep['Math'] = [
        'E',
        'LN10',
        'LN2',
        'LOG10E',
        'LOG2E',
        'PI',
        'SQRT1_2',
        'SQRT2',
        Symbol.toStringTag,
        'abs',
        'ceil',
        'floor',
        'fround',
        'round',
        'sign',
        'trunc',
        'acos',
        'asin',
        'atan',
        'atan2',
        'cos',
        'sin',
        'tan',
        'acosh',
        'asinh',
        'atanh',
        'cosh',
        'sinh',
        'tanh',
        'cbrt',
        'sqrt',
        'clz32',
        'exp',
        'expm1',
        'log',
        'log10',
        'log1p',
        'log2',
        'hypot',
        'imul',
        'max',
        'min',
        'pow',
        // "random", // ---> () => NaN
      ];
      keep['Date'] = keep['Function.instance'].concat([
        'prototype',
        // "now", // ---> () => NaN
        'parse',
        'UTC',
      ]);
      keep['Date.prototype'] = keep['Object.prototype'].concat([
        // "getDate", // ---> Date.prototype.getUTCDate
        // "getDay", // ---> Date.prototype.getUTCDay
        // "getFullYear", // ---> Date.prototype.getUTCFullYear
        // "getHours", // ---> Date.prototype.getUTCHours
        // "getMilliseconds", // ---> Date.prototype.getUTCMilliseconds
        // "getMinutes", // ---> Date.prototype.getUTCMinutes
        // "getMonth", // ---> Date.prototype.getUTCMonth
        // "getSeconds", // ---> Date.prototype.getUTCSeconds
        'getTime',
        // "getYear", // Deprecated
        // "getTimezoneOffset", // ---> () => 0
        'getUTCDate',
        'getUTCDay',
        'getUTCFullYear',
        'getUTCHours',
        'getUTCMilliseconds',
        'getUTCMinutes',
        'getUTCMonth',
        'getUTCSeconds',
        // "setDate", // ---> Date.prototype.setUTCDate
        // "setFullYear", // ---> Date.prototype.setUTCFullYear
        // "setHours", // ---> Date.prototype.setUTCHours
        // "setMilliseconds", // ---> Date.prototype.setUTCMilliseconds
        // "setMinutes", // ---> Date.prototype.setUTCMinutes
        // "setMonth", // ---> Date.prototype.setUTCMonth
        // "setSeconds", // ---> Date.prototype.setUTCSeconds
        'setTime',
        // "setYear", // Deprecated
        'setUTCDate',
        'setUTCFullYear',
        'setUTCHours',
        'setUTCMilliseconds',
        'setUTCMinutes',
        'setUTCMonth',
        'setUTCSeconds',
        'toISOString',
        'toUTCString',
        // "toGMTString", // Deprecated
        'toJSON',
        // "toDateString", // ---> function () { return this.toISOString().split('T')[0]; }
        // "toLocaleDateString", // ---> Date.prototype.toDateString
        // "toTimeString", // ---> function () { return this.toISOString().split('T')[1]; }
        // "toLocaleTimeString", // ---> Date.prototype.toTimeString
        // "toString", // ---> Date.prototype.toISOString
        // "toLocaleString", // ---> Date.prototype.toString
        Symbol.toPrimitive,
      ]);
      keep['String'] = keep['Function.instance'].concat(['prototype', 'fromCharCode', 'fromCodePoint', 'raw']);
      keep['String.prototype'] = keep['Object.prototype'].concat([
        'at',
        'charAt',
        'charCodeAt',
        'codePointAt',
        'length',
        'indexOf',
        'lastIndexOf',
        'search',
        'concat',
        'slice',
        'split',
        // "substr", // Deprecated
        'substring',
        'endsWith',
        'includes',
        'match',
        'matchAll',
        'startsWith',
        'isWellFormed',
        'normalize',
        'toWellFormed',
        'padEnd',
        'padStart',
        'trim',
        'trimEnd',
        'trimStart',
        'repeat',
        'replace',
        'replaceAll',
        // "localeCompare", // ---> function (compareString) { return this < compareString ? -1 : compareString < this ? 1 : 0; }
        // "toLocaleLowerCase", // ---> String.prototype.toUpperCase
        // "toLocaleUpperCase", // ---> String.prototype.toLowerCase
        'toLowerCase',
        'toUpperCase',
        Symbol.iterator,
        // "anchor", // Deprecated
        // "big", // Deprecated
        // "blink", // Deprecated
        // "bold", // Deprecated
        // "fixed", // Deprecated
        // "fontcolor", // Deprecated
        // "fontsize", // Deprecated
        // "italics", // Deprecated
        // "link", // Deprecated
        // "small", // Deprecated
        // "strike", // Deprecated
        // "sub", // Deprecated
        // "sup", // Deprecated
      ]);
      keep['RegExp'] = keep['Function.instance'].concat([
        'prototype',
        // "$1", // Deprecated // ???
        // "$2", // Deprecated // ???
        // "$3", // Deprecated // ???
        // "$4", // Deprecated // ???
        // "$5", // Deprecated // ???
        // "$6", // Deprecated // ???
        // "$7", // Deprecated // ???
        // "$8", // Deprecated // ???
        // "$9", // Deprecated // ???
        // "input", // Deprecated // ???
        // "$_", // Deprecated // ???
        // "lastMatch", // Deprecated // ???
        // "$&", // Deprecated // ???
        // "lastParen", // Deprecated // ???
        // "$+", // Deprecated // ???
        // "leftContext", // Deprecated // ???
        // "$`", // Deprecated // ???
        // "rightContext", // Deprecated // ???
        // "$'", // Deprecated // ???
        Symbol.species,
      ]);
      keep['RegExp.prototype'] = keep['Object.prototype'].concat([
        'dotAll',
        'flags',
        'global',
        'ignoreCase',
        'lastIndex',
        'multiline',
        'sticky',
        'unicode',
        'unicodeSets',
        'hasIndices',
        'source',
        // "compile", // Deprecated
        'exec',
        'test',
        Symbol.match,
        Symbol.matchAll,
        Symbol.replace,
        Symbol.split,
        Symbol.search,
      ]);
      keep['Array'] = keep['Function.instance'].concat([
        'prototype',
        Symbol.species,
        'from',
        'fromAsync',
        'isArray',
        'of',
      ]);
      keep['Array.prototype'] = keep['Object.prototype'].concat([
        Symbol.unscopables,
        'at',
        'length',
        'concat',
        'copyWithin',
        'fill',
        'reverse',
        'slice',
        'sort',
        'splice',
        'entries',
        'keys',
        'values',
        'every',
        'some',
        'find',
        'findIndex',
        'findLast',
        'findLastIndex',
        'indexOf',
        'lastIndexOf',
        'filter',
        'flat',
        'flatMap',
        'map',
        'reduce',
        'reduceRight',
        'forEach',
        'includes',
        'join',
        'pop',
        'push',
        'shift',
        'unshift',
        // "toLocaleString", // ---> Array.prototype.toString
        'toReversed',
        'toSorted',
        'toSpliced',
        'with',
        Symbol.iterator,
      ]);
      keep['TypedArray'] = keep['Function.instance'].concat([
        'prototype',
        Symbol.species,
        'BYTES_PER_ELEMENT',
        'from',
        'of',
      ]);
      keep['TypedArray.prototype'] = keep['Object.prototype'].concat([
        'buffer',
        'byteLength',
        'byteOffset',
        'BYTES_PER_ELEMENT',
        'at',
        'length',
        'copyWithin',
        'fill',
        'reverse',
        'set',
        'slice',
        'sort',
        'subarray',
        'entries',
        'keys',
        'values',
        'every',
        'some',
        'find',
        'findIndex',
        'findLast',
        'findLastIndex',
        'indexOf',
        'lastIndexOf',
        'filter',
        'map',
        'reduce',
        'reduceRight',
        'forEach',
        'includes',
        'join',
        Symbol.toStringTag,
        // "toLocaleString", // ---> TypedArray.prototype.toString
        'toReversed',
        'toSorted',
        'with',
        Symbol.iterator,
      ]);
      keep['Map'] = keep['Function.instance'].concat(['prototype', Symbol.species, 'groupBy']);
      keep['Map.prototype'] = keep['Object.prototype'].concat([
        'size',
        Symbol.toStringTag,
        'delete',
        'get',
        'has',
        'set',
        'entries',
        'keys',
        'values',
        'clear',
        'forEach',
        Symbol.iterator,
      ]);
      keep['Set'] = keep['Function.instance'].concat(['prototype', Symbol.species]);
      keep['Set.prototype'] = keep['Object.prototype'].concat([
        'size',
        Symbol.toStringTag,
        'add',
        'clear',
        'delete',
        'difference',
        'intersection',
        'symmetricDifference',
        'union',
        'has',
        'isDisjointFrom',
        'isSubsetOf',
        'isSupersetOf',
        'entries',
        'keys',
        'values',
        'forEach',
        Symbol.iterator,
      ]);
      keep['WeakMap'] = keep['Function.instance'].concat(['prototype', Symbol.toStringTag]);
      keep['WeakMap.prototype'] = keep['Object.prototype'].concat(['delete', 'get', 'has', 'set']);
      keep['WeakSet'] = keep['Function.instance'].concat(['prototype', Symbol.toStringTag]);
      keep['WeakSet.prototype'] = keep['Object.prototype'].concat(['add', 'delete', 'has']);
      keep['ArrayBuffer'] = keep['Function.instance'].concat(['prototype', Symbol.species, 'isView']);
      keep['ArrayBuffer.prototype'] = keep['Object.prototype'].concat([
        'byteLength',
        'maxByteLength',
        'detached',
        'resizable',
        Symbol.toStringTag,
        'resize',
        'slice',
        'transfer',
        'transferToFixedLength',
      ]);
      keep['DataView'] = keep['Function.instance'].concat(['prototype']);
      keep['DataView.prototype'] = keep['Object.prototype'].concat([
        'buffer',
        'byteLength',
        'byteOffset',
        Symbol.toStringTag,
        'getBigInt64',
        'getBigUint64',
        'getFloat32',
        'getFloat64',
        'getInt8',
        'getInt16',
        'getInt32',
        'getUint8',
        'getUint16',
        'getUint32',
        'setBigInt64',
        'setBigUint64',
        'setFloat32',
        'setFloat64',
        'setInt8',
        'setInt16',
        'setInt32',
        'setUint8',
        'setUint16',
        'setUint32',
      ]);
      keep['Atomics'] = [
        Symbol.toStringTag,
        'add',
        'and',
        'compareExchange',
        'exchange',
        'load',
        'notify',
        'or',
        'store',
        'sub',
        'xor',
        'isLockFree',
        'wait',
        'waitAsync',
      ];
      keep['JSON'] = [Symbol.toStringTag, 'parse', 'stringify'];
      keep['WeakRef'] = keep['Function.instance'].concat(['prototype']);
      keep['WeakRef.prototype'] = keep['Object.prototype'].concat(['deref', Symbol.toStringTag]);
      keep['FinalizationRegistry'] = keep['Function.instance'].concat(['prototype']);
      keep['FinalizationRegistry.prototype'] = keep['Object.prototype'].concat([
        Symbol.toStringTag,
        'register',
        'unregister',
      ]);
      keep['Promise'] = keep['Function.instance'].concat([
        'prototype',
        Symbol.species,
        'all',
        'allSettled',
        'any',
        'race',
        'reject',
        'resolve',
        'withResolvers',
      ]);
      keep['Promise.prototype'] = keep['Object.prototype'].concat([Symbol.toStringTag, 'catch', 'finally', 'then']);
      keep['GeneratorFunction'] = keep['Function.instance'].concat(['prototype']);
      keep['GeneratorFunction.prototype'] = keep['Function.prototype'].concat(['prototype', Symbol.toStringTag]);
      keep['AsyncGeneratorFunction'] = keep['Function.instance'].concat(['prototype']);
      keep['AsyncGeneratorFunction.prototype'] = keep['Function.prototype'].concat(['prototype', Symbol.toStringTag]);
      keep['AsyncFunction'] = keep['Function.instance'].concat(['prototype']);
      keep['AsyncFunction.prototype'] = keep['Function.prototype'].concat(['prototype', Symbol.toStringTag]);
      keep['Proxy'] = keep['Function.instance'].concat(['revocable']);
      keep['Reflect'] = [
        Symbol.toStringTag,
        'apply',
        'construct',
        'defineProperty',
        'deleteProperty',
        'get',
        'getOwnPropertyDescriptor',
        'getPrototypeOf',
        'has',
        'isExtensible',
        'ownKeys',
        'preventExtensions',
        'set',
        'setPrototypeOf',
      ];

      const failed = [];

      /**
       * Prune the given object and its ancestry so that only the mentioned properties are kept.
       *
       * NOTE: errors on deletion are ignored.
       *
       * @param {object} start - Object to start the pruning from.
       * @param {string} name - Name to use for failure reporting.
       * @param {Array<string | symbol>} toKeep - Properties to keep.
       * @returns {void}
       */
      const prune = (start, name, toKeep) => {
        let current = start;
        do {
          _Object
            .getOwnPropertyNames(current)
            .concat(_Object.getOwnPropertySymbols(current))
            .forEach((key) => {
              if (!keep[toKeep].includes(key)) {
                try {
                  delete current[key];
                } catch {
                  if ('symbol' === typeof key) {
                    const sKey = key.toString();
                    failed.push(`${name}.@@${sKey.substring(14, sKey.length - 1)}`);
                  } else {
                    failed.push(`${name}.${key}`);
                  }
                }
              }
            });
          current = _Object.getPrototypeOf(current);
        } while (null !== current);
      };

      prune(this, 'this', 'this');
      prune(this.Object, 'this.Object', 'Object');
      prune(this.Object.prototype, 'this.Object.prototype', 'Object.prototype');
      prune(this.Function.prototype, 'this.Function.prototype', 'Function.prototype');
      prune(this.Boolean.prototype, 'this.Boolean.prototype', 'Boolean.prototype');
      prune(this.Symbol, 'this.Symbol', 'Symbol');
      prune(this.Symbol.prototype, 'this.Symbol.prototype', 'Symbol.prototype');
      prune(this.Error, 'this.Error', 'Error');
      prune(this.Error.prototype, 'this.Error.prototype', 'Error.prototype');
      prune(this.AggregateError, 'this.AggregateError', 'AggregateError');
      prune(this.AggregateError.prototype, 'this.AggregateError.prototype', 'AggregateError.prototype');
      prune(this.EvalError, 'this.EvalError', 'EvalError');
      prune(this.EvalError.prototype, 'this.EvalError.prototype', 'EvalError.prototype');
      prune(this.RangeError, 'this.RangeError', 'RangeError');
      prune(this.RangeError.prototype, 'this.RangeError.prototype', 'RangeError.prototype');
      prune(this.ReferenceError, 'this.ReferenceError', 'ReferenceError');
      prune(this.ReferenceError.prototype, 'this.ReferenceError.prototype', 'ReferenceError.prototype');
      prune(this.SyntaxError, 'this.SyntaxError', 'SyntaxError');
      prune(this.SyntaxError.prototype, 'this.SyntaxError.prototype', 'SyntaxError.prototype');
      prune(this.TypeError, 'this.TypeError', 'TypeError');
      prune(this.TypeError.prototype, 'this.TypeError.prototype', 'TypeError.prototype');
      prune(this.URIError, 'this.URIError', 'URIError');
      prune(this.URIError.prototype, 'this.URIError.prototype', 'URIError.prototype');
      prune(this.Number, 'this.Number', 'Number');
      prune(this.Number.prototype, 'this.Number.prototype', 'Number.prototype');
      prune(this.BigInt, 'this.BigInt', 'BigInt');
      prune(this.BigInt.prototype, 'this.BigInt.prototype', 'BigInt.prototype');
      prune(this.Math, 'this.Math', 'Math');
      prune(this.Date, 'this.Date', 'Date');
      prune(this.Date.prototype, 'this.Date.prototype', 'Date.prototype');
      prune(this.String, 'this.String', 'String');
      prune(this.String.prototype, 'this.String.prototype', 'String.prototype');
      prune(this.RegExp, 'this.RegExp', 'RegExp');
      prune(this.RegExp.prototype, 'this.RegExp.prototype', 'RegExp.prototype');
      prune(this.Array, 'this.Array', 'Array');
      prune(this.Array.prototype, 'this.Array.prototype', 'Array.prototype');
      prune(this.Int8Array, 'this.Int8Array', 'TypedArray');
      prune(this.Int8Array.prototype, 'this.Int8Array.prototype', 'TypedArray.prototype');
      prune(this.Uint8Array, 'this.Uint8Array', 'TypedArray');
      prune(this.Uint8Array.prototype, 'this.Uint8Array.prototype', 'TypedArray.prototype');
      prune(this.Uint8ClampedArray, 'this.Uint8ClampedArray', 'TypedArray');
      prune(this.Uint8ClampedArray.prototype, 'this.Uint8ClampedArray.prototype', 'TypedArray.prototype');
      prune(this.Int16Array, 'this.Int16Array', 'TypedArray');
      prune(this.Int16Array.prototype, 'this.Int16Array.prototype', 'TypedArray.prototype');
      prune(this.Uint16Array, 'this.Uint16Array', 'TypedArray');
      prune(this.Uint16Array.prototype, 'this.Uint16Array.prototype', 'TypedArray.prototype');
      prune(this.Int32Array, 'this.Int32Array', 'TypedArray');
      prune(this.Int32Array.prototype, 'this.Int32Array.prototype', 'TypedArray.prototype');
      prune(this.Uint32Array, 'this.Uint32Array', 'TypedArray');
      prune(this.Uint32Array.prototype, 'this.Uint32Array.prototype', 'TypedArray.prototype');
      prune(this.BigInt64Array, 'this.BigInt64Array', 'TypedArray');
      prune(this.BigInt64Array.prototype, 'this.BigInt64Array.prototype', 'TypedArray.prototype');
      prune(this.BigUint64Array, 'this.BigUint64Array', 'TypedArray');
      prune(this.BigUint64Array.prototype, 'this.BigUint64Array.prototype', 'TypedArray.prototype');
      prune(this.Float32Array, 'this.Float32Array', 'TypedArray');
      prune(this.Float32Array.prototype, 'this.Float32Array.prototype', 'TypedArray.prototype');
      prune(this.Float64Array, 'this.Float64Array', 'TypedArray');
      prune(this.Float64Array.prototype, 'this.Float64Array.prototype', 'TypedArray.prototype');
      prune(this.Map, 'this.Map', 'Map');
      prune(this.Map.prototype, 'this.Map.prototype', 'Map.prototype');
      prune(this.Set, 'this.Set', 'Set');
      prune(this.Set.prototype, 'this.Set.prototype', 'Set.prototype');
      prune(this.WeakMap, 'this.WeakMap', 'WeakMap');
      prune(this.WeakMap.prototype, 'this.WeakMap.prototype', 'WeakMap.prototype');
      prune(this.WeakSet, 'this.WeakSet', 'WeakSet');
      prune(this.WeakSet.prototype, 'this.WeakSet.prototype', 'WeakSet.prototype');
      prune(this.ArrayBuffer, 'this.ArrayBuffer', 'ArrayBuffer');
      prune(this.ArrayBuffer.prototype, 'this.ArrayBuffer.prototype', 'ArrayBuffer.prototype');
      prune(this.DataView, 'this.DataView', 'DataView');
      prune(this.DataView.prototype, 'this.DataView.prototype', 'DataView.prototype');
      prune(this.Atomics, 'this.Atomics', 'Atomics');
      prune(this.JSON, 'this.JSON', 'JSON');
      prune(this.WeakRef, 'this.WeakRef', 'WeakRef');
      prune(this.WeakRef.prototype, 'this.WeakRef.prototype', 'WeakRef.prototype');
      prune(this.FinalizationRegistry, 'this.FinalizationRegistry', 'FinalizationRegistry');
      prune(
        this.FinalizationRegistry.prototype,
        'this.FinalizationRegistry.prototype',
        'FinalizationRegistry.prototype',
      );
      prune(this.Promise, 'this.Promise', 'Promise');
      prune(this.Promise.prototype, 'this.Promise.prototype', 'Promise.prototype');
      prune(this.GeneratorFunction.constructor, 'this.GeneratorFunction.constructor', 'GeneratorFunction');
      prune(
        this.GeneratorFunction.constructor.prototype,
        'this.GeneratorFunction.constructor.prototype',
        'GeneratorFunction.prototype',
      );
      prune(
        this.AsyncGeneratorFunction.constructor,
        'this.AsyncGeneratorFunction.constructor',
        'AsyncGeneratorFunction',
      );
      prune(
        this.AsyncGeneratorFunction.constructor.prototype,
        'this.AsyncGeneratorFunction.constructor.prototype',
        'AsyncGeneratorFunction.prototype',
      );
      prune(this.AsyncFunction.constructor, 'this.AsyncFunction.constructor', 'AsyncFunction');
      prune(
        this.AsyncFunction.constructor.prototype,
        'this.AsyncFunction.constructor.prototype',
        'AsyncFunction.prototype',
      );
      prune(this.Proxy, 'this.Proxy', 'Proxy');
      prune(this.Reflect, 'this.Reflect', 'Reflect');

      if (0 < failed.length) {
        postEmitMessage(`worker:warning`, `failed to prune [${failed.join(', ')}]`);
      }
    }

    // -- Patching ------------------------------------------------------------------------------

    {
      patchEval();
      patchObject();
      patchNumber();
      patchBigInt();
      patchMath();
      patchDate();
      patchRegExp();
      patchString();
      patchArray();
      patchTypedArray();
    }

    // -- Deep Freezing -------------------------------------------------------------------------

    deepFreezeThis();

    // ------------------------------------------------------------------------------------------
    // -- Create Default Namespace --------------------------------------------------------------
    // ------------------------------------------------------------------------------------------

    addNamespace('default');

    // ------------------------------------------------------------------------------------------
    // -- Worker Event Listeners ----------------------------------------------------------------
    // ------------------------------------------------------------------------------------------

    _addEventListener('message', ({ data }) => {
      const parsedData = _JSON.parse(data);
      const { name } = parsedData;
      switch (name) {
        case 'resolve':
          {
            const { namespace, tunnel, payload } = parsedData;
            resolveTunnel(namespace, tunnel, payload);
          }
          break;
        case 'reject':
          {
            const { namespace, tunnel, error } = parsedData;
            rejectTunnel(namespace, tunnel, new _Error(error));
          }
          break;
        case 'emit':
          {
            const { namespace, event, args } = parsedData;
            castHostInNamespace(namespace, event, args);
          }
          break;
        case 'install':
          {
            const { namespace, tunnel, dependency } = parsedData;
            try {
              installDependency(namespace, dependency);
              postResolveMessage(tunnel);
            } catch (e) {
              postRejectMessage(tunnel, e.message);
            }
          }
          break;
        case 'execute':
          {
            const { namespace, tunnel, dependency, args } = parsedData;
            try {
              postResolveMessage(tunnel, executeDependency(namespace, dependency, new _Map(_Object.entries(args))));
            } catch (e) {
              postRejectMessage(tunnel, e.message);
            }
          }
          break;
        case 'predefine':
          {
            const { namespace, tunnel, idx, function: fName } = parsedData;
            try {
              addPredefined(namespace, idx, fName);
              postResolveMessage(tunnel);
            } catch (e) {
              postRejectMessage(tunnel, e.message);
            }
          }
          break;
        case 'create':
          {
            const { namespace, parent, tunnel } = parsedData;
            try {
              postResolveMessage(tunnel, addNamespace(namespace, parent ?? null));
            } catch (e) {
              postRejectMessage(tunnel, e.message);
            }
          }
          break;
        case 'delete':
          {
            const { namespace, tunnel } = parsedData;
            try {
              postResolveMessage(tunnel, removeNamespace(namespace));
            } catch (e) {
              postRejectMessage(tunnel, e.message);
            }
          }
          break;
        case 'link':
          {
            const { namespace, tunnel, target } = parsedData;
            try {
              getNamespace(target);
              if (namespace !== target) {
                getNamespace(namespace).linked.add(target);
              }
              postResolveMessage(tunnel);
            } catch (e) {
              postRejectMessage(tunnel, e.message);
            }
          }
          break;
        case 'unlink':
          {
            const { namespace, tunnel, target } = parsedData;
            try {
              getNamespace(target);
              postResolveMessage(tunnel, getNamespace(namespace).linked.delete(target));
            } catch (e) {
              postRejectMessage(tunnel, e.message);
            }
          }
          break;
        case 'mute':
          {
            const { namespace, tunnel } = parsedData;
            try {
              const namespaceObject = getNamespace(namespace);
              const previous = namespaceObject.muted;
              namespaceObject.muted = true;
              postResolveMessage(tunnel, previous);
            } catch (e) {
              postRejectMessage(tunnel, e.message);
            }
          }
          break;
        case 'unmute':
          {
            const { namespace, tunnel } = parsedData;
            try {
              const namespaceObject = getNamespace(namespace);
              const previous = namespaceObject.muted;
              namespaceObject.muted = false;
              postResolveMessage(tunnel, previous);
            } catch (e) {
              postRejectMessage(tunnel, e.message);
            }
          }
          break;
        case 'listNamespaces':
          {
            const { tunnel } = parsedData;
            try {
              postResolveMessage(tunnel, _Array.from(namespaces.keys()).sort());
            } catch (e) {
              postRejectMessage(tunnel, e.message);
            }
          }
          break;
        case 'listInstalled':
          {
            const { namespace, tunnel } = parsedData;
            try {
              postResolveMessage(tunnel, listInstalled(namespace));
            } catch (e) {
              postRejectMessage(tunnel, e.message);
            }
          }
          break;
        case 'listLinkedTo':
          {
            const { namespace, tunnel } = parsedData;
            try {
              postResolveMessage(tunnel, listLinkedTo(namespace));
            } catch (e) {
              postRejectMessage(tunnel, e.message);
            }
          }
          break;
        case 'listLinkedFrom':
          {
            const { namespace, tunnel } = parsedData;
            try {
              postResolveMessage(tunnel, listLinkedFrom(namespace));
            } catch (e) {
              postRejectMessage(tunnel, e.message);
            }
          }
          break;
        case 'isMuted':
          {
            const { namespace, tunnel } = parsedData;
            try {
              postResolveMessage(tunnel, isMuted(namespace));
            } catch (e) {
              postRejectMessage(tunnel, e.message);
            }
          }
          break;
        case 'getAncestors':
          {
            const { namespace, tunnel } = parsedData;
            try {
              postResolveMessage(tunnel, getAncestors(namespace));
            } catch (e) {
              postRejectMessage(tunnel, e.message);
            }
          }
          break;
        case 'getChildren':
          {
            const { namespace, tunnel } = parsedData;
            try {
              postResolveMessage(tunnel, getChildren(namespace));
            } catch (e) {
              postRejectMessage(tunnel, e.message);
            }
          }
          break;
        case 'pendingTunnels':
          {
            const { namespace, tunnel } = parsedData;
            try {
              postResolveMessage(tunnel, pendingTunnels(namespace));
            } catch (e) {
              postRejectMessage(tunnel, e.message);
            }
          }
          break;
        default: {
          const { tunnel } = parsedData;
          if (undefined !== tunnel) {
            postRejectMessage(tunnel, `unknown event name ${name}`);
          } else {
            throw new _Error(`unknown event name ${name}`);
          }
        }
      }
    });

    // ------------------------------------------------------------------------------------------
    // -- Signal Boot-Up Complete ---------------------------------------------------------------
    // ------------------------------------------------------------------------------------------

    postResolveMessage(BOOT_TUNNEL, _Date_now() - STARTUP);
  } catch (e) {
    postRejectMessage(BOOT_TUNNEL, e instanceof _Error ? e.message : 'unknown error');
  }
};

export { workerRunner };
