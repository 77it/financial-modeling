export { NewDebugSimObjectDto };

class NewDebugSimObjectDto {
  /**
   * @param {Object} p
   * @param {string} p.description - Debug message
   * @param {string} [p.command__DebugDescription]
   * @param {string} [p.commandGroup__DebugDescription] - Optional. If not provided, will be set to the current module info
   */
  constructor (p) {
    this.description = p.description;
    this.command__DebugDescription = p.command__DebugDescription;
    this.commandGroup__DebugDescription = p.commandGroup__DebugDescription;
  }
}
