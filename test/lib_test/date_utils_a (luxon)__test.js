import {
  differenceInCalendarDays_test1,
  differenceInCalendarDays_test2,
  differenceInCalendarDays_test3
} from './date_utils_a (lib)__test.js';
import { differenceInCalendarDays_luxon } from './date_utils_a__differenceInCalendarDays_luxon.js';

differenceInCalendarDays_test1(differenceInCalendarDays_luxon);
differenceInCalendarDays_test2(differenceInCalendarDays_luxon);
differenceInCalendarDays_test3(differenceInCalendarDays_luxon);
