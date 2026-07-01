import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  TextField,
  FormControl,
  InputLabel,
  Box,
  Select,
  FormControlLabel,
  Checkbox,
  Typography,
  RadioGroup,
  Radio,
  FormLabel,
  Card,
  CardContent,
  Autocomplete,
  Switch,
  Slider,
  Button,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import FieldMessage from './FieldMessage';

// NumberWithSubmit sub-component (needs local state for pending value)
const NumberWithSubmitField = ({ value, onChange, isEditable, mergedField }) => {
  const [pendingValue, setPendingValue] = useState(value ?? '');

  React.useEffect(() => {
    setPendingValue(value ?? '');
  }, [value]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mt: 1, mb: 0.5 }}>
      <TextField
        fullWidth
        type="number"
        label={mergedField.label}
        value={pendingValue}
        onChange={(e) => setPendingValue(e.target.value)}
        variant="outlined"
        disabled={!isEditable}
        inputProps={{ min: mergedField.minValue, max: mergedField.maxValue, step: mergedField.step || 1 }}
      />
      <Button
        variant="contained"
        onClick={() => onChange(Number(pendingValue))}
        disabled={!isEditable || String(pendingValue) === String(value)}
        sx={{ mb: 0.5, flexShrink: 0 }}
      >
        Update
      </Button>
    </Box>
  );
};

// MultiSelectVisualPicker styled components
const PickerCard = styled(Card)(({ theme, selected }) => {
  const isDark = theme.palette.mode === 'dark';
  const accent = theme.palette.primary.main;
  return {
    position: 'relative',
    cursor: 'pointer',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
    border: selected
      ? `2px solid ${accent}`
      : `1px solid ${theme.palette.divider}`,
    // Selected: accent ring + neon glow + faint inner tint
    ...(selected && {
      backgroundColor: isDark ? 'rgba(129,140,248,0.10)' : 'rgba(25,118,210,0.04)',
      boxShadow: isDark
        ? `0 0 0 1px ${accent}, 0 0 22px rgba(129,140,248,0.45)`
        : `0 0 0 1px ${accent}, 0 6px 18px rgba(25,118,210,0.25)`,
    }),
    // Image zoom on hover (cards clip via overflow: hidden)
    '& img': {
      transition: 'transform 0.3s ease',
    },
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: isDark
        ? `0 10px 30px rgba(99,102,241,0.35), 0 0 0 1px ${accent}`
        : '0 10px 26px rgba(0,0,0,0.18)',
    },
    '&:hover img': {
      transform: 'scale(1.06)',
    },
    // Glowing corner check badge when selected
    ...(selected && {
      '&::after': {
        content: '"\\2713"',
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 2,
        width: 24,
        height: 24,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.8rem',
        fontWeight: 700,
        color: '#fff',
        background: isDark
          ? 'linear-gradient(135deg, #818cf8, #f472b6)'
          : accent,
        boxShadow: isDark
          ? '0 0 12px rgba(129,140,248,0.9)'
          : '0 2px 6px rgba(0,0,0,0.3)',
      },
    }),
  };
});

// ---- Shared helpers for the richer Logik display types ----

// Format a price the way Logik does: "<CODE> <amount>", e.g. "USD 0.56".
const formatPrice = (value, currencyCode = 'USD') => {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `${currencyCode} ${num.toFixed(2)}`;
};

// Pull the common "rich" attributes off an option, tolerating different field
// names (picklist-extension options carry price/description/model/etc.).
const optionMeta = (option = {}) => ({
  value: option.value,
  label: option.label ?? String(option.value ?? ''),
  imageUrl: option.imageUrl || option.image || null,
  description: option.description ?? option.subLabel ?? '',
  price: option.price ?? option.amount ?? null,
  modelNumber: option.modelNumber ?? option.model ?? option.sku ?? '',
  size: option.size ?? '',
  state: option.state,
});

// Minimal markdown -> HTML (links, bold, italic, headings, line breaks) so
// ReadOnlyText can render formatted content without a markdown dependency.
const renderMarkdown = (text = '') => {
  const escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/^###\s?(.*)$/gm, '<h3>$1</h3>')
    .replace(/^##\s?(.*)$/gm, '<h2>$1</h2>')
    .replace(/^#\s?(.*)$/gm, '<h1>$1</h1>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
};

// Card-based picker for the visual / extended-display / visual-product-picker
// families. Handles single + multi select, optional per-option quantity, and
// the picklist-extension display options (hide labels, etc.).
const RichCardPickerField = ({
  options = [],
  value,
  onChange,
  label,
  multi = false,
  withQuantity = false,
  isEditable = true,
  currencyCode = 'USD',
  mergedField = {},
}) => {
  const [quantities, setQuantities] = useState({});
  const opts = options.filter(o => o.state !== 'hidden').map(optionMeta);
  const selected = multi ? (Array.isArray(value) ? value : []) : value;
  const isSelected = (v) => (multi ? selected.includes(v) : selected === v);
  const hideOptionLabel = mergedField.hideOptionLabels || mergedField.hideOptionLabel;

  const toggle = (v) => {
    if (!onChange || !isEditable) return;
    if (multi) {
      onChange(isSelected(v) ? selected.filter(x => x !== v) : [...selected, v]);
    } else {
      onChange(isSelected(v) ? null : v);
    }
  };

  return (
    <Box sx={{ mt: 2, mb: 1 }}>
      {label && (
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          {label}
        </Typography>
      )}
      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={2}>
        {opts.map((o) => {
          const disabled = !isEditable || o.state === 'disabled';
          const sel = isSelected(o.value);
          return (
            <PickerCard
              key={o.value}
              selected={sel}
              onClick={() => !disabled && toggle(o.value)}
              sx={{ opacity: disabled ? 0.6 : 1, cursor: disabled ? 'default' : 'pointer' }}
            >
              {o.imageUrl && (
                <Box sx={{ bgcolor: 'rgba(0,0,0,0.25)', display: 'flex', justifyContent: 'center', p: 1 }}>
                  <Box component="img" src={o.imageUrl} alt={o.label} sx={{ width: '100%', height: 120, objectFit: 'contain' }} />
                </Box>
              )}
              <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                {!hideOptionLabel && <Typography variant="subtitle2">{o.label}</Typography>}
                {o.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{o.description}</Typography>
                )}
                {o.modelNumber && (
                  <Typography variant="caption" color="text.secondary" display="block">{o.modelNumber}</Typography>
                )}
                {o.price != null && (
                  <Typography variant="subtitle2" sx={{ mt: 0.5 }}>{formatPrice(o.price, currencyCode)}</Typography>
                )}
                {withQuantity && sel && (
                  <TextField
                    type="number"
                    size="small"
                    label="Qty"
                    value={quantities[o.value] ?? 1}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setQuantities(q => ({ ...q, [o.value]: e.target.value }))}
                    inputProps={{ min: 0 }}
                    sx={{ mt: 1, width: 90 }}
                    disabled={disabled}
                  />
                )}
              </CardContent>
            </PickerCard>
          );
        })}
      </Box>
    </Box>
  );
};

