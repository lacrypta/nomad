'use strict';

// TODO: ANALYZE Iterator AND OTHER HIDDEN OBJECTS

// TODO: For worker.js, only use eslint JS rules, avoid eslint ts rules (otoh: pay attention to them as well, no matter how whiny they are)

import type { WorkerBuilder, WorkerInstance } from './worker';

import { Dependency } from './dependency';
import { NomadVM, NomadVMEnclosure } from './nomadvm';
import { builder as workerBuilder, build as buildWorker } from './worker';

export type { WorkerBuilder, WorkerInstance };

export { Dependency, NomadVM, NomadVMEnclosure, workerBuilder, buildWorker };
