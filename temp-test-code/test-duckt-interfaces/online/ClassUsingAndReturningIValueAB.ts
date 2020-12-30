import { IValueAB, IValueAB2 } from './utils/interfaces.ts'

export class ClassUsingAndReturningIValueAB {
  public Run(input : IValueAB): IValueAB2 {
    return input;
  }
}
