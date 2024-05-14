'use strict';

import { Validation } from './validation.js';
import { EventCaster } from './eventCaster.js';
import { Dependency } from './dependency.js';

import { workerRunner } from './worker.js';

/* global DependencyObject */
/* global TunnelDescriptor */

/**
 * A safe execution environment for NOMAD code execution.
 *
 */
class NomadVM extends EventCaster {
  /**
   * The code the {@link Worker} will end up executing.
   *
   * @type {Function}
   * @private
   */
  static #workerRunner = workerRunner;

  /**
   * Generate a pseudo-random string.
   *
   * NOE: this is NOT cryptographically-secure, it simply calls {@link Math.random}.
   *
   * @returns {string} - A pseudo-random string.
   * @private
   */
  static #pseudoRandomString() {
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
   * - `nomadvm:{NAME}:{NAMESPACE}:predefined:call(vm, idx, args)`: when a predefined function with index `idx` is being called with arguments `args` on the `vm` VM.
   * - `nomadvm:{NAME}:{NAMESPACE}:predefined:call:ok(vm, idx, args)`: when a predefined function with index `idx` has been successfully called with arguments `args` on the `vm` VM.
   * - `nomadvm:{NAME}:{NAMESPACE}:predefined:call:error(vm, idx, args, error)`: when a predefined function with index `idx` has failed to be called with arguments `args` on the `vm` VM with error `error`.
   * - `nomadvm:{NAME}:{NAMESPACE}:predefined:add(vm, name, callback, idx)`: when a predefined function with name `name`, index `idx`, and implementation `callback` is being added to the `vm` VM.
   * - `nomadvm:{NAME}:{NAMESPACE}:predefined:add:ok(vm, name, callback, idx)`: when a predefined function with name `name`, index `idx`, and implementation `callback` has been successfully added to the `vm` VM.
   * - `nomadvm:{NAME}:{NAMESPACE}:predefined:add:error(vm, name, callback, idx, error)`: when a predefined function with name `name`, index `idx`, and implementation `callback` has failed to be added to the `vm` VM with error `error`
   * - `nomadvm:{NAME}:{NAMESPACE}:create(vm, parent)`: when a new namespace is being created on VM `vm` using `parent` as its parent.
   * - `nomadvm:{NAME}:{NAMESPACE}:create:ok(vm, parent)`: when a new namespace has been successfully created on VM `vm` using `parent` as its parent.
   * - `nomadvm:{NAME}:{NAMESPACE}:create:error(vm, parent, error)`: when a new namespace has failed to be created on VM `vm` using `parent` as its parent with error `error`.
   * - `nomadvm:{NAME}:{NAMESPACE}:delete(vm)`: when a namespace is being deleted from VM `vm`.
   * - `nomadvm:{NAME}:{NAMESPACE}:delete:ok(vm)`: when a namespace has been successfully deleted from VM `vm`.
   * - `nomadvm:{NAME}:{NAMESPACE}:delete:error(vm, error)`: when a namespace has failed to be deleted from VM `vm` with error `error`.
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
   * @type {EventCaster}
   * @private
   */
  static #events;

  /**
   * Getter used to retrieve the VM's static event caster.
   *
   * @type {EventCaster}
   */
  static get events() {
    return NomadVM.#events;
  }

  /**
   * Prefix to use for all events emitted.
   *
   * @type {string}
   * @private
   */
  static #eventPrefix = 'nomadvm';

  /**
   * The {@link EventCaster} casting function for all he VMs.
   *
   * @type {Function}
   * @private
   */
  static #castGlobal;

