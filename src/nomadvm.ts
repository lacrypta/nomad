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

import type { DependencyInterface, DependencyObject } from './dependency';
import type {
  EventCallback,
  EventCasterInterface,
  EventCasterInterface_Cast,
  EventCasterInterface_ProtectedMethods,
} from './eventCaster';
import type { WorkerInterface, WorkerBuilder } from './worker';

import {
  enclosure as validateEnclosure,
  event as validateEvent,
  timeDelta as validateTimeDelta,
  nonNegativeInteger as validateNonNegativeInteger,
  identifier as validateIdentifier,
  argumentsMap as validateArgumentsMap,
} from './validation';

import { EventCaster } from './eventCaster';
import { Dependency, sort } from './dependency';
import { BrowserWorker } from './worker';

import workerCode from './workerCode.cjs';

/**
 * A safe execution environment for NOMAD code execution.
 *
 */
export interface NomadInterface extends EventCasterInterface {
  /**
   * Getter used to retrieve the VM's name.
   *
   */
  get name(): string;

  /**
   * Attach the given callback to this particular VM's event caster, triggered on events matching the given filter.
   *
   * @param filter - Event name filter to assign the listener to.
   * @param callback - Callback to call on a matching event being cast.
   * @returns `this`, for chaining.
   * @throws {@link !Error} if the given event name filter fails regular expression validation.
   * @throws {@link !Error} if the given event name filter contains an adjacent pair of `**` wildcards.
   */
  onThis(filter: string, callback: EventCallback): this;

  /**
   * Attach the given callback to this particular VM's caster, triggered on events matching the given filter, and removed upon being called once.
   *
   * @param filter - Event name filter to assign the listener to.
   * @param callback - Callback to call on a matching event being cast.
   * @returns `this`, for chaining.
   * @see {@link EventCaster.once} for additional exceptions thrown.
   */
  onceThis(filter: string, callback: EventCallback): this;

  /**
   * Start the {@link !Worker} and wait for its boot-up sequence to complete.
   *
   * Starting a VM instance consists of the following:
   *
   * 1. Initializing a {@link !Worker} instance with the worker code.
   * 2. Setting up the boot timeout callback (in case the {@link !Worker} takes too much time to boot).
   * 3. Setting up the event listeners for `message`, `error`, and `messageerror`.
   *
   * @param timeout - Milliseconds to wait for the {@link !Worker} to complete its boot-up sequence.
   * @returns A {@link !Promise} that resolves with a pair of boot duration times (as measured from "inside" and "outside" of the {@link !Worker} respectively) if the {@link !Worker} was successfully booted up, and rejects with an {@link !Error} in case errors are found.
   */
  start(
    workerBuilder?: WorkerBuilder,
    timeout?: number,
    pingInterval?: number,
    pongLimit?: number,
  ): Promise<[number, number]>;

  /**
   * Shut the {@link !Worker} down.
   *
   * Shutting a VM instance consists of the following:
   *
   * 1. Emitting the "shutdown" event on the {@link !Worker}.
   * 2. Waiting for the given timeout milliseconds.
   * 3. Removing all root enclosures.
   * 4. Calling {@link NomadVM.stop} to finish the shutdown process.
   *
   * @param timeout - Milliseconds to wait for the {@link !Worker} to shut down.
   * @returns A {@link !Promise} that resolves with `void` if the {@link !Worker} was successfully shut down, and rejects with an {@link !Error} in case errors are found.
   */
  shutdown(timeout?: number): Promise<void>;

  /**
   * Stop the {@link !Worker} immediately and reject all pending tunnels.
   *
   * Stopping a Vm instance entails:
   *
   * 1. Clearing the pinger.
   * 2. Calling {@link WorkerInterface.kill} on the VM's {@link WorkerInterface}.
   * 3. Rejecting all existing tunnels.
   *
   * @returns A {@link !Promise} that resolves with `void` if the stopping procedure completed successfully, and rejects with an {@link !Error} in case errors occur.
   */
  stop(): Promise<void>;

  /**
   * Create a new enclosure with the given name.
   *
   * @param enclosure - Enclosure to create.
   * @returns A {@link !Promise} that resolves with a {@link NomadVMEnclosure} wrapper if enclosure creation completed successfully, and rejects with an {@link !Error} in case errors occur.
   */
  createEnclosure(enclosure: string): Promise<NomadEnclosureInterface>;

  /**
   * Delete the enclosure with the given name.
   *
   * This method will reject all tunnels awaiting responses on the given enclosure.
   *
   * @param enclosure - Enclosure to delete.
   * @returns A {@link !Promise} that resolves with a list of deleted enclosures (the one given and any sub enclosures of it) if enclosure deletion completed successfully, and rejects with an {@link !Error} in case errors occur.
   */
  deleteEnclosure(enclosure: string): Promise<string[]>;

  /**
   * Merge the given enclosure to its parent.
   *
   * @param enclosure - Enclosure to merge.
   * @returns A {@link !Promise} that resolves with `void` if enclosure merging completed successfully, and rejects with an {@link !Error} in case errors occur.
   */
  mergeEnclosure(enclosure: string): Promise<void>;

  /**
   * Link one enclosure to another, so that events cast on the first are also handled in the second.
   *
   * @param enclosure - "Source" enclosure to use.
   * @param target - "Destination" enclosure to use.
   * @returns A {@link !Promise} that resolves with `void` if enclosure linking completed successfully, and rejects with an {@link !Error} in case errors occur.
   */
  linkEnclosures(enclosure: string, target: string): Promise<void>;

  /**
   * Unlink one enclosure from another, so that events cast on the first are no longer handled in the second.
   *
   * @param enclosure - "Source" enclosure to use.
   * @param target - "Destination" enclosure to use.
   * @returns A {@link !Promise} that resolves with a boolean indicating whether the target enclosure was previously linked if enclosure unlinking completed successfully, and rejects with an {@link !Error} in case errors occur.
   */
  unlinkEnclosures(enclosure: string, target: string): Promise<boolean>;

  /**
   * Mute the given enclosure, so that events cast on it are no longer propagated to this VM.
   *
   * @param enclosure - Enclosure to mute.
   * @returns A {@link !Promise} that resolves with the previous muting status if enclosure muting completed successfully, and rejects with an {@link !Error} in case errors occur.
   */
  muteEnclosure(enclosure: string): Promise<boolean>;

  /**
   * Unmute the given enclosure, so that events cast on it are propagated to this VM.
   *
   * @param enclosure - Enclosure to unmute.
   * @returns A {@link !Promise} that resolves with he previous muting status if enclosure un-muting completed successfully, and rejects with an {@link !Error} in case errors occur.
   */
  unmuteEnclosure(enclosure: string): Promise<boolean>;

  /**
   * List the root enclosures created.
   *
   * @returns A {@link !Promise} that resolves with a list of root enclosures created if successful, and rejects with an {@link !Error} in case errors occur.
   */
  listRootEnclosures(): Promise<string[]>;

  /**
   * List the dependencies (user-level and predefined) installed on the given enclosure or its prefixes.
   *
   * @param enclosure - Enclosure to list installed dependencies of.
   * @returns A {@link !Promise} that resolves with a list of installed dependency names if successful, and rejects with an {@link !Error} in case errors occur.
   */
  listInstalled(enclosure: string): Promise<string[]>;

  /**
   * List the enclosures the given one is linked to.
   *
   * @param enclosure - Enclosure to list linked-to enclosures of.
   * @returns A {@link !Promise} that resolves with a list of linked-to enclosures if successful, and rejects with an {@link !Error} in case errors occur.
   */
  listLinksTo(enclosure: string): Promise<string[]>;

  /**
   * List the enclosures that link to the given one.
   *
   * @param enclosure - Enclosure to list linked-from enclosures of.
   * @returns A {@link !Promise} that resolves with a list of linked-from enclosures if successful, and rejects with an {@link !Error} in case errors occur.
   */
  listLinkedFrom(enclosure: string): Promise<string[]>;

  /**
   * Determine whether the given enclosure is muted.
   *
   * @param enclosure - Enclosure to determine mute status of.
   * @returns A {@link !Promise} that resolves with a boolean value indicating whether the enclosure is muted if successful, and rejects with an {@link !Error} in case errors occur.
   */
  isMuted(enclosure: string): Promise<boolean>;

  /**
   * List the given enclosure's sub enclosures.
   *
   * @param enclosure - Enclosure to list the sub enclosures of.
   * @param depth - Maximum enclosure depth to retrieve results for, defaults to retrieving all.
   * @returns A {@link !Promise} that resolves with a list of sub enclosures enclosures if successful, and rejects with an {@link !Error} in case errors occur.
   */
  getSubEnclosures(enclosure: string, depth?: number): Promise<string[]>;

  /**
   * Add a predefined function to the VM's list under the given enclosure.
   *
   * @param enclosure - Enclosure to use.
   * @param name - Function name to add.
   * @param callback - {@link !Function} callback to use.
   * @returns A {@link !Promise} that resolves with `void` if the {@link !Function} was correctly predefined, and rejects with an {@link !Error} in case errors occurred.
   */
  predefine(enclosure: string, name: string, callback: (...args: unknown[]) => unknown): Promise<void>;

  /**
   * Install the given {@link Dependency} on the {@link !Worker}.
   *
   * @param enclosure - Enclosure to use.
   * @param dependency - The {@link Dependency} to install.
   * @returns A {@link !Promise} that resolves with `void` if the {@link Dependency} was correctly installed, and rejects with an {@link !Error} in case errors occurred.
   */
  install(enclosure: string, dependency: DependencyInterface): Promise<void>;

  /**
   * Execute the given {@link Dependency} with the given arguments map in the {@link !Worker}.
   *
   * @param enclosure - The enclosure to use.
   * @param dependency - The {@link Dependency} to execute.
   * @param args - The arguments map to execute with.
   * @returns A {@link !Promise} that resolves with the {@link Dependency}'s execution result, and rejects with an {@link !Error} in case errors occurred.
   */
  execute(enclosure: string, dependency: DependencyInterface, args?: Map<string, unknown>): Promise<unknown>;

  /**
   * Install the given {@link Dependency} iterable, by sorting them topologically and installing each one in turn.
   *
   * @param enclosure - Enclosure to use.
   * @param dependencies - Dependencies to install.
   * @returns A {@link !Promise} that resolves with `void` if every {@link Dependency} in the iterable was correctly installed, and rejects with an {@link !Error} in case errors occurred.
   */
  installAll(enclosure: string, dependencies: Iterable<DependencyInterface>): Promise<void>;

