﻿export { SimObjectTypes_enum };

import { deepFreeze, ensureArrayValuesAreUnique } from '../../../lib/obj_utils.js';

const SimObjectTypes_enum = {
//#region SimObjectTypes_All__codeid_EXTERNAL
BS_CASH__BANKACCOUNT_FINANCIALACCOUNT : "BS_CASH__BANKACCOUNT_FINANCIALACCOUNT",  // (ITA) Depositi_bancari_e_postali
BS_CREDIT__ACCRUALSCREDITS : "BS_CREDIT__ACCRUALSCREDITS",  // (ITA) Ratei_attivi
BS_CREDIT__FINANCIALCREDITS__VSOTHERS : "BS_CREDIT__FINANCIALCREDITS__VSOTHERS",  // (ITA) Crediti_finanziari__Verso_altri
BS_CREDIT__FINANCIALCREDITS__VSSHAREHOLDERS : "BS_CREDIT__FINANCIALCREDITS__VSSHAREHOLDERS",  // (ITA) Crediti_finanziari__Verso_soci
BS_CREDIT__FINANCIALCREDITS__VSSHAREHOLDERSFORCONTRIBUTIONSDUECALLED : "BS_CREDIT__FINANCIALCREDITS__VSSHAREHOLDERSFORCONTRIBUTIONSDUECALLED",  // (ITA) Crediti_finanziari__Verso_soci_per_versamenti_dovuti_parte_richiamata
BS_CREDIT__FINANCIALCREDITS__VSSHAREHOLDERSFORCONTRIBUTIONSDUETOBECALLED : "BS_CREDIT__FINANCIALCREDITS__VSSHAREHOLDERSFORCONTRIBUTIONSDUETOBECALLED",  // (ITA) Crediti_finanziari__Verso_soci_per_versamenti_dovuti_parte_da_richiamare
BS_CREDIT__GENERICCREDITS__VSOTHERS : "BS_CREDIT__GENERICCREDITS__VSOTHERS",  // (ITA) Crediti_generici__Verso_altri
BS_CREDIT__GENERICCREDITS__VSSUPPLIERS : "BS_CREDIT__GENERICCREDITS__VSSUPPLIERS",  // (ITA) Crediti_generici__Acconti
BS_CREDIT__GENERICFINANCIALINSTRUMENT_ASSETS__FORTRADING : "BS_CREDIT__GENERICFINANCIALINSTRUMENT_ASSETS__FORTRADING",  // (ITA) Altri_titoli__Attivita_finanziarie_non_immobilizzate
BS_CREDIT__GENERICFINANCIALINSTRUMENT_ASSETS__TOHOLD : "BS_CREDIT__GENERICFINANCIALINSTRUMENT_ASSETS__TOHOLD",  // (ITA) Altri_titoli__Immobilizzazioni_finanziarie
BS_CREDIT__PREPAYMENTS : "BS_CREDIT__PREPAYMENTS",  // (ITA) Risconti_attivi
BS_CREDIT__TAXCREDITS : "BS_CREDIT__TAXCREDITS",  // (ITA) Crediti_tributari__Vari
BS_CREDIT__TAXCREDITS__PREPAIDTAX : "BS_CREDIT__TAXCREDITS__PREPAIDTAX",  // (ITA) Crediti_tributari__Imposte_anticipate
BS_CREDIT__TRADERECEIVABLECREDITS : "BS_CREDIT__TRADERECEIVABLECREDITS",  // (ITA) Crediti_verso_clienti
BS_CREDIT__VATCREDITS : "BS_CREDIT__VATCREDITS",  // (ITA) Crediti_tributari__IVA
BS_EQUITYINSTRUMENTS__EQUITYINSTRUMENTS_ASSETS__FINANCIALINVESTMENT : "BS_EQUITYINSTRUMENTS__EQUITYINSTRUMENTS_ASSETS__FINANCIALINVESTMENT",  // (ITA) Partecipazioni__Attivita_finanziarie_non_immobilizzate
BS_EQUITYINSTRUMENTS__EQUITYINSTRUMENTS_ASSETS__PARTICIPATION : "BS_EQUITYINSTRUMENTS__EQUITYINSTRUMENTS_ASSETS__PARTICIPATION",  // (ITA) Partecipazioni__Immobilizzazioni_finanziarie
BS_GOOD__INVENTORIES__CONTRACTWORKINPROGRESS : "BS_GOOD__INVENTORIES__CONTRACTWORKINPROGRESS",  // (ITA) Rimanenze__Lavori_in_corso_su_ordinazione
BS_GOOD__INVENTORIES__FINISHEDGOODS : "BS_GOOD__INVENTORIES__FINISHEDGOODS",  // (ITA) Rimanenze__Prodotti_finiti
BS_GOOD__INVENTORIES__RAWMATERIALANDCONSUMABLES : "BS_GOOD__INVENTORIES__RAWMATERIALANDCONSUMABLES",  // (ITA) Rimanenze__Materie_prime_sussidiarie_e_di_consumo
BS_GOOD__INVENTORIES__WORKINPROGRESSANDSEMIFINISHEDGOODS : "BS_GOOD__INVENTORIES__WORKINPROGRESSANDSEMIFINISHEDGOODS",  // (ITA) Rimanenze__Prodotti_in_corso_di_lavorazione_e_semilavorati
BS_GOOD__NONCURRENT_INTANGIBLE_ASSETS__STARTUPANDEXPANSIONCOSTS : "BS_GOOD__NONCURRENT_INTANGIBLE_ASSETS__STARTUPANDEXPANSIONCOSTS",  // (ITA) Immobilizzazioni_immateriali__Impianto_e_di_ampliamento
BS_GOOD__NONCURRENT_INTANGIBLE_ASSETS__DEVELOPMENTCOSTS : "BS_GOOD__NONCURRENT_INTANGIBLE_ASSETS__DEVELOPMENTCOSTS",  // (ITA) Immobilizzazioni_immateriali__Costi_di_sviluppo
BS_GOOD__NONCURRENT_INTANGIBLE_ASSETS__INDUSTRIALPATENTSANDINTELLECTUALPROPERTYRIGHTS : "BS_GOOD__NONCURRENT_INTANGIBLE_ASSETS__INDUSTRIALPATENTSANDINTELLECTUALPROPERTYRIGHTS",  // (ITA) Immobilizzazioni_immateriali__Diritti_di_brevetto_industriale
BS_GOOD__NONCURRENT_INTANGIBLE_ASSETS__CONCESSIONSLICENSESTRADEMARKSANDSIMILARRIGHTS : "BS_GOOD__NONCURRENT_INTANGIBLE_ASSETS__CONCESSIONSLICENSESTRADEMARKSANDSIMILARRIGHTS",  // (ITA) Immobilizzazioni_immateriali__Concessioni_licenze_marchi_e_simili
BS_GOOD__NONCURRENT_INTANGIBLE_ASSETS__GOODWILL : "BS_GOOD__NONCURRENT_INTANGIBLE_ASSETS__GOODWILL",  // (ITA) Immobilizzazioni_immateriali__Avviamento
BS_GOOD__NONCURRENT_INTANGIBLE_ASSETS__ASSETSINPROCESSOFFORMATIONANDADVANCES : "BS_GOOD__NONCURRENT_INTANGIBLE_ASSETS__ASSETSINPROCESSOFFORMATIONANDADVANCES",  // (ITA) Immobilizzazioni_immateriali__Immobilizzazioni_in_corso_e_acconti
BS_GOOD__NONCURRENT_INTANGIBLE_ASSETS__OTHER : "BS_GOOD__NONCURRENT_INTANGIBLE_ASSETS__OTHER",  // (ITA) Immobilizzazioni_immateriali__Altre
BS_GOOD__NONCURRENT_TANGIBLE_ASSETS__LANDANDBUILDINGS : "BS_GOOD__NONCURRENT_TANGIBLE_ASSETS__LANDANDBUILDINGS",  // (ITA) Immobilizzazioni__materiali__Terreni_e_fabbricati
BS_GOOD__NONCURRENT_TANGIBLE_ASSETS__PLANTANDMACHINERY : "BS_GOOD__NONCURRENT_TANGIBLE_ASSETS__PLANTANDMACHINERY",  // (ITA) Immobilizzazioni__materiali__Impianti_e_macchinario
BS_GOOD__NONCURRENT_TANGIBLE_ASSETS__INDUSTRIALANDCOMMERCIALEQUIPMENT : "BS_GOOD__NONCURRENT_TANGIBLE_ASSETS__INDUSTRIALANDCOMMERCIALEQUIPMENT",  // (ITA) Immobilizzazioni__materiali__Attrezzature_industriali_e_commerciali
BS_GOOD__NONCURRENT_TANGIBLE_ASSETS__ASSETSUNDERCONSTRUCTIONANDPAYMENTSONACCOUNT : "BS_GOOD__NONCURRENT_TANGIBLE_ASSETS__ASSETSUNDERCONSTRUCTIONANDPAYMENTSONACCOUNT",  // (ITA) Immobilizzazioni__materiali__Immobilizzazioni_in_corso_e_acconti
BS_GOOD__NONCURRENT_TANGIBLE_ASSETS__TANGIBLEFIXEDASSETSFORRESALE : "BS_GOOD__NONCURRENT_TANGIBLE_ASSETS__TANGIBLEFIXEDASSETSFORRESALE",  // (ITA) Immobilizzazioni__materiali__Immobilizzazioni_materiali_destinate_alla_vendita
BS_GOOD__NONCURRENT_TANGIBLE_ASSETS__OTHER_ASSETS : "BS_GOOD__NONCURRENT_TANGIBLE_ASSETS__OTHER_ASSETS",  // (ITA) Immobilizzazioni__materiali__Altri_beni
BS_EQUITY__NETINCOMEORLOSSOFTHEYEAR_EQUITY__RELATEDTOMAJORITYSHAREHOLDERS : "BS_EQUITY__NETINCOMEORLOSSOFTHEYEAR_EQUITY__RELATEDTOMAJORITYSHAREHOLDERS",  // (ITA) Utile_oppure_Perdita_di_esercizio__Relativo_agli_azionisti_di_maggioranza
BS_EQUITY__NETINCOMEORLOSSOFTHEYEAR_EQUITY__RELATEDTOMINORITYSHAREHOLDERS : "BS_EQUITY__NETINCOMEORLOSSOFTHEYEAR_EQUITY__RELATEDTOMINORITYSHAREHOLDERS",  // (ITA) Utile_oppure_Perdita_di_esercizio__Relativo_a_terzi
BS_EQUITY__RESERVES__RELATEDTOMAJORITYSHAREHOLDERS : "BS_EQUITY__RESERVES__RELATEDTOMAJORITYSHAREHOLDERS",  // (ITA) Patrimonio_netto__Riserve__Relativo_agli_azionisti_di_maggioranza
BS_EQUITY__RESERVES__RELATEDTOMINORITYSHAREHOLDERS : "BS_EQUITY__RESERVES__RELATEDTOMINORITYSHAREHOLDERS",  // (ITA) Patrimonio_netto__Riserve__Relativo_a_terzi
BS_EQUITY__RESERVES_CONSOLIDATIONRESERVE : "BS_EQUITY__RESERVES_CONSOLIDATIONRESERVE",  // (ITA) Patrimonio_netto__Riserve__Riserva_di_consolidamento
BS_EQUITY__RETAINEDEARNINGSANDLOSSES_EQUITY__RELATEDTOMAJORITYSHAREHOLDERS : "BS_EQUITY__RETAINEDEARNINGSANDLOSSES_EQUITY__RELATEDTOMAJORITYSHAREHOLDERS",  // (ITA) Patrimonio_netto__Utili_oppure_Perdite_portati_a_nuovo__Relativo_agli_azionisti_di_maggioranza
BS_EQUITY__RETAINEDEARNINGSANDLOSSES_EQUITY__RELATEDTOMINORITYSHAREHOLDERS : "BS_EQUITY__RETAINEDEARNINGSANDLOSSES_EQUITY__RELATEDTOMINORITYSHAREHOLDERS",  // (ITA) Patrimonio_netto__Utili_oppure_Perdite_portati_a_nuovo__Relativo_a_terzi
BS_EQUITY__SHARECAPITAL__RELATEDTOMAJORITYSHAREHOLDERS : "BS_EQUITY__SHARECAPITAL__RELATEDTOMAJORITYSHAREHOLDERS",  // (ITA) Patrimonio_netto__Capitale__Relativo_agli_azionisti_di_maggioranza
BS_EQUITY__SHARECAPITAL__RELATEDTOMINORITYSHAREHOLDERS : "BS_EQUITY__SHARECAPITAL__RELATEDTOMINORITYSHAREHOLDERS",  // (ITA) Patrimonio_netto__Capitale__Relativo_a_terzi
BS_LIABILITY__ACCRUALSDEBTS : "BS_LIABILITY__ACCRUALSDEBTS",  // (ITA) Ratei_passivi
BS_LIABILITY__DEFERREDINCOME : "BS_LIABILITY__DEFERREDINCOME",  // (ITA) Risconti_passivi
BS_LIABILITY__EMPLOYEEPROVISIONS : "BS_LIABILITY__EMPLOYEEPROVISIONS",  // (ITA) Trattamento_fine_rapporto
BS_LIABILITY__FINANCIALDEBTS__BOND : "BS_LIABILITY__FINANCIALDEBTS__BOND",  // (ITA) Debiti_finanziari__Obbligazioni
BS_LIABILITY__FINANCIALDEBTS__BONDCONVERTIBLE : "BS_LIABILITY__FINANCIALDEBTS__BONDCONVERTIBLE",  // (ITA) Debiti_finanziari__ObbligazioniConvertibili
BS_LIABILITY__FINANCIALDEBTS__CONTRACTFINANCING : "BS_LIABILITY__FINANCIALDEBTS__CONTRACTFINANCING",  // (ITA) Debiti_finanziari__Verso_banche__Anticipo_su_contratti
BS_LIABILITY__FINANCIALDEBTS__INVOICEFINANCING : "BS_LIABILITY__FINANCIALDEBTS__INVOICEFINANCING",  // (ITA) Debiti_finanziari__Verso_banche__Smobilizzo_crediti
BS_LIABILITY__FINANCIALDEBTS__LEASING : "BS_LIABILITY__FINANCIALDEBTS__LEASING",  // (ITA) Debiti_finanziari__Leasing
BS_LIABILITY__FINANCIALDEBTS__LOAN : "BS_LIABILITY__FINANCIALDEBTS__LOAN",  // (ITA) Debiti_finanziari__Verso_banche__Finanziamenti
BS_LIABILITY__FINANCIALDEBTS__OVERDRAFT : "BS_LIABILITY__FINANCIALDEBTS__OVERDRAFT",  // (ITA) Debiti_finanziari__Verso_banche__Fidi_di_cassa
BS_LIABILITY__FINANCIALDEBTS__VSOTHERS : "BS_LIABILITY__FINANCIALDEBTS__VSOTHERS",  // (ITA) Debiti_finanziari__Verso_altri
BS_LIABILITY__FINANCIALDEBTS__VSSHAREHOLDERS : "BS_LIABILITY__FINANCIALDEBTS__VSSHAREHOLDERS",  // (ITA) Debiti_finanziari__Verso_soci
BS_LIABILITY__GENERICDEBTS__VSCUSTOMERS : "BS_LIABILITY__GENERICDEBTS__VSCUSTOMERS",  // (ITA) Debiti_generici__Acconti
BS_LIABILITY__GENERICDEBTS__VSEMPLOYEES : "BS_LIABILITY__GENERICDEBTS__VSEMPLOYEES",  // (ITA) Debiti_generici__Verso_dipendenti
BS_LIABILITY__GENERICDEBTS__VSOTHERS : "BS_LIABILITY__GENERICDEBTS__VSOTHERS",  // (ITA) Debiti_generici__Verso_altri
BS_LIABILITY__OTHERPROVISIONS : "BS_LIABILITY__OTHERPROVISIONS",  // (ITA) Fondi_rischi_e_oneri
BS_LIABILITY__SOCIALSECURITYPAYABLEDEBTS : "BS_LIABILITY__SOCIALSECURITYPAYABLEDEBTS",  // (ITA) Debiti_verso_Istituti_di_previdenza
BS_LIABILITY__TAXDEBTS : "BS_LIABILITY__TAXDEBTS",  // (ITA) Debiti_tributari__Vari
BS_LIABILITY__TRADEPAYABLEDEBTS : "BS_LIABILITY__TRADEPAYABLEDEBTS",  // (ITA) Debiti_verso_Fornitori
BS_LIABILITY__VATDEBTS : "BS_LIABILITY__VATDEBTS",  // (ITA) Debiti_tributari__IVA
IS_INCOME__CAPITALGAIN : "IS_INCOME__CAPITALGAIN",  // (ITA) Plusvalenze_da_cessione_di_attivita
IS_INCOME__DIVIDENDINCOME : "IS_INCOME__DIVIDENDINCOME",  // (ITA) Proventi_finanziari__Da_partecipazioni
IS_INCOME__FINANCIALINCOME : "IS_INCOME__FINANCIALINCOME",  // (ITA) Proventi_finanziari__Altri
IS_INCOME__OTHERINCOME__OTHER : "IS_INCOME__OTHERINCOME__OTHER",  // (ITA) Altri_ricavi_e_proventi__Altri
IS_INCOME__OTHERINCOME__OPERATINGGRANTS : "IS_INCOME__OTHERINCOME__OPERATINGGRANTS",  // (ITA) Altri_ricavi_e_proventi__Contributi_in_conto_esercizio
IS_INCOME__REVALUATION : "IS_INCOME__REVALUATION",  // (ITA) Rivalutazioni
IS_INCOME__SALEREVENUE : "IS_INCOME__SALEREVENUE",  // (ITA) Ricavi_delle_vendite_e_delle_prestazioni
IS_INCOME__WORKPERFORMEDBYENTITYANDCAPITALISED : "IS_INCOME__WORKPERFORMEDBYENTITYANDCAPITALISED",  // (ITA) Incrementi_di_immobilizzazioni_per_lavori_interni
IS_PROFITLOSS__CHANGESININVENTORIES__CONTRACTWORKINPROGRESS : "IS_PROFITLOSS__CHANGESININVENTORIES__CONTRACTWORKINPROGRESS",  // (ITA) Variazione_dei_lavori_in_corso_su_ordinazione
IS_PROFITLOSS__CHANGESININVENTORIES__FINISHEDGOODS : "IS_PROFITLOSS__CHANGESININVENTORIES__FINISHEDGOODS",  // (ITA) Variazione_rimanenze_prodotti_finiti
IS_PROFITLOSS__CHANGESININVENTORIES__RAWMATERIALANDCONSUMABLES : "IS_PROFITLOSS__CHANGESININVENTORIES__RAWMATERIALANDCONSUMABLES",  // (ITA) Variazioni_rimanenze_materie_prime_e_di_consumo
IS_PROFITLOSS__CHANGESININVENTORIES__WORKINPROGRESSANDSEMIFINISHEDGOODS : "IS_PROFITLOSS__CHANGESININVENTORIES__WORKINPROGRESSANDSEMIFINISHEDGOODS",  // (ITA) Variazione_rimanenze_prodotti_in_corso_di_lavorazione
IS_PROFITLOSS__NETINCOMEORLOSS__RELATEDTOMAJORITYSHAREHOLDERS : "IS_PROFITLOSS__NETINCOMEORLOSS__RELATEDTOMAJORITYSHAREHOLDERS",  // (ITA) Utile_oppure_Perdita_di_esercizio__Relativo_agli_azionisti_di_maggioranza
IS_PROFITLOSS__NETINCOMEORLOSS__RELATEDTOMINORITYSHAREHOLDERS : "IS_PROFITLOSS__NETINCOMEORLOSS__RELATEDTOMINORITYSHAREHOLDERS",  // (ITA) Utile_oppure_Perdita_di_esercizio__Relativo_a_terzi
IS_EXPENSE__AMORTIZATION : "IS_EXPENSE__AMORTIZATION",  // (ITA) Ammortamenti_immobilizzazioni_immateriali
IS_EXPENSE__CAPITALLOSS : "IS_EXPENSE__CAPITALLOSS",  // (ITA) Minusvalenze_da_cessione_di_attivita
IS_EXPENSE__DEPRECIATION : "IS_EXPENSE__DEPRECIATION",  // (ITA) Ammortamenti_immobilizzazioni_materiali
IS_EXPENSE__EMPLOYEEEXPENSE__WAGESANDSALARIES : "IS_EXPENSE__EMPLOYEEEXPENSE__WAGESANDSALARIES",  // (ITA) Costi_del_personale__Salari_e_stipendi
IS_EXPENSE__EMPLOYEEEXPENSE__RELATEDSALARIES : "IS_EXPENSE__EMPLOYEEEXPENSE__RELATEDSALARIES",  // (ITA) Costi_del_personale__Oneri_sociali
IS_EXPENSE__EMPLOYEEEXPENSE__EMPLOYEEPROVISIONSSEVERANCEPENSIONSANDSIMILARCOMMITMENTS : "IS_EXPENSE__EMPLOYEEEXPENSE__EMPLOYEEPROVISIONSSEVERANCEPENSIONSANDSIMILARCOMMITMENTS",  // (ITA) Costi_del_personale__Trattamento_Fine_Rapporto_Trattamento_di_quiescenza_e_simili
IS_EXPENSE__FINANCIALEXPENSE__BONDEXPENSE : "IS_EXPENSE__FINANCIALEXPENSE__BONDEXPENSE",  // (ITA) Oneri_finanziari__Obbligazioni
IS_EXPENSE__FINANCIALEXPENSE__CONTRACTFINANCINGEXPENSE : "IS_EXPENSE__FINANCIALEXPENSE__CONTRACTFINANCINGEXPENSE",  // (ITA) Oneri_finanziari__Anticipo_su_contratti
IS_EXPENSE__FINANCIALEXPENSE__INVOICEFINANCINGEXPENSE : "IS_EXPENSE__FINANCIALEXPENSE__INVOICEFINANCINGEXPENSE",  // (ITA) Oneri_finanziari__Smobilizzo_crediti
IS_EXPENSE__FINANCIALEXPENSE__LEASINGEXPENSE : "IS_EXPENSE__FINANCIALEXPENSE__LEASINGEXPENSE",  // (ITA) Oneri_finanziari__Leasing
IS_EXPENSE__FINANCIALEXPENSE__LOANEXPENSE : "IS_EXPENSE__FINANCIALEXPENSE__LOANEXPENSE",  // (ITA) Oneri_finanziari__Finanziamenti
IS_EXPENSE__FINANCIALEXPENSE__OTHEREXPENSE : "IS_EXPENSE__FINANCIALEXPENSE__OTHEREXPENSE",  // (ITA) Oneri_finanziari__Altri
IS_EXPENSE__FINANCIALEXPENSE__OVERDRAFTEXPENSE : "IS_EXPENSE__FINANCIALEXPENSE__OVERDRAFTEXPENSE",  // (ITA) Oneri_finanziari__Fidi_di_cassa
IS_EXPENSE__FINANCIALEXPENSE__VSSHAREHOLDERSEXPENSE : "IS_EXPENSE__FINANCIALEXPENSE__VSSHAREHOLDERSEXPENSE",  // (ITA) Oneri_finanziari__Verso_soci
IS_EXPENSE__IMPAIRMENT : "IS_EXPENSE__IMPAIRMENT",  // (ITA) Svalutazioni
IS_EXPENSE__OTHEREXPENSE__OTHER : "IS_EXPENSE__OTHEREXPENSE__OTHER",  // (ITA) Oneri_diversi__Altri
IS_EXPENSE__OTHEREXPENSE__OTHERPROVISIONS : "IS_EXPENSE__OTHEREXPENSE__OTHERPROVISIONS",  // (ITA) Oneri_diversi__AltriAccantonamenti
IS_EXPENSE__PURCHASEEXPENSE__GOODS : "IS_EXPENSE__PURCHASEEXPENSE__GOODS",  // (ITA) Acquisti_materie_prime_e_di_consumo
IS_EXPENSE__PURCHASEEXPENSE__LEASEANDRENTING : "IS_EXPENSE__PURCHASEEXPENSE__LEASEANDRENTING",  // (ITA) Spese_per_godimento_di_beni_di_terzi
IS_EXPENSE__PURCHASEEXPENSE__SERVICES : "IS_EXPENSE__PURCHASEEXPENSE__SERVICES",  // (ITA) Spese_per_prestazioni_di_servizi
IS_EXPENSE__TAXEXPENSE : "IS_EXPENSE__TAXEXPENSE",  // (ITA) Imposte
IS_EXPENSE__TAXEXPENSE__DEFERREDANDPREPAIDTAX : "IS_EXPENSE__TAXEXPENSE__DEFERREDANDPREPAIDTAX",  // (ITA) Imposte__Imposte_differite_e_anticipate
MEMO__DATAFROMSIMULATION : "MEMO__DATAFROMSIMULATION",  // (ITA) DatiDaSimulazione
MEMO__DATAFROMSIMULATION_DIVIDENDSPAYOUT : "MEMO__DATAFROMSIMULATION_DIVIDENDSPAYOUT",  // (ITA) DatiDaSimulazione_Dividendi_pagati
// skip
// skip
// skip
// skip
//#endregion SimObjectTypes_All__codeid_EXTERNAL
}
deepFreeze(SimObjectTypes_enum);
ensureArrayValuesAreUnique(Object.values(SimObjectTypes_enum));
