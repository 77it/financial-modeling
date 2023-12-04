# module NetWorkingCapital & taskLock SIMULATION__NWC__DAILY_ACTIVITY / UNIT__NWC__DAILY_ACTIVITY (NWC, CCN)

## SIMULATION__NWC__DAILY_ACTIVITY

_Funziona solo nei giorni di simulazione, non nei giorni historical._

Modulo di Simulation, ogni giorno scarica crediti e debiti commerciali alive con scadenza:
* scarica crediti e debiti alive da Ledger chiamando `getAliveBsSimObjectsWithExpiredPrincipalToPay()`
* scarica gli SO per le scadenze maturate (che hanno un piano di ammortamento scaduto a fine giornata);
  se il saldo residuo = 0, setta alive = false
* definisce su /config/nwc la lista dei tipi di accounting da scaricare

Scarica anche i SimObject intercompany collegati:
* quando processa lo scarico di un SimObject e trova che questo è collegato a un altro con `vsSimObjectName`
  scarica automaticamente anche l'altro SimObject // see >vsSimObjectName_note_20231111

Viene caricato automaticamente da Engine se il lock non è definito.


## UNIT__NWC__DAILY_ACTIVITY

_Funziona solo nei giorni di simulazione, non nei giorni historical._

SETTINGS:
* excluded descriptions: può essere ripetuto più volte; contiene la descrizione della voce contabile il cui movimento viene escluso dal calcolo del livello automatico NWC. Utile per escludere voci che hanno movimenti straordinari, es "5.1.10 debiti verso direttore tecnico" (che ammonta a 4 mln, e ha un movimento extra ordinario)

Attivo solo se impostato all'interno dell'input utente (non viene caricato automaticamente da Engine se il lock non è definito).

Lavora su BS_CREDIT__TRADERECEIVABLECREDITS, BS_LIABILITY__TRADEPAYABLEDEBTS, BS_GOOD__INVENTORIES__*.

Monitora queste voci e crea una voce nuova, gestita solo da questo Lock, che compensa il valore totale assunto dalle voci contabili monitorate.

A fine giornata, ogni giorno, li tiene a un certo livello, alternativamente:
1) crediti una % di IS_INCOME__SALEREVENUE, debiti una % di IS_EXPENSE__PURCHASEEXPENSE__GOODS + IS_EXPENSE__PURCHASEEXPENSE__LEASEANDRENTING + IS_EXPENSE__PURCHASEEXPENSE__SERVICES, magazzino una % di IS_INCOME__SALEREVENUE. La % è secca, direttamente indicata, e può cambiare di anno in anno.
2) La % di base è determinata a partire dal rapporto crediti/ricavi ecc dell'ultimo anno storico concluso (chiamato anno 0): per ogni anno di simulazione si indicano i punti di variazione della % dell'anno precedente; quindi se l'anno 1 di simulazione riporta -10 si intende che la percentuale di crediti su ricavi è del -10% meno di quella rilevata all'anno zero: se era 40%, diventa 36% (40% * 0,9); se l'anno 2 riporta -5, si intende 34,2% (36% * 0,95).
3) legato a un importo secco massimo che può cambiare anno per anno.

Logica delle ipotesi 1) e 2)

    Ogni giorno si leggono i costi e ricavi del giorno.
    Nel periodo historical, giorno per giorno si sommano le voci contabili oggetto di monitoraggio IS_INCOME__SALEREVENUE ecc, allo scopo di avere il loro totale nell'ultimo anno fiscale storico. Questo serve per determinare la percentuale di base da usare nello scenario #2.
    Nel periodo di simulazione, se se l'anno è di 365 giorni si toglie 1/365 dei crediti e debiti rilevati alla fine del periodo precedente, e si aggiunge la % del giorno; se l'anno fiscale è di 366 giorni si sostituisce 1/366. Quindi, nel calcolo, sono irrilevanti i costi e i ricavi dell'anno precedente. Se un giorno non ci sono stati costi e ricavi si scarica semplicemente 1/365 di crediti, debiti e magazzino e fine.

Logica delle ipotesi 3)

    In questo caso l'algoritmo è semplice, in quanto a fine giornata somma le voci contabili del tipo [A] e crea uno specifica voce del tipo [A] di segno + o - sufficiente a raggiungere l'importo voluto.