  /**
   * Emit an event towards the {@link !Worker}.
   *
   * @param enclosure - Enclosure to use.
   * @param event - Event name to emit.
   * @param args - Associated arguments to emit alongside the event.
   * @returns `this`, for chaining.
   */
  emit(enclosure: string, event: string, ...args: unknown[]): this;
}

/**
 * A {@link NomadVM} enclosure interface wrapper object.
 *
 */
export interface NomadEnclosureInterface {
  /**
   * Getter used to retrieve the wrapped {@link NomadVM}.
   *
   */
  get vm(): NomadInterface;

  /**
   * Getter used to retrieve the wrapped enclosure.
   *
   */
  get enclosure(): string;

  /**
   * Attach the given callback to the wrapped VM's event caster, triggered on events matching the given filter on the wrapped enclosure.
   *
   * @param filter - Event name filter to assign the listener to.
   * @param callback - Callback to call on a matching event being cast.
   * @returns `this`, for chaining.
   * @see {@link NomadVM.onThis} for additional exceptions thrown.
   */
  onThis(filter: string, callback: (...args: unknown[]) => void): this;

  /**
   * Attach the given callback to the wrapped VM's caster, triggered on events matching the given filter on the wrapped enclosure, and removed upon being called once.
   *
   * @param filter - Event name filter to assign the listener to.
   * @param callback - Callback to call on a matching event being cast.
   * @returns `this`, for chaining.
   * @see {@link NomadVM.onThis} for additional exceptions thrown.
   */
  onceThis(filter: string, callback: (...args: unknown[]) => void): this;

  /**
   * Link the wrapped enclosure to another, so that events cast on the wrapped enclosure are also handled in the other.
   *
   * @param target - "Destination" enclosure to use.
   * @returns A {@link !Promise} that resolves with `void` if enclosure linking completed successfully, and rejects with an {@link !Error} in case errors occur.
   * @see {@link NomadVM.linkEnclosures} for additional exceptions thrown.
   */
  link(target: string): Promise<void>;

  /**
   * Unlink the wrapped enclosure from another, so that events cast on the wrapped enclosure are no longer handled in the other.
   *
   * @param target - "Destination" enclosure to use.
   * @returns A {@link !Promise} that resolves with a boolean indicating whether the target enclosure was previously linked if enclosure unlinking completed successfully, and rejects with an {@link !Error} in case errors occur.
   * @see {@link NomadVM.unlinkEnclosures} for additional exceptions thrown.
   */
  unlink(target: string): Promise<boolean>;

  /**
   * Mute the wrapped enclosure, so that events cast on it are no longer propagated to the wrapped VM.
   *
   * @returns A {@link !Promise} that resolves with the previous muting status if enclosure muting completed successfully, and rejects with an {@link !Error} in case errors occur.
   * @see {@link NomadVM.muteEnclosure} for additional exceptions thrown.
   */
  mute(): Promise<boolean>;

  /**
   * Unmute the wrapped enclosure, so that events cast on it are propagated to wrapped VM.
   *
   * @returns A {@link !Promise} that resolves with he previous muting status if enclosure un-muting completed successfully, and rejects with an {@link !Error} in case errors occur.
   * @see {@link NomadVM.unmuteEnclosure} for additional exceptions thrown.
   */
  unmute(): Promise<boolean>;

  /**
   * List the dependencies (user-level and predefined) installed on the wrapped enclosure or its prefixes
   *
   * @returns A {@link !Promise} that resolves with a list of installed dependency names if successful, and rejects with an {@link !Error} in case errors occur.
   * @see {@link NomadVM.listInstalled} for additional exceptions thrown.
   */
  listInstalled(): Promise<string[]>;

  /**
   * List the enclosures the wrapped one is linked to.
   *
   * @returns A {@link !Promise} that resolves with a list of linked-to enclosures if successful, and rejects with an {@link !Error} in case errors occur.
   * @see {@link NomadVM.listLinksTo} for additional exceptions thrown.
   */
  listLinksTo(): Promise<string[]>;

  /**
   * List the enclosures that link to the wrapped one.
   *
   * @returns A {@link !Promise} that resolves with a list of linked-from enclosures if successful, and rejects with an {@link !Error} in case errors occur.
   * @see {@link NomadVM.listLinkedFrom} for additional exceptions thrown.
   */
  listLinkedFrom(): Promise<string[]>;

  /**
   * Determine whether the wrapped enclosure is muted.
   *
   * @returns A {@link !Promise} that resolves with a boolean value indicating whether the wrapped enclosure is muted if successful, and rejects with an {@link !Error} in case errors occur.
   * @see {@link NomadVM.isMuted} for additional exceptions thrown.
   */
  isMuted(): Promise<boolean>;

  /**
   * List the wrapped enclosure's sub enclosures.
   *
   * @param depth - Maximum enclosure depth to retrieve results for, defaults to retrieving all.
   * @returns A {@link !Promise} that resolves with a list of sub enclosures if successful, and rejects with an {@link !Error} in case errors occur.
   * @see {@link NomadVM.getSubEnclosures} for additional exceptions thrown.
   */
  getSubEnclosures(depth?: number): Promise<string[]>;

  /**
   * Add a predefined function to the VM's list under the wrapped enclosure.
   *
   * @param name - Function name to add.
   * @param callback - {@link !Function} callback to use.
   * @returns A {@link !Promise} that resolves with `void` if the {@link !Function} was correctly predefined, and rejects with an {@link !Error} in case errors occurred.
   * @see {@link NomadVM.predefine} for additional exceptions thrown.
   */
  predefine(name: string, callback: (...args: unknown[]) => unknown): Promise<void>;

  /**
   * Install the given {@link Dependency} on the wrapped VM under the wrapped enclosure.
   *
   * @param dependency - The {@link Dependency} to install.
   * @returns A {@link !Promise} that resolves with `void` if the {@link Dependency} was correctly installed, and rejects with an {@link !Error} in case errors occurred.
   * @see {@link NomadVM.install} for additional exceptions thrown.
   */
  install(dependency: DependencyInterface): Promise<void>;

  /**
   * Execute the given {@link Dependency} with the given arguments map in the wrapped VM under the wrapped enclosure.
   *
   * @param dependency - The {@link Dependency} to execute.
   * @param args - The arguments map to execute with.
   * @returns A {@link !Promise} that resolves with the {@link Dependency}'s execution result, and rejects with an {@link !Error} in case errors occurred.
   * @see {@link NomadVM.execute} for additional exceptions thrown.
   */
  execute(dependency: DependencyInterface, args?: Map<string, unknown>): Promise<unknown>;

  /**
   * Install the given {@link Dependency} iterable, by sorting them topologically and installing each one in turn.
   *
   * @param dependencies - Dependencies to install.
   * @returns A {@link !Promise} that resolves with `void` if every {@link Dependency} in the iterable was correctly installed, and rejects with an {@link !Error} in case errors occurred.
   * @see {@link NomadVM.installAll} for additional exceptions thrown.
   */
  installAll(dependencies: Iterable<DependencyInterface>): Promise<void>;
}

/**
 * Generate a pseudo-random string.
 *
 * NOTE: this is NOT cryptographically-secure, it simply calls {@link !Math.random}.
 *
 * @returns A pseudo-random string.
 */
export const _pseudoRandomString: () => string = (): string => {
  return Math.trunc(Math.random() * 4294967296)
    .toString(16)
    .padStart(8, '0');
};

let __castGlobal: EventCasterInterface_Cast;

