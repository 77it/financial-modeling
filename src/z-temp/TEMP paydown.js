// from https://raw.githubusercontent.com/jutunen/Paydown.js/master/src/paydown.js


/* eslint-disable camelcase */
/* eslint-disable indent */

function Paydown () {
  this.calculate = function (init_obj, events_array, payments_array, debug_array) {
    var paydown = new _Paydown()

    paydown.set_init(init_obj)

    var local_array = []

    if (events_array) {
      local_array = events_array.slice()
    }

    while (local_array[0]) {
      paydown.check_and_add_event(local_array.shift())
    }

    var interests, reductions, remaining_principal, actual_end_date, latest_payment_date, final_interest, fees

    try {
      [interests, reductions, remaining_principal, actual_end_date, latest_payment_date, final_interest, fees] = paydown.calculate_to_date(payments_array, debug_array)
    } catch (err) {
      throw (err)
    }

    var sum_of_installments

    if (init_obj.hasOwnProperty('round_values')) {
      if( init_obj.round_values ) {
        sum_of_installments = func_round(interests + reductions - final_interest)
        interests = func_round(interests)
        reductions = func_round(reductions)
        remaining_principal = func_round(remaining_principal)
        final_interest = func_round(final_interest)
        fees = func_round(fees)
      } else {
        sum_of_installments = interests + reductions - final_interest
      }
    } else { // round_values default value: true
      sum_of_installments = func_round(interests + reductions - final_interest)
      interests = func_round(interests)
      reductions = func_round(reductions)
      remaining_principal = func_round(remaining_principal)
      final_interest = func_round(final_interest)
      fees = func_round(fees)
    }

    return {
      sum_of_interests: interests,
      sum_of_reductions: reductions,
      sum_of_installments: sum_of_installments,
      remaining_principal: remaining_principal,
      days_calculated: paydown.total_number_of_days,
      actual_end_date: zero_fill_date(actual_end_date),
      latest_payment_date: zero_fill_date(latest_payment_date),
      unpaid_interest: final_interest,
      sum_of_fees: fees
    }
  }
}

