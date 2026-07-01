import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Checkbox,
  TextField,
  Select,
  MenuItem,
  FormControl
} from '@mui/material';

// Renders a Logik product-picker grid OR set layout element (both are tables of
// instance rows). Unlike ordinary fields, each row is an instance and each
// column a subfield/member, all arriving as flat fields keyed by `uniqueName`
// (e.g. `pickleBrands-1000-pickleBrands.quantity`, `simpleSet-1000-color`).
// Cells are edited by patching that specific uniqueName via onCellChange. Sets
// additionally have a size control (`set.<name>.size`) to add/remove rows.
const ProductPickerGrid = ({ gridElement, layoutFields = [], fieldsByUnique = {}, onCellChange }) => {
  const setName = gridElement.variableName;
  const isSet = gridElement.type === 'set';
  const indexVar = `set.${setName}.index`;
  const sizeVar = `set.${setName}.size`;

  const layoutByVar = {};
  layoutFields.forEach(f => { layoutByVar[f.variableName] = f; });

  // Columns come from the element's field list, ordered; labels/types from the layout.
  const columns = [...(gridElement.fields || [])]
    .sort((a, b) => (a.columnOrder || 0) - (b.columnOrder || 0))
    .map(cf => {
      const def = layoutByVar[cf.variableName] || {};
      return {
        variableName: cf.variableName,
        label: cf.variableName === indexVar ? '#' : (def.label || cf.variableName),
        type: def.type || def.layout?.type
      };
    });

  // Group instances into rows by the id embedded in the uniqueName: `${setName}-<id>-...`.
  const escaped = setName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const instanceRe = new RegExp('^' + escaped + '-([^-]+)-');
  const rowsMap = {};
  Object.values(fieldsByUnique).forEach(f => {
    if (!f.uniqueName) return;
    const match = f.uniqueName.match(instanceRe);
    if (!match) return;
    const id = match[1];
    if (!rowsMap[id]) rowsMap[id] = { id, index: 0, cells: {} };
    rowsMap[id].cells[f.variableName] = f;
    if (typeof f.index === 'number') rowsMap[id].index = f.index;
  });
  const rows = Object.values(rowsMap).sort((a, b) => a.index - b.index);

  const title = isSet ? gridElement.label : layoutByVar[setName]?.label;
  const showSizeControl = isSet && gridElement.sizeControl?.visible !== false;

  // Local row-count input for the set size control; commit on blur / Enter.
  const [sizeInput, setSizeInput] = useState(rows.length);
  useEffect(() => { setSizeInput(rows.length); }, [rows.length]);
  const commitSize = () => {
    const n = Number(sizeInput);
    if (!Number.isNaN(n) && n >= 0 && n !== rows.length) {
      onCellChange(sizeVar, sizeVar, n); // API expects a number = desired row count
    } else {
      setSizeInput(rows.length);
    }
  };

  const renderCell = (col, cell) => {
    if (!cell) return null;
    const editable = cell.editable !== false && cell.editable !== 'false';
    const change = (v) => onCellChange(cell.uniqueName, cell.variableName, v);
    const type = col.type || cell.dataType;

    // The set row-index column is a display-only counter.
    if (col.variableName === indexVar) {
      return <Typography variant="body2">{String(cell.value ?? '')}</Typography>;
    }

    switch (type) {
      case 'Boolean':
      case 'boolean':
        return (
          <Checkbox
            checked={cell.value === true || cell.value === 'true'}
            disabled={!editable}
            onChange={(e) => change(e.target.checked)}
            color="primary"
          />
        );
      case 'Number':
      case 'number':
        return (
          <TextField
            type="number"
            size="small"
            value={cell.value ?? 0}
            disabled={!editable}
            onChange={(e) => change(Number(e.target.value))}
            sx={{ width: 90 }}
            inputProps={{ min: 0 }}
          />
        );
      case 'Picklist':
      case 'BasicPicklist': {
        const opts = (cell.optionSet?.options || []).filter(o => o.state !== 'hidden');
        return (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select value={cell.value ?? ''} disabled={!editable} onChange={(e) => change(e.target.value)}>
              {opts.map(o => (
                <MenuItem key={o.value} value={o.value} disabled={o.state === 'disabled'}>
                  {o.label || o.value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      }
      case 'ReadOnlyText':
      default:
        return <Typography variant="body2">{String(cell.value ?? '')}</Typography>;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 2 }}>
        {title && <Typography variant="subtitle2">{title}</Typography>}
        {showSizeControl && (
          <TextField
            type="number"
            size="small"
            label="Rows"
            value={sizeInput}
            onChange={(e) => setSizeInput(e.target.value)}
            onBlur={commitSize}
            onKeyDown={(e) => { if (e.key === 'Enter') commitSize(); }}
            inputProps={{ min: 0 }}
            sx={{ width: 110 }}
          />
        )}
      </Box>
      {rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No items.</Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            {!gridElement.hideGridHeader && (
              <TableHead>
                <TableRow>
                  {columns.map(c => <TableCell key={c.variableName}>{c.label}</TableCell>)}
                </TableRow>
              </TableHead>
            )}
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.id} hover>
                  {columns.map(c => (
                    <TableCell key={c.variableName}>{renderCell(c, row.cells[c.variableName])}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ProductPickerGrid;
