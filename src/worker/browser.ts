'use strict';

import type { WorkerBuilder, WorkerInstance } from './interfaces';

/**
 * A builder for a {@link BrowserWorkerInstance}.
 *
 */
class BrowserWorkerBuilder implements WorkerBuilder {
  /**
   * Get the {@link BrowserWorkerInstance} constructed using the given parameters.
   *
   * @param code - Code to set the {@link BrowserWorkerInstance} up with.
   * @param name - Name to use for the {@link BrowserWorkerInstance}.
   * @returns The constructed {@link BrowserWorkerInstance}.
   */
  build(code: string, name: string): WorkerInstance {
    return new BrowserWorkerInstance(code, name);
  }
}

/**
 * An wrapper for a {@link Worker}.
 *
 */
class BrowserWorkerInstance implements WorkerInstance {
  /**
   * A [`blob:`-URL](https://en.wikipedia.org/wiki/Blob_URI_scheme) containing the worker code (or `null` if killed).
   *
   */
  #blobURL: string | null;

  /**
   * The {@link Worker} instance (or `null` if killed).
   *
   */
  #worker: Worker | null;

  /**
   * Construct a new {@link BrowserWorkerBuilder} with the given parameters.
   *
   * @param code - The code the {@link Worker} will, eventually, run.
   * @param name - The name to give to the {@link Worker}.
   */
  constructor(code: string, name: string) {
    this.#blobURL = URL.createObjectURL(
      new Blob(
        [
          `'use strict';
          (${code})(
            this,
            ((_addEventListener) => (listener) => {
              _addEventListener('message', ({ data }) => {
                listener(data);
              });
            })(addEventListener),
            ((_postMessage) => (message) => {
              _postMessage(message);
            })(postMessage),
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
    if (null !== this.#worker) {
      this.#worker.terminate();
      this.#worker = null;
    }
    if (null !== this.#blobURL) {
      URL.revokeObjectURL(this.#blobURL);
      this.#blobURL = null;
    }
    return this;
  }

  /**
   * Send the given data to the {@link BrowserWorkerInstance}.
   *
   * > [!warning]
   * > The given `data` object **MUST** be serializable via `JSON.serialize`.
   *
   * @param data - object to send to the {@link BrowserWorkerInstance}.
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
  listen(messageCallback: (data: string) => void, errorCallback: (error: Error) => void): this {
    if (null === this.#worker) {
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

export default BrowserWorkerBuilder;
