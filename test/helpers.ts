// nomad: The Nomad Virtual Machine reference implementation
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

import buffer from 'node:buffer';

export type TestCaseInput<T, U> =
  | {
      error: Error;
      expected?: null;
      input: T;
    }
  | {
      error?: null;
      expected: U;
      input: T;
    };

export type TestCases<T, U> = {
  [name: string]: TestCaseInput<T, U>;
};

const reformatCases: <T, U>(cases: TestCases<T, U>) => ({ name: string } & TestCaseInput<T, U>)[] = <T, U>(
  cases: TestCases<T, U>,
): ({ name: string } & TestCaseInput<T, U>)[] =>
  Object.entries(cases).map(
    ([name, testCase]: [string, TestCaseInput<T, U>]): {
      name: string;
    } & TestCaseInput<T, U> => {
      return { name, ...testCase };
    },
  );

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const testAll: <T extends (...args: any) => any>(
  it: jest.It,
  func: T,
  cases: TestCases<Parameters<T>, ReturnType<T>>,
  testName?: string,
) => void = <
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  T extends (...args: any) => any,
>(
  it: jest.It,
  func: T,
  cases: TestCases<Parameters<T>, ReturnType<T>>,
  testName?: string,
): void => {
  describe(testName ?? `${func.name}()`, (): void => {
    it.each(reformatCases(cases))(
      '$name',
      ({ error, expected, input }: TestCaseInput<Parameters<T>, ReturnType<T>>): void => {
        if (error instanceof Error) {
          expect((): void => {
            func(...input);
          }).toThrow(error);
        } else {
          expect(func(...input)).toStrictEqual(expected);
        }
      },
    );
  });
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const testAllConstructor: <T extends new (...args: any) => any>(
  it: jest.It,
  cls: T,
  cases: TestCases<ConstructorParameters<T>, InstanceType<T>>,
  testName?: string,
) => void = <
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  T extends new (...args: any) => any,
>(
  it: jest.It,
  cls: T,
  cases: TestCases<ConstructorParameters<T>, InstanceType<T>>,
  testName?: string,
): void => {
  describe(testName ?? 'constructor', (): void => {
    it.each(reformatCases(cases))(
      '$name',
      ({ error, expected, input }: TestCaseInput<ConstructorParameters<T>, InstanceType<T>>): void => {
        if (error instanceof Error) {
          expect((): void => {
            new cls(...input);
          }).toThrow(error);
        } else {
          expect(new cls(...input)).toStrictEqual(expected);
        }
      },
    );
  });
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const testAllMethod: <T, U extends (this: T, ...args: any) => any>(
  it: jest.It,
  targetBuilder: () => T,
  method: U,
  cases: TestCases<Parameters<U>, ReturnType<U>>,
  testName?: string,
) => void = <
  T,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  U extends (this: T, ...args: any) => any,
>(
  it: jest.It,
  targetBuilder: () => T,
  method: U,
  cases: TestCases<Parameters<U>, ReturnType<U>>,
  testName?: string,
): void => {
  describe(testName ?? `${method.name}()`, (): void => {
    it.each(reformatCases(cases))(
      '$name',
      ({ error, expected, input }: TestCaseInput<Parameters<U>, ReturnType<U>>): void => {
        if (error instanceof Error) {
          expect((): void => {
            method.call(targetBuilder(), ...input);
          }).toThrow(error);
        } else {
          expect(method.call(targetBuilder(), ...input)).toStrictEqual(expected);
        }
      },
    );
  });
};

export const blobUriToText: (uri: string | URL) => Promise<string | undefined> = async (
  uri: string | URL,
): Promise<string | undefined> => buffer.resolveObjectURL(uri.toString())?.text();

export const stringToDataUri: (data: string) => string = (data: string): string =>
  `data:application/javascript;base64,${btoa(data)}`;

export const withFakeTimers: (callback: () => void) => () => void = (callback: () => void): (() => void) => {
  return (): void => {
    jest.useFakeTimers();
    try {
      callback();
    } finally {
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  };
};

export const restoringMocks: (callback: () => void) => () => void = (callback: () => void): (() => void) => {
  return (): void => {
    try {
      callback();
    } finally {
      jest.restoreAllMocks();
    }
  };
};

export const asyncRestoringMocks: (callback: () => Promise<void>) => () => Promise<void> = (
  callback: () => Promise<void>,
): (() => Promise<void>) => {
  return async (): Promise<void> => {
    try {
      await callback();
      return;
    } finally {
      jest.restoreAllMocks();
    }
  };
};

export const delay: (ms: number) => Promise<void> = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