  static {
    this.#events = Object.freeze(
      new EventCaster((protectedMethods) => {
        this.#castGlobal = protectedMethods.get('cast');
      }),
    );
  }

  /**
   * Prefix to use for all names generated.
   *
   * @type {string}
   * @private
   */
  static #namesPrefix = 'nomadvm';

  /**
   * Global mapping of VM names to VM {@link WeakRef}s.
   *
   * @type {Map<string, WeakRef>}
   * @private
   */
  static #names = new Map();

  /**
   * Retrieve the VM registered under the given name.
   *
   * @param {string} name - VM name to retrieve.
   * @returns {NomadVM | undefined} The VM registered under the given name, or `undefined` if none found.
   */
  static get(name) {
    return this.#names.get(name);
  }

  /**
   * The {@link EventCaster} casting function for the current VM.
   *
   * @type {Function}
   * @private
   */
  #castLocal;

  /**
   * The VM name to use.
   *
   * @type {string}
   * @private
   */
  #name;

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
   * @type {string}
   * @private
   */
  #state;

  /**
   * The {@link Worker} instance this VM is using for secure execution.
   *
   * @type {Worker}
   * @private
   */
  #worker;

  /**
   * A list of predefined functions.
   *
   * @type {Array<Function>}
   * @private
   */
  #predefined = [];

  /**
   * A list of inter-process tunnels being used.
   *
   * Tunnels are a way of holding on to `resolve` / `reject` {@link Promise} callbacks under a specific index number, so that both the {@link Worker} and the {@link NomadVM} can interact through these.
   *
   * @type {Array<TunnelDescriptor>}
   * @private
   */
  #tunnels = [];

  /**
   * Construct a new {@link NomadVM} instance, using the given name.
   *
   * @param {string | null} name - The VM's name to use, or `null` to have one generated randomly.
   * @throws {Error} If the given name already exists.
   */
  constructor(name = null) {
    if (null === name) {
      do {
        name = `${NomadVM.#namesPrefix}-${NomadVM.#pseudoRandomString()}`;
      } while (NomadVM.#names.has(name));
    } else if (NomadVM.#names.has(name)) {
      throw new Error(`duplicate name ${name}`);
    }

    {
      let castLocal;
      super((protectedMethods) => {
        castLocal = protectedMethods.get('cast');
      });
      this.#castLocal = castLocal;
    }

    this.#name = name;
    NomadVM.#names.set(this.#name, new WeakRef(this));
    this.#state = 'created';

    NomadVM.#castGlobal(`${NomadVM.#eventPrefix}:${this.#name}:new`, this);
  }

  /**
   * Getter used to retrieve the VM's name.
   *
   * @type {string}
   */
  get name() {
    return this.#name;
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Cast an event both from the static {@link EventCaster} at {@link NomadVM.events}, and from the current instance.
   *
   * @param {string} name - Event name to cast.
   * @param {...unknown} args - Arguments to associate to the event in question.
   * @returns {void}
   * @private
   * @see {@link EventCaster.cast} for additional exceptions thrown.
   */
  #castEvent(name, ...args) {
    const event = `${NomadVM.#eventPrefix}:${this.#name}:${name}`;
    this.#castLocal(event, this, ...args);
    NomadVM.#castGlobal(event, this, ...args);
  }

  /**
   * Attach the given callback to this particular VM's event caster, triggered on events matching the given filter.
   *
   * @param {unknown} filter - Event name filter to assign the listener to.
   * @param {unknown} callback - Callback to call on a matching event being cast.
   * @returns {NomadVM} `this`, for chaining.
   * @see {@link EventCaster.#filterToRegExp} for additional exceptions thrown.
   * @see {@link Validation.validateCallback} for additional exceptions thrown.
   */
  onThis(filter, callback) {
    return this.on(`${NomadVM.#eventPrefix}:${this.name}:${filter}`, callback);
  }

  /**
   * Attach the given callback to this particular VM's caster, triggered on events matching the given filter, and removed upon being called once.
   *
   * @param {unknown} filter - Event name filter to assign the listener to.
   * @param {unknown} callback - Callback to call on a matching event being cast.
   * @returns {NomadVM} `this`, for chaining.
   * @see {@link EventCaster.on} for additional exceptions thrown.
   */
  onceThis(filter, callback) {
    return this.once(`${NomadVM.#eventPrefix}:${this.name}:${filter}`, callback);
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Post the JSON string associated to the given data to the VM's {@link Worker}.
   *
   * @param {object} data - Data to post to the {@link Worker}.
   * @returns {void}
   * @private
   */
  #postJsonMessage(data) {
    this.#worker.postMessage(JSON.stringify(data));
  }

  /**
   * Post a `resolve` message to the {@link Worker}.
   *
   * A `resolve` message has the form:
   *
   * ```json
   * {
   *   name: "resolve",
   *   namespace: <string>,
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
   * @param {string} namespace - The namespace to use.
   * @param {number} tunnel - The tunnel to resolve.
   * @param {unknown} payload - The payload to use for resolution.
   * @returns {void}
   * @private
   */
  #postResolveMessage(namespace, tunnel, payload) {
    this.#postJsonMessage({ name: 'resolve', namespace, tunnel, payload });
  }

  /**
   * Post a `reject` message to the {@link Worker}.
   *
   * A `reject` message has the form:
   *
   * ```json
   * {
   *   name: "reject",
   *   namespace: <string>,
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
   * @param {string} namespace - The namespace to use.
   * @param {number} tunnel - The tunnel to reject.
   * @param {string} error - The error message to use for {@link Error} construction in the {@link Worker}.
   * @returns {void}
   * @private
   */
  #postRejectMessage(namespace, tunnel, error) {
    this.#postJsonMessage({ name: 'reject', namespace, tunnel, error });
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
   * @param {string} namespace - The namespace to use.
   * @param {string} event - The event name to emit.
   * @param {Array<unknown>} args - The arguments to associate to the given event.
   * @returns {void}
   * @private
   */
  #postEmitMessage = (namespace, event, args) => {
    this.#postJsonMessage({
      name: 'emit',
      namespace,
      event: event,
      args,
    });
  };

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
   * @param {string} namespace - The namespace to use.
   * @param {number} tunnel - The tunnel index to expect a response on.
   * @param {DependencyObject} dependency - The dependency being installed.
   * @returns {void}
   * @private
   */
  #postInstallMessage = (namespace, tunnel, dependency) => {
    this.#postJsonMessage({ name: 'install', namespace, tunnel, dependency });
  };

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
   * @param {string} namespace - The namespace to use.
   * @param {number} tunnel - The tunnel index to expect a response on.
   * @param {DependencyObject} dependency - The dependency being executed.
   * @param {Map<string, unknown>} args - The arguments to execute the dependency with.
   * @returns {void}
   * @private
   */
  #postExecuteMessage = (namespace, tunnel, dependency, args) => {
    this.#postJsonMessage({
      name: 'execute',
      namespace,
      tunnel,
      dependency,
      args: Object.fromEntries(args.entries()),
    });
  };

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
   * @param {string} namespace - The namespace to use.
   * @param {number} tunnel - The tunnel index to expect a response on.
   * @param {number} idx - The predefined function index to use.
   * @param {string} funcName - The function name to use.
   * @returns {void}
   * @private
   */
  #postPredefineMessage = (namespace, tunnel, idx, funcName) => {
    this.#postJsonMessage({
      name: 'predefine',
      namespace,
      tunnel,
      idx,
      function: funcName,
    });
  };

  /**
   * Post a `create` message to the {@link Worker}.
   *
   * A `create` message has the form:
   *
   * ```json
   * {
   *   name: "create",
   *   namespace: <string>,
   *   parent: <string | null>,
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `namespace` is the WW-side namespace to create.
   * - `parent` is an optional WW-side namespace name to use as parent.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param {string} namespace - The namespace to create.
   * @param {string | null} parent - The WW-side namespace to use as parent, or `null` if no parent is used.
   * @param {number} tunnel - The tunnel index to expect a response on.
   * @returns {void}
   * @private
   */
  #postCreateMessage = (namespace, parent, tunnel) => {
    this.#postJsonMessage({
      name: 'create',
      namespace,
      parent,
      tunnel,
    });
  };

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
   * @param {number} tunnel - The tunnel index to expect a response on.
   * @param {string} namespace - The namespace to delete.
   * @returns {void}
   * @private
   */
  #postDeleteMessage = (tunnel, namespace) => {
    this.#postJsonMessage({ name: 'delete', tunnel, namespace });
  };

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
   * @param {string} namespace - The namespace to use as link source.
   * @param {number} tunnel - The tunnel index to expect a response on.
   * @param {string} target - The namespace to use as link target.
   * @returns {void}
   * @private
   */
  #postLinkMessage = (namespace, tunnel, target) => {
    this.#postJsonMessage({ name: 'link', namespace, tunnel, target });
  };

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
   * @param {string} namespace - The namespace to use as unlink source.
   * @param {number} tunnel - The tunnel index to expect a response on.
   * @param {string} target - The namespace to use as unlink target.
   * @returns {void}
   * @private
   */
  #postUnlinkMessage = (namespace, tunnel, target) => {
    this.#postJsonMessage({ name: 'unlink', namespace, tunnel, target });
  };

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
   * @param {string} namespace - The namespace to mute.
   * @param {number} tunnel - The tunnel index to expect a response on.
   * @returns {void}
   * @private
   */
  #postMuteMessage = (namespace, tunnel) => {
    this.#postJsonMessage({ name: 'mute', namespace, tunnel });
  };

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
   * @param {string} namespace - The namespace to unmute.
   * @param {number} tunnel - The tunnel index to expect a response on.
   * @returns {void}
   * @private
   */
  #postUnmuteMessage = (namespace, tunnel) => {
    this.#postJsonMessage({ name: 'unmute', namespace, tunnel });
  };

  /**
   * Post a `listNamespaces` message to the {@link Worker}.
   *
   * A `listNamespaces` message has the form:
   *
   * ```json
   * {
   *   name: "listNamespaces",
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param {number} tunnel - The tunnel index to expect a response on.
   * @returns {void}
   * @private
   */
  #postListNamespacesMessage = (tunnel) => {
    this.#postJsonMessage({ name: 'listNamespaces', tunnel });
  };

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
   * @param {string} namespace - The namespace to list installed dependencies of.
   * @param {number} tunnel - The tunnel index to expect a response on.
   * @returns {void}
   * @private
   */
  #postListInstalledMessage = (namespace, tunnel) => {
    this.#postJsonMessage({ name: 'listInstalled', namespace, tunnel });
  };

  /**
   * Post a `listLinkedTo` message to the {@link Worker}.
   *
   * A `listLinkedTo` message has the form:
   *
   * ```json
   * {
   *   name: "listLinkedTo",
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
   * @param {string} namespace - The namespace to list linked-to namespaces of.
   * @param {number} tunnel - The tunnel index to expect a response on.
   * @returns {void}
   * @private
   */
  #postListLinkedToMessage = (namespace, tunnel) => {
    this.#postJsonMessage({ name: 'listLinkedTo', namespace, tunnel });
  };

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
   * @param {string} namespace - The namespace to list linked-from namespaces of.
   * @param {number} tunnel - The tunnel index to expect a response on.
   * @returns {void}
   * @private
   */
  #postListLinkedFromMessage = (namespace, tunnel) => {
    this.#postJsonMessage({ name: 'listLinkedFrom', namespace, tunnel });
  };

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
   * @param {string} namespace - The namespace to determine mute status.
   * @param {number} tunnel - The tunnel index to expect a response on.
   * @returns {void}
   * @private
   */
  #postIsMutedMessage = (namespace, tunnel) => {
    this.#postJsonMessage({ name: 'isMuted', namespace, tunnel });
  };

  /**
   * Post a `getAncestors` message to the {@link Worker}.
   *
   * A `getAncestors` message has the form:
   *
   * ```json
   * {
   *   name: "getAncestors",
   *   namespace: <string>,
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `namespace` is the WW-side namespace to determine the ancestors of.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param {string} namespace - The namespace to determine the ancestors of.
   * @param {number} tunnel - The tunnel index to expect a response on.
   * @returns {void}
   * @private
   */
  #postGetAncestorsMessage = (namespace, tunnel) => {
    this.#postJsonMessage({ name: 'getAncestors', namespace, tunnel });
  };

  /**
   * Post a `getChildren` message to the {@link Worker}.
   *
   * A `getChildren` message has the form:
   *
   * ```json
   * {
   *   name: "getChildren",
   *   namespace: <string>,
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `namespace` is the WW-side namespace to determine the children of.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param {string} namespace - The namespace to determine the children of.
   * @param {number} tunnel - The tunnel index to expect a response on.
   * @returns {void}
   * @private
   */
  #postGetChildrenMessage = (namespace, tunnel) => {
    this.#postJsonMessage({ name: 'getChildren', namespace, tunnel });
  };

  /**
   * Post a `pendingTunnels` message to the {@link Worker}.
   *
   * A `pendingTunnels` message has the form:
   *
   * ```json
   * {
   *   name: "pendingTunnels",
   *   namespace: <string>,
   *   tunnel: <int>
   * }
   * ```
   *
   * Where:
   *
   * - `namespace` is the WW-side namespace to determine the number of pending tunnels of.
   * - `tunnel` is the VM-side tunnel index awaiting a response.
   *
   * @param {string} namespace - The namespace to determine the number of pending tunnels of.
   * @param {number} tunnel - The tunnel index to expect a response on.
   * @returns {void}
   * @private
   */
  #postPendingTunnelsMessage = (namespace, tunnel) => {
    this.#postJsonMessage({ name: 'pendingTunnels', namespace, tunnel });
  };

  // ----------------------------------------------------------------------------------------------

  /**
   * Create a new tunnel (cf. {@link NomadVM.#tunnels}) with the given resolution and rejection callbacks and namespace handling it, returning the index of the created tunnel.
   *
   * @param {Function} resolve - The resolution callback.
   * @param {Function} reject - The rejection callback.
   * @param {string | null} namespace - The WW-side namespace that will respond (or `null`, if not namespace-targeted).
   * @returns {number} The created tunnel's index.
   * @private
   */
  #addTunnel(resolve, reject, namespace) {
    return this.#tunnels.push(Validation.tunnelDescriptor(resolve, reject, namespace)) - 1;
  }

  /**
   * Remove the given tunnel and return its former resolution / rejection callbacks.
   *
   * @param {number} tunnel - The tunnel to remove.
   * @returns {{reject: Function, resolve: Function}} The resolution / rejection callbacks that used to be at the given index.
   * @throws {Error} If the given tunnel index does not exist.
   * @private
   */
  #removeTunnel(tunnel) {
    if (!(tunnel in this.#tunnels)) {
      throw new Error(`tunnel ${tunnel} does not exist`);
    }
    const result = this.#tunnels[tunnel];
    delete this.#tunnels[tunnel];
    return result;
  }

  /**
   * Resolve the given tunnel with the given arguments, removing the tunnel from the tunnels list.
   *
   * @param {number} tunnel - Tunnel to resolve.
   * @param {unknown} arg - Argument to pass on to the resolution callback.
   * @returns {void}
   * @private
   * @see {@link NomadVM.#removeTunnel} for additional exceptions thrown.
   */
  #resolveTunnel(tunnel, arg) {
    this.#removeTunnel(tunnel).resolve(arg);
  }

  /**
   * Reject the given tunnel with the given error object, removing the tunnel from the tunnels list.
   *
   * @param {number} tunnel - Tunnel to reject.
   * @param {Error} error - {@link Error} to pass on to the rejection callback.
   * @returns {void}
   * @private
   * @see {@link NomadVM.#removeTunnel} for additional exceptions thrown.
   */
  #rejectTunnel(tunnel, error) {
    this.#removeTunnel(tunnel).reject(error);
  }

  /**
   * Reject all tunnels associated to any of the given WW-side namespaces with the given error object, removing these tunnels from the tunnels list.
   *
   * @param {Array<string>} namespaces - Namespaces to reject tunnels for.
   * @param {Error} error - {@link Error} to pass on to the rejection callbacks.
   * @returns {void}
   * @private
   * @see {@link NomadVM.#rejectTunnel} for additional exceptions thrown.
   */
  #rejectAllInNamespaces(namespaces, error) {
    this.#tunnels.forEach(({ namespace }, tunnel) => {
      if (namespaces.includes(namespace)) {
        this.#rejectTunnel(tunnel, error);
      }
    });
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Call the given predefined function ID with the given arguments, resolving or rejecting the given tunnel ID with the result or error.
   *
   * @param {string} namespace - Namespace to use.
   * @param {number} tunnel - Tunnel to use for resolution / rejection signalling.
   * @param {number} idx - The predefined function index to call.
   * @param {Array<unknown>} args - The arguments to forward to the predefined function called.
   * @returns {void}
   * @private
   */
  #callPredefined(namespace, tunnel, idx, args) {
    this.#castEvent(`${namespace}:predefined:call`, idx, args);
    if (idx in this.#predefined) {
      try {
        this.#postResolveMessage(namespace, tunnel, this.#predefined[idx].apply(undefined, args));
        this.#castEvent(`${namespace}:predefined:call:ok`, idx, args);
      } catch (e) {
        this.#postRejectMessage(namespace, tunnel, e.message);
        this.#castEvent(`${namespace}:predefined:call:error`, idx, args, e);
      }
    } else {
      this.#postRejectMessage(namespace, tunnel, `unknown function index ${idx}`);
      this.#castEvent(`${namespace}:predefined:call:error`, idx, args, new Error(`unknown function index ${idx}`));
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
   * @param {object} event - The message event itself.
   * @param {string} event.data - The message's `data` field, a JSON-encoded string.
   * @returns {void}
   * @private
   */
  #messageHandler({ data }) {
    try {
      const parsedData = JSON.parse(data);
      switch (parsedData.name) {
        case 'resolve':
          {
            const { tunnel, payload } = parsedData;
            this.#resolveTunnel(tunnel, payload);
          }
          break;
        case 'reject':
          {
            const { tunnel, error } = parsedData;
            this.#rejectTunnel(tunnel, new Error(error));
          }
          break;
        case 'call':
          {
            const { namespace, tunnel, idx, args } = parsedData;
            this.#callPredefined(namespace, tunnel, idx, args);
          }
          break;
        case 'emit':
          {
            const { event, args } = parsedData;
            this.#castEvent(event, args);
          }
          break;
        default: {
          const { tunnel } = parsedData;
          if (undefined !== tunnel) {
            this.#postRejectMessage(tunnel, `unknown event name ${parsedData.name}`);
          }
          throw new Error(`unknown event name ${parsedData.name}`);
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
   * @param {unknown} error - Error to handle.
   * @returns {void}
   * @private
   */
  #errorHandler(error) {
    error.preventDefault();
    this.#castEvent('worker:error', error);
  }

  /**
   * Handle the {@link Worker}'s `messageerror` event.
   *
   * Handling a {@link Worker}'s `messageerror` event simply entails casting a `worker:error` event.
   *
   * @param {object} event - The message event itself.
   * @param {unknown} event.data - The message's `data` field.
   * @returns {void}
   * @private
   */
  #messageErrorHandler({ data }) {
    this.#castEvent('worker:error', data);
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Start the {@link Worker} and wait for its boot-up sequence to complete.
   *
   * Starting a VM instance consists of the following:
   *
   * 1. Initializing a {@link Worker} instance with the {@link NomadVM.#workerCode} callback.
   * 2. Setting up the boot timeout callback (in case the {@link Worker} takes too much time to boot).
   * 3. Setting up the event listeners for `message`, `error`, and `messageerror`.
   *
   * @param {number} timeout - Milliseconds to wait for the {@link Worker} to complete its boot-up sequence.
   * @returns {Promise<Array<number>, Error>} A {@link Promise} that resolves with a pair of boot duration times (as measured from "inside" and "outside" of the {@link Worker} respectively) if the {@link Worker} was successfully booted up, and rejects with an {@link Error} in case errors are found.
   */
  start(timeout = 100) {
    return new Promise((resolve, reject) => {
      this.#castEvent('start');
      try {
        if ('created' !== this.#state) {
          throw new Error("state mismatch --- should be 'created'");
        }
        timeout = Validation.timeout(timeout);
        this.#state = 'booting';
        let blobURL;
        try {
          let externalBootTime = Date.now();
          let bootTimeout;
          this.#addTunnel(
            (internalBootTime) => {
              clearTimeout(bootTimeout);
              URL.revokeObjectURL(blobURL);
              this.#state = 'running';
              this.#castEvent('start:ok');
              resolve([internalBootTime, Date.now() - externalBootTime]);
            },
            (error) => {
              clearTimeout(bootTimeout);
              URL.revokeObjectURL(blobURL);
              this.#castEvent('start:error', error);
              this.stop().then(
                () => reject(error),
                () => reject(error),
              );
            },
            'default',
          );
          bootTimeout = setTimeout(() => {
            this.#rejectTunnel(0, new Error('boot timed out'));
          }, timeout);

          blobURL = URL.createObjectURL(
            new Blob([`"use strict";(${NomadVM.#workerRunner})();`], {
              type: 'application/javascript',
            }),
          );

          this.#worker = new Worker(blobURL, {
            name: this.#name,
            type: 'classic',
            credentials: 'omit',
          });

          this.#worker.addEventListener('message', (...args) => this.#messageHandler(...args));
          this.#worker.addEventListener('error', (...args) => this.#errorHandler(...args));
          this.#worker.addEventListener('messageerror', (...args) => this.#messageErrorHandler(...args));
        } catch (e) {
          URL.revokeObjectURL(blobURL);
          throw e;
        }
      } catch (e) {
        this.#castEvent('start:error', e);
        reject(e);
      }
    });
  }

  /**
   * Stop the {@link Worker} and reject all pending tunnels.
   *
   * Stopping a Vm instance entails:
   *
   * 1. Calling {@link Worker.terminate} on the VM's {@link Worker}.
   * 2. Rejecting all existing tunnels.
   *
   * @returns {Promise<void, Error>} A {@link Promise} that resolves with `void` if the stopping procedure completed successfully, and rejects with an {@link Error} in case errors occur.
   */
  stop() {
    return new Promise((resolve, reject) => {
      this.#castEvent('stop');
      try {
        if ('stopped' !== this.#state) {
          this.#state = 'stopped';

          this.#worker.terminate();
          this.#worker = null;

          this.#tunnels.forEach((_, idx) => {
            try {
              this.#rejectTunnel(idx, new Error('stopped'));
            } catch (e) {
              this.#castEvent('stop:error:ignored', e);
            }
          });
          this.#tunnels = null;

          this.#castEvent('stop:ok');
          resolve();
        }
      } catch (e) {
        this.#castEvent('stop:error', e);
        reject(e);
      }
    });
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Create a new namespace with the given name and, optionally, using the given namespace as parent.
   *
   * @param {string} namespace - Namespace to create.
   * @param {string} parent - Namespace to use as parent, or `null` if no parent given.
   * @returns {Promise<void, Error>} A {@link Promise} that resolves with `void` if namespace creation completed successfully, and rejects with an {@link Error} in case errors occur.
   */
  createNamespace(namespace, parent = null) {
    return new Promise((resolve, reject) => {
      this.#castEvent(`${namespace}:create`, parent);
      try {
        if ('running' !== this.#state) {
          throw new Error("state mismatch --- should be 'running'");
        }

        this.#postCreateMessage(
          namespace,
          parent,
          this.#addTunnel(
            () => {
              this.#castEvent(`${namespace}:create:ok`, parent);
              resolve();
            },
            (error) => {
              this.#castEvent(`${namespace}:create:error`, parent, error);
              reject(error);
            },
            namespace,
          ),
        );
      } catch (e) {
        this.#castEvent(`${namespace}:create:error`, parent, e);
        reject(e);
      }
    });
  }

  /**
   * Delete the namespace with the given name.
   *
   * This method will reject all tunnels awaiting responses on the given namespace.
   *
   * @param {string} namespace - Namespace to delete.
   * @returns {Promise<Array<string>, Error>} A {@link Promise} that resolves with a list of deleted namespaces (the one given and any children of it) if namespace deletion completed successfully, and rejects with an {@link Error} in case errors occur.
   */
  deleteNamespace(namespace) {
    return new Promise((resolve, reject) => {
      this.#castEvent(`${namespace}:delete`);
      try {
        if ('running' !== this.#state) {
          throw new Error("state mismatch --- should be 'running'");
        }

        this.#postDeleteMessage(
          this.#addTunnel(
            (deleted) => {
              this.#rejectAllInNamespaces(deleted, new Error('deleting namespace'));
              this.#castEvent(`${namespace}:delete:ok`);
              resolve(deleted);
            },
            (error) => {
              this.#castEvent(`${namespace}:delete:error`, error);
              reject(error);
            },
            namespace,
          ),
          namespace,
        );
      } catch (e) {
        this.#castEvent(`${namespace}:delete:error`, e);
        reject(e);
      }
    });
  }

  /**
   * Link one namespace to another, so that events cast on the first are also handled in the second.
   *
   * @param {string} namespace - "Source" namespace to use.
   * @param {string} target - "Destination" namespace to use.
   * @returns {Promise<void, Error>} A {@link Promise} that resolves with `void` if namespace linking completed successfully, and rejects with an {@link Error} in case errors occur.
   */
  linkNamespaces(namespace, target) {
    return new Promise((resolve, reject) => {
      this.#castEvent(`${namespace}:link`, target);
      try {
        if ('running' !== this.#state) {
          throw new Error("state mismatch --- should be 'running'");
        }

        this.#postLinkMessage(
          namespace,
          this.#addTunnel(
            () => {
              this.#castEvent(`${namespace}:link:ok`, target);
              resolve();
            },
            (error) => {
              this.#castEvent(`${namespace}:link:error`, target, error);
              reject(error);
            },
            namespace,
          ),
          target,
        );
      } catch (e) {
        this.#castEvent(`"${namespace}:link:error`, target, e);
        reject(e);
      }
    });
  }

  /**
   * Unlink one namespace from another, so that events cast on the first are no longer handled in the second.
   *
   * @param {string} namespace - "Source" namespace to use.
   * @param {string} target - "Destination" namespace to use.
   * @returns {Promise<boolean, Error>} A {@link Promise} that resolves with a boolean indicating whether the target namespace was previously linked if namespace unlinking completed successfully, and rejects with an {@link Error} in case errors occur.
   */
  unlinkNamespaces(namespace, target) {
    return new Promise((resolve, reject) => {
      this.#castEvent(`${namespace}:unlink`, target);
      try {
        if ('running' !== this.#state) {
          throw new Error("state mismatch --- should be 'running'");
        }

        this.#postUnlinkMessage(
          namespace,
          this.#addTunnel(
            (unlinked) => {
              this.#castEvent(`${namespace}:unlink:ok`, target, unlinked);
              resolve(unlinked);
            },
            (error) => {
              this.#castEvent(`${namespace}:unlink:error`, target, error);
              reject(error);
            },
            namespace,
          ),
          target,
        );
      } catch (e) {
        this.#castEvent(`${namespace}:unlink:error`, target, e);
        reject(e);
      }
    });
  }

  /**
   * Mute the given namespace, so that events cast on it are no longer propagated to this VM.
   *
   * @param {string} namespace - Namespace to mute.
   * @returns {Promise<boolean, Error>} A {@link Promise} that resolves with the previous muting status if namespace muting completed successfully, and rejects with an {@link Error} in case errors occur.
   */
  muteNamespace(namespace) {
    return new Promise((resolve, reject) => {
      this.#castEvent(`${namespace}:muteNamespace`);
      try {
        if ('running' !== this.#state) {
          throw new Error("state mismatch --- should be 'running'");
        }

        this.#postMuteMessage(
          namespace,
          this.#addTunnel(
            (previous) => {
              this.#castEvent(`${namespace}:mute:ok`, previous);
              resolve(previous);
            },
            (error) => {
              this.#castEvent(`${namespace}:mute:error`, error);
              reject(error);
            },
            namespace,
          ),
        );
      } catch (e) {
        this.#castEvent(`${namespace}:mute:error`, e);
        reject(e);
      }
    });
  }

  /**
   * Unmute the given namespace, so that events cast on it are propagated to this VM.
   *
   * @param {string} namespace - Namespace to unmute.
   * @returns {Promise<boolean, Error>} A {@link Promise} that resolves with he previous muting status if namespace un-muting completed successfully, and rejects with an {@link Error} in case errors occur.
   */
  unmuteNamespace(namespace) {
    return new Promise((resolve, reject) => {
      this.#castEvent(`${namespace}:unmute`);
      try {
        if ('running' !== this.#state) {
          throw new Error("state mismatch --- should be 'running'");
        }

        this.#postUnmuteMessage(
          namespace,
          this.#addTunnel(
            (prev) => {
              this.#castEvent(`${namespace}:unmute:ok`, prev);
              resolve(prev);
            },
            (error) => {
              this.#castEvent(`${namespace}:unmute:error`, error);
              reject(error);
            },
            namespace,
          ),
        );
      } catch (e) {
        this.#castEvent(`${namespace}:unmute:error`, e);
        reject(e);
      }
    });
  }

  /**
   * List the namespaces created.
   *
   * @returns {Promise<Array<string>, Error>} A {@link Promise} that resolves with a list of namespaces created if successful, and rejects with an {@link Error} in case errors occur.
   */
  listNamespaces() {
    return new Promise((resolve, reject) => {
      try {
        if ('running' !== this.#state) {
          throw new Error("state mismatch --- should be 'running'");
        }

        this.#postListNamespacesMessage(this.#addTunnel(resolve, reject, null));
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * List the dependencies (user-level and predefined) installed on the given namespace or its ancestors.
   *
   * @param {string} namespace - Namespace to list installed dependencies of.
   * @returns {Promise<Array<string>, Error>} A {@link Promise} that resolves with a list of installed dependency names if successful, and rejects with an {@link Error} in case errors occur.
   */
  listInstalled(namespace) {
    return new Promise((resolve, reject) => {
      try {
        if ('running' !== this.#state) {
          throw new Error("state mismatch --- should be 'running'");
        }

        this.#postListInstalledMessage(namespace, this.#addTunnel(resolve, reject, namespace));
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * List the namespaces the given one is linked to.
   *
   * @param {string} namespace - Namespace to list linked-to namespaces of.
   * @returns {Promise<Array<string>, Error>} A {@link Promise} that resolves with a list of linked-to namespaces if successful, and rejects with an {@link Error} in case errors occur.
   */
  listLinkedTo(namespace) {
    return new Promise((resolve, reject) => {
      try {
        if ('running' !== this.#state) {
          throw new Error("state mismatch --- should be 'running'");
        }

        this.#postListLinkedToMessage(namespace, this.#addTunnel(resolve, reject, namespace));
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * List the namespaces that link to the given one.
   *
   * @param {string} namespace - Namespace to list linked-from namespaces of.
   * @returns {Promise<Array<string>, Error>} A {@link Promise} that resolves with a list of linked-from namespaces if successful, and rejects with an {@link Error} in case errors occur.
   */
  listLinkedFrom(namespace) {
    return new Promise((resolve, reject) => {
      try {
        if ('running' !== this.#state) {
          throw new Error("state mismatch --- should be 'running'");
        }

        this.#postListLinkedFromMessage(namespace, this.#addTunnel(resolve, reject, namespace));
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Determine whether the given namespace is muted.
   *
   * @param {string} namespace - Namespace to determine mute status of.
   * @returns {Promise<boolean, Error>} A {@link Promise} that resolves with a boolean value indicating whether the namespaces is muted if successful, and rejects with an {@link Error} in case errors occur.
   */
  isMuted(namespace) {
    return new Promise((resolve, reject) => {
      try {
        if ('running' !== this.#state) {
          throw new Error("state mismatch --- should be 'running'");
        }

        this.#postIsMutedMessage(namespace, this.#addTunnel(resolve, reject, namespace));
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * List the given namespace's ancestors.
   *
   * The resolved value will contain one entry per ancestry level, starting with the given namespace in position `0`, its parent in position `1`, etc.
   *
   * @param {string} namespace - Namespace to list the ancestry of.
   * @returns {Promise<Array<string>, Error>} A {@link Promise} that resolves with a list of ancestors if successful, and rejects with an {@link Error} in case errors occur.
   */
  getAncestors(namespace) {
    return new Promise((resolve, reject) => {
      try {
        if ('running' !== this.#state) {
          throw new Error("state mismatch --- should be 'running'");
        }

        this.#postGetAncestorsMessage(namespace, this.#addTunnel(resolve, reject, namespace));
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * List the given namespace's children.
   *
   * @param {string} namespace - Namespace to list the children of.
   * @returns {Promise<Array<string>, Error>} A {@link Promise} that resolves with a list of children namespaces if successful, and rejects with an {@link Error} in case errors occur.
   */
  getChildren(namespace) {
    return new Promise((resolve, reject) => {
      try {
        if ('running' !== this.#state) {
          throw new Error("state mismatch --- should be 'running'");
        }

        this.#postGetChildrenMessage(namespace, this.#addTunnel(resolve, reject, namespace));
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Return the number of pending tunnels in the given namespace.
   *
   * @param {string} namespace - Namespace to return the number of pending tunnels of.
   * @returns {Promise<number, Error>} A {@link Promise} that resolves with a number indicating the number of pending tunnels of the given namespace if successful, and rejects with an {@link Error} in case errors occur.
   */
  pendingTunnels(namespace) {
    return new Promise((resolve, reject) => {
      try {
        if ('running' !== this.#state) {
          throw new Error("state mismatch --- should be 'running'");
        }

        this.#postPendingTunnelsMessage(namespace, this.#addTunnel(resolve, reject, namespace));
      } catch (e) {
        reject(e);
      }
    });
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Add a predefined function to the VM's list (cf. {@link NomadVM.#predefined}).
   *
   * @param {string} namespace - Namespace to use.
   * @param {string} name - Function name to add.
   * @param {Function} callback - {@link Function} callback to use.
   * @returns {Promise<void, Error>} A {@link Promise} that resolves with `void` if the {@link Function} was correctly predefined, and rejects with an {@link Error} in case errors occurred.
   */
  predefine(namespace, name, callback) {
    return new Promise((resolve, reject) => {
      const idx = this.#predefined.length;
      this.#castEvent(`${namespace}:predefined:add`, name, callback, idx);
      try {
        if ('running' !== this.#state) {
          throw new Error("state mismatch --- should be 'running'");
        }
        this.#postPredefineMessage(
          namespace,
          this.#addTunnel(
            () => {
              this.#castEvent(`${namespace}:predefined:add:ok`, name, callback, idx);
              resolve();
            },
            (error) => {
              delete this.#predefined[idx];
              this.#castEvent(`${namespace}:predefined:add:error`, name, callback, idx, error);
              reject(error);
            },
            namespace,
          ),
          idx,
          Validation.identifier(name),
        );
      } catch (e) {
        this.#castEvent(`${namespace}:predefined:add:error`, name, callback, idx, e);
        reject(e);
      }
    });
  }

  /**
   * Install the given {@link Dependency} on the {@link Worker}.
   *
   * @param {string} namespace - Namespace to use.
   * @param {Dependency} dependency - The {@link Dependency} to install.
   * @returns {Promise<void, Error>} A {@link Promise} that resolves with `void` if the {@link Dependency} was correctly installed, and rejects with an {@link Error} in case errors occurred.
   */
  install(namespace, dependency) {
    return new Promise((resolve, reject) => {
      this.#castEvent(`${namespace}:install`, dependency);
      try {
        if (!(dependency instanceof Dependency)) {
          throw new Error('can only install Dependency');
        }
        if ('running' !== this.#state) {
          throw new Error("state mismatch --- should be 'running'");
        }

        this.#postInstallMessage(
          namespace,
          this.#addTunnel(
            () => {
              this.#castEvent(`${namespace}:install:ok`, dependency);
              resolve();
            },
            (error) => {
              this.#castEvent(`${namespace}:install:error`, dependency, error);
              reject(error);
            },
            namespace,
          ),
          dependency.asObject(),
        );
      } catch (e) {
        this.#castEvent(`${namespace}:install:error`, dependency, e);
        reject(e);
      }
    });
  }

  /**
   * Execute the given {@link Dependency} with the given arguments map in the {@link Worker}.
   *
   * @param {string} namespace - The namespace to use.
   * @param {Dependency} dependency - The {@link Dependency} to execute.
   * @param {Map<string, unknown>} args - The arguments map to execute with.
   * @returns {Promise<unknown, Error>} A {@link Promise} that resolves with the {@link Dependency}'s execution result, and rejects with an {@link Error} in case errors occurred.
   */
  execute(namespace, dependency, args = new Map()) {
    return new Promise((resolve, reject) => {
      try {
        this.#castEvent(`${namespace}:execute`, dependency, args);

        if (!(dependency instanceof Dependency)) {
          throw new Error('can only execute Dependency');
        }
        if ('running' !== this.#state) {
          throw new Error("state mismatch --- should be 'running'");
        }

        this.#postExecuteMessage(
          namespace,
          this.#addTunnel(
            (result) => {
              this.#castEvent(`${namespace}:execute:ok`, dependency, args, result);
              resolve(result);
            },
            (error) => {
              this.#castEvent(`${namespace}:execute:error`, dependency, args, error);
              reject(error);
            },
            namespace,
          ),
          dependency.asObject(),
          Validation.argumentsMap(args),
        );
      } catch (e) {
        this.#castEvent(`${namespace}:execute:error`, dependency, args, e);
        reject(e);
      }
    });
  }

  /**
   * Install the given {@link Dependency} iterable, by sorting them topologically and installing each one in turn.
   *
   * @param {string} namespace - Namespace to use.
   * @param {Iterable<Dependency>} dependencies - Dependencies to install.
   * @returns {Promise<void, Error>} A {@link Promise} that resolves with `void` if every {@link Dependency} in the iterable was correctly installed, and rejects with an {@link Error} in case errors occurred.
   */
  installAll(namespace, dependencies) {
    /**
     * Topologically sort the given {@link Dependency} iterable by their dependency tree relations, using the given pre-installed {@link Dependency} names.
     *
     * @param {Iterable<string>} installed - Installed {@link Dependency} names to assume existing.
     * @param {Iterable<Dependency>} dependencies - Dependencies to sort.
     * @returns {Array<Dependency>} Sorted {@link Dependency} list.
     * @throws {Error} If unresolved dependencies found.
     */
    const topologicalSort = (installed, dependencies) => {
      const existing = new Set(installed);
      const pending = new Set(dependencies);
      const newOnes = new Set();
      const result = [];

      do {
        newOnes.forEach((element) => {
          pending.delete(element);
          existing.add(element.name);
          result.push(element);
        });
        newOnes.clear();
        pending.forEach((element) => {
          if (Object.keys(element.dependencies).every((dep) => existing.has(dep))) {
            newOnes.add(element);
          }
        });
      } while (0 < newOnes.size);

      if (0 < pending.size) {
        throw new Error(
          `unresolved dependencies: [${pending
            .values()
            .map((value) => value.toString())
            .join(', ')}]`,
        );
      }

      return result;
    };

    return new Promise((resolve, reject) => {
      if (
        null === dependencies ||
        'object' !== typeof dependencies ||
        'function' !== typeof dependencies[Symbol.iterator]
      ) {
        throw new Error('expected Iterable');
      }
      try {
        this.listInstalled(namespace).then((installed) => {
          Promise.all(topologicalSort(Object.keys(installed), dependencies).map(this.install)).then(resolve, reject);
        }, reject);
      } catch (e) {
        reject(e);
      }
    });
  }

  // ----------------------------------------------------------------------------------------------

  /**
   * Emit an event towards the {@link Worker}.
   *
   * @param {number} namespace - Namespace to use.
   * @param {string} event - Event name to emit.
   * @param {...any} args - Associated arguments to emit alongside the event.
   * @returns {NomadVM} `this`, for chaining.
   */
  emit(namespace, event, ...args) {
    this.#postEmitMessage(namespace, EventCaster.validateEvent(event), args);
    return this;
  }
}

export { NomadVM };
