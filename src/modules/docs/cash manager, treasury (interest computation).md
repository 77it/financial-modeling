see https://docs.google.com/document/d/1II6fAbf7S_EybOsmlmXETNPRTzoQpA3o7h-x2TPTUeY/edit#heading=h.6eoikrhrb22r

# taskLock SIMULATION__INTERCOMPANY_CASHMANAGER__DAILY_ACTIVITY 

At EOD, transfer excess cash from Unit to Unit, following rules taken from some input tables.
Executed before Treasury (to allow Treasury to compute interest on cash account and overdrafts).


# Treasury module & taskLock UNIT__TREASURY__DAILY_ACTIVITY

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