function _Paydown () {
  this.event_array = []
  this.sum_of_interests = 0
  this.sum_of_reductions = 0
  this.latest_calculated_interest_date = ''
  this.latest_payment_date = ''
  this.current_rate = ''
  this.current_recurring_payment = null // null indicates that recurring data is missing or invalid
  this.current_principal = ''
  this.g_p_i_sum_of_interests = 0
  this.total_number_of_days = 0
  this.g_p_i_total_days = 0
  this.payment_log_array = []
  this.debug_log_array = []
  this.day_count_divisor = 0
  this.latest_period_end_date = 0
  this.init = {}
  this.round_values = true
  this.initial_fee = 0
  this.sum_of_fees = 0
  this.current_recurring_fee = 0
  this.current_single_fee = 0
  this.recurring_payment_period = 1 // period in months
/* // these 4 are for performance analysis:
  this.timeSpent = 0
  this.callCount = 0
  this.rateEventIterations = 0
  this.mainLoopIterations = 0
*/
  this.rateHashMap = {}

  this.round = function (input) {

    if (typeof input !== 'number' || isNaN(input)) {
      throw new Error('this.round illegal parameter type')
    }
    if (this.round_values) {
      input = func_round(input)
    }

    return input
  }

  this.log_payment = function (payment) {
    if (this.payment_logging_enabled) {
      if (payment[0].length !== 10) {
        payment[0] = zero_fill_date(payment[0])
      }
      this.payment_log_array.push(payment)
    }
  }

  // period lasts from the beginning of start date to the end of end_date
  this.get_period_interests = function (principal, rate, start_date, end_date) {

/*  // these 2 are for performance analysis:
    this.callCount++
    var timeBegin = Date.now();
*/
    var sum_of_interests = 0
    var rate_event

    if (!principal) { throw new Error('this.get_period_interests invalid parameter: principal') }
    // rate is allowed to be zero
    if (!start_date) { throw new Error('this.get_period_interests invalid parameter: start_date') }
    if (!end_date) { throw new Error('this.get_period_interests invalid parameter: end_date') }

    if (date_to_integer(start_date) > date_to_integer(end_date)) {
      throw new Error('this.get_period_interests invalid date: start_date ' + start_date + ' is after end_date ' + end_date)
    }

    if (this.latest_period_end_date) {
      var date_difference = calculate_day_count(this.latest_period_end_date, start_date, true)
      if (date_difference !== 1) {
        throw_unexpected_exception('Date difference is not one day as expected, latest_period_end_date: ' + this.latest_period_end_date + ' start_date: ' + start_date)
      }
    }

    var totalNumberOfDays = calculate_day_count(start_date, end_date)
    this.total_number_of_days += totalNumberOfDays

    if( this.debug_logging_enabled ) {
      this.debug_log_period_start(start_date, totalNumberOfDays, principal, rate)
    }

    if(this.rateHashMap.hasOwnProperty(date_to_integer(start_date))) {
      rate = this.rateHashMap[date_to_integer(start_date)]
      this.log_payment([start_date,
                        rate,
                        '-',
                        '-',
                        '-',
                        this.round(principal),
                        '-'])
    }

    if( this.debug_logging_enabled ) {
      this.debug_log("Interest rate: " + rate)
    }

    // lets check if interest rate changes during period
    rate_event = this.get_first_event_after_date('rate', start_date, end_date)

    if (rate_event) {
      var subperiod_start_date = start_date
      var rate_event_date = rate_event.date
      var current_rate = rate
      var number_of_days, factor, subperiod_interest

      while (rate_event) {
        // perf analysis:
        // this.rateEventIterations++
        // excluding the last day of the period, so that the rate event day shall be calculated with the new rate:
        number_of_days = calculate_day_count(subperiod_start_date, rate_event_date, true)
        this.g_p_i_total_days += number_of_days
        factor = number_of_days / this.day_count_divisor
        subperiod_interest = principal * (current_rate / 100) * factor
        if( this.debug_logging_enabled ) {
          this.debug_log_subperiod(number_of_days, subperiod_interest, rate_event.date, rate_event.rate )
        }
        sum_of_interests += subperiod_interest
        current_rate = rate_event.rate
        this.log_payment([rate_event.date,
                          rate_event.rate,
                          '-',
                          '-',
                          '-',
                          this.round(principal),
                          '-'])
        rate_event = this.get_first_event_after_date('rate', rate_event_date, end_date)
        subperiod_start_date = rate_event_date
        if (rate_event) {
          rate_event_date = rate_event.date
        }
      }

      // not excluding the last day of the period, so that the period end day interest will be included to the calculation:
      number_of_days = calculate_day_count(rate_event_date, end_date)
      this.g_p_i_total_days += number_of_days
      factor = number_of_days / this.day_count_divisor
      subperiod_interest = principal * (current_rate / 100) * factor
      if( this.debug_logging_enabled ) {
        this.debug_log_subperiod(number_of_days, subperiod_interest)
      }
      sum_of_interests += subperiod_interest
      this.current_rate = current_rate
    } else {
      number_of_days = calculate_day_count(start_date, end_date)
      this.g_p_i_total_days += number_of_days
      factor = number_of_days / this.day_count_divisor
      subperiod_interest = principal * (rate / 100) * factor
      if( this.debug_logging_enabled ) {
        this.debug_log("Period daily interest: ", subperiod_interest/number_of_days)
      }
      sum_of_interests += subperiod_interest
      this.current_rate = rate
    }

    if( this.debug_logging_enabled ) {
      this.debug_log("Period total interest: ", sum_of_interests)
    }
    this.g_p_i_sum_of_interests += sum_of_interests
    this.latest_period_end_date = end_date

    // these 4 are for performance analysis:
    //var timeEnd = Date.now()
    //var timeSpent = (timeEnd - timeBegin)
    //this.timeSpent += timeSpent
    //console.log(start_date + " - " + end_date + ": " + timeSpent)

    return sum_of_interests
  }

  // param property is a property of the seeked event
  this.get_first_event_after_date = function (property, date, boundary_date) {
    for (var index = 0; index < this.event_array.length; index++) {
      if (date_to_integer(this.event_array[index].date) > date_to_integer(date) && this.event_array[index].hasOwnProperty(property) && date_to_integer(this.event_array[index].date) <= date_to_integer(boundary_date) ) {
        return this.event_array[index]
      }
      if (date_to_integer(this.event_array[index].date) > date_to_integer(boundary_date)) {
        return false
      }
    }
    return false
  }

  // param property is a property of the seeked event
  this.check_if_date_has_event = function (property, date) {
    for (var index = 0; index < this.event_array.length; index++) {
      if (date_to_integer(this.event_array[index].date) === date_to_integer(date) ) {
        if( this.event_array[index].hasOwnProperty(property) ) {
        return this.event_array[index]
        } else {
          return false
        }
      }
    }
    return false
  }

  this.check_date = function (date, context) {
    if(!context) {
      context = ""
    }

    if(!date) {
      throw new Error('this.check_date: ' + context + ' date is missing')
    }

    if (typeof date !== 'string') {
      throw new Error('this.check_date: ' + context + ' date must be of type string: ' + date)
    }

    if(!check_date_validity(date)) {
      throw new Error('this.check_date: ' + context + ' date is invalid: ' + date)
    }
  }

  this.handle_last_payment = function (reduction, date, period_interest, fee = 0) {
    var installment
    // this.current_principal should be negative or zero here:
    reduction += this.current_principal

    installment = this.round(reduction + period_interest)

    this.sum_of_reductions += reduction
    this.log_payment([date,
                      this.current_rate,
                      installment,
                      this.round(reduction),
                      this.round(period_interest),
                      0,
                      this.round(fee)])
    this.current_principal = 0
    this.latest_payment_date = date
  }

  this.func_pay_installment = function (index, date_obj, installment, fee = 0) {
    var period_interest
    var reduction
    var start_date, end_date

    if (this.latest_calculated_interest_date === this.event_array[index].date) {
      // period interests have already been calculated
      period_interest = 0
    } else {
      // period interests have not been calculated yet
      start_date = date_obj.set_current(this.latest_calculated_interest_date).get_next()
      end_date = this.event_array[index].date
      period_interest = this.get_period_interests(this.current_principal, this.current_rate, start_date, end_date)
    }

    if (installment === 0) {
      // pay only interests
      reduction = 0
    } else {
      reduction = installment - period_interest
    }

    if (reduction < 0) {
      // installment is smaller than the interest
      throw new Error('Exception: installment ' + this.round(installment) + ' is too small to cover the interest ' + this.round(period_interest) + ': ' + start_date + ' - ' + end_date)
    }

    this.sum_of_interests += period_interest
    this.current_principal -= reduction
    this.latest_calculated_interest_date = this.event_array[index].date
    this.latest_payment_date = this.event_array[index].date

    if (this.current_principal <= 0) {
      this.handle_last_payment(reduction, this.event_array[index].date, period_interest, fee)
      return false
    }

    this.sum_of_reductions += reduction

    this.log_payment([this.event_array[index].date,
                      this.current_rate,
                      this.round(reduction + period_interest),
                      this.round(reduction),
                      this.round(period_interest),
                      this.round(this.current_principal),
                      this.round(fee)])
    return true
  }

  this.func_pay_reduction = function (index, date_obj, reduction, fee = 0) {
    var period_interest

    if (this.latest_calculated_interest_date === this.event_array[index].date) {
      // period interests have already been calculated
      period_interest = 0
    } else {
      // period interests have not been calculated yet
      period_interest = this.get_period_interests(this.current_principal, this.current_rate, date_obj.set_current(this.latest_calculated_interest_date).get_next(), this.event_array[index].date)
    }

    this.sum_of_interests += period_interest
    this.current_principal -= reduction
    this.latest_calculated_interest_date = this.event_array[index].date
    this.latest_payment_date = this.event_array[index].date

    if (this.current_principal <= 0) {
      this.handle_last_payment(reduction, this.event_array[index].date, period_interest, fee)
      return false
    }

    this.sum_of_reductions += reduction

    this.log_payment([this.event_array[index].date,
                      this.current_rate,
                      this.round(reduction + period_interest),
                      this.round(reduction),
                      this.round(period_interest),
                      this.round(this.current_principal),
                      this.round(fee)])
    return true
  }

  this.calculate_to_date = function (array_of_events, array_of_debug_prints) {
    var index
    var reduction, installment
    var final_interest = 0

    if (typeof this.init.principal !== 'number' || isNaN(this.init.principal)) { throw new Error('this.calculate_to_date: principal must be number') }
    if (this.init.principal === 0) { throw new Error('this.calculate_to_date: principal is missing') }
    if (typeof this.init.rate !== 'number' || isNaN(this.init.rate)) { throw new Error('this.calculate_to_date: rate must be number') }

    // array_of_events is an output parameter
    if (Array.isArray(array_of_events)) {
      this.payment_logging_enabled = true
    } else {
      this.payment_logging_enabled = false
    }

    // array_of_debug_prints is an output parameter
    if (Array.isArray(array_of_debug_prints)) {
      this.debug_print_to_console = false
    } else {
      this.debug_print_to_console = true
    }

    this.sum_of_interests = 0
    this.sum_of_reductions = 0
    this.g_p_i_sum_of_interests = 0

    var date_obj = new _Days()

    this.check_date(this.init.start_date, "start")
    this.check_date(this.init.end_date, "end")

    if (this.current_recurring_payment !== null) {   // null indicates that recurring data is missing or invalid
      this.check_first_payment_date()
      this.generate_payment_events_till(this.init.end_date)
    }

    this.add_event({ date: this.init.end_date, ending: true })

    this.merge_events()

    this.check_events()

    if (this.init.day_count_method === 'act/360') {
      this.day_count_divisor = 360
    } else if (this.init.day_count_method === 'act/365') {
      this.day_count_divisor = 365
    } else {
      throw new Error('invalid day count method: ' + this.init.day_count_method)
    }

    // rewind start date by one so that the interest gets calculated from the very beginning:
    this.latest_calculated_interest_date = date_obj.set_current(this.init.start_date).get_prev()
    this.latest_period_end_date = this.latest_calculated_interest_date
    this.total_number_of_days = 0
    this.g_p_i_total_days = 0

    // first line contains only the interest rate, principal and initial fee:
    this.log_payment([this.init.start_date,
                      this.init.rate,
                      '-',
                      '-',
                      '-',
                      this.init.principal,
                      this.initial_fee])

    this.current_principal = this.init.principal
    this.current_rate = this.init.rate
    this.sum_of_fees = this.initial_fee

    for (index = 0; index < this.event_array.length; index++) {
      // perf analysis:
      // this.mainLoopIterations++
      if (this.event_array[index].hasOwnProperty('recurring_amount')) {
        // recurring payment amount changes
        if(this.current_recurring_payment === null) { throw new Error('Can\'t do recurring_amount: initial recurring data missing or invalid!') }
        this.current_recurring_payment = this.event_array[index].recurring_amount
      }

      if (this.event_array[index].hasOwnProperty('recurring_fee_amount')) {
        // recurring payment amount changes
        if(this.current_recurring_payment === null) { throw new Error('Can\'t do recurring_fee_amount: initial recurring data missing or invalid!') }
        this.current_recurring_fee = this.event_array[index].recurring_fee_amount
      }

      if (this.event_array[index].hasOwnProperty('pay_single_fee')) {
        this.sum_of_fees += this.event_array[index].pay_single_fee
        this.current_single_fee = this.event_array[index].pay_single_fee
      } else {
        this.current_single_fee = 0
      }

      if (this.event_array[index].hasOwnProperty('payment_method')) {
        if(this.event_array[index].payment_method === 'equal_installment') {
          this.init.payment_method = 'equal_installment'
        } else if(this.event_array[index].payment_method === 'equal_reduction') {
          this.init.payment_method = 'equal_reduction'
        } else {
          throw new Error('invalid payment method in event: ' + this.event_array[index].payment_method)
        }
      }

      if (this.event_array[index].hasOwnProperty('pay_recurring')) {
        if(this.current_recurring_payment === null) { throw new Error('Can\'t do pay_recurring: initial recurring data missing or invalid!') }
        this.sum_of_fees += this.current_recurring_fee
        // recurring payment transaction occurs
        if (this.init.payment_method === 'equal_installment') {
          if (!this.func_pay_installment(index, date_obj, this.current_recurring_payment, this.current_recurring_fee)) {
            break
          }
        } else if (this.init.payment_method === 'equal_reduction') {
          if (!this.func_pay_reduction(index, date_obj, this.current_recurring_payment, this.current_recurring_fee)) {
            break
          }
        } else {
          throw new Error('invalid payment method: ' + this.init.payment_method)
        }
      }

      if ( this.event_array[index].hasOwnProperty('pay_reduction') && this.event_array[index].hasOwnProperty('pay_installment') ) {
        throw new Error('main loop error: event can not have more than one single payment on ' + this.event_array[index].date)
      }

      if (this.event_array[index].hasOwnProperty('pay_reduction')) {
        reduction = this.event_array[index].pay_reduction

        if (!this.func_pay_reduction(index, date_obj, reduction, this.current_single_fee)) {
          break
        }
      } else if (this.event_array[index].hasOwnProperty('pay_installment')) {
        installment = this.event_array[index].pay_installment

        if (!this.func_pay_installment(index, date_obj, installment, this.current_single_fee)) {
          break
        }
      } else if ( this.current_single_fee ) {
        if(!this.event_array[index].hasOwnProperty('ending')) {
          this.log_payment([this.event_array[index].date,
                            this.current_rate,
                            '-',
                            '-',
                            '-',
                            this.round(this.current_principal),
                            this.round(this.current_single_fee)])
          this.current_single_fee = 0
        }
      }

      if (this.event_array[index].hasOwnProperty('ending')) {

        if (!this.event_array[index].hasOwnProperty('pay_reduction') &&
            !this.event_array[index].hasOwnProperty('pay_recurring') &&
            !this.event_array[index].hasOwnProperty('pay_installment')) {
              final_interest = this.get_period_interests(this.current_principal, this.current_rate, date_obj.set_current(this.latest_calculated_interest_date).get_next(), this.event_array[index].date)
              this.sum_of_interests += final_interest
              this.log_payment([this.event_array[index].date,
                                this.current_rate,
                                '-',
                                '-',
                                this.round(final_interest),
                                this.round(this.current_principal),
                                this.round(this.current_single_fee)])
              this.latest_calculated_interest_date = this.init.end_date
            } else {
              this.latest_calculated_interest_date = this.latest_payment_date
            }

        break
      }
    }

    if (this.round(this.g_p_i_sum_of_interests) !== this.round(this.sum_of_interests)) {
      throw_unexpected_exception('Sum of interests mismatch: ' + this.round(this.g_p_i_sum_of_interests) + ' vs. ' + this.round(this.sum_of_interests))
    }

    if (this.g_p_i_total_days !== this.total_number_of_days) {
      throw_unexpected_exception('Day count mismatch, this.g_p_i_total_days: ' + this.g_p_i_total_days + ' this.total_number_of_days: ' + this.total_number_of_days)
    }

    if (this.payment_logging_enabled) {
      for (let i = 0; i < this.payment_log_array.length; i++) {
        array_of_events.push(this.payment_log_array[i])
      }
    }

    if (this.debug_logging_enabled && !this.debug_print_to_console) {
      for (let i = 0; i < this.debug_log_array.length; i++) {
        array_of_debug_prints.push(this.debug_log_array[i])
      }
    }

    // these 4 are for performance analysis:
    //console.log("this.timeSpent: " + this.timeSpent)
    //console.log("this.callCount: " + this.callCount)
    //console.log("this.rateEventIterations: " + this.rateEventIterations)
    //console.log("this.mainLoopIterations: " + this.mainLoopIterations)

    return [this.sum_of_interests,
            this.sum_of_reductions,
            this.current_principal,
            this.latest_calculated_interest_date,
            this.latest_payment_date,
            final_interest,
            this.sum_of_fees]
  }

  this.set_init = function (data) {

    if( !(typeof data === 'object' && data !== null) ) {
      throw new Error('this.set_init: invalid or missing init_obj')
    }

    this.init.start_date = data.start_date
    this.init.end_date = data.end_date
    this.init.principal = data.principal
    this.init.rate = data.rate

    if (data.hasOwnProperty('day_count_method')) {
      this.init.day_count_method = data.day_count_method
    } else {
      this.init.day_count_method = 'act/360'
    }

    if (data.hasOwnProperty('recurring')) {
      if( !data.recurring.hasOwnProperty('amount') || !number_is_valid(data.recurring.amount) ) {
        throw new Error('this.set_init: invalid or missing recurring amount')
      }
      this.current_recurring_payment = data.recurring.amount

      if( !data.recurring.hasOwnProperty('first_payment_date') ) {
        throw new Error('this.set_init: missing first recurring payment date')
      }
      this.init.first_payment_date = data.recurring.first_payment_date

      if( !data.recurring.hasOwnProperty('payment_day') || !number_is_valid(data.recurring.payment_day) || data.recurring.payment_day < 1 || data.recurring.payment_day > 31 || !Number.isInteger(data.recurring.payment_day) ) {
        throw new Error('this.set_init: invalid or missing first payment_day number')
      }
      this.init.payment_day = data.recurring.payment_day

      if (data.recurring.hasOwnProperty('payment_method')) {
        this.init.payment_method = data.recurring.payment_method
      } else {
        this.init.payment_method = 'equal_installment'
        }
      if( data.recurring.hasOwnProperty('payment_fee') ) {
        if ( !number_is_valid(data.recurring.payment_fee) ) {
        throw new Error('this.set_init: invalid recurring payment_fee')
        }
        this.current_recurring_fee = data.recurring.payment_fee
      }
      if( data.recurring.hasOwnProperty('payment_period') ) {
        if ( !number_is_valid(data.recurring.payment_period) || data.recurring.payment_period > 12 || !Number.isInteger(data.recurring.payment_period) ) {
        throw new Error('this.set_init: invalid recurring payment_period')
        }
        this.recurring_payment_period = data.recurring.payment_period
      }
    } else {
      this.current_recurring_payment = null  // null indicates that recurring data is missing or invalid
    }

    if (data.hasOwnProperty('round_values')) {
      this.round_values = data.round_values
    } else {
      this.round_values = true
    }

    if (data.hasOwnProperty('debug_logging')) {
      this.debug_logging_enabled = data.debug_logging
    } else {
      this.debug_logging_enabled = false
    }

    if (data.hasOwnProperty('initial_fee')) {
      if( !number_is_valid(data.initial_fee) ) {
        throw new Error('this.set_init: invalid initial fee')
      }
      this.initial_fee = data.initial_fee
    } else {
      this.initial_fee = 0
    }

  }

  this.check_and_add_event = function (event) {
    if (!event.hasOwnProperty('date')) {
      throw new Error('this.add_event: date missing from event')
    }

    this.check_date(event.date,"event")

    if (event.hasOwnProperty('rate')) {
      if( isNaN(event.rate) || typeof event.rate !== 'number' ) {
        throw new Error('this.check_and_add_event: invalid rate in event ' + event.date)
      }
    }

    if (event.hasOwnProperty('recurring_amount')) {
      if( !number_is_valid(event.recurring_amount) ) {
        throw new Error('this.check_and_add_event: invalid recurring_amount in event ' + event.date)
      }
    }

    if (event.hasOwnProperty('pay_installment')) {
      if(typeof event.pay_installment !== 'number' || event.pay_installment <= 0 || isNaN(event.pay_installment) ) {
        throw new Error('this.check_and_add_event: invalid pay_installment in event ' + event.date)
      }
    }

    if (event.hasOwnProperty('pay_reduction')) {
      if(typeof event.pay_reduction !== 'number' || event.pay_reduction <= 0 || isNaN(event.pay_reduction)) {
        throw new Error('this.check_and_add_event: invalid pay_reduction in event ' + event.date)
      }
    }

    if (event.hasOwnProperty('recurring_fee_amount')) {
      if( !number_is_valid(event.recurring_fee_amount) ) {
        throw new Error('this.check_and_add_event: invalid recurring_fee_amount in event ' + event.date)
      }
    }

    if (event.hasOwnProperty('pay_single_fee')) {
      if( !number_is_valid(event.pay_single_fee) ) {
        throw new Error('this.check_and_add_event: invalid pay_single_fee in event ' + event.date)
      }
    }

    this.event_array.push(Object.assign({}, event))
  }

  this.add_event = function (event) {
    if (!event.hasOwnProperty('date')) {
      throw new Error('this.add_event: date missing from event')
    }

    this.event_array.push(Object.assign({}, event))
  }

  // combine all events with a same date to a single event
  this.merge_events = function () {
    this.event_array.sort(event_array_sorter)

    for (var index = 0; index < this.event_array.length - 1; index++) {
      if(this.event_array[index].hasOwnProperty('rate')) {
        this.rateHashMap[date_to_integer(this.event_array[index].date)] = this.event_array[index].rate
      }

      if (date_to_integer(this.event_array[index].date) === date_to_integer(this.event_array[index + 1].date)) {
        // todo: here it should be checked that date property is the only common thing that the events to be merged share
        Object.assign(this.event_array[index], this.event_array[index + 1])
        this.event_array.splice(index + 1, 1)
        index = index - 1
      }
    }
  }

  this.check_first_payment_date = function () {

    this.check_date(this.init.first_payment_date,"1st recurring payment")
    if( date_to_integer(this.init.first_payment_date) <= date_to_integer(this.init.start_date) ) {
      throw new Error('this.check_first_payment_date: first payment date must be after start date')
    }

  }

  this.generate_payment_events_till = function (date) {

    var date_obj = new _Days(this.init.first_payment_date)
    var event = { date: date_obj.get_current(), pay_recurring: true }

    this.add_event(event)

    while (date_to_integer(date_obj.get_nth_month_nth_day(this.recurring_payment_period,this.init.payment_day)) <= date_to_integer(date)) {
      event = { date: date_obj.get_current(), pay_recurring: true }
      this.add_event(event)
    }
  }

  this.check_events = function () {
    for (var index = 0; index < this.event_array.length - 1; index++) {
      if (date_to_integer(this.event_array[index].date) <= date_to_integer(this.init.start_date)) {
        throw new Error('this.check_events: event date (' + this.event_array[index].date + ') before start date not allowed')
      }
    }
  }

  this.debug_log_period_start = function (start_date, totalNumberOfDays, principal, rate) {
    this.debug_write("New period starts " + start_date)
    this.debug_write("Days in period: " + totalNumberOfDays)
    this.debug_write("Remaining principal: " + this.round(principal))
  }

  this.debug_log_subperiod = function (number_of_days, subperiod_interest, rate_event_date, new_rate ) {
    this.debug_write("Subperiod days: " + number_of_days)
    this.debug_write("Subperiod daily interest: " + this.round(subperiod_interest/number_of_days))
    this.debug_write("Subperiod total interest: " + this.round(subperiod_interest))
    if(rate_event_date) {
      this.debug_write("Rate changes " + rate_event_date + ", new rate is " + new_rate )
    }
  }

  this.debug_log = function (string, number) {
    if(!is_numeric(number)) {
      this.debug_write(string)
    } else {
    this.debug_write(string, this.round(number))
    }
  }

  this.debug_write = function (string, number = "") {
    if(this.debug_print_to_console) {
      console.log(string, number)
    } else {
      this.debug_log_array.push(string + number)
    }
  }
}

