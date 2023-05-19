/**
 * Calculates the future value of a single cash flow
 * @param pv - present value of the cash flow
 * @param r - annual interest rate
 * @param t - number of years
 * @param m - number of compounding periods per year (if null or undefined then
 * cash flow is calculated using continuous compounding)
 */
fv = function(pv, r, t, m) {
    // Continuous compounding
    if (m === null || m === undefined) {
        return pv * Math.exp(r * t);
    }
    // Discrete compounding
    else {
        return pv * Math.pow(1 + r / m, m * t);
    }
}

/**
 * Calculates the present value of a single cash flow
 * @param pv - future value of the cash flow
 * @param r - annual interest rate
 * @param t - number of years
 * @param m - number of compounding periods per year (if null or undefined then
 * cash flow is calculated using continuous compounding)
 */
pv = function(fv, r, t, m) {
    // Continuous compounding
    if (m === null || m === undefined) {
        return fv / Math.exp(r * t);
    }
    // Discrete compounding
    else {
        return fv / Math.pow(1 + r / m, m * t);
    }
}