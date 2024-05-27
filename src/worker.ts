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

export type WorkerBuilder = (code: string, tunnel: number, name: string) => WorkerInterface;

export type MessageCallback = (data: string) => void;

export type ErrorCallback = (error: Error) => void;

/**
 * An instance of an environment-agnostic worker.
 *
 */
export interface WorkerInterface {
  /**
   * Stop the worker instance immediately.
   *
   * @returns `this`, for chaining.
   */
  kill(): this;

  /**
   * Send the given data to the {@link WorkerInterface}.
   *
   * > [!warning]
   * > The given `data` object **MUST** be serializable via `JSON.serialize`.
   *
   * @param data - object to send to the {@link WorkerInterface}.
   * @returns `this`, for chaining.
   */
  shout(data: object): this;

  /**
   * Set the given callbacks as handlers for message / error.
   *
   * @param messageCallback - Callback to use for message handling.
   * @param errorCallback - Callback to use for message errors.
   * @returns `this`, for chaining.
   */
  listen(messageCallback: MessageCallback, errorCallback: ErrorCallback): this;
}

/**
 * An wrapper for a {@link !Worker}.
 *
 */
export class BrowserWorker implements WorkerInterface {
  static {
    // ref: https://stackoverflow.com/a/77741904
    Object.setPrototypeOf(this.prototype, null);
  }

  /**
   * A [`blob:`-URL](https://en.wikipedia.org/wiki/Blob_URI_scheme) containing the worker code (or `null` if killed).
   *
   */
  #blobURL?: string | undefined;

  /**
   * The {@link !Worker} instance (or `null` if killed).
   *
   */
  #worker?: Worker | undefined;

  /**
   * Construct a new {@link BrowserWorker} with the given parameters.
   *
   * @param code - The code the {@link !Worker} will, eventually, run.
   * @param tunnel - Tunnel id tell the {@link !Worker} to announce boot-up on.
   * @param name - The name to give to the {@link !Worker}.
   */
  constructor(code: string, tunnel: number, name: string) {
    this.#blobURL = URL.createObjectURL(
      new Blob(
        [
          `'use strict';
          (${code})(
            this,
            ${tunnel.toString()},
            ((_addEventListener) => (listener) => {
              _addEventListener('message', ({ data }) => {
                listener(data);
              });
            })(addEventListener),
            ((_postMessage, _JSON_stringify) => (message) => {
              _postMessage(_JSON_stringify(message));
            })(postMessage, JSON.stringify),
            ((_setTimeout) => (callback) => {
              _setTimeout(callback, 0);
            })(setTimeout),
          );`,
        ],
        {
          type: 'application/javascript',
        },
      ),
    );

    this.#worker = new Worker(this.#blobURL, {
      name: name,
      type: 'classic',
      credentials: 'omit',
    });
  }

  /**
   * Stop the worker instance immediately.
   *
   * @returns `this`, for chaining.
   */
  kill(): this {
    this.#worker?.terminate();
    if (undefined !== this.#blobURL) {
      URL.revokeObjectURL(this.#blobURL);
    }
    this.#worker = undefined;
    this.#blobURL = undefined;
    return this;
  }

  /**
   * Send the given data to the {@link BrowserWorker}.
   *
   * > [!warning]
   * > The given `data` object **MUST** be serializable via `JSON.serialize`.
   *
   * @param data - object to send to the {@link BrowserWorker}.
   * @returns `this`, for chaining.
   */
  shout(data: object): this {
    this.#worker?.postMessage(JSON.stringify(data));
    return this;
  }

  /**
   * Set the given callbacks as handlers for message / error.
   *
   * @param messageCallback - Callback to use for message handling.
   * @param errorCallback - Callback to use for message errors.
   * @returns `this`, for chaining.
   */
  listen(messageCallback: MessageCallback, errorCallback: ErrorCallback): this {
    if (undefined === this.#worker) {
      throw new Error('worker terminated');
    }
    this.#worker.addEventListener('message', (message: MessageEvent): void => {
      messageCallback('string' === typeof message.data ? message.data : '');
    });
    this.#worker.addEventListener('error', (event: Event): void => {
      event.preventDefault();
      errorCallback(new Error(event.type));
    });
    this.#worker.addEventListener('messageerror', (message: MessageEvent): void => {
      errorCallback(new Error('string' === typeof message.data ? message.data : 'unknown error'));
    });
    return this;
  }
}

/**
 * Get the {@link WorkerBuilder} to use under the current environment.
 *
 * @returns The {@link WorkerBuilder} to use under the current environment.
 * @see {@link https://stackoverflow.com/a/31090240}
 */
export function builder(): WorkerBuilder {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const isBrowser: boolean = new Function('try { return this === window; } catch { return false; }')() as boolean;
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const isNode: boolean = new Function('try { return this === global; } catch { return false; }')() as boolean;

  if (isBrowser) {
    return (code: string, tunnel: number, name: string) => new BrowserWorker(code, tunnel, name);
  } else if (isNode) {
    throw new Error('Unsupported execution environment');
  } else {
    throw new Error('Cannot determine execution environment');
  }
}

/**
 * Get the {@link WorkerInterface} constructed for the current environment using the given parameters.
 *
 * @param code - Code to set the {@link WorkerInterface} up with.
 * @param tunnel - Tunnel id tell the {@link WorkerInterface} to announce boot-up on.
 * @param name - Name to use for the {@link WorkerInterface}.
 * @returns A {@link WorkerInterface} constructed via the {@link WorkerInterface} for the current environment.
 */
export function build(code: string, tunnel: number, name: string): WorkerInterface {
  return builder()(code, tunnel, name);
}
