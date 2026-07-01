// useLogikConfigurator — React binding over LogikClient. This is the App.js
// logic (init → patch → normalize → re-sync) extracted into a reusable hook so a
// new custom UI is ~30 lines of glue instead of 700. Returns a normalized model
// plus setField / setCell / resizeSet / save actions.
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { LogikClient } from './client';
import { normalizeConfig, messagesByTarget } from './normalize';
import { buildLayout, resolveLayout } from './layout';

export function useLogikConfigurator({
  baseUrl = '/api',
  token,
  origin,
  configuredProductId,
  layoutUrl,           // optional explicit layout url; otherwise taken from the init response
  initialFields = [],
} = {}) {
  const clientRef = useRef(null);
  if (!clientRef.current) clientRef.current = new LogikClient({ baseUrl, token, origin });
  const client = clientRef.current;

  const [response, setResponse] = useState(null); // last raw config response
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ingest a config/patch response as the new source of truth
  const ingest = useCallback((resp) => {
    if (resp) setResponse(resp);
    return resp;
  }, []);

  // Init and PATCH responses embed each optionSet as a Spring `Page` and only
  // send the FIRST page for large picklists (10 on init, 20 on patch). The page
  // metadata tells us whether more exist: `last === false`, or fewer options
  // present (`numberOfElements`) than the `totalElements` count. Only then do we
  // fetch — and we KEEP the embedded first page and request only the *remaining*
  // pages, continuing at the server's own page size (`os.size`). The server caps
  // page size at ~20 and ignores larger values, so re-requesting page 0 with a
  // big size would just re-download what we already have. Returns the SAME resp
  // reference when nothing needed fetching, so callers can skip a re-ingest.
  const enrichPagedOptions = useCallback(async (resp) => {
    const id = resp?.uuid;
    const list = Array.isArray(resp?.fields) ? resp.fields : [];
    if (!id || !list.length) return resp;
    // Evaluate each optionSet's page metadata; fetch only if it's incomplete.
    // Only scalar fields (no `set`) — set-cell options are addressed differently.
    const needsMore = (os) => {
      if (!os || !Array.isArray(os.options)) return false;
      if (os.last === false) return true;
      const have = typeof os.numberOfElements === 'number' ? os.numberOfElements : os.options.length;
      return typeof os.totalElements === 'number' && os.totalElements > have;
    };
    const paged = list.filter(f => f.variableName && !f.set && needsMore(f.optionSet));
    if (!paged.length) return resp;

    // Fetch all options for one field, reusing the embedded first page when it
    // aligns to the server's page grid. The server FORCES its own page size and
    // ignores the `size` we request: when the embedded page's size matches
    // (PATCH embeds 20, the server's size), we keep it and fetch only the
    // remaining pages — 1 call for 23 options. When it doesn't (init embeds 10),
    // continuing would skip rows (server jumps in 20s), so we detect the size
    // mismatch on the first continuation and restart cleanly from page 0.
    const drain = async (name, startPage, size, seed) => {
      const merged = seed ? [...seed] : [];
      let page = startPage;
      let serverSize = null;
      for (;;) {
        const pg = await client.getFieldOptions(id, name, { page, size });
        const p = pg?.optionSet || pg || {};
        serverSize = typeof p.size === 'number' ? p.size : serverSize;
        // First continuation page came back at a different size than the page we
        // seeded from → the seed doesn't align to this grid. Bail to restart.
        if (seed && page === startPage && serverSize !== size) return { misaligned: true, serverSize };
        if (Array.isArray(p.options)) merged.push(...p.options);
        if (p.last !== false || !p.options?.length) break;
        page = (typeof p.number === 'number' ? p.number : page) + 1;
      }
      return { options: merged, serverSize };
    };

    const results = await Promise.all(paged.map(async (f) => {
      const os = f.optionSet;
      const embeddedSize = os.size || os.options.length;
      const embeddedNum = typeof os.number === 'number' ? os.number : 0;
      try {
        // Optimistic: continue from the embedded page at its own size.
        const r = await drain(f.variableName, embeddedNum + 1, embeddedSize, os.options);
        if (!r.misaligned) return [f, r.options];
        // Fallback: embedded page didn't align — page from 0 at the server's size.
        const r2 = await drain(f.variableName, 0, r.serverSize || 20, null);
        return [f, r2.options];
      } catch { return [f, null]; }
    }));
    const fullByField = new Map(results.filter(([, m]) => m && m.length).map(([f, m]) => [f, m]));
    if (!fullByField.size) return resp;

    const fields = list.map((f) => {
      const merged = fullByField.get(f);
      if (!merged) return f;
      return {
        ...f,
        optionSet: { ...f.optionSet, options: merged, last: true, numberOfElements: merged.length },
      };
    });
    return { ...resp, fields };
  }, [client]);

  useEffect(() => {
    let alive = true;
    // Re-inits when configuredProductId changes — show the spinner and clear any
    // prior error so a product switch doesn't briefly render the old layout.
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const resp = await client.initConfig({ configuredProductId, fields: initialFields });
        if (!alive) return;
        ingest(resp); // fast first paint with page-one options
        const url = layoutUrl || resp.layouts?.[0]?.url;
        if (url) {
          const lay = await client.getLayout(url);
          if (alive) setLayout(lay);
        }
        const enriched = await enrichPagedOptions(resp);
        if (alive && enriched !== resp) ingest(enriched);
      } catch (err) {
        if (alive) setError(err.message || 'Failed to load configuration');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configuredProductId]);

  const model = useMemo(() => (response ? normalizeConfig(response) : null), [response]);
  const messages = useMemo(() => (model ? messagesByTarget(model.messages) : {}), [model]);

  // The layout is static mid-config, so the structural walk runs ONCE (keyed on
  // `layout`); only the cheap live overlay (`tree`) re-runs as the model changes.
  const skeleton = useMemo(() => (layout ? buildLayout(layout) : null), [layout]);
  const tree = useMemo(
    () => (skeleton && model ? resolveLayout(skeleton, model, messages) : null),
    [skeleton, model, messages]
  );

  const uuid = model?.uuid;

  // Reconcile overlapping writes WITHOUT blocking input. Every PATCH returns the
  // *full* new config (rules may have flipped other fields, hidden things, added
  // messages). If a user fires a second edit before the first response lands,
  // the two responses can arrive out of order and a stale one could clobber
  // newer state. We don't disable inputs (that flickers); instead each write
  // gets a generation number and we only apply a response if it's still the
  // latest — stale responses are discarded. Because the session is stateful,
  // the newest response already reflects every earlier edit, so nothing is lost.
  const writeGen = useRef(0);
  const inFlight = useRef(0);
  const [pending, setPending] = useState(false);

  const run = useCallback(async (op) => {
    if (!uuid) return;
    const gen = ++writeGen.current;
    inFlight.current += 1;
    setPending(true);
    try {
      const resp = await op();
      // Enrich BEFORE ingesting so a paged field never renders in its truncated
      // (page-one) form. Otherwise selecting an option on page 2+ would briefly
      // expose a 20-option state and cause a visible re-render of the grid.
      // enrichPagedOptions returns immediately (no fetch) when nothing is paged.
      if (gen === writeGen.current) {
        const enriched = await enrichPagedOptions(resp);
        if (gen === writeGen.current) ingest(enriched); // only the latest write wins
      }
    } catch (err) {
      setError(err.message);
    } finally {
      inFlight.current -= 1;
      if (inFlight.current === 0) setPending(false);
    }
  }, [uuid, ingest, enrichPagedOptions]);

  const setField = useCallback((variableName, value, extra) =>
    run(() => client.setField(uuid, variableName, value, extra)), [run, client, uuid]);

  const setCell = useCallback((uniqueName, variableName, value) =>
    run(() => client.setCell(uuid, uniqueName, variableName, value)), [run, client, uuid]);

  const resizeSet = useCallback((setName, count) =>
    run(() => client.resizeSet(uuid, setName, count)), [run, client, uuid]);

  const save = useCallback(() => run(() => client.saveConfig(uuid)), [run, client, uuid]);

  // Read-only; doesn't mutate config state, so it's not gated by `pending`.
  const refreshBom = useCallback((type) => (uuid ? client.getBom(uuid, type) : Promise.resolve(null)), [client, uuid]);

  return {
    client, loading, pending, error, layout, model, messages, tree, uuid,
    setField, setCell, resizeSet, refreshBom, save,
  };
}

export default useLogikConfigurator;
