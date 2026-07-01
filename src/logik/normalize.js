// normalize.js — turn the flat field list the API returns into a structured,
// renderer-friendly model. This is the piece that took the most reverse-
// engineering: the API returns sets/grids as flat fields distinguished only by
// `uniqueName` (`${set}-${instanceId}-${variableName}`) + `set` + `index`.
//
// The OpenAPI `Field` schema confirms the shape: scalar fields have no `set`;
// set members carry `set`, `index`, and a per-instance `uniqueName`. A set also
// has a size-control field `set.<name>.size` (no instance) used to add/remove rows.

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * @param {import('./types').LogikConfigResponse} resp
 * @returns {{
 *   uuid: string, valid: boolean, total: number,
 *   fields: object[], byVar: Object<string,object>, byUnique: Object<string,object>,
 *   sets: Object<string, {name:string, rows: Array<{id:string,index:number,cells:Object<string,object>}>, sizeField: ?object, size: number}>,
 *   products: object[], messages: object[], layouts: object[]
 * }}
 */
function normalizeConfig(resp = {}) {
  const fields = Array.isArray(resp.fields) ? resp.fields : [];
  const byVar = {};
  const byUnique = {};
  const sets = {};

  for (const f of fields) {
    if (f.uniqueName) byUnique[f.uniqueName] = f;

    if (f.set) {
      const set = sets[f.set] || (sets[f.set] = { name: f.set, _rows: {}, sizeField: null });
      const instanceRe = new RegExp('^' + escapeRe(f.set) + '-([^-]+)-');
      const m = (f.uniqueName || '').match(instanceRe);
      if (m) {
        const id = m[1];
        const row = set._rows[id] || (set._rows[id] = { id, index: 0, cells: {} });
        row.cells[f.variableName] = f;
        if (typeof f.index === 'number') row.index = f.index;
      } else if (f.variableName === `set.${f.set}.size`) {
        set.sizeField = f; // the row-count control, not a row cell
      }
      // other set-level control fields (if any) are ignored for rendering
    } else {
      byVar[f.variableName] = f;
    }
  }

  // finalize sets: ordered rows + derived current size
  for (const set of Object.values(sets)) {
    set.rows = Object.values(set._rows).sort((a, b) => a.index - b.index);
    delete set._rows;
    set.size = set.rows.length;
  }

  return {
    uuid: resp.uuid,
    valid: resp.valid,
    total: resp.total,
    fields,
    byVar,
    byUnique,
    sets,
    products: resp.products || [],
    messages: resp.messages || [],
    layouts: resp.layouts || [],
  };
}

/**
 * Index messages by the field they target (variableName), matching the
 * UI convention of `msg.target || msg.field`.
 */
function messagesByTarget(messages = []) {
  const out = {};
  for (const msg of messages) {
    const key = msg.target || msg.field;
    if (!key || !msg.message) continue;
    (out[key] = out[key] || []).push(msg);
  }
  return out;
}

export { normalizeConfig, messagesByTarget };
