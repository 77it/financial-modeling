import { IValueAB, IValueAB2 } from "./lib/interfaces_h.js";

export class ClassUsingAndReturningIValueAB {
  public Run(input: IValueAB): IValueAB2 {
    return input;
  }
}
