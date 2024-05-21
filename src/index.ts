'use strict';

// TODO: ANALYZE Iterator AND OTHER HIDDEN OBJECTS

// TODO: Change "namespace" to "enclosure" or something along those lines

// TODO: For worker.js, only use eslint JS rules, avoid eslint ts rules (otoh: pay attention to them as well, no matter how whiny they are)

import type { WorkerBuilder, WorkerInstance } from './worker';

import { Dependency } from './dependency';
import { NomadVM, NomadVMNamespace } from './nomadvm';
import { builder, build } from './worker';

export type { WorkerBuilder, WorkerInstance };

export { Dependency, NomadVM, NomadVMNamespace, builder, build };
