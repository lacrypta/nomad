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
   * Dependency function source code.
   *
   */
  code: string;

  /**
   * Dependency's dependencies, as a mapping from imported name to dependency name.
   *
   */
  dependencies: Record<string, string>;

  /**
   * Dependency name.
   *
   */
  name: string;
};

/**
 * Interface representing an atomic dependency.
 *
 * A "dependency" is an entity comprised of three parts:
 *
 * - **name:** a _name_ is a way of referring to the dependency in question.
 * - **code:** a dependency's _code_ is the JavaScript [strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode) {@link !Function} body that will be executed when the dependency is executed.
 * - **dependencies:** a dependency's _dependencies_ is a mapping that maps an identifier name to a dependency name: during execution, the given identifier name will be made available to the dependency's code with the result of executing the mapped dependency.
 *
 */
export interface Dependency {
  /**
   * Add the given imported name / dependent dependency pair to this {@link Dependency}'s dependencies.
   *
   * @param importedName - Dependency {@link Dependency.name} to use for importing.
   * @param dependencyName - Dependency being depended on.
   * @returns `this`, for chaining.
   * @throws {Error} if an imported name fails regular expression validation.
   * @throws {Error} if an imported name is forbidden.
   * @throws {Error} if a dependency name fails regular expression validation.
   * @throws {Error} if a dependency name is forbidden.
   */
  addDependency(importedName: string, dependencyName: string): this;

  /**
   * Return the plain object representation of the {@link Dependency}.
   *
   * @returns The {@link Dependency}, as an independent {@link DependencyObject}.
   */
  asObject(): DependencyObject;

  /**
   * Get the {@link Dependency} source code.
   *
   */
  get code(): string;

  /**
   * Get the {@link Dependency} dependencies.
   *
   */
  get dependencies(): Map<string, string>;

  /**
   * Get the {@link Dependency} name.
   *
   */
  get name(): string;

  /**
   * Remove the given dependency {@link Dependency.name} from this {@link Dependency}'s dependencies.
   *
   * Note that this may remove more than one dependency from this {@link Dependency}'s dependencies.
   *
   * @param dependencyName - Dependency {@link Dependency.name} to remove from the dependencies.
   * @returns `this`, for chaining.
   */
  removeDependency(dependencyName: string): this;

  /**
   * Remove the given import name from this {@link Dependency}'s dependencies.
   *
   * @param importName - Import name to remove from the dependencies.
   * @returns `this`, for chaining.
   */
  removeImport(importName: string): this;

  /**
   * Set the {@link Dependency} source code.
   *
   * @param code - The function source code to set.
   * @see {@link Dependency.setCode} for exceptions thrown.
   */
  set code(code: string);

  /**
   * Set the {@link Dependency} dependencies.
   *
   * @param dependencies - The dependencies to set.
   * @see {@link Dependency.setDependencies} for exceptions thrown.
   */
  set dependencies(dependencies: Map<string, string>);

  /**
   * Set the {@link Dependency} name.
   *
   * @param name - The name to set.
   * @see {@link Dependency.setName} for exceptions thrown.
   */
  set name(name: string);

  /**
   * Set the {@link Dependency} source code.
   *
   * @param code - The function source code to set.
   * @returns `this`, for chaining.
   * @throws {Error} if the given function source code contains disallowed characters.
   * @throws {Error} if the given function source code is not a valid strict mode function body.
   */
  setCode(code: string): this;

  /**
   * Set the {@link Dependency} dependencies.
   *
   * @param dependencies - The dependencies to set.
   * @returns `this`, for chaining.
   * @see {@link addDependency} for exceptions thrown.
   */
  setDependencies(dependencies: Map<string, string>): this;

  /**
   * Set the {@link Dependency} name.
   *
   * @param name - The name to set.
   * @returns `this`, for chaining.
   * @throws {Error} if the given identifier fails regular expression validation.
   * @throws {Error} if the given identifier is forbidden.
   */
  setName(name: string): this;
}

/**
 * Remove comments from the given JavaScript code.
 *
 * @param code - Code to remove comments from.
 * @returns The given code with all its comments removed.
 */
