'use strict';

// TODO: ADD MISSING SHIMS
// TODO: ANALYZE Iterator AND OTHER HIDDEN OBJECTS

// TODO: change "namespace" to "enclosure" or something along those lines

// TODO: for worker.js, only use eslint JS rules, avoid eslint ts rules (otoh: pay attention to them as well, no matter how whiny they are)

import { Dependency } from './dependency';
import { NomadVM, NomadVMNamespace } from './nomadvm';

export { Dependency, NomadVM, NomadVMNamespace };
