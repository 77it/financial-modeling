<engine.js.js run_modules.js>

# Attività giornaliere  #ticktock #daily #activities #sequence

Sequenza delle attività di engine.js:
* before starting the Simulation, without being able to change the accounting (Ledger is still "closed"):
  * call all modules methods `oneTimeBeforeTheSimulationStarts`
    * to set the #taskLocks
    * to set the #drivers
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


</#modules and #taskLocks>
