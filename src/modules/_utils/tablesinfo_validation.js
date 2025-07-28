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
  // throw if tablesInfo is not an object with keys
  if (typeof tablesInfo !== 'object' || Array.isArray(tablesInfo) || Object.keys(tablesInfo).length === 0) {
    throw new Error('tableInfo is not a valid object: must be at least an object with a key');
  }

  if (DISABLE_VALIDATION)
    return;

  /** @type {string[]} */
  const errors = [];
  let errors_strings = '';

  // extract values and keys from `tablesInfo`
  const tablesInfo_values = Object.values(tablesInfo)
  const tablesInfo_keys = Object.keys(tablesInfo)

  // loop all tables info
  for (let i = 0; i < tablesInfo_values.length; i++) {
    // validate tablesInfo_values[i]
    _validate(
      tablesInfo_keys[i],
      {
        value: tablesInfo_values[i],
        validation: {
          tableName: schema.STRING_TYPE,
          description: schema.STRING_TYPE + schema.OPTIONAL,
          columns: schema.OBJECT_TYPE,
          sanitizationOptions: schema.OBJECT_TYPE + schema.OPTIONAL
        },
        strict: true,
        requireNonEmptyStrings: true
      });

    // continue with the following check if tablesInfo_values[i] is an object with `columns` key
    if (typeof tablesInfo_values[i] === 'object' && typeof tablesInfo_values[i].columns === 'object') {
      // extract values and keys from `tablesInfo_values[i]`
      const columns_values = Object.values(tablesInfo_values[i].columns)
      const columns_keys = Object.keys(tablesInfo_values[i].columns)

      // loop all columns info
      for (let j = 0; j < columns_values.length; j++) {
        // validate current value of columns property
        _validate(
          `${tablesInfo_keys[i]}.${columns_keys[j]}`,
          {
          value: columns_values[j],
          validation: {
            name: schema.STRING_TYPE,
            sanitization: schema.ANY_TYPE,
            description: schema.STRING_TYPE + schema.OPTIONAL,
            parse: schema.STRING_TYPE + schema.OPTIONAL,
            values: schema.OBJECT_TYPE + schema.OPTIONAL
          },
          strict: true,
          requireNonEmptyStrings: true
        });
      }
    }

    if (errors.length > 0) {
      errors_strings = errors_strings + errors.map(e => e).join('\n');
      errors.length = 0;  // clean array content
    }
  }

  if (errors_strings !== '')
    throw new Error(errors_strings);

  //#region private functions
  /** private validation function: calls validation in a try/catch block and collects error messages
   * @private
   * @param {*} key
   * @param {*} p
   * @private
   */
  function _validate (key, p) {
    try {
      validate(p);
    } catch (e) {
      if (e instanceof Error) {
        errors.push(`${key}: ${e.message} in ${JSON.stringify(p.value)}`);
      } else {
        errors.push(`${key}: ${String(e)} in ${JSON.stringify(p.value)}`);
      }
    }
  }
  //#endregion
}
