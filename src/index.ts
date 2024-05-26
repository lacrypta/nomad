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

// ------------------------------------------------------------------------------------------------

// TODO: ANALYZE Iterator AND OTHER HIDDEN OBJECTS

// TODO: For worker.js, only use eslint JS rules, avoid eslint ts rules (otoh: pay attention to them as well, no matter how whiny they are)

// ------------------------------------------------------------------------------------------------

import type { Dependency, DependencyObject } from './dependency';
import type { EventCallback, EventCaster } from './eventCaster';
import type { VM, Enclosure } from './vm';
import type { WorkerBuilder, WorkerInterface } from './worker';

import { create as _dependencyCreate, from as _dependencyFrom } from './dependency';
import { create as _vmCreate, events as _vmEvents, get as _vmGet } from './vm';
import { build as _workerBuild, builder as _workerBuilder } from './worker';

const dependencyCreate = _dependencyCreate;
const dependencyFrom = _dependencyFrom;
const vmCreate = _vmCreate;
const vmGet = _vmGet;
const workerBuild = _workerBuild;
const workerBuilder = _workerBuilder;

const vmEvents = _vmEvents;

export type { Dependency, DependencyObject };
export type { EventCallback, EventCaster };
export type { VM, Enclosure };
export type { WorkerBuilder, WorkerInterface };

export { dependencyCreate, dependencyFrom };
export { vmCreate, vmGet, vmEvents };
export { workerBuild, workerBuilder };
