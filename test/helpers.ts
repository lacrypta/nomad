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

export type TestCaseInput<T extends (...args: any) => any> =
  | {
      error: Error;
      expected: null;
      input: Parameters<T>;
    }
  | {
      error: null;
      expected: ReturnType<T>;
      input: Parameters<T>;
    };

export type TestCases<T extends (...args: any) => any> = {
  [name: string]: TestCaseInput<T>;
};

export const testAll: <T extends (...args: any) => any>(it: jest.It, func: T, cases: Record<string, any>) => void = <
  T extends (...args: any) => any,
>(
  it: jest.It,
  func: T,
  cases: Record<string, any>,
): void => {
  describe(`${func.name}()`, (): void => {
    it.each(
      Object.entries(cases as TestCases<T>).map(
        ([name, testCase]: [string, TestCaseInput<T>]): {
          name: string;
        } & TestCaseInput<T> => {
          return { name, ...testCase };
        },
      ),
    )('$name', ({ error, expected, input }: TestCaseInput<T>): void => {
      if (error instanceof Error) {
        expect((): void => {
          func(...input);
        }).toThrow(error);
      } else {
        expect(JSON.stringify(func(...input))).toStrictEqual(JSON.stringify(expected));
      }
    });
  });
};
