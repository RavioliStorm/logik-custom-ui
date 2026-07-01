// logik-client — a headless SDK for the Logik configurator runtime. The core
// (client + normalize + field-type catalog) is framework-agnostic and talks
// only to RUNTIME APIs — never admin/authoring CRUD, which has no place in a
// config UI. A React binding lives alongside in useLogikConfigurator.js.
export { LogikClient, LogikError } from './client';
export { normalizeConfig, messagesByTarget } from './normalize';
export { FIELD_TYPES, getFieldType, CONTAINER_ELEMENTS } from './fieldTypes';
export { buildLayout, resolveLayout, buildRenderTree } from './layout';
