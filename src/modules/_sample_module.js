// .

// Error management
/*
#error #fatal error #throw
Every module that wants to interrupt program execution for a fatal error throws a new Error;
this error is intercepted here, and will be recorded a 'debug_error' SimObject, then the execution ends with an error.
*/
