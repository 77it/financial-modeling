export { Result };

class Result {
  /** @type {boolean} */
  success;
  /** @type {*} */
  value;
  /** @type {undefined|string} */
  error;

  /**
   * @param {{success: boolean, value?: *, error?: string}} p
   * param can be {{success: true, value?: *} | {success:false, error: string}}
   */
  constructor ({ success, value, error }) {
    if (success && error) {
      throw new Error('success and error cannot be both true');
    }
    if (!success && !error) {
      throw new Error('success and error cannot be both false');
    }
    this.success = success;
    this.value = value;
    this.error = error;
  }
}
