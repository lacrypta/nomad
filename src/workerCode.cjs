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

// ------------------------------------------------------------------------------------------------

// @ts-check

'use strict';

/**
 * @typedef MessagePing
 * @type {object}
 * @property {"ping"} name - The message name.
 */

/**
 * @typedef MessageResolve
 * @type {object}
 * @property {"resolve"} name - The message name.
 * @property {unknown} payload - The resolution payload.
 * @property {number} tunnel - The tunnel to answer on.
 */

/**
 * @typedef MessageReject
 * @type {object}
 * @property {string} error - The rejection error message.
 * @property {"reject"} name - The message name.
 * @property {number} tunnel - The tunnel to answer on.
 */

/**
 * @typedef MessageEmit
 * @type {object}
 * @property {unknown[]} args - The event arguments to pass.
 * @property {string} enclosure - The enclosure to operate on.
 * @property {string} event - The event name to emit.
 * @property {"emit"} name - The message name.
 */

/**
 * @typedef MessageInstall
 * @type {object}
 * @property {DependencyObject} dependency - The dependency to install.
 * @property {string} enclosure - The enclosure to operate on.
 * @property {"install"} name - The message name.
 * @property {number} tunnel - The tunnel to answer on.
 */

/**
 * @typedef MessageExecute
 * @type {object}
 * @property {unknown[]} args - The arguments to pass to the dependency.
 * @property {DependencyObject} dependency - The dependency to execute.
 * @property {string} enclosure - The enclosure to operate on.
 * @property {"execute"} name - The message name.
 * @property {number} tunnel - The tunnel to answer on.
 */

/**
 * @typedef MessagePredefine
 * @type {object}
 * @property {string} enclosure - The enclosure to operate on.
 * @property {string} function - The function name to predefine.
 * @property {number} idx - The predefined function index.
 * @property {"predefine"} name - The message name.
 * @property {number} tunnel - The tunnel to answer on.
 */

/**
 * @typedef MessageCreate
 * @type {object}
 * @property {string} enclosure - The enclosure to operate on.
 * @property {"create"} name - The message name.
 * @property {number} tunnel - The tunnel to answer on.
 */

/**
 * @typedef MessageDelete
 * @type {object}
 * @property {string} enclosure - The enclosure to operate on.
 * @property {"delete"} name - The message name.
 * @property {number} tunnel - The tunnel to answer on.
 */

/**
 * @typedef MessageMerge
 * @type {object}
 * @property {string} enclosure - The enclosure to operate on.
 * @property {"merge"} name - The message name.
 * @property {number} tunnel - The tunnel to answer on.
 */

/**
 * @typedef MessageLink
 * @type {object}
 * @property {string} enclosure - The enclosure to operate on.
 * @property {"link"} name - The message name.
 * @property {string} target - The target enclosure.
 * @property {number} tunnel - The tunnel to answer on.
 */

/**
 * @typedef MessageUnlink
 * @type {object}
 * @property {string} enclosure - The enclosure to operate on.
 * @property {"unlink"} name - The message name.
 * @property {string} target - The target enclosure.
 * @property {number} tunnel - The tunnel to answer on.
 */

/**
 * @typedef MessageMute
 * @type {object}
 * @property {string} enclosure - The enclosure to operate on.
 * @property {"mute"} name - The message name.
 * @property {number} tunnel - The tunnel to answer on.
 */

/**
 * @typedef MessageUnmute
 * @type {object}
 * @property {string} enclosure - The enclosure to operate on.
 * @property {"unmute"} name - The message name.
 * @property {number} tunnel - The tunnel to answer on.
 */

/**
 * @typedef MessageListRootEnclosures
 * @type {object}
 * @property {"listRootEnclosures"} name - The message name.
 * @property {number} tunnel - The tunnel to answer on.
 */

/**
 * @typedef MessageListInstalled
 * @type {object}
 * @property {string} enclosure - The enclosure to operate on.
 * @property {"listInstalled"} name - The message name.
 * @property {number} tunnel - The tunnel to answer on.
 */

/**
 * @typedef MessageListLinksTo
 * @type {object}
 * @property {string} enclosure - The enclosure to operate on.
 * @property {"listLinksTo"} name - The message name.
 * @property {number} tunnel - The tunnel to answer on.
 */

/**
 * @typedef MessageListLinkedFrom
 * @type {object}
 * @property {string} enclosure - The enclosure to operate on.
 * @property {"listLinkedFrom"} name - The message name.
 * @property {number} tunnel - The tunnel to answer on.
 */

/**
 * @typedef MessageIsMuted
 * @type {object}
 * @property {string} enclosure - The enclosure to operate on.
 * @property {"isMuted"} name - The message name.
 * @property {number} tunnel - The tunnel to answer on.
 */

/**
 * @typedef MessageGetSubEnclosures
 * @type {object}
 * @property {number} depth - The maximum depth to retrieve results for.
 * @property {string} enclosure - The enclosure to operate on.
 * @property {"getSubEnclosures"} name - The message name.
 * @property {number} tunnel - The tunnel to answer on.
 */

/**
 * @typedef MessageData
 * @type {MessagePing | MessageResolve | MessageReject | MessageEmit | MessageInstall | MessageExecute | MessagePredefine | MessageCreate | MessageDelete | MessageMerge | MessageLink | MessageUnlink | MessageMute | MessageUnmute | MessageListRootEnclosures | MessageListInstalled | MessageListLinksTo | MessageListLinkedFrom | MessageIsMuted | MessageGetSubEnclosures}
 */

/**
 * Callback used for {@link Listener}s, accepting the data string sent from the host side.
 *
 * @callback ListenerCallback
 * @param {MessageData} data - Data the host sent.
 * @returns {void}
 */

/**
 * The type of a listener that will convey messages from the host.
 *
 * @callback Listener
 * @param {ListenerCallback} callback - The callback to use to parsed data coming from the host.
 * @returns {void}
 */

/**
 * The type of a shouter that will convey messages to the host.
 *
 * @callback Shouter
 * @param {object} message - Message to shout to the host.
 * @returns {void}
 */

/**
 * @typedef TunnelDescriptor
 * @type {object}
 * @property {Function} resolve - Resolution callback
 * @property {Function} reject - Rejection callback
 * @property {number} port - Enclosure port
 */

/**
 * @typedef DependencyObject
 * @type {object}
 * @property {string} name - Dependency name
 * @property {string} code - Dependency function code.
 * @property {Record<string, string>} dependencies - Dependency's dependencies
 */

/**
 * The type of an Enclosure object.
 *
 * @typedef EnclosureObject
 * @type {object}
 * @property {Set<number>} tunnels - Set of tunnels associated to this enclosure.
 * @property {Map<Function, Set<RegExp>>} listeners - Listeners map for this enclosure, mapping listener proper to a set of filter {@link !RegExp}s.
 * @property {Set<string>} linked - Set of linked enclosures to forward events to.
 * @property {boolean} muted - Whether this enclosure is inhibited from emitting events on the host.
 * @property {Record<string, unknown>} dependencies - The installed dependencies object.
 * @property {number} port - The port number where to find this enclosure's back-reference.
 */

/**
 * @template T
 * @template U
 * @callback Array_fromAsync_mapFn
 * @param {T} element
 * @param {number} index
 * @returns {Promise<U>}
 */

/**
 * @template T
 * @template K
 * @callback Map_groupBy_callbackFn
 * @param {T} element
 * @param {number} index
 * @returns {K}
 */

/**
 * @template T
 * @callback Promise_withResolvers_resolve
 * @param {T | PromiseLike<T>} value
 */

/**
 * @callback Promise_withResolvers_reject
 * @param {any | undefined} reason
 */

/**
 * @callback SetLike_has
 * @param {any} value
 * @returns {boolean}
 */

/**
 * @template T
 * @callback SetLike_keys
 * @returns {IterableIterator<T>}
 */

/**
 * @template T
 * @typedef SetLike
 * @property {Readonly<number>} size - The `size` accessor.
 * @property {SetLike_has} has - The `has()` predicate.
 * @property {SetLike_keys<T>} keys - The `keys()` method.
 */

/**
 * @callback EventCallback
 * @param {string} name - Event name to serve.
 * @param {...unknown} args - Additional arguments to pass.
 * @returns {void}
 */

// ------------------------------------------------------------------------------------------------

/**
 * The code the {@link !Worker} will end up executing.
 *
 * @param {Record<string, any>} _this - The `this` value to use (injected by the caller).
 * @param {number} _bootTunnel - The tunnel index to use to signal when boot-up is complete.
 * @param {string} _defaultEnclosureName - The name of the default enclosure created.
 * @param {Listener} _listen - The `listener` value to use (injected by the caller).
 * @param {Shouter} _shout - The `shout` value to use (injected by the caller).
 * @returns {void}
 */