// Table-based picker for the *PicklistGrid / *ProductPickerGrid families.
// Columns are derived from whichever rich attributes the options carry.
const PicklistGridField = ({
  options = [],
  value,
  onChange,
  label,
  multi = false,
  withQuantity = false,
  isEditable = true,
  currencyCode = 'USD',
}) => {
  const [quantities, setQuantities] = useState({});
  const visible = options.filter(o => o.state !== 'hidden').map(optionMeta);
  const selected = multi ? (Array.isArray(value) ? value : []) : value;
  const isSelected = (v) => (multi ? selected.includes(v) : selected === v);

  const toggle = (v) => {
    if (!onChange || !isEditable) return;
    if (multi) {
      onChange(isSelected(v) ? selected.filter(x => x !== v) : [...selected, v]);
    } else {
      onChange(isSelected(v) ? null : v);
    }
  };

  const show = {
    image: visible.some(o => o.imageUrl),
    size: visible.some(o => o.size),
    description: visible.some(o => o.description),
    modelNumber: visible.some(o => o.modelNumber),
    price: visible.some(o => o.price != null),
  };

  return (
    <Box sx={{ mt: 2, mb: 1 }}>
      {label && (
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          {label}
        </Typography>
      )}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>Option</TableCell>
              {show.image && <TableCell>Image</TableCell>}
              {show.size && <TableCell>Size</TableCell>}
              {show.description && <TableCell>Description</TableCell>}
              {show.modelNumber && <TableCell>Model Number</TableCell>}
              {withQuantity && <TableCell>Quantity</TableCell>}
              {show.price && <TableCell align="right">Price</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((o) => {
              const disabled = !isEditable || o.state === 'disabled';
              const sel = isSelected(o.value);
              return (
                <TableRow
                  key={o.value}
                  hover
                  selected={sel}
                  onClick={() => !disabled && toggle(o.value)}
                  sx={{ cursor: disabled ? 'default' : 'pointer' }}
                >
                  <TableCell padding="checkbox">
                    {multi
                      ? <Checkbox checked={sel} disabled={disabled} />
                      : <Radio checked={sel} disabled={disabled} />}
                  </TableCell>
                  <TableCell>{o.label}</TableCell>
                  {show.image && (
                    <TableCell>
                      {o.imageUrl && <Box component="img" src={o.imageUrl} alt={o.label} sx={{ width: 48, height: 48, objectFit: 'contain' }} />}
                    </TableCell>
                  )}
                  {show.size && <TableCell>{o.size}</TableCell>}
                  {show.description && <TableCell>{o.description}</TableCell>}
                  {show.modelNumber && <TableCell>{o.modelNumber}</TableCell>}
                  {withQuantity && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <TextField
                        type="number"
                        size="small"
                        value={quantities[o.value] ?? (sel ? 1 : 0)}
                        onChange={(e) => setQuantities(q => ({ ...q, [o.value]: e.target.value }))}
                        inputProps={{ min: 0 }}
                        sx={{ width: 80 }}
                        disabled={disabled}
                      />
                    </TableCell>
                  )}
                  {show.price && <TableCell align="right">{o.price != null ? formatPrice(o.price, currencyCode) : ''}</TableCell>}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const FieldRenderer = ({ field, value, onChange, allFields, messages = [] }) => {
  // Get the latest field state from allFields
  const fieldState = React.useMemo(() => {
    if (!field?.variableName) return {};
    const state = allFields?.[field.variableName];
    return state || {};
  }, [allFields, field?.variableName]);

  // Merge field and fieldState with proper option handling
  const mergedField = React.useMemo(() => {
    const merged = { ...field, ...fieldState };
    
    // Handle optionSet for any field that has it
    if (fieldState?.optionSet) {
      merged.optionSet = {
        ...fieldState.optionSet,
        options: Array.isArray(fieldState.optionSet.options) 
          ? fieldState.optionSet.options.map(opt => ({...opt}))
          : [],
        selectedOptions: Array.isArray(fieldState.optionSet.selectedOptions)
          ? fieldState.optionSet.selectedOptions.map(opt => ({
              value: opt.value,
              label: opt.label || String(opt.value)
            }))
          : []
      };
    } else if (field?.optionSet) {
      // Fall back to field's optionSet if it exists (initial render)
      merged.optionSet = {
        ...field.optionSet,
        options: Array.isArray(field.optionSet.options) 
          ? field.optionSet.options 
          : []
      };
    }
    
    // Respect the field type from the layout
    if (field?.layout?.type) {
      merged.type = field.layout.type;
    }
    
    return merged;
  }, [field, fieldState]);

  // MultiSelectVisualPicker component
  const MultiSelectVisualPicker = ({
    optionSet = { options: [], selectedOptions: [] },
    value: selectedValues = [],
    onChange,
    label,
    hideOptionLabels = false
  }) => {
    // COMPLETELY REPLACE options - no merging, no state retention
    const options = React.useMemo(() => {
      // If no optionSet, return empty array
      if (!optionSet) {
        console.log(`[${label || 'MultiSelect'}] NO OPTION SET - returning empty options`);
        return [];
      }
      
      // Create completely new array with no references to old objects
      const newOptions = Array.isArray(optionSet.options) 
        ? optionSet.options.map(opt => ({
            value: opt.value,
            label: opt.label,
            state: opt.state,
            imageUrl: opt.imageUrl
          }))
        : [];
      
      console.log(`[${label || 'MultiSelect'}] OPTIONS REPLACED`, {
        count: newOptions.length,
        values: newOptions.map(o => o.value),
        source: 'optionSet',
        hasOptionSet: !!optionSet,
        optionSetCount: optionSet?.options?.length || 0
      });
      
      return newOptions;
    }, [optionSet, label]);
    
    // Handle selected values - completely replace with no merging
    const values = React.useMemo(() => {
      // If we have explicit selectedValues, use those
      if (Array.isArray(selectedValues) && selectedValues.length > 0) {
        console.log(`[${label || 'MultiSelect'}] USING selectedValues`, {
          values: selectedValues,
          source: 'selectedValues prop'
        });
        return [...selectedValues];
      }
      
      // Otherwise use selectedOptions from optionSet if available
      if (Array.isArray(optionSet?.selectedOptions) && optionSet.selectedOptions.length > 0) {
        const vals = optionSet.selectedOptions.map(opt => opt.value);
        console.log(`[${label || 'MultiSelect'}] USING optionSet.selectedOptions`, {
          values: vals,
          source: 'optionSet.selectedOptions'
        });
        return vals;
      }
      
      // Default to empty array
      console.log(`[${label || 'MultiSelect'}] NO SELECTED VALUES - using empty array`);
      return [];
    }, [selectedValues, optionSet, label]);

    const handleToggle = (optionValue) => {
      if (!onChange) return;
      
      const currentIndex = values.indexOf(optionValue);
      const newValues = [...values];
      
      if (currentIndex === -1) {
        newValues.push(optionValue);
      } else {
        newValues.splice(currentIndex, 1);
      }
      
      onChange(newValues);
    };

    // Filter out any selected values that are no longer in options
    const validSelections = values.filter(val => 
      options.some(opt => opt.value === val)
    );
    
    // Log the final state
    React.useEffect(() => {
      console.log(`[${label || 'MultiSelect'}] Updated:`, {
        optionSet: optionSet?.options?.map(o => o.value) || [],
        selectedValues: values,
        validSelections
      });
    }, [optionSet, values, validSelections, label]);

    if (!options.length) {
      return (
        <Box p={2} textAlign="center">
          <Typography variant="body2" color="textSecondary">
            No options available
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        {label && (
          <Typography variant="subtitle2" gutterBottom>
            {label}
          </Typography>
        )}
        <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(120px, 1fr))" gap={2}>
          {options.map((option) => {
            const isSelected = values.includes(option.value);
            return (
              <Box key={option.value} position="relative">
                <PickerCard
                  selected={isSelected}
                  onClick={() => handleToggle(option.value)}
                >
                  {option.imageUrl && (
                    <Box sx={{ bgcolor: 'rgba(0,0,0,0.25)', display: 'flex', justifyContent: 'center' }}>
                      <Box
                        component="img"
                        src={option.imageUrl}
                        alt={option.label}
                        sx={{
                          width: '100%',
                          height: 100,
                          objectFit: 'cover',
                        }}
                      />
                    </Box>
                  )}
                  <CardContent sx={{ flexGrow: 1, p: 1 }}>
                    {!hideOptionLabels && (
                      <Typography variant="body2" align="center">
                        {option.label}
                      </Typography>
                    )}
                  </CardContent>
                </PickerCard>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  // Determine the field type based on the field configuration
  const fieldType = React.useMemo(() => {
    // First check if there's a specific type in the merged field (from layout or state)
    if (mergedField?.type) return mergedField.type;
    
    // Then check the original field type
    if (field?.type) return field.type;
    
    // For array types with options, default to MultiSelectVisualPicker if not specified
    if ((mergedField?.dataType === 'array' || field?.dataType === 'array') && 
        (mergedField?.optionSet?.options?.length > 0 || field?.optionSet?.options?.length > 0)) {
      return 'MultiSelectVisualPicker';
    }
    
    // Fall back to dataType if no specific type is set
    return (mergedField?.dataType || 'text').toLowerCase();
  }, [field?.type, field?.dataType, field?.optionSet, mergedField?.type, mergedField?.dataType, mergedField?.optionSet]);
  
  // Normalize an array field's value to an array for the multi-select pickers.
  // NOTE: we deliberately DON'T prune values that are absent from `options`.
  // Option sets are paginated (see useLogikConfigurator.enrichPagedOptions), so
  // a selected value can legitimately live on a page that isn't loaded yet —
  // pruning it here used to fire an onChange that deleted the user's pick (the
  // last 3 picklist options couldn't be selected). The server is the source of
  // truth for selection validity; it returns the corrected value if a rule
  // invalidates one.
  const validValue = React.useMemo(() => {
    if (mergedField.dataType !== 'array' && fieldType !== 'MultiSelectVisualPicker') {
      return value;
    }
    return Array.isArray(value) ? value : [];
  }, [value, mergedField.dataType, fieldType]);

  // Filter messages for this specific field
  const fieldMessages = React.useMemo(() => {
    if (!messages || !Array.isArray(messages)) {
      console.log('No valid messages array provided or messages is not an array');
      return [];
    }
    
    const filteredMessages = messages.filter(msg => {
      const matches = (msg.target === field.variableName || msg.field === field.variableName) && msg.message;
      if (matches) {
        console.log('Message matches field:', {
          message: msg,
          field: field.variableName,
          matchesTarget: msg.target === field.variableName,
          matchesField: msg.field === field.variableName
        });
      }
      return matches;
    });
    
    console.log(`Messages for field ${field.variableName}:`, {
      allMessages: messages,
      filteredMessages,
      fieldName: field.variableName,
      hasMessages: filteredMessages.length > 0
    });
    
    return filteredMessages;
  }, [messages, field.variableName]);
  
  // Helper to render field with message
  const renderWithMessage = (fieldComponent) => {
    const hasMessages = fieldMessages && fieldMessages.length > 0;
    
    console.log('Rendering with message:', {
      field: field.variableName,
      hasMessages,
      messages: fieldMessages,
      fieldComponentType: fieldComponent?.type?.name || typeof fieldComponent
    });
    
    if (!hasMessages) return fieldComponent;
    
    console.log('Adding message indicators to field:', field.variableName, {
      messageCount: fieldMessages.length,
      firstMessage: fieldMessages[0]
    });
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <Box sx={{ flexGrow: 1 }}>{fieldComponent}</Box>
        <Box sx={{ ml: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {fieldMessages.map((msg, index) => {
            // For custom message type, use the provided icon and color
            const isCustom = msg.type === 'custom';
            const iconProps = isCustom && msg.icon ? { icon: <img src={msg.icon} alt="" style={{ width: 20, height: 20 }} /> } : {};
            const color = isCustom && msg.color ? msg.color : undefined;
            
            return (
              <FieldMessage 
                key={index} 
                message={msg.message} 
                type={msg.type || 'info'}
                color={color}
                {...iconProps}
              />
            );
          })}
        </Box>
      </Box>
    );
  };

  const theme = useTheme();
  
  const renderField = () => {
    if (!mergedField) {
      console.warn('Field configuration is missing');
      return <Typography color="error">Field configuration error</Typography>;
    }
    
    // Ensure we have a variableName
    if (!mergedField.variableName) {
      console.warn('Field is missing variableName', mergedField);
      return <Typography color="error">Field is missing variableName</Typography>;
    }
    
    // Check if the field is editable
    // Handle both string 'false' and boolean false as non-editable
    const isEditable = mergedField.editable !== false &&
                      mergedField.editable !== 'false'; // Default to true if not specified

    // Currency code for price-bearing fields; layout may override (default USD).
    const currencyCode = mergedField.currencyCode || mergedField.currency || 'USD';
    
    console.log('Rendering field:', {
      variableName: mergedField.variableName,
      fieldType,
      value: mergedField.dataType === 'array' ? validValue : value,
      options: mergedField.optionSet?.options?.length || 0,
      optionSet: mergedField.optionSet,
      hasOptionSet: !!mergedField.optionSet,
      isEditable
    });
    
    // Common props for non-editable fields
    const readOnlyFieldProps = {
      disabled: true,
      InputProps: {
        readOnly: true,
      },
      sx: {
        '& .MuiInputBase-input.Mui-disabled': {
          WebkitTextFillColor: theme.palette.text.secondary,
          backgroundColor: theme.palette.action.disabledBackground,
        },
        '& .MuiInputLabel-root.Mui-disabled': {
          color: theme.palette.text.secondary,
        },
      },
    };

    switch (fieldType) {
      case 'Checkbox':
      case 'VerticalCheckbox': {
        // VerticalCheckbox stacks options in a column; Checkbox lays them out in
        // a wrapping row (mirrors the RadioButtons / VerticalRadio split below).
        const checkboxOrientation = fieldType === 'VerticalCheckbox' ? 'vertical' : 'horizontal';

        // Check if we have options for a checkbox list
        if (mergedField.optionSet?.options?.length > 0) {
          // Determine if this is a multi-select or single-select checkbox group
          const isMultiSelect = mergedField.dataType === 'array' || Array.isArray(value);

          return renderWithMessage(
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{
                color: !isEditable ? theme.palette.text.secondary : 'inherit',
                mb: 1
              }}>
                {mergedField.label}
              </FormLabel>
              <Box sx={{
                display: 'flex',
                flexDirection: checkboxOrientation === 'vertical' ? 'column' : 'row',
                flexWrap: checkboxOrientation === 'vertical' ? 'nowrap' : 'wrap',
                ml: 1,
                columnGap: checkboxOrientation === 'vertical' ? 0 : 2,
              }}>
                {mergedField.optionSet.options.map((option) => {
                  if (option.state === 'hidden') return null;
                  const isDisabled = !isEditable || option.state === 'disabled';
                  
                  // Convert option value to correct type based on current value
                  let optionValue = option.value;
                  if (value !== null && value !== undefined) {
                    if (typeof value === 'boolean' || (Array.isArray(value) && typeof value[0] === 'boolean')) {
                      optionValue = optionValue === 'true';
                    } else if (typeof value === 'number' || (Array.isArray(value) && typeof value[0] === 'number')) {
                      optionValue = Number(optionValue);
                    }
                  }
                  
                  // Determine if this option is checked
                  let isChecked;
                  if (isMultiSelect) {
                    isChecked = Array.isArray(value) ? value.includes(optionValue) : false;
                  } else {
                    isChecked = value === optionValue;
                  }
                  
                  return (
                    <FormControlLabel
                      key={option.value}
                      control={
                        <Checkbox
                          checked={isChecked}
                          onChange={(e) => {
                            if (!onChange) return;
                            
                            if (isMultiSelect) {
                              // For multi-select (array type)
                              const currentValue = Array.isArray(value) ? value : [];
                              const newValue = e.target.checked
                                ? [...currentValue, optionValue]
                                : currentValue.filter(v => v !== optionValue);
                              onChange(newValue);
                            } else {
                              // For single select
                              onChange(e.target.checked ? optionValue : null);
                            }
                          }}
                          disabled={isDisabled}
                          color="primary"
                        />
                      }
                      label={option.label || String(option.value)}
                      sx={{
                        '& .MuiFormControlLabel-label': {
                          color: isDisabled ? theme.palette.text.disabled : 'inherit',
                        },
                        opacity: isDisabled ? 0.8 : 1,
                        mb: 0.5,
                      }}
                    />
                  );
                })}
              </Box>
            </FormControl>
          );
        }
        
        // For single checkbox (no options)
        return renderWithMessage(
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(value)}
                onChange={(e) => onChange(e.target.checked)}
                disabled={!isEditable}
                color="primary"
              />
            }
            label={mergedField.label}
            sx={{
              '& .MuiFormControlLabel-label': {
                color: !isEditable ? theme.palette.text.secondary : 'inherit',
              },
              '& .MuiCheckbox-root': {
                color: !isEditable ? theme.palette.text.disabled : 'primary',
              },
              '& .Mui-checked': {
                color: !isEditable ? theme.palette.text.secondary : 'primary',
              },
              opacity: !isEditable ? 0.8 : 1,
              cursor: !isEditable ? 'default' : 'pointer',
            }}
          />
        );
      }

      case 'Radio':
      case 'RadioButtons':
      case 'VerticalRadio':
        // Common radio button group renderer
        const renderRadioGroup = (orientation = 'row') => {
          if (!field.optionSet?.options?.length) {
            // Fallback to single checkbox if no options are provided
            return (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(value)}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={!isEditable}
                    color="primary"
                  />
                }
                label={mergedField.label}
                sx={{
                  '& .MuiFormControlLabel-label': !isEditable ? { color: theme.palette.text.secondary } : {},
                  opacity: !isEditable ? 0.8 : 1,
                }}
              />
            );
          }

          return (
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{
                color: !isEditable ? theme.palette.text.secondary : 'inherit',
                mb: 1
              }}>
                {mergedField.label}
              </FormLabel>
              <RadioGroup
                row={orientation !== 'vertical'}
                value={String(value)}
                onChange={(e) => {
                  // Handle both string 'true'/'false' and other values
                  const newValue = e.target.value === 'true' ? true :
                                 e.target.value === 'false' ? false :
                                 e.target.value;
                  onChange(newValue);
                }}
                sx={{
                  '& .Mui-disabled': {
                    color: theme.palette.text.disabled,
                  },
                  '& .MuiFormControlLabel-root': {
                    mr: orientation === 'vertical' ? 0 : 3,
                    mb: orientation === 'vertical' ? 1 : 0,
                  },
                }}
              >
                {field.optionSet.options.map((option) => {
                  if (option.state === 'hidden') return null;
                  
                  const optionValue = String(option.value);
                  const isDisabled = !isEditable || option.state === 'disabled';
                  
                  return (
                    <FormControlLabel
                      key={option.value}
                      value={optionValue}
                      control={
                        <Radio 
                          size={orientation === 'vertical' ? 'medium' : 'small'}
                          disabled={isDisabled}
                        />
                      }
                      label={option.label || String(option.value)}
                      disabled={isDisabled}
                      sx={{
                        '& .MuiFormControlLabel-label': {
                          color: isDisabled ? theme.palette.text.disabled : 'inherit',
                        },
                        opacity: isDisabled ? 0.8 : 1,
                      }}
                    />
                  );
                })}
              </RadioGroup>
            </FormControl>
          );
        };

        // Determine orientation based on field type
        let orientation = 'row';
        if (fieldType === 'VerticalRadio') {
          orientation = 'vertical';
        } else if (fieldType === 'RadioButtons' || fieldType === 'Boolean' || fieldType === 'boolean') {
          orientation = 'row';
        } else if (fieldType === 'Radio') {
          // For 'Radio' type, use vertical layout by default unless specified otherwise
          orientation = field.orientation === 'horizontal' ? 'row' : 'vertical';
        }

        return renderWithMessage(renderRadioGroup(orientation));

      case 'Number':
      case 'number':
        if (!isEditable) {
          // For non-editable number fields, render as read-only text
          return renderWithMessage(
            <TextField
              fullWidth
              label={field.label}
              value={value || ''}
              variant="outlined"
              margin="normal"
              {...readOnlyFieldProps}
            />
          );
        }
        
        // For editable number fields, show the number input
        return renderWithMessage(
          <TextField
            fullWidth
            type="number"
            label={field.label}
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            variant="outlined"
            margin="normal"
            inputProps={{
              min: mergedField.minValue,
              max: mergedField.maxValue,
              step: mergedField.step || 'any'
            }}
          />
        );

      case 'BasicPicklist':
        // BasicPicklist - Simple dropdown (native select)
        if (field.optionSet?.options) {
          if (!isEditable) {
            // For non-editable picklists, show the selected value as read-only text
            const selectedOption = mergedField.optionSet.options.find(opt => opt.value === value);
            const displayValue = selectedOption ? (selectedOption.label || selectedOption.value) : value || '';
            
            return renderWithMessage(
              <TextField
                fullWidth
                label={mergedField.label}
                value={displayValue}
                variant="outlined"
                margin="normal"
                {...readOnlyFieldProps}
              />
            );
          }
          
          // For editable basic picklists, show a simple native select
          return renderWithMessage(
            <FormControl fullWidth variant="outlined" margin="normal">
              <InputLabel>{mergedField.label}</InputLabel>
              <Select
                native
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                label={mergedField.label}
                inputProps={{
                  name: mergedField.variableName,
                  id: `${mergedField.variableName}-select`,
                }}
              >
                <option aria-label="None" value="" />
                {mergedField.optionSet.options
                  .filter(option => option.state !== 'hidden')
                  .map((option) => (
                    <option 
                      key={option.value} 
                      value={option.value}
                      disabled={option.state === 'disabled'}
                    >
                      {option.label || option.value}
                    </option>
                  ))}
              </Select>
            </FormControl>
          );
        }
        break;

      case 'Picklist':
      case 'text': // Some fields might be marked as 'text' type but still have optionSet
        if (field.optionSet?.options) {
          if (!isEditable) {
            // For non-editable picklists, show the selected value as read-only text
            const selectedOption = mergedField.optionSet.options.find(opt => opt.value === value);
            const displayValue = selectedOption ? (selectedOption.label || selectedOption.value) : value || '';
            
            return renderWithMessage(
              <TextField
                fullWidth
                label={mergedField.label}
                value={displayValue}
                variant="outlined"
                margin="normal"
                {...readOnlyFieldProps}
              />
            );
          }
          
          // For editable picklists, show the autocomplete combobox
          return renderWithMessage(
            <Autocomplete
              options={mergedField.optionSet.options}
              getOptionLabel={(option) => option.label || option.value || ''}
              value={mergedField.optionSet.options.find(opt => opt.value === value) || null}
              onChange={(_, newValue) => onChange(newValue?.value || '')}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={mergedField.label}
                  variant="outlined"
                  margin="normal"
                  fullWidth
                />
              )}
              disableClearable={!isEditable}
              disabled={!isEditable}
              getOptionDisabled={(option) => option.state === 'disabled' || option.state === 'hidden'}
            />
          );
        }
        break;

      case 'array':
        // For array fields, check if they should be rendered as MultiSelectVisualPicker
        if (field.type === 'MultiSelectVisualPicker' && mergedField.optionSet?.options?.length > 0) {
          // Handle MultiSelectVisualPicker rendering
          console.log('Rendering MultiSelectVisualPicker for field:', {
            variableName: mergedField.variableName,
            value: validValue,
            options: mergedField.optionSet?.options || [],
            isEditable
          });
          
          if (!isEditable) {
            // Non-editable MultiSelectVisualPicker rendering
            return (
              <Box>
                <FormLabel component="legend">{mergedField.label || mergedField.variableName}</FormLabel>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {Array.isArray(validValue) && validValue.length > 0 
                    ? validValue.join(', ')
                    : 'No selection'}
                </Typography>
              </Box>
            );
          }
          
          // Editable MultiSelectVisualPicker rendering
          return (
            <MultiSelectVisualPicker
              label={mergedField.label || mergedField.variableName}
              options={mergedField.optionSet.options}
              value={validValue || []}
              onChange={onChange}
              disabled={!isEditable}
            />
          );
        }
        // Fall through to default array handling
        break;

      case 'MultiSelectVisualPicker':
        // For MultiSelectVisualPicker fields, use the visual picker component
        if (mergedField.optionSet?.options?.length > 0) {
          console.log('Rendering MultiSelectVisualPicker for field:', {
            variableName: mergedField.variableName,
            value: validValue,
            options: mergedField.optionSet?.options || [],
            isEditable
          });
          
          if (!isEditable) {
            // For non-editable array fields, show all options with selected ones highlighted
            const selectedValues = Array.isArray(validValue) ? validValue : [];
            
            return renderWithMessage(
              <Box>
                <FormLabel component="legend">{mergedField.label || mergedField.variableName}</FormLabel>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                  {(mergedField.optionSet?.options || []).map((option) => {
                    const isSelected = selectedValues.includes(option.value);
                    return (
                      <Box 
                        key={option.value}
                        sx={{
                          border: `2px solid ${isSelected ? theme.palette.primary.main : '#e0e0e0'}`,
                          borderRadius: 1,
                          p: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          width: 120,
                          opacity: isSelected ? 1 : 0.6,
                          cursor: 'default',
                          backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                          transition: 'all 0.2s',
                          '&:hover': {
                            opacity: isSelected ? 1 : 0.8,
                            boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                          }
                        }}
                      >
                        {option.imageUrl && (
                          <img 
                            src={option.imageUrl} 
                            alt={option.label} 
                            style={{ 
                              width: 80, 
                              height: 80, 
                              objectFit: 'contain',
                              marginBottom: 1,
                              opacity: isSelected ? 1 : 0.7
                            }} 
                          />
                        )}
                        <Typography 
                          variant="body2" 
                          align="center"
                          sx={{ 
                            color: isSelected ? theme.palette.primary.main : 'text.primary',
                            fontWeight: isSelected ? 600 : 'normal'
                          }}
                        >
                          {option.label}
                        </Typography>
                        {isSelected && (
                          <Box 
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}
                          >
                            ✓
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            );
          }
          
          return renderWithMessage(
            <MultiSelectVisualPicker
              optionSet={{
                options: mergedField.optionSet?.options || [],
                selectedOptions: mergedField.optionSet?.selectedOptions || []
              }}
              value={validValue}
              onChange={onChange}
              label={mergedField.label || mergedField.variableName}
              hideOptionLabels={mergedField.hideOptionLabels}
              disabled={!isEditable}
            />
          );
        }
        
        // Fallback for array fields without options
        return renderWithMessage(
          <TextField
            fullWidth
            label={field.label}
            value={Array.isArray(value) ? value.join(', ') : ''}
            variant="outlined"
            margin="normal"
            disabled
            helperText="No options available"
          />
        );

      case 'String':
        // Default text input
        return renderWithMessage(
          <TextField
            fullWidth
            label={field.label}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            variant="outlined"
            margin="normal"
            disabled={!isEditable}
          />
        );

      case 'Toggle':
        return renderWithMessage(
          <Box sx={{ mt: 2, mb: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(value)}
                  onChange={(e) => onChange(e.target.checked)}
                  disabled={!isEditable}
                  color="primary"
                />
              }
              label={mergedField.label}
              sx={{
                '& .MuiFormControlLabel-label': !isEditable ? { color: theme.palette.text.secondary } : {}
              }}
            />
          </Box>
        );

      case 'Slider':
        return renderWithMessage(
          <Box sx={{ mt: 2, mb: 1, px: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              {mergedField.label}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Slider
                value={Number(value) || mergedField.minValue || 0}
                onChange={(_, newValue) => onChange(newValue)}
                min={mergedField.minValue ?? 0}
                max={mergedField.maxValue ?? 100}
                step={mergedField.step || 1}
                disabled={!isEditable}
                valueLabelDisplay="auto"
                sx={{ flex: 1 }}
              />
              <Typography variant="body2" sx={{ minWidth: 36, textAlign: 'right' }}>
                {value}
              </Typography>
            </Box>
          </Box>
        );

      case 'NumberWithSubmit':
        return renderWithMessage(
          <NumberWithSubmitField
            value={value}
            onChange={onChange}
            isEditable={isEditable}
            mergedField={mergedField}
          />
        );

      case 'Date':
        return renderWithMessage(
          <TextField
            fullWidth
            type="date"
            label={mergedField.label}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            variant="outlined"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            disabled={!isEditable}
          />
        );

      case 'VisualPicker': {
        const visibleOptions = (mergedField.optionSet?.options || []).filter(opt => opt.state !== 'hidden');
        return renderWithMessage(
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              {mergedField.label}
            </Typography>
            <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(120px, 1fr))" gap={2}>
              {visibleOptions.map((option) => {
                const isSelected = value === option.value;
                const isDisabled = !isEditable || option.state === 'disabled';
                return (
                  <PickerCard
                    key={option.value}
                    selected={isSelected}
                    onClick={() => !isDisabled && onChange(option.value)}
                    sx={{ opacity: isDisabled ? 0.6 : 1, cursor: isDisabled ? 'default' : 'pointer' }}
                  >
                    {option.imageUrl && (
                      <Box sx={{ bgcolor: 'rgba(0,0,0,0.25)', display: 'flex', justifyContent: 'center' }}>
                        <Box
                          component="img"
                          src={option.imageUrl}
                          alt={option.label}
                          sx={{ width: '100%', height: 110, objectFit: 'cover' }}
                        />
                      </Box>
                    )}
                    <CardContent sx={{ p: 1 }}>
                      <Typography variant="body2" align="center">
                        {option.label}
                      </Typography>
                    </CardContent>
                  </PickerCard>
                );
              })}
            </Box>
          </Box>
        );
      }

      case 'ReadOnlyText':
        return renderWithMessage(
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="caption" display="block" sx={{ color: theme.palette.text.secondary, mb: 0.25 }}>
              {field.label}
            </Typography>
            <Typography
              variant="body1"
              component="div"
              sx={{ '& a': { color: theme.palette.primary.main }, '& p': { m: 0 } }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(value || '—') }}
            />
          </Box>
        );

      case 'Boolean':
      case 'boolean': {
        // Toggle switch with a label reflecting the current true/false state.
        const opts = mergedField.optionSet?.options || [];
        const trueLabel = opts.find(o => String(o.value) === 'true')?.label || mergedField.trueLabel || 'true';
        const falseLabel = opts.find(o => String(o.value) === 'false')?.label || mergedField.falseLabel || 'false';
        const checked = value === true || value === 'true';
        return renderWithMessage(
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {mergedField.label}
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={checked}
                  onChange={(e) => onChange(e.target.checked)}
                  disabled={!isEditable}
                  color="primary"
                />
              }
              label={checked ? trueLabel : falseLabel}
              sx={{ '& .MuiFormControlLabel-label': !isEditable ? { color: theme.palette.text.secondary } : {} }}
            />
          </Box>
        );
      }

      case 'TextArea':
        return renderWithMessage(
          <TextField
            fullWidth
            multiline
            minRows={3}
            label={mergedField.label}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            variant="outlined"
            margin="normal"
            disabled={!isEditable}
          />
        );

      case 'FormattedNumber': {
        const unit = mergedField.unit || mergedField.units || '';
        const unitBefore = mergedField.unitPosition === 'before';
        const adornment = unit
          ? (unitBefore
              ? { startAdornment: <InputAdornment position="start">{unit}</InputAdornment> }
              : { endAdornment: <InputAdornment position="end">{unit}</InputAdornment> })
          : {};
        return renderWithMessage(
          <TextField
            fullWidth
            type="number"
            label={mergedField.label}
            value={value ?? ''}
            onChange={(e) => onChange(Number(e.target.value))}
            variant="outlined"
            margin="normal"
            disabled={!isEditable}
            InputProps={adornment}
            inputProps={{ min: mergedField.minValue, max: mergedField.maxValue, step: mergedField.step || 'any' }}
          />
        );
      }

      case 'MultiSelectPicklist': {
        const opts = (mergedField.optionSet?.options || []).filter(o => o.state !== 'hidden');
        const arrVal = Array.isArray(value) ? value : [];
        return renderWithMessage(
          <Autocomplete
            multiple
            options={opts}
            getOptionLabel={(o) => o.label || o.value || ''}
            value={opts.filter(o => arrVal.includes(o.value))}
            onChange={(_, nv) => onChange(nv.map(o => o.value))}
            isOptionEqualToValue={(o, v) => o.value === v.value}
            getOptionDisabled={(o) => o.state === 'disabled'}
            disabled={!isEditable}
            renderInput={(params) => (
              <TextField {...params} label={mergedField.label} variant="outlined" margin="normal" fullWidth />
            )}
          />
        );
      }

      case 'ExtendedPicklist':
      case 'MultiSelectExtendedPicklist': {
        const multi = fieldType === 'MultiSelectExtendedPicklist';
        const opts = (mergedField.optionSet?.options || []).filter(o => o.state !== 'hidden');
        const renderOption = (props, o) => {
          const m = optionMeta(o);
          const meta = [m.modelNumber, m.price != null ? formatPrice(m.price, currencyCode) : ''].filter(Boolean).join(' · ');
          return (
            <Box component="li" {...props} key={o.value} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              {m.imageUrl && <Box component="img" src={m.imageUrl} alt={m.label} sx={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 }} />}
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2">{m.label}</Typography>
                {m.description && <Typography variant="caption" color="text.secondary" display="block" noWrap>{m.description}</Typography>}
                {meta && <Typography variant="caption" color="text.secondary">{meta}</Typography>}
              </Box>
            </Box>
          );
        };
        if (multi) {
          const arrVal = Array.isArray(value) ? value : [];
          return renderWithMessage(
            <Autocomplete
              multiple
              options={opts}
              getOptionLabel={(o) => o.label || o.value || ''}
              value={opts.filter(o => arrVal.includes(o.value))}
              onChange={(_, nv) => onChange(nv.map(o => o.value))}
              isOptionEqualToValue={(o, v) => o.value === v.value}
              getOptionDisabled={(o) => o.state === 'disabled'}
              disabled={!isEditable}
              renderOption={renderOption}
              renderInput={(params) => (
                <TextField {...params} label={mergedField.label} variant="outlined" margin="normal" fullWidth />
              )}
            />
          );
        }
        return renderWithMessage(
          <Autocomplete
            options={opts}
            getOptionLabel={(o) => o.label || o.value || ''}
            value={opts.find(o => o.value === value) || null}
            onChange={(_, nv) => onChange(nv?.value || '')}
            isOptionEqualToValue={(o, v) => o.value === v.value}
            getOptionDisabled={(o) => o.state === 'disabled'}
            disabled={!isEditable}
            renderOption={renderOption}
            renderInput={(params) => (
              <TextField {...params} label={mergedField.label} variant="outlined" margin="normal" fullWidth />
            )}
          />
        );
      }

      case 'ExtendedPicklistDisplayOnly':
      case 'MultiSelectExtendedPicklistDisplayOnly':
        return renderWithMessage(
          <RichCardPickerField
            multi={fieldType.startsWith('MultiSelect')}
            options={mergedField.optionSet?.options || []}
            value={value}
            onChange={onChange}
            label={mergedField.hideFieldLabel ? undefined : mergedField.label}
            isEditable={isEditable}
            currencyCode={currencyCode}
            mergedField={mergedField}
          />
        );

      case 'VisualProductPicker':
      case 'MultiSelectVisualProductPicker':
        return renderWithMessage(
          <RichCardPickerField
            multi={fieldType.startsWith('MultiSelect')}
            withQuantity
            options={mergedField.optionSet?.options || []}
            value={value}
            onChange={onChange}
            label={mergedField.label}
            isEditable={isEditable}
            currencyCode={currencyCode}
            mergedField={mergedField}
          />
        );

      case 'SingleSelectPicklistGrid':
      case 'MultiSelectPicklistGrid':
        return renderWithMessage(
          <PicklistGridField
            multi={fieldType.startsWith('MultiSelect')}
            options={mergedField.optionSet?.options || []}
            value={value}
            onChange={onChange}
            label={mergedField.label}
            isEditable={isEditable}
            currencyCode={currencyCode}
          />
        );

      case 'SingleSelectProductPickerGrid':
      case 'MultiSelectProductPickerGrid':
        return renderWithMessage(
          <PicklistGridField
            withQuantity
            multi={fieldType.startsWith('MultiSelect')}
            options={mergedField.optionSet?.options || []}
            value={value}
            onChange={onChange}
            label={mergedField.label}
            isEditable={isEditable}
            currencyCode={currencyCode}
          />
        );

      case 'ReadOnlyCurrency':
        return renderWithMessage(
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="caption" display="block" sx={{ color: theme.palette.text.secondary, mb: 0.25 }}>
              {mergedField.label}
            </Typography>
            <Typography variant="body1">
              {value != null && value !== '' ? formatPrice(value, currencyCode) : '—'}
            </Typography>
          </Box>
        );

      case 'LocationLookup':
        return renderWithMessage(
          <TextField
            fullWidth
            label={mergedField.label || 'Find a location'}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            variant="outlined"
            margin="normal"
            disabled={!isEditable}
            helperText="Location lookup (Google Places integration not configured)"
          />
        );

      default:
        return renderWithMessage(
          <Typography variant="body1" color="error">
            Unknown field type: {fieldType}
          </Typography>
        );
    }
  };

  if (!field) {
    return <Typography color="error">Field configuration error</Typography>;
  }

  return (
    <Box>
      {renderField()}
      {field.description && (
        <Typography variant="caption" color="textSecondary">
          {field.description}
        </Typography>
      )}
    </Box>
  );
};

export default React.memo(FieldRenderer);
