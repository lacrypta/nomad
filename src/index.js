'use strict';

// TODO: ADD MISSING SHIMS
// TODO: ANALYZE Iterator AND OTHER HIDDEN OBJECTS

// TODO: in order to have children being assimilated into parents, we need to unify the EventCasters used and segregate them internally so that one namespace does not get another one's events

import { Dependency } from './dependency.js';
import { NomadVM } from './nomadvm.js';

/**
 * The type of a Dependency primitive object.
 *
 * @typedef DependencyObject
 * @type {object}
 * @global
 * @property {string} name - Dependency name.
 * @property {string} code - Dependency function source code.
 * @property {Map<string, string>} dependencies - Dependency's dependencies, as a mapping from imported name to dependency name.
 */

/**
 * The type of a "protected" method injector.
 *
 * @callback ProtectedMethodInjector
 * @global
 * @param {Map<string, Function>} protectedMethodMap - A map from "protected" method name to a {@link Function} that will effectively forward the call to it.
 * @returns {void}
 */

/* exported DependencyObject */
/* exported ProtectedMethodInjector */
/* exported NomadVM */
/* exported Validation */

export { Dependency, NomadVM };
