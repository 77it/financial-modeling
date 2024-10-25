/**
 * Class representing a global value with a default that can be set only once.
 * If the default value is ever returned, the value becomes locked and cannot be changed.
 */
export class GlobalValue {
  /** @type {boolean} */
  #isLocked; // flag to lock setting once the default is returned
  /** @type {any} */
  #value; // private field to store the value

  /**
   * Create a GlobalValue instance.
   * @param {any} defaultValue - The default fallback value.
   */
  constructor(defaultValue) {
    this.#value = defaultValue;
    this.#isLocked = false;
  }

  /**
   * Set a new value (one time), but only if it hasn't been locked yet.<p>
   * If the value is locked, the set is ignored.
   * @param {any} newValue - The new value to set.
   */
  set(newValue) {
    if (!this.#isLocked) {
      this.#value = newValue;
      this.#isLocked = true; // Lock the value
    }
  }

  /**
   * Get the current value, then value becomes locked and can't be reset anymore.
   * @returns {any} The current value.
   */
  get() {
    this.#isLocked = true; // Lock the value
    return this.#value;
  }

  /**
   * Check if the value has been locked, meaning it can no longer be set.
   * @returns {boolean} True if the value is locked, otherwise false.
   */
  isLocked() {
    return this.#isLocked;
  }
}
