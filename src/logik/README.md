# logik-client

A headless SDK for the Logik configurator + transaction runtime. It owns the
**protocol** (auth, session lifecycle, patching, set/grid normalization) so a
custom UI is glue, not plumbing. Route surface and data shapes are transcribed
from the Headless Gateway + Transaction Service OpenAPI specs (2026-06-22).

## Why

The hard parts of a Logik UI were never the widgets — they were (1) auth/proxy
(the API 403s without an `Origin` header; the token must stay server-side),
(2) the data model (sets/grids arrive as flat fields keyed by
`uniqueName` = `${set}-${instanceId}-${variableName}`), and (3) mapping field
types to controls. This SDK encodes all three.

## Layout

| file | role |
|------|------|
| `client.js` | `LogikClient` — transport-injectable client for cfg + TM routes |
| `normalize.js` | `normalizeConfig(resp)` → `{ byVar, byUnique, sets, products, … }` (groups set rows) |
| `fieldTypes.js` | `FIELD_TYPES` catalog — every display type's select/dataShape/control |
| `types.js` | JSDoc typedefs (`LogikField`, `LogikOption`, `LogikMessage`, …) |
| `useLogikConfigurator.js` | React binding: init + normalized model + `setField`/`setCell`/`resizeSet` |

## Usage

**Server / Node / tests** (talk straight to the tenant):

```js
import { LogikClient, normalizeConfig } from './logik';
const client = new LogikClient({
  baseUrl: 'https://tenant.test.logik.io/api',
  token: process.env.LOGIK_TOKEN,        // runtime bearer token
  // origin auto-derived from baseUrl
});
const model = normalizeConfig(await client.initConfig({ configuredProductId: 'configurableProduct5' }));
await client.resizeSet(model.uuid, 'simpleSet', 3);
await client.setCell(model.uuid, uniqueName, 'pickleBrands.quantity', 9);
```

**Browser** (same-origin dev proxy injects token + Origin — see `src/setupProxy.js`):

```jsx
import { useLogikConfigurator } from './logik/useLogikConfigurator';

function Configurator() {
  const { loading, layout, model, setField, setCell, resizeSet } =
    useLogikConfigurator({ baseUrl: '/api', configuredProductId: 'configurableProduct5' });
  // model.byVar[var], model.sets[name].rows[i].cells[col], …
}
```

## Field-type catalog

`FIELD_TYPES[type]` describes how to render any layout type:

```js
FIELD_TYPES.MultiSelectProductPickerGrid
// { category:'product', select:'multiple', dataShape:'set',
//   control:'grid', element:'productpicker', images:true, productPicker:true }
```

`dataShape: 'set'` types are rendered from a `set`/`productpicker` layout element
(rows come from `normalizeConfig().sets`), not as a single field.

## Status

Core (`client` + `normalize` + `fieldTypes`) is verified end-to-end against a
live tenant: init → normalize → resize set → patch cell → BOM. The picklist-
extension option attributes (price/description/model on ExtendedPicklist & grids)
are spec-based pending a blueprint that uses them.