const workerRunner = (_this, _bootTunnel, _defaultEnclosureName, _listen, _shout) => {
  'use strict';

  /**
   * Millisecond in which {@link !Worker} execution started.
   *
   * @type {number}
   */
  const STARTUP = Date.now();

  // ----------------------------------------------------------------------------------------------

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

  /**
   * Name to use for the event caster parameter.
   *
   * @type {string}
   */
  const EVENT_CASTER_NAME = '__events__';

  // ----------------------------------------------------------------------------------------------
  // -- Expose Standard Classes -------------------------------------------------------------------
  // ----------------------------------------------------------------------------------------------

  _this.AsyncFunction = async function () {}.constructor;
  _this.GeneratorFunction = function* () {}.constructor;
  _this.AsyncGeneratorFunction = async function* () {}.constructor;

  // _this.ArrayIteratorPrototype = Object.getPrototypeOf(new Array()[Symbol.iterator]());
  // _this.StringIteratorPrototype = Object.getPrototypeOf(new String()[Symbol.iterator]());
  // _this.MapIteratorPrototype = Object.getPrototypeOf(new Map()[Symbol.iterator]());
  // _this.SetIteratorPrototype = Object.getPrototypeOf(new Set()[Symbol.iterator]());
  // _this.RegExpIteratorPrototype = Object.getPrototypeOf(new RegExp()[Symbol.matchAll]());
  // _this.GeneratorIteratorPrototype = Object.getPrototypeOf(_this.GeneratorFunction()());
  // _this.AsyncGeneratorIteratorPrototype = Object.getPrototypeOf(_this.AsyncGeneratorFunction()());

  // ----------------------------------------------------------------------------------------------
  // -- Back-Up global entities -------------------------------------------------------------------
  // ----------------------------------------------------------------------------------------------

  const _eval = eval;
  const _Date_now = Date.now;
  const _setTimeout = setTimeout;
  const _dispatchEvent = dispatchEvent;

  const _Array = Array;
  const _Date = Date;
  const _Error = Error;
  const _ErrorEvent = ErrorEvent;
  const _Function = Function;
  const _Map = Map;
  const _Object = Object;
  const _Promise = Promise;
  const _RegExp = RegExp;
  const _Set = Set;
  const _Symbol = Symbol;
  const _WeakSet = WeakSet;

  const _Reflect = Reflect;

  const _Math = Math;

  // ----------------------------------------------------------------------------------------------
  // -- Shimming ----------------------------------------------------------------------------------
  // ----------------------------------------------------------------------------------------------

  /**
   * Shim for {@link !Array.fromAsync}.
   *
   * Needed because: Samsung, and NodeJS have no support.
   *
   * @returns {void}
   * @see {@link https://github.com/es-shims/array-from-async/blob/main/index.mjs}
   */
  const shimArrayFromAsync = () => {
    if (undefined === _this.Array.fromAsync) {
      /**
       * @description PLACEHOLDER.
       * @template T
       * @param {AsyncIterable<T>} items - Items to use.
       * @returns {Promise<T[]>} The resulting array.
       */
      /**
       * @description PLACEHOLDER.
       * @template T
       * @template U
       * @param {AsyncIterable<T>} items - Items to use.
       * @param {Array_fromAsync_mapFn<T, U>} mapfn - Map function to apply.
       * @param {any} thisArg - The `this` value to pass to the map function.
       * @returns {Promise<U[]>} The resulting array.
       */
      _this.Array.fromAsync = async function (items, mapfn, thisArg) {
        /**
         * @description PLACEHOLDER.
         * @param {any} obj - Function to query.
         * @returns {boolean} Whether the given function is a constructor.
         */
        const isConstructor = (obj) => {
          /**
           * @type {any}
           */
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
              throw new TypeError('Input is too long and exceeded Number.MAX_SAFE_INTEGER times.');
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
              throw new TypeError('Input is too long and exceeded Number.MAX_SAFE_INTEGER times.');
            }

            const v = items[i];
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
   * Shim for {@link !ArrayBuffer}.
   *
   * Needed because: Firefox has problems dealing with resizing.
   *
   * @returns {void}
   */
  const shimArrayBuffer = () => {
    // TODO: add shim for ArrayBuffer
  };

  /**
   * Shim for {@link !Atomics.waitAsync}.
   *
   * Needed because: Firefox has no support.
   *
   * @returns {void}
   */
  const shimAtomicsWaitAsync = () => {
    // TODO: add shim for Atomics.waitAsync
  };

  /**
   * Shim for {@link !FinalizationRegistry}.
   *
   * Needed because: Firefox has no support for non-registered symbols as target.
   *
   * @returns {void}
   */
  const shimFinalizationRegistry = () => {
    // TODO: add shim for FinalizationRegistry
  };

  /**
   * Shim for {@link !Iterator}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorConstructor = () => {
    // TODO: add shim for Iterator
  };

  /**
   * Shim for {@link !Iterator.from}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorFrom = () => {
    // TODO: add shim for Iterator.from
  };

  /**
   * Shim for {@link !Iterator.prototype.drop}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorPrototypeDrop = () => {
    // TODO: add shim for Iterator.prototype.drop
  };

  /**
   * Shim for {@link !Iterator.prototype.every}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorPrototypeEvery = () => {
    // TODO: add shim for Iterator.prototype.every
  };

  /**
   * Shim for {@link !Iterator.prototype.filter}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorPrototypeFilter = () => {
    // TODO: add shim for Iterator.prototype.filter
  };

  /**
   * Shim for {@link !Iterator.prototype.find}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorPrototypeFind = () => {
    // TODO: add shim for Iterator.prototype.find
  };

  /**
   * Shim for {@link !Iterator.prototype.flatMap}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorPrototypeFlatMap = () => {
    // TODO: add shim for Iterator.prototype.flatMap
  };

  /**
   * Shim for {@link !Iterator.prototype.forEach}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorPrototypeForEach = () => {
    // TODO: add shim for Iterator.prototype.forEach
  };

  /**
   * Shim for {@link !Iterator.prototype.map}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorPrototypeMap = () => {
    // TODO: add shim for Iterator.prototype.map
  };

  /**
   * Shim for {@link !Iterator.prototype.reduce}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorPrototypeReduce = () => {
    // TODO: add shim for Iterator.prototype.reduce
  };

  /**
   * Shim for {@link !Iterator.prototype.some}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorPrototypeSome = () => {
    // TODO: add shim for Iterator.prototype.some
  };

  /**
   * Shim for {@link !Iterator.prototype.take}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorPrototypeTake = () => {
    // TODO: add shim for Iterator.prototype.take
  };

  /**
   * Shim for {@link !Iterator.prototype.toArray}.
   *
   * Needed because: Firefox, Safari, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimIteratorPrototypeToArray = () => {
    // TODO: add shim for Iterator.prototype.toArray
  };

  /**
   * Shim for {@link !Map.groupBy}.
   *
   * Needed because: Samsung has no support.
   *
   * @returns {void}
   */
  const shimMapGroupBy = () => {
    if (undefined === _this.Map.groupBy) {
      /**
       * @description PLACEHOLDER.
       * @template T
       * @template K
       * @param {Iterable<T>} items - Items to use
       * @param {Map_groupBy_callbackFn<T, K>} callbackFn - The grouping function to use.
       * @returns {Map<K, T[]>} The resulting grouped Map.
       */
      _this.Map.groupBy = function (items, callbackFn) {
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
   * Shim for {@link !Promise.withResolvers}.
   *
   * Needed because: Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimPromiseWithResolvers = () => {
    if (undefined === _this.Promise.withResolvers) {
      // ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers#description
      /**
       * @description PLACEHOLDER.
       * @template T
       * @returns {PromiseWithResolvers<T>} The created Promise along with its resolvers.
       */
      _this.Promise.withResolvers = function () {
        /**
         * @type {Promise_withResolvers_resolve<T>}
         */
        let resolve;
        /**
         * @type {Promise_withResolvers_reject}
         */
        let reject;

        return {
          promise: new Promise((res, rej) => {
            resolve = res;
            reject = rej;
          }),
          // @ts-expect-error: Variable 'reject' is used before being assigned.
          reject,
          // @ts-expect-error: Variable 'resolve' is used before being assigned.
          resolve,
        };
      };
    }
  };

  /**
   * Shim for {@link !Set.prototype.difference}.
   *
   * Needed because: Firefox, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimSetPrototypeDifference = () => {
    if (undefined === _this.Set.prototype.difference) {
      /**
       * @description PLACEHOLDER.
       * @template T
       * @param {SetLike<T>} other - Operand.
       * @returns {Set<T>} Resulting Set.
       */
      _this.Set.prototype.difference = function (other) {
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
   * Shim for {@link !Set.prototype.intersection}.
   *
   * Needed because: Firefox, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimSetPrototypeIntersection = () => {
    if (undefined === _this.Set.prototype.intersection) {
      /**
       * @description PLACEHOLDER.
       * @template T
       * @param {SetLike<T>} other - Operand.
       * @returns {Set<T>} Resulting Set.
       */
      _this.Set.prototype.intersection = function (other) {
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
   * Shim for {@link !Set.prototype.isDisjointFrom}.
   *
   * Needed because: Firefox, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimSetPrototypeIsDisjointFrom = () => {
    if (undefined === _this.Set.prototype.isDisjointFrom) {
      /**
       * @description PLACEHOLDER.
       * @template T
       * @param {SetLike<T>} other - Operand.
       * @returns {boolean} Result.
       */
      _this.Set.prototype.isDisjointFrom = function (other) {
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
   * Shim for {@link !Set.prototype.isSubsetOf}.
   *
   * Needed because: Firefox, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimSetPrototypeIsSubsetOf = () => {
    if (undefined === _this.Set.prototype.isSubsetOf) {
      /**
       * @description PLACEHOLDER.
       * @template T
       * @param {SetLike<T>} other - Operand.
       * @returns {boolean} Result.
       */
      _this.Set.prototype.isSubsetOf = function (other) {
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
   * Shim for {@link !Set.prototype.isSupersetOf}.
   *
   * Needed because: Firefox, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimSetPrototypeIsSupersetOf = () => {
    if (undefined === _this.Set.prototype.isSupersetOf) {
      /**
       * @description PLACEHOLDER.
       * @template T
       * @param {SetLike<T>} other - Operand.
       * @returns {boolean} Result.
       */
      _this.Set.prototype.isSupersetOf = function (other) {
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
   * Shim for {@link !Set.prototype.symmetricDifference}.
   *
   * Needed because: Firefox, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimSetPrototypeSymmetricDifference = () => {
    if (undefined === _this.Set.prototype.symmetricDifference) {
      /**
       * @description PLACEHOLDER.
       * @template T
       * @param {SetLike<T>} other - Operand.
       * @returns {Set<T>} Resulting Set.
       */
      _this.Set.prototype.symmetricDifference = function (other) {
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
   * Shim for {@link !Set.prototype.union}.
   *
   * Needed because: Firefox, Samsung, and NodeJS have no support.
   *
   * @returns {void}
   */
  const shimSetPrototypeUnion = () => {
    if (undefined === _this.Set.prototype.union) {
      /**
       * @description PLACEHOLDER.
       * @template T
       * @param {SetLike<T>} other - Operand.
       * @returns {Set<T>} Resulting Set.
       */
      _this.Set.prototype.union = function (other) {
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
   * Shim for {@link !WeakMap}.
   *
   * Needed because: Firefox has no support for non-registered symbols as target.
   *
   * @returns {void}
   */
  const shimWeakMap = () => {
    // TODO: add shim for WeakMap
  };

  /**
   * Shim for {@link !WeakRef}.
   *
   * Needed because: Firefox has no support for non-registered symbols as target.
   *
   * @returns {void}
   */
  const shimWeakRef = () => {
    // TODO: add shim for WeakRef
  };

  /**
   * Shim for {@link !WeakSet}.
   *
   * Needed because: Firefox has no support for non.registered symbols as target.
   *
   * @returns {void}
   */
  const shimWeakSet = () => {
    // TODO: add shim for WeakSet
  };

  // ----------------------------------------------------------------------------------------------
  // -- Patching ----------------------------------------------------------------------------------
  // ----------------------------------------------------------------------------------------------

  /**
   * Patch {@link !eval}.
   *
   * This makes it so that only [indirect eval](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#direct_and_indirect_eval) is available.
   *
   * @returns {void}
   */
  const patchEval = () => {
    /**
     * Evaluates JavaScript code and executes it.
     *
     * @param {string} script - A String value that contains valid JavaScript code.
     * @returns {unknown} The execution result.
     */
    _this.eval = (script) => _eval(`"use strict"; ${script.toString()}`);
  };

  /**
   * Patch {@link !Object}.
   *
   * This makes it so that {@link !Object.prototype.toLocaleString} maps to {@link !Object.prototype.toString}.
   *
   * @returns {void}
   */
  const patchObject = () => {
    _this.Object.prototype.toLocaleString = _this.Object.prototype.toString;
  };

  /**
   * Patch {@link !Number}.
   *
   * This makes it so that {@link !Number.prototype.toLocaleString} maps to {@link !Number.prototype.toString}.
   *
   * @returns {void}
   */
  const patchNumber = () => {
    _this.Number.prototype.toLocaleString = _this.Number.prototype.toString;
  };

  /**
   * Patch {@link !BigInt}.
   *
   * This makes it so that {@link !BigInt.prototype.toLocaleString} maps to {@link !BigInt.prototype.toString}.
   *
   * @returns {void}
   */
  const patchBigInt = () => {
    _this.BigInt.prototype.toLocaleString = _this.BigInt.prototype.toString;
  };

  /**
   * Patch {@link !Math}.
   *
   * This makes it so that {@link !Math.random} always returns {@link !NaN}.
   *
   * @returns {void}
   */
  const patchMath = () => {
    _this.Math.random = () => NaN;
  };

  /**
   * Patch {@link !Date}.
   *
   * This makes it so that:
   *
   * - {@link !Date} will return {@link !NaN} for the current date.
   * - {@link !Date.now} will return {@link !NaN}.
   * - {@link !Date.prototype.getDate} maps to {@link !Date.prototype.getUTCDate}.
   * - {@link !Date.prototype.getDay} maps to {@link !Date.prototype.getUTCDay}.
   * - {@link !Date.prototype.getFullYear} maps to {@link !Date.prototype.getUTCFullYear}.
   * - {@link !Date.prototype.getHours} maps to {@link !Date.prototype.getUTCHours}.
   * - {@link !Date.prototype.getMilliseconds} maps to {@link !Date.prototype.getUTCMilliseconds}.
   * - {@link !Date.prototype.getMinutes} maps to {@link !Date.prototype.getUTCMinutes}.
   * - {@link !Date.prototype.getMonth} maps to {@link !Date.prototype.getUTCMonth}.
   * - {@link !Date.prototype.getSeconds} maps to {@link !Date.prototype.getUTCSeconds}.
   * - {@link !Date.prototype.setDate} maps to {@link !Date.prototype.setUTCDate}.
   * - {@link !Date.prototype.setFullYear} maps to {@link !Date.prototype.setUTCFullYear}.
   * - {@link !Date.prototype.setHours} maps to {@link !Date.prototype.setUTCHours}.
   * - {@link !Date.prototype.setMilliseconds} maps to {@link !Date.prototype.setUTCMilliseconds}.
   * - {@link !Date.prototype.setMinutes} maps to {@link !Date.prototype.setUTCMinutes}.
   * - {@link !Date.prototype.setMonth} maps to {@link !Date.prototype.setUTCMonth}.
   * - {@link !Date.prototype.setSeconds} maps to {@link !Date.prototype.setUTCSeconds}.
   * - {@link !Date.prototype.getTimezoneOffset} will return `0`.
   * - {@link !Date.prototype.toDateString} will return {@link !Date.prototype.toISOString}'s date part.
   * - {@link !Date.prototype.toTimeString} will return {@link !Date.prototype.toISOString}'s time part.
   * - {@link !Date.prototype.toString} maps to {@link !Date.prototype.toISOString}.
   * - {@link !Date.prototype.toLocaleDateString} maps to {@link !Date.prototype.toDateString}.
   * - {@link !Date.prototype.toLocaleString} maps to {@link !Date.prototype.toString}.
   * - {@link !Date.prototype.toLocaleTimeString} maps to {@link !Date.prototype.toTimeString}.
   *
   * @returns {void}
   */
  const patchDate = () => {
    /**
     * @description PLACEHOLDER.
     * @param {number | string | Date | undefined} valueDateStringDateObjectYear - Number of milliseconds, or ISO string, or Date object, or none.
     * @param {number | undefined} monthIndex - Month number.
     * @param {number | undefined} day - Day number.
     * @param {number | undefined} hours - Hour number.
     * @param {number | undefined} minutes - Number of minutes.
     * @param {number | undefined} seconds - Number of seconds.
     * @param {number | undefined} milliseconds - Number of milliseconds.
     * @returns {string | Date} The ISO string of the given date, or the newly constructed Date instance.
     * @see {@link https://stackoverflow.com/a/70860699} for the original code adapted to fit our needs.
     */
    _this.Date = function Date(valueDateStringDateObjectYear, monthIndex, day, hours, minutes, seconds, milliseconds) {
      if (!new.target || undefined === valueDateStringDateObjectYear) {
        return new _Date(NaN).toISOString();
      }

      /**
       * @description PLACEHOLDER.
       * @param {number} left - Left endpoint.
       * @param {number} mid - Value to check.
       * @param {number} right - Right endpoint.
       * @returns {boolean} Whether the value is between the given endpoints (inclusive).
       */
      const between = (left, mid, right) => left <= mid && mid <= right;
      /**
       * @description PLACEHOLDER.
       * @param {number} ts - Timestamp to check.
       * @returns {boolean} Whether the given timestamp is valid.
       */
      const validTs = (ts) => between(-8640000000000000, ts, 8640000000000000);

      let ts = NaN;
      if (undefined === monthIndex) {
        switch (typeof valueDateStringDateObjectYear) {
          case 'number':
            if (validTs(valueDateStringDateObjectYear)) {
              ts = valueDateStringDateObjectYear;
            }
            break;
          case 'string':
            {
              /**
               * @description PLACEHOLDER.
               * @param {string | undefined} str - String to parse.
               * @param {number} def - Default value to use.
               * @returns {number} The parsed number.
               */
              const parse = (str, def) => {
                const num = Number.parseInt(str ?? '', 10);
                return Number.isNaN(num) ? def : num;
              };
              /**
               * @description PLACEHOLDER.
               * @param {number} num - The number to show as padded decimal.
               * @param {number} padding - The number fo padding `0`s.
               * @param {boolean} withSign - Whether to include the sign.
               * @returns {string} The resulting string.
               */
              const toPaddedDecimal = (num, padding, withSign = false) =>
                (withSign ? (num < 0 ? '-' : '+') : '') + _Math.abs(num).toString().padStart(padding, '0');

              const match = valueDateStringDateObjectYear.match(
                /^(?<year>\d{4}|[+-]\d{6})(?:-(?<month>\d\d)(?:-(?<day>\d\d))?)?(?:T(?<hours>\d\d):(?<minutes>\d\d)(?::(?<seconds>\d\d)(?:\.(?<milliseconds>\d{1,3}))?)?)?(?:Z|(?<tzHours>[+-]\d\d):(?<tzMinutes>\d\d))?$/,
              );
              if (null !== match && '-000000' !== match.groups?.year) {
                const year = parse(match.groups?.year, NaN);
                const month = parse(match.groups?.month, 1);
                const day = parse(match.groups?.day, 1);
                const hours = parse(match.groups?.hours, 0);
                const minutes = parse(match.groups?.minutes, 0);
                const seconds = parse(match.groups?.seconds, 0);
                const milliseconds = parse(match.groups?.milliseconds, 0);
                const tzHours = parse(match.groups?.tzHours, 0);
                const tzMinutes = parse(match.groups?.tzMinutes, 0);
                const daysInMonth = [
                  31,
                  28 + (0 === year % 400 || (0 !== year % 100 && 0 === year % 4) ? 1 : 0),
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
                  !Number.isNaN(year) &&
                  between(1, month, 12) &&
                  between(1, day, daysInMonth[month - 1] ?? 0) &&
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
            if (valueDateStringDateObjectYear instanceof Date) {
              const time = valueDateStringDateObjectYear.getTime();
              if (validTs(time)) {
                ts = time;
              }
            }
            break;
        }
      } else {
        if ('number' === typeof valueDateStringDateObjectYear) {
          const utc = _Date.UTC(valueDateStringDateObjectYear, monthIndex, day, hours, minutes, seconds, milliseconds);
          if (validTs(utc)) {
            ts = utc;
          }
        }
      }
      return _Reflect.construct(new.target === Date ? _Date : new.target, [ts]);
    };
    _Object.defineProperty(_this.Date, 'length', {
      configurable: true,
      value: _Date.length,
    });
    _Date.prototype.constructor = _this.Date;
    _this.Date.prototype = _Date.prototype;
    /**
     * @description PLACEHOLDER.
     * @param {string} str - String to parse
     * @returns {number} The number of milliseconds of he parsed string.
     */
    _this.Date.parse = (str) => _Date.parse(str);
    /**
     * @description PLACEHOLDER.
     * @param {number} year - Year number.
     * @param {number | undefined} monthIndex - Month number.
     * @param {number | undefined} date - Date number.
     * @param {number | undefined} hours - Hour number.
     * @param {number | undefined} minutes - Number of minutes.
     * @param {number | undefined} seconds - Number of seconds.
     * @param {number | undefined} ms - Number of milliseconds.
     * @returns {number} The number of milliseconds for the given data, in UTC.
     */
    _this.Date.UTC = (
      year,
      monthIndex = undefined,
      date = undefined,
      hours = undefined,
      minutes = undefined,
      seconds = undefined,
      ms = undefined,
    ) => _Date.UTC(year, monthIndex, date, hours, minutes, seconds, ms);
    _this.Date.now = () => NaN;
    _this.Date.prototype.getDate = _this.Date.prototype.getUTCDate;
    _this.Date.prototype.getDay = _this.Date.prototype.getUTCDay;
    _this.Date.prototype.getFullYear = _this.Date.prototype.getUTCFullYear;
    _this.Date.prototype.getHours = _this.Date.prototype.getUTCHours;
    _this.Date.prototype.getMilliseconds = _this.Date.prototype.getUTCMilliseconds;
    _this.Date.prototype.getMinutes = _this.Date.prototype.getUTCMinutes;
    _this.Date.prototype.getMonth = _this.Date.prototype.getUTCMonth;
    _this.Date.prototype.getSeconds = _this.Date.prototype.getUTCSeconds;
    _this.Date.prototype.getTimezoneOffset = () => 0;
    _this.Date.prototype.setDate = _this.Date.prototype.setUTCDate;
    _this.Date.prototype.setFullYear = _this.Date.prototype.setUTCFullYear;
    _this.Date.prototype.setHours = _this.Date.prototype.setUTCHours;
    _this.Date.prototype.setMilliseconds = _this.Date.prototype.setUTCMilliseconds;
    _this.Date.prototype.setMinutes = _this.Date.prototype.setUTCMinutes;
    _this.Date.prototype.setMonth = _this.Date.prototype.setUTCMonth;
    _this.Date.prototype.setSeconds = _this.Date.prototype.setUTCSeconds;
    _this.Date.prototype.toString = _this.Date.prototype.toISOString;
    _this.Date.prototype.toDateString = function () {
      return this.toISOString().split('T')[0];
    };
    _this.Date.prototype.toTimeString = function () {
      return this.toISOString().split('T')[1];
    };
    _this.Date.prototype.toLocaleDateString = _this.Date.prototype.toDateString;
    _this.Date.prototype.toLocaleString = _this.Date.prototype.toString;
    _this.Date.prototype.toLocaleTimeString = _this.Date.prototype.toTimeString;
  };

  /**
   * Patch {@link !String}.
   *
   * This makes it so that:
   *
   * - {@link !String.prototype.localeCompare} performs a byte-wise comparison.
   * - {@link !String.prototype.toLocaleLowerCase} maps to {@link !String.prototype.toLowerCase}.
   * - {@link !String.prototype.toLocaleUpperCase} maps to {@link !String.prototype.toUpperCase}.
   *
   * @returns {void}
   */
  const patchString = () => {
    /**
     * @description PLACEHOLDER.
     * @param {string} compareString - String to compare against.
     * @returns {number} -1, 0, or 1, if smaller than, equal to, or greater than the given string respectively.
     */
    _this.String.prototype.localeCompare = function (compareString) {
      return this < compareString ? -1 : compareString < this ? 1 : 0;
    };
    _this.String.prototype.toLocaleLowerCase = _this.String.prototype.toLowerCase;
    _this.String.prototype.toLocaleUpperCase = _this.String.prototype.toUpperCase;
  };

  /**
   * Patch {@link !Array}.
   *
   * This makes it so that {@link !Array.prototype.toLocaleString} maps to {@link !Array.prototype.toString}.
   *
   * @returns {void}
   */
  const patchArray = () => {
    _this.Array.prototype.toLocaleString = _this.Array.prototype.toString;
  };

  /**
   * Patch {@link !TypedArray}.
   *
   * This makes it so that:
   *
   * - {@link !Int8Array.prototype.toLocaleString} maps to {@link !Int8Array.prototype.toString}.
   * - {@link !Uint8Array.prototype.toLocaleString} maps to {@link !Uint8Array.prototype.toString}.
   * - {@link !Uint8ClampedArray.prototype.toLocaleString} maps to {@link !Uint8ClampedArray.prototype.toString}.
   * - {@link !Int16Array.prototype.toLocaleString} maps to {@link !Int16Array.prototype.toString}.
   * - {@link !Uint16Array.prototype.toLocaleString} maps to {@link !Uint16Array.prototype.toString}.
   * - {@link !Int32Array.prototype.toLocaleString} maps to {@link !Int32Array.prototype.toString}.
   * - {@link !Uint32Array.prototype.toLocaleString} maps to {@link !Uint32Array.prototype.toString}.
   * - {@link !BigInt64Array.prototype.toLocaleString} maps to {@link !BigInt64Array.prototype.toString}.
   * - {@link !BigUint64Array.prototype.toLocaleString} maps to {@link !BigUint64Array.prototype.toString}.
   * - {@link !Float32Array.prototype.toLocaleString} maps to {@link !Float32Array.prototype.toString}.
   * - {@link !Float64Array.prototype.toLocaleString} maps to {@link !Float64Array.prototype.toString}.
   *
   * @returns {void}
   */
  const patchTypedArray = () => {
    _this.Int8Array.prototype.toLocaleString = _this.Int8Array.prototype.toString;
    _this.Uint8Array.prototype.toLocaleString = _this.Uint8Array.prototype.toString;
    _this.Uint8ClampedArray.prototype.toLocaleString = _this.Uint8ClampedArray.prototype.toString;
    _this.Int16Array.prototype.toLocaleString = _this.Int16Array.prototype.toString;
    _this.Uint16Array.prototype.toLocaleString = _this.Uint16Array.prototype.toString;
    _this.Int32Array.prototype.toLocaleString = _this.Int32Array.prototype.toString;
    _this.Uint32Array.prototype.toLocaleString = _this.Uint32Array.prototype.toString;
    _this.BigInt64Array.prototype.toLocaleString = _this.BigInt64Array.prototype.toString;
    _this.BigUint64Array.prototype.toLocaleString = _this.BigUint64Array.prototype.toString;
    _this.Float32Array.prototype.toLocaleString = _this.Float32Array.prototype.toString;
    _this.Float64Array.prototype.toLocaleString = _this.Float64Array.prototype.toString;
  };

  /**
   * Patch {@link !RegExp}.
   *
   * This makes it so that the following deprecated static properties are removed:
   *
   * - {@link !RegExp.$1}, {@link !RegExp.$2}, {@link !RegExp.$3}, {@link !RegExp.$4}, {@link !RegExp.$5}, {@link !RegExp.$6}, {@link !RegExp.$7}, {@link !RegExp.$8}, {@link !RegExp.$9}.
   * - {@link !RegExp.input}, {@link !RegExp.$_}.
   * - {@link !RegExp.lastMatch}, {@link !RegExp.$&}.
   * - {@link !RegExp.lastParen}, {@link !RegExp.$+}.
   * - {@link !RegExp.leftContext}, {@link !RegExp.$`}.
   * - {@link !RegExp.rightContext}, {@link !RegExp.$'}.
   *
   * @returns {void}
   */
  const patchRegExp = () => {
    /**
     * @description PLACEHOLDER.
     * @param {RegExp | string} pattern - Pattern to use.
     * @param {string | undefined} flags - Flags to use.
     * @returns {RegExp} The created RegExp instance.
     */
    _this.RegExp = function RegExp(pattern, flags) {
      return new.target
        ? _Reflect.construct(new.target === RegExp ? _RegExp : new.target, [pattern, flags])
        : _RegExp(pattern, flags);
    };
    _Object.defineProperty(_this.RegExp, 'length', {
      configurable: true,
      value: _RegExp.length,
    });
    _RegExp.prototype.constructor = _this.RegExp;
    _this.RegExp.prototype = _RegExp.prototype;
    _this.RegExp[_Symbol.species] = _RegExp[_Symbol.species];
  };

  // ----------------------------------------------------------------------------------------------
  // -- Deep Freezing -----------------------------------------------------------------------------
  // ----------------------------------------------------------------------------------------------

  /**
   * Recursively call {@link !Object.freeze} on {@link this}.
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
     * @param {WeakSet<any>} processed - Set of objects already frozen so as to prevent infinite recursion and speed the process up.
     * @returns {void}
     */
    const deepFreeze = (subject, processed = new _WeakSet()) => {
      if (null === subject || !['function', 'object'].includes(typeof subject)) {
        return;
      }
      let current = subject;
      do {
        if (processed.has(current)) {
          break;
        }
        processed.add(current);
        _Object.freeze(current);

        /**
         * @type {Record<string | symbol, PropertyDescriptor>}
         */
        const descriptors = _Object.getOwnPropertyDescriptors(current);
        for (const key of [..._Object.getOwnPropertyNames(current), ..._Object.getOwnPropertySymbols(current)]) {
          if ('get' in (descriptors[key] ?? {})) {
            _Object.freeze(descriptors[key]?.get);
          }
          if ('set' in (descriptors[key] ?? {})) {
            _Object.freeze(descriptors[key]?.set);
          }
          if ('value' in (descriptors[key] ?? {})) {
            deepFreeze(descriptors[key]?.value, processed);
          }
        }
        current = _Object.getPrototypeOf(current);
      } while (null !== current);
    };

    deepFreeze(_this);
  };

  // ----------------------------------------------------------------------------------------------
  // -- Low-Level JSON Messaging ------------------------------------------------------------------
  // ----------------------------------------------------------------------------------------------

  /**
   * Post a `pong` message to the host.
   *
   * A `pong` message has the following form:
   *
   * ```json
   * {
   *   name: "pong"
   * }
   * ```
   *
   * @returns {void}
   */
  const postPongMessage = () => {
    _shout({ name: 'pong' });
  };

  /**
   * Post a `resolve` message to the host.
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
    _shout({ name: 'resolve', payload, tunnel });
  };

  /**
   * Post a `reject` message to the host.
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
   * @param {string} error - The error message to use for {@link !Error} construction in the.
   * @returns {void}
   */
  const postRejectMessage = (tunnel, error) => {
    _shout({ error, name: 'reject', tunnel });
  };

  /**
   * Post an `emit` message to the host.
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
    _shout({ args, event, name: 'emit' });
  };

  /**
   * Post a `call` message to the host.
   *
   * A `call` message has the following form:
   *
   * ```json
   * {
   *   name: "call",
   *   enclosure: <string>,
   *   tunnel: <int>,
   *   idx: <int>,
   *   args: <unknown[]>,
   * }
   * ```
   *
   * Where:
   *
   * - `enclosure` is the WW-side enclosure that is awaiting the call's result (for reporting on the VM's side).
   * - `tunnel` is the WW-side tunnel index awaiting the call's result.
   * - `idx` is the function index being called.
   * - `args` is an array of optional call arguments.
   *
   * @param {string} enclosure - The enclosure to use.
   * @param {number} tunnel - The tunnel index where the call result is expected.
   * @param {number} idx - The function index to call in the.
   * @param {Array<unknown>} args - The arguments to forward to the function call itself.
   * @returns {void}
   */
  const postCallMessage = (enclosure, tunnel, idx, args) => {
    _shout({
      args,
      enclosure,
      idx,
      name: 'call',
      tunnel,
    });
  };

  // ----------------------------------------------------------------------------------------------
  // -- Enclosure Framework -----------------------------------------------------------------------
  // ----------------------------------------------------------------------------------------------

  /**
   * Mapping from enclosure name to {@link EnclosureObject}.
   *
   * @type {Map<string, EnclosureObject>}
   */
  const enclosures = new _Map();

  /**
   * Back-references from "port number" to enclosure name.
   *
   * This device is in place so as to allow for transparent merging of enclosures.
   *
   * @type {Array<string>}
   */
  const enclosurePorts = [];

  /**
   * A list of inter-process tunnels being used, alongside with enclosure port number.
   *
   * @type {TunnelDescriptor[]}
   */
  const tunnels = [];

  /**
   * Retrieve the "base" of the enclosure (ie. all but the last segment).
   *
   * @param {string} enclosure - Enclosure to retrieve the base of.
   * @returns {string} The given enclosure's base.
   */
  const getEnclosureBase = (enclosure) => {
    return enclosure.split('.').slice(0, -1).join('.');
  };

  /**
   * Retrieve a list of prefix enclosures of the given one.
   *
   * @param {string} enclosure - Enclosure to retrieve the prefixes list of.
   * @returns {string[]} An array of enclosure names.
   */
  const enclosurePrefixes = (enclosure) => {
    const parts = getEnclosureBase(enclosure).split('.');
    const result = [];
    const last = [];
    for (const part in parts) {
      last.push(part);
      result.push(last.join('.'));
    }
    return result.reverse();
  };

  /**
   * Add the given enclosure.
   *
   * @param {string} enclosure - Enclosure to create.
   * @returns {void}
   * @throws {Error} if the given enclosure already exists.
   * @throws {Error} if the given enclosure's parent does not exist.
   */
  const addEnclosure = (enclosure) => {
    const parent = getEnclosureBase(enclosure) || null;

    if (enclosures.has(enclosure)) {
      throw new _Error(`duplicate enclosure name ${enclosure}`);
    } else if (parent !== null && !enclosures.has(parent)) {
      throw new _Error(`parent enclosure ${parent} does not exist`);
    }

    enclosures.set(enclosure, {
      dependencies: _Object.create(null === parent ? null : getEnclosure(parent).dependencies),
      linked: new _Set(),
      listeners: new _Map(),
      muted: false,
      port: enclosurePorts.push(enclosure) - 1,
      tunnels: new _Set(),
    });
  };

  /**
   * Retrieve the enclosure given.
   *
   * @param {string} enclosure - Enclosure to retrieve.
   * @returns {EnclosureObject} Enclosure object under the given name.
   * @throws {Error} if the given enclosure does not exist.
   */
  const getEnclosure = (enclosure) => {
    const result = enclosures.get(enclosure);
    if (undefined === result) {
      throw new _Error(`enclosure ${enclosure} does not exist`);
    }

    return result;
  };

  /**
   * Retrieve a list of _all_ sub enclosures of the given enclosure (including transitive relationships).
   *
   * @param {string} enclosure - Enclosure to retrieve the list of sub enclosures of.
   * @param {number} depth - Maximum depth to retrieve results for, or `0` for unlimited results.
   * @returns {Array<string>} An array with the enclosure's sub enclosures.
   */
  const enclosureSubEnclosures = (enclosure, depth = 0) => {
    const limit = 0 < depth ? depth + enclosure.split('.').length : Infinity;
    return _Array
      .from(enclosures.keys())
      .filter((candidate) => candidate.startsWith(`${enclosure}.`) && candidate.split('.').length <= limit);
  };

  /**
   * Remove the given enclosure and return a list of transitively-removed enclosures.
   *
   * Upon deleting an enclosure, all of its sub enclosures will be delete along with it.
   * Any tunnel in a so removed enclosure will be rejected.
   * Any port back-referencing a so removed enclosure will be deleted.
   *
   * @param {string} enclosure - Enclosure to remove.
   * @returns {Array<string>} A list of enclosures that actually got removed (this includes the one given, and all of its sub enclosures).
   */
  const removeEnclosure = (enclosure) => {
    /**
     * @type {number[]}
     */
    let toReject = [];

    const removed = [enclosure, ...enclosureSubEnclosures(enclosure)].sort();
    removed.forEach((toRemove) => {
      const { port, tunnels } = getEnclosure(toRemove);
      toReject = [...toReject, ...tunnels];
      delete enclosurePorts[port];
      enclosures.delete(toRemove);
    });

    const error = new _Error('deleting enclosure');
    toReject.sort().forEach((tunnel) => {
      rejectTunnel(tunnel, error);
    });

    return removed;
  };

  /**
   * Merge the given enclosure into its parent.
   *
   * Merging merges an enclosure's dependencies with those of its parent, as does its tunnels and event listeners.
   * The given enclosure's parent adopts all of the given enclosure's sub enclosures.
   * Finally, the given enclosure's port is redirected to its parent.
   *
   * NOTE: we can never get rid of merged ports because the wrapped event caster may have been cached dependency-side.
   *
   * @param {string} enclosure - The enclosure to merge to its parent.
   * @returns {void}
   * @throws {Error} if the given enclosure is a root enclosure.
   */
  const mergeEnclosure = (enclosure) => {
    const { dependencies, listeners, port, tunnels } = getEnclosure(enclosure);

    const parent = getEnclosureBase(enclosure) || null;
    if (null === parent) {
      throw new _Error(`enclosure ${enclosure} has no parent`);
    }

    const newSubEnclosures = new _Map(
      enclosureSubEnclosures(enclosure).map((subEnclosure) => [
        subEnclosure,
        `${parent}.${subEnclosure.slice(enclosure.length + 1)}`,
      ]),
    );
    {
      const collisions = _Array
        .from(newSubEnclosures.values())
        .filter((newSubEnclosure) => enclosures.has(newSubEnclosure));
      if (0 < collisions.length) {
        throw new _Error(`collisions found on [${collisions.join(', ')}]`);
      }
    }

    const {
      dependencies: parentDependencies,
      listeners: parentListeners,
      tunnels: parentTunnels,
    } = getEnclosure(parent);

    _Array.from(tunnels).forEach((tunnel) => parentTunnels.add(tunnel));

    _Array.from(listeners.entries()).forEach(([callback, filters]) => {
      if (!parentListeners.has(callback)) {
        parentListeners.set(callback, new _Set());
      }
      const callbackFilters = parentListeners.get(callback);
      _Array.from(filters).forEach((filter) => callbackFilters?.add(filter));
    });

    _Object.entries(dependencies).forEach(([name, value]) => {
      parentDependencies[name] = value;
    });

    enclosurePorts[port] = parent;

    _Array.from(newSubEnclosures.entries()).forEach(([subEnclosure, newSubEnclosure]) => {
      listLinkedFrom(subEnclosure).forEach((linkSource) => {
        const { linked } = getEnclosure(linkSource);
        linked.delete(subEnclosure);
        linked.add(newSubEnclosure);
      });
      const subEnclosureEnclosure = getEnclosure(subEnclosure);
      if (-1 === newSubEnclosure.slice(parent.length + 1).indexOf('.')) {
        _Object.setPrototypeOf(subEnclosureEnclosure.dependencies, parentDependencies);
      }
      enclosurePorts[subEnclosureEnclosure.port] = newSubEnclosure;
      enclosures.set(newSubEnclosure, subEnclosureEnclosure);
      enclosures.delete(subEnclosure);
    });

    enclosures.delete(enclosure);
  };

  /**
   * Link the given enclosure with the given target enclosure.
   *
   * Linking one enclosure to another makes it so that events emitted on the former are also cast on the latter.
   *
   * An enclosure may not be linked to either itself, any of its prefixes, any of its sub enclosures.
   * Likewise, an enclosure may not be linked to the same target twice.
   * In any of these cases, this function does nothing but return `false`.
   *
   * @param {string} enclosure - Enclosure to link "from".
   * @param {string} target - Target enclosure to link "to".
   * @returns {boolean} Whether a link was actually added.
   */
  const linkEnclosure = (enclosure, target) => {
    getEnclosure(target); // just for validation
    const { linked } = getEnclosure(enclosure);

    if (
      /* eslint-disable-next-line perfectionist/sort-array-includes */
      [...enclosureSubEnclosures(enclosure), enclosure, ...linked, ...enclosurePrefixes(enclosure)].includes(target)
    ) {
      return false;
    }
    linked.add(target);
    return true;
  };

  /**
   * Unlink the given target from the given enclosure.
   *
   * @param {string} enclosure - Enclosure to unlink "from".
   * @param {string} target - Target enclosure to unlink "to".
   * @returns {boolean} Whether a link was actually severed.
   */
  const unlinkEnclosure = (enclosure, target) => {
    getEnclosure(target); // just for validation
    return getEnclosure(enclosure).linked.delete(target);
  };

  /**
   * Mute the given enclosure.
   *
   * Muting an enclosure prevents it from emitting events towards the host.
   *
   * @param {string} enclosure - Enclosure to mute.
   * @returns {boolean} The previous muting status of the given enclosure.
   */
  const muteEnclosure = (enclosure) => {
    const enclosureObject = getEnclosure(enclosure);
    const result = enclosureObject.muted;
    enclosureObject.muted = true;
    return result;
  };

  /**
   * Unmute the given enclosure.
   *
   * @param {string} enclosure - Enclosure to unmute.
   * @returns {boolean} The previous muting status of the given enclosure.
   */
  const unmuteEnclosure = (enclosure) => {
    const enclosureObject = getEnclosure(enclosure);
    const result = enclosureObject.muted;
    enclosureObject.muted = false;
    return result;
  };

  /**
   * Retrieve a list of root enclosures.
   *
   * @returns {Array<string>} A list of root enclosures.
   */
  const listRootEnclosures = () => {
    return _Array
      .from(enclosures.keys())
      .filter((enclosure) => -1 === enclosure.indexOf('.'))
      .sort();
  };

  /**
   * Create a new tunnel with the given resolution and rejection callbacks for the given enclosure, returning the index of the created tunnel.
   *
   * @param {string} enclosure - Enclosure to use.
   * @param {Function} resolve - The resolution callback.
   * @param {Function} reject - The rejection callback.
   * @returns {number} The created tunnel's index.
   */
  const addTunnel = (enclosure, resolve, reject) => {
    const { port, tunnels: enclosureTunnels } = getEnclosure(enclosure);
    const tunnel = tunnels.push({ port, reject, resolve }) - 1;
    enclosureTunnels.add(tunnel);

    return tunnel;
  };

  /**
   * Remove the given tunnel and return its former resolution / rejection callbacks.
   *
   * @param {number} tunnel - The tunnel to remove.
   * @returns {{reject: Function, resolve: Function}} The resolution / rejection callbacks that used to be at the given index.
   * @throws {Error} if the given tunnel does not exist.
   */
  const removeTunnel = (tunnel) => {
    const theTunnel = tunnels[tunnel];
    if (undefined === theTunnel) {
      throw new _Error(`tunnel ${tunnel.toString()} does not exist`);
    }

    const { port, reject, resolve } = theTunnel;
    getEnclosure(enclosurePorts[port] ?? '').tunnels.delete(tunnel);

    return { reject, resolve };
  };

  /**
   * Resolve the given tunnel with the given arguments, removing the tunnel from the tunnels list.
   *
   * @param {number} tunnel - Tunnel to resolve.
   * @param {unknown} arg - Argument to pass on to the resolution callback.
   * @returns {void}
   */
  const resolveTunnel = (tunnel, arg) => {
    removeTunnel(tunnel).resolve(arg);
  };

  /**
   * Reject the given tunnel with the given error object, removing the tunnel from the tunnels list.
   *
   * @param {number} tunnel - Tunnel to reject.
   * @param {Error} error - {@link !Error} to pass on to the rejection callback.
   * @returns {void}
   */
  const rejectTunnel = (tunnel, error) => {
    removeTunnel(tunnel).reject(error);
  };

  /**
   * Validate that the given argument is indeed a {@link !Function}.
   *
   * @param {unknown} callback - The argument ot validate.
   * @returns {Function} The validated argument.
   * @throws {Error} if the given callback is not a {@link !Function} instance.
   */
  const validateCallback = (callback) => {
    if (!(callback instanceof _Function)) {
      throw new _Error('expected callback to be a function');
    }
    return callback;
  };

  /**
   * Cast the given event with the given arguments and trigger any matching listeners in the given enclosure.
   *
   * @param {string} enclosure - The enclosure to cast the given event on.
   * @param {string} event - The event name to cast.
   * @param {...unknown} args - Any additional arguments o associate to the cast event.
   * @returns {void}
   * @throws {Error} if the given event name is not a `string`.
   * @throws {Error} if the given event name fails regular expression validation.
   */
  const cast = (enclosure, event, ...args) => {
    const eventRegex = /^[.a-z0-9-]+(?::[.a-z0-9-]+)*$/i;

    if ('string' !== typeof event) {
      throw new _Error('event name must be a string');
    } else if (!eventRegex.test(event)) {
      throw new _Error(`event name must adhere to ${eventRegex.toString()}`);
    }

    const { linked } = getEnclosure(enclosure);

    const callbacks = new _Set();
    [enclosure, ...enclosurePrefixes(enclosure), ...enclosureSubEnclosures(enclosure), ...linked].forEach((target) => {
      for (const [callback, filters] of getEnclosure(target).listeners.entries()) {
        if (_Array.from(filters.values()).some((filter) => filter.test(event))) {
          callbacks.add(callback);
        }
      }
    });

    _Array.from(callbacks).forEach((callback) => {
      _setTimeout(() => {
        try {
          callback.call(undefined, event, ...args);
        } catch (e) {
          _dispatchEvent(
            new _ErrorEvent('error', {
              message:
                'object' === typeof e && null !== e && 'message' in e && 'string' === typeof e.message
                  ? e.message
                  : 'unknown error',
            }),
          );
        }
      }, 0);
    });
  };

  /**
   * Cast the given user event with the given arguments in the given enclosure and its linked enclosures; cast towards the host if not muted.
   *
   * @param {string} enclosure - Enclosure to use.
   * @param {string} event - Event name to cast.
   * @param {...unknown} args - Arguments to cast alongside the event.
   * @returns {void}
   */
  const castUser = (enclosure, event, ...args) => {
    cast(enclosure, event, ...args);

    if (!getEnclosure(enclosure).muted) {
      postEmitMessage(`${enclosure}:user:${event}`, args);
    }
  };

  /**
   * Cast the given host event with the given arguments in the given enclosure and its linked enclosures.
   *
   * @param {string} enclosure - Enclosure to use.
   * @param {string} event - Event name to cast.
   * @param {...unknown} args - Arguments to cast alongside the event.
   * @returns {void}
   */
  const castHost = (enclosure, event, ...args) => {
    cast(enclosure, `${enclosure}:user:${event}`, ...args);
  };

  /**
   * Remove the given callback from the listeners set in the given enclosure.
   *
   * @param {string} enclosure - Enclosure to use.
   * @param {Function} callback - The callback to remove.
   * @returns {void}
   * @throws {Error} if the given callback is not a {@link !Function} instance.
   */
  const off = (enclosure, callback) => {
    getEnclosure(enclosure).listeners.delete(validateCallback(callback));
  };

  /**
   * Attach the given callback to the event caster, triggered on events matching the given filter on the given enclosure.
   *
   * @param {string} enclosure - Enclosure to use.
   * @param {unknown} filter - Event name filter to assign the listener to.
   * @param {unknown} callback - Callback to call on a matching event being cast.
   * @returns {void}
   * @throws {Error} if the given callback is not a {@link !Function} instance.
   * @throws {Error} if the given event name filter is not a `string`.
   * @throws {Error} if the given event name filter fails regular expression validation.
   * @throws {Error} if the given event name filter contains an adjacent pair of `**` wildcards.
   */
  const on = (enclosure, filter, callback) => {
    const filterRegex = /^(?:\*\*?|[.a-z0-9-]+)(?::(?:\*\*?|[.a-z0-9-]+))*$/i;

    const _callback = validateCallback(callback);
    if ('string' !== typeof filter) {
      throw new _Error('event name filter must be a string');
    } else if (!filterRegex.test(filter)) {
      throw new _Error(`event name filter must adhere to ${filterRegex.toString()}`);
    } else if (-1 != filter.indexOf('**:**')) {
      throw new _Error('event name filter must not contain consecutive ** wildcards');
    }

    const listeners = getEnclosure(enclosure).listeners;
    let filters = listeners.get(_callback);
    if (undefined === filters) {
      filters = new _Set();
      listeners.set(_callback, filters);
    }
    filters.add(
      _RegExp(
        '^' +
          filter
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
      ),
    );
  };

  /**
   * Attach the given callback to the event caster, triggered on events matching the given filter on the given enclosure, and removed upon being called once.
   *
   * @param {string} enclosure - Enclosure to use.
   * @param {unknown} filter - Event name filter to assign the listener to.
   * @param {Function} callback - Callback to call on a matching event being cast.
   * @returns {void}
   * @throws {Error} if the given callback is not a {@link !Function} instance.
   */
  const once = (enclosure, filter, callback) => {
    /**
     * @description PLACEHOLDER.
     * @param {...unknown} args - Event arguments to forward.
     * @returns {void}
     */
    const wrapped = (...args) => {
      validateCallback(callback).call(undefined, ...args);
      off(enclosure, wrapped);
    };
    on(enclosure, filter, wrapped);
  };

  /**
   * Create a wrapped event caster for the given enclosure (that will survive the enclosure being merged).
   *
   * @param {string} enclosure - Enclosure to use.
   * @returns {{ on: Function, once: Function, off: Function, cast: Function }} The wrapped event caster created.
   */
  const eventCaster = (enclosure) => {
    const { port } = getEnclosure(enclosure);

    const eventCaster = _Object.create(null);
    /**
     * @description PLACEHOLDER.
     * @param {string} filter - Filter to use.
     * @param {EventCallback} callback - Event callback to use.
     * @returns {object} The event caster itself.
     */
    const __on = (filter, callback) => {
      on(enclosurePorts[port] ?? '', filter, callback);
      return eventCaster;
    };
    /**
     * @description PLACEHOLDER.
     * @param {string} filter - Filter to use.
     * @param {EventCallback} callback - Event callback to use.
     * @returns {object} The event caster itself.
     */
    const __once = (filter, callback) => {
      once(enclosurePorts[port] ?? '', filter, callback);
      return eventCaster;
    };
    /**
     * @description PLACEHOLDER.
     * @param {EventCallback} callback - Event callback to use.
     * @returns {object} The event caster itself.
     */
    const __off = (callback) => {
      off(enclosurePorts[port] ?? '', callback);
      return eventCaster;
    };
    /**
     * @description PLACEHOLDER.
     * @param {string} event - Event name to cast.
     * @param {...unknown} args - Additional arguments to associate.
     * @returns {object} The event caster itself.
     */
    const __cast = (event, ...args) => {
      castUser(enclosurePorts[port] ?? '', event, ...args);
      return eventCaster;
    };
    eventCaster.on = _Object.freeze(
      /**
       * @description PLACEHOLDER.
       * @param {string} filter - Filter to use.
       * @param {EventCallback} callback - Event callback to use.
       * @returns {object} The event caster itself.
       */
      (filter, callback) => __on(filter, callback),
    );
    eventCaster.once = _Object.freeze(
      /**
       * @description PLACEHOLDER.
       * @param {string} filter - Filter to use.
       * @param {EventCallback} callback - Event callback to use.
       * @returns {object} The event caster itself.
       */
      (filter, callback) => __once(filter, callback),
    );
    eventCaster.off = _Object.freeze(
      /**
       * @description PLACEHOLDER.
       * @param {EventCallback} callback - Event callback to use.
       * @returns {object} The event caster itself.
       */
      (callback) => __off(callback),
    );
    eventCaster.cast = _Object.freeze(
      /**
       * @description PLACEHOLDER.
       * @param {string} event - Event name to cast.
       * @param {...unknown} args - Additional arguments to associate.
       * @returns {object} The event caster itself.
       */
      (event, ...args) => __cast(event, ...args),
    );

    return _Object.freeze(eventCaster);
  };

  /**
   * Retrieve a list of installed dependencies on the given enclosure.
   *
   * @param {string} enclosure - Enclosure to use.
   * @returns {Array<string>} A list of installed dependencies.
   */
  const listInstalled = (enclosure) => {
    const result = [];
    for (const dep in getEnclosure(enclosure).dependencies) {
      result.push(dep);
    }
    return result.sort();
  };

  /**
   * Retrieve a list of enclosures the given one links to.
   *
   * @param {string} enclosure - Enclosure to use.
   * @returns {Array<string>} A list of enclosures linked to by the given one.
   */
  const listLinksTo = (enclosure) => {
    return _Array.from(getEnclosure(enclosure).linked).sort();
  };

  /**
   * Retrieve a list of enclosures that link to the given one.
   *
   * @param {string} enclosure - Enclosure to use.
   * @returns {Array<string>} A list of enclosures linking to the given one.
   */
  const listLinkedFrom = (enclosure) => {
    getEnclosure(enclosure);
    return _Array
      .from(enclosures.entries())
      .filter(([, { linked }]) => linked.has(enclosure))
      .map(([name]) => name);
  };

  /**
   * Determine whether the given enclosure is muted or not.
   *
   * @param {string} enclosure - Enclosure to use.
   * @returns {boolean} Whether the given enclosure is muted or not.
   */
  const isMuted = (enclosure) => {
    return getEnclosure(enclosure).muted;
  };

  // ----------------------------------------------------------------------------------------------
  // -- Dependency Management ---------------------------------------------------------------------
  // ----------------------------------------------------------------------------------------------

  /**
   * Execute the given dependency in the given enclosure passing in the given arguments map in a secure context and return its result.
   *
   * The dependency code will be executed with access to each dependency name mapped to the installed dependency's value.
   * Additionally, every value in the dependency map will be exposed as a variable.
   * Furthermore, the dependency is execute in the global context, in strict mode.
   *
   * @param {string} enclosure - Enclosure to use.
   * @param {DependencyObject} dependency - Dependency to execute.
   * @param {Map<string, unknown>} args - Arguments map to use.
   * @returns {unknown} The result of executing the given dependency.
   * @throws {Error} if there are any missing dependencies.
   * @throws {Error} if any argument would shadow an imported dependency.
   */
  const executeDependency = (enclosure, dependency, args) => {
    const { dependencies } = getEnclosure(enclosure);
    const importedNames = _Object.keys(dependency.dependencies);
    {
      if (IMPORT_LIMIT < importedNames.length) {
        throw new _Error(`too many imports 1024 < ${importedNames.length.toString()}`);
      }
      const missing = importedNames.filter((name) => !((dependency.dependencies[name] ?? '') in dependencies));
      if (0 !== missing.length) {
        throw new _Error(
          `missing dependencies: [${_Array.from(new _Set(missing.map((name) => dependency.dependencies[name]))).join(', ')}]`,
        );
      }
      const aliased = importedNames.filter((name) => name in _this);
      if (0 !== aliased.length) {
        throw new _Error(`aliased dependencies: [${_Array.from(new _Set(aliased)).join(', ')}]`);
      }
    }
    const argumentNames = _Array.from(args.keys());
    {
      if (ARGUMENTS_LIMIT < argumentNames.length) {
        throw new _Error(`too many arguments 1024 < ${argumentNames.length.toString()}`);
      }
      const shadowed = argumentNames.filter((name) => name in dependency.dependencies);
      if (0 < shadowed.length) {
        throw new _Error(`shadowing arguments [${_Array.from(new _Set(shadowed)).sort().join(', ')}]`);
      }
    }

    // ref: https://stackoverflow.com/a/34523915
    return new _Function(
      EVENT_CASTER_NAME,
      ...importedNames,
      ...argumentNames,
      //
      `"use strict";
if(true) {
  ${dependency.code.toString()};
}
return null;`,
    ).call(
      undefined,
      eventCaster(enclosure),
      ...importedNames.map((importedName) => dependencies[dependency.dependencies[importedName] ?? '']),
      ...argumentNames.map((argumentName) => args.get(argumentName)),
    );
  };

  /**
   * Install the given dependency in the given enclosure by executing in a secure context and caching its result.
   *
   * @param {string} enclosure - Enclosure to use.
   * @param {DependencyObject} dependency - Dependency to execute.
   * @returns {void}
   * @throws {Error} if there are any missing dependencies.
   */
  const installDependency = (enclosure, dependency) => {
    const { dependencies } = getEnclosure(enclosure);
    if (dependency.name in dependencies) {
      throw new _Error(`duplicate dependency ${dependency.name.toString()}`);
    }
    const result = executeDependency(enclosure, dependency, new _Map());
    dependencies[dependency.name] = 'object' === typeof result ? _Object.freeze(result) : result;
  };

  /**
   * Declare the given function index as a predefined function under the given name in the given enclosure.
   *
   * @param {string} enclosure - Enclosure to use.
   * @param {number} idx - Function index to use for execution.
   * @param {string} name - Function name to use for registration.
   * @returns {void}
   * @throws {Error} if the given name is already in use.
   */
  const addPredefined = (enclosure, idx, name) => {
    const { dependencies, port } = getEnclosure(enclosure);
    if (name in dependencies) {
      throw new _Error(`duplicate dependency ${name}`);
    }
    const __predefined = _Object.freeze(
      /**
       * @description PLACEHOLDER.
       * @param {...unknown} args - Arguments to use.
       * @returns {Promise<unknown>} The execution result.
       */
      (...args) =>
        new _Promise((resolve, reject) => {
          postCallMessage(enclosurePorts[port] ?? '', addTunnel(enclosure, resolve, reject), idx, args);
        }),
    );
    /**
     * @description PLACEHOLDER.
     * @param {...unknown} args - Arguments to use.
     * @returns {Promise<unknown>} The execution result.
     */
    dependencies[name] = (...args) => __predefined(...args);
  };

  // ----------------------------------------------------------------------------------------------
  // -- Boot Sequence -----------------------------------------------------------------------------
  // ----------------------------------------------------------------------------------------------

  /**
   * Retrieve the error message associated to the given argument.
   *
   * @param {any} e - Error to retrieve the message of.
   * @returns {string} The error message to use.
   */
  const getErrorMessage = (e) => (e instanceof _Error ? e.message : 'unknown error');

  try {
    // --------------------------------------------------------------------------------------------
    // -- Worker Steps ----------------------------------------------------------------------------
    // --------------------------------------------------------------------------------------------

    // -- Shimming --------------------------------------------------------------------------------

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

    // -- Pruning ---------------------------------------------------------------------------------

    {
      /**
       * Whitelist of properties to keep in the global context.
       *
       * @type {{[key: string]: (string | symbol)[]}}
       */
      const keep = _Object.create(null);
      /* eslint-disable sonarjs/no-duplicate-string */
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
      keep['Function.prototype'] = [
        ...keep['Object.prototype'],
        // "arguments", // Deprecated
        // "caller", // Deprecated
        'apply',
        'bind',
        'call',
        Symbol.hasInstance,
      ];
      keep['Function.instance'] = [...keep['Function.prototype'], 'length', 'name'];
      keep['Object'] = [
        ...keep['Function.instance'],
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
      ];
      keep['Boolean.prototype'] = keep['Object.prototype'];
      keep['Symbol'] = [
        ...keep['Function.instance'],
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
      ];
      keep['Symbol.prototype'] = [...keep['Object.prototype'], 'description', _Symbol.toPrimitive, _Symbol.toStringTag];
      keep['Error'] = [...keep['Function.instance'], 'prototype'];
      keep['Error.prototype'] = [...keep['Object.prototype'], 'name'];
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
      keep['Number'] = [
        ...keep['Function.instance'],
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
      ];
      keep['Number.prototype'] = [
        ...keep['Object.prototype'],
        'toExponential',
        'toFixed',
        'toPrecision',
        // "toLocaleString", // ---> Number.prototype.toString
      ];
      keep['BigInt'] = [...keep['Function.instance'], 'prototype', 'asIntN', 'asUintN'];
      keep['BigInt.prototype'] = [
        ...keep['Object.prototype'],
        _Symbol.toStringTag,
        // "toLocaleString", // ---> BigInt.prototype.toString
      ];
      keep['Math'] = [
        'E',
        'LN10',
        'LN2',
        'LOG10E',
        'LOG2E',
        'PI',
        'SQRT1_2',
        'SQRT2',
        _Symbol.toStringTag,
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
      keep['Date'] = [
        ...keep['Function.instance'],
        'prototype',
        // "now", // ---> () => NaN
        'parse',
        'UTC',
      ];
      keep['Date.prototype'] = [
        ...keep['Object.prototype'],
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
        _Symbol.toPrimitive,
      ];
      keep['String'] = [...keep['Function.instance'], 'prototype', 'fromCharCode', 'fromCodePoint', 'raw'];
      keep['String.prototype'] = [
        ...keep['Object.prototype'],
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
        _Symbol.iterator,
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
      ];
      keep['RegExp'] = [
        ...keep['Function.instance'],
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
        _Symbol.species,
      ];
      keep['RegExp.prototype'] = [
        ...keep['Object.prototype'],
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
        _Symbol.match,
        _Symbol.matchAll,
        _Symbol.replace,
        _Symbol.split,
        _Symbol.search,
      ];
      keep['Array'] = [
        ...keep['Function.instance'],
        'prototype',
        _Symbol.species,
        'from',
        'fromAsync',
        'isArray',
        'of',
      ];
      keep['Array.prototype'] = [
        ...keep['Object.prototype'],
        _Symbol.unscopables,
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
        _Symbol.iterator,
      ];
      keep['TypedArray'] = [
        ...keep['Function.instance'],
        'prototype',
        _Symbol.species,
        'BYTES_PER_ELEMENT',
        'from',
        'of',
      ];
      keep['TypedArray.prototype'] = [
        ...keep['Object.prototype'],
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
        _Symbol.toStringTag,
        // "toLocaleString", // ---> TypedArray.prototype.toString
        'toReversed',
        'toSorted',
        'with',
        _Symbol.iterator,
      ];
      keep['Map'] = [...keep['Function.instance'], 'prototype', _Symbol.species, 'groupBy'];
      keep['Map.prototype'] = [
        ...keep['Object.prototype'],
        'size',
        _Symbol.toStringTag,
        'delete',
        'get',
        'has',
        'set',
        'entries',
        'keys',
        'values',
        'clear',
        'forEach',
        _Symbol.iterator,
      ];
      keep['Set'] = [...keep['Function.instance'], 'prototype', _Symbol.species];
      keep['Set.prototype'] = [
        ...keep['Object.prototype'],
        'size',
        _Symbol.toStringTag,
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
        _Symbol.iterator,
      ];
      keep['WeakMap'] = [...keep['Function.instance'], 'prototype', _Symbol.toStringTag];
      keep['WeakMap.prototype'] = [...keep['Object.prototype'], 'delete', 'get', 'has', 'set'];
      keep['WeakSet'] = [...keep['Function.instance'], 'prototype', _Symbol.toStringTag];
      keep['WeakSet.prototype'] = [...keep['Object.prototype'], 'add', 'delete', 'has'];
      keep['ArrayBuffer'] = [...keep['Function.instance'], 'prototype', _Symbol.species, 'isView'];
      keep['ArrayBuffer.prototype'] = [
        ...keep['Object.prototype'],
        'byteLength',
        'maxByteLength',
        'detached',
        'resizable',
        _Symbol.toStringTag,
        'resize',
        'slice',
        'transfer',
        'transferToFixedLength',
      ];
      keep['DataView'] = [...keep['Function.instance'], 'prototype'];
      keep['DataView.prototype'] = [
        ...keep['Object.prototype'],
        'buffer',
        'byteLength',
        'byteOffset',
        _Symbol.toStringTag,
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
      ];
      keep['Atomics'] = [
        _Symbol.toStringTag,
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
      keep['JSON'] = [_Symbol.toStringTag, 'parse', 'stringify'];
      keep['WeakRef'] = [...keep['Function.instance'], 'prototype'];
      keep['WeakRef.prototype'] = [...keep['Object.prototype'], 'deref', _Symbol.toStringTag];
      keep['FinalizationRegistry'] = [...keep['Function.instance'], 'prototype'];
      keep['FinalizationRegistry.prototype'] = [
        ...keep['Object.prototype'],
        _Symbol.toStringTag,
        'register',
        'unregister',
      ];
      keep['Promise'] = [
        ...keep['Function.instance'],
        'prototype',
        _Symbol.species,
        'all',
        'allSettled',
        'any',
        'race',
        'reject',
        'resolve',
        'withResolvers',
      ];
      keep['Promise.prototype'] = [...keep['Object.prototype'], _Symbol.toStringTag, 'catch', 'finally', 'then'];
      keep['GeneratorFunction'] = [...keep['Function.instance'], 'prototype'];
      keep['GeneratorFunction.prototype'] = [...keep['Function.prototype'], 'prototype', _Symbol.toStringTag];
      keep['AsyncGeneratorFunction'] = [...keep['Function.instance'], 'prototype'];
      keep['AsyncGeneratorFunction.prototype'] = [...keep['Function.prototype'], 'prototype', _Symbol.toStringTag];
      keep['AsyncFunction'] = [...keep['Function.instance'], 'prototype'];
      keep['AsyncFunction.prototype'] = [...keep['Function.prototype'], 'prototype', _Symbol.toStringTag];
      keep['Proxy'] = [...keep['Function.instance'], 'revocable'];
      keep['Reflect'] = [
        _Symbol.toStringTag,
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
      /* eslint-enable sonarjs/no-duplicate-string */

      /**
       * @type {string[]}
       */
      const failed = [];

      /**
       * Prune the given object and its ancestry so that only the mentioned properties are kept.
       *
       * NOTE: errors on deletion are ignored.
       *
       * @param {{[key: (string | symbol)]: unknown}} start - Object to start the pruning from.
       * @param {string} name - Name to use for failure reporting.
       * @param {string} toKeep - Label of properties to keep.
       * @returns {void}
       */
      const prune = (start, name, toKeep) => {
        let current = start;
        do {
          [..._Object.getOwnPropertyNames(current), ..._Object.getOwnPropertySymbols(current)].forEach((key) => {
            if (!keep[toKeep]?.includes(key)) {
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

      prune(_this, 'this', 'this');
      prune(_this.Object, 'this.Object', 'Object');
      prune(_this.Object.prototype, 'this.Object.prototype', 'Object.prototype');
      prune(_this.Function.prototype, 'this.Function.prototype', 'Function.prototype');
      prune(_this.Boolean.prototype, 'this.Boolean.prototype', 'Boolean.prototype');
      prune(_this.Symbol, 'this.Symbol', 'Symbol');
      prune(_this.Symbol.prototype, 'this.Symbol.prototype', 'Symbol.prototype');
      prune(_this.Error, 'this.Error', 'Error');
      prune(_this.Error.prototype, 'this.Error.prototype', 'Error.prototype');
      prune(_this.AggregateError, 'this.AggregateError', 'AggregateError');
      prune(_this.AggregateError.prototype, 'this.AggregateError.prototype', 'AggregateError.prototype');
      prune(_this.EvalError, 'this.EvalError', 'EvalError');
      prune(_this.EvalError.prototype, 'this.EvalError.prototype', 'EvalError.prototype');
      prune(_this.RangeError, 'this.RangeError', 'RangeError');
      prune(_this.RangeError.prototype, 'this.RangeError.prototype', 'RangeError.prototype');
      prune(_this.ReferenceError, 'this.ReferenceError', 'ReferenceError');
      prune(_this.ReferenceError.prototype, 'this.ReferenceError.prototype', 'ReferenceError.prototype');
      prune(_this.SyntaxError, 'this.SyntaxError', 'SyntaxError');
      prune(_this.SyntaxError.prototype, 'this.SyntaxError.prototype', 'SyntaxError.prototype');
      prune(_this.TypeError, 'this.TypeError', 'TypeError');
      prune(_this.TypeError.prototype, 'this.TypeError.prototype', 'TypeError.prototype');
      prune(_this.URIError, 'this.URIError', 'URIError');
      prune(_this.URIError.prototype, 'this.URIError.prototype', 'URIError.prototype');
      prune(_this.Number, 'this.Number', 'Number');
      prune(_this.Number.prototype, 'this.Number.prototype', 'Number.prototype');
      prune(_this.BigInt, 'this.BigInt', 'BigInt');
      prune(_this.BigInt.prototype, 'this.BigInt.prototype', 'BigInt.prototype');
      prune(_this.Math, 'this.Math', 'Math');
      prune(_this.Date, 'this.Date', 'Date');
      prune(_this.Date.prototype, 'this.Date.prototype', 'Date.prototype');
      prune(_this.String, 'this.String', 'String');
      prune(_this.String.prototype, 'this.String.prototype', 'String.prototype');
      prune(_this.RegExp, 'this.RegExp', 'RegExp');
      prune(_this.RegExp.prototype, 'this.RegExp.prototype', 'RegExp.prototype');
      prune(_this.Array, 'this.Array', 'Array');
      prune(_this.Array.prototype, 'this.Array.prototype', 'Array.prototype');
      prune(_this.Int8Array, 'this.Int8Array', 'TypedArray');
      prune(_this.Int8Array.prototype, 'this.Int8Array.prototype', 'TypedArray.prototype');
      prune(_this.Uint8Array, 'this.Uint8Array', 'TypedArray');
      prune(_this.Uint8Array.prototype, 'this.Uint8Array.prototype', 'TypedArray.prototype');
      prune(_this.Uint8ClampedArray, 'this.Uint8ClampedArray', 'TypedArray');
      prune(_this.Uint8ClampedArray.prototype, 'this.Uint8ClampedArray.prototype', 'TypedArray.prototype');
      prune(_this.Int16Array, 'this.Int16Array', 'TypedArray');
      prune(_this.Int16Array.prototype, 'this.Int16Array.prototype', 'TypedArray.prototype');
      prune(_this.Uint16Array, 'this.Uint16Array', 'TypedArray');
      prune(_this.Uint16Array.prototype, 'this.Uint16Array.prototype', 'TypedArray.prototype');
      prune(_this.Int32Array, 'this.Int32Array', 'TypedArray');
      prune(_this.Int32Array.prototype, 'this.Int32Array.prototype', 'TypedArray.prototype');
      prune(_this.Uint32Array, 'this.Uint32Array', 'TypedArray');
      prune(_this.Uint32Array.prototype, 'this.Uint32Array.prototype', 'TypedArray.prototype');
      prune(_this.BigInt64Array, 'this.BigInt64Array', 'TypedArray');
      prune(_this.BigInt64Array.prototype, 'this.BigInt64Array.prototype', 'TypedArray.prototype');
      prune(_this.BigUint64Array, 'this.BigUint64Array', 'TypedArray');
      prune(_this.BigUint64Array.prototype, 'this.BigUint64Array.prototype', 'TypedArray.prototype');
      prune(_this.Float32Array, 'this.Float32Array', 'TypedArray');
      prune(_this.Float32Array.prototype, 'this.Float32Array.prototype', 'TypedArray.prototype');
      prune(_this.Float64Array, 'this.Float64Array', 'TypedArray');
      prune(_this.Float64Array.prototype, 'this.Float64Array.prototype', 'TypedArray.prototype');
      prune(_this.Map, 'this.Map', 'Map');
      prune(_this.Map.prototype, 'this.Map.prototype', 'Map.prototype');
      prune(_this.Set, 'this.Set', 'Set');
      prune(_this.Set.prototype, 'this.Set.prototype', 'Set.prototype');
      prune(_this.WeakMap, 'this.WeakMap', 'WeakMap');
      prune(_this.WeakMap.prototype, 'this.WeakMap.prototype', 'WeakMap.prototype');
      prune(_this.WeakSet, 'this.WeakSet', 'WeakSet');
      prune(_this.WeakSet.prototype, 'this.WeakSet.prototype', 'WeakSet.prototype');
      prune(_this.ArrayBuffer, 'this.ArrayBuffer', 'ArrayBuffer');
      prune(_this.ArrayBuffer.prototype, 'this.ArrayBuffer.prototype', 'ArrayBuffer.prototype');
      prune(_this.DataView, 'this.DataView', 'DataView');
      prune(_this.DataView.prototype, 'this.DataView.prototype', 'DataView.prototype');
      prune(_this.Atomics, 'this.Atomics', 'Atomics');
      prune(_this.JSON, 'this.JSON', 'JSON');
      prune(_this.WeakRef, 'this.WeakRef', 'WeakRef');
      prune(_this.WeakRef.prototype, 'this.WeakRef.prototype', 'WeakRef.prototype');
      prune(_this.FinalizationRegistry, 'this.FinalizationRegistry', 'FinalizationRegistry');
      prune(
        _this.FinalizationRegistry.prototype,
        'this.FinalizationRegistry.prototype',
        'FinalizationRegistry.prototype',
      );
      prune(_this.Promise, 'this.Promise', 'Promise');
      prune(_this.Promise.prototype, 'this.Promise.prototype', 'Promise.prototype');
      prune(_this.GeneratorFunction.constructor, 'this.GeneratorFunction.constructor', 'GeneratorFunction');
      prune(
        _this.GeneratorFunction.constructor.prototype,
        'this.GeneratorFunction.constructor.prototype',
        'GeneratorFunction.prototype',
      );
      prune(
        _this.AsyncGeneratorFunction.constructor,
        'this.AsyncGeneratorFunction.constructor',
        'AsyncGeneratorFunction',
      );
      prune(
        _this.AsyncGeneratorFunction.constructor.prototype,
        'this.AsyncGeneratorFunction.constructor.prototype',
        'AsyncGeneratorFunction.prototype',
      );
      prune(_this.AsyncFunction.constructor, 'this.AsyncFunction.constructor', 'AsyncFunction');
      prune(
        _this.AsyncFunction.constructor.prototype,
        'this.AsyncFunction.constructor.prototype',
        'AsyncFunction.prototype',
      );
      prune(_this.Proxy, 'this.Proxy', 'Proxy');
      prune(_this.Reflect, 'this.Reflect', 'Reflect');

      if (0 < failed.length) {
        postEmitMessage(`worker:warning`, [`failed to prune [${failed.join(', ')}]`]);
      }
    }

    // -- Patching --------------------------------------------------------------------------------

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

    // -- Deep Freezing ---------------------------------------------------------------------------

    deepFreezeThis();

    // --------------------------------------------------------------------------------------------
    // -- Create Default Enclosure ----------------------------------------------------------------
    // --------------------------------------------------------------------------------------------

    addEnclosure(_defaultEnclosureName);

    // --------------------------------------------------------------------------------------------
    // -- Worker Event Listeners ------------------------------------------------------------------
    // --------------------------------------------------------------------------------------------

    _listen((parsedData) => {
      //const parsedData = _JSON.parse(data);
      const { name } = parsedData;
      switch (name) {
        case 'ping':
          postPongMessage();
          break;
        case 'resolve':
          {
            const { payload, tunnel } = parsedData;
            resolveTunnel(tunnel, payload);
          }
          break;
        case 'reject':
          {
            const { error, tunnel } = parsedData;
            rejectTunnel(tunnel, new _Error(error));
          }
          break;
        case 'emit':
          {
            const { args, enclosure, event } = parsedData;
            castHost(enclosure, event, args);
          }
          break;
        case 'install':
          {
            const { dependency, enclosure, tunnel } = parsedData;
            try {
              installDependency(enclosure, dependency);
              postResolveMessage(tunnel, undefined);
            } catch (e) {
              postRejectMessage(tunnel, getErrorMessage(e));
            }
          }
          break;
        case 'execute':
          {
            const { args, dependency, enclosure, tunnel } = parsedData;
            try {
              postResolveMessage(tunnel, executeDependency(enclosure, dependency, new _Map(_Object.entries(args))));
            } catch (e) {
              postRejectMessage(tunnel, getErrorMessage(e));
            }
          }
          break;
        case 'predefine':
          {
            const { enclosure, function: fName, idx, tunnel } = parsedData;
            try {
              addPredefined(enclosure, idx, fName);
              postResolveMessage(tunnel, undefined);
            } catch (e) {
              postRejectMessage(tunnel, getErrorMessage(e));
            }
          }
          break;
        case 'create':
          {
            const { enclosure, tunnel } = parsedData;
            try {
              addEnclosure(enclosure);
              postResolveMessage(tunnel, undefined);
            } catch (e) {
              postRejectMessage(tunnel, getErrorMessage(e));
            }
          }
          break;
        case 'delete':
          {
            const { enclosure, tunnel } = parsedData;
            try {
              postResolveMessage(tunnel, removeEnclosure(enclosure));
            } catch (e) {
              postRejectMessage(tunnel, getErrorMessage(e));
            }
          }
          break;
        case 'merge':
          {
            const { enclosure, tunnel } = parsedData;
            try {
              mergeEnclosure(enclosure);
              postResolveMessage(tunnel, undefined);
            } catch (e) {
              postRejectMessage(tunnel, getErrorMessage(e));
            }
          }
          break;
        case 'link':
          {
            const { enclosure, target, tunnel } = parsedData;
            try {
              postResolveMessage(tunnel, linkEnclosure(enclosure, target));
            } catch (e) {
              postRejectMessage(tunnel, getErrorMessage(e));
            }
          }
          break;
        case 'unlink':
          {
            const { enclosure, target, tunnel } = parsedData;
            try {
              postResolveMessage(tunnel, unlinkEnclosure(enclosure, target));
            } catch (e) {
              postRejectMessage(tunnel, getErrorMessage(e));
            }
          }
          break;
        case 'mute':
          {
            const { enclosure, tunnel } = parsedData;
            try {
              postResolveMessage(tunnel, muteEnclosure(enclosure));
            } catch (e) {
              postRejectMessage(tunnel, getErrorMessage(e));
            }
          }
          break;
        case 'unmute':
          {
            const { enclosure, tunnel } = parsedData;
            try {
              postResolveMessage(tunnel, unmuteEnclosure(enclosure));
            } catch (e) {
              postRejectMessage(tunnel, getErrorMessage(e));
            }
          }
          break;
        case 'listRootEnclosures':
          {
            const { tunnel } = parsedData;
            try {
              postResolveMessage(tunnel, listRootEnclosures());
            } catch (e) {
              postRejectMessage(tunnel, getErrorMessage(e));
            }
          }
          break;
        case 'listInstalled':
          {
            const { enclosure, tunnel } = parsedData;
            try {
              postResolveMessage(tunnel, listInstalled(enclosure));
            } catch (e) {
              postRejectMessage(tunnel, getErrorMessage(e));
            }
          }
          break;
        case 'listLinksTo':
          {
            const { enclosure, tunnel } = parsedData;
            try {
              postResolveMessage(tunnel, listLinksTo(enclosure));
            } catch (e) {
              postRejectMessage(tunnel, getErrorMessage(e));
            }
          }
          break;
        case 'listLinkedFrom':
          {
            const { enclosure, tunnel } = parsedData;
            try {
              postResolveMessage(tunnel, listLinkedFrom(enclosure));
            } catch (e) {
              postRejectMessage(tunnel, getErrorMessage(e));
            }
          }
          break;
        case 'isMuted':
          {
            const { enclosure, tunnel } = parsedData;
            try {
              postResolveMessage(tunnel, isMuted(enclosure));
            } catch (e) {
              postRejectMessage(tunnel, getErrorMessage(e));
            }
          }
          break;
        case 'getSubEnclosures':
          {
            const { depth, enclosure, tunnel } = parsedData;
            try {
              postResolveMessage(tunnel, enclosureSubEnclosures(enclosure, depth));
            } catch (e) {
              postRejectMessage(tunnel, getErrorMessage(e));
            }
          }
          break;
        default: {
          const { name, tunnel } = parsedData;
          if (undefined !== tunnel && 'string' === typeof name) {
            postRejectMessage(tunnel, `unknown event name ${name}`);
          } else {
            throw new _Error(`unknown event name`);
          }
        }
      }
    });

    // --------------------------------------------------------------------------------------------
    // -- Signal Boot-Up Complete -----------------------------------------------------------------
    // --------------------------------------------------------------------------------------------

    postResolveMessage(_bootTunnel, _Date_now() - STARTUP);
  } catch (e) {
    postRejectMessage(_bootTunnel, getErrorMessage(e));
  }
};

module.exports = workerRunner;
