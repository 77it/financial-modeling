<engine.js.js run_modules.js>

# Attività giornaliere  #ticktock #daily #activities #sequence

Sequenza delle attività di engine.js:
* before starting the Simulation, without being able to change the accounting (Ledger is still "closed"):
    1) call all modules methods `oneTimeBeforeTheSimulationStarts`
       * to set the #taskLocks
       * to set the #drivers
    2) freeze Drivers and Locks repository
* giornalmente, chiamate ai moduli in ordine di scrittura su Excel:
    * setta il driver $.TODAY con la data corrente (JS Date object)  #$_TODAY_driver
    * modules method call `beforeDailyModeling` // ledger is closed here; do some actions useful for the next day, computing >ebitda_const_id for example
    * open Ledger
    * modules method call `dailyModeling`
    * special taskLocks calling, at the end of the day; ledger is still open here
        vanno chiamati in questo ordine logico (prima le tasse, poi i giri di cassa, poi il calcolo degli oneri finanziari)
		* $.TaxManager
		* $.CashManager
		* $.Treasury
		* etc
    * close ledger for the day
* after ending the Simulation, without being able to change the accounting (Ledger is definitely "closed"):
    * modules method call `oneTimeAfterTheSimulationEnds`

</engine.js.js run_modules.js>


<#modules and #taskLocks>

Idea about modules
https://chandoo.org/wp/modular-spreadsheet-development-a-thought-revolution/
https://chandoo.org/wp/wp-content/uploads/2014/05/Modular-Spreadsheet-Development.pdf
sample Excel https://mail.google.com/mail/u/0/#inbox/FMfcgzGrbRZwxrzFJgstZDcTfjDhwbbX

# taskLocks usage

Non tutte le taskLocks vengono chiamate da modulesRunner:
* alcune come EBITDA servono per offrire delle funzionalità a chi li chiama
* altre servono dal callback per funzioni speciali (Tax, Treasury, ecc)
* altre ancora possono essere usate solo come traccia di qualche funzionalità che non deve essere portata avanti da altri (un modulo che vuole offrire una funzionalità cerca di aprire una const; se è già aperta va in errore e non fa quella azione che avrebbe voluto fare - eventualmente loggando un warning)


# NetWorkingCapital module (NWC, CCN)
  
Moduli che scaricano i crediti/debiti commerciali a fine giornata appena si manifestano, o ne impostano il valore perché sia sempre una certa soglia (in relazione ai ricavi/costi, ad esempio).

Sono una categoria di crediti/debiti/magazzino, identificata con nomi specifici: "floating credits", "floating debts", "floating inventories".

Il modulo se trova questi nomi li elabora considerandoli legati al valore di ricavi/crediti, acquisti+servizi/debiti, ricavi/magazzino.

Ogni giorno si leggono i costi e ricavi del giorno, creano un anno modello con n/365|366 giorni e un pezzo del nuovo e un pezzo del vecchio, e determinano quanti crediti e debiti e magazzino sono giusti muovendoli di conseguenza.
Se l'anno bisestile è quello del bilancio chiuso è irrilevante, la proporzione di crediti/magazzino/debiti è sempre crediti/ricavi, che sia su 365 o 366 giorni.
Il modello è rolling, nel senso che ogni giorno si perde un pezzo del precedente e si prende un pezzo del nuovo anno.
Se tra data inizio e data fine è presente un anno bisestile la base è 366 giorni, che scorrendo diventa 365 appena ci si lascia alle spalle febbraio.


# RATE_EURIBOR constant

Is a list of {Date, rate}, with the sequence of Euribor in the entire simulation range.


# EBITDA module #EBITDA #constant
#ebitda_const_id

Registra const di simulazione `$.EBITDA` che registra una funzione che restituisce l'EBITDA della Unit dell'anno fiscale (setting di Unit $.END_OF_THE_FISCAL_YEAR__MONTH o altro setting da esso derivato)

Durante `beforeDailyModeling` calcola l'EBITDA interrogando ledger.

[*] <2023-03-07>OLD INSPIRATION attualmente per settare drivers e locks/constants è semplice, si passano le funzioni ai moduli; per passare i dati di contabilità ai moduli che ne hanno bisogno per aggiornare EBITDA etc è sufficiente che interrogano i metodi di Ledger che restituiscono le voci movimentate ieri/oggi</2023-03-07> >come_ledger_passa_i_dati_ai_moduli_per_settare_i_drivers_id su "_todo2 JS simulation.OLD TOMERGE.md"


# Treasury module

Registra const di simulazione `$.Treasury`

## movimenti di cassa di una certa Unit a fine giornata: chiusura delle partite di cassa aperte

I moduli muovono la cassa della Unit come vogliono, creando nuove voci del tipo `BS_BankAccount_FinancialAccount` con valore positivo o negativo.

A fine giornata, quando viene eseguito da engine.js, Treasury interroga per ogni Unit le voci `BS_BankAccount_FinancialAccount` in stato `alive` e chiude quelle non gestiti da lei trasferendo il saldo sui "suoi" conti correnti [1].

Infine, calcola gli interessi >treasuryModule_interestComputation_id20200827

[1] i conti correnti di Treasury sono quelli accesi da Treasury stessa, di cui conosce il SimObjId, e che sono i conti di base delle Unit su cui si calcolano gli interessi (potrebbe bastare un solo conto per Unit). Se ne servono di più, modificare la logica del modulo di tesoreria.

## BS_BankAccount_FinancialAccount SimObjects

???dove di trovano??? see file "AccountingValidator.Unnecessary Checks.md" >NO_intercompany_checks_enabled_id20201024

???dove di trovano??? see notes >treasury_reports_id20201024

Ai fini del filtro dei movimenti intercompany, i SimObject della cassa possono avere qualsiasi Id, perché non c'è alcun controllo in fase di validazione che un SimObject sia sempre movimentato in un certo modo sull'infragruppo, perché si potrebbe associare intercompany a un movimento cash, che ovviamente non è sempre intercompany

## modulo tesoreria, calcolo interessi
#treasuryModule_interestComputation_id20200827

Il calcolo degli interessi si fa sul saldo dei vari conti correnti a fine giornata, e registrando il debito su tali conti.
Non è importante che il saldo della cassa su cui calcolare gli interessi sia stato rilevato prima del loro addebito, perché non avrebbe senso calcolare interessi su interessi nel giorno di calcolo degli stessi (quindi si calcolano, si addebitano, e fine).

Il modulo tesoreria, che calcola l'ammontare degli interessi passivi, deve avere un settaggio su UnitSettings (varia da Unit a Unit) sulla periodicità di calcolo e addebito degli interessi (giornaliero, mensile, bimestrale, trimestrale, quadrimestrale, semestrale, annuale).


# cash manager module (cash manager è un modulo differente da Tresury)

Registra const di simulazione `$.CashManager`

At EOD, transfer excess cash from Unit to Unit, following rules taken from some input tables.

Va eseguito prima di Treasury (in modo da consentire a Treasury il calcolo degli interessi suoi conti correnti)


# tax manager module

Registra const di simulazione `$.TaxManager`

## tax manager settings

Taxes uses no Simulation/Unit settings but a table, because every tax manager can have its own different input needed from the user.

Table example:

    Unit name | Tax rate

</#modules and #taskLocks>
