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

import type { AnyArgs } from './dependency';

import { event as validateEvent, filter as validateFilter } from './validation';

/**
 * The type of a method injector.
 *
 * A {@link MethodInjector} is a mechanism by which a parent class may expose some of its `private` methods to child classes.
 * This is done by having the parent class accept a {@link MethodInjector} as parameter in their `constructor`, and passing it a mapping of method names to functions internally implementing those method calls.
 * The child class is expected to store these callbacks internally, and use them to call the exposed parent methods, thus effectively making them "`protected`".
 *
 * @template T - The class whose methods (or a subset thereof) are beng exposed via this {@link MethodInjector}.
 * @param entries - A mapping from method name to a function that will in fact execute said method internally and transparently.
 */
export type MethodInjector<T> = (entries: { [Method in keyof T]: T[Method] }) => void;

/**
 * The type of an event callback.
 *
 * {@link EventCaster} events consists of two parts:
 *
 * - an event `name`: this is the main routing parameter, listeners use this to declare _what_ events to forward to them,
 * - additional arguments `args`: a _specific_ event may associate any number of arguments to each specific instance of it.
 *
 * An event _callback_ is simply a function that is prepared to receive these parts individually, and it's not expected to return anything at all.
 *
 * @param name - The event name to pass on to the call back function.
 * @param args - Any additional arguments associated to the particular event instance.
 */
export type EventCallback = (name: string, ...args: AnyArgs) => void;

/**
 * The type of the _casting_ method of the {@link EventCasterImplementation} class (ie. [EventCasterImplementation.#cast](../classes/eventCaster.EventCasterImplementation.html#_cast)).
 *
 * This is the call-signature of a method that will cast the given event name with the given associated arguments.
 *
 * @param name - The event name to cast.
 * @param args - The additional arguments associated to the event being cast.
 * @returns The {@link EventCasterImplementation} instance itself, for chaining.
 */
export type EventCasterImplementation_Cast = (name: string, ...args: AnyArgs) => EventCasterImplementation;

/**
 * The type of an {@link EventCasterImplementation}'s "`protected`" methods (ie. those that will be exposed via a {@link MethodInjector}).
 *
 * This type alias is useful in defining the _argument_ a child class' {@link MethodInjector} will accept.
 *
 */
export type EventCasterImplementation_ProtectedMethods = {
  /**
   * The _casting_ method (ie . [EventCasterImplementation.#cast](../classes/eventCaster.EventCasterImplementation.html#_cast)).
   *
   */
  cast: EventCasterImplementation_Cast;
};

/**
 * Glob-enabled Event Caster interface.
 *
 * This event caster allows listeners to be attached to "glob" expressions.
 * All event names must adhere to the following ABNF:
 *
 * ```ini
 * segment = 1*( ALPHA / DIGIT / "/" / "_" / "." / "-" )
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
 * ```ini
 * filter = ( ( segment / "*" ) [ ":" filter ] / "**" [ ":" segment [ ":" filter ] ] )
 * ```
 *
 */
export interface EventCaster {
  /**
   * Remove the given callback from the listeners set.
   *
   * @param callback - The callback to remove.
   * @returns `this`, for chaining.
   */
  off(callback: EventCallback): this;

  /**
   * Attach the given callback to the {@link EventCaster}, triggered on events matching the given filter.
   *
   * @param filter - Event name filter to assign the listener to.
   * @param callback - Callback to call on a matching event being cast.
   * @returns `this`, for chaining.
   */
  on(filter: string, callback: EventCallback): this;

  /**
   * Attach the given callback to the {@link EventCaster}, triggered on events matching the given filter, and removed upon being called once.
   *
   * @param filter - Event name filter to assign the listener to.
   * @param callback - Callback to call on a matching event being cast.
   * @returns `this`, for chaining.
   */
  once(filter: string, callback: EventCallback): this;
}

/**
 * Turn an event name filter into a filtering {@link !RegExp}.
 *
 * @param filter - The event name filter to transform.
 * @returns The transformed event name filter.
 * @see {@link validation.filter} for additional exceptions thrown.
 */
