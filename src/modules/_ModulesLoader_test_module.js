import {ValuesA2} from './_ModulesLoader_test_module2.js';

export class ValuesA {
  static value = "hello v0.1.2";
}

export class Module {
  static valueX = "module v0.1.2";
  /** @param {{value: string, value2: string}} p */
  constructor({value, value2}) {
    this.value = value;
    this.value2 = value2;
  }
}

export async function value_from_other_file__ValuesA2(){
  const _module = (await import("./_ModulesLoader_test_module2.js"));
  return _module.ValuesA2.value;
}
