'use strict';

import type { WorkerBuilder, WorkerInstance } from './interfaces.ts';

/**
 * Get the {@link WorkerBuilder} to use under the current environment.
 *
 * @returns A {@link Promise} that resolves to the builder to use under the current environment.
 * @see {@link https://stackoverflow.com/a/31090240}
 */
async function builder(): Promise<WorkerBuilder> {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const isBrowser: boolean = new Function('try { return this === window; } catch { return false; }')() as boolean;
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const isNode: boolean = new Function('try { return this === global; } catch { return false; }')() as boolean;

  if (isBrowser) {
    return new (await import('./browser.ts')).default();
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
 * @param name - Name to use for the {@link WorkerInstance}.
 * @returns A promise that resolves with a {@link WorkerInstance} constructed via the {@link WorkerInstance} for the current environment.
 */
async function build(code: string, name: string): Promise<WorkerInstance> {
  return (await builder()).build(code, name);
}

export type { WorkerBuilder, WorkerInstance };
export { build, builder };