function _Days (init_date) {
  if (init_date) {
    this.date = init_date
    this.split_table = this.date.split('.')
    this.day = Number(this.split_table[0])
    this.month = Number(this.split_table[1])
    this.year = Number(this.split_table[2])
  }

  this.get_current = function () {
    return zero_fill(this.day) + '.' + zero_fill(this.month) + '.' + this.year
  }

  this.set_current = function (current) {
    this.split_table = current.split('.')
    this.day = Number(this.split_table[0])
    this.month = Number(this.split_table[1])
    this.year = Number(this.split_table[2])

    return this
  }

  this.get_next = function () {
    var date = new Date(this.year, this.month - 1, this.day)
    date.setDate(date.getDate() + 1)

    this.day = String(date.getDate())
    this.month = String(date.getMonth() + 1)
    this.year = String(date.getFullYear())

    return zero_fill(this.day) + '.' + zero_fill(this.month) + '.' + this.year
  }

  this.get_prev = function () {
    var date = new Date(this.year, this.month - 1, this.day)
    date.setDate(date.getDate() - 1)

    this.day = String(date.getDate())
    this.month = String(date.getMonth() + 1)
    this.year = String(date.getFullYear())

    return zero_fill(this.day) + '.' + zero_fill(this.month) + '.' + this.year
  }

  this.get_nth_month_nth_day = function (period_in_months, day_number) {
    if (period_in_months === 1 && (day_number === 31 || (this.month === 1 && day_number > 28 ))) {
      return this.get_next_month_last_day()
    }

    var next_month = this.month + period_in_months
    var year = this.year

    if (next_month > 12) {
      next_month = next_month - 12
      ++year
    }

    this.day = day_number === 31 ? days_in_month(next_month, year) : day_number
    this.month = next_month
    this.year = year

    return zero_fill(day_number) + '.' + zero_fill(next_month) + '.' + year
  }

  this.get_next_month_last_day = function () {
    var next_month = this.month
    var year = this.year

    if (next_month === 12) {
      next_month = 1
      ++year
    } else {
      ++next_month
    }

    var last_day = days_in_month(next_month, year)

    this.day = last_day
    this.month = next_month
    this.year = year

    return last_day + '.' + zero_fill(this.month) + '.' + this.year
  }
}

