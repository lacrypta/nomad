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

/**
 * ...
 *
 * @packageDocumentation
 * @module
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { NomadInterface, NomadEnclosureInterface, NomadVM, NomadVMEnclosure } from './nomadvm';

import {
  dependencyMap as validateDependencyMap,
  functionCode as validateFunctionCode,
  identifier as validateIdentifier,
} from './validation';

/**
 * The type of a Dependency primitive object.
 *
 */
export type DependencyObject = {
  /**
   * Dependency name.
   *
   */
  name: string;

  /**
   * Dependency function source code.
   *
   */
  code: string;

  /**
   * Dependency's dependencies, as a mapping from imported name to dependency name.
   *
   */
  dependencies: Record<string, string>;
};

/**
 * Interface representing an atomic dependency the {@link NomadInterface} will work with.
 *
 * A "dependency" in {@link NomadInterface}'s terms, is an entity comprised of three parts:
 *
 * - **name:** a _name_ is a way of referring to the dependency in question (these are "scoped" to the particular {@link NomadEnclosureInterface} they are defined in).
 * - **code:** a dependency's _code_ is the JavaScript [strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode) {@link !Function} body that will be executed when the dependency is executed.
 * - **dependencies:** a dependency's _dependencies_ is a mapping that maps an identifier name to a dependency name: during execution, the given identifier name will be made available to the dependency's code with the result of executing the mapped dependency.
 *
 */
export interface DependencyInterface {
  /**
   * Get the {@link DependencyInterface} name.
   *
   */
  get name(): string;

  /**
   * Get the {@link DependencyInterface} source code.
   *
   */
  get code(): string;

  /**
   * Get the {@link DependencyInterface} dependencies.
   *
   */
  get dependencies(): Map<string, string>;

  /**
   * Set the {@link DependencyInterface} name.
   *
   * @param name - The name to set.
   * @see {@link DependencyInterface.setName} for exceptions thrown.
   */
  set name(name: string);

  /**
   * Set the {@link DependencyInterface} source code.
   *
   * @param code - The function source code to set.
   * @see {@link DependencyInterface.setCode} for exceptions thrown.
   */
  set code(code: string);

  /**
   * Set the {@link DependencyInterface} dependencies.
   *
   * @param dependencies - The dependencies to set.
   * @see {@link DependencyInterface.setDependencies} for exceptions thrown.
   */
  set dependencies(dependencies: Map<string, string>);

  /**
   * Set the {@link DependencyInterface} name.
   *
   * @param name - The name to set.
   * @returns `this`, for chaining.
   * @throws {@link !Error} if the given identifier fails regular expression validation.
   * @throws {@link !Error} if the given identifier is forbidden.
   */
  setName(name: string): this;

  /**
   * Set the {@link DependencyInterface} source code.
   *
   * @param code - The function source code to set.
   * @returns `this`, for chaining.
   * @throws {@link !Error} if the given function source code contains disallowed characters.
   * @throws {@link !Error} if the given function source code is not a valid strict mode function body.
   */
  setCode(code: string): this;

  /**
   * Set the {@link DependencyInterface} dependencies.
   *
   * @param dependencies - The dependencies to set.
   * @returns `this`, for chaining.
   * @see {@link addDependency} for exceptions thrown.
   */
  setDependencies(dependencies: Map<string, string>): this;

  /**
   * Add the given imported name / dependent dependency pair to this {@link DependencyInterface}'s dependencies.
   *
   * @param importedName - Dependency name to use for importing.
   * @param dependencyName - Dependency being depended on.
   * @returns `this`, for chaining.
   * @throws {@link !Error} if an imported name fails regular expression validation.
   * @throws {@link !Error} if an imported name is forbidden.
   * @throws {@link !Error} if a dependency name fails regular expression validation.
   * @throws {@link !Error} if a dependency name is forbidden.
   */
  addDependency(importedName: string, dependencyName: string): this;

  /**
   * Remove the given import name from this {@link DependencyInterface}'s dependencies.
   *
   * @param importName - Import name to remove from the dependencies.
   * @returns `this`, for chaining.
   */
  removeImport(importName: string): this;

