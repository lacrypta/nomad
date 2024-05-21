'use strict';

// TODO: ANALYZE Iterator AND OTHER HIDDEN OBJECTS

// TODO: Change "namespace" to "enclosure" or something along those lines

// TODO: For worker.js, only use eslint JS rules, avoid eslint ts rules (otoh: pay attention to them as well, no matter how whiny they are)

// TODO: Split NomadVM.stop() into three parts:
// TODO:   - NomadVM.kill(): IMMEDIATELY terminates the worker.
// TODO:   - NomadVM.shutdown(): Rejects all pending tunnels and then calls NomadVM.kill()
// TODO:   - NomadVM.stop(): Emits an event to the worker, after a certain amount of time, calls NomadVM.shutdown()
// TODO: A pin/pong failure will trigger NomadVM.kill()

import type { WorkerBuilder, WorkerInstance } from './worker';

import { Dependency } from './dependency';
import { NomadVM, NomadVMNamespace } from './nomadvm';
import { builder, build } from './worker';

export type { WorkerBuilder, WorkerInstance };

export { Dependency, NomadVM, NomadVMNamespace, builder, build };
