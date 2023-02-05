export { simObject_Serialize };
import { SimObject } from '../simobject.js';

// serialization
/*
# serialization of `principal`: convert it to string and dates
string principalIndefinite

string[] principalSchedule

Date[] principalScheduleDate  // dates can also be before today, because we can have a payment plan not regular with payments (overdue, etc.)


# serialization of dates
convert to UTC only when dumping the SimObject to JSON (leaving hours/minutes/seconds: will be removed during report generation)
  sample code: const dateExportToJSON = new Date(Date.UTC(_d0.getFullYear(), _d0.getMonth(),_d0.getDate(), _d0.getHours(),_d0.getMinutes(), _d0.getSeconds(), _d0.getMilliseconds())).toJSON();
*/

/**
 * Function to serialize a SimObject
 * @param {SimObject} simObject - The SimObject to serialize
 * @return {string} - The serialized SimObject
 */
function simObject_Serialize (simObject) {
  // TODO not implemented
  throw new Error('not implemented');
}
