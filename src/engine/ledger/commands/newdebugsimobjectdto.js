export { NewDebugSimObjectDto };

class NewDebugSimObjectDto {
  /**
   * @param {Object} p
   * @param {string} p.type
   * @param {string} p.description
   * @param {string} [p.command__DebugDescription]
   * @param {string} [p.commandGroup__DebugDescription]
   */
  constructor (p) {
    this.type = p.type;
    this.description = p.description;
    this.command__DebugDescription = p.command__DebugDescription;
    this.commandGroup__DebugDescription = p.commandGroup__DebugDescription;
  }
}
