# module NetWorkingCapital & taskLock UNIT__NWC__DAILY_ACTIVITY (NWC, CCN)

Moduli che scaricano i crediti/debiti commerciali a fine giornata appena si manifestano, o ne impostano il valore perché sia sempre una certa soglia (in relazione ai ricavi/costi, ad esempio).

Sono una categoria di crediti/debiti/magazzino, identificata con nomi specifici: "floating credits", "floating debts", "floating inventories" (definiti in una tabella del modulo; se missing prende da Simulation Setting)

Il modulo se trova questi nomi li elabora considerandoli legati al valore di ricavi/crediti, acquisti+servizi/debiti, ricavi/magazzino.

Ogni giorno si leggono i costi e ricavi del giorno, creano un anno modello con n/365|366 giorni e un pezzo del nuovo e un pezzo del vecchio, e determinano quanti crediti e debiti e magazzino sono giusti muovendoli di conseguenza.
Se l'anno bisestile è quello del bilancio chiuso è irrilevante, la proporzione di crediti/magazzino/debiti è sempre crediti/ricavi, che sia su 365 o 366 giorni.
Il modello è rolling, nel senso che ogni giorno si perde un pezzo del precedente e si prende un pezzo del nuovo anno.
Se tra data inizio e data fine è presente un anno bisestile la base è 366 giorni, che scorrendo diventa 365 appena ci si lascia alle spalle febbraio.

/////

NWC ogni giorno scarica crediti e debiti commerciali alive con scadenza:
* scarica crediti e debiti commerciali alive da Ledger chiamando `getAliveBsSimObjectsWithPrincipalToPay()`
* le scadenze dell'array dei SO e scarica quelli con scadenza <= today.
