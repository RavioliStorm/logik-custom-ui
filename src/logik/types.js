// Type definitions for the Logik headless model, transcribed from the
// Transaction Service + Headless Gateway OpenAPI specs (2026-06-22). These are
// the REAL wire shapes — not guesses — so renderers and rules can rely on them.
//
// This file is JSDoc-only; it exports nothing at runtime.

/**
 * @typedef {Object} LogikOption
 * @property {string} label
 * @property {string} value
 * @property {('visible'|'hidden'|'disabled'|string)} state
 * @property {?string} imageUrl
 * @property {?number} orderNumber
 * // Picklist-extension options additionally carry: description, price, modelNumber, etc.
 */

/**
 * @typedef {Object} LogikOptionSet
 * @property {LogikOption[]} options
 * @property {LogikOption[]} [selectedOptions]
 * @property {boolean} [last] @property {number} [totalElements] // present when paged
 */

/**
 * The atomic unit of a configuration/transaction. A "scalar" field has no `set`;
 * a set/grid row-cell carries `set` + `index` and a `uniqueName` of the form
 * `${set}-${instanceId}-${variableName}`.
 * @typedef {Object} LogikField
 * @property {string} variableName
 * @property {*} value
 * @property {('text'|'number'|'boolean'|'array'|string)} [dataType]
 * @property {('visible'|'hidden'|string)} [visibilityState]
 * @property {(boolean|'true'|'false')} [editable]
 * @property {boolean} [userEdited]
 * @property {string} [uniqueName]  // unique per set instance; equals variableName for scalars
 * @property {string} [set]         // set variableName this field belongs to
 * @property {number} [index]       // row index within the set
 * @property {number} [step]
 * @property {string} [selectAll]
 * @property {LogikOptionSet} [optionSet]
 */

/**
 * @typedef {Object} LogikMessage
 * @property {string} message
 * @property {string} type        // 'info' | 'warning' | 'error' | 'custom' | ...
 * @property {boolean} [error]
 * @property {string} [target]    // field variableName the message attaches to
 * @property {string} [targetType]
 * @property {string} [set] @property {number} [index]  // for set-row messages
 * @property {string} [color] @property {string} [icon] // for type 'custom'
 */

/**
 * @typedef {Object} LogikLayoutRef
 * @property {string} url           // e.g. "/blueprints/11/revisions/LATEST/layouts/1"
 * @property {string} label
 * @property {string} variableName
 */

/**
 * @typedef {Object} LogikBomProduct
 * @property {string} id @property {string} name @property {string} productCode
 * @property {number} quantity @property {number} price @property {number} extPrice
 * @property {('Sales'|'Manufacturing'|string)} bomType
 * @property {number} orderNumber @property {string} uniqueIdentifier
 */

/**
 * The configuration runtime response (POST /api, PATCH /api/{uuid}, GET /api/{uuid}).
 * @typedef {Object} LogikConfigResponse
 * @property {string} uuid
 * @property {number} revision
 * @property {boolean} valid
 * @property {LogikField[]} fields
 * @property {LogikMessage[]} messages
 * @property {LogikBomProduct[]} [products]
 * @property {number} [total]
 * @property {LogikLayoutRef[]} [layouts]
 * @property {string} [errorMessage]   // Logik returns 200 + errorMessage on logic errors
 */

export {};
