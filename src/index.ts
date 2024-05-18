'use strict';

// TODO: ADD MISSING SHIMS
// TODO: ANALYZE Iterator AND OTHER HIDDEN OBJECTS

// TODO: (TS) Change instances of Function to more precise callable typings

// TODO: add ping / pong to detect unresponsive worker
// TODO:   - add VM ---> WW message "ping"
// TODO:   - add WW ---> VM message "pong"
// TODO: these messages have no tunnel associated to them, they're low-level interconnect
// TODO: maintain a counter for the last time a pong was received, if more than X time elapsed, stop the VM (casting an event to that effect)

// TODO: change "namespace" to "enclosure" or something along those lines

// TODO: for worker.js, only use eslint JS rules, avoid eslint ts rules (otoh: pay attention to them as well, no matter how whiny they are)

import { Dependency } from './dependency';
import { NomadVM, NomadVMNamespace } from './nomadvm';

export { Dependency, NomadVM, NomadVMNamespace };
