'use strict';

// TODO: ADD MISSING SHIMS
// TODO: ANALYZE Iterator AND OTHER HIDDEN OBJECTS

// TODO: expose a new class "namespace" (or thereabouts) that will behave just like the namespace-oriented methods of NomadVM but be initialized with a specific namespace, so as to allow the end users to use a more comfortable interface.

import { Dependency } from './dependency.js';
import { NomadVM, NomadVMNamespace } from './nomadvm.js';

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

export { Dependency, NomadVM, NomadVMNamespace };
