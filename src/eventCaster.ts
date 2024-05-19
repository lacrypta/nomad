'use strict';

/**
 * The type of a method injector.
 *
 */
type MethodInjector<T> = (entries: { [Method in keyof T]: T[Method] }) => void;

/**
 * The type of an event callback.
 *
 */
type EventCallback = (name: string, ...args: unknown[]) => unknown;

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
   */
  static #eventRegex: RegExp = /^[.a-z0-9-]+(?::[.a-z0-9-]+)*$/i;

  /**
   * Validate the given event name and return it if valid.
   *
   * @param name - The event name to validate.
   * @returns The validated event name.
   * @throws {Error} If the given event name fails regular expression validation.
   */
  static validateEvent(name: string): string {
    if (!EventCaster.#eventRegex.test(name)) {
      throw new Error(`event name must adhere to ${EventCaster.#eventRegex.toString()}`);
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
   */
  static #filterRegex: RegExp = /^(?:\*\*?|[.a-z0-9-]+)(?::(?:\*\*?|[.a-z0-9-]+))*$/i;

  /**
   * Validate the given event name filter and return it if valid.
   *
   * @param filter - The event name filter to validate.
   * @returns The validated event name filter.
   * @throws {Error} If the given event name filter fails regular expression validation.
   * @throws {Error} If the given event name filter contains an adjacent pair of `**` wildcards.
   */
  static validateFilter(filter: string): string {
    if (!EventCaster.#filterRegex.test(filter)) {
      throw new Error(`event name filter must adhere to ${EventCaster.#filterRegex.toString()}`);
    } else if (-1 != filter.indexOf('**:**')) {
      throw new Error('event name filter must not contain consecutive ** wildcards');
    }

    return filter;
  }

  /**
   * Turn an event name filter into a filtering {@link RegExp}.
   *
   * @param filter - The event name filter to transform.
   * @returns The transformed event name filter.
   * @see {@link EventCaster.validateFilter} for additional exceptions thrown.
   */
  static #filterToRegExp(filter: string): RegExp {
    return new RegExp(
      '^' +
        EventCaster.validateFilter(filter)
          .split(':')
          .map((part: string): string => {
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
   */
  #listeners: Map<EventCallback, Set<RegExp>> = new Map<EventCallback, Set<RegExp>>();

  /**
   * Build a new {@link EventCaster}, receiving a callback to inject the "protected" methods map.
   *
   * Passing a callback to inject the "protected" methods map into allows for derived classes to have access to these whilst preventing access to outside agents.
   *
   * @param protectedMethodInjector - Callback that will receive the "protected" methods map.
   */
  constructor(
    protectedMethodInjector: MethodInjector<{
      cast: Cast;
    }>,
  ) {
    protectedMethodInjector({
      cast: (name: string, ...args: unknown[]): this => this.#cast(name, ...args),
    });
  }

  /**
   * Attach the given callback to the event caster, triggered on events matching the given filter.
   *
   * @param filter - Event name filter to assign the listener to.
   * @param callback - Callback to call on a matching event being cast.
   * @returns `this`, for chaining.
   * @see {@link EventCaster.#filterToRegExp} for additional exceptions thrown.
   */
  on(filter: string, callback: EventCallback): this {
    if (!this.#listeners.has(callback)) {
      this.#listeners.set(callback, new Set());
    }
    this.#listeners.get(callback)?.add(EventCaster.#filterToRegExp(filter));

    return this;
  }

  /**
   * Attach the given callback to the event caster, triggered on events matching the given filter, and removed upon being called once.
   *
   * @param filter - Event name filter to assign the listener to.
   * @param callback - Callback to call on a matching event being cast.
   * @returns `this`, for chaining.
   * @see {@link EventCaster.on} for additional exceptions thrown.
   */
  once(filter: string, callback: EventCallback): this {
    const wrapped: EventCallback = (name: string, ...args: unknown[]): void => {
      callback.bind(undefined)(name, ...args);
      this.off(wrapped);
    };
    return this.on(filter, wrapped);
  }

  /**
   * Remove the given callback from the listeners set.
   *
   * @param callback - The callback to remove.
   * @returns `this`, for chaining.
   */
  off(callback: EventCallback): this {
    this.#listeners.delete(callback);
    return this;
  }

  /**
   * Cast the given event with the given arguments and trigger any matching listeners.
   *
   * @param name - The event name to cast.
   * @param args - Any additional arguments o associate to the cast event.
   * @returns `this`, for chaining.
   * @see {@link EventCaster.validateEvent} for additional exceptions thrown.
   */
  #cast(name: string, ...args: unknown[]): this {
    EventCaster.validateEvent(name);

    for (const [callback, filters] of this.#listeners.entries()) {
      if ([...filters.values()].some((filter: RegExp): boolean => filter.test(name))) {
        setTimeout((): void => {
          callback.bind(undefined)(name, ...args);
        });
      }
    }

    return this;
  }
}

type Cast = (name: string, ...args: unknown[]) => EventCaster;

type ProtectedMethods = { cast: Cast };

export { EventCaster };
export type { MethodInjector, EventCallback, Cast, ProtectedMethods };
