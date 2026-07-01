// layout.js — turn the Logik layout response into a flat, render-ready tree.
//
// The layout response is deeply nested and only *references* fields by name; the
// live values live in a separate config response. Walking that by hand in every
// screen is the main friction in building a custom UI. This module does it once:
//
//   buildLayout(layoutResponse)            -> a STATIC skeleton (structure + types)
//   resolveLayout(skeleton, model, msgs)   -> overlays live state + prunes hidden
//   buildRenderTree(layout, model, msgs)   -> both in one call
//
// Why two functions? The layout never changes mid-config, but values/visibility
// change on every patch. So buildLayout() is computed ONCE (memoize on `layout`)
// and only the cheap resolveLayout() overlay re-runs per patch.
//
// Structure recap (from real layouts):
//   response.fields[]          global field DEFS (type, label, min/max/step, …)
//   response.tierDef[]         depth -> representation ('Tab'|'ExpandableSection'|'BasicContainer')
//   response.layout.tiers[]    a tier holds EITHER child `tiers[]` OR `columnSets[]`
//   columnSet.elements[]       each element.type is 'field' | 'set' | 'productpicker'
//                              | 'text' | 'kbridge' | … ('field' looks up a global def;
//                              'set'/'productpicker' carry their own inline `fields[]`
//                              columns; others are props-driven passengers)
//   response.layout.sidebar    a parallel layout space (own tiers + own tierDef)
import { getFieldType } from './fieldTypes';

// ---- static skeleton (pure function of the layout) ----

const indexFields = (defs = []) => {
  const byVar = {};
  for (const f of defs) if (f && f.variableName) byVar[f.variableName] = f;
  return byVar;
};

// tierDef -> { [depth]: representation }
const repsByDepth = (tierDef = []) => {
  const m = {};
  for (const t of tierDef) if (t && typeof t.depth === 'number') m[t.depth] = t.representation;
  return m;
};

function buildElement(el, fieldDefs) {
  const type = el.type;

  // Set / product-picker grids carry their own column defs inline; each column
  // still resolves its display type from the global field def.
  if (type === 'set' || type === 'productpicker') {
    const columns = (el.fields || []).map((c) => {
      const def = fieldDefs[c.variableName] || null;
      return {
        variableName: c.variableName,
        subType: c.type, // 'field' | 'productpickerextension'
        def,
        displayType: def?.type,
        meta: getFieldType(def?.type),
        width: c.width,
        columnOrder: c.columnOrder,
      };
    });
    return {
      kind: type, // 'set' | 'productpicker'
      type,
      variableName: el.variableName,
      label: el.label,
      columns,
      displayMode: el.displayType, // e.g. 'table'
      sizeControl: el.sizeControl,
      inlineControl: el.inlineControl,
      pageSize: el.pageSize,
      maxHeight: el.maxHeight,
      raw: el,
    };
  }

  // A plain field: the element only points at a name; the def has the display type.
  if (type === 'field') {
    const def = fieldDefs[el.variableName] || null;
    return {
      kind: 'field',
      type,
      variableName: el.variableName,
      def,
      displayType: def?.type, // 'Picklist', 'Number', 'Boolean', …
      meta: getFieldType(def?.type), // FIELD_TYPES entry -> control/select/dataShape/flags
      label: def?.label,
      classInfo: el.classInfo,
      width: el.width,
      messageDisplayType: el.messageDisplayType || def?.messageDisplayType,
      raw: el,
    };
  }

  // text / kbridge / anything else: a props-driven "passenger" the SDK doesn't
  // interpret. We pass props through verbatim so a UI can render or ignore it.
  return {
    kind: 'custom',
    type,
    variableName: el.variableName,
    props: el.props,
    classInfo: el.classInfo,
    raw: el,
  };
}

const buildColumnSet = (cs, fieldDefs) => ({
  kind: 'columnSet',
  variableName: cs.variableName,
  label: cs.label,
  classInfo: cs.classInfo,
  elements: (cs.elements || []).map((el) => buildElement(el, fieldDefs)),
});

// Recursive: a tier has child tiers OR columnSets (the example has both shapes).
function buildTier(tier, fieldDefs, reps) {
  return {
    kind: 'tier',
    variableName: tier.variableName,
    label: tier.label,
    depth: tier.depth,
    representation: reps[tier.depth], // 'Tab' | 'ExpandableSection' | 'BasicContainer'
    defaultState: tier.defaultState, // 'delay' | 'collapsed' | undefined
    tiers: tier.tiers ? tier.tiers.map((t) => buildTier(t, fieldDefs, reps)) : null,
    columnSets: tier.columnSets ? tier.columnSets.map((cs) => buildColumnSet(cs, fieldDefs)) : null,
  };
}

