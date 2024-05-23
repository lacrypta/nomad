'use strict';

import * as Validation from './validation';

/**
 * The type of a Dependency primitive object.
 *
 */
type DependencyObject = {
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
 * Class representing an atomic dependency the {@link NomadVM} will work with.
 *
 * A "dependency" in {@link NomadVM}'s terms, is an entity comprised of three parts:
 *
 * - **name:** a _name_ is a way of referring to the dependency in question (these are "scoped" to the particular {@link NomadVMEnclosure} they are defined in).
 * - **code:** a dependency's _code_ is the JavaScript [strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode) {@link !Function} body that will be executed when the dependency is executed.
 * - **dependencies:** a dependency's _dependencies_ is a mapping that maps an {@link Validation.identifier} name to a dependency name: during execution, the given identifier name will be made available to the dependency's code with the result of executing the mapped dependency.
 *
 * Dependencies can be created by either providing all relevant arguments to the {@link Dependency.constructor}, or _syntactically_ by using the {@link Dependency.from} static construction method.
 *
 */
class Dependency {
  /**
   * The prefix all builtin functions exhibit on their string representation.
   *
   */
  static #builtinPrefix: string;

  /**
   * The suffix all builtin functions exhibit on their string representation.
   *
   */
  static #builtinSuffix: string;

  static {
    /**
     * Determine the longest common prefix of the given strings.
     *
     * @param args - Strings to get the longest common prefix of.
     * @returns The longest common prefix of the given strings.
     */
    const lcp = (...args: string[]): string => {
      return args.reduce((a: string, b: string): string => {
        const l: number = Math.min(a.length, b.length);
        for (let i: number = 0; i < l; i++) {
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
    const lcs = (...args: string[]): string =>
      lcp(...args.map((x: string): string => x.split('').reverse().join('')))
        .split('')
        .reverse()
        .join('');

    /**
     * List of builtin functions to analyze for prefix / suffix behavior.
     *
     * This list is used to determine native functions' prefixes and suffixes when converting them to `string`.
     * The list comprises:
     *
     * - {@link !eval},
     * - {@link !isFinite},
     * - {@link !isNaN},
     * - {@link !parseFloat},
     * - {@link !parseInt},
     * - {@link !decodeURI},
     * - {@link !decodeURIComponent},
     * - {@link !encodeURI}, and
     * - {@link !encodeURIComponent}.
     *
     */
    const builtin: string[] = [
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
   * @param func - Instance to test.
   * @returns True if the given argument is a defined function, false otherwise.
   */
  static #isPlainFunction(func: (...args: unknown[]) => unknown): func is (...args: unknown[]) => unknown {
    // https://stackoverflow.com/a/38830947
    return (
      Function === func.constructor &&
      !(func.toString().startsWith(Dependency.#builtinPrefix) && func.toString().endsWith(Dependency.#builtinSuffix))
    );
  }

  /**
   * Remove comments from the given JavaScript code.
   *
   * @param code - Code to remove comments from.
   * @returns The given code with all its comments removed.
   */
  static #removeComments(code: string): string {
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
  }

  /**
   * Retrieve the {@link DependencyObject} of the given function.
   *
   * NOTE: this is a strictly SYNTACTICAL operation, it will parse the actual code of the given {@link !Function}, but it will not execute it in any way nor follow references therein.
   *
   * @param func - {@link !Function} instance to extract parameters for.
   * @returns A {@link DependencyObject} extracted from the given instance.
   * @throws {Error} If the function body cannot be determined.
   */
  static #getDependencyPrimitive(func: (...args: unknown[]) => unknown): DependencyObject {
    const str: string = Dependency.#removeComments(func.toString()).replace(/^\s+|\s+$/g, '');
    let body: string | null = null;
    let code: string = '';
    if (str.endsWith('}')) {
      for (let i: number = str.indexOf('{'); 0 < i; i = str.indexOf('{', i + 1)) {
        try {
          code = str.substring(i + 1, str.length - 1);
          // eslint-disable-next-line @typescript-eslint/no-implied-eval
          void new Function(code);
          body = code.replace(/^\s+|\s+$/g, '');
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
          void new Function(`return ${code.replace(/^\s+|\s+$/g, '')};`);
          body = `return ${code.replace(/^\s+|\s+$/g, '')};`;
          break;
        } catch {
          // NOP
        }
      }
    }

    const head: string = str.substring(0, str.length - code.length).replace(/^\s+|\s+$/g, '');
    const args: string = head.substring(head.indexOf('(') + 1, head.lastIndexOf(')'));
    const argsResult: [string, string][] = [];
    let currentArg: string[] = [];
    args.split(',').forEach((part) => {
      currentArg.push(part);
      try {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        void new Function(currentArg.join(','), '');
        const [name, ...defs]: string[] = currentArg.join(',').split('=');
        const nameS: string = (name ?? '').replace(/^\s+|\s+$/g, '');
        const defsS: string = defs.join('=').replace(/^\s+|\s+$/g, '');
        if (nameS.length && defs.length) {
          argsResult.push([nameS, defsS]);
        }
        currentArg = [];
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
  }

  /**
   * Construct a new {@link Dependency} from the given {@link !Function} instance.
   *
   * @param func - Function to use for constructing the {@link Dependency}.
   * @param fName - Name to use instead if given.
   * @returns The constructed {@link Dependency}.
   * @throws {Error} If the given argument is not a {@link !Function}.
   */
  static from(func: (...args: unknown[]) => unknown, fName?: string): Dependency {
    if (!Dependency.#isPlainFunction(func)) {
      throw new Error('Expected defined function');
    }

    const { name, code, dependencies }: DependencyObject = Dependency.#getDependencyPrimitive(func);
    return new Dependency(fName || name, code, dependencies);
  }

  /**
   * Topologically sort the given {@link Dependency} iterable by their dependency tree relations, using the given pre-installed {@link Dependency} names.
   *
   * @param dependencies - Dependencies to sort.
   * @param installed - Installed {@link Dependency} names to assume existing (defaults to `null`, meaning none).
   * @returns Sorted {@link Dependency} list.
   * @throws {Error} If unresolved dependencies found.
   */
  static sort(dependencies: Iterable<Dependency>, installed?: Iterable<string>): Dependency[] {
    const existing: Set<string> = new Set<string>(installed ?? []);
    const pending: Set<Dependency> = new Set<Dependency>(dependencies);
    const newOnes: Set<Dependency> = new Set<Dependency>();
    const result: Dependency[] = [];

    do {
      newOnes.forEach((element: Dependency): void => {
        pending.delete(element);
        existing.add(element.name);
        result.push(element);
      });
      newOnes.clear();
      pending.forEach((element: Dependency): void => {
        if (Object.keys(element.dependencies).every((dep: string): boolean => existing.has(dep))) {
          newOnes.add(element);
        }
      });
    } while (0 < newOnes.size);

    if (0 < pending.size) {
      throw new Error(
        `unresolved dependencies: [${[...pending.values()].map((dep: Dependency): string => dep.name).join(', ')}]`,
      );
    }

    return result;
  }

  /**
   * Validate the given {@link DependencyObject} and return it if valid.
   *
   * @param dependency - The {@link DependencyObject} to validate.
   * @returns The validated {@link DependencyObject}.
   * @see {@link Validation.dependencyObject} for additional exceptions thrown.
   */
  static validate(dependency: DependencyObject): DependencyObject {
    return Validation.dependencyObject(dependency);
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
   * The parameters will be used to construct a {@link DependencyObject} and validate it via {@link Dependency.validate}, prior to initializing the new {@link Dependency} object.
   *
   * @param name - The dependency name to use (defaults to `""` if not given).
   * @param code - The dependency code to use (defaults to `""` if not given).
   * @param dependencies - The dependency's dependencies map to use (defaults to `{}` if note given).
   * @see {@link Dependency.validate} for exceptions thrown.
   */
  constructor(name?: string, code?: string, dependencies?: Record<string, string>) {
    const dependency: DependencyObject = Dependency.validate({
      name: name ?? '',
      code: code ?? '',
      dependencies: dependencies ?? (Object.create(null) as Record<string, string>),
    });

    this.#name = dependency.name;
    this.#code = dependency.code;
    this.#dependencies = new Map(Object.entries(dependency.dependencies));
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
   * @see {@link Validation.identifier} for exceptions thrown.
   */
  setName(name: string): this {
    this.#name = Validation.identifier(name);
    return this;
  }

  /**
   * Set the {@link Dependency} source code.
   *
   * @param code - The function source code to set.
   * @returns `this`, for chaining.
   * @see {@link Validation.functionCode} for exceptions thrown.
   */
  setCode(code: string): this {
    this.#code = Validation.functionCode(code);
    return this;
  }

  /**
   * Set the {@link Dependency} dependencies.
   *
   * @param dependencies - The dependencies to set.
   * @returns `this`, for chaining.
   * @see {@link Validation.dependencyMap} for exceptions thrown.
   */
  setDependencies(dependencies: Map<string, string>): this {
    this.#dependencies = Validation.dependencyMap(dependencies);
    return this;
  }

  /**
   * Add the given imported name / dependent dependency pair to this {@link Dependency}'s dependencies.
   *
   * @param importedName - Dependency name to use for importing.
   * @param dependencyName - Dependency being depended on.
   * @returns `this`, for chaining.
   * @see {@link Validation.identifier} for exceptions thrown.
   */
  addDependency(importedName: string, dependencyName: string): this {
    this.#dependencies.set(Validation.identifier(importedName), Validation.identifier(dependencyName));
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

export { Dependency };
export type { DependencyObject };
