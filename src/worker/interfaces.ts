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
   * @param name - Name to use for the {@link WorkerInstance}.
   */
  build(code: string, name: string): WorkerInstance;
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

export type { WorkerBuilder, WorkerInstance };
