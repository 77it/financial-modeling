/*
TODO

Quando setta un driver, nella tabella Set dei drivers valorizza un flag che in caso di valore non definito per un certo giorno,
restituisce il valore precedente (es un driver di vendita non può valere per i giorni successivi
a quando la vendita viene effettuata mentre un prezzo si);
il flag si chiama "useOldValueForMissingDay" e di default è False.

Viene ottenuto ordinando le date da aggiungere e aggiungendo un valore zero da JS con una data successiva
dopo ogni data imposta dai drivers se la data successiva manca.
 */