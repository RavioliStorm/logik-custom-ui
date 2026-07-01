// fieldTypes.js — the machine-readable catalog of Logik UI display components
// (from the "Logik UI Display Components" reference, Oct 2025). This is the
// contract an AI needs so it never has to guess a field type's shape again:
// for each layout `type`, what it selects, what data it carries, and how it maps
// to a rendered control.
//
// select:    'single' | 'multiple' | 'none'
// dataShape: 'scalar' | 'array' | 'set'  (set = rows of subfields, normalized separately)
// flags:     images / ple (picklist-extension) / productPicker
// element:   layout columnSet element `type` for non-`field` containers
//            ('set' and 'productpicker' aren't rendered as a single field)

const FIELD_TYPES = {
  // Picklists ----------------------------------------------------------------
  RadioButtons:                 { category: 'picklist', select: 'single',   dataShape: 'scalar', control: 'radio-horizontal' },
  VerticalRadio:                { category: 'picklist', select: 'single',   dataShape: 'scalar', control: 'radio-vertical' },
  Radio:                        { category: 'picklist', select: 'single',   dataShape: 'scalar', control: 'radio' },
  Checkbox:                     { category: 'picklist', select: 'multiple', dataShape: 'array',  control: 'checkbox-horizontal' },
  VerticalCheckbox:             { category: 'picklist', select: 'multiple', dataShape: 'array',  control: 'checkbox-vertical' },
  Picklist:                     { category: 'picklist', select: 'single',   dataShape: 'scalar', control: 'combobox', filter: true },
  BasicPicklist:                { category: 'picklist', select: 'single',   dataShape: 'scalar', control: 'select' },
  MultiSelectPicklist:          { category: 'picklist', select: 'multiple', dataShape: 'array',  control: 'multi-combobox', filter: true },
  VisualPicker:                 { category: 'picklist', select: 'single',   dataShape: 'scalar', control: 'cards', images: true },
  MultiSelectVisualPicker:      { category: 'picklist', select: 'multiple', dataShape: 'array',  control: 'cards', images: true },
  ExtendedPicklist:             { category: 'picklist', select: 'single',   dataShape: 'scalar', control: 'combobox', images: true, ple: true, filter: true },
  MultiSelectExtendedPicklist:  { category: 'picklist', select: 'multiple', dataShape: 'array',  control: 'multi-combobox', images: true, ple: true, filter: true },
  ExtendedPicklistDisplayOnly:           { category: 'picklist', select: 'single',   dataShape: 'scalar', control: 'cards', images: true, ple: true },
  MultiSelectExtendedPicklistDisplayOnly:{ category: 'picklist', select: 'multiple', dataShape: 'array',  control: 'cards', images: true, ple: true },
  SingleSelectPicklistGrid:     { category: 'picklist', select: 'single',   dataShape: 'scalar', control: 'grid', images: true, ple: true },
  MultiSelectPicklistGrid:      { category: 'picklist', select: 'multiple', dataShape: 'array',  control: 'grid', images: true, ple: true },

  // Product pickers (set-backed; rendered from a `productpicker` layout element)
  SingleSelectProductPickerGrid:   { category: 'product', select: 'single',   dataShape: 'set', control: 'grid', element: 'productpicker', images: true, productPicker: true },
  MultiSelectProductPickerGrid:    { category: 'product', select: 'multiple', dataShape: 'set', control: 'grid', element: 'productpicker', images: true, productPicker: true },
  VisualProductPicker:             { category: 'product', select: 'single',   dataShape: 'set', control: 'cards', element: 'productpicker', images: true, productPicker: true },
  MultiSelectVisualProductPicker:  { category: 'product', select: 'multiple', dataShape: 'set', control: 'cards', element: 'productpicker', images: true, productPicker: true },

  // Text ---------------------------------------------------------------------
  Text:            { category: 'text', select: 'none', dataShape: 'scalar', control: 'text' },
  String:          { category: 'text', select: 'none', dataShape: 'scalar', control: 'text' },
  TextArea:        { category: 'text', select: 'none', dataShape: 'scalar', control: 'textarea' },
  ReadOnlyText:    { category: 'text', select: 'none', dataShape: 'scalar', control: 'readonly', markdown: true },
  ReadOnlyCurrency:{ category: 'text', select: 'none', dataShape: 'scalar', control: 'readonly-currency' },
  Date:            { category: 'text', select: 'none', dataShape: 'scalar', control: 'date' },
  LocationLookup:  { category: 'text', select: 'none', dataShape: 'scalar', control: 'location' },

  // Numbers ------------------------------------------------------------------
  Number:          { category: 'number', select: 'none', dataShape: 'scalar', control: 'number', options: ['min', 'max', 'step'] },
  FormattedNumber: { category: 'number', select: 'none', dataShape: 'scalar', control: 'number', unit: true },
  Slider:          { category: 'number', select: 'none', dataShape: 'scalar', control: 'slider', options: ['min', 'max', 'step'] },
  NumberWithSubmit:{ category: 'number', select: 'none', dataShape: 'scalar', control: 'number-submit' },

  // Boolean ------------------------------------------------------------------
  Boolean:         { category: 'boolean', select: 'none', dataShape: 'scalar', control: 'switch' },
  Toggle:          { category: 'boolean', select: 'none', dataShape: 'scalar', control: 'switch' },
};

/** Look up a type's metadata, tolerating unknown/empty types. */
function getFieldType(type) {
  return FIELD_TYPES[type] || null;
}

/** Container element types that aren't a single rendered field. */
const CONTAINER_ELEMENTS = ['set', 'productpicker'];

export { FIELD_TYPES, getFieldType, CONTAINER_ELEMENTS };
