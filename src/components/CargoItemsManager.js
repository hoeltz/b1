import React, { memo, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  FormControlLabel,
  Switch,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { CARGO_TYPES } from '../data/locationData';

/**
 * Optimized Cargo Items Manager Component
 * Handles all cargo item operations with performance optimizations
 */
const CargoItemCard = memo(({ item, index, onUpdate, onRemove, hsCodes, getFieldProps, getFieldStateColor, getFieldStateIcon, FIELD_STATES }) => {
  const handleFieldChange = useCallback((field, value) => {
    if (item[field] !== value) {
      onUpdate(item.id, field, value);
    }
  }, [item, onUpdate]);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Description"
              value={item.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Cargo Type</InputLabel>
              <Select
                value={item.type || ''}
                onChange={(e) => handleFieldChange('type', e.target.value)}
                label="Cargo Type"
              >
                {CARGO_TYPES.map(type => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Weight (kg)"
              type="number"
              value={item.weight || 0}
              onChange={(e) => handleFieldChange('weight', parseFloat(e.target.value) || 0)}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Volume (cbm)"
              type="number"
              value={item.volume || 0}
              onChange={(e) => handleFieldChange('volume', parseFloat(e.target.value) || 0)}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Value (IDR)"
              type="number"
              value={item.value || 0}
              onChange={(e) => handleFieldChange('value', parseFloat(e.target.value) || 0)}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Value (USD)"
              type="number"
              value={item.valueUSD || 0}
              onChange={(e) => handleFieldChange('valueUSD', parseFloat(e.target.value) || 0)}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Currency</InputLabel>
              <Select
                value={item.currency || 'IDR'}
                onChange={(e) => handleFieldChange('currency', e.target.value)}
                label="Currency"
              >
                <MenuItem value="IDR">IDR (Rupiah)</MenuItem>
                <MenuItem value="USD">USD (Dollar)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Container Type</InputLabel>
              <Select
                value={item.containerType || ''}
                onChange={(e) => handleFieldChange('containerType', e.target.value)}
                label="Container Type"
              >
                <MenuItem value="Dry">Dry Container</MenuItem>
                <MenuItem value="Reefer">Reefer Container</MenuItem>
                <MenuItem value="Open Top">Open Top Container</MenuItem>
                <MenuItem value="Flat Rack">Flat Rack Container</MenuItem>
                <MenuItem value="Tank">Tank Container</MenuItem>
                <MenuItem value="Bulk">Bulk Container</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Container Size</InputLabel>
              <Select
                value={item.containerSize || ''}
                onChange={(e) => handleFieldChange('containerSize', e.target.value)}
                label="Container Size"
              >
                <MenuItem value="20ft">20 feet</MenuItem>
                <MenuItem value="40ft">40 feet</MenuItem>
                <MenuItem value="40ft HC">40 feet HC</MenuItem>
                <MenuItem value="45ft">45 feet</MenuItem>
                <MenuItem value="20ft Reefer">20ft Reefer</MenuItem>
                <MenuItem value="40ft Reefer">40ft Reefer</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Container Qty"
              type="number"
              value={item.containerQuantity || 1}
              onChange={(e) => handleFieldChange('containerQuantity', parseInt(e.target.value) || 1)}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <Autocomplete
              options={hsCodes}
              getOptionLabel={(option) => `${option.code} - ${option.description}`}
              value={hsCodes.find(hs => hs.code === item.hsCode) || null}
              onChange={(event, newValue) => {
                handleFieldChange('hsCode', newValue?.code || '');
                handleFieldChange('hsCodeDescription', newValue?.description || '');
                handleFieldChange('importDuty', newValue?.importDuty || 0);
                handleFieldChange('vat', newValue?.vat || 11);
                handleFieldChange('excise', newValue?.excise || 0);
              }}
              renderInput={(params) => (
                <TextField {...params} label="HS Code" fullWidth />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Freight Cost (IDR)"
              type="number"
              value={item.freightCost || 0}
              onChange={(e) => handleFieldChange('freightCost', parseFloat(e.target.value) || 0)}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Freight Cost (USD)"
              type="number"
              value={item.freightCostUSD || 0}
              onChange={(e) => handleFieldChange('freightCostUSD', parseFloat(e.target.value) || 0)}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Insurance Cost (IDR)"
              type="number"
              value={item.insuranceCost || 0}
              onChange={(e) => handleFieldChange('insuranceCost', parseFloat(e.target.value) || 0)}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Insurance Cost (USD)"
              type="number"
              value={item.insuranceCostUSD || 0}
              onChange={(e) => handleFieldChange('insuranceCostUSD', parseFloat(e.target.value) || 0)}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <Box display="flex" gap={1} alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={item.hazardous}
                    onChange={(e) => handleFieldChange('hazardous', e.target.checked)}
                  />
                }
                label="Hazardous"
              />
              <IconButton onClick={() => onRemove(item.id)} color="error">
                <DeleteIcon />
              </IconButton>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Special Handling Requirements"
              value={item.specialHandling || ''}
              onChange={(e) => handleFieldChange('specialHandling', e.target.value)}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
});

CargoItemCard.displayName = 'CargoItemCard';

/**
 * HS Code Cost Calculator Component
 */
const HSCostCalculator = memo(({ cargoItems }) => {
  const calculateHSCosts = useCallback((items) => {
    return items.map(item => {
      if (!item.hsCode || !item.value) {
        return {
          ...item,
          cifValue: 0,
          importDuty: 0,
          vat: 0,
          excise: 0,
          totalCost: 0
        };
      }

      const cifValue = parseFloat(item.value) || 0;
      const importDuty = cifValue * (item.importDuty / 100);
      const vatBase = cifValue + importDuty;
      const vat = vatBase * (item.vat / 100);
      const excise = cifValue * (item.excise / 100);
      const totalCost = cifValue + importDuty + vat + excise;

      return {
        ...item,
        cifValue,
        importDuty,
        vat,
        excise,
        totalCost
      };
    });
  }, []);

  const itemsWithCosts = calculateHSCosts(cargoItems);

  if (cargoItems.length === 0) {
    return (
      <Alert severity="info">No cargo items added yet. Click "Add Cargo Item" to begin.</Alert>
    );
  }

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>HS Code Cost Breakdown</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>HS Code</TableCell>
                <TableCell align="right">CIF Value</TableCell>
                <TableCell align="right">Import Duty</TableCell>
                <TableCell align="right">VAT</TableCell>
                <TableCell align="right">Total Cost</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {itemsWithCosts.map((item) => {
                if (!item.hsCode || !item.value) return null;

                return (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {item.hsCode}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(item.cifValue)}
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="error.main">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        }).format(item.importDuty)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="warning.main">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        }).format(item.vat)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" color="success.main">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        }).format(item.totalCost)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
});

HSCostCalculator.displayName = 'HSCostCalculator';

/**
 * Main Cargo Items Manager Component
 */
export const CargoItemsManager = memo(({
  cargoItems,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  hsCodes,
  getFieldProps,
  getFieldStateColor,
  getFieldStateIcon,
  FIELD_STATES
}) => {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Cargo Items</Typography>
        <Button startIcon={<AddIcon />} onClick={onAddItem}>
          Add Cargo Item
        </Button>
      </Box>

      {cargoItems.map((item, index) => (
        <CargoItemCard
          key={item.id}
          item={item}
          index={index}
          onUpdate={onUpdateItem}
          onRemove={onRemoveItem}
          hsCodes={hsCodes}
          getFieldProps={getFieldProps}
          getFieldStateColor={getFieldStateColor}
          getFieldStateIcon={getFieldStateIcon}
          FIELD_STATES={FIELD_STATES}
        />
      ))}

      <HSCostCalculator cargoItems={cargoItems} />
    </Box>
  );
});

CargoItemsManager.displayName = 'CargoItemsManager';

export default CargoItemsManager;