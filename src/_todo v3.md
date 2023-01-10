# TODO

main-treasury-temp.js
    * deserializza `modulesData` input
    * chiama engine.js passando modulesData[]

engine.js
    inizializza `simulation context` che contiene:
    * `Ledger`
    inizializza `moduleRunner` passando `simulation context`

moduleRunner
    inizializza al suo interno
    * Drivers
    * Contants
    chiama giorno per giorno i moduli

i moduli
    * alla prima chiamata elaborano la tabella di input
    * ogni giorno: elaborano i nuovi `SimObjects`
    * ogni giorno: interrogano i vecchi `SimObjects` su Ledger per vedere se è giunto il tempo di scaricarli

    MODULE modules/new_credits_and_debits.js
    per dividere crediti e debiti con piani di ammortamento preesistenti, poiché non tutti i piani nascono il 31.12.XXXX (o il 1/1/XXXX+1), dobbiamo rigenerare le date del piano dall'inizio, e ripartire con il calcolo della rata dalla data precedente a quella in cui comincia la dilazione del debito, per vedere la prossima rata quando sarà.
    Esempio:
    debito al 31/12/2022: 90.000 euro; inizio piano 15/11/2020, rata semestrale. Si rigenerano le date, si vede che la rata successiva al 31/12/2022 è il 15/05/2023, si genera il piano da quella data per la durata residua.

Ledger
    * accetta transazioni
    * salva i `SimObjects`
    * fa un dump dei `SimObjects` dopo ogni transazione












<vault>
#ledger   see ledger.js
</vault>


<modulesRunner.js>

# Attività giornaliere  #ticktock #daily #activities #sequence

Sequenza delle attività di ModuleRunner:
* before starting the Simulation, without being able to change the accounting (Ledger is still "closed"):
    1) call all modules methods `oneTimeBeforeTheSimulationStarts`
       * to set the #constants
       * to set the #drivers
    2) freeze Drivers and Locks repository
* giornalmente, chiamate ai moduli in ordine di scrittura su Excel:
    * setta il driver $.TODAY con la data corrente (JS Date object)  #$_TODAY_driver
    * modules method call `beforeDailyModeling` // ledger is closed here; do some actions useful for the next day, computing >ebitda_const_id for example
    * open Ledger
    * modules method call `dailyModeling`
    * special constants calling, at the end of the day; ledger is still open here
        vanno chiamati in questo ordine logico (prima le tasse, poi i giri di cassa, poi il calcolo degli oneri finanziari)
		* $.TaxManager
		* $.CashManager
		* $.Treasury
		* etc
    * close ledger for the day
* after ending the Simulation, without being able to change the accounting (Ledger is definitely "closed"):
    * modules method call `oneTimeAfterTheSimulationEnds`

</modulerunner>


<_sampleModule.js>

# modules methods

Standard module methods:
* oneTimeBeforeTheSimulationStarts({listOfTables: any[], driversSet, constantsSet}): void;
* beforeDailyModeling({driversGet, constantsGet}): void;
* dailyModeling({driversGet, constantsGet}): void;
* oneTimeAfterTheSimulationEnds({driversGet, constantsGet}): void;

</_sampleModule.js>


<constants definition (#constants, #globals, #variables, #locks)>
if needed see implementation of js lock  https://www.talkinghightech.com/en/initializing-js-lock/, but being immutable probably isn't needed...
Constants are immutable: when defined/set can't be redefined.

method constantsGet({namespace: optional string, name:string})
global/simulation namespace is "$$"; namespace can be null, undefined or "" meaning $$

method constantsSet({namespace: optional string, name: string, value: any})
global/simulation namespace is "$$"; namespace can be null, undefined or "" meaning $$

</constants definition (#constants, #globals, #variables, #locks)>


<#modules and #constants>

# constants usage

Non tutte le constants vengono chiamate da modulesRunner:
* alcune come EBITDA servono per offrire delle funzionalità a chi li chiama
* altre servono dal callback per funzioni speciali (Tax, Treasury, ecc)
* altre ancora possono essere usate solo come traccia di qualche funzionalità che non deve essere portata avanti da altri (un modulo che vuole offrire una funzionalità cerca di aprire una const; se è già aperta va in errore e non fa quella azione che avrebbe voluto fare - eventualmente loggando un warning)


# CCN module (nome provvisorio)

Moduli che scaricano i crediti/debiti commerciali a fine giornata appena si manifestano, o ne impostano il valore perché sia sempre una certa soglia (in relazione ai ricavi/costi, ad esempio).


# RATE_EURIBOR constant

Is a list of {Date, rate}, with the sequence of Euribor in the entire simulation range.


# EBITDA module #EBITDA #constant
#ebitda_const_id

Registra const di simulazione `$.EBITDA` che registra una funzione che restituisce l'EBITDA della Unit dell'anno fiscale (setting di Unit $.END_OF_THE_FISCAL_YEAR__MONTH o altro setting da esso derivato)

Durante `beforeDailyModeling` calcola l'EBITDA interrogando ledger.

[2] >come_ledger_passa_i_dati_ai_moduli_per_settare_i_drivers_id su "_todo2 JS simulation.OLD TOMERGE.md"


# Treasury module

Registra const di simulazione `$.Treasury`

## movimenti di cassa di una certa Unit a fine giornata: chiusura delle partite di cassa aperte

I moduli muovono la cassa della Unit come vogliono, creando nuove voci del tipo `BS_BankAccount_FinancialAccount` con valore positivo o negativo.

A fine giornata, quando viene eseguito da ModuleRunner, Treasury interroga per ogni Unit le voci `BS_BankAccount_FinancialAccount` in stato `alive` e chiude quelle non gestiti da lei trasferendo il saldo sui "suoi" conti correnti [1].

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

Va eseguito prima di Treasury (in modo da consentire a Treasury il calcolo degli interessi suoi conti correnti


# tax manager module

Registra const di simulazione `$.TaxManager`

## tax manager settings

Taxes uses no Simulation/Unit settings but a table, because every tax manager can have its own different input needed from the user.

Table example:

    Unit name | Tax rate

</#modules and #constants>