function throw_unexpected_exception (string) {
  throw new Error('Unexpected exception: ' + string)
}

function event_array_sorter (a, b) {
  if (date_to_integer(a.date) > date_to_integer(b.date)) { return 1 }
  if (date_to_integer(a.date) < date_to_integer(b.date)) { return -1 }
  return 0
}

function date_to_integer (date) {
  var day = split_date(date)[0]
  var month = split_date(date)[1]
  var year = split_date(date)[2]

  day = zero_fill(Number(day))
  month = zero_fill(Number(month))

  return Number(year + month + day)
}

function zero_fill_date (date) {
  if (typeof date !== 'string') { throw new Error('zero_fill_date illegal parameter type') }

  if(!date) {
    return "N/A"
  }

  var day = split_date(date)[0]
  var month = split_date(date)[1]
  var year = split_date(date)[2]

  day = zero_fill(Number(day))
  month = zero_fill(Number(month))

  return day + '.' + month + '.' + year
}

// parameter i must be of type number
function zero_fill (i) {
  return (i < 10 ? '0' : '') + i
}

function split_date (date) {
  var splitted = date.split('.')
  return [splitted[0], splitted[1], splitted[2]]
}

function calculate_day_count (first_date, second_date, exclude_last_day) {
  var last_day

  if (exclude_last_day) {
    last_day = 0
  } else {
    last_day = 1
  }

  var first_date_array = first_date.split('.')
  var second_date_array = second_date.split('.')

  var date_1 = new Date(Number(first_date_array[2]), Number(first_date_array[1]) - 1, Number(first_date_array[0]))
  var date_2 = new Date(Number(second_date_array[2]), Number(second_date_array[1] - 1), Number(second_date_array[0]))

  // must round here because of daylight saving time changes:
  return Math.round((date_2 - date_1) / (1000 * 60 * 60 * 24)) + last_day
}

// checks if string n is numeric
function is_numeric (n) {
  return !isNaN(parseFloat(n)) && isFinite(n)
}

function is_it_leap_year (year) {
  return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0)
}

function days_in_month (month, year) {
  if (month === 1 || month === 3 || month === 5 || month === 7 || month === 8 || month === 10 || month === 12) {
    return 31
  } else if (month === 4 || month === 6 || month === 9 || month === 11) {
    return 30
  } else if (month === 2 && is_it_leap_year(year)) {
    return 29
  } else if (month === 2 && !(is_it_leap_year(year))) {
    return 28
  } else {
    throw_unexpected_exception('days_in_month')
  }
}

function func_round(input) {
  input = Math.round(input * 100) / 100
  return input
}

function check_date_validity(date) {
  var result = date.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)

  if(!result) {
    return false
  }

  var day = Number(result[1])
  var month = Number(result[2])
  var year = Number(result[3])

  if(month < 1 || month > 12 ) {
    return false
  }

  var last_day_of_month = days_in_month(month,year)

  if(day < 1 || day > last_day_of_month) {
    return false
  }

  return true
}

function number_is_valid( n ) {
  if(isNaN(n) || typeof n !== 'number' || n < 0) {
    return false
  }
  return true
}

