export { SimObjectTypes_VsNoCash_enum };

import { deepFreeze, ensureArrayValuesAreUnique } from '../../../lib/obj_utils.js';

const SimObjectTypes_VsNoCash_enum = {
//#region SimObjectEnum_VSNOCASH__codeid_EXTERNAL
IS_INCOME__REVALUATION : "IS_INCOME__REVALUATION",  // (ITA) Rivalutazioni
IS_INCOME__WORKPERFORMEDBYENTITYANDCAPITALISED : "IS_INCOME__WORKPERFORMEDBYENTITYANDCAPITALISED",  // (ITA) Incrementi_di_immobilizzazioni_per_lavori_interni
IS_EXPENSE__AMORTIZATION : "IS_EXPENSE__AMORTIZATION",  // (ITA) Ammortamenti_immobilizzazioni_immateriali
IS_EXPENSE__DEPRECIATION : "IS_EXPENSE__DEPRECIATION",  // (ITA) Ammortamenti_immobilizzazioni_materiali
IS_EXPENSE__EMPLOYEEEXPENSE__EMPLOYEEPROVISIONSSEVERANCEPENSIONSANDSIMILARCOMMITMENTS : "IS_EXPENSE__EMPLOYEEEXPENSE__EMPLOYEEPROVISIONSSEVERANCEPENSIONSANDSIMILARCOMMITMENTS",  // (ITA) Costi_del_personale__Trattamento_Fine_Rapporto_Trattamento_di_quiescenza_e_simili
IS_EXPENSE__IMPAIRMENT : "IS_EXPENSE__IMPAIRMENT",  // (ITA) Svalutazioni
IS_EXPENSE__OTHEREXPENSE__OTHERPROVISIONS : "IS_EXPENSE__OTHEREXPENSE__OTHERPROVISIONS",  // (ITA) Oneri_diversi__AltriAccantonamenti
// skip
// skip
// skip
// skip
//#endregion SimObjectEnum_VSNOCASH__codeid_EXTERNAL
}
deepFreeze(SimObjectTypes_VsNoCash_enum);
ensureArrayValuesAreUnique(Object.values(SimObjectTypes_VsNoCash_enum));