export const _filterToRegExp: (filter: string) => RegExp = (filter: string): RegExp => {
  return new RegExp(
    '^' +
      validateFilter(filter)
        .split(':')
        .map((part: string): string => {
          switch (part) {
            case '*':
              return '[\\w/.-]+';
            case '**':
              return '[\\w/.-]+(?::[\\w/.-]+)*';
            default:
              return part.replace(/\./g, '\\.');
          }
        })
        .join(':') +
      '$',
  );
};

/**
 * Glob-enabled Event Caster.
 *
 * This event caster allows listeners to be attached to "glob" expressions.
 * All event names must adhere to the following ABNF:
 *
 * ```ini
 * segment = 1*( ALPHA / DIGIT / "/" / "_" / "." / "-" )
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
 * ```ini
 * filter = ( ( segment / "*" ) [ ":" filter ] / "**" [ ":" segment [ ":" filter ] ] )
 * ```
 *
 */
export class EventCasterImplementation implements EventCaster {
  /**
   * The event listener map.
   *
   * This map will map an event listener to a set of event name regular expressions.
   *
   */
  #listeners: Map<EventCallback, Set<RegExp>> = new Map<EventCallback, Set<RegExp>>();

  /**
   * Build a new {@link EventCasterImplementation}, receiving a callback to inject the "protected" methods map.
   *
   * Passing a callback to inject the "protected" methods map into allows for derived classes to have access to these whilst preventing access to outside agents.
   *
   * @param protectedMethodInjector - Callback that will receive the "protected" methods map.
   */
  constructor(
    protectedMethodInjector?: MethodInjector<{
      cast: EventCasterImplementation_Cast;
    }>,
  ) {
    protectedMethodInjector?.({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      cast: (name: string, ...args: AnyArgs): this => this.#cast(name, ...args),
    });
  }

  /**
   * Cast the given event with the given arguments and trigger any matching listeners.
   *
   * @param name - The event name to cast.
   * @param args - Any additional arguments o associate to the cast event.
   * @returns `this`, for chaining.
   * @see {@link validation.event} for additional exceptions thrown.
   */
  #cast(name: string, ...args: AnyArgs): this {
    validateEvent(name);

    for (const [callback, filters] of this.#listeners.entries()) {
      if (Array.from(filters.values()).some((filter: RegExp): boolean => filter.test(name))) {
        setTimeout((): void => {
          if (Array.from(this.#listeners.get(callback) ?? []).some((filter: RegExp): boolean => filter.test(name))) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            callback.call(undefined, name, ...args);
          }
        });
      }
    }

    return this;
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
   * Attach the given callback to the event caster, triggered on events matching the given filter.
   *
   * @param filter - Event name filter to assign the listener to.
   * @param callback - Callback to call on a matching event being cast.
   * @returns `this`, for chaining.
   * @see {@link validation.filter} for additional exceptions thrown.
   */
  on(filter: string, callback: EventCallback): this {
    if (!this.#listeners.has(callback)) {
      this.#listeners.set(callback, new Set());
    }
    this.#listeners.get(callback)?.add(_filterToRegExp(filter));

    return this;
  }

  /**
   * Attach the given callback to the event caster, triggered on events matching the given filter, and removed upon being called once.
   *
   * @param filter - Event name filter to assign the listener to.
   * @param callback - Callback to call on a matching event being cast.
   * @returns `this`, for chaining.
   * @see {@link EventCasterImplementation.on} for additional exceptions thrown.
   */
  once(filter: string, callback: EventCallback): this {
    const wrapped: EventCallback = (name: string, ...args: AnyArgs): void => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      callback.call(undefined, name, ...args);
      this.off(wrapped);
    };
    return this.on(filter, wrapped);
  }

  static {
    // ref: https://stackoverflow.com/a/77741904
    Object.setPrototypeOf(this.prototype, null);
  }
}
