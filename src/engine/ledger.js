// TODO
/*
Ledger: private map to store SO

Store by id, last version

method addTrn(array) // validate elements
 */

// TODO later
/*
Js Ledger, metodi

newTrn()
start a new transaction

squareTrn(): input SimObjectType/SimObjectName or SimObjectId (es per cash o ammortamenti); aggiunge una scrittura di importo giusto per quadrare il resto; restituisce l’oggetto creato, con amount in formato Big

commitTrn(): conclude la transazione; errore se non quadra

extinguishSimObject(): accetta un id, crea una scrittura con importo residuo di un SimObject; restituisce l’oggetto creato, con amount in formato Big. name from [1] https://www.iasplus.com/en/standards/ifric/ifric19
 */

// SimObjects storage and edits, #queue
/*
Don't provide a queue of future movements, because a SimObject can be changed by other modules.

Store, as a property of the SimObject, an object with custom properties, as the payment plans, the interest, etc.
 */
