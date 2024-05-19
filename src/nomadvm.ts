'use strict';

import type { DependencyObject } from './dependency';
import type { Cast, EventCallback, ProtectedMethods } from './eventCaster';

import {
  namespace as validateNamespace,
  timeout as validateTimeout,
  nonNegativeInteger as validateNonNegativeInteger,
  identifier as validateIdentifier,
  argumentsMap as validateArgumentsMap,
} from './validation';

import { EventCaster } from './eventCaster';
import { Dependency } from './dependency';

import workerRunner from './worker.cjs';

/**
 * A safe execution environment for NOMAD code execution.
 *
 */
class NomadVM extends EventCaster {
  /**
   * Generate a pseudo-random string.
   *
   * NOTE: this is NOT cryptographically-secure, it simply calls {@link Math.random}.
   *
   * @returns A pseudo-random string.
   */
  static #pseudoRandomString(): string {
    return Math.trunc(Math.random() * 4294967296)
      .toString(16)
      .padStart(8, '0');
  }

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
   * - `nomadvm:{NAME}:worker:warning(vm, error)`: when the {@link Worker} encounters a non-fatal, yet reportable, error `error`.
   * - `nomadvm:{NAME}:worker:error(vm, error)`: when the {@link Worker} encounters a fatal error `error`.
   * - `nomadvm:{NAME}:worker:unresponsive(vm, delta)`: when the {@link Worker} fails to respond to ping / pong messages for `delta` milliseconds.
   * - `nomadvm:{NAME}:{NAMESPACE}:predefined:call(vm, idx, args)`: when a predefined function with index `idx` is being called with arguments `args` on the `vm` VM.
   * - `nomadvm:{NAME}:{NAMESPACE}:predefined:call:ok(vm, idx, args)`: when a predefined function with index `idx` has been successfully called with arguments `args` on the `vm` VM.
   * - `nomadvm:{NAME}:{NAMESPACE}:predefined:call:error(vm, idx, args, error)`: when a predefined function with index `idx` has failed to be called with arguments `args` on the `vm` VM with error `error`.
   * - `nomadvm:{NAME}:{NAMESPACE}:predefined:add(vm, name, callback, idx)`: when a predefined function with name `name`, index `idx`, and implementation `callback` is being added to the `vm` VM.
   * - `nomadvm:{NAME}:{NAMESPACE}:predefined:add:ok(vm, name, callback, idx)`: when a predefined function with name `name`, index `idx`, and implementation `callback` has been successfully added to the `vm` VM.
   * - `nomadvm:{NAME}:{NAMESPACE}:predefined:add:error(vm, name, callback, idx, error)`: when a predefined function with name `name`, index `idx`, and implementation `callback` has failed to be added to the `vm` VM with error `error`
   * - `nomadvm:{NAME}:{NAMESPACE}:create(vm)`: when a new namespace is being created on VM `vm`.
   * - `nomadvm:{NAME}:{NAMESPACE}:create:ok(vm)`: when a new namespace has been successfully created on VM `vm`.
   * - `nomadvm:{NAME}:{NAMESPACE}:create:error(vm, error)`: when a new namespace has failed to be created on VM `vm` with error `error`.
   * - `nomadvm:{NAME}:{NAMESPACE}:delete(vm)`: when a namespace is being deleted from VM `vm`.
   * - `nomadvm:{NAME}:{NAMESPACE}:delete:ok(vm, deleted)`: when namespaces `deleted` have been successfully deleted from VM `vm`.
   * - `nomadvm:{NAME}:{NAMESPACE}:delete:error(vm, error)`: when a namespace has failed to be deleted from VM `vm` with error `error`.
   * - `nomadvm:{NAME}:{NAMESPACE}:assimilate(vm, namespace)`: when a namespace `namespace` is being assimilated to its parent from VM `vm`.
   * - `nomadvm:{NAME}:{NAMESPACE}:assimilate:ok(vm, namespace)`: when namespace `namespace` has been successfully assimilated to its parent on VM `vm`.
   * - `nomadvm:{NAME}:{NAMESPACE}:assimilate:error(vm, namespace, error)`: when a namespace `namespace` has failed to be assimilated to its parent in VM `vm` with error `error`.
   * - `nomadvm:{NAME}:{NAMESPACE}:link(vm, target)`: when a namespace is being linked to the `target` one on VM `vm`.
   * - `nomadvm:{NAME}:{NAMESPACE}:link:ok(vm, target)`: when a namespace has been successfully linked to the `target` one on VM `vm`.
   * - `nomadvm:{NAME}:{NAMESPACE}:link:error(vm, target, error)`: when a namespace has failed to be linked to the `target` one on VM `vm` with error `error`.
   * - `nomadvm:{NAME}:{NAMESPACE}:unlink(vm, target)`: when a namespace is being unlinked to the `target` one on VM `vm`.
   * - `nomadvm:{NAME}:{NAMESPACE}:unlink:ok(vm, target, unlinked)`: when a namespace has been successfully unlinked to the `target` one on VM `vm`, `unlinked` will be `true` if the target namespace was previously linked.
   * - `nomadvm:{NAME}:{NAMESPACE}:unlink:error(vm, target, error)`: when a namespace has failed to be unlinked to the `target` one on VM `vm` with error `error`.
   * - `nomadvm:{NAME}:{NAMESPACE}:mute(vm)`: when a namespace is being muted on VM `vm`.
   * - `nomadvm:{NAME}:{NAMESPACE}:mute:ok(vm, previous)`: when a namespace has been successfully muted on VM `vm`, where the previous muting status was `previous`..
   * - `nomadvm:{NAME}:{NAMESPACE}:mute:error(vm, error)`: when a namespace has failed to be muted on VM `vm` with error `error`.
   * - `nomadvm:{NAME}:{NAMESPACE}:unmute(vm)`: when a namespace is being unmuted on VM `vm`.
   * - `nomadvm:{NAME}:{NAMESPACE}:unmute:ok(vm, previous)`: when a namespace has been successfully unmuted on VM `vm`, where the previous muting status was `previous`.
   * - `nomadvm:{NAME}:{NAMESPACE}:unmute:error(vm, error)`: when a namespace has failed to be unmuted on VM `vm` with error `error`.
   * - `nomadvm:{NAME}:{NAMESPACE}:install(vm, dependency)`: when dependency `dependency` is being installed on the `vm` VM.
   * - `nomadvm:{NAME}:{NAMESPACE}:install:ok(vm, dependency)`: when dependency `dependency` has been successfully installed on the `vm` VM.
   * - `nomadvm:{NAME}:{NAMESPACE}:install:error(vm, dependency, error)`: when dependency `dependency` has failed to be installed on the `vm` VM with error `error`.
   * - `nomadvm:{NAME}:{NAMESPACE}:execute(vm, dependency, args)`: when dependency `dependency` is being executed on the `vm` VM with arguments `args`.
   * - `nomadvm:{NAME}:{NAMESPACE}:execute:ok(vm, dependency, args, result)`: when dependency `dependency` has been successfully executed on the `vm` VM with arguments `args`.
   * - `nomadvm:{NAME}:{NAMESPACE}:execute:error(vm, dependency, args, error)`: when dependency `dependency` has failed to be executed on the `vm` VM with arguments `args` and error `error`.
   * - `nomadvm:{NAME}:{NAMESPACE}:user:{eventname}(vm, ...args)`: when the {@link Worker} on the `vm` VM emits an event with name `EVENT` and arguments `args`.
   *
   * Internally, the {@link Worker} will cast the following events when instructed to by the VM:
   *
   * - `nomadvm:{NAME}:{NAMESPACE}:host:{eventname}(vm, ...args)`: when the VM `vm` emits an event into the {@link Worker} with name `EVENT` and arguments `args`.
   *
   */
  static #events: Readonly<EventCaster>;

  /**
   * Getter used to retrieve the VM's static event caster.
   *
   */
  static get events(): Readonly<EventCaster> {
    return NomadVM.#events;
  }

  /**
   * Prefix to use for all events emitted.
   *
   */
  static #eventPrefix: string = 'nomadvm';

  /**
   * The {@link EventCaster} casting function for all he VMs.
   *
   */
  static #castGlobal: Cast;

  static {
    this.#events = Object.freeze(
      new EventCaster((protectedMethods: ProtectedMethods): void => {
        this.#castGlobal = protectedMethods.cast;
      }),
    );
  }

  /**
   * Prefix to use for all names generated.
   *
   */
  static #namesPrefix: string = 'nomadvm';

  /**
   * Global mapping of VM names to VM {@link WeakRef}s.
   *
   */
  static #names: Map<string, WeakRef<NomadVM>> = new Map<string, WeakRef<NomadVM>>();

  /**
   * The number of milliseconds to wait between `ping` messages to the {@link Worker}.
   *
   */
  static #pingInterval: number = 100;

  /**
   * The number of milliseconds that must elapse between `pong` messages in order to consider a {@link Worker} "unresponsive".
   *
   */
  static #pongLimit: number = 1000;

  /**
   * Retrieve the VM registered under the given name.
   *
   * @param name - VM name to retrieve.
   * @returns The VM registered under the given name, or `undefined` if none found.
   */
  static get(name: string): WeakRef<NomadVM> | undefined {
    return this.#names.get(name);
  }

  /**
   * The {@link EventCaster} casting function for the current VM.
   *
   */
  #castLocal: Cast;

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
   * - `booting`: the {@link NomadVM.start} method is waiting for the {@link Worker} boot-up sequence to finish.
   * - `running`: the {@link NomadVM} instance is running and waiting for commands.
   * - `stopped`: the {@link NomadVM} instance has been stopped and no further commands are accepted.
   *
   * These states may transition like so:
   *
   * - `created --> booting`: upon calling {@link NomadVM.start}.
   * - `created --> stopped`: upon calling {@link NomadVM.stop} before {@link NomadVM.start}.
   * - `booting --> running`: upon the {@link Worker} successfully finishing its boot up sequence.
   * - `booting --> stopped`: upon calling {@link NomadVM.stop} after {@link NomadVM.start} but before the boot-up sequence has finished in the {@link Worker}.
   * - `running --> stopped`: upon calling {@link NomadVM.stop} after successful boot-up sequence termination in the {@link Worker}.
   *
   */
  #state: 'created' | 'booting' | 'running' | 'stopped';

  /**
   * The {@link Worker} instance this VM is using for secure execution.
   *
   */
  #worker: Worker | null;

  /**
   * A list of predefined functions.
   *
   */
  #predefined: ((...args: unknown[]) => unknown)[] = [];

  /**
   * A list of inter-process tunnels being used.
   *
   * Tunnels are a way of holding on to `resolve` / `reject` {@link Promise} callbacks under a specific index number, so that both the {@link Worker} and the {@link NomadVM} can interact through these.
   *
   */
  #tunnels: {
    resolve: (arg: unknown) => void;
    reject: (error: Error) => void;
  }[] = [];

  /**
   * The interval ID for the pinger, or `null` if not yet set up.
   *
   */
  #pinger: ReturnType<typeof setInterval> | null = null;

  /**
   * The timestamp when the last `pong` message was received.
   *
   */
  #lastPong: number = Date.now();

  /**
   * Construct a new {@link NomadVM} instance, using the given name.
   *
   * @param name - The VM's name to use, or `null` to have one generated randomly.
   * @throws {Error} If the given name already exists.
   */
  constructor(name: string | null = null) {
    if (null === name) {
      do {
        name = `${NomadVM.#namesPrefix}-${NomadVM.#pseudoRandomString()}`;
      } while (NomadVM.#names.has(name));
    } else if (NomadVM.#names.has(name)) {
      throw new Error(`duplicate name ${name}`);
    }

    {
      let castLocal: Cast;
      super((protectedMethods: { cast: Cast }): void => {
        castLocal = protectedMethods.cast;
      });
      // @ts-expect-error: Variable 'castLocal' is used before being assigned.
      this.#castLocal = castLocal;
    }

    this.#name = name;
    NomadVM.#names.set(this.#name, new WeakRef<NomadVM>(this));
    this.#state = 'created';
    this.#worker = null;

    NomadVM.#castGlobal(`${NomadVM.#eventPrefix}:${this.#name}:new`, this);
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
   * @returns
   * @throws {Error} If the VM is in any state other than "created".
   */
  #assertCreated(): void {
    if ('created' !== this.#state) {
      throw new Error("expected state to be 'created'");
    }
  }

  /**
   * Assert that the VM is currently in the "running" state.
   *
   * @returns
   * @throws {Error} If the VM is in any state other than "running".
   */
  #assertRunning(): void {
    if ('running' !== this.#state) {
      throw new Error("expected state to be 'running'");
    }
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Cast an event both from the static {@link EventCaster} at {@link NomadVM.events}, and from the current instance.
   *
   * @param name - Event name to cast.
   * @param args - Arguments to associate to the event in question.
   * @returns
   * @see {@link EventCaster.cast} for additional exceptions thrown.
   */
  #castEvent(name: string, ...args: unknown[]): void {
    const event: string = `${NomadVM.#eventPrefix}:${this.#name}:${name}`;
    this.#castLocal(event, this, ...args);
    NomadVM.#castGlobal(event, this, ...args);
  }

  /**
   * Attach the given callback to this particular VM's event caster, triggered on events matching the given filter.
   *
   * @param filter - Event name filter to assign the listener to.
   * @param callback - Callback to call on a matching event being cast.
   * @returns `this`, for chaining.
   * @see {@link EventCaster.#filterToRegExp} for additional exceptions thrown.
   * @see {@link Validation.callback} for additional exceptions thrown.
   */
  onThis(filter: string, callback: EventCallback): this {
    return this.on(`${NomadVM.#eventPrefix}:${this.name}:${filter}`, callback);
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
    return this.once(`${NomadVM.#eventPrefix}:${this.name}:${filter}`, callback);
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Post the JSON string associated to the given data to the VM's {@link Worker}.
   *
   * @param data - Data to post to the {@link Worker}.
   * @returns
   */
  #postJsonMessage(data: object): void {
    this.#worker?.postMessage(JSON.stringify(data));
  }

  /**
   * Post a `ping` message to the {@link Worker}.
   *
   * A `ping` message has the form:
   *
   * ```json
   * {
   *   name: "ping"
   * }
   * ```
   *
   * @returns
   */
  #postPingMessage(): void {
    this.#postJsonMessage({ name: 'ping' });
  }

  /**
   * Post a `resolve` message to the {@link Worker}.
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
   * - `namespace` is the WW-side namespace that is awaiting a response.
   * - `tunnel` is the WW-side tunnel index awaiting a response.
   * - `payload` is any resolution result being returned.
   *
   * @param tunnel - The tunnel to resolve.
   * @param payload - The payload to use for resolution.
   * @returns
   */
  #postResolveMessage(tunnel: number, payload: unknown): void {
    this.#postJsonMessage({ name: 'resolve', tunnel, payload });
  }

  /**
   * Post a `reject` message to the {@link Worker}.
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
   * - `namespace` is the WW-side namespace that is awaiting a response.
   * - `tunnel` is the WW-side tunnel index awaiting a response.
   * - `error` is the rejection's error string.
   *
   * @param tunnel - The tunnel to reject.
   * @param error - The error message to use for {@link Error} construction in the {@link Worker}.
   * @returns
   */
  #postRejectMessage(tunnel: number, error: string): void {
    this.#postJsonMessage({ name: 'reject', tunnel, error });
  }

  /**
   * Post an `emit` message to the {@link Worker}.
   *
   * An `emit` message has the form:
   *
   * ```json
   * {
   *   name: "emit",
   *   namespace: <string>,
   *   event: <string>,
   *   args: <unknown[]>
   * }
   * ```
   *
   * Where:
   *
   * - `namespace` is the WW-side namespace the event is being emitted into.
   * - `event` is the event name being emitted on the WW.
   * - `args` is an array of optional event arguments.
   *
   * @param namespace - The namespace to use.
   * @param event - The event name to emit.
   * @param args - The arguments to associate to the given event.
   * @returns
   */
  #postEmitMessage(namespace: string, event: string, args: unknown[]): void {
    this.#postJsonMessage({
      name: 'emit',
      namespace,
      event: event,
      args,
    });
  }

  /**
   * Post an `install` message to the {@link Worker}.
   *
   * An `install` message has the form:
   *
   * ```json
   * {
   *   name: "install",
   *   namespace: <string>,
   *   tunnel: <int>,
   *   dependency: <DependencyObject>
   * }
   * ```
   *
   * Where:
   *
   * - `namespace` is the WW-side namespace to install the dependency into.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   * - `dependency` is the {@link DependencyObject} describing the dependency to install.
   *
   * @param namespace - The namespace to use.
   * @param tunnel - The tunnel index to expect a response on.
   * @param dependency - The dependency being installed.
   * @returns
   */
  #postInstallMessage(namespace: string, tunnel: number, dependency: DependencyObject): void {
    this.#postJsonMessage({ name: 'install', namespace, tunnel, dependency });
  }

  /**
   * Post an `execute` message to the {@link Worker}.
   *
   * An `execute` message has the form:
   *
   * ```json
   * {
   *   name: "execute",
   *   namespace: <string>,
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
   * - `namespace` is the WW-side namespace to install the dependency into.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   * - `dependency` is the {@link DependencyObject} describing the dependency to install.
   * - `args` is an array of optional execution arguments.
   *
   * @param namespace - The namespace to use.
   * @param tunnel - The tunnel index to expect a response on.
   * @param dependency - The dependency being executed.
   * @param args - The arguments to execute the dependency with.
   * @returns
   */
  #postExecuteMessage(
    namespace: string,
    tunnel: number,
    dependency: DependencyObject,
    args: Map<string, unknown>,
  ): void {
    this.#postJsonMessage({
      name: 'execute',
      namespace,
      tunnel,
      dependency,
      args: Object.fromEntries(args.entries()),
    });
  }

  /**
   * Post a `predefine` message to the {@link Worker}.
   *
   * A `predefine` message has the form:
   *
   * ```json
   * {
   *   name: "predefine",
   *   namespace: <string>,
   *   tunnel: <int>,
   *   idx: <int>,
   *   function: <string>
   * }
   * ```
   *
   * Where:
   *
   * - `namespace` is the WW-side namespace to predefine the function into.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   * - `idx` is the function index being predefined.
   * - `function` is the predefined function name to use.
   *
   * @param namespace - The namespace to use.
   * @param tunnel - The tunnel index to expect a response on.
   * @param idx - The predefined function index to use.
   * @param funcName - The function name to use.
   * @returns
   */
  #postPredefineMessage(namespace: string, tunnel: number, idx: number, funcName: string): void {
    this.#postJsonMessage({
      name: 'predefine',
      namespace,
      tunnel,
      idx,
      function: funcName,
    });
  }

  /**
   * Post a `create` message to the {@link Worker}.
   *
   * A `create` message has the form:
   *
   * ```json
   * {
   *   name: "create",
   *   namespace: <string>,
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `namespace` is the WW-side namespace to create.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param namespace - The namespace to create.
   * @param tunnel - The tunnel index to expect a response on.
   * @returns
   */
  #postCreateMessage(namespace: string, tunnel: number): void {
    this.#postJsonMessage({
      name: 'create',
      namespace,
      tunnel,
    });
  }

  /**
   * Post a `delete` message to the {@link Worker}.
   *
   * A `delete` message has the form:
   *
   * ```json
   * {
   *   name: "delete",
   *   tunnel: <int>,
   *   namespace: <string>,
   * }
   * ```
   *
   * Where:
   *
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   * - `namespace` is the WW-side namespace to delete.
   *
   * @param tunnel - The tunnel index to expect a response on.
   * @param namespace - The namespace to delete.
   * @returns
   */
  #postDeleteMessage(tunnel: number, namespace: string): void {
    this.#postJsonMessage({ name: 'delete', tunnel, namespace });
  }

  /**
   * Post an `assimilate` message to the {@link Worker}.
   *
   * An `assimilate` message has the form:
   *
   * ```json
   * {
   *   name: "assimilate",
   *   namespace: <string>,
   *   tunnel: <int>,
   * }
   * ```
   *
   * Where:
   *
   * - `namespace` is the WW-side namespace to assimilate.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param namespace - The namespace to assimilate.
   * @param tunnel - The tunnel index to expect a response on.
   * @returns
   */
  #postAssimilateMessage(namespace: string, tunnel: number): void {
    this.#postJsonMessage({ name: 'assimilate', namespace, tunnel });
  }

  /**
   * Post a `link` message to the {@link Worker}.
   *
   * A `link` message has the form:
   *
   * ```json
   * {
   *   name: "link",
   *   namespace: <string>,
   *   tunnel: <int>,
   *   target: <string>
   * }
   * ```
   *
   * Where:
   *
   * - `namespace` is the WW-side namespace to use as link source.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   * - `target` is the WW-side namespace to use as link target.
   *
   * @param namespace - The namespace to use as link source.
   * @param tunnel - The tunnel index to expect a response on.
   * @param target - The namespace to use as link target.
   * @returns
   */
  #postLinkMessage(namespace: string, tunnel: number, target: string): void {
    this.#postJsonMessage({ name: 'link', namespace, tunnel, target });
  }

  /**
   * Post an `unlink` message to the {@link Worker}.
   *
   * An `unlink` message has the form:
   *
   * ```json
   * {
   *   name: "unlink",
   *   namespace: <string>,
   *   tunnel: <int>,
   *   target: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `namespace` is the WW-side namespace to use as unlink source.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   * - `target` is the WW-side namespace to use as unlink target.
   *
   * @param namespace - The namespace to use as unlink source.
   * @param tunnel - The tunnel index to expect a response on.
   * @param target - The namespace to use as unlink target.
   * @returns
   */
  #postUnlinkMessage(namespace: string, tunnel: number, target: string): void {
    this.#postJsonMessage({ name: 'unlink', namespace, tunnel, target });
  }

  /**
   * Post a `mute` message to the {@link Worker}.
   *
   * A `mute` message has the form:
   *
   * ```json
   * {
   *   name: "mute",
   *   namespace: <string>,
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `namespace` is the WW-side namespace to mute.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param namespace - The namespace to mute.
   * @param tunnel - The tunnel index to expect a response on.
   * @returns
   */
  #postMuteMessage(namespace: string, tunnel: number): void {
    this.#postJsonMessage({ name: 'mute', namespace, tunnel });
  }

  /**
   * Post an `unmute` message to the {@link Worker}.
   *
   * An `unmute` message has the form:
   *
   * ```json
   * {
   *   name: "unmute",
   *   namespace: <string>,
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `namespace` is the WW-side namespace to unmute.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param namespace - The namespace to unmute.
   * @param tunnel - The tunnel index to expect a response on.
   * @returns
   */
  #postUnmuteMessage(namespace: string, tunnel: number): void {
    this.#postJsonMessage({ name: 'unmute', namespace, tunnel });
  }

  /**
   * Post a `listOrphanNamespaces` message to the {@link Worker}.
   *
   * A `listOrphanNamespaces` message has the form:
   *
   * ```json
   * {
   *   name: "listOrphanNamespaces",
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param tunnel - The tunnel index to expect a response on.
   * @returns
   */
  #postListOrphanNamespacesMessage(tunnel: number): void {
    this.#postJsonMessage({ name: 'listOrphanNamespaces', tunnel });
  }

  /**
   * Post a `listInstalled` message to the {@link Worker}.
   *
   * A `listInstalled` message has the form:
   *
   * ```json
   * {
   *   name: "listInstalled",
   *   namespace: <string>,
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `namespace` is the WW-side namespace to list installed dependencies of.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param namespace - The namespace to list installed dependencies of.
   * @param tunnel - The tunnel index to expect a response on.
   * @returns
   */
  #postListInstalledMessage(namespace: string, tunnel: number): void {
    this.#postJsonMessage({ name: 'listInstalled', namespace, tunnel });
  }

  /**
   * Post a `listLinksTo` message to the {@link Worker}.
   *
   * A `listLinksTo` message has the form:
   *
   * ```json
   * {
   *   name: "listLinksTo",
   *   namespace: <string>,
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `namespace` is the WW-side namespace to list linked-to namespaces of.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param namespace - The namespace to list linked-to namespaces of.
   * @param tunnel - The tunnel index to expect a response on.
   * @returns
   */
  #postListLinksToMessage(namespace: string, tunnel: number): void {
    this.#postJsonMessage({ name: 'listLinksTo', namespace, tunnel });
  }

  /**
   * Post a `listLinkedFrom` message to the {@link Worker}.
   *
   * A `listLinkedFrom` message has the form:
   *
   * ```json
   * {
   *   name: "listLinkedFrom",
   *   namespace: <string>,
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `namespace` is the WW-side namespace to list linked-from namespaces of.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param namespace - The namespace to list linked-from namespaces of.
   * @param tunnel - The tunnel index to expect a response on.
   * @returns
   */
  #postListLinkedFromMessage(namespace: string, tunnel: number): void {
    this.#postJsonMessage({ name: 'listLinkedFrom', namespace, tunnel });
  }

  /**
   * Post a `isMuted` message to the {@link Worker}.
   *
   * A `isMuted` message has the form:
   *
   * ```json
   * {
   *   name: "isMuted",
   *   namespace: <string>,
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `namespace` is the WW-side namespace to determine mute status.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param namespace - The namespace to determine mute status.
   * @param tunnel - The tunnel index to expect a response on.
   * @returns
   */
  #postIsMutedMessage(namespace: string, tunnel: number): void {
    this.#postJsonMessage({ name: 'isMuted', namespace, tunnel });
  }

  /**
   * Post a `getDescendants` message to the {@link Worker}.
   *
   * A `getDescendants` message has the form:
   *
   * ```json
   * {
   *   name: "getDescendants",
   *   namespace: <string>,
   *   depth: <int>,
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `namespace` is the WW-side namespace to determine the descendants of.
   * - `depth` is the maximum namespace depth to retrieve, `0` meaning unlimited.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param namespace - The namespace to determine the descendants of.
   * @param depth - The maximum namespace depth to retrieve, or `0` for unlimited.
   * @param tunnel - The tunnel index to expect a response on.
   * @returns
   */
  #postGetDescendantsMessage(namespace: string, depth: number, tunnel: number): void {
    this.#postJsonMessage({ name: 'getDescendants', namespace, depth, tunnel });
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Create a new tunnel (cf. {@link NomadVM.#tunnels}) with the given resolution and rejection callbacks, returning the index of the created tunnel.
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
   * @throws {Error} If the given tunnel index does not exist.
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
   * @returns
   * @see {@link NomadVM.#removeTunnel} for additional exceptions thrown.
   */
  #resolveTunnel(tunnel: number, arg: unknown): void {
    this.#removeTunnel(tunnel).resolve(arg);
  }

  /**
   * Reject the given tunnel with the given error object, removing the tunnel from the tunnels list.
   *
   * @param tunnel - Tunnel to reject.
   * @param error - {@link Error} to pass on to the rejection callback.
   * @returns
   * @see {@link NomadVM.#removeTunnel} for additional exceptions thrown.
   */
  #rejectTunnel(tunnel: number, error: Error): void {
    this.#removeTunnel(tunnel).reject(error);
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Call the given predefined function ID with the given arguments, resolving or rejecting the given tunnel ID with the result or error.
   *
   * @param namespace - Namespace to use.
   * @param tunnel - Tunnel to use for resolution / rejection signalling.
   * @param idx - The predefined function index to call.
   * @param args - The arguments to forward to the predefined function called.
   * @returns
   */
  #callPredefined(namespace: string, tunnel: number, idx: number, args: unknown[]): void {
    this.#castEvent(`${namespace}:predefined:call`, idx, args);
    if (idx in this.#predefined) {
      try {
        this.#postResolveMessage(tunnel, this.#predefined[idx]?.bind(undefined)(...args));
        this.#castEvent(`${namespace}:predefined:call:ok`, idx, args);
      } catch (e) {
        this.#postRejectMessage(tunnel, e instanceof Error ? e.message : 'unknown error');
        this.#castEvent(`${namespace}:predefined:call:error`, idx, args, e);
      }
    } else {
      this.#postRejectMessage(tunnel, `unknown function index ${idx.toString()}`);
      this.#castEvent(
        `${namespace}:predefined:call:error`,
        idx,
        args,
        new Error(`unknown function index ${idx.toString()}`),
      );
    }
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Handle the {@link Worker}'s `message` event.
   *
   * Handling a {@link Worker}'s `message` event entails:
   *
   * 1. decoding the `data` field of the `message` event.
   * 2. handling the specific `name` therein (only `resolve`, `reject`, `call`, and `emit` are supported).
   * 3. executing the corresponding sub-handler.
   * 4. if the `name` is not supported, try to signal  rejection to the tunnel index if existing, or simply emit an error message otherwise.
   *
   * @param event - The message event itself.
   * @param event.data - The message's `data` field, a JSON-encoded string.
   * @returns
   */
  #messageHandler({ data }: { data: string }): void {
    try {
      const parsedData: { [_: string]: unknown } = JSON.parse(data) as {
        [_: string]: unknown;
      };
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
              namespace,
              tunnel,
              idx,
              args,
            }: {
              namespace: string;
              tunnel: number;
              idx: number;
              args: unknown[];
            } = parsedData as {
              namespace: string;
              tunnel: number;
              idx: number;
              args: unknown[];
            };
            this.#callPredefined(namespace, tunnel, idx, args);
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
   * Handle the {@link Worker}'s `error` event.
   *
   * Handling a {@link Worker}'s `error` event simply entails casting a `worker:error` event.
   *
   * @param error - Error to handle.
   * @returns
   */
  #errorHandler(error: Event): void {
    error.preventDefault();
    this.#castEvent('worker:error', error);
  }

  /**
   * Handle the {@link Worker}'s `messageerror` event.
   *
   * Handling a {@link Worker}'s `messageerror` event simply entails casting a `worker:error` event.
   *
   * @param event - The message event itself.
   * @param event.data - The message's `data` field.
   * @returns
   */
  #messageErrorHandler({ data }: { data: string }): void {
    this.#castEvent('worker:error', data);
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Shut down the {@link Worker} and reject all pending tunnels.
   *
   * Stopping a Vm instance entails:
   *
   * 1. Clearing the pinger.
   * 2. Calling {@link Worker.terminate} on the VM's {@link Worker}.
   * 3. Rejecting all existing tunnels.
   *
   * NOTE: this method does NOT return a {@link Promise}, it rather accepts the `resolve` and `reject` callbacks required to serve a {@link Promise}.
   *
   * @param resolve - Resolution callback: called if shutting down completed successfully.
   * @param reject - Rejection callback: called if anything went wrong with shutting down.
   * @returns
   */
  #shutdown(resolve: () => void, reject: (error: Error) => void): void {
    this.#castEvent('stop');
    try {
      if ('stopped' !== this.#state) {
        this.#state = 'stopped';

        if (null !== this.#pinger) {
          clearTimeout(this.#pinger);
          this.#pinger = null;
        }
        if (null !== this.#worker) {
          this.#worker.terminate();
          this.#worker = null;
        }

        this.#tunnels.forEach((_: unknown, idx: number): void => {
          try {
            this.#rejectTunnel(idx, new Error('stopped'));
          } catch (e) {
            this.#castEvent('stop:error:ignored', e);
          }
        });
        this.#tunnels = [];

        this.#castEvent('stop:ok');
      }
    } catch (e) {
      this.#castEvent('stop:error', e);
      reject(e instanceof Error ? e : new Error('unknown error'));
    }
    resolve();
  }

  /**
   * Start the {@link Worker} and wait for its boot-up sequence to complete.
   *
   * Starting a VM instance consists of the following:
   *
   * 1. Initializing a {@link Worker} instance with the {@link NomadVM.#workerCode} callback.
   * 2. Setting up the boot timeout callback (in case the {@link Worker} takes too much time to boot).
   * 3. Setting up the event listeners for `message`, `error`, and `messageerror`.
   *
   * @param timeout - Milliseconds to wait for the {@link Worker} to complete its boot-up sequence.
   * @returns A {@link Promise} that resolves with a pair of boot duration times (as measured from "inside" and "outside" of the {@link Worker} respectively) if the {@link Worker} was successfully booted up, and rejects with an {@link Error} in case errors are found.
   */
  start(timeout: number = 100): Promise<[number, number]> {
    return new Promise<[number, number]>(
      (resolve: (bootTimes: [number, number]) => void, reject: (error: Error) => void): void => {
        this.#castEvent('start');
        try {
          this.#assertCreated();
          timeout = validateTimeout(timeout);
          this.#state = 'booting';
          let blobURL: string = '';
          try {
            const externalBootTime: number = Date.now();
            let bootTimeout: ReturnType<typeof setTimeout>;
            this.#addTunnel(
              (internalBootTime: number): void => {
                clearTimeout(bootTimeout);
                URL.revokeObjectURL(blobURL);
                this.#pinger = setInterval(() => {
                  const delta: number = Date.now() - this.#lastPong;
                  if (NomadVM.#pongLimit < delta) {
                    this.#castEvent('worker:unresponsive', delta);
                    this.#shutdown(
                      () => null,
                      () => null,
                    );
                  }
                  this.#postPingMessage();
                }, NomadVM.#pingInterval);
                this.#state = 'running';
                this.#castEvent('start:ok');
                resolve([internalBootTime, Date.now() - externalBootTime]);
              },
              (error: Error): void => {
                clearTimeout(bootTimeout);
                URL.revokeObjectURL(blobURL);
                this.#castEvent('start:error', error);
                this.stop().then(
                  (): void => {
                    reject(error);
                  },
                  (): void => {
                    reject(error);
                  },
                );
              },
            );
            bootTimeout = setTimeout((): void => {
              this.#rejectTunnel(0, new Error('boot timed out'));
            }, timeout);

            blobURL = URL.createObjectURL(
              new Blob(
                [
                  `'use strict';
                  (${workerRunner.toString()})(
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

            this.#worker = new Worker(blobURL, {
              name: this.#name,
              type: 'classic',
              credentials: 'omit',
            });

            this.#worker.addEventListener('message', (args: MessageEvent): void => {
              this.#messageHandler(args);
            });
            this.#worker.addEventListener('error', (args: Event): void => {
              this.#errorHandler(args);
            });
            this.#worker.addEventListener('messageerror', (args: MessageEvent): void => {
              this.#messageErrorHandler(args);
            });
          } catch (e) {
            URL.revokeObjectURL(blobURL);
            throw e;
          }
        } catch (e) {
          this.#castEvent('start:error', e);
          reject(e instanceof Error ? e : new Error('unknown error'));
        }
      },
    );
  }

  /**
   * Stop the {@link Worker} and reject all pending tunnels.
   *
   * @returns A {@link Promise} that resolves with `void` if the stopping procedure completed successfully, and rejects with an {@link Error} in case errors occur.
   * @see {@link NomadVM.#shutdown} for the actual shutdown process
   */
  stop(): Promise<void> {
    return new Promise<void>((resolve: () => void, reject: (error: Error) => void): void => {
      this.#shutdown(resolve, reject);
    });
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Create a new namespace with the given name.
   *
   * @param namespace - Namespace to create.
   * @returns A {@link Promise} that resolves with a {@link NomadVMNamespace} wrapper if namespace creation completed successfully, and rejects with an {@link Error} in case errors occur.
   */
  createNamespace(namespace: string): Promise<NomadVMNamespace> {
    return new Promise<NomadVMNamespace>(
      (resolve: (nomadVmNamespace: NomadVMNamespace) => void, reject: (error: Error) => void): void => {
        this.#castEvent(`${namespace}:create`);
        try {
          validateNamespace(namespace);

          this.#assertRunning();

          this.#postCreateMessage(
            namespace,
            this.#addTunnel(
              (): void => {
                this.#castEvent(`${namespace}:create:ok`);
                resolve(new NomadVMNamespace(this, namespace));
              },
              (error: Error): void => {
                this.#castEvent(`${namespace}:create:error`, error);
                reject(error);
              },
            ),
          );
        } catch (e) {
          this.#castEvent(`${namespace}:create:error`, e);
          reject(e instanceof Error ? e : new Error('unknown error'));
        }
      },
    );
  }

  /**
   * Delete the namespace with the given name.
   *
   * This method will reject all tunnels awaiting responses on the given namespace.
   *
   * @param namespace - Namespace to delete.
   * @returns A {@link Promise} that resolves with a list of deleted namespaces (the one given and any descendant of it) if namespace deletion completed successfully, and rejects with an {@link Error} in case errors occur.
   */
  deleteNamespace(namespace: string): Promise<string[]> {
    return new Promise<string[]>((resolve: (deleted: string[]) => void, reject: (error: Error) => void): void => {
      this.#castEvent(`${namespace}:delete`);
      try {
        validateNamespace(namespace);

        this.#assertRunning();

        this.#postDeleteMessage(
          this.#addTunnel(
            (deleted: string[]): void => {
              this.#castEvent(`${namespace}:delete:ok`, deleted);
              resolve(deleted);
            },
            (error: Error): void => {
              this.#castEvent(`${namespace}:delete:error`, error);
              reject(error);
            },
          ),
          namespace,
        );
      } catch (e) {
        this.#castEvent(`${namespace}:delete:error`, e);
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * Assimilate the given namespace to its parent.
   *
   * @param namespace - Namespace to assimilate.
   * @returns A {@link Promise} that resolves with `void` if namespace assimilation completed successfully, and rejects with an {@link Error} in case errors occur.
   */
  assimilateNamespace(namespace: string): Promise<void> {
    return new Promise<void>((resolve: () => void, reject: (error: Error) => void): void => {
      this.#castEvent(`${namespace}:assimilate`, namespace);
      try {
        validateNamespace(namespace);

        this.#assertRunning();

        this.#postAssimilateMessage(
          namespace,
          this.#addTunnel(
            (): void => {
              this.#castEvent(`${namespace}:assimilate:ok`, namespace);
              resolve();
            },
            (error: Error): void => {
              this.#castEvent(`${namespace}:assimilate:error`, namespace, error);
              reject(error);
            },
          ),
        );
      } catch (e) {
        this.#castEvent(`"${namespace}:assimilate:error`, namespace, e);
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * Link one namespace to another, so that events cast on the first are also handled in the second.
   *
   * @param namespace - "Source" namespace to use.
   * @param target - "Destination" namespace to use.
   * @returns A {@link Promise} that resolves with `void` if namespace linking completed successfully, and rejects with an {@link Error} in case errors occur.
   */
  linkNamespaces(namespace: string, target: string): Promise<void> {
    return new Promise<void>((resolve: () => void, reject: (error: Error) => void): void => {
      this.#castEvent(`${namespace}:link`, target);
      try {
        validateNamespace(namespace);
        validateNamespace(target);

        this.#assertRunning();

        this.#postLinkMessage(
          namespace,
          this.#addTunnel(
            (): void => {
              this.#castEvent(`${namespace}:link:ok`, target);
              resolve();
            },
            (error: Error): void => {
              this.#castEvent(`${namespace}:link:error`, target, error);
              reject(error);
            },
          ),
          target,
        );
      } catch (e) {
        this.#castEvent(`"${namespace}:link:error`, target, e);
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * Unlink one namespace from another, so that events cast on the first are no longer handled in the second.
   *
   * @param namespace - "Source" namespace to use.
   * @param target - "Destination" namespace to use.
   * @returns A {@link Promise} that resolves with a boolean indicating whether the target namespace was previously linked if namespace unlinking completed successfully, and rejects with an {@link Error} in case errors occur.
   */
  unlinkNamespaces(namespace: string, target: string): Promise<boolean> {
    return new Promise<boolean>((resolve: (unlinked: boolean) => void, reject: (error: Error) => void): void => {
      validateNamespace(namespace);
      validateNamespace(target);

      this.#castEvent(`${namespace}:unlink`, target);
      try {
        this.#assertRunning();

        this.#postUnlinkMessage(
          namespace,
          this.#addTunnel(
            (unlinked: boolean): void => {
              this.#castEvent(`${namespace}:unlink:ok`, target, unlinked);
              resolve(unlinked);
            },
            (error: Error): void => {
              this.#castEvent(`${namespace}:unlink:error`, target, error);
              reject(error);
            },
          ),
          target,
        );
      } catch (e) {
        this.#castEvent(`${namespace}:unlink:error`, target, e);
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * Mute the given namespace, so that events cast on it are no longer propagated to this VM.
   *
   * @param namespace - Namespace to mute.
   * @returns A {@link Promise} that resolves with the previous muting status if namespace muting completed successfully, and rejects with an {@link Error} in case errors occur.
   */
  muteNamespace(namespace: string): Promise<boolean> {
    return new Promise<boolean>((resolve: (previous: boolean) => void, reject: (error: Error) => void): void => {
      this.#castEvent(`${namespace}:muteNamespace`);
      try {
        validateNamespace(namespace);

        this.#assertRunning();

        this.#postMuteMessage(
          namespace,
          this.#addTunnel(
            (previous: boolean): void => {
              this.#castEvent(`${namespace}:mute:ok`, previous);
              resolve(previous);
            },
            (error: Error): void => {
              this.#castEvent(`${namespace}:mute:error`, error);
              reject(error);
            },
          ),
        );
      } catch (e) {
        this.#castEvent(`${namespace}:mute:error`, e);
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * Unmute the given namespace, so that events cast on it are propagated to this VM.
   *
   * @param namespace - Namespace to unmute.
   * @returns A {@link Promise} that resolves with he previous muting status if namespace un-muting completed successfully, and rejects with an {@link Error} in case errors occur.
   */
  unmuteNamespace(namespace: string): Promise<boolean> {
    return new Promise<boolean>((resolve: (prev: boolean) => void, reject: (error: Error) => void): void => {
      this.#castEvent(`${namespace}:unmute`);
      try {
        validateNamespace(namespace);

        this.#assertRunning();

        this.#postUnmuteMessage(
          namespace,
          this.#addTunnel(
            (prev: boolean): void => {
              this.#castEvent(`${namespace}:unmute:ok`, prev);
              resolve(prev);
            },
            (error: Error): void => {
              this.#castEvent(`${namespace}:unmute:error`, error);
              reject(error);
            },
          ),
        );
      } catch (e) {
        this.#castEvent(`${namespace}:unmute:error`, e);
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * List the orphaned namespaces created.
   *
   * @returns A {@link Promise} that resolves with a list of orphan namespaces created if successful, and rejects with an {@link Error} in case errors occur.
   */
  listOrphanNamespaces(): Promise<string[]> {
    return new Promise<string[]>(
      (resolve: (orphanNamespaces: string[]) => void, reject: (error: Error) => void): void => {
        try {
          this.#assertRunning();

          this.#postListOrphanNamespacesMessage(this.#addTunnel(resolve, reject));
        } catch (e) {
          reject(e instanceof Error ? e : new Error('unknown error'));
        }
      },
    );
  }

  /**
   * List the dependencies (user-level and predefined) installed on the given namespace or its ancestors.
   *
   * @param namespace - Namespace to list installed dependencies of.
   * @returns A {@link Promise} that resolves with a list of installed dependency names if successful, and rejects with an {@link Error} in case errors occur.
   */
  listInstalled(namespace: string): Promise<string[]> {
    return new Promise<string[]>((resolve: (installed: string[]) => void, reject: (error: Error) => void): void => {
      try {
        validateNamespace(namespace);

        this.#assertRunning();

        this.#postListInstalledMessage(namespace, this.#addTunnel(resolve, reject));
      } catch (e) {
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * List the namespaces the given one is linked to.
   *
   * @param namespace - Namespace to list linked-to namespaces of.
   * @returns A {@link Promise} that resolves with a list of linked-to namespaces if successful, and rejects with an {@link Error} in case errors occur.
   */
  listLinksTo(namespace: string): Promise<string[]> {
    return new Promise<string[]>((resolve: (linksTo: string[]) => void, reject: (error: Error) => void): void => {
      try {
        validateNamespace(namespace);

        this.#assertRunning();

        this.#postListLinksToMessage(namespace, this.#addTunnel(resolve, reject));
      } catch (e) {
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * List the namespaces that link to the given one.
   *
   * @param namespace - Namespace to list linked-from namespaces of.
   * @returns A {@link Promise} that resolves with a list of linked-from namespaces if successful, and rejects with an {@link Error} in case errors occur.
   */
  listLinkedFrom(namespace: string): Promise<string[]> {
    return new Promise<string[]>((resolve: (linkedFrom: string[]) => void, reject: (error: Error) => void): void => {
      try {
        validateNamespace(namespace);

        this.#assertRunning();

        this.#postListLinkedFromMessage(namespace, this.#addTunnel(resolve, reject));
      } catch (e) {
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * Determine whether the given namespace is muted.
   *
   * @param namespace - Namespace to determine mute status of.
   * @returns A {@link Promise} that resolves with a boolean value indicating whether the namespace is muted if successful, and rejects with an {@link Error} in case errors occur.
   */
  isMuted(namespace: string): Promise<boolean> {
    return new Promise<boolean>((resolve: (muted: boolean) => void, reject: (error: Error) => void): void => {
      try {
        validateNamespace(namespace);

        this.#assertRunning();

        this.#postIsMutedMessage(namespace, this.#addTunnel(resolve, reject));
      } catch (e) {
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * List the given namespace's descendants.
   *
   * @param namespace - Namespace to list the descendants of.
   * @param depth - Maximum namespace depth to retrieve results for, defaults to retrieving all.
   * @returns A {@link Promise} that resolves with a list of descendant namespaces if successful, and rejects with an {@link Error} in case errors occur.
   */
  getDescendants(namespace: string, depth: number | null = null): Promise<string[]> {
    return new Promise<string[]>((resolve: (descendants: string[]) => void, reject: (error: Error) => void): void => {
      try {
        validateNamespace(namespace);

        this.#assertRunning();

        this.#postGetDescendantsMessage(
          namespace,
          validateNonNegativeInteger(depth ?? 0),
          this.#addTunnel(resolve, reject),
        );
      } catch (e) {
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Add a predefined function to the VM's list (cf. {@link NomadVM.#predefined}) under the given namespace.
   *
   * @param namespace - Namespace to use.
   * @param name - Function name to add.
   * @param callback - {@link Function} callback to use.
   * @returns A {@link Promise} that resolves with `void` if the {@link Function} was correctly predefined, and rejects with an {@link Error} in case errors occurred.
   */
  predefine(namespace: string, name: string, callback: (...args: unknown[]) => unknown): Promise<void> {
    return new Promise<void>((resolve: () => void, reject: (error: Error) => void): void => {
      const idx: number =
        this.#predefined.push(() => {
          throw new Error('SHOULD NEVER HAPPEN');
        }) - 1;
      this.#castEvent(`${namespace}:predefined:add`, name, callback, idx);
      try {
        validateNamespace(namespace);

        this.#assertRunning();
        this.#postPredefineMessage(
          namespace,
          this.#addTunnel(
            (): void => {
              this.#predefined[idx] = callback;
              this.#castEvent(`${namespace}:predefined:add:ok`, name, callback, idx);
              resolve();
            },
            (error: Error): void => {
              // eslint-disable-next-line @typescript-eslint/no-array-delete, @typescript-eslint/no-dynamic-delete
              delete this.#predefined[idx];
              this.#castEvent(`${namespace}:predefined:add:error`, name, callback, idx, error);
              reject(error);
            },
          ),
          idx,
          validateIdentifier(name),
        );
      } catch (e) {
        this.#castEvent(`${namespace}:predefined:add:error`, name, callback, idx, e);
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * Install the given {@link Dependency} on the {@link Worker}.
   *
   * @param namespace - Namespace to use.
   * @param dependency - The {@link Dependency} to install.
   * @returns A {@link Promise} that resolves with `void` if the {@link Dependency} was correctly installed, and rejects with an {@link Error} in case errors occurred.
   */
  install(namespace: string, dependency: Dependency): Promise<void> {
    return new Promise<void>((resolve: () => void, reject: (error: Error) => void): void => {
      this.#castEvent(`${namespace}:install`, dependency);
      try {
        validateNamespace(namespace);

        if (!(dependency instanceof Dependency)) {
          throw new Error('can only install Dependency');
        }
        this.#assertRunning();

        this.#postInstallMessage(
          namespace,
          this.#addTunnel(
            (): void => {
              this.#castEvent(`${namespace}:install:ok`, dependency);
              resolve();
            },
            (error: Error): void => {
              this.#castEvent(`${namespace}:install:error`, dependency, error);
              reject(error);
            },
          ),
          dependency.asObject(),
        );
      } catch (e) {
        this.#castEvent(`${namespace}:install:error`, dependency, e);
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * Execute the given {@link Dependency} with the given arguments map in the {@link Worker}.
   *
   * @param namespace - The namespace to use.
   * @param dependency - The {@link Dependency} to execute.
   * @param args - The arguments map to execute with.
   * @returns A {@link Promise} that resolves with the {@link Dependency}'s execution result, and rejects with an {@link Error} in case errors occurred.
   */
  execute(namespace: string, dependency: Dependency, args: Map<string, unknown> = new Map()): Promise<unknown> {
    return new Promise<unknown>((resolve: (result: unknown) => void, reject: (error: Error) => void): void => {
      try {
        validateNamespace(namespace);

        this.#castEvent(`${namespace}:execute`, dependency, args);

        if (!(dependency instanceof Dependency)) {
          throw new Error('can only execute Dependency');
        }
        this.#assertRunning();

        this.#postExecuteMessage(
          namespace,
          this.#addTunnel(
            (result: unknown): void => {
              this.#castEvent(`${namespace}:execute:ok`, dependency, args, result);
              resolve(result);
            },
            (error: Error): void => {
              this.#castEvent(`${namespace}:execute:error`, dependency, args, error);
              reject(error);
            },
          ),
          dependency.asObject(),
          validateArgumentsMap(args),
        );
      } catch (e) {
        this.#castEvent(`${namespace}:execute:error`, dependency, args, e);
        reject(e instanceof Error ? e : new Error('unknown error'));
      }
    });
  }

  /**
   * Install the given {@link Dependency} iterable, by sorting them topologically and installing each one in turn.
   *
   * @param namespace - Namespace to use.
   * @param dependencies - Dependencies to install.
   * @returns A {@link Promise} that resolves with `void` if every {@link Dependency} in the iterable was correctly installed, and rejects with an {@link Error} in case errors occurred.
   */
  installAll(namespace: string, dependencies: Iterable<Dependency>): Promise<void> {
    return new Promise<void>((resolve: () => void, reject: (error: Error) => void): void => {
      try {
        this.createNamespace(`${namespace}.tmp_${NomadVM.#pseudoRandomString()}`).then(
          (wrapper: NomadVMNamespace): void => {
            wrapper.listInstalled().then(
              (installed: string[]): void => {
                Promise.all(
                  Dependency.sort(dependencies, installed).map((dependency: Dependency) => wrapper.install(dependency)),
                ).then(
                  (): void => {
                    this.assimilateNamespace(wrapper.namespace).then(
                      (): void => {
                        resolve();
                      },
                      (error: Error): void => {
                        this.deleteNamespace(wrapper.namespace).then(
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
                    this.deleteNamespace(wrapper.namespace).then(
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
                this.deleteNamespace(wrapper.namespace).then(
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
   * Emit an event towards the {@link Worker}.
   *
   * @param namespace - Namespace to use.
   * @param event - Event name to emit.
   * @param args - Associated arguments to emit alongside the event.
   * @returns `this`, for chaining.
   */
  emit(namespace: string, event: string, ...args: unknown[]): this {
    this.#postEmitMessage(validateNamespace(namespace), EventCaster.validateEvent(event), args);
    return this;
  }
}

/**
 * A {@link NomadVM} namespace interface wrapper object.
 *
 */
class NomadVMNamespace {
  static {
    // ref: https://stackoverflow.com/a/77741904
    Object.setPrototypeOf(this.prototype, null);
  }

  /**
   * The {@link NomadVM} instance to wrap.
   *
   */
  #vm: NomadVM;

  /**
   * The namespace to wrap for.
   *
   */
  #namespace: string;

  /**
   * Create a new {@link NomadVMNamespace} wrapper around the given {@link NomadVM} for the given namespace.
   *
   * @param vm - The VM instance to wrap.
   * @param namespace - The namespace to wrap for.
   * @throws {Error} If the given VM is not a {@link NomadVM} instance.
   * @throws {Error} If the given namespace is not a string.
   */
  constructor(vm: NomadVM, namespace: string) {
    if (!(vm instanceof NomadVM)) {
      throw new Error('expected vm to be an instance of NomadVM');
    } else if ('string' !== typeof namespace) {
      throw new Error('expected namespace to be a string');
    }

    this.#vm = vm;
    this.#namespace = namespace;
  }

  /**
   * Getter used to retrieve the wrapped {@link NomadVM}.
   *
   */
  get vm(): NomadVM {
    return this.#vm;
  }

  /**
   * Getter used to retrieve the wrapped namespace.
   *
   */
  get namespace(): string {
    return this.#namespace;
  }

  /**
   * Attach the given callback to the wrapped VM's event caster, triggered on events matching the given filter on the wrapped namespace.
   *
   * @param filter - Event name filter to assign the listener to.
   * @param callback - Callback to call on a matching event being cast.
   * @returns `this`, for chaining.
   * @see {@link NomadVM.onThis} for additional exceptions thrown.
   */
  onThis(filter: string, callback: (...args: unknown[]) => void): this {
    this.vm.onThis(`${this.namespace}:${filter}`, callback);
    return this;
  }

  /**
   * Attach the given callback to the wrapped VM's caster, triggered on events matching the given filter on the wrapped namespace, and removed upon being called once.
   *
   * @param filter - Event name filter to assign the listener to.
   * @param callback - Callback to call on a matching event being cast.
   * @returns `this`, for chaining.
   * @see {@link NomadVM.onThis} for additional exceptions thrown.
   */
  onceThis(filter: string, callback: (...args: unknown[]) => void): this {
    this.vm.onceThis(`${this.namespace}:${filter}`, callback);
    return this;
  }

  /**
   * Link the wrapped namespace to another, so that events cast on the wrapped namespace are also handled in the other.
   *
   * @param target - "Destination" namespace to use.
   * @returns A {@link Promise} that resolves with `void` if namespace linking completed successfully, and rejects with an {@link Error} in case errors occur.
   */
  link(target: string): Promise<void> {
    return this.vm.linkNamespaces(this.namespace, target);
  }

  /**
   * Unlink the wrapped namespace from another, so that events cast on the wrapped namespace are no longer handled in the other.
   *
   * @param target - "Destination" namespace to use.
   * @returns A {@link Promise} that resolves with a boolean indicating whether the target namespace was previously linked if namespace unlinking completed successfully, and rejects with an {@link Error} in case errors occur.
   */
  unlink(target: string): Promise<boolean> {
    return this.vm.unlinkNamespaces(this.namespace, target);
  }

  /**
   * Mute the wrapped namespace, so that events cast on it are no longer propagated to the wrapped VM.
   *
   * @returns A {@link Promise} that resolves with the previous muting status if namespace muting completed successfully, and rejects with an {@link Error} in case errors occur.
   */
  mute(): Promise<boolean> {
    return this.vm.muteNamespace(this.namespace);
  }

  /**
   * Unmute the wrapped namespace, so that events cast on it are propagated to wrapped VM.
   *
   * @returns A {@link Promise} that resolves with he previous muting status if namespace un-muting completed successfully, and rejects with an {@link Error} in case errors occur.
   */
  unmute(): Promise<boolean> {
    return this.vm.unmuteNamespace(this.namespace);
  }

  /**
   * List the dependencies (user-level and predefined) installed on the wrapped namespace or its ancestors.
   *
   * @returns A {@link Promise} that resolves with a list of installed dependency names if successful, and rejects with an {@link Error} in case errors occur.
   */
  listInstalled(): Promise<string[]> {
    return this.vm.listInstalled(this.namespace);
  }

  /**
   * List the namespaces the wrapped one is linked to.
   *
   * @returns A {@link Promise} that resolves with a list of linked-to namespaces if successful, and rejects with an {@link Error} in case errors occur.
   */
  listLinksTo(): Promise<string[]> {
    return this.vm.listLinksTo(this.namespace);
  }

  /**
   * List the namespaces that link to the wrapped one.
   *
   * @returns A {@link Promise} that resolves with a list of linked-from namespaces if successful, and rejects with an {@link Error} in case errors occur.
   */
  listLinkedFrom(): Promise<string[]> {
    return this.vm.listLinkedFrom(this.namespace);
  }

  /**
   * Determine whether the wrapped namespace is muted.
   *
   * @returns A {@link Promise} that resolves with a boolean value indicating whether the wrapped namespace is muted if successful, and rejects with an {@link Error} in case errors occur.
   */
  isMuted(): Promise<boolean> {
    return this.vm.isMuted(this.namespace);
  }

  /**
   * List the wrapped namespace's descendants.
   *
   * @param depth - Maximum namespace depth to retrieve results for, defaults to retrieving all.
   * @returns A {@link Promise} that resolves with a list of descendant namespaces if successful, and rejects with an {@link Error} in case errors occur.
   */
  getDescendants(depth: number | null = null): Promise<string[]> {
    return this.vm.getDescendants(this.namespace, depth);
  }

  /**
   * Add a predefined function to the VM's list under the wrapped namespace.
   *
   * @param name - Function name to add.
   * @param callback - {@link Function} callback to use.
   * @returns A {@link Promise} that resolves with `void` if the {@link Function} was correctly predefined, and rejects with an {@link Error} in case errors occurred.
   */
  predefine(name: string, callback: (...args: unknown[]) => unknown): Promise<void> {
    return this.vm.predefine(this.namespace, name, callback);
  }

  /**
   * Install the given {@link Dependency} on the wrapped VM under the wrapped namespace.
   *
   * @param dependency - The {@link Dependency} to install.
   * @returns A {@link Promise} that resolves with `void` if the {@link Dependency} was correctly installed, and rejects with an {@link Error} in case errors occurred.
   */
  install(dependency: Dependency): Promise<void> {
    return this.vm.install(this.namespace, dependency);
  }

  /**
   * Execute the given {@link Dependency} with the given arguments map in the wrapped VM under the wrapped namespace.
   *
   * @param dependency - The {@link Dependency} to execute.
   * @param args - The arguments map to execute with.
   * @returns A {@link Promise} that resolves with the {@link Dependency}'s execution result, and rejects with an {@link Error} in case errors occurred.
   */
  execute(dependency: Dependency, args: Map<string, unknown> = new Map()): Promise<unknown> {
    return this.vm.execute(this.namespace, dependency, args);
  }

  /**
   * Install the given {@link Dependency} iterable, by sorting them topologically and installing each one in turn.
   *
   * @param dependencies - Dependencies to install.
   * @returns A {@link Promise} that resolves with `void` if every {@link Dependency} in the iterable was correctly installed, and rejects with an {@link Error} in case errors occurred.
   */
  installAll(dependencies: Iterable<Dependency>): Promise<void> {
    return this.vm.installAll(this.namespace, dependencies);
  }
}

export { NomadVM, NomadVMNamespace };
