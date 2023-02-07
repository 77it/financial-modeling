// TODO to implement

// IMPLEMENTATION NOTES
/*
# describe as JSON5 loan as start date, end date, tasso iniziale, tasso attuale + capitale residuo a fine periodo (es fine anno, 25 mln)

Calcola piano #1 con capitale 1.000.000 e precisione 4, tasso 1,5%
Calcola piano #2, es 25.000.000, tasso 2,3% impostando:
* Scadenze future con le rate dalla successiva alla data di bilancio alla fine
* Quota capitale nuove rate: capitale singola scadenza piano #1 / 1mln * 25mln
* Capitale residuo: ricalcolato rata per rata con la nuova quota capitale (capitale rata precedente - capitale calcolato al punto precedente)
* Interessi nuove rate: interessi singola scadenza piano #1 / 1,5 * 2,3 / capitale residuo #1 * capitale residuo #2

Useful because the plan don’t start at 31.12.XXXX but we have to regenerate a plan to split the dates
 */
export class Module {
}
