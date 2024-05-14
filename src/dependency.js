'use strict';

import { Validation } from './validation';

/* global DependencyObject */

/**
 * Class representing an atomic dependency the NomadVM will work with.
 *
 */
class Dependency {
  /**
   * The prefix all builtin functions exhibit on their string representation.
   *
   * @type {string}
   * @private
   */
  static #builtinPrefix;

  /**
   * The suffix all builtin functions exhibit on their string representation.
   *
   * @type {string}
   * @private
   */
  static #builtinSuffix;

  static {
    /**
     * Determine the longest common prefix of the given strings.
     *
     * @param {...string} args - Strings to get the longest common prefix of.
     * @returns {string} The longest common prefix of the given strings.
     */
    const lcp = (...args) => {
      return args.reduce((a, b) => {
        const l = Math.min(a.length, b.length);
        for (let i = 0; i < l; i++) {
          if (!a.startsWith(b.substring(0, i + 1))) {
            return b.substring(0, i);
          }
        }
        return a.startsWith(b) ? b : b.startsWith(a) ? a : '';
      });
    };

    /**
     * Determine the longest common suffix of the given strings.
     *
     * @param {...string} args - Strings to get the longest common suffix of.
     * @returns {string} The longest common suffix of the given strings.
     */
    const lcs = (...args) =>
      lcp(...args.map((x) => x.split('').reverse().join('')))
        .split('')
        .reverse()
        .join('');

    /**
     * List of builtin functions to analyze for prefix / suffix behavior.
     *
     * @type {Array<string>}
     */
    const builtin = [
      eval.toString(),
      isFinite.toString(),
      isNaN.toString(),
      parseFloat.toString(),
      parseInt.toString(),
      decodeURI.toString(),
      decodeURIComponent.toString(),
      encodeURI.toString(),
      encodeURIComponent.toString(),
    ];

    Dependency.#builtinPrefix = lcp(...builtin);
    Dependency.#builtinSuffix = lcs(...builtin);
  }

  /**
   * Test whether the given instance is a "defined" function (in contrast to a built-in or bound function).
   *
   * @param {unknown} func - Instance to test.
   * @returns {boolean} True if the given argument is a defined function, false otherwise.
   * @private
   */
  static #isDefinedFunction(func) {
    // https://stackoverflow.com/a/38830947
    return (
      Function === func.constructor &&
      !(func.toString().startsWith(Dependency.#builtinPrefix) && func.toString().endsWith(Dependency.#builtinSuffix))
    );
  }

  /**
   * Remove comments from the given JavaScript code.
   *
   * @param {string} code - Code to remove comments from.
   * @returns {string} The given code with all its comments removed.
   * @private
   */
  static #removeComments(code) {
    // ref: https://stackoverflow.com/a/52630274
    let inQuoteChar = null;
    let inBlockComment = false;
    let inLineComment = false;
    let inRegexLiteral = false;
    let newCode = '';
    for (let i = 0; i < code.length; i++) {
      if (!(inQuoteChar || inBlockComment || inLineComment || inRegexLiteral)) {
        if ('"\'`'.includes(code[i])) {
          inQuoteChar = code[i];
        } else if ('/' === code[i]) {
          if ('*' === code[i + 1]) {
            inBlockComment = true;
          } else if ('/' === code[i + 1]) {
            inLineComment = true;
          } else {
            inRegexLiteral = true;
          }
        }
      } else {
        if (
          null !== inQuoteChar &&
          ((inQuoteChar === code[i] && '\\' !== code[i - 1]) || ('\n' === code[i] && '`' !== inQuoteChar))
        ) {
          inQuoteChar = null;
        }
        if (inRegexLiteral && (('/' === code[i] && '\\' !== code[i - 1]) || '\n' === code[i])) {
          inRegexLiteral = false;
        }
        if (inBlockComment && '/' === code[i - 1] && '*' === code[i - 2]) {
          inBlockComment = false;
        }
        if (inLineComment && '\n' === code[i]) {
          inLineComment = false;
        }
      }
      if (!inBlockComment && !inLineComment) {
        newCode += code[i];
      }
    }
    return newCode;
  }

