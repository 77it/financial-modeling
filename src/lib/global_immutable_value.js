export { GlobalImmutableValue };

import { deepFreeze } from './obj_utils.js';

/**
 * Class representing a global immutable value with a default that can be set only once.
 * If the default value is ever returned, the value becomes locked and cannot be changed.
 * The passed value is deep-frozen before storing it.
 * @template T The type of value this instance will store
 */
class GlobalImmutableValue {
  /** @type {boolean} */
  #isLocked; // flag to lock setting once the default is returned
  /** @type {boolean} */
  #hasValue; // flag that is true only if the value is ever set
  /** @type {T|undefined} */
  #value; // private field to store the value

  /**
   * Create a GlobalImmutableValue instance.
   * If a default value is not provided, the value must be set before calling get().
   * @param {T} [defaultValue] - Optional, the default fallback value.
   */
  constructor(defaultValue) {
    this.#isLocked = false;
    this.#hasValue = false;
    this.#value = undefined; // Initialize value as undefined

    if (arguments.length !== 0) {
      this.#value = deepFreeze(defaultValue);
      this.#hasValue = true;
    }
  }

  /**
   * Reset the value and unlock it.
   * @returns {void}
   */
  reset() {
    this.#isLocked = false;
    this.#hasValue = false;
    this.#value = undefined;
  }

  /**
   * Set a new value (one time), but only if it hasn't been locked yet (will be locked after the first read or set).<p>
   * If the value is locked, the set is ignored.
   * @param {T} newValue - The new value to set.
   * @throws {Error} If the value is locked, throw an error.
   * @returns {void}
   */
  setOneTimeBeforeRead(newValue) {
    if (!this.#isLocked) {
      if (arguments.length !== 0) {
        this.#value = deepFreeze(newValue);
        this.#isLocked = true; // Lock the value
        this.#hasValue = true;
      } else {
        throw new Error('Set value must be provided.');
      }
    } else {
      throw new Error('Value is already locked. Cannot set a new value.');
    }
  }

  /**
   * Get the current value, then value becomes locked and can't be reset anymore.
   * If the value is not set during init nor after with set() before calling get(), an error is thrown.
   * @returns {T} The current value.
   * @throws {Error} If the value is not set during init nor after with set() before calling get().
   */
  get() {
    if (!this.#hasValue) {
      throw new Error('Value must be set before calling get().');
    }

    this.#isLocked = true; // Lock the value
    //@ts-ignore we don't check for undefined here because can be a valid value if user wants to set it to undefined
    return this.#value;
  }

  /**
   * Check if the value has been locked, meaning it can no longer be set.
   * @returns {boolean} True if the value is locked, otherwise false.
   */
  isLocked() {
    return this.#isLocked;
  }

  /**
   * Synonym for isLocked().
   * @returns {boolean} True if the value is set, otherwise false.
   */
  isSet() {
    return this.isLocked();
  }
}
