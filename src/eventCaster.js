'use strict';

import { Validation } from './validation.js';

/* global MethodInjector */

/**
 * Glob-enabled Event Caster.
 *
 * This event caster allows listeners to be attached to "glob" expressions.
 * All event names must adhere to the following ABNF:
 *
 * ```abnf
 * segment = 1*( "." / ALPHA / DIGIT / "-" )
 * event-name = segment *( ":" segment )
 * ```
 * .
 *
 * An event name filter may use the following wildcards in lieu of a segment, with the restriction that no two consecutive filter segment may contain a "**" wildcard.
 * Their expected meanings are as follows:
 *
 * - `*`: matches any single `segment`, cannot be empty.
 * - `**`: matches zero or more `segment`s, may be empty.
 *
 * This yields the following ABNF for a filter proper:
 *
 * ```abnf
 * filter = ( ( segment / "*" ) [ ":" filter ] / "**" [ ":" segment [ ":" filter ] ] )
 * ```
 *
 */
class EventCaster {
  /**
   * Regular expression all event names must adhere to.
   *
   * All event names must adhere to the following ABNF:
   *
   * ```abnf
   * segment = 1*( "." / ALPHA / DIGIT / "-" )
   * event-name = segment *( ":" segment )
   * ```
   *
   * @type {RegExp}
   * @private
   */
  static #eventRegex = /^[.a-z0-9-]+(?::[.a-z0-9-]+)*$/i;

  /**
   * Validate the given event name and return it if valid.
   *
   * @param {unknown} name - The event name to validate.
   * @returns {string} The validated event name.
   * @throws {Error} If the given event name is not a `string`.
   * @throws {Error} If the given event name fails regular expression validation.
   */
  static validateEvent(name) {
    if ('string' !== typeof name) {
      throw new Error('event name must be a string');
    } else if (!EventCaster.#eventRegex.test(name)) {
      throw new Error(`event name must adhere to ${EventCaster.#eventRegex}`);
    }

    return name;
  }

  /**
   * Regular expression all event name filters must adhere to.
   *
   * All event name filters must adhere to the following ABNF:
   *
   * ```abnf
   * filter-segment = "*" / "**" / 1*( "." / ALPHA / DIGIT / "-" )
   * filter = filter-segment *( ":" filter-segment )
   * ```
   *
   * @type {RegExp}
   * @private
   */
  static #filterRegex = /^(?:\*\*?|[.a-z0-9-]+)(?::(?:\*\*?|[.a-z0-9-]+))*$/i;

  /**
   * Validate the given event name filter and return it if valid.
   *
   * @param {unknown} filter - The event name filter to validate.
   * @returns {string} The validated event name filter.
   * @throws {Error} If the given event name filter is not a `string`.
   * @throws {Error} If the given event name filter fails regular expression validation.
   * @throws {Error} If the given event name filter contains an adjacent pair of `**` wildcards.
   */
  static validateFilter(filter) {
    if ('string' !== typeof filter) {
      throw new Error('event name filter must be a string');
    } else if (!EventCaster.#filterRegex.test(filter)) {
      throw new Error(`event name filter must adhere to ${EventCaster.#filterRegex}`);
    } else if (-1 != filter.indexOf('**:**')) {
      throw new Error('event name filter must not contain consecutive ** wildcards');
    }

    return filter;
  }

  /**
   * Turn an event name filter into a filtering {@link RegExp}.
   *
   * @param {unknown} filter - The event name filter to transform.
   * @returns {RegExp} The transformed event name filter.
   * @private
   * @see {@link EventCaster.validateFilter} for additional exceptions thrown.
   */
  static #filterToRegExp(filter) {
    return new RegExp(
      '^' +
        EventCaster.validateFilter(filter)
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

  static {
    // ref: https://stackoverflow.com/a/77741904
    Object.setPrototypeOf(this.prototype, null);
  }

  /**
   * The event listener map.
   *
   * This map will map an event listener to a set of event name regular expressions.
   *
   * @type {Map.<Function,Set.<RegExp>>}
   * @private
   */
  #listeners = new Map();

  /**
   * Build a new {@link EventCaster}, receiving a callback to inject the "protected" methods map.
   *
   * Passing a callback to inject the "protected" methods map into allows for derived classes to have access to these whilst preventing access to outside agents.
   *
   * @param {MethodInjector} protectedMethodInjector - Callback that will receive the "protected" methods map.
   */
  constructor(protectedMethodInjector) {
    if (!(protectedMethodInjector instanceof Function)) {
      throw new Error('expected instance of Function');
    }
    const protectedMethods = new Map();
    protectedMethods.set('cast', (...args) => this.#cast(...args));
    protectedMethodInjector(protectedMethods);
  }

  /**
   * Attach the given callback to the event caster, triggered on events matching the given filter.
   *
   * @param {unknown} filter - Event name filter to assign the listener to.
   * @param {unknown} callback - Callback to call on a matching event being cast.
   * @returns {EventCaster} `this`, for chaining.
   * @see {@link EventCaster.#filterToRegExp} for additional exceptions thrown.
   * @see {@link Validation.callback} for additional exceptions thrown.
   */
  on(filter, callback) {
    if (!this.#listeners.has(Validation.callback(callback))) {
      this.#listeners.set(callback, new Set());
    }
    this.#listeners.get(callback).add(EventCaster.#filterToRegExp(filter));

    return this;
  }

  /**
   * Attach the given callback to the event caster, triggered on events matching the given filter, and removed upon being called once.
   *
   * @param {unknown} filter - Event name filter to assign the listener to.
   * @param {unknown} callback - Callback to call on a matching event being cast.
   * @returns {EventCaster} `this`, for chaining.
   * @see {@link EventCaster.on} for additional exceptions thrown.
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
   * @returns {EventCaster} `this`, for chaining.
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
   * @returns {EventCaster} `this`, for chaining.
   * @protected
   * @see {@link EventCaster.validateEvent} for additional exceptions thrown.
   */
  #cast(name, ...args) {
    EventCaster.validateEvent(name);

    for (let [callback, filters] of this.#listeners.entries()) {
      if ([...filters.values()].some((filter) => filter.test(name))) {
        setTimeout(callback.apply(undefined, [name, ...args]));
      }
    }

    return this;
  }
}

/* exported EventCaster */

export { EventCaster };
