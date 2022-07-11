/*
Private Properties
* List<(DateTime Date, number Principal)> PrincipalToPay_AmortizationSchedule
* number monthFrequency: MONTHLY|QUATERLY|HALF_YEARLY|YEARLY // from http://www.opencharging.org/opencharging-util/apidocs/org/opencharging/util/time/MonthFrequency.html
* number numberOfPaymentsLeft
* [1] lastCalculation
*/

import { BigDenary } from "https://deno.land/x/bigdenary/mod.ts";

export class Loan {
    //#region private properties
    readonly #settings: LoanSettings;
    readonly #decimals = 100_000;
    readonly #periodicPaymentAmount: BigDenary;

    #principal: BigDenary;
    #today: Date;
    #lastCalculation: LoanLastCalculation;
    #lastDayOfPaidInterests: Date;
    #numberOfRemainingPayments: number;
    #numberOfRemainingInterestOnlyPayments: number;
    #rateFixedOrSpread: number;
    #rateVariablePart: number;
    #rateCap: null | number;
    #rateFloor: null | number;
    #extinguished: boolean;
    //#endregion private properties

    constructor(settings: LoanSettings) {
        this.#settings = settings;

        if (this.#settings.initialPrincipal == null
            || this.#settings.totalNumberOfPrincipalPaymentsAndInterestOnlyPayments == null
            || this.#settings.numberOfInterestOnlyPayments == null
            || this.#settings.numberOfAnnualPayments == null
            || this.#settings.startDate == null
            || this.#settings.initialRateForConstantPaymentCalculation == null
        )
            throw ("one or more required property of 'settings' is null");

        this.settingsMutablePropertiesChecks();

        this.#today = this.subtractDays(this.#settings.startDate, 1);
        this.#lastDayOfPaidInterests = this.subtractDays(this.#settings.startDate, 1);
        this.#numberOfRemainingPayments = this.#settings.totalNumberOfPrincipalPaymentsAndInterestOnlyPayments;
        this.#numberOfRemainingInterestOnlyPayments = this.#settings.numberOfInterestOnlyPayments;
        this.#principal = this.toBD(this.#settings.initialPrincipal);
        this.#periodicPaymentAmount = this.toBD(Loan.calculatePeriodicPaymentAmountOfAConstantPaymentLoan(this.#settings.initialRateForConstantPaymentCalculation, this.#settings.numberOfAnnualPayments, this.#numberOfRemainingPayments, this.#settings.initialPrincipal));
        this.#extinguished = false;
        this.#lastCalculation = this.getEmptyLoanLastCalculation();
        this.#rateFixedOrSpread = 0;
        this.#rateVariablePart = 0;
        this.#rateCap = null;
        this.#rateFloor = null;
        this.calculateNextDay();  // calculate for the `startDate`
    }

    //#region GET
    getToday(): Date {
        return this.#today;
    }

    getLastCalculation(): LoanLastCalculation {
        return this.#lastCalculation;
    }

