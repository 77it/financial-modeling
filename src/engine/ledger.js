// TODO
/*
Ledger: private map to store SO

Store SimObjects by id, last version

method addTrn(array) // validate elements
 */

// dates: store dates in Ledger as local dates, no UTC

// TODO later
/*
Js Ledger, metodi

newTrn()
start a new transaction

squareTrn(): input SimObjectType/SimObjectName or SimObjectId (es per cash o ammortamenti); aggiunge una scrittura di importo giusto per quadrare il resto; restituisce l’oggetto creato, con amount in formato Big

commitTrn(): conclude la transazione; errore se non quadra

extinguishSO(): accetta un id, crea una scrittura con importo residuo di un SimObject; restituisce l’oggetto creato, con amount in formato Big. name from [1] https://www.iasplus.com/en/standards/ifric/ifric19

deltaSO(): accetta un id e un importo delta (eventualmente precisando principal schedule e indefinite, altrimenti tutto su indefinite), crea una scrittura con una variazione del SimObject del delta indicato; restituisce l’oggetto creato, con amount in formato Big.
 */

// SimObjects storage and edits, #queue
/*
Don't provide a queue of future movements, because a SimObject can be changed by other modules.

Store, as a property of the SimObject, an object with custom properties, as the payment plans, the interest, etc.
 */

// serialization of SimObjects
/*
serialization of the payment plan: convert `principalSchedule` to numbers, splitting amount (minus indefinite) to every date, also before today, because we can have a payment plan not regular with payments (overdue, etc.)

serialization of dates: convert to UTC only when dumping the SimObject to JSON (leaving hours/minutes/seconds: will be removed during report generation)
  sample code: const dateExportToJSON = new Date(Date.UTC(_d0.getFullYear(), _d0.getMonth(),_d0.getDate(), _d0.getHours(),_d0.getMinutes(), _d0.getSeconds(), _d0.getMilliseconds())).toJSON();
 */