/**
 * Static {@link EventCaster} that allows a single event source to be used across all VMs.
 *
 * All events cast bear a first argument consisting of the VM the event originated from.
 * The events cast on the static {@link EventCaster} are:
 *
 * - `nomadvm:{NAME}:new(vm)`: cast on the static {@link EventCaster}, upon VM `vm` creation.
 *
 * The events cast on both {@link EventCaster}s are:
 *
 * - `nomadvm:{NAME}:start(vm)`: when the VM `vm` is being started.
 * - `nomadvm:{NAME}:start:ok(vm)`: when the VM `vm` has been successfully started.
 * - `nomadvm:{NAME}:start:error(vm, error)`: when the VM `vm` has failed to be started with error `error`.
 * - `nomadvm:{NAME}:stop(vm)`: when the VM `vm` is being stopped.
 * - `nomadvm:{NAME}:stop:ok(vm)`: when the VM `vm` has been successfully stopped.
 * - `nomadvm:{NAME}:stop:error(vm, error)`: when the VM `vm` has failed to be stopped with error `error`.
 * - `nomadvm:{NAME}:stop:error:ignored(vm, error)`: when the VM `vm` has ignored error `error` while stopping (so as to complete the shutdown procedure).
 * - `nomadvm:{NAME}:worker:warning(vm, error)`: when the {@link !Worker} encounters a non-fatal, yet reportable, error `error`.
 * - `nomadvm:{NAME}:worker:error(vm, error)`: when the {@link !Worker} encounters a fatal error `error`.
 * - `nomadvm:{NAME}:worker:unresponsive(vm, delta)`: when the {@link !Worker} fails to respond to ping / pong messages for `delta` milliseconds.
 * - `nomadvm:{NAME}:{ENCLOSURE}:predefined:call(vm, idx, args)`: when a predefined function with index `idx` is being called with arguments `args` on the `vm` VM.
 * - `nomadvm:{NAME}:{ENCLOSURE}:predefined:call:ok(vm, idx, args)`: when a predefined function with index `idx` has been successfully called with arguments `args` on the `vm` VM.
 * - `nomadvm:{NAME}:{ENCLOSURE}:predefined:call:error(vm, idx, args, error)`: when a predefined function with index `idx` has failed to be called with arguments `args` on the `vm` VM with error `error`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:predefined:add(vm, name, callback, idx)`: when a predefined function with name `name`, index `idx`, and implementation `callback` is being added to the `vm` VM.
 * - `nomadvm:{NAME}:{ENCLOSURE}:predefined:add:ok(vm, name, callback, idx)`: when a predefined function with name `name`, index `idx`, and implementation `callback` has been successfully added to the `vm` VM.
 * - `nomadvm:{NAME}:{ENCLOSURE}:predefined:add:error(vm, name, callback, idx, error)`: when a predefined function with name `name`, index `idx`, and implementation `callback` has failed to be added to the `vm` VM with error `error`
 * - `nomadvm:{NAME}:{ENCLOSURE}:create(vm)`: when a new enclosure is being created on VM `vm`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:create:ok(vm)`: when a new enclosure has been successfully created on VM `vm`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:create:error(vm, error)`: when a new enclosure has failed to be created on VM `vm` with error `error`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:delete(vm)`: when an enclosure is being deleted from VM `vm`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:delete:ok(vm, deleted)`: when enclosures `deleted` have been successfully deleted from VM `vm`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:delete:error(vm, error)`: when an enclosure has failed to be deleted from VM `vm` with error `error`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:merge(vm, enclosure)`: when an enclosure `enclosure` is being merged to its parent from VM `vm`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:merge:ok(vm, enclosure)`: when enclosure `enclosure` has been successfully merged to its parent on VM `vm`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:merge:error(vm, enclosure, error)`: when an enclosure `enclosure` has failed to be merged to its parent in VM `vm` with error `error`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:link(vm, target)`: when an enclosure is being linked to the `target` one on VM `vm`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:link:ok(vm, target)`: when an enclosure has been successfully linked to the `target` one on VM `vm`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:link:error(vm, target, error)`: when an enclosure has failed to be linked to the `target` one on VM `vm` with error `error`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:unlink(vm, target)`: when an enclosure is being unlinked to the `target` one on VM `vm`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:unlink:ok(vm, target, unlinked)`: when an enclosure has been successfully unlinked to the `target` one on VM `vm`, `unlinked` will be `true` if the target enclosure was previously linked.
 * - `nomadvm:{NAME}:{ENCLOSURE}:unlink:error(vm, target, error)`: when an enclosure has failed to be unlinked to the `target` one on VM `vm` with error `error`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:mute(vm)`: when an enclosure is being muted on VM `vm`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:mute:ok(vm, previous)`: when an enclosure has been successfully muted on VM `vm`, where the previous muting status was `previous`..
 * - `nomadvm:{NAME}:{ENCLOSURE}:mute:error(vm, error)`: when an enclosure has failed to be muted on VM `vm` with error `error`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:unmute(vm)`: when an enclosure is being unmuted on VM `vm`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:unmute:ok(vm, previous)`: when an enclosure has been successfully unmuted on VM `vm`, where the previous muting status was `previous`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:unmute:error(vm, error)`: when an enclosure has failed to be unmuted on VM `vm` with error `error`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:install(vm, dependency)`: when dependency `dependency` is being installed on the `vm` VM.
 * - `nomadvm:{NAME}:{ENCLOSURE}:install:ok(vm, dependency)`: when dependency `dependency` has been successfully installed on the `vm` VM.
 * - `nomadvm:{NAME}:{ENCLOSURE}:install:error(vm, dependency, error)`: when dependency `dependency` has failed to be installed on the `vm` VM with error `error`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:execute(vm, dependency, args)`: when dependency `dependency` is being executed on the `vm` VM with arguments `args`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:execute:ok(vm, dependency, args, result)`: when dependency `dependency` has been successfully executed on the `vm` VM with arguments `args`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:execute:error(vm, dependency, args, error)`: when dependency `dependency` has failed to be executed on the `vm` VM with arguments `args` and error `error`.
 * - `nomadvm:{NAME}:{ENCLOSURE}:user:{eventname}(vm, ...args)`: when the {@link !Worker} on the `vm` VM emits an event with name `EVENT` and arguments `args`.
 *
 * Internally, the {@link !Worker} will cast the following events when instructed to by the VM:
 *
 * - `nomadvm:{NAME}:{ENCLOSURE}:host:{eventname}(vm, ...args)`: when the VM `vm` emits an event into the {@link !Worker} with name `EVENT` and arguments `args`.
 *
 */
export const events: Readonly<EventCasterInterface> = Object.freeze(
  new EventCaster((protectedMethods: EventCasterInterface_ProtectedMethods): void => {
    __castGlobal = protectedMethods.cast;
  }),
);

/**
 * The {@link EventCaster} casting function for all he VMs.
 *
 */
export const _castGlobal: EventCasterInterface_Cast =
  // @ts-expect-error: Variable '__castGlobal' is used before being assigned.
  __castGlobal;

/**
 * Prefix to use for all events emitted.
 *
 */
export const _eventPrefix: string = 'nomadvm';

/**
 * Prefix to use for all names generated.
 *
 */
export const _namesPrefix: string = 'nomadvm';

/**
 * Global mapping of VM names to VM {@link !WeakRef}s.
 *
 */
export const _names: Map<string, WeakRef<NomadVM>> = new Map<string, WeakRef<NomadVM>>();

/**
 * The default number of milliseconds to wait for the {@link !Worker} to start.
 *
 */
export const _defaultBootTimeout: number = 200;

/**
 * The default number of milliseconds to wait for the {@link !Worker} to stop.
 *
 */
export const _defaultShutdownTimeout: number = 100;

/**
 * The default number of milliseconds to wait between `ping` messages to the {@link !Worker}.
 *
 */
export const _defaultPingInterval: number = 100;

/**
 * The default number of milliseconds that must elapse between `pong` messages in order to consider a {@link !Worker} "unresponsive".
 *
 */
export const _defaultPongLimit: number = 1000;

/**
 * Retrieve the VM registered under the given name.
 *
 * @param name - VM name to retrieve.
 * @returns The VM registered under the given name, or `undefined` if none found.
 */
export const get: (name: string) => WeakRef<NomadInterface> | undefined = (
  name: string,
): WeakRef<NomadVM> | undefined => {
  return _names.get(name);
};

/**
 * A safe execution environment for NOMAD code execution.
 *
 */
export class NomadVM extends EventCaster implements NomadInterface {
  /**
   * The {@link EventCaster} casting function for the current VM.
   *
   */
  #castLocal: EventCasterInterface_Cast;

  /**
   * The VM name to use.
   *
   */
  #name: string;

  /**
   * The VM's state.
   *
   * The VM's state can be one of:
   *
   * - `created`: the {@link NomadVM} instance is successfully created.
   * - `booting`: the {@link NomadVM.start} method is waiting for the {@link !Worker} boot-up sequence to finish.
   * - `running`: the {@link NomadVM} instance is running and waiting for commands.
   * - `stopped`: the {@link NomadVM} instance has been stopped and no further commands are accepted.
   *
   * These states may transition like so:
   *
   * - `created --> booting`: upon calling {@link NomadVM.start}.
   * - `created --> stopped`: upon calling {@link NomadVM.stop} before {@link NomadVM.start}.
   * - `booting --> running`: upon the {@link !Worker} successfully finishing its boot up sequence.
   * - `booting --> stopped`: upon calling {@link NomadVM.stop} after {@link NomadVM.start} but before the boot-up sequence has finished in the {@link !Worker}.
   * - `running --> stopped`: upon calling {@link NomadVM.stop} after successful boot-up sequence termination in the {@link !Worker}.
   *
   */
  #state: 'created' | 'booting' | 'running' | 'stopped';

  /**
   * The {@link WorkerInterface} this VM is using for secure execution, or `null` if none create or stopped.
   *
   */
  #worker?: WorkerInterface | undefined;

  /**
   * A list of predefined functions.
   *
   */
  #predefined: ((...args: unknown[]) => unknown)[] = [];

