// LogikClient — a framework-agnostic, transport-injectable client for the Logik
// Headless Gateway. Encodes the protocol lessons learned the hard way:
//   - every request needs an `Origin` header (the API 403s without one)
//   - the bearer token is injected here, never hardcoded in UI components
//   - paths are relative to the `/api` root; the config layout `url` from a
//     response (e.g. "/blueprints/11/.../layouts/1") is fetched as-is under /api
//
// Two ways to construct it:
//   browser (same-origin dev proxy injects token+Origin):
//       new LogikClient({ baseUrl: '/api' })
//   server / node / tests (talk straight to the tenant):
//       new LogikClient({ baseUrl: 'https://tenant.test.logik.io/api',
//                         token: '...', origin: 'https://tenant.test.logik.io' })
//
// Route surface is transcribed from the Headless Gateway + Transaction Service
// OpenAPI specs (2026-06-22).

class LogikError extends Error {
  constructor(status, body, url) {
    const msg = (body && (body.errorMessage || body.message)) || `HTTP ${status}`;
    super(`Logik ${status}: ${msg}`);
    this.name = 'LogikError';
    this.status = status;
    this.body = body;
    this.url = url;
  }
}

const qs = (query) => {
  if (!query) return '';
  const parts = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

class LogikClient {
  /**
   * @param {Object} opts
   * @param {string} opts.baseUrl        - API root including `/api` (or `/api` for a proxied browser app)
   * @param {string} [opts.token]        - runtime bearer token (omit in browser; the proxy injects it)
   * @param {string} [opts.origin]       - Origin header value (defaults to baseUrl's origin)
   * @param {function} [opts.fetch]      - fetch implementation (defaults to global fetch)
   * @param {string} [opts.persona]      - X-Logik-User-Persona (Transaction Manager only)
   */
  constructor({ baseUrl, token, origin, fetch: fetchImpl, persona } = {}) {
    if (!baseUrl) throw new Error('LogikClient requires a baseUrl');
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
    this.persona = persona;
    // Wrap in a free-call arrow: browser `fetch` throws "Illegal invocation"
    // if called as a method (this.fetch()), so never store it as a bound method.
    this.fetch = fetchImpl || (typeof fetch !== 'undefined' ? (...args) => fetch(...args) : null);
    if (!this.fetch) throw new Error('No fetch available; pass opts.fetch');
    // Default Origin: derive from an absolute baseUrl, else leave for the proxy.
    if (origin) this.origin = origin;
    else if (/^https?:\/\//.test(this.baseUrl)) this.origin = new URL(this.baseUrl).origin;
    else this.origin = undefined;
  }

  async request(method, path, { body, query, headers } = {}) {
    const url = this.baseUrl + path + qs(query);
    const h = { Accept: 'application/json', ...headers };
    if (this.origin) h.Origin = this.origin; // no-op in browsers; required server-side
    if (this.token) h.Authorization = `Bearer ${this.token}`;
    if (this.persona) h['X-Logik-User-Persona'] = this.persona;
    if (body !== undefined) h['Content-Type'] = 'application/json';

    const res = await this.fetch(url, {
      method,
      headers: h,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (res.status === 204) return null;
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new LogikError(res.status, data, url);
    // Logik sometimes returns 200 with an errorMessage payload.
    if (data && data.errorMessage) throw new LogikError(res.status, data, url);
    return data;
  }

  // ---- Configuration runtime (cfg) ----

  /** POST /api — start a configuration for a configurable product. */
  initConfig({ configuredProductId, fields = [], configurationId, transaction } = {}) {
    const product = { configuredProductId };
    if (configurationId) product.configurationAttributes = { 'LGK__ConfigurationId__c': configurationId };
    const body = { sessionContext: { stateful: true }, partnerData: { product }, fields };
    if (transaction) body.transaction = transaction; // { id, lineId } for TM-linked configs
    return this.request('POST', '/', { body });
  }

  /** GET /api/{uuid} */
  getConfig(uuid) {
    return this.request('GET', `/${uuid}`);
  }

  /** PATCH /api/{uuid}?delta=&save= — update fields. `fields` is an array of {variableName,value,[uniqueName],[dataType]}. */
  updateConfig(uuid, fields, { delta = false, save } = {}) {
    return this.request('PATCH', `/${uuid}`, { body: { fields }, query: { delta, save } });
  }

  /** Convenience: set one scalar field. */
  setField(uuid, variableName, value, extra = {}) {
    return this.updateConfig(uuid, [{ variableName, value, ...extra }]);
  }

  /** Convenience: set one set/grid cell, addressed by its uniqueName instance. */
  setCell(uuid, uniqueName, variableName, value) {
    return this.updateConfig(uuid, [{ uniqueName, variableName, value }]);
  }

  /** Convenience: resize a set. The API expects a NUMBER = desired row count. */
  resizeSet(uuid, setName, count) {
    const v = `set.${setName}.size`;
    return this.updateConfig(uuid, [{ uniqueName: v, variableName: v, value: count }]);
  }

  /** PATCH /api/{uuid}?save=true */
  saveConfig(uuid, fields = []) {
    return this.request('PATCH', `/${uuid}`, { body: { fields }, query: { save: true } });
  }

  /** POST /api/{uuid}/reset */
  resetConfig(uuid) {
    return this.request('POST', `/${uuid}/reset`);
  }

  /** DELETE /api/{uuid} */
  deleteConfig(uuid) {
    return this.request('DELETE', `/${uuid}`);
  }

  /** PATCH /api/{uuid}/validate */
  validateConfig(uuid) {
    return this.request('PATCH', `/${uuid}/validate`, { body: {} });
  }

  /** GET /api/{uuid}/bom[/{type}] — type: 'sales' | 'manufacturing' | undefined (all). */
  getBom(uuid, type) {
    return this.request('GET', `/${uuid}/bom${type ? `/${type}` : ''}`);
  }

  /** GET /api/{uuid}/sets/{setVarName} */
  getSet(uuid, setVarName) {
    return this.request('GET', `/${uuid}/sets/${setVarName}`);
  }

  /** GET /api/{uuid}/fields/{fieldName}/options — one page of options for a big picklist.
   * Returns a Spring `Page` object: { options, last, number, totalElements, size, ... }. */
  getFieldOptions(uuid, fieldName, query) {
    return this.request('GET', `/${uuid}/fields/${fieldName}/options`, { query });
  }

  // NOTE: paging is done in useLogikConfigurator.enrichPagedOptions, which keeps
  // the first page already embedded in the config response and fetches only the
  // remaining pages via getFieldOptions. The server caps page size at ~20.

  /** GET /api/{uuid}/smartPredictions */
  getSmartPredictions(uuid) {
    return this.request('GET', `/${uuid}/smartPredictions`);
  }

  /** GET /api{layoutUrl} — layoutUrl comes from a config response's `layouts[].url`. */
  getLayout(layoutUrl) {
    return this.request('GET', layoutUrl);
  }

  // ---- Transaction Manager runtime (t) ----

  /** POST /api/t — initialize a transaction working session. */
  initTransaction({ id, stateful = true, fields = [], items } = {}) {
    const body = { stateful };
    if (id) body.id = id;
    if (fields.length) body.fields = fields;
    if (items) body.items = items;
    return this.request('POST', '/t', { body });
  }

  /** GET /api/t/{session} */
  getTransaction(session) {
    return this.request('GET', `/t/${session}`);
  }

  /** PATCH /api/t/{session} — update header fields and/or line fields. */
  patchTransaction(session, { fields = [], lines = [], context } = {}) {
    return this.request('PATCH', `/t/${session}`, { body: { context, fields, lines } });
  }

  /** POST /api/t/{transactionId}/events/{eventId} */
  runEvent(transactionId, eventId, body = { context: { stateful: true } }, { async: isAsync } = {}) {
    return this.request('POST', `/t/${transactionId}/events/${eventId}`, { body, query: { async: isAsync } });
  }

  /** POST /api/t/txn/{transactionId}/events/upsertLines */
  upsertLines(transactionId, items, context = { stateful: true }) {
    return this.request('POST', `/t/txn/${transactionId}/events/upsertLines`, { body: { context, items } });
  }

  /** POST /api/t/txn/{transactionId}/lines — fetch lines with a field filter. */
  getLines(transactionId, filteredFields) {
    const body = { id: transactionId };
    if (filteredFields) body.filteredFields = filteredFields;
    return this.request('POST', `/t/txn/${transactionId}/lines`, { body });
  }
}

export { LogikClient, LogikError };