    getPeriodicPaymentAmount(): number {
        return this.fromBD(this.#periodicPaymentAmount);
    }

    getPrincipalAtToday(): number {
        return this.fromBD(this.#principal);
    }
    //#endregion GET

    //#region CALCULATIONS & CHANGES of INTEREST & PRINCIPAL
    calculateNextDay(): LoanLastCalculation {
        if (this.#extinguished) { return this.getEmptyLoanLastCalculation(); }

        const _today: Date = this.addDays(this.#today, 1);
        this.calculateToDate(_today);
        this.#today = _today;
        return this.#lastCalculation;
    }

    calculateToDate(toDate: Date): LoanLastCalculation {
        if (this.#extinguished) { return this.getEmptyLoanLastCalculation(); }

        this.calculateToDate(toDate);
        this.#today = toDate;
        return this.#lastCalculation;
    }

    earlyTerminateToday(): LoanLastCalculation {
        this.calculateTodayRates();

        // calculate interest and principal
        // add value of interest and principal to `#lastCalculation`
        //PIPPO;
        this.#extinguished = true;
        throw "not implemented";
        //return this.#lastCalculation;
    }
    //#endregion CALCULATIONS & CHANGES of INTEREST & PRINCIPAL

    //#region PUBLIC UTILITIES (can be useful outside this class)
    // compute the Periodic Payment Amount (Principal And Interests) of a french amortization schedule (a series of constant payments at regular intervals)
    static calculatePeriodicPaymentAmountOfAConstantPaymentLoan(
        annualInterestRate: number,
        yearlyNrOfPayments: number,
        totalNrOfPayments: number,
        startingPrincipal: number): number {
        return startingPrincipal * (annualInterestRate / yearlyNrOfPayments) / (1 - Math.pow(1 / (1 + (annualInterestRate / yearlyNrOfPayments)), totalNrOfPayments));
    }

    // compute the Annuity (annual sum of Principal And Interests) of a french amortization schedule (a series of constant payments at regular intervals)
    static calculateAnnuityOfAConstantPaymentLoan(
        annualInterestRate: number,
        nrOfYears: number,
        startingPrincipal: number): number {
        return startingPrincipal * (annualInterestRate + (annualInterestRate / (Math.pow((1 + annualInterestRate), nrOfYears) - 1)));
    }
    //#endregion PUBLIC UTILITIES (can be useful outside this class)

    //#region PRIVATE METHODS
    private calculateTodayRates(): void {
        const _today = this.todayAsIsoString();

        const _rateFixedOrSpread = this.rateIsNumber(this.#settings.ratesFixedOrSpread) ?
            this.#settings.ratesFixedOrSpread : this.#settings.ratesFixedOrSpread[_today];
        if (_rateFixedOrSpread != null) { this.#rateFixedOrSpread = _rateFixedOrSpread; }

        const _rateVariablePart = this.#settings.ratesVariablePartList[_today];
        if (_rateVariablePart != null) { this.#rateVariablePart = _rateVariablePart; }

        const _rateCap = this.rateIsLoanSettingsRateList(this.#settings.ratesCap) ?
            this.#settings.ratesCap[_today] : null;
        if (_rateCap != null) { this.#rateCap = _rateCap; }

        const _rateFloor = this.rateIsLoanSettingsRateList(this.#settings.ratesFloor) ?
            this.#settings.ratesFloor[_today] : null;
        if (_rateFloor != null) { this.#rateFloor = _rateFloor; }
    }

    private settingsMutablePropertiesChecks(): void {
        if (this.#settings.earlyTerminationDate === undefined) { this.#settings.earlyTerminationDate = null; }
        if (this.#settings.ratesCap === undefined) { this.#settings.ratesCap = null; }
        if (this.#settings.ratesFloor === undefined) { this.#settings.ratesFloor = null; }

        if (this.#settings.ratesFixedOrSpread == null
            || this.#settings.ratesVariablePartList == null
            || this.#settings.totalNumberOfPaymentLeftChanges == null
        )
            throw ("one or more required property of 'settings' is null");
    }

    private addDays(date: Date, days: number): Date {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    private subtractDays(date: Date, days: number): Date {
        var result = new Date(date);
        result.setDate(result.getDate() - days);
        return result;
    }

    // compare the `number` representation of BigDenary because `number` is rounded and gives better results for number with many decimals;
    // e.g. in this way 1/3 + 1/3 + 1/3 = 1; otherwise, using directly `BigDenary`, won't be
    private eqBd(a: BigDenary, b: BigDenary): boolean {
        return (a.valueOf() == b.valueOf());
    }

    private toBD(n: number): BigDenary {
        return new BigDenary(n * this.#decimals);
    }

    private fromBD(bd: BigDenary): number {
        return bd.div(this.#decimals).valueOf();
    }

    private todayAsIsoString(): string {
        return this.#today.toISOString();
    }

    private rateIsNumber(rate: null | number | LoanRates): rate is number {
        return (typeof rate === "number");
    }

    private rateIsLoanSettingsRateList(rate: null | number | LoanRates): rate is LoanRates {
        if (rate == null) { return false; }
        else if (this.rateIsNumber(rate)) { return false; }
        return true;
    }

    private getEmptyLoanLastCalculation(): LoanLastCalculation {
        return new LoanLastCalculation(this.#extinguished, 0, 0, 0, 0, 0, 0);
    }
    //#endregion PRIVATE METHODS
}

export class LoanLastCalculation {
    constructor(
        readonly extinguished: boolean,
        readonly lastDailyCalculatedInterest: number,
        readonly lastDailyCalculatedPrincipalIncrment: number,
        readonly lastDailyCalculatedPrincipalDecrment: number,
        readonly lastCalculatedInterest: number,
        readonly lastCalculatedPrincipalIncrment: number,
        readonly lastCalculatedPrincipalDecrment: number
    ) { }
}

//#region LoanSettings
export interface LoanSettings {
    readonly initialPrincipal: number,
    readonly totalNumberOfPrincipalPaymentsAndInterestOnlyPayments: number,
    readonly numberOfInterestOnlyPayments: number,
    readonly numberOfAnnualPayments: 1 | 2 | 4 | 6 | 12,
    readonly startDate: Date,
    readonly initialRateForConstantPaymentCalculation: number,
    earlyTerminationDate: null | Date,
    suspendedPayments: LoanSuspendedPayments,
    ratesFixedOrSpread: number | LoanRates,
    ratesVariablePartList: LoanRates,
    ratesCap: null | number | LoanRates,
    ratesFloor: null | number | LoanRates,
    principalIncrementsAndDecrements: LoanPrincipalDelta;
    principalNewAmounts: LoanPrincipalNewAmounts;
    totalNumberOfPaymentLeftChanges: LoanTotalNumberOfPaymentsLeft;
}

// see "Italian amortization" in "3.3 Most common types of amortization" from https://docenti-deps.unisi.it/lucaregis/wp-content/uploads/sites/53/2017/02/LR_Financial_Mathematics_18_19-6.pdf
export interface ItalianLoanSettings {
    readonly kind: LoanKind.Italian;
    readonly initialPrincipal: number,
    readonly totalNumberOfPrincipalPaymentsAndInterestOnlyPayments: number,
    readonly numberOfInterestOnlyPayments: number,
    readonly numberOfAnnualPayments: 1 | 2 | 4 | 6 | 12,
    readonly startDate: Date,
    earlyTerminationDate: null | Date,
    suspendedPayments: LoanSuspendedPayments,
    ratesFixedOrSpread: number | LoanRates,
    ratesVariablePartList: LoanRates,
    ratesCap: null | number | LoanRates,
    ratesFloor: null | number | LoanRates,
    principalIncrementsAndDecrements: LoanPrincipalDelta;
    principalNewAmounts: LoanPrincipalNewAmounts;
    totalNumberOfPaymentLeftChanges: LoanTotalNumberOfPaymentsLeft;
}

// see "French amortization" in "3.3 Most common types of amortization" from https://docenti-deps.unisi.it/lucaregis/wp-content/uploads/sites/53/2017/02/LR_Financial_Mathematics_18_19-6.pdf
export interface FrenchLoanSettings {
    readonly kind: LoanKind.French;
    readonly initialPrincipal: number,
    readonly totalNumberOfPrincipalPaymentsAndInterestOnlyPayments: number,
    readonly numberOfInterestOnlyPayments: number,
    readonly numberOfAnnualPayments: 1 | 2 | 4 | 6 | 12,
    readonly startDate: Date,
    readonly initialRateForConstantPaymentCalculation: number,
    earlyTerminationDate: null | Date,
    suspendedPayments: LoanSuspendedPayments,
    ratesFixedOrSpread: number | LoanRates,
    ratesVariablePartList: LoanRates,
    ratesCap: null | number | LoanRates,
    ratesFloor: null | number | LoanRates,
    principalIncrementsAndDecrements: LoanPrincipalDelta;
    principalNewAmounts: LoanPrincipalNewAmounts;
    totalNumberOfPaymentLeftChanges: LoanTotalNumberOfPaymentsLeft;
}

export interface BulletLoanSettings {
    readonly kind: LoanKind.Bullet;
    readonly initialPrincipal: number,
    readonly numberOfInterestOnlyPayments: number,
    readonly numberOfAnnualPayments: 1 | 2 | 4 | 6 | 12,
    readonly startDate: Date,
    earlyTerminationDate: null | Date,
    suspendedPayments: LoanSuspendedPayments,
    ratesFixedOrSpread: number | LoanRates,
    ratesVariablePartList: LoanRates,
    ratesCap: null | number | LoanRates,
    ratesFloor: null | number | LoanRates,
    principalIncrementsAndDecrements: LoanPrincipalDelta;
    principalNewAmounts: LoanPrincipalNewAmounts;
    totalNumberOfPaymentLeftChanges: LoanTotalNumberOfPaymentsLeft;
}

export interface CustomLoanSettings {
    readonly kind: LoanKind.Custom;
    readonly initialPrincipal: number,
    readonly numberOfAnnualPayments: 1 | 2 | 4 | 6 | 12,  // are intrest-only payments
    readonly startDate: Date,
    earlyTerminationDate: null | Date,
    suspendedPayments: LoanSuspendedPayments,
    ratesFixedOrSpread: number | LoanRates,
    ratesVariablePartList: LoanRates,
    ratesCap: null | number | LoanRates,
    ratesFloor: null | number | LoanRates,
    principalIncrementsAndDecrements: LoanPrincipalDelta;
    principalNewAmounts: LoanPrincipalNewAmounts;
}

export interface LoanSuspendedPayments {
    [startDate: string]: {
        end: Date;
        type: LoanSettingsSuspendedPaymentsType;
    }
}

export enum LoanKind {
    Italian,
    French,
    Custom,
    Bullet
}

export enum LoanSettingsSuspendedPaymentsType {
    PrincipalWithInterestToBePaidRegularly = "SuspendedPrincipalWithInterestToBePaidRegularly",
    PrincipalWithInterestWaived = "SuspendedPrincipalWithInterestWaived",
    PrincipalWithInterestToBePaidAtTheEndOfTheSuspension = "SuspendedPrincipalWithInterestToBePaidAtTheEndOfTheSuspension"
}

export interface LoanRates {
    [date: string]: number;
}

export interface LoanPrincipalDelta {
    [changeDate: string]: number;  // can be positive or negative
}

export interface LoanPrincipalNewAmounts {
    [changeDate: string]: number;  // can be only positive
}

export interface LoanTotalNumberOfPaymentsLeft {
    [changeDate: string]: number;
}
//#endregion LoanSettings
