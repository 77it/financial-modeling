export { describe, it, beforeEach };

import assert from 'node:assert';
import { describe as describe_node, it as it_node, beforeEach as beforeEach_node } from 'node:test';

/*
  ____    _____    _____        _____     ____    _       __     __  ______   _____   _        _
 |  _ \  |  __ \  |  __ \      |  __ \   / __ \  | |      \ \   / / |  ____| |_   _| | |      | |
 | |_) | | |  | | | |  | |     | |__) | | |  | | | |       \ \_/ /  | |__      | |   | |      | |
 |  _ <  | |  | | | |  | |     |  ___/  | |  | | | |        \   /   |  __|     | |   | |      | |
 | |_) | | |__| | | |__| |     | |      | |__| | | |____     | |    | |       _| |_  | |____  | |____
 |____/  |_____/  |_____/      |_|       \____/  |______|    |_|    |_|      |_____| |______| |______|
 */
//#region BDD Jest-like globals

/**
 * Creates an object with Jest-like test globals.
 * @returns {Promise<{describe: function, it: function, beforeEach: function}>} An object containing `describe`, `it`, and `beforeEach` functions.
 */
async function createDescribeAndItForNodeAndDeno() {
  let _describe;
  let _it;
  let _beforeEach;

  // if Deno or Bun are defined, import the BDD module from its standard library, otherwise import from Node.js
  if (typeof Deno !== 'undefined') {
    const bdd = await import ("jsr:@std/testing/bdd");
    _describe = bdd.describe;
    _it = bdd.it;
    _beforeEach = bdd.beforeEach;
    //@ts-ignore Bun
  } else if (typeof Bun !== 'undefined') {
    const bdd = await import('bun:test');
    _describe = bdd.describe;
    _it = bdd.it;
    _beforeEach = bdd.beforeEach;
  } else {
    //@ts-ignore describe_node
    _describe = describe_node;
    //@ts-ignore it_node
    _it = it_node;
    //@ts-ignore beforeEach_node
    _beforeEach = beforeEach_node;
  }

  /**
   * Wraps a test function to handle both synchronous and asynchronous testing patterns.
   * * This function is designed to be a flexible wrapper for test runners. It inspects the arity (number of formal parameters)
   * of the test function `fn` to determine its type.
   * * - If `fn.length > 0`, it assumes the function expects a `done` callback, common in older async testing styles. It returns a `Promise` that resolves when `done()` is called without an error, or rejects if `done(error)` is called. If the function also returns a `Promise`, it handles that `Promise` as well, allowing for a hybrid approach.
   * - If `fn.length === 0`, it treats the function as a standard synchronous or modern `async` function, passing it directly to the underlying `_it` function.
   * @param {string} name The name of the test.
   * @param {(done?: (err?: any) => void) => any} fn The test function to wrap. It can be a synchronous function, an async function, or a function that accepts a `done` callback.
   * @returns {any} The result of the underlying test runner function `_it`.
   */
  const wrappedIt = (name, fn) => {
    if (fn.length > 0) {
      // Function expects a done callback
      return _it(name, () => {
        return new Promise((resolve, reject) => {

          /**
           * A callback function used to signal the completion of an asynchronous test.
           *
           * @callback DoneCallback
           * @param {Error | null | undefined} [error] An optional error object. If an error is provided, the test will fail.
           * If no error is provided, the test will pass.
           */

          /**
           * The `done` callback provided to an asynchronous test function.
           *
           * It is called to indicate that the asynchronous operations have completed.
           *
           * @type {DoneCallback}
           */
          const done = (error) => {
            if (error) {
              reject(error);
            } else {
              resolve(undefined);
            }
          };

          try {
            const result = fn(done);
            // If the function returns a promise, handle it
            if (result && typeof result.then === 'function') {
              result.then(() => resolve(undefined)).catch(reject);
            }
          } catch (error) {
            reject(error);
          }
        });
      });
    } else {
      // Regular synchronous or async test
      return _it(name, fn);
    }
  };

  return {describe: _describe, it: wrappedIt, beforeEach: _beforeEach};
}

const { describe, it, beforeEach } = await createDescribeAndItForNodeAndDeno();

// Create Jest 'style global `expect` function
//@ts-ignore expect
if (typeof expect === "undefined") {
  //@ts-ignore globalThis.expect
  globalThis.expect = (/** @type {*} */ received) => {
    const matchers = {
      toBe(/** @type {*} */ expected) {
        assert.strictEqual(
          received,
          expected,
          `Expected ${received} to be ${expected}`
        );
      },
      toEqual(/** @type {*} */ expected) {
        assert.deepStrictEqual(
          received,
          expected
          //`Expected ${JSON.stringify(received)} to equal ${JSON.stringify(expected)}`
        );
      },
      toThrow(/** @type {*} */ expectedError) {
        let threw = false;
        try {
          received();
        } catch (/** @type {*} */ error) {
          threw = true;
          if (expectedError) {
            if (typeof expectedError === 'string') {
              assert.strictEqual(
                error.message,
                expectedError,
                `Expected error message "${error.message}" to be "${expectedError}"`
              );
            } else if (error instanceof expectedError) {
              return;
            } else {
              throw new assert.AssertionError({
                message: `Expected error to be instance of ${expectedError.name}, but got ${error.constructor.name}`,
                actual: error.constructor.name,
                expected: expectedError.name,
              });
            }
          }
        }
        if (!threw) {
          throw new assert.AssertionError({
            message: 'Expected function to throw an error, but it did not',
          });
        }
      },
      toBeNull() {
        assert.strictEqual(
          received,
          null,
          `Expected ${received} to be null`
        );
      }
    };

    return {
      ...matchers,
      not: {
        toBe(/** @type {*} */ expected) {
          assert.notStrictEqual(
            received,
            expected,
            `Expected ${received} not to be ${expected}`
          );
        },
        toEqual(/** @type {*} */ expected) {
          assert.notDeepStrictEqual(
            received,
            expected
            //`Expected ${JSON.stringify(received)} not to equal ${JSON.stringify(expected)}`
          );
        },
        toThrow(/** @type {*} */ expectedError) {
          let threw = false;
          try {
            received();
          } catch (/** @type {*} */ error) {
            threw = true;
            if (expectedError) {
              if (typeof expectedError === 'string') {
                assert.notStrictEqual(
                  error.message,
                  expectedError,
                  `Expected error message "${error.message}" not to be "${expectedError}"`
                );
              } else if (error instanceof expectedError) {
                throw new assert.AssertionError({
                  message: `Expected error not to be instance of ${expectedError.name}, but it was`,
                  actual: error.constructor.name,
                  expected: expectedError.name,
                });
              }
            }
          }
          if (!threw) {
            return;
          }
          throw new assert.AssertionError({
            message: 'Expected function not to throw an error, but it did',
          });
        },
        toBeNull() {
          assert.notStrictEqual(
            received,
            null,
            `Expected ${received} not to be null`
          );
        }
      }
    };
  };
}
//#endregion BDD Jest-like globals