  /**
   * Retrieve the {@link DependencyObject} of the given function.
   *
   * NOTE: this is a strictly SYNTACTICAL operation, it will parse the actual code of the given {@link Function}, but it will not execute it in any way nor follow references therein.
   *
   * @param {Function} func - {@link Function} instance to extract parameters for.
   * @returns {DependencyObject} A {@link DependencyObject} extracted from the given instance.
   * @private
   */
  static #getDependencyPrimitive(func) {
    const str = Dependency.#removeComments(func.toString()).replace(/^\s+|\s+$/g, '');
    let body = null;
    let code = '';
    if (str.endsWith('}')) {
      for (let i = str.indexOf('{'); 0 < i; i = str.indexOf('{', i + 1)) {
        try {
          code = str.substring(i + 1, str.length - 1);
          new Function(code);
          body = code.replace(/^\s+|\s+$/g, '');
          code = `{${code}}`;
          break;
        } catch {
          // NOP
        }
      }
    } else {
      for (let i = str.indexOf('=>'); 0 < i; i = str.indexOf('=>', i + 1)) {
        try {
          code = str.substring(i + 2);
          new Function(`return ${code.replace(/^\s+|\s+$/g, '')};`);
          body = `return ${code.replace(/^\s+|\s+$/g, '')};`;
          break;
        } catch {
          // NOP
        }
      }
    }

    const head = str.substring(0, str.length - code.length).replace(/^\s+|\s+$/g, '');
    const args = head.substring(head.indexOf('(') + 1, head.lastIndexOf(')'));
    const argsResult = [];
    let currentArg = [];
    args.split(',').forEach((part) => {
      currentArg.push(part);
      try {
        new Function(currentArg.join(','), '');
        let [name, ...defs] = currentArg.join(',').split('=');
        name = name.replace(/^\s+|\s+$/g, '');
        defs = defs.join('=').replace(/^\s+|\s+$/g, '');
        if (name.length && defs.length) {
          argsResult.push([name, defs]);
        }
        currentArg = [];
      } catch {
        // NOP
      }
    });