/**
 * Build the static layout skeleton. Pure function of the layout response —
 * memoize it on `layout` identity; it never changes mid-config.
 */
export function buildLayout(resp = {}) {
  const fieldDefs = indexFields(resp.fields);
  const layout = resp.layout || {};
  const reps = repsByDepth(resp.tierDef);

  let sidebar = null;
  if (layout.sidebar) {
    const sreps = repsByDepth(layout.sidebar.tierDef);
    sidebar = {
      location: layout.sidebar.location, // 'left' | 'right'
      hideWhenEmpty: layout.sidebar.hideWhenEmpty,
      tiers: (layout.sidebar.tiers || []).map((t) => buildTier(t, fieldDefs, sreps)),
    };
  }

  return {
    fieldDefs,
    tierDef: resp.tierDef,
    main: (layout.tiers || []).map((t) => buildTier(t, fieldDefs, reps)),
    sidebar,
    // pass-through, UI-owned (branding / BOM grid / buttons) — never interpreted here
    header: resp.header,
    productList: resp.productList,
    resetButton: resp.resetButton,
    updateButton: resp.updateButton,
  };
}

// ---- live overlay + pruning (cheap; re-run per patch) ----
//
// Pruning rule: drop a columnSet/tier once it has nothing worth showing. An
// element "counts" toward keeping its container alive when:
//   field             -> it is visible (visibilityState !== 'hidden')
//   set/productpicker -> the set exists in the model
//   custom (text/…)   -> always (authored passengers shouldn't be silently dropped)
// A hidden field is filtered out of `elements`; a container with zero counting
// elements (and no surviving child tiers) disappears entirely — matching how the
// native UI hides a columnSet/tier when all its field elements go invisible.

function resolveElement(node, model, messages) {
  if (node.kind === 'field') {
    const live = model.byVar[node.variableName] || null;
    const visible = !!live && live.visibilityState !== 'hidden';
    return {
      ...node,
      field: live,
      value: live ? live.value : undefined,
      editable: live ? live.editable : undefined,
      options: live?.optionSet?.options || null, // RAW options — every PLE attribute intact
      messages: messages[node.variableName] || [],
      render: visible,
      counts: visible,
    };
  }
  if (node.kind === 'set' || node.kind === 'productpicker') {
    const set = model.sets[node.variableName] || null;
    return {
      ...node,
      set,
      messages: messages[node.variableName] || [],
      render: !!set,
      counts: !!set,
    };
  }
  // custom passenger
  return { ...node, messages: [], render: true, counts: true };
}

function resolveColumnSet(node, model, messages) {
  const elements = node.elements.map((el) => resolveElement(el, model, messages));
  if (!elements.some((e) => e.counts)) return null; // nothing visible -> drop
  return { ...node, elements: elements.filter((e) => e.render) };
}

function resolveTier(node, model, messages) {
  const tiers = node.tiers
    ? node.tiers.map((t) => resolveTier(t, model, messages)).filter(Boolean)
    : null;
  const columnSets = node.columnSets
    ? node.columnSets.map((cs) => resolveColumnSet(cs, model, messages)).filter(Boolean)
    : null;
  if (!(tiers && tiers.length) && !(columnSets && columnSets.length)) return null; // empty -> drop
  return { ...node, tiers, columnSets };
}

/**
 * Overlay live config state onto a skeleton and prune hidden fields/containers.
 * @param skeleton  output of buildLayout()
 * @param model     normalizeConfig() output ({ byVar, sets, … })
 * @param messages  messagesByTarget() output (variableName -> message[])
 */
export function resolveLayout(skeleton, model, messages = {}) {
  if (!skeleton || !model) return null;
  let sidebar = null;
  if (skeleton.sidebar) {
    const tiers = skeleton.sidebar.tiers.map((t) => resolveTier(t, model, messages)).filter(Boolean);
    // keep the sidebar if it has content, or if the author said keep-when-empty
    if (tiers.length || skeleton.sidebar.hideWhenEmpty === false) sidebar = { ...skeleton.sidebar, tiers };
  }
  return {
    ...skeleton,
    main: skeleton.main.map((t) => resolveTier(t, model, messages)).filter(Boolean),
    sidebar,
  };
}

/** Convenience: skeleton + overlay in one call (no memoization). */
export function buildRenderTree(layoutResp, model, messages = {}) {
  return resolveLayout(buildLayout(layoutResp), model, messages);
}
