export { getMortgagePaymentsOfAConstantPaymentLoan, calculatePeriodicPaymentAmountOfAConstantPaymentLoan, calculateAnnuityOfAConstantPaymentLoan };

// info about financial library
// home   https://github.com/lmammino/financial  // backup repository   https://github.com/77it/financial
// npm   https://www.npmjs.com/package/financial/v/0.1.3
// file index   https://cdn.jsdelivr.net/npm/financial@0.1.3/dist/
import { financial } from '../deps.js';

//#region TODO
// TODO subito

// togliere dalle note sotto metodi non necessari (es french)

// getMortgagePayments
/*
aggiungi campi:
* startDate
* paymentDate: 'startDate', 'startOfMonth', 'endOfMonth'  // optional; if omitted is 'startDate' // vedi https://cdn.jsdelivr.net/npm/@danacita/loanjs@1.1.6/src/repaymentSchedule.ts per gestione anno bisestile
* [OPZ] dp (number): The number of digits to appear after the decimal point. If this argument is omitted, is 4. [1] [2]
output, array di:
* nr data  // 0 per prima rata
* data in UTC  // con 0 mostra la data di inizio piano
* capitale residuo
[1] Piano di ammortamento: internamente taglia a N decimali (default 4) quando scrivi i piani; l'ultimo sfrido di quadratura addebitalo sull'ultima rata.
4 è scelto in quanto è usato anche nel formato "Fixed Decimal Number" https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-data-types
[2] // codice per troncare
const message = Number(new Big(4.27777777).toFixed(4, 0));  // see http://mikemcl.github.io/big.js/#toF

*/
// poi test: confrontalo con piani generati da excel


/*
funzione per calcolo interessi a partire da un piano (italiano, francese, personalizzato è irrilevante)
input:
* interestOnlyNrOfPayments  // number of interest-only payments, added to `nrOfPayments`   // see https://www.consumerfinance.gov/ask-cfpb/what-is-an-interest-only-loan-en-101/
* interestCalcMethod: "365/365" "365/360" "30/360"   See https://www.adventuresincre.com/lenders-calcs/
  vedi https://github.com/jutunen/Paydown.js/blob/master/src/paydown.js per tasso /360 o /365
* nrOfPaymentsInAYear  // 12 for monthly, 1 for yearly
* numero: tasso (spread o tasso fisso)  // quando c'è la lista tassi, si intende spread
* lista tassi [{date, tasso}] opzionale, per la sequenza dei tassi variabili
* numero: cap
* numero: floor
*/

// JS piano di ammortamento
/*
differenza tra date:
* quando importi date, togli ore, minuti, secondi
  vedi differenceInCalendarDays() in C:\e3\@gitwk\PUBLIC\financial-modeling\src\lib\date_utils.js\
* Diff in days between dates, rounded (see luxon/date-fns for algo)
  * https://www.geeksforgeeks.org/how-to-calculate-the-number-of-days-between-two-dates-in-javascript/
  * https://stackoverflow.com/questions/18347050/calculate-the-number-of-days-in-range-picker-javascript
  * https://stackoverflow.com/questions/3224834/get-difference-between-2-dates-in-javascript

Se il capitale in qualche riga è negativo accettalo, vuol dire che c'è un incremento di debito.

Se l'interesse tra parametro e spread è negativo consideralo zero.

metodi:
>>> CustomSchedule: serve per scaricare tutto il capitale residuo fino alla fine (bullet) o per piani persoanlizzati
    (anche senza formula per generare il piano, prendendo capitale+interessi da una tabella Excel)
parametri:
* array: date
* array: principal % su base 100
* numero: tasso (spread o tasso fisso) % sul capitale residuo
* array: opzionale, % di tassi variabili
* numero: cap
* numero: floor
Considera le percentuali solo dal giorno di inizio simulazione alla fine del piano,
anche se totalizzano meno di 100.

>>> FrenchSchedule/ConstantAnnuitySchedule (rata costante); parametri per generare un debito, a partire dal residuo capitale a una certa data:
* numero: tasso iniziale
* data: scadenza
* numero: periodicità (numero di rate in un anno)
* numero: tasso (spread o tasso fisso)  // quando c'è la lista tassi, si intende variabile
* lista tassi [{date, tasso}] opzionale, per la sequenza dei tassi variabili
* numero: cap
* numero: floor

>>> ItalianSchedule/ConstantAmortisationSchedule, senza tasso iniziale, il resto come FrenchSchedule

>>> BulletSchedule
 */
