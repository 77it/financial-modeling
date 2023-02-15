import { deepFreeze } from '../../../lib/obj_utils.js';

// the values are always positive, also debts and costs, then this is the sign/side (debit/credit, left/right) and the type (BS/IS) of the voice
export const doubleEntrySide_enum =
  {
    BALANCESHEET_CREDIT: 'BALANCESHEET_CREDIT',
    BALANCESHEET_DEBIT: 'BALANCESHEET_DEBIT',
    INCOMESTATEMENT_CREDIT: 'INCOMESTATEMENT_CREDIT',
    INCOMESTATEMENT_DEBIT: 'INCOMESTATEMENT_DEBIT',
    MEMO: 'MEMO',
    DEBUG: 'DEBUG',
    EXTRA: 'EXTRA'
  };
deepFreeze(doubleEntrySide_enum);

// @ts-ignore
export const doubleEntrySide_enum_validation = Object.keys(doubleEntrySide_enum).map(key => doubleEntrySide_enum[key]);