export const _removeComments: (code: string) => string = (code: string): string => {
  // ref: https://stackoverflow.com/a/52630274
  let inQuoteChar: null | string = null;
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
 * @throws {Error} if the function body cannot be determined.
 */
export const _getDependencyPrimitive: (func: (...args: unknown[]) => unknown) => DependencyObject = (
  func: (...args: unknown[]) => unknown,
): DependencyObject => {
  const str: string = _removeComments(func.toString()).trim();
  let body: null | string = null;
  let code: string = '';
  if (str.endsWith('}')) {
    for (let i: number = str.indexOf('{'); 0 < i; i = str.indexOf('{', i + 1)) {
      try {
        code = str.substring(i + 1, str.length - 1);
        /* eslint-disable-next-line @typescript-eslint/no-implied-eval */
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
        /* eslint-disable-next-line @typescript-eslint/no-implied-eval */
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
      /* eslint-disable-next-line @typescript-eslint/no-implied-eval */
      const nameOk: boolean = testArg === new Function(nameS, `return ${nameS};`)(testArg);
      /* eslint-disable-next-line @typescript-eslint/no-implied-eval */
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

  return Object.setPrototypeOf(
    {
      code: body,
      dependencies: Object.setPrototypeOf(Object.fromEntries(argsResult), null) as Record<string, string>,
      name: func.name,
    },
    null,
  ) as DependencyObject;
};

/**
 * Construct a new {@link Dependency} from the given {@link !Function} instance.
 *
 * @param func - Function to use for constructing the {@link Dependency}.
 * @param fName - Name to use instead if given.
 * @returns The constructed {@link Dependency}.
 * @throws {Error} if the given argument is not a {@link !Function}.
 */
export const from: (func: (...args: unknown[]) => unknown, fName?: string) => Dependency = (
  func: (...args: unknown[]) => unknown,
  fName?: string,
): Dependency => {
  if (Function !== func.constructor) {
    throw new Error('Expected defined function');
  }

  const { code, dependencies, name }: DependencyObject = _getDependencyPrimitive(func);
  return new DependencyImplementation(fName || name, code, dependencies);
};

/**
 * Construct a new {@link Dependency} from the given arguments.
 *
 * @param name - Name to use for constructing the {@link Dependency}.
 * @param code - {@link !Function} body to use for constructing the {@link Dependency}.
 * @param dependencies - Dependencies map to use for constructing the {@link Dependency}.
 * @returns The constructed {@link Dependency}.
 */
export const create: (name?: string, code?: string, dependencies?: Record<string, string>) => Dependency = (
  name?: string,
  code?: string,
  dependencies?: Record<string, string>,
): Dependency => {
  return new DependencyImplementation(name, code, dependencies);
};

/**
 * Topologically sort the given {@link Dependency} iterable by their dependency tree relations, using the given pre-installed {@link Dependency} names.
 *
 * @param dependencies - Dependencies to sort.
 * @param installed - Installed {@link Dependency.name}s to assume existing (defaults to `null`, meaning none).
 * @returns Sorted {@link Dependency} list.
 * @throws {Error} if unresolved dependencies found.
 */
export const sort: <T extends Dependency>(dependencies: Iterable<T>, installed?: Iterable<string>) => T[] = <
  T extends Dependency,
>(
  dependencies: Iterable<T>,
  installed?: Iterable<string>,
): T[] => {
  const existing: Set<string> = new Set<string>(installed ?? []);
  const pending: Set<T> = new Set<T>(dependencies);
  const newOnes: Set<T> = new Set<T>();
  const result: T[] = [];

  do {
    newOnes.forEach((element: T): void => {
      pending.delete(element);
      existing.add(element.name);
      result.push(element);
    });
    newOnes.clear();
    pending.forEach((element: T): void => {
      if (Object.keys(element.dependencies).every((dep: string): boolean => existing.has(dep))) {
        newOnes.add(element);
      }
    });
  } while (0 < newOnes.size);

  if (0 < pending.size) {
    throw new Error(
      `unresolved dependencies: [${Array.from(pending.values(), (dep: T): string => dep.name).join(', ')}]`,
    );
  }

  return result;
};

/**
 * Class representing an atomic dependency.
 *
 * A "dependency" is an entity comprised of three parts:
 *
 * - **name:** a _name_ is a way of referring to the dependency in question.
 * - **code:** a dependency's _code_ is the JavaScript [strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode) {@link !Function} body that will be executed when the dependency is executed.
 * - **dependencies:** a dependency's _dependencies_ is a mapping that maps an {@link validation.identifier} name to a dependency name: during execution, the given identifier name will be made available to the dependency's code with the result of executing the mapped dependency.
 *
 */
export class DependencyImplementation implements Dependency {
  /**
   * The {@link DependencyImplementation}'s function source code.
   *
   */
  #code: string;

  /**
   * The {@link DependencyImplementation}'s dependency map, as a mapping from imported name to dependency name.
   *
   */
  #dependencies: Map<string, string>;

  /**
   * The {@link DependencyImplementation}'s name.
   *
   */
  #name: string;

  /**
   * Build a new {@link DependencyImplementation} using the given parameters.
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
   * Add the given imported name / dependent dependency pair to this {@link DependencyImplementation}'s dependencies.
   *
   * @param importedName - The {@link DependencyImplementation.name} to use for importing.
   * @param dependencyName - {@link DependencyImplementation} being depended on.
   * @returns `this`, for chaining.
   * @see {@link validation.identifier} for exceptions thrown.
   */
  addDependency(importedName: string, dependencyName: string): this {
    this.#dependencies.set(validateIdentifier(importedName), validateIdentifier(dependencyName));
    return this;
  }

  /**
   * Return the plain object representation of the {@link DependencyImplementation}.
   *
   * @returns The {@link DependencyImplementation}, as an independent object.
   */
  asObject(): DependencyObject {
    return Object.setPrototypeOf(
      {
        code: this.code,
        dependencies: Object.setPrototypeOf(Object.fromEntries(this.#dependencies.entries()), null) as Record<
          string,
          string
        >,
        name: this.name,
      },
      null,
    ) as DependencyObject;
  }

  /**
   * Remove the given dependency {@link DependencyImplementation.name} from this {@link DependencyImplementation}'s dependencies.
   *
   * Note that this may remove more than one {@link DependencyImplementation} from this {@link DependencyImplementation}'s dependencies.
   *
   * @param dependencyName - The {@link DependencyImplementation.name} to remove from the dependencies.
   * @returns `this`, for chaining.
   */
  removeDependency(dependencyName: string): this {
    this.#dependencies = new Map<string, string>(
      Array.from(this.#dependencies.entries()).filter(
        ([, dName]: [string, string]): boolean => dName !== dependencyName,
      ),
    );
    return this;
  }

  /**
   * Remove the given import name from this {@link DependencyImplementation}'s dependencies.
   *
   * @param importName - Import name to remove from the dependencies.
   * @returns `this`, for chaining.
   */
  removeImport(importName: string): this {
    this.#dependencies.delete(importName);
    return this;
  }

  /**
   * Set the {@link DependencyImplementation} source code.
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
   * Set the {@link DependencyImplementation} dependencies.
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
   * Set the {@link DependencyImplementation} name.
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
   * Get the {@link DependencyImplementation} source code.
   *
   */
  get code(): string {
    return this.#code;
  }

  /**
   * Set the {@link DependencyImplementation} source code.
   *
   * @param code - The function source code to set.
   * @see {@link DependencyImplementation.setCode} for exceptions thrown.
   */
  set code(code: string) {
    this.setCode(code);
  }

  /**
   * Get the {@link DependencyImplementation} dependencies.
   *
   * This will create a _new_ dependencies {@link !Map}, so as not to expose the {@link DependencyImplementation}'s internals to consumers.
   *
   */
  get dependencies(): Map<string, string> {
    return new Map<string, string>(Object.entries(this.#dependencies));
  }

  /**
   * Set the {@link DependencyImplementation} dependencies.
   *
   * @param dependencies - The dependencies to set.
   * @see {@link DependencyImplementation.setDependencies} for exceptions thrown.
   */
  set dependencies(dependencies: Map<string, string>) {
    this.setDependencies(dependencies);
  }

  /**
   * Get the {@link DependencyImplementation} name.
   *
   */
  get name(): string {
    return this.#name;
  }

  /**
   * Set the {@link DependencyImplementation} name.
   *
   * @param name - The name to set.
   * @see {@link DependencyImplementation.setName} for exceptions thrown.
   */
  set name(name: string) {
    this.setName(name);
  }

  static {
    // ref: https://stackoverflow.com/a/77741904
    Object.setPrototypeOf(this.prototype, null);
  }
}
