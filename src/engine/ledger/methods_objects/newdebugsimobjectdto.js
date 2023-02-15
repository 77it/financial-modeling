export { NewDebugSimObjectDto };

class NewDebugSimObjectDto {
  /**
   * @param {Object} p
   * @param {string} p.type
   * @param {string} p.description
   */
  constructor (p) {
    this.type = p.type;
    this.description = p.description;
  }
}
