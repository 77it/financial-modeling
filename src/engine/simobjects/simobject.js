// this is the SimObject stored in Ledger

// TODO SimObject

// numbers and dates
/*
* numbers: stored with big.js http://mikemcl.github.io/big.js/
* store dates in SimObject as local dates, no UTC  // dates can have hour/minutes/seconds if needed, won't be stripped/normalized
*/

// properties
/*
number principalIndefinite

// serialization of the payment plan is done in the Ledger, converting `principalSchedule` to numbers
Date[] principalScheduleDate  // dates can also be before today, because we can have a payment plan not regular with payments (overdue, etc.)
number[] principalSchedule  // contains a list of numbers to split the payments until the end of the plan
*/

// # not exported properties
/*
* extras: property that contain a class or an object with all the extra properties specific to the SimObject
* vsSimObjectId: is of the versus SimObject  // this is the id of the SimObject that is the opposite of this one, e.g. a credit is the opposite of a debit
* versionId
* previousVersionId
* quantity
* unityOfMeasure
*/