    return {
      name: func.name,
      code: body,
      dependencies: new Map(argsResult),
    };
  }

  /**
   * Construct a new {@link Dependency} from the given {@link Function} instance.
   *
   * @param {Function} func - Function to use for constructing the {@link Dependency}.
   * @param {string | null} fName - Name to use instead if given.
   * @returns {Dependency} The constructed {@link Dependency}.
   * @throws {Error} If the given argument is not a {@link Function}.
   * @throws {Error} If the given argument is an arrow function.
   */
  static from(func, fName = null) {
    if (!Dependency.#isDefinedFunction(func)) {
      throw new Error('Expected defined function');
    }

    const { name, code, dependencies } = Dependency.#getDependencyPrimitive(func);
    return new Dependency(fName || name, code, dependencies);
  }

  /**
   * Validate the given dependency and return it if valid.
   *
   * @param {unknown} dependency - The dependency to validate.
   * @returns {DependencyObject} The validated dependency.
   * @throws {Error} If the given dependency is not a non-`null` `object`.
   * @throws {Error} If the given dependency does not contain a `name` property.
   * @throws {Error} If the given dependency does not contain a `code` property.
   * @throws {Error} If the given dependency does not contain a `dependencies` property.
   * @see {@link Validation.dependencyObject} for additional exceptions thrown.
   */
  static validate(dependency) {
    return Validation.dependencyObject(dependency);
  }

  /**
   * The {@link Dependency}'s name.
   *
   * @type {string}
   * @private
   */
  #name;

  /**
   * The {@link Dependency}'s function source code.
   *
   * @type {string}
   * @private
   */
  #code;

  /**
   * The {@link Dependency}'s dependency map, as a mapping from imported name to dependency name.
   *
   * @type {Map<string, string>}
   * @private
   */
  #dependencies;

  /**
   * Build a new {@link Dependency}.
   *
   * @param {string} name - The dependency name to use.
   * @param {string} code - The dependency code to use.
   * @param {Map<string, string>} dependencies - The dependency's dependencies map to use.
   * @see {@link Dependency.validate} for exceptions thrown.
   */
  constructor(name = '', code = '', dependencies = new Map()) {
    const dependency = Dependency.validate({ name, code, dependencies });

    this.#name = dependency.name;
    this.#code = dependency.code;
    this.#dependencies = dependency.dependencies;
  }

  /**
   * Get the {@link Dependency} name.
   *
   * @type {string}
   */
  get name() {
    return this.#name;
  }

  /**
   * Get the {@link Dependency} source code.
   *
   * @type {string}
   */
  get code() {
    return this.#code;
  }

  /**
   * Get the {@link Dependency} dependencies.
   *
   * @type {Map<string, string>}
   */
  get dependencies() {
    return new Map(Object.entries(this.#dependencies));
  }

  /**
   * Set the {@link Dependency} name.
   *
   * @param {string} name - The name to set.
   * @see {@link Dependency.setName} for exceptions thrown.
   */
  set name(name) {
    this.setName(name);
  }

  /**
   * Set the {@link Dependency} source code.
   *
   * @param {string} code - The function source code to set.
   * @see {@link Dependency.setCode} for exceptions thrown.
   */
  set code(code) {
    this.setCode(code);
  }

  /**
   * Set the {@link Dependency} dependencies.
   *
   * @param {Map<string, string>} dependencies - The dependencies to set.
   * @see {@link Dependency.setDependencies} for exceptions thrown.
   */
  set dependencies(dependencies) {
    this.setDependencies(dependencies);
  }

  /**
   * Set the {@link Dependency} name (chainable).
   *
   * @param {string} name - The name to set.
   * @returns {Dependency} `this`, for chaining.
   * @see {@link Validation.identifier} for exceptions thrown.
   */
  setName(name) {
    this.#name = Validation.identifier(name);
    return this;
  }

  /**
   * Set the {@link Dependency} source code (chainable).
   *
   * @param {string} code - The function source code to set.
   * @returns {Dependency} `this`, for chaining.
   * @see {@link Validation.functionCode} for exceptions thrown.
   */
  setCode(code) {
    this.#code = Validation.functionCode(code);
    return this;
  }

  /**
   * Set the {@link Dependency} dependencies (chainable).
   *
   * @param {Map<string, string>} dependencies - The dependencies to set.
   * @returns {Dependency} `this`, for chaining.
   * @see {@link Validation.dependencyMap} for exceptions thrown.
   */
  setDependencies(dependencies) {
    this.#dependencies = Validation.dependencyMap(dependencies);
    return this;
  }

  /**
   * Add the given imported name / dependent dependency pair to this {@link Dependency}'s dependencies.
   *
   * @param {string} importedName - Dependency name to use for importing.
   * @param {string} dependencyName - Dependency being depended on.
   * @returns {Dependency} `this`, for chaining.
   * @see {@link Validation.identifier} for exceptions thrown.
   */
  addDependency(importedName, dependencyName) {
    this.#dependencies.set(Validation.identifier(importedName), Validation.identifier(dependencyName));
    return this;
  }

  /**
   * Remove the given import name from this {@link Dependency}'s dependencies.
   *
   * @param {string} importName - Import name to remove from the dependencies.
   * @returns {Dependency} `this`, for chaining.
   */
  removeImport(importName) {
    this.#dependencies.delete(importName);
    return this;
  }

  /**
   * Remove the given dependency name from this {@link Dependency}'s dependencies.
   *
   * Note that this may remove more than one dependency from this {@link Dependency}'s dependencies.
   *
   * @param {string} dependencyName - Dependency name to remove from the dependencies.
   * @returns {Dependency} `this`, for chaining.
   */
  removeDependency(dependencyName) {
    this.#dependencies = new Map([...this.#dependencies.entries()].filter(([, dName]) => dName !== dependencyName));
    return this;
  }

  /**
   * Return the plain object representation of the {@link Dependency}.
   *
   * @returns {DependencyObject} The {@link Dependency}, as an independent object.
   */
  asObject() {
    return {
      name: this.name,
      code: this.code,
      dependencies: Object.fromEntries(this.#dependencies.entries()),
    };
  }

  /**
   * Clone the {@link Dependency} into a completely new one.
   *
   * @returns {Dependency} The newly created {@link Dependency}.
   */
  clone() {
    return new Dependency(this.name, this.code, this.dependencies);
  }
}

export { Dependency };