//#endregion TODO

/**
 * @param {Object} p
 * @param {number} p.annualInterestRate
 * @param {number} p.yearlyNrOfPayments
 * @param {number} p.totalNrOfPayments
 * @param {number} p.startingPrincipal
 * @return {number}
 */
function calculatePeriodicPaymentAmountOfAConstantPaymentLoan ({
  annualInterestRate,
  yearlyNrOfPayments,
  totalNrOfPayments,
  startingPrincipal
}) {
  // return startingPrincipal * (annualInterestRate / yearlyNrOfPayments) / (1 - Math.pow(1 / (1 + (annualInterestRate / yearlyNrOfPayments)), totalNrOfPayments));
  return -1 * financial.pmt(annualInterestRate / yearlyNrOfPayments, totalNrOfPayments, startingPrincipal, 0, financial.PaymentDueTime.End);
}

/**
 * compute the Annuity (annual sum of Principal And Interests) of a french amortization schedule (a series of constant payments at regular intervals)
 *
 * @param {Object} p
 * @param {number} p.annualInterestRate
 * @param {number} p.nrOfYears
 * @param {number} p.startingPrincipal
 * @return {number}
 */
function calculateAnnuityOfAConstantPaymentLoan ({
  annualInterestRate,
  nrOfYears,
  startingPrincipal
}) {
  //return startingPrincipal * (annualInterestRate + (annualInterestRate / (Math.pow((1 + annualInterestRate), nrOfYears) - 1)));
  return calculatePeriodicPaymentAmountOfAConstantPaymentLoan({
    annualInterestRate: annualInterestRate,
    yearlyNrOfPayments: 1,
    totalNrOfPayments: nrOfYears,
    startingPrincipal: startingPrincipal
  });
}


/**
 * @param {Object} p
 * @param {number} p.startingPrincipal
 * @param {number} p.annualInterestRate
 * @param {number} p.totalNoOfPayments
 * @param {number} p.noOfPaymentsInAYear  12 for monthly, 6 for bimonthly, ..., 1 for yearly
 * @return {{paymentNr: number, interestPayment: number, principalPayment: number, totalMortgageRemaining: number}[]}
 */
function getMortgagePaymentsOfAConstantPaymentLoan ({ startingPrincipal, annualInterestRate, totalNoOfPayments , noOfPaymentsInAYear}) {
  // We use "let" here since the value will change, i.e. we make mortgage payments each month, so our total
  let mortgageRemaining = startingPrincipal;

  // Calculate the monthly mortgage payment. To get a monthly payment, we divide the interest rate by 12
  // Multiply by -1, since it default to a negative value
  const mortgagePayment = -1 * financial.pmt(annualInterestRate / noOfPaymentsInAYear, totalNoOfPayments, startingPrincipal, 0, financial.PaymentDueTime.End);

  const mortgageArray = [];

  // Here we loop through each payment (starting from 1) and figure out what values will be
  for (let currPaymentNo = 1; currPaymentNo <= totalNoOfPayments; currPaymentNo++) {
    // The interest payment portion of that month
    const interestPayment = -1 * financial.ipmt(annualInterestRate / noOfPaymentsInAYear, currPaymentNo, totalNoOfPayments, startingPrincipal);

    let principalPayment = mortgagePayment - interestPayment;
    if (currPaymentNo === totalNoOfPayments)  // if we reached the last payment, the last payment is the residual principal
      principalPayment = mortgageRemaining;

    // Calculate the remaining mortgage amount, which you do by subtracting the principal payment
    mortgageRemaining = mortgageRemaining - principalPayment;

    mortgageArray.push({
      paymentNr: currPaymentNo,
      interestPayment: interestPayment,
      principalPayment: principalPayment,
      totalMortgageRemaining: mortgageRemaining
    });
  }

  // coherence test
  if (mortgageRemaining !== 0)
    throw new Error(`Internal error, at the end of the mortgage calculation, residual mortgage must be zero.`);

  return mortgageArray;
}
