export { DoubleEntrySide_enum, DoubleEntrySide_enum_validation };

import { deepFreeze, ensureArrayValuesAreUnique } from '../../../lib/obj_utils.js';

// the values are always positive, also debts and costs, then this is the sign/side (debit/credit, left/right) and the type (BS/IS) of the voice
const DoubleEntrySide_enum =
  {
    // see https://en.wikipedia.org/wiki/Debits_and_credits#The_five_accounting_elements

    // BS_CREDIT = (ITA) AVERE -> DEBITI
    BALANCESHEET_CREDIT: 'BALANCESHEET_CREDIT',
    // BS_DEBIT = (ITA) DARE -> CREDITI
    BALANCESHEET_DEBIT: 'BALANCESHEET_DEBIT',
    // IS_CREDIT = (ITA) AVERE -> RICAVI
    INCOMESTATEMENT_CREDIT: 'INCOMESTATEMENT_CREDIT',
    // IS_DEBIT = (ITA) DARE -> COSTI
    INCOMESTATEMENT_DEBIT: 'INCOMESTATEMENT_DEBIT',
    MEMO: 'MEMO',
    DEBUG: 'DEBUG',
    EXTRA: 'EXTRA'
  };
deepFreeze(DoubleEntrySide_enum);

// export array of DoubleEntrySide_enum, after ensuring that all values are unique
const DoubleEntrySide_enum_validation = ensureArrayValuesAreUnique(Object.values(DoubleEntrySide_enum));
