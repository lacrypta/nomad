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

import type { DependencyInterface, DependencyObject } from './dependency';
import type { EventCallback, EventCasterInterface } from './eventCaster';
import type { NomadInterface, NomadEnclosureInterface } from './nomadvm';
import type { WorkerBuilder, WorkerInterface } from './worker';

import { create as _dependencyCreate, from as _dependencyFrom } from './dependency';
import { create as _nomadVmCreate, events as _nomadVmEvents, get as _nomadVmGet } from './nomadvm';
import { build as _workerBuild, builder as _workerBuilder } from './worker';

const dependencyCreate = _dependencyCreate;
const dependencyFrom = _dependencyFrom;
const nomadVmCreate = _nomadVmCreate;
const nomadVmGet = _nomadVmGet;
const workerBuild = _workerBuild;
const workerBuilder = _workerBuilder;

const nomadVmEvents = _nomadVmEvents;

export type { DependencyInterface, DependencyObject };
export type { EventCallback, EventCasterInterface };
export type { NomadInterface, NomadEnclosureInterface };
export type { WorkerBuilder, WorkerInterface };

export { dependencyCreate, dependencyFrom };
export { nomadVmCreate, nomadVmGet, nomadVmEvents };
export { workerBuild, workerBuilder };
