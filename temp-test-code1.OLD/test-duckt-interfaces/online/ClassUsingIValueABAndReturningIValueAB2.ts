import { IValueAB, IValueAB2bis } from "./interfaces.ts";
import { ClassUsingAndReturningIValueAB } from "https://raw.githubusercontent.com/stefano77it/financial-modeling/master/temp-test-code/test-duckt-interfaces/online/ClassUsingAndReturningIValueAB.ts";

export class ClassUsingIValueABAndReturningIValueAB2 {
  public Run(input: IValueAB): IValueAB2bis {
    return input;
  }
}

const value = { "ValueA": "ciao", "ValueB": "ciao2" };

const classUsingAndReturningIValueAB = new ClassUsingAndReturningIValueAB();

const classUsingIValueABAndReturningIValueAB2 =
  new ClassUsingIValueABAndReturningIValueAB2();

console.log(classUsingIValueABAndReturningIValueAB2.Run(classUsingAndReturningIValueAB.Run(value)).ValueA);
console.log(classUsingIValueABAndReturningIValueAB2.Run(classUsingAndReturningIValueAB.Run(value)).ValueB);