  /**
   * Remove the given dependency name from this {@link DependencyInterface}'s dependencies.
   *
   * Note that this may remove more than one dependency from this {@link DependencyInterface}'s dependencies.
   *
   * @param dependencyName - Dependency name to remove from the dependencies.
   * @returns `this`, for chaining.
   */
  removeDependency(dependencyName: string): this;

  /**
   * Return the plain object representation of the {@link DependencyInterface}.
   *
   * @returns The {@link DependencyInterface}, as an independent {@link DependencyObject}.
   */
  asObject(): DependencyObject;
}

/**
 * Remove comments from the given JavaScript code.
 *
 * @param code - Code to remove comments from.
 * @returns The given code with all its comments removed.
 */
export const _removeComments: (code: string) => string = (code: string): string => {
  // ref: https://stackoverflow.com/a/52630274
  let inQuoteChar: string | null = null;
  let inBlockComment: boolean = false;
  let inLineComment: boolean = false;
  let inRegexLiteral: boolean = false;
  let newCode: string = '';
  for (let i: number = 0; i < code.length; i++) {
    if (!(inQuoteChar || inBlockComment || inLineComment || inRegexLiteral)) {
      if ('"\'`'.includes(code[i] ?? '')) {
        inQuoteChar = code[i] ?? '';
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
      newCode += code[i] ?? '';
    }
  }
  return newCode;
};

/**
 * Retrieve the {@link DependencyObject} of the given function.
 *
 * NOTE: this is a strictly SYNTACTICAL operation, it will parse the actual code of the given {@link !Function}, but it will not execute it in any way nor follow references therein.
 *
 * @param func - {@link !Function} instance to extract parameters for.
 * @returns A {@link DependencyObject} extracted from the given instance.
 * @throws {@link !Error} if the function body cannot be determined.
 */
export const _getDependencyPrimitive: (func: (...args: unknown[]) => unknown) => DependencyObject = (
  func: (...args: unknown[]) => unknown,
): DependencyObject => {
  const str: string = _removeComments(func.toString()).trim();
  let body: string | null = null;
  let code: string = '';
  if (str.endsWith('}')) {
    for (let i: number = str.indexOf('{'); 0 < i; i = str.indexOf('{', i + 1)) {
      try {
        code = str.substring(i + 1, str.length - 1);
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        void new Function(code);
        body = code.trim();
        code = `{${code}}`;
        break;
      } catch {
        // NOP
      }
    }
  } else {
    for (let i: number = str.indexOf('=>'); 0 < i; i = str.indexOf('=>', i + 1)) {
      try {
        code = str.substring(i + 2);
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        void new Function(`return ${code.trim()};`);
        body = `return ${code.trim()};`;
        break;
      } catch {
        // NOP
      }
    }
  }

  const head: string = str.substring(0, str.length - code.length).trim();
  const args: string = head.substring(head.indexOf('(') + 1, head.lastIndexOf(')'));
  const argsResult: [string, string][] = [];
  let currentArg: string[] = [];
  args.split(',').forEach((part) => {
    currentArg.push(part);
    try {
      const [name, ...defs]: string[] = currentArg.join(',').split('=');
      const nameS: string = (name ?? '').trim();
      const defsS: string = defs.join('=').trim();
      const testArg: number = Math.trunc(Math.random() * 4294967296);
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const nameOk: boolean = testArg === new Function(nameS, `return ${nameS};`)(testArg);
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const defsOk: boolean = defsS === new Function(`${nameS} = ${JSON.stringify(defsS)}`, `return ${nameS};`)();
      if (nameOk && defsOk) {
        argsResult.push([nameS, defsS]);
        currentArg = [];
      }
    } catch {
      // NOP
    }
  });

  if (null === body) {
    throw new Error('could not determine function body');
  }

  return {
    name: func.name,
    code: body,
    dependencies: Object.setPrototypeOf(Object.fromEntries(argsResult), null) as Record<string, string>,
  };
};

/**
 * Construct a new {@link Dependency} from the given {@link !Function} instance.
 *
 * @param func - Function to use for constructing the {@link Dependency}.
 * @param fName - Name to use instead if given.
 * @returns The constructed {@link Dependency}.
 * @throws {@link !Error} if the given argument is not a {@link !Function}.
 */
export const from: (func: (...args: unknown[]) => unknown, fName?: string) => DependencyInterface = (
  func: (...args: unknown[]) => unknown,
  fName?: string,
): DependencyInterface => {
  if (Function !== func.constructor) {
    throw new Error('Expected defined function');
  }

  const { name, code, dependencies }: DependencyObject = _getDependencyPrimitive(func);
  return new Dependency(fName || name, code, dependencies);
};

export const create: (name?: string, code?: string, dependencies?: Record<string, string>) => DependencyInterface = (
  name?: string,
  code?: string,
  dependencies?: Record<string, string>,
): DependencyInterface => {
  return new Dependency(name, code, dependencies);
};

/**
 * Topologically sort the given {@link Dependency} iterable by their dependency tree relations, using the given pre-installed {@link Dependency} names.
 *
 * @param dependencies - Dependencies to sort.
 * @param installed - Installed {@link Dependency} names to assume existing (defaults to `null`, meaning none).
 * @returns Sorted {@link Dependency} list.
 * @throws {@link !Error} if unresolved dependencies found.
 */
export const sort: (
  dependencies: Iterable<DependencyInterface>,
  installed?: Iterable<string>,
) => DependencyInterface[] = (
  dependencies: Iterable<DependencyInterface>,
  installed?: Iterable<string>,
): DependencyInterface[] => {
  const existing: Set<string> = new Set<string>(installed ?? []);
  const pending: Set<DependencyInterface> = new Set<DependencyInterface>(dependencies);
  const newOnes: Set<DependencyInterface> = new Set<DependencyInterface>();
  const result: DependencyInterface[] = [];

  do {
    newOnes.forEach((element: DependencyInterface): void => {
      pending.delete(element);
      existing.add(element.name);
      result.push(element);
    });
    newOnes.clear();
    pending.forEach((element: DependencyInterface): void => {
      if (Object.keys(element.dependencies).every((dep: string): boolean => existing.has(dep))) {
        newOnes.add(element);
      }
    });
  } while (0 < newOnes.size);

  if (0 < pending.size) {
    throw new Error(
      `unresolved dependencies: [${[...pending.values()].map((dep: DependencyInterface): string => dep.name).join(', ')}]`,
    );
  }

  return result;
};

/**
 * Class representing an atomic dependency the {@link NomadVM} will work with.
 *
 * A "dependency" in {@link NomadVM}'s terms, is an entity comprised of three parts:
 *
 * - **name:** a _name_ is a way of referring to the dependency in question (these are "scoped" to the particular {@link NomadVMEnclosure} they are defined in).
 * - **code:** a dependency's _code_ is the JavaScript [strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode) {@link !Function} body that will be executed when the dependency is executed.
 * - **dependencies:** a dependency's _dependencies_ is a mapping that maps an {@link validation.identifier} name to a dependency name: during execution, the given identifier name will be made available to the dependency's code with the result of executing the mapped dependency.
 *
 */
export class Dependency implements DependencyInterface {
  static {
    // ref: https://stackoverflow.com/a/77741904
    Object.setPrototypeOf(this.prototype, null);
  }

  /**
   * The {@link Dependency}'s name.
   *
   */
  #name: string;

  /**
   * The {@link Dependency}'s function source code.
   *
   */
  #code: string;

  /**
   * The {@link Dependency}'s dependency map, as a mapping from imported name to dependency name.
   *
   */
  #dependencies: Map<string, string>;

  /**
   * Build a new {@link Dependency} using the given parameters.
   *
   * @param name - The dependency name to use (defaults to `""` if not given).
   * @param code - The dependency code to use (defaults to `""` if not given).
   * @param dependencies - The dependency's dependencies map to use (defaults to `{}` if note given).
   * @see {@link validation.identifier} for exceptions thrown.
   * @see {@link validation.functionCode} for exceptions thrown.
   */
  constructor(name?: string, code?: string, dependencies?: Record<string, string>) {
    this.#name = validateIdentifier(name ?? '');
    this.#code = validateFunctionCode(code ?? '');
    this.#dependencies = new Map(
      Object.entries(dependencies ?? (Object.create(null) as Record<string, string>)).map(
        ([key, value]: [string, string]): [string, string] => [validateIdentifier(key), validateIdentifier(value)],
      ),
    );
  }

  /**
   * Get the {@link Dependency} name.
   *
   */
  get name(): string {
    return this.#name;
  }

  /**
   * Get the {@link Dependency} source code.
   *
   */
  get code(): string {
    return this.#code;
  }

  /**
   * Get the {@link Dependency} dependencies.
   *
   * This will create a _new_ dependencies {@link !Map}, so as not to expose the {@link Dependency}'s internals to consumers.
   *
   */
  get dependencies(): Map<string, string> {
    return new Map<string, string>(Object.entries(this.#dependencies));
  }

  /**
   * Set the {@link Dependency} name.
   *
   * @param name - The name to set.
   * @see {@link Dependency.setName} for exceptions thrown.
   */
  set name(name: string) {
    this.setName(name);
  }

  /**
   * Set the {@link Dependency} source code.
   *
   * @param code - The function source code to set.
   * @see {@link Dependency.setCode} for exceptions thrown.
   */
  set code(code: string) {
    this.setCode(code);
  }

  /**
   * Set the {@link Dependency} dependencies.
   *
   * @param dependencies - The dependencies to set.
   * @see {@link Dependency.setDependencies} for exceptions thrown.
   */
  set dependencies(dependencies: Map<string, string>) {
    this.setDependencies(dependencies);
  }

  /**
   * Set the {@link Dependency} name.
   *
   * @param name - The name to set.
   * @returns `this`, for chaining.
   * @see {@link validation.identifier} for exceptions thrown.
   */
  setName(name: string): this {
    this.#name = validateIdentifier(name);
    return this;
  }

  /**
   * Set the {@link Dependency} source code.
   *
   * @param code - The function source code to set.
   * @returns `this`, for chaining.
   * @see {@link validation.functionCode} for exceptions thrown.
   */
  setCode(code: string): this {
    this.#code = validateFunctionCode(code);
    return this;
  }

  /**
   * Set the {@link Dependency} dependencies.
   *
   * @param dependencies - The dependencies to set.
   * @returns `this`, for chaining.
   * @see {@link validation.dependencyMap} for exceptions thrown.
   */
  setDependencies(dependencies: Map<string, string>): this {
    this.#dependencies = validateDependencyMap(dependencies);
    return this;
  }

  /**
   * Add the given imported name / dependent dependency pair to this {@link Dependency}'s dependencies.
   *
   * @param importedName - Dependency name to use for importing.
   * @param dependencyName - Dependency being depended on.
   * @returns `this`, for chaining.
   * @see {@link validation.identifier} for exceptions thrown.
   */
  addDependency(importedName: string, dependencyName: string): this {
    this.#dependencies.set(validateIdentifier(importedName), validateIdentifier(dependencyName));
    return this;
  }

  /**
   * Remove the given import name from this {@link Dependency}'s dependencies.
   *
   * @param importName - Import name to remove from the dependencies.
   * @returns `this`, for chaining.
   */
  removeImport(importName: string): this {
    this.#dependencies.delete(importName);
    return this;
  }

  /**
   * Remove the given dependency name from this {@link Dependency}'s dependencies.
   *
   * Note that this may remove more than one dependency from this {@link Dependency}'s dependencies.
   *
   * @param dependencyName - Dependency name to remove from the dependencies.
   * @returns `this`, for chaining.
   */
  removeDependency(dependencyName: string): this {
    this.#dependencies = new Map<string, string>(
      [...this.#dependencies.entries()].filter(([, dName]: [string, string]): boolean => dName !== dependencyName),
    );
    return this;
  }

  /**
   * Return the plain object representation of the {@link Dependency}.
   *
   * @returns The {@link Dependency}, as an independent object.
   */
  asObject(): DependencyObject {
    return {
      name: this.name,
      code: this.code,
      dependencies: Object.setPrototypeOf(Object.fromEntries(this.#dependencies.entries()), null) as Record<
        string,
        string
      >,
    };
  }
}
