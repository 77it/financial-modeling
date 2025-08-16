export { describe, it };

import assert from 'node:assert';
import { describe as describe_node, it as it_node } from 'node:test';

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
 * @returns {Promise<{describe: function, it: function}>} An object containing `describe` and `it` functions.
 */
async function createDescribeAndItForNodeAndDeno() {
  let _describe;
  let _it;

  // if Deno or Bun are defined, import the BDD module from its standard library, otherwise import from Node.js
  if (typeof Deno !== 'undefined') {
    const bdd = await import ("jsr:@std/testing/bdd");
    _describe = bdd.describe;
    _it = bdd.it;
    //@ts-ignore Bun
  } else if (typeof Bun !== 'undefined') {
    const bdd = await import('bun:test');
    _describe = bdd.describe;
    _it = bdd.it;
  } else {
    //@ts-ignore describe_node
    _describe = describe_node;
    //@ts-ignore it_node
    _it = it_node;
  }

  return {describe: _describe, it: _it};
}

const { describe, it } = await createDescribeAndItForNodeAndDeno();

// Create Jest‑style global `expect` function
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
