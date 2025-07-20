export { tablesInfoValidation };

import { DISABLE_VALIDATION } from '../../config/engine.js';
import { schema, validate } from '../deps.js';

/**
 * Validate a tableInfo object against expected structure. Throws an error if the structure is not valid.
 * Skip validation if DISABLE_VALIDATION is true.
 *
 * The expected structure is:
 * {
 *   TABLE_A: {
 *     tableName: 'tableA',
 *     description: 'Description for table A',  // optional
 *     columns: {
 *       COLUMN_A: {
 *         name: 'columnA',
 *         sanitization: schema.STRING_TYPE,
 *         description: 'Description for column A',  // optional
 *         parse: CONST.YAML_PARSE,  // optional
 *         values: {  // optional
 *           ACCOUNTING_TYPE: 'type',
 *           ACCOUNTING_VS_TYPE: 'vs type'
 *         }
 *       },
 *       COLUMN_B: {
 *         name: 'columnB',
 *         sanitization: schema.ANY_TYPE,
 *       }
 *     },
 *     sanitizationOptions: {  // optional
 *       defaultDate: new Date(0)
 *     }
 *   },
 *   TABLE_B: {
 *     [...]
 *   }
 * }
 *
 * @param {*} tablesInfo The tableInfo object to validate.
 * @throws {Error} Throws an error if the tableInfo structure is not valid.
 */
function tablesInfoValidation (tablesInfo) {
  if (tablesInfo == null) {
    throw new Error('tableInfo is null or undefined');
  }

  if (DISABLE_VALIDATION)
    return;

  /** @type {string[]} */
  const errors = [];

  // loop all tables info
  for (const tableInfo of Object.values(tablesInfo)) {
    // validate tableInfo
    _validate({
      value: tableInfo,
      validation: {
        tableName: schema.STRING_TYPE,
        description: schema.STRING_TYPE + schema.OPTIONAL,
        columns: schema.OBJECT_TYPE,
        sanitizationOptions: schema.OBJECT_TYPE + schema.OPTIONAL
      },
      strict: true
    });

    // loop all columns info
    for (const column of Object.values(tableInfo.columns)) {
      // validate current value of columns property
      validate({
        value: column,
        validation: {
          name: schema.STRING_TYPE,
          sanitization: schema.ANY_TYPE,
          description: schema.STRING_TYPE + schema.OPTIONAL,
          parse: schema.STRING_TYPE + schema.OPTIONAL,
          values: schema.OBJECT_TYPE + schema.OPTIONAL
        }
      });
    }
  }

  if (errors.length > 0) {
    const errors_strings = errors.map(e => e).join('\n');
    throw new Error(`Validation errors: ${errors_strings}`);
  }

  //#region private functions
  /** private validation function: calls validation in a try/catch block and collects error messages
   * @private
   * @param {*} p
   * @private
   */
  function _validate (p) {
    try {
      validate(p);
    } catch (e) {
      if (e instanceof Error) {
        errors.push(`Validation error: ${e.message} in ${JSON.stringify(p.value)}`);
      } else {
        errors.push(`Validation error: ${String(e)} in ${JSON.stringify(p.value)}`);
      }
    }
  }
  //#endregion
}
