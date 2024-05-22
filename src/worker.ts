'use strict';

/**
 * A builder for a {@link WorkerInstance}.
 *
 */
interface WorkerBuilder {
  /**
   * Get the {@link WorkerInstance} constructed using the given parameters.
   *
   * @param code - Code to set the {@link WorkerInstance} up with.
   * @param tunnel - Tunnel id tell the {@link WorkerInstance} to announce boot-up on.
   * @param name - Name to use for the {@link WorkerInstance}.
   */
  build(code: string, tunnel: number, name: string): WorkerInstance;
}

/**
 * An instance of an environment-agnostic worker.
 *
 */
interface WorkerInstance {
  /**
   * Stop the worker instance immediately.
   *
   * @returns `this`, for chaining.
   */
  kill(): this;

  /**
   * Send the given data to the {@link WorkerInstance}.
   *
   * > [!warning]
   * > The given `data` object **MUST** be serializable via `JSON.serialize`.
   *
   * @param data - object to send to the {@link WorkerInstance}.
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
  listen(messageCallback: (data: string) => void, errorCallback: (error: Error) => void): this;
}

// ------------------------------------------------------------------------------------------------

/**
 * A builder for a {@link BrowserWorkerInstance}.
 *
 */
class BrowserWorkerBuilder implements WorkerBuilder {
  /**
   * Get the {@link BrowserWorkerInstance} constructed using the given parameters.
   *
   * @param code - Code to set the {@link BrowserWorkerInstance} up with.
   * @param tunnel - Tunnel id tell the {@link WorkerInstance} to announce boot-up on.
   * @param name - Name to use for the {@link BrowserWorkerInstance}.
   * @returns The constructed {@link BrowserWorkerInstance}.
   */
  build(code: string, tunnel: number, name: string): WorkerInstance {
    return new BrowserWorkerInstance(code, tunnel, name);
  }
}

/**
 * An wrapper for a {@link !Worker}.
 *
 */
class BrowserWorkerInstance implements WorkerInstance {
  /**
   * A [`blob:`-URL](https://en.wikipedia.org/wiki/Blob_URI_scheme) containing the worker code (or `null` if killed).
   *
   */
  #blobURL: string | null;

  /**
   * The {@link !Worker} instance (or `null` if killed).
   *
   */
  #worker: Worker | null;

  /**
   * Construct a new {@link BrowserWorkerBuilder} with the given parameters.
   *
   * @param code - The code the {@link !Worker} will, eventually, run.
   * @param tunnel - Tunnel id tell the {@link WorkerInstance} to announce boot-up on.
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

// ------------------------------------------------------------------------------------------------

/**
 * Get the {@link WorkerBuilder} to use under the current environment.
 *
 * @returns The {@link WorkerBuilder} to use under the current environment.
 * @see {@link https://stackoverflow.com/a/31090240}
 */
function builder(): WorkerBuilder {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const isBrowser: boolean = new Function('try { return this === window; } catch { return false; }')() as boolean;
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const isNode: boolean = new Function('try { return this === global; } catch { return false; }')() as boolean;

  if (isBrowser) {
    return new BrowserWorkerBuilder();
  } else if (isNode) {
    throw new Error('Unsupported execution environment');
  } else {
    throw new Error('Cannot determine execution environment');
  }
}

/**
 * Get the {@link WorkerInstance} constructed for the current environment using the given parameters.
 *
 * @param code - Code to set the {@link WorkerInstance} up with.
 * @param tunnel - Tunnel id tell the {@link WorkerInstance} to announce boot-up on.
 * @param name - Name to use for the {@link WorkerInstance}.
 * @returns A {@link WorkerInstance} constructed via the {@link WorkerInstance} for the current environment.
 */
function build(code: string, tunnel: number, name: string): WorkerInstance {
  return builder().build(code, tunnel, name);
}

// ------------------------------------------------------------------------------------------------

export type { WorkerBuilder, WorkerInstance };
export { BrowserWorkerBuilder, BrowserWorkerInstance, builder, build };
