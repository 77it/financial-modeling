export class Module {
  static valueX = "module v0.1.3";
  /** @param {{value: string, value2: string}} p */
  constructor({value, value2}) {
    this.value = value;
    this.value2 = value2;
  }
}

export async function value_from_other_file__ValuesA2(){
  const _module = await import("./modules_loader_test_module2.js");
  return _module.ValuesA2.value;
}