  /**
   * A list of inter-process tunnels being used.
   *
   * Tunnels are a way of holding on to `resolve` / `reject` {@link !Promise} callbacks under a specific index number, so that both the {@link !Worker} and the {@link NomadVM} can interact through these.
   *
   */
  #tunnels: {
    resolve: (arg: unknown) => void;
    reject: (error: Error) => void;
  }[] = [];

  /**
   * The timeout ID for the boot timeout, or `null` if not yet set up.
   *
   */
  #bootTimeout?: ReturnType<typeof setTimeout> | undefined;

  /**
   * The interval ID for the pinger, or `null` if not yet set up.
   *
   */
  #pinger?: ReturnType<typeof setInterval> | undefined;

  /**
   * The timestamp when the last `pong` message was received.
   *
   */
  #lastPong?: number;

  /**
   * Construct a new {@link NomadVM} instance, using the given name.
   *
   * @param name - The VM's name to use, or `null` to have one generated randomly.
   * @throws {@link !Error} if the given name already exists.
   */
  constructor(name?: string) {
    if (undefined === name) {
      do {
        name = `${_namesPrefix}-${_pseudoRandomString()}`;
      } while (_names.has(name));
    } else if (_names.has(name)) {
      throw new Error(`duplicate name ${name}`);
    }

    {
      let castLocal: EventCasterInterface_Cast;
      super((protectedMethods: { cast: EventCasterInterface_Cast }): void => {
        castLocal = protectedMethods.cast;
      });
      // @ts-expect-error: Variable 'castLocal' is used before being assigned.
      this.#castLocal = castLocal;
    }

    this.#name = name;
    _names.set(this.#name, new WeakRef<NomadVM>(this));
    this.#state = 'created';

    _castGlobal(`${_eventPrefix}:${this.#name}:new`, this);
  }

  /**
   * Getter used to retrieve the VM's name.
   *
   */
  get name(): string {
    return this.#name;
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Assert that the VM is currently in the "created" state.
   *
   * @throws {@link !Error} if the VM is in any state other than "created".
   */
  #assertCreated(): void {
    if ('created' !== this.#state) {
      throw new Error("expected state to be 'created'");
    }
  }

  /**
   * Assert that the VM is currently in the "running" state.
   *
   * @throws {@link !Error} if the VM is in any state other than "running".
   */
  #assertRunning(): void {
    if ('running' !== this.#state) {
      throw new Error("expected state to be 'running'");
    }
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Cast an event both from the static {@link EventCaster} at {@link events}, and from the current instance.
   *
   * @param name - Event name to cast.
   * @param args - Arguments to associate to the event in question.
   * @see {@link validation.event} for additional exceptions thrown.
   */
  #castEvent(name: string, ...args: unknown[]): void {
    const event: string = `${_eventPrefix}:${this.#name}:${name}`;
    this.#castLocal(event, this, ...args);
    _castGlobal(event, this, ...args);
  }

  /**
   * Attach the given callback to this particular VM's event caster, triggered on events matching the given filter.
   *
   * @param filter - Event name filter to assign the listener to.
   * @param callback - Callback to call on a matching event being cast.
   * @returns `this`, for chaining.
   * @see {@link validation.filter} for additional exceptions thrown.
   */
  onThis(filter: string, callback: EventCallback): this {
    return this.on(`${_eventPrefix}:${this.name}:${filter}`, callback);
  }

  /**
   * Attach the given callback to this particular VM's caster, triggered on events matching the given filter, and removed upon being called once.
   *
   * @param filter - Event name filter to assign the listener to.
   * @param callback - Callback to call on a matching event being cast.
   * @returns `this`, for chaining.
   * @see {@link EventCaster.once} for additional exceptions thrown.
   */
  onceThis(filter: string, callback: EventCallback): this {
    return this.once(`${_eventPrefix}:${this.name}:${filter}`, callback);
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Post a `ping` message to the {@link !Worker}.
   *
   * A `ping` message has the form:
   *
   * ```json
   * {
   *   name: "ping"
   * }
   * ```
   *
   */
  #postPingMessage(): void {
    this.#worker?.shout({ name: 'ping' });
  }

  /**
   * Post a `resolve` message to the {@link !Worker}.
   *
   * A `resolve` message has the form:
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
   * - `enclosure` is the WW-side enclosure that is awaiting a response.
   * - `tunnel` is the WW-side tunnel index awaiting a response.
   * - `payload` is any resolution result being returned.
   *
   * @param tunnel - The tunnel to resolve.
   * @param payload - The payload to use for resolution.
   */
  #postResolveMessage(tunnel: number, payload: unknown): void {
    this.#worker?.shout({ name: 'resolve', tunnel, payload });
  }

  /**
   * Post a `reject` message to the {@link !Worker}.
   *
   * A `reject` message has the form:
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
   * - `enclosure` is the WW-side enclosure that is awaiting a response.
   * - `tunnel` is the WW-side tunnel index awaiting a response.
   * - `error` is the rejection's error string.
   *
   * @param tunnel - The tunnel to reject.
   * @param error - The error message to use for {@link !Error} construction in the {@link !Worker}.
   */
  #postRejectMessage(tunnel: number, error: string): void {
    this.#worker?.shout({ name: 'reject', tunnel, error });
  }

  /**
   * Post an `emit` message to the {@link !Worker}.
   *
   * An `emit` message has the form:
   *
   * ```json
   * {
   *   name: "emit",
   *   enclosure: <string>,
   *   event: <string>,
   *   args: <unknown[]>
   * }
   * ```
   *
   * Where:
   *
   * - `enclosure` is the WW-side enclosure the event is being emitted into.
   * - `event` is the event name being emitted on the WW.
   * - `args` is an array of optional event arguments.
   *
   * @param enclosure - The enclosure to use.
   * @param event - The event name to emit.
   * @param args - The arguments to associate to the given event.
   */
  #postEmitMessage(enclosure: string, event: string, args: unknown[]): void {
    this.#worker?.shout({
      name: 'emit',
      enclosure,
      event: event,
      args,
    });
  }

  /**
   * Post an `install` message to the {@link !Worker}.
   *
   * An `install` message has the form:
   *
   * ```json
   * {
   *   name: "install",
   *   enclosure: <string>,
   *   tunnel: <int>,
   *   dependency: <DependencyObject>
   * }
   * ```
   *
   * Where:
   *
   * - `enclosure` is the WW-side enclosure to install the dependency into.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   * - `dependency` is the {@link DependencyObject} describing the dependency to install.
   *
   * @param enclosure - The enclosure to use.
   * @param tunnel - The tunnel index to expect a response on.
   * @param dependency - The dependency being installed.
   */
  #postInstallMessage(enclosure: string, tunnel: number, dependency: DependencyObject): void {
    this.#worker?.shout({ name: 'install', enclosure, tunnel, dependency });
  }

  /**
   * Post an `execute` message to the {@link !Worker}.
   *
   * An `execute` message has the form:
   *
   * ```json
   * {
   *   name: "execute",
   *   enclosure: <string>,
   *   tunnel: <int>,
   *   dependency: <DependencyObject>,
   *   args: {
   *     [argumentName: <string>]: <unknown>
   *   }
   * }
   * ```
   *
   * Where:
   *
   * - `enclosure` is the WW-side enclosure to install the dependency into.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   * - `dependency` is the {@link DependencyObject} describing the dependency to install.
   * - `args` is an array of optional execution arguments.
   *
   * @param enclosure - The enclosure to use.
   * @param tunnel - The tunnel index to expect a response on.
   * @param dependency - The dependency being executed.
   * @param args - The arguments to execute the dependency with.
   */
  #postExecuteMessage(
    enclosure: string,
    tunnel: number,
    dependency: DependencyObject,
    args: Map<string, unknown>,
  ): void {
    this.#worker?.shout({
      name: 'execute',
      enclosure,
      tunnel,
      dependency,
      args: Object.fromEntries(args.entries()),
    });
  }

  /**
   * Post a `predefine` message to the {@link !Worker}.
   *
   * A `predefine` message has the form:
   *
   * ```json
   * {
   *   name: "predefine",
   *   enclosure: <string>,
   *   tunnel: <int>,
   *   idx: <int>,
   *   function: <string>
   * }
   * ```
   *
   * Where:
   *
   * - `enclosure` is the WW-side enclosure to predefine the function into.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   * - `idx` is the function index being predefined.
   * - `function` is the predefined function name to use.
   *
   * @param enclosure - The enclosure to use.
   * @param tunnel - The tunnel index to expect a response on.
   * @param idx - The predefined function index to use.
   * @param funcName - The function name to use.
   */
  #postPredefineMessage(enclosure: string, tunnel: number, idx: number, funcName: string): void {
    this.#worker?.shout({
      name: 'predefine',
      enclosure,
      tunnel,
      idx,
      function: funcName,
    });
  }

  /**
   * Post a `create` message to the {@link !Worker}.
   *
   * A `create` message has the form:
   *
   * ```json
   * {
   *   name: "create",
   *   enclosure: <string>,
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `enclosure` is the WW-side enclosure to create.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param enclosure - The enclosure to create.
   * @param tunnel - The tunnel index to expect a response on.
   */
  #postCreateMessage(enclosure: string, tunnel: number): void {
    this.#worker?.shout({
      name: 'create',
      enclosure,
      tunnel,
    });
  }

  /**
   * Post a `delete` message to the {@link !Worker}.
   *
   * A `delete` message has the form:
   *
   * ```json
   * {
   *   name: "delete",
   *   tunnel: <int>,
   *   enclosure: <string>,
   * }
   * ```
   *
   * Where:
   *
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   * - `enclosure` is the WW-side enclosure to delete.
   *
   * @param tunnel - The tunnel index to expect a response on.
   * @param enclosure - The enclosure to delete.
   */
  #postDeleteMessage(tunnel: number, enclosure: string): void {
    this.#worker?.shout({ name: 'delete', tunnel, enclosure });
  }

  /**
   * Post a `merge` message to the {@link !Worker}.
   *
   * A `merge` message has the form:
   *
   * ```json
   * {
   *   name: "merge",
   *   enclosure: <string>,
   *   tunnel: <int>,
   * }
   * ```
   *
   * Where:
   *
   * - `enclosure` is the WW-side enclosure to merge.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param enclosure - The enclosure to merge.
   * @param tunnel - The tunnel index to expect a response on.
   */
  #postMergeMessage(enclosure: string, tunnel: number): void {
    this.#worker?.shout({ name: 'merge', enclosure, tunnel });
  }

  /**
   * Post a `link` message to the {@link !Worker}.
   *
   * A `link` message has the form:
   *
   * ```json
   * {
   *   name: "link",
   *   enclosure: <string>,
   *   tunnel: <int>,
   *   target: <string>
   * }
   * ```
   *
   * Where:
   *
   * - `enclosure` is the WW-side enclosure to use as link source.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   * - `target` is the WW-side enclosure to use as link target.
   *
   * @param enclosure - The enclosure to use as link source.
   * @param tunnel - The tunnel index to expect a response on.
   * @param target - The enclosure to use as link target.
   */
  #postLinkMessage(enclosure: string, tunnel: number, target: string): void {
    this.#worker?.shout({ name: 'link', enclosure, tunnel, target });
  }

  /**
   * Post an `unlink` message to the {@link !Worker}.
   *
   * An `unlink` message has the form:
   *
   * ```json
   * {
   *   name: "unlink",
   *   enclosure: <string>,
   *   tunnel: <int>,
   *   target: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `enclosure` is the WW-side enclosure to use as unlink source.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   * - `target` is the WW-side enclosure to use as unlink target.
   *
   * @param enclosure - The enclosure to use as unlink source.
   * @param tunnel - The tunnel index to expect a response on.
   * @param target - The enclosure to use as unlink target.
   */
  #postUnlinkMessage(enclosure: string, tunnel: number, target: string): void {
    this.#worker?.shout({ name: 'unlink', enclosure, tunnel, target });
  }

  /**
   * Post a `mute` message to the {@link !Worker}.
   *
   * A `mute` message has the form:
   *
   * ```json
   * {
   *   name: "mute",
   *   enclosure: <string>,
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `enclosure` is the WW-side enclosure to mute.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param enclosure - The enclosure to mute.
   * @param tunnel - The tunnel index to expect a response on.
   */
  #postMuteMessage(enclosure: string, tunnel: number): void {
    this.#worker?.shout({ name: 'mute', enclosure, tunnel });
  }

  /**
   * Post an `unmute` message to the {@link !Worker}.
   *
   * An `unmute` message has the form:
   *
   * ```json
   * {
   *   name: "unmute",
   *   enclosure: <string>,
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `enclosure` is the WW-side enclosure to unmute.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param enclosure - The enclosure to unmute.
   * @param tunnel - The tunnel index to expect a response on.
   */
  #postUnmuteMessage(enclosure: string, tunnel: number): void {
    this.#worker?.shout({ name: 'unmute', enclosure, tunnel });
  }

  /**
   * Post a `listRootEnclosures` message to the {@link !Worker}.
   *
   * A `listRootEnclosures` message has the form:
   *
   * ```json
   * {
   *   name: "listRootEnclosures",
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param tunnel - The tunnel index to expect a response on.
   */
  #postListRootEnclosuresMessage(tunnel: number): void {
    this.#worker?.shout({ name: 'listRootEnclosures', tunnel });
  }

  /**
   * Post a `listInstalled` message to the {@link !Worker}.
   *
   * A `listInstalled` message has the form:
   *
   * ```json
   * {
   *   name: "listInstalled",
   *   enclosure: <string>,
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `enclosure` is the WW-side enclosure to list installed dependencies of.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param enclosure - The enclosure to list installed dependencies of.
   * @param tunnel - The tunnel index to expect a response on.
   */
  #postListInstalledMessage(enclosure: string, tunnel: number): void {
    this.#worker?.shout({ name: 'listInstalled', enclosure, tunnel });
  }

  /**
   * Post a `listLinksTo` message to the {@link !Worker}.
   *
   * A `listLinksTo` message has the form:
   *
   * ```json
   * {
   *   name: "listLinksTo",
   *   enclosure: <string>,
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `enclosure` is the WW-side enclosure to list linked-to enclosures of.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param enclosure - The enclosure to list linked-to enclosures of.
   * @param tunnel - The tunnel index to expect a response on.
   */
  #postListLinksToMessage(enclosure: string, tunnel: number): void {
    this.#worker?.shout({ name: 'listLinksTo', enclosure, tunnel });
  }

  /**
   * Post a `listLinkedFrom` message to the {@link !Worker}.
   *
   * A `listLinkedFrom` message has the form:
   *
   * ```json
   * {
   *   name: "listLinkedFrom",
   *   enclosure: <string>,
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `enclosure` is the WW-side enclosure to list linked-from enclosures of.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param enclosure - The enclosure to list linked-from enclosures of.
   * @param tunnel - The tunnel index to expect a response on.
   */
  #postListLinkedFromMessage(enclosure: string, tunnel: number): void {
    this.#worker?.shout({ name: 'listLinkedFrom', enclosure, tunnel });
  }

  /**
   * Post a `isMuted` message to the {@link !Worker}.
   *
   * A `isMuted` message has the form:
   *
   * ```json
   * {
   *   name: "isMuted",
   *   enclosure: <string>,
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `enclosure` is the WW-side enclosure to determine mute status.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param enclosure - The enclosure to determine mute status.
   * @param tunnel - The tunnel index to expect a response on.
   */
  #postIsMutedMessage(enclosure: string, tunnel: number): void {
    this.#worker?.shout({ name: 'isMuted', enclosure, tunnel });
  }

  /**
   * Post a `getSubEnclosures` message to the {@link !Worker}.
   *
   * A `getSubEnclosures` message has the form:
   *
   * ```json
   * {
   *   name: "getSubEnclosures",
   *   enclosure: <string>,
   *   depth: <int>,
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `enclosure` is the WW-side enclosure to determine the sub enclosures of.
   * - `depth` is the maximum enclosure depth to retrieve, `0` meaning unlimited.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param enclosure - The enclosure to determine the sub enclosures of.
   * @param depth - The maximum enclosure depth to retrieve, or `0` for unlimited.
   * @param tunnel - The tunnel index to expect a response on.
   */
  #postGetSubEnclosuresMessage(enclosure: string, depth: number, tunnel: number): void {
    this.#worker?.shout({ name: 'getSubEnclosures', enclosure, depth, tunnel });
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Create a new tunnel with the given resolution and rejection callbacks, returning the index of the created tunnel.
   *
   * @param resolve - The resolution callback.
   * @param reject - The rejection callback.
   * @returns The created tunnel's index.
   */
  #addTunnel(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolve: (arg: any) => void,
    reject: (error: Error) => void,
  ): number {
    return this.#tunnels.push({ resolve, reject }) - 1;
  }

  /**
   * Remove the given tunnel and return its former resolution / rejection callbacks.
   *
   * @param tunnel - The tunnel to remove.
   * @returns The resolution / rejection callbacks that used to be at the given index.
   * @throws {@link !Error} if the given tunnel index does not exist.
   */
  #removeTunnel(tunnel: number): {
    resolve: (arg: unknown) => void;
    reject: (error: Error) => void;
  } {
    if (!(tunnel in this.#tunnels)) {
      throw new Error(`tunnel ${tunnel.toString()} does not exist`);
    }
    const result: {
      resolve: (arg: unknown) => void;
      reject: (error: Error) => void;
    } = this.#tunnels[tunnel] || { resolve: () => {}, reject: () => {} };
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete, @typescript-eslint/no-array-delete
    delete this.#tunnels[tunnel];
    return result;
  }

  /**
   * Resolve the given tunnel with the given arguments, removing the tunnel from the tunnels list.
   *
   * @param tunnel - Tunnel to resolve.
   * @param arg - Argument to pass on to the resolution callback.
   * @throws {@link !Error} if the given tunnel index does not exist.
   */
  #resolveTunnel(tunnel: number, arg: unknown): void {
    this.#removeTunnel(tunnel).resolve(arg);
  }

  /**
   * Reject the given tunnel with the given error object, removing the tunnel from the tunnels list.
   *
   * @param tunnel - Tunnel to reject.
   * @param error - {@link !Error} to pass on to the rejection callback.
   * @throws {@link !Error} if the given tunnel index does not exist.
   */
  #rejectTunnel(tunnel: number, error: Error): void {
    this.#removeTunnel(tunnel).reject(error);
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Call the given predefined function ID with the given arguments, resolving or rejecting the given tunnel ID with the result or error.
   *
   * @param enclosure - Enclosure to use.
   * @param tunnel - Tunnel to use for resolution / rejection signalling.
   * @param idx - The predefined function index to call.
   * @param args - The arguments to forward to the predefined function called.
   */
  #callPredefined(enclosure: string, tunnel: number, idx: number, args: unknown[]): void {
    this.#castEvent(`${enclosure}:predefined:call`, idx, args);
    if (idx in this.#predefined) {
      try {
        this.#postResolveMessage(tunnel, this.#predefined[idx]?.bind(undefined)(...args));
        this.#castEvent(`${enclosure}:predefined:call:ok`, idx, args);
      } catch (e) {
        this.#postRejectMessage(tunnel, e instanceof Error ? e.message : 'unknown error');
        this.#castEvent(`${enclosure}:predefined:call:error`, idx, args, e);
      }
    } else {
      this.#postRejectMessage(tunnel, `unknown function index ${idx.toString()}`);
      this.#castEvent(
        `${enclosure}:predefined:call:error`,
        idx,
        args,
        new Error(`unknown function index ${idx.toString()}`),
      );
    }
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Handle the {@link !Worker}'s `message` event's data.
   *
   * Handling a {@link !Worker}'s `message` event's data entails:
   *
   * 1. handling the specific `name` therein (only `resolve`, `reject`, `call`, and `emit` are supported).
   * 2. executing the corresponding sub-handler.
   * 3. if the `name` is not supported, try to signal rejection to the tunnel index if existing, or simply emit an error message otherwise.
   *
   * @param data - The message's `data` field, a JSON-encoded string.
   */
  #messageHandler(data: string): void {
    try {
      const parsedData: Record<string, unknown> = JSON.parse(data) as Record<string, unknown>;
      switch (parsedData.name) {
        case 'pong':
          this.#lastPong = Date.now();
          break;
        case 'resolve':
          {
            const { tunnel, payload }: { tunnel: number; payload: unknown } = parsedData as {
              tunnel: number;
              payload: unknown;
            };
            this.#resolveTunnel(tunnel, payload);
          }
          break;
        case 'reject':
          {
            const { tunnel, error }: { tunnel: number; error: string } = parsedData as {
              tunnel: number;
              error: string;
            };
            this.#rejectTunnel(tunnel, new Error(error));
          }
          break;
        case 'call':
          {
            const {
              enclosure,
              tunnel,
              idx,
              args,
            }: {
              enclosure: string;
              tunnel: number;
              idx: number;
              args: unknown[];
            } = parsedData as {
              enclosure: string;
              tunnel: number;
              idx: number;
              args: unknown[];
            };
            this.#callPredefined(enclosure, tunnel, idx, args);
          }
          break;
        case 'emit':
          {
            const { event, args }: { event: string; args: unknown[] } = parsedData as {
              event: string;
              args: unknown[];
            };
            this.#castEvent(event, args);
          }
          break;
        default: {
          if ('string' === typeof parsedData.name) {
            if ('tunnel' in parsedData) {
              this.#postRejectMessage(parsedData.tunnel as number, `unknown event name ${parsedData.name}`);
            }
            throw new Error(`unknown event name ${parsedData.name}`);
          } else {
            throw new Error('malformed event');
          }
        }
      }
    } catch (e) {
      this.#castEvent('worker:error', e);
    }
  }

  /**
   * Handle the {@link !Worker}'s `error` event.
   *
   * Handling a {@link !Worker}'s `error` event simply entails casting a `worker:error` event.
   *
   * @param error - Error to handle.
   */
  #errorHandler(error: Error): void {
    this.#castEvent('worker:error', error.message);
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Perform the stoppage steps on the {@link !Worker} and reject all pending tunnels.
   *
   * Stopping a Vm instance entails:
   *
   * 1. Clearing the pinger.
   * 2. Calling {@link WorkerInterface.kill} on the VM's {@link WorkerInterface}.
   * 3. Rejecting all existing tunnels.
   *
   * NOTE: this method does NOT return a {@link !Promise}, it rather accepts the `resolve` and `reject` callbacks required to serve a {@link !Promise}.
   *
   * @param resolve - Resolution callback: called if shutting down completed successfully.
   * @param reject - Rejection callback: called if anything went wrong with shutting down.
   */
  #doStop(resolve?: () => void, reject?: (error: Error) => void): void {
    this.#castEvent('stop');
    try {
      if ('stopped' !== this.#state) {
        this.#state = 'stopped';

        clearTimeout(this.#bootTimeout);
        clearInterval(this.#pinger);
        this.#worker?.kill();

        this.#bootTimeout = undefined;
        this.#pinger = undefined;
        this.#worker = undefined;

        this.#tunnels.forEach((_: unknown, idx: number): void => {
          try {
            this.#rejectTunnel(idx, new Error('stopped'));
          } catch (e) {
            this.#castEvent('stop:error:ignored', e);
          }
        });
        this.#tunnels = [];
      }
    } catch (e) {
      this.#castEvent('stop:error', e);
      reject?.(e instanceof Error ? e : new Error('unknown error'));
    }
    this.#castEvent('stop:ok');
    resolve?.();
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Start the {@link !Worker} and wait for its boot-up sequence to complete.
   *
   * Starting a VM instance consists of the following:
   *
   * 1. Initializing a {@link !Worker} instance with the worker code.
   * 2. Setting up the boot timeout callback (in case the {@link !Worker} takes too much time to boot).
   * 3. Setting up the event listeners for `message`, `error`, and `messageerror`.
   *
   * @param timeout - Milliseconds to wait for the {@link !Worker} to complete its boot-up sequence.
   * @returns A {@link !Promise} that resolves with a pair of boot duration times (as measured from "inside" and "outside" of the {@link !Worker} respectively) if the {@link !Worker} was successfully booted up, and rejects with an {@link !Error} in case errors are found.
   */
  start(
    workerBuilder?: WorkerBuilder,
    timeout?: number,
    pingInterval?: number,
    pongLimit?: number,
  ): Promise<[number, number]> {
    return new Promise<[number, number]>(
      (resolve: (bootTimes: [number, number]) => void, reject: (error: Error) => void): void => {
        this.#castEvent('start');
        try {
          this.#assertCreated();

          const theWorkerBuilder: WorkerBuilder =
            workerBuilder ?? ((code: string, tunnel: number, name: string) => new BrowserWorker(code, tunnel, name));
          const theTimeout: number = validateTimeDelta(timeout ?? _defaultBootTimeout);
          const thePingInterval: number = validateTimeDelta(pingInterval ?? _defaultPingInterval);
          const thePongLimit: number = validateNonNegativeInteger(pongLimit ?? _defaultPongLimit);

          this.#state = 'booting';

          const externalBootTime: number = Date.now();
          const bootResolve: (internalBootTime: number) => void = (internalBootTime: number): void => {
            clearTimeout(this.#bootTimeout);
            this.#bootTimeout = undefined;

            this.#lastPong = Date.now();
            this.#pinger = setInterval(() => {
              const delta: number = Date.now() - (this.#lastPong ?? -Infinity);
              if (thePongLimit < delta) {
                this.#castEvent('worker:unresponsive', delta);
                this.#doStop();
              }
              this.#postPingMessage();
            }, thePingInterval);

            this.#state = 'running';
            this.#castEvent('start:ok');

            resolve([internalBootTime, Date.now() - externalBootTime]);
          };
          const bootReject: (error: Error) => void = (error: Error): void => {
            this.#castEvent('start:error', error);
            this.stop().then(
              (): void => {
                reject(error);
              },
              (): void => {
                reject(error);
              },
            );
          };

          const bootTunnel: number = this.#addTunnel(bootResolve, bootReject);

          this.#bootTimeout = setTimeout((): void => {
            this.#rejectTunnel(bootTunnel, new Error('boot timed out'));
          }, theTimeout);

          this.#worker = theWorkerBuilder(workerCode.toString(), bootTunnel, this.name).listen(
            (data: string): void => {
              this.#messageHandler(data);
            },
            (error: Error): void => {
              this.#errorHandler(error);
            },
          );
        } catch (e) {
          this.#castEvent('start:error', e);
          reject(e instanceof Error ? e : new Error('unknown error'));
        }
      },
    );
  }

  /**
   * Shut the {@link !Worker} down.
   *
   * Shutting a VM instance consists of the following:
   *
   * 1. Emitting the "shutdown" event on the {@link !Worker}.
   * 2. Waiting for the given timeout milliseconds.
   * 3. Removing all root enclosures.
   * 4. Calling {@link NomadVM.stop} to finish the shutdown process.
   *
   * @param timeout - Milliseconds to wait for the {@link !Worker} to shut down.
   * @returns A {@link !Promise} that resolves with `void` if the {@link !Worker} was successfully shut down, and rejects with an {@link !Error} in case errors are found.
   */
  shutdown(timeout?: number): Promise<void> {
    return new Promise<void>((resolve: () => void, reject: (error: Error) => void): void => {
      const theTimeout: number = validateTimeDelta(timeout ?? _defaultShutdownTimeout);

      this.listRootEnclosures().then(
        (rootEnclosures: string[]) => {
          rootEnclosures.forEach((rootEnclosure: string): void => {
            this.emit(rootEnclosure, 'shutdown');
          });

          setTimeout((): void => {
            Promise.all(
              rootEnclosures.map((rootEnclosure: string): Promise<string[]> => this.deleteEnclosure(rootEnclosure)),
            ).then(
              (): void => {
                this.stop().then(
                  (): void => {
                    resolve();
                  },
                  (error: Error): void => {
                    reject(error);
                  },
                );
              },
              (error: Error): void => {
                reject(error);
              },
            );
          }, theTimeout);
        },
        (error: Error) => {
          reject(error);
        },
      );
    });
  }

  /**
   * Stop the {@link !Worker} immediately and reject all pending tunnels.
   *
   * Stopping a Vm instance entails:
   *
   * 1. Clearing the pinger.
   * 2. Calling {@link WorkerInterface.kill} on the VM's {@link WorkerInterface}.
   * 3. Rejecting all existing tunnels.
   *
   * @returns A {@link !Promise} that resolves with `void` if the stopping procedure completed successfully, and rejects with an {@link !Error} in case errors occur.
   */
  stop(): Promise<void> {
    return new Promise<void>((resolve: () => void, reject: (error: Error) => void): void => {
      this.#doStop(resolve, reject);
    });
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Create a new enclosure with the given name.
   *
   * @param enclosure - Enclosure to create.
   * @returns A {@link !Promise} that resolves with a {@link NomadVMEnclosure} wrapper if enclosure creation completed successfully, and rejects with an {@link !Error} in case errors occur.
   */
  createEnclosure(enclosure: string): Promise<NomadVMEnclosure> {
    return new Promise<NomadVMEnclosure>(
      (resolve: (nomadVmEnclosure: NomadVMEnclosure) => void, reject: (error: Error) => void): void => {
        this.#castEvent(`${enclosure}:create`);
        try {
          validateEnclosure(enclosure);

          this.#assertRunning();

          this.#postCreateMessage(
            enclosure,
            this.#addTunnel(
              (): void => {
                this.#castEvent(`${enclosure}:create:ok`);
                resolve(new NomadVMEnclosure(this, enclosure));
              },
              (error: Error): void => {
                this.#castEvent(`${enclosure}:create:error`, error);
                reject(error);
              },
            ),
          );
        } catch (e) {
          this.#castEvent(`${enclosure}:create:error`, e);
          reject(e instanceof Error ? e : new Error('unknown error'));
        }
      },
    );
  }

  /**
   * Delete the enclosure with the given name.
   *
   * This method will reject all tunnels awaiting responses on the given enclosure.
   *
   * @param enclosure - Enclosure to delete.
   * @returns A {@link !Promise} that resolves with a list of deleted enclosures (the one given and any sub enclosures of it) if enclosure deletion completed successfully, and rejects with an {@link !Error} in case errors occur.
   */
  deleteEnclosure(enclosure: string): Promise<string[]> {
    return new Promise<string[]>((resolve: (deleted: string[]) => void, reject: (error: Error) => void): void => {
      this.#castEvent(`${enclosure}:delete`);
      try {
        validateEnclosure(enclosure);

        this.#assertRunning();

        this.#postDeleteMessage(
          this.#addTunnel(
            (deleted: string[]): void => {
              this.#castEvent(`${enclosure}:delete:ok`, deleted);
              resolve(deleted);
            },
            (error: Error): void => {
              this.#castEvent(`${enclosure}:delete:error`, error);
              reject(error);
            },
          ),
          enclosure,
        );
      } catch (e) {
        this.#castEvent(`${enclosure}:delete:error`, e);
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * Merge the given enclosure to its parent.
   *
   * @param enclosure - Enclosure to merge.
   * @returns A {@link !Promise} that resolves with `void` if enclosure merging completed successfully, and rejects with an {@link !Error} in case errors occur.
   */
  mergeEnclosure(enclosure: string): Promise<void> {
    return new Promise<void>((resolve: () => void, reject: (error: Error) => void): void => {
      this.#castEvent(`${enclosure}:merge`, enclosure);
      try {
        validateEnclosure(enclosure);

        this.#assertRunning();

        this.#postMergeMessage(
          enclosure,
          this.#addTunnel(
            (): void => {
              this.#castEvent(`${enclosure}:merge:ok`, enclosure);
              resolve();
            },
            (error: Error): void => {
              this.#castEvent(`${enclosure}:merge:error`, enclosure, error);
              reject(error);
            },
          ),
        );
      } catch (e) {
        this.#castEvent(`"${enclosure}:merge:error`, enclosure, e);
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * Link one enclosure to another, so that events cast on the first are also handled in the second.
   *
   * @param enclosure - "Source" enclosure to use.
   * @param target - "Destination" enclosure to use.
   * @returns A {@link !Promise} that resolves with `void` if enclosure linking completed successfully, and rejects with an {@link !Error} in case errors occur.
   */
  linkEnclosures(enclosure: string, target: string): Promise<void> {
    return new Promise<void>((resolve: () => void, reject: (error: Error) => void): void => {
      this.#castEvent(`${enclosure}:link`, target);
      try {
        validateEnclosure(enclosure);
        validateEnclosure(target);

        this.#assertRunning();

        this.#postLinkMessage(
          enclosure,
          this.#addTunnel(
            (): void => {
              this.#castEvent(`${enclosure}:link:ok`, target);
              resolve();
            },
            (error: Error): void => {
              this.#castEvent(`${enclosure}:link:error`, target, error);
              reject(error);
            },
          ),
          target,
        );
      } catch (e) {
        this.#castEvent(`"${enclosure}:link:error`, target, e);
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * Unlink one enclosure from another, so that events cast on the first are no longer handled in the second.
   *
   * @param enclosure - "Source" enclosure to use.
   * @param target - "Destination" enclosure to use.
   * @returns A {@link !Promise} that resolves with a boolean indicating whether the target enclosure was previously linked if enclosure unlinking completed successfully, and rejects with an {@link !Error} in case errors occur.
   */
  unlinkEnclosures(enclosure: string, target: string): Promise<boolean> {
    return new Promise<boolean>((resolve: (unlinked: boolean) => void, reject: (error: Error) => void): void => {
      validateEnclosure(enclosure);
      validateEnclosure(target);

      this.#castEvent(`${enclosure}:unlink`, target);
      try {
        this.#assertRunning();

        this.#postUnlinkMessage(
          enclosure,
          this.#addTunnel(
            (unlinked: boolean): void => {
              this.#castEvent(`${enclosure}:unlink:ok`, target, unlinked);
              resolve(unlinked);
            },
            (error: Error): void => {
              this.#castEvent(`${enclosure}:unlink:error`, target, error);
              reject(error);
            },
          ),
          target,
        );
      } catch (e) {
        this.#castEvent(`${enclosure}:unlink:error`, target, e);
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * Mute the given enclosure, so that events cast on it are no longer propagated to this VM.
   *
   * @param enclosure - Enclosure to mute.
   * @returns A {@link !Promise} that resolves with the previous muting status if enclosure muting completed successfully, and rejects with an {@link !Error} in case errors occur.
   */
  muteEnclosure(enclosure: string): Promise<boolean> {
    return new Promise<boolean>((resolve: (previous: boolean) => void, reject: (error: Error) => void): void => {
      this.#castEvent(`${enclosure}:muteEnclosure`);
      try {
        validateEnclosure(enclosure);

        this.#assertRunning();

        this.#postMuteMessage(
          enclosure,
          this.#addTunnel(
            (previous: boolean): void => {
              this.#castEvent(`${enclosure}:mute:ok`, previous);
              resolve(previous);
            },
            (error: Error): void => {
              this.#castEvent(`${enclosure}:mute:error`, error);
              reject(error);
            },
          ),
        );
      } catch (e) {
        this.#castEvent(`${enclosure}:mute:error`, e);
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * Unmute the given enclosure, so that events cast on it are propagated to this VM.
   *
   * @param enclosure - Enclosure to unmute.
   * @returns A {@link !Promise} that resolves with he previous muting status if enclosure un-muting completed successfully, and rejects with an {@link !Error} in case errors occur.
   */
  unmuteEnclosure(enclosure: string): Promise<boolean> {
    return new Promise<boolean>((resolve: (prev: boolean) => void, reject: (error: Error) => void): void => {
      this.#castEvent(`${enclosure}:unmute`);
      try {
        validateEnclosure(enclosure);

        this.#assertRunning();

        this.#postUnmuteMessage(
          enclosure,
          this.#addTunnel(
            (prev: boolean): void => {
              this.#castEvent(`${enclosure}:unmute:ok`, prev);
              resolve(prev);
            },
            (error: Error): void => {
              this.#castEvent(`${enclosure}:unmute:error`, error);
              reject(error);
            },
          ),
        );
      } catch (e) {
        this.#castEvent(`${enclosure}:unmute:error`, e);
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * List the root enclosures created.
   *
   * @returns A {@link !Promise} that resolves with a list of root enclosures created if successful, and rejects with an {@link !Error} in case errors occur.
   */
  listRootEnclosures(): Promise<string[]> {
    return new Promise<string[]>(
      (resolve: (rootEnclosures: string[]) => void, reject: (error: Error) => void): void => {
        try {
          this.#assertRunning();

          this.#postListRootEnclosuresMessage(this.#addTunnel(resolve, reject));
        } catch (e) {
          reject(e instanceof Error ? e : new Error('unknown error'));
        }
      },
    );
  }

  /**
   * List the dependencies (user-level and predefined) installed on the given enclosure or its prefixes.
   *
   * @param enclosure - Enclosure to list installed dependencies of.
   * @returns A {@link !Promise} that resolves with a list of installed dependency names if successful, and rejects with an {@link !Error} in case errors occur.
   */
  listInstalled(enclosure: string): Promise<string[]> {
    return new Promise<string[]>((resolve: (installed: string[]) => void, reject: (error: Error) => void): void => {
      try {
        validateEnclosure(enclosure);

        this.#assertRunning();

        this.#postListInstalledMessage(enclosure, this.#addTunnel(resolve, reject));
      } catch (e) {
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * List the enclosures the given one is linked to.
   *
   * @param enclosure - Enclosure to list linked-to enclosures of.
   * @returns A {@link !Promise} that resolves with a list of linked-to enclosures if successful, and rejects with an {@link !Error} in case errors occur.
   */
  listLinksTo(enclosure: string): Promise<string[]> {
    return new Promise<string[]>((resolve: (linksTo: string[]) => void, reject: (error: Error) => void): void => {
      try {
        validateEnclosure(enclosure);

        this.#assertRunning();

        this.#postListLinksToMessage(enclosure, this.#addTunnel(resolve, reject));
      } catch (e) {
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * List the enclosures that link to the given one.
   *
   * @param enclosure - Enclosure to list linked-from enclosures of.
   * @returns A {@link !Promise} that resolves with a list of linked-from enclosures if successful, and rejects with an {@link !Error} in case errors occur.
   */
  listLinkedFrom(enclosure: string): Promise<string[]> {
    return new Promise<string[]>((resolve: (linkedFrom: string[]) => void, reject: (error: Error) => void): void => {
      try {
        validateEnclosure(enclosure);

        this.#assertRunning();

        this.#postListLinkedFromMessage(enclosure, this.#addTunnel(resolve, reject));
      } catch (e) {
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * Determine whether the given enclosure is muted.
   *
   * @param enclosure - Enclosure to determine mute status of.
   * @returns A {@link !Promise} that resolves with a boolean value indicating whether the enclosure is muted if successful, and rejects with an {@link !Error} in case errors occur.
   */
  isMuted(enclosure: string): Promise<boolean> {
    return new Promise<boolean>((resolve: (muted: boolean) => void, reject: (error: Error) => void): void => {
      try {
        validateEnclosure(enclosure);

        this.#assertRunning();

        this.#postIsMutedMessage(enclosure, this.#addTunnel(resolve, reject));
      } catch (e) {
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * List the given enclosure's sub enclosures.
   *
   * @param enclosure - Enclosure to list the sub enclosures of.
   * @param depth - Maximum enclosure depth to retrieve results for, defaults to retrieving all.
   * @returns A {@link !Promise} that resolves with a list of sub enclosures enclosures if successful, and rejects with an {@link !Error} in case errors occur.
   */
  getSubEnclosures(enclosure: string, depth?: number): Promise<string[]> {
    return new Promise<string[]>((resolve: (subEnclosures: string[]) => void, reject: (error: Error) => void): void => {
      const theDepth: number = validateNonNegativeInteger(depth ?? 0);
      try {
        validateEnclosure(enclosure);

        this.#assertRunning();

        this.#postGetSubEnclosuresMessage(enclosure, theDepth, this.#addTunnel(resolve, reject));
      } catch (e) {
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Add a predefined function to the VM's list under the given enclosure.
   *
   * @param enclosure - Enclosure to use.
   * @param name - Function name to add.
   * @param callback - {@link !Function} callback to use.
   * @returns A {@link !Promise} that resolves with `void` if the {@link !Function} was correctly predefined, and rejects with an {@link !Error} in case errors occurred.
   */
  predefine(enclosure: string, name: string, callback: (...args: unknown[]) => unknown): Promise<void> {
    return new Promise<void>((resolve: () => void, reject: (error: Error) => void): void => {
      const idx: number =
        this.#predefined.push(() => {
          throw new Error('SHOULD NEVER HAPPEN');
        }) - 1;
      this.#castEvent(`${enclosure}:predefined:add`, name, callback, idx);
      try {
        validateEnclosure(enclosure);

        this.#assertRunning();
        this.#postPredefineMessage(
          enclosure,
          this.#addTunnel(
            (): void => {
              this.#predefined[idx] = callback;
              this.#castEvent(`${enclosure}:predefined:add:ok`, name, callback, idx);
              resolve();
            },
            (error: Error): void => {
              // eslint-disable-next-line @typescript-eslint/no-array-delete, @typescript-eslint/no-dynamic-delete
              delete this.#predefined[idx];
              this.#castEvent(`${enclosure}:predefined:add:error`, name, callback, idx, error);
              reject(error);
            },
          ),
          idx,
          validateIdentifier(name),
        );
      } catch (e) {
        this.#castEvent(`${enclosure}:predefined:add:error`, name, callback, idx, e);
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * Install the given {@link Dependency} on the {@link !Worker}.
   *
   * @param enclosure - Enclosure to use.
   * @param dependency - The {@link Dependency} to install.
   * @returns A {@link !Promise} that resolves with `void` if the {@link Dependency} was correctly installed, and rejects with an {@link !Error} in case errors occurred.
   */
  install(enclosure: string, dependency: DependencyInterface): Promise<void> {
    return new Promise<void>((resolve: () => void, reject: (error: Error) => void): void => {
      this.#castEvent(`${enclosure}:install`, dependency);
      try {
        validateEnclosure(enclosure);

        if (!(dependency instanceof Dependency)) {
          throw new Error('can only install Dependency');
        }
        this.#assertRunning();

        this.#postInstallMessage(
          enclosure,
          this.#addTunnel(
            (): void => {
              this.#castEvent(`${enclosure}:install:ok`, dependency);
              resolve();
            },
            (error: Error): void => {
              this.#castEvent(`${enclosure}:install:error`, dependency, error);
              reject(error);
            },
          ),
          dependency.asObject(),
        );
      } catch (e) {
        this.#castEvent(`${enclosure}:install:error`, dependency, e);
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * Execute the given {@link Dependency} with the given arguments map in the {@link !Worker}.
   *
   * @param enclosure - The enclosure to use.
   * @param dependency - The {@link Dependency} to execute.
   * @param args - The arguments map to execute with.
   * @returns A {@link !Promise} that resolves with the {@link Dependency}'s execution result, and rejects with an {@link !Error} in case errors occurred.
   */
  execute(enclosure: string, dependency: DependencyInterface, args?: Map<string, unknown>): Promise<unknown> {
    return new Promise<unknown>((resolve: (result: unknown) => void, reject: (error: Error) => void): void => {
      try {
        validateEnclosure(enclosure);
        const theArgs: Map<string, unknown> = validateArgumentsMap(args ?? new Map<string, unknown>());

        this.#castEvent(`${enclosure}:execute`, dependency, theArgs);

        if (!(dependency instanceof Dependency)) {
          throw new Error('can only execute Dependency');
        }
        this.#assertRunning();

        this.#postExecuteMessage(
          enclosure,
          this.#addTunnel(
            (result: unknown): void => {
              this.#castEvent(`${enclosure}:execute:ok`, dependency, theArgs, result);
              resolve(result);
            },
            (error: Error): void => {
              this.#castEvent(`${enclosure}:execute:error`, dependency, theArgs, error);
              reject(error);
            },
          ),
          dependency.asObject(),
          theArgs,
        );
      } catch (e) {
        this.#castEvent(`${enclosure}:execute:error`, dependency, args, e);
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * Install the given {@link Dependency} iterable, by sorting them topologically and installing each one in turn.
   *
   * @param enclosure - Enclosure to use.
   * @param dependencies - Dependencies to install.
   * @returns A {@link !Promise} that resolves with `void` if every {@link Dependency} in the iterable was correctly installed, and rejects with an {@link !Error} in case errors occurred.
   */
  installAll(enclosure: string, dependencies: Iterable<Dependency>): Promise<void> {
    return new Promise<void>((resolve: () => void, reject: (error: Error) => void): void => {
      try {
        this.createEnclosure(`${enclosure}.tmp_${_pseudoRandomString()}`).then(
          (wrapper: NomadVMEnclosure): void => {
            wrapper.listInstalled().then(
              (installed: string[]): void => {
                Promise.all(
                  sort(dependencies, installed).map((dependency: DependencyInterface) => wrapper.install(dependency)),
                ).then(
                  (): void => {
                    this.mergeEnclosure(wrapper.enclosure).then(
                      (): void => {
                        resolve();
                      },
                      (error: Error): void => {
                        this.deleteEnclosure(wrapper.enclosure).then(
                          () => {
                            reject(error);
                          },
                          () => {
                            reject(error);
                          },
                        );
                      },
                    );
                  },
                  (error: Error): void => {
                    this.deleteEnclosure(wrapper.enclosure).then(
                      () => {
                        reject(error);
                      },
                      () => {
                        reject(error);
                      },
                    );
                  },
                );
              },
              (error: Error): void => {
                this.deleteEnclosure(wrapper.enclosure).then(
                  () => {
                    reject(error);
                  },
                  () => {
                    reject(error);
                  },
                );
              },
            );
          },
          (error: Error): void => {
            reject(error);
          },
        );
      } catch (e) {
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Emit an event towards the {@link !Worker}.
   *
   * @param enclosure - Enclosure to use.
   * @param event - Event name to emit.
   * @param args - Associated arguments to emit alongside the event.
   * @returns `this`, for chaining.
   */
  emit(enclosure: string, event: string, ...args: unknown[]): this {
    this.#postEmitMessage(validateEnclosure(enclosure), validateEvent(event), args);
    return this;
  }
}

export const create = (name?: string): NomadInterface => {
  return new NomadVM(name);
};

/**
 * A {@link NomadVM} enclosure interface wrapper object.
 *
 */
export class NomadVMEnclosure implements NomadEnclosureInterface {
  static {
    // ref: https://stackoverflow.com/a/77741904
    Object.setPrototypeOf(this.prototype, null);
  }

  /**
   * The {@link NomadVM} instance to wrap.
   *
   */
  #vm: NomadInterface;

  /**
   * The enclosure to wrap for.
   *
   */
  #enclosure: string;

  /**
   * Create a new {@link NomadVMEnclosure} wrapper around the given {@link NomadVM} for the given enclosure.
   *
   * @param vm - The VM instance to wrap.
   * @param enclosure - The enclosure to wrap for.
   * @throws {@link !Error} if the given VM is not a {@link NomadVM} instance.
   * @throws {@link !Error} if the given enclosure is not a string.
   */
  constructor(vm: NomadInterface, enclosure: string) {
    if ('string' !== typeof enclosure) {
      throw new Error('expected enclosure to be a string');
    }

    this.#vm = vm;
    this.#enclosure = enclosure;
  }

  /**
   * Getter used to retrieve the wrapped {@link NomadVM}.
   *
   */
  get vm(): NomadInterface {
    return this.#vm;
  }

  /**
   * Getter used to retrieve the wrapped enclosure.
   *
   */
  get enclosure(): string {
    return this.#enclosure;
  }

  /**
   * Attach the given callback to the wrapped VM's event caster, triggered on events matching the given filter on the wrapped enclosure.
   *
   * @param filter - Event name filter to assign the listener to.
   * @param callback - Callback to call on a matching event being cast.
   * @returns `this`, for chaining.
   * @see {@link NomadVM.onThis} for additional exceptions thrown.
   */
  onThis(filter: string, callback: (...args: unknown[]) => void): this {
    this.vm.onThis(`${this.enclosure}:${filter}`, callback);
    return this;
  }

  /**
   * Attach the given callback to the wrapped VM's caster, triggered on events matching the given filter on the wrapped enclosure, and removed upon being called once.
   *
   * @param filter - Event name filter to assign the listener to.
   * @param callback - Callback to call on a matching event being cast.
   * @returns `this`, for chaining.
   * @see {@link NomadVM.onThis} for additional exceptions thrown.
   */
  onceThis(filter: string, callback: (...args: unknown[]) => void): this {
    this.vm.onceThis(`${this.enclosure}:${filter}`, callback);
    return this;
  }

  /**
   * Link the wrapped enclosure to another, so that events cast on the wrapped enclosure are also handled in the other.
   *
   * @param target - "Destination" enclosure to use.
   * @returns A {@link !Promise} that resolves with `void` if enclosure linking completed successfully, and rejects with an {@link !Error} in case errors occur.
   * @see {@link NomadVM.linkEnclosures} for additional exceptions thrown.
   */
  link(target: string): Promise<void> {
    return this.vm.linkEnclosures(this.enclosure, target);
  }

  /**
   * Unlink the wrapped enclosure from another, so that events cast on the wrapped enclosure are no longer handled in the other.
   *
   * @param target - "Destination" enclosure to use.
   * @returns A {@link !Promise} that resolves with a boolean indicating whether the target enclosure was previously linked if enclosure unlinking completed successfully, and rejects with an {@link !Error} in case errors occur.
   * @see {@link NomadVM.unlinkEnclosures} for additional exceptions thrown.
   */
  unlink(target: string): Promise<boolean> {
    return this.vm.unlinkEnclosures(this.enclosure, target);
  }

  /**
   * Mute the wrapped enclosure, so that events cast on it are no longer propagated to the wrapped VM.
   *
   * @returns A {@link !Promise} that resolves with the previous muting status if enclosure muting completed successfully, and rejects with an {@link !Error} in case errors occur.
   * @see {@link NomadVM.muteEnclosure} for additional exceptions thrown.
   */
  mute(): Promise<boolean> {
    return this.vm.muteEnclosure(this.enclosure);
  }

  /**
   * Unmute the wrapped enclosure, so that events cast on it are propagated to wrapped VM.
   *
   * @returns A {@link !Promise} that resolves with he previous muting status if enclosure un-muting completed successfully, and rejects with an {@link !Error} in case errors occur.
   * @see {@link NomadVM.unmuteEnclosure} for additional exceptions thrown.
   */
  unmute(): Promise<boolean> {
    return this.vm.unmuteEnclosure(this.enclosure);
  }

  /**
   * List the dependencies (user-level and predefined) installed on the wrapped enclosure or its prefixes
   *
   * @returns A {@link !Promise} that resolves with a list of installed dependency names if successful, and rejects with an {@link !Error} in case errors occur.
   * @see {@link NomadVM.listInstalled} for additional exceptions thrown.
   */
  listInstalled(): Promise<string[]> {
    return this.vm.listInstalled(this.enclosure);
  }

  /**
   * List the enclosures the wrapped one is linked to.
   *
   * @returns A {@link !Promise} that resolves with a list of linked-to enclosures if successful, and rejects with an {@link !Error} in case errors occur.
   * @see {@link NomadVM.listLinksTo} for additional exceptions thrown.
   */
  listLinksTo(): Promise<string[]> {
    return this.vm.listLinksTo(this.enclosure);
  }

  /**
   * List the enclosures that link to the wrapped one.
   *
   * @returns A {@link !Promise} that resolves with a list of linked-from enclosures if successful, and rejects with an {@link !Error} in case errors occur.
   * @see {@link NomadVM.listLinkedFrom} for additional exceptions thrown.
   */
  listLinkedFrom(): Promise<string[]> {
    return this.vm.listLinkedFrom(this.enclosure);
  }

  /**
   * Determine whether the wrapped enclosure is muted.
   *
   * @returns A {@link !Promise} that resolves with a boolean value indicating whether the wrapped enclosure is muted if successful, and rejects with an {@link !Error} in case errors occur.
   * @see {@link NomadVM.isMuted} for additional exceptions thrown.
   */
  isMuted(): Promise<boolean> {
    return this.vm.isMuted(this.enclosure);
  }

  /**
   * List the wrapped enclosure's sub enclosures.
   *
   * @param depth - Maximum enclosure depth to retrieve results for, defaults to retrieving all.
   * @returns A {@link !Promise} that resolves with a list of sub enclosures if successful, and rejects with an {@link !Error} in case errors occur.
   * @see {@link NomadVM.getSubEnclosures} for additional exceptions thrown.
   */
  getSubEnclosures(depth?: number): Promise<string[]> {
    return this.vm.getSubEnclosures(this.enclosure, depth);
  }

  /**
   * Add a predefined function to the VM's list under the wrapped enclosure.
   *
   * @param name - Function name to add.
   * @param callback - {@link !Function} callback to use.
   * @returns A {@link !Promise} that resolves with `void` if the {@link !Function} was correctly predefined, and rejects with an {@link !Error} in case errors occurred.
   * @see {@link NomadVM.predefine} for additional exceptions thrown.
   */
  predefine(name: string, callback: (...args: unknown[]) => unknown): Promise<void> {
    return this.vm.predefine(this.enclosure, name, callback);
  }

  /**
   * Install the given {@link Dependency} on the wrapped VM under the wrapped enclosure.
   *
   * @param dependency - The {@link Dependency} to install.
   * @returns A {@link !Promise} that resolves with `void` if the {@link Dependency} was correctly installed, and rejects with an {@link !Error} in case errors occurred.
   * @see {@link NomadVM.install} for additional exceptions thrown.
   */
  install(dependency: DependencyInterface): Promise<void> {
    return this.vm.install(this.enclosure, dependency);
  }

  /**
   * Execute the given {@link Dependency} with the given arguments map in the wrapped VM under the wrapped enclosure.
   *
   * @param dependency - The {@link Dependency} to execute.
   * @param args - The arguments map to execute with.
   * @returns A {@link !Promise} that resolves with the {@link Dependency}'s execution result, and rejects with an {@link !Error} in case errors occurred.
   * @see {@link NomadVM.execute} for additional exceptions thrown.
   */
  execute(dependency: DependencyInterface, args?: Map<string, unknown>): Promise<unknown> {
    return this.vm.execute(this.enclosure, dependency, args);
  }

  /**
   * Install the given {@link Dependency} iterable, by sorting them topologically and installing each one in turn.
   *
   * @param dependencies - Dependencies to install.
   * @returns A {@link !Promise} that resolves with `void` if every {@link Dependency} in the iterable was correctly installed, and rejects with an {@link !Error} in case errors occurred.
   * @see {@link NomadVM.installAll} for additional exceptions thrown.
   */
  installAll(dependencies: Iterable<Dependency>): Promise<void> {
    return this.vm.installAll(this.enclosure, dependencies);
  }
}
