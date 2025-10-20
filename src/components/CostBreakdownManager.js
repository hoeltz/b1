import React, { memo, useCallback, useMemo } from 'react';
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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { CURRENCIES } from '../data/locationData';
import { calculateOperationalCosts, calculateSellingCosts } from '../services/costUtils';

/**
 * Cost Item Component
 * Reusable component for displaying and editing individual costs
 */
const CostItem = memo(({
  cost,
  onUpdate,
  onRemove,
  type,
  baseAmount = 0,
  showMargin = false
}) => {
  const handleFieldChange = useCallback((field, value) => {
    if (cost[field] !== value) {
      onUpdate(type, cost.id, field, value);
    }
  }, [cost, onUpdate, type]);

  // Calculate converted amounts
  const convertedAmount = useMemo(() => {
    if (cost.currency === 'USD') {
      return (cost.amount * 15000).toLocaleString();
    }
    return cost.amount.toLocaleString();
  }, [cost.amount, cost.currency]);

  const baseAmountDisplay = useMemo(() => {
    if (cost.type === 'percentage') {
      const base = type === 'operationalCosts' ? baseAmount : (baseAmount * (cost.amount / 100));
      return base.toLocaleString();
    }
    return convertedAmount;
  }, [cost.type, cost.amount, type, baseAmount, convertedAmount]);

  const marginDisplay = useMemo(() => {
    if (cost.type === 'percentage') {
      const base = baseAmount * (cost.amount / 100);
      return base.toLocaleString();
    }
    return convertedAmount;
  }, [cost.type, cost.amount, baseAmount, convertedAmount]);

  return (
    <Card sx={{ mb: 1 }}>
      <CardContent sx={{ pb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={3}>
            <Typography variant="subtitle2">{cost.name}</Typography>
            <Typography variant="caption" color="textSecondary">
              {cost.description}
            </Typography>
          </Grid>

          <Grid item xs={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Currency</InputLabel>
              <Select
                value={cost.currency || 'IDR'}
                onChange={(e) => handleFieldChange('currency', e.target.value)}
                label="Currency"
              >
                {CURRENCIES.map(curr => (
                  <MenuItem key={curr.code} value={curr.code}>
                    {curr.code} - {curr.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={2}>
            <TextField
              fullWidth
              size="small"
              label={cost.type === 'percentage' ? 'Percentage (%)' : 'Amount'}
              type="number"
              value={cost.amount || 0}
              onChange={(e) => handleFieldChange('amount', parseFloat(e.target.value) || 0)}
            />
          </Grid>

          <Grid item xs={2}>
            <TextField
              fullWidth
              size="small"
              label="Converted (IDR)"
              value={convertedAmount}
              disabled
            />
          </Grid>

          {showMargin && (
            <Grid item xs={2}>
              <TextField
                fullWidth
                size="small"
                label="Margin"
                value={marginDisplay}
                disabled
                sx={{
                  '& .MuiInputBase-input': {
                    color: 'success.main',
                    fontWeight: 'bold'
                  }
                }}
              />
            </Grid>
          )}

          <Grid item xs={1}>
            <Box display="flex" gap={1} alignItems="center">
              <Chip
                label={cost.status || 'Draft'}
                size="small"
                color={cost.status === 'Approved' ? 'success' : 'warning'}
                variant="outlined"
              />
              <IconButton onClick={() => onRemove(type, cost.id)} color="error" size="small">
                <DeleteIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
});

CostItem.displayName = 'CostItem';

/**
 * Cost Section Component
 * Handles a group of costs (operational or selling)
 */
const CostSection = memo(({
  title,
  costs,
  costTemplates,
  onAddCost,
  onUpdateCost,
  onRemoveCost,
  type,
  baseAmount = 0,
  showMargin = false
}) => {
  const availableTemplates = useMemo(() => {
    return costTemplates.filter(template =>
      !costs.some(cost => cost.id === template.id)
    );
  }, [costTemplates, costs]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <Box display="flex" gap={1} mb={2} flexWrap="wrap">
        {availableTemplates.map(cost => (
          <Button
            key={cost.id}
            size="small"
            variant="outlined"
            onClick={() => onAddCost(cost)}
          >
            {cost.name}
          </Button>
        ))}
      </Box>

      {costs.map(cost => (
        <CostItem
          key={cost.id}
          cost={cost}
          onUpdate={onUpdateCost}
          onRemove={onRemoveCost}
          type={type}
          baseAmount={baseAmount}
          showMargin={showMargin}
        />
      ))}
    </Box>
  );
});

CostSection.displayName = 'CostSection';

/**
 * Cost Summary Component
 * Displays calculated totals for all costs
 */
const CostSummary = memo(({ operationalCosts, sellingCosts, estimatedCost, sellingPrice }) => {
  const calculations = useMemo(() => {
    const operationalTotal = calculateOperationalCosts(operationalCosts, estimatedCost);
    const sellingTotal = calculateSellingCosts(sellingCosts, sellingPrice);

    return {
      operationalTotal,
      sellingTotal,
      grandTotal: operationalTotal + sellingTotal
    };
  }, [operationalCosts, sellingCosts, estimatedCost, sellingPrice]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Cost Summary</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography>
              Total Operational Costs: IDR {calculations.operationalTotal.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography>
              Total Selling Costs: IDR {calculations.sellingTotal.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" color="primary">
              Grand Total: IDR {calculations.grandTotal.toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
});

CostSummary.displayName = 'CostSummary';

/**
 * Main Cost Breakdown Manager Component
 */
export const CostBreakdownManager = memo(({
  operationalCosts,
  sellingCosts,
  estimatedCost,
  sellingPrice,
  onAddOperationalCost,
  onAddSellingCost,
  onUpdateCost,
  onRemoveCost,
  standardCosts
}) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <CostSection
          title="Operational Costs"
          costs={operationalCosts}
          costTemplates={standardCosts.operational}
          onAddCost={onAddOperationalCost}
          onUpdateCost={onUpdateCost}
          onRemoveCost={onRemoveCost}
          type="operationalCosts"
          baseAmount={estimatedCost}
        />
      </Grid>

      <Grid item xs={12}>
        <CostSection
          title="Selling Costs & Pricing"
          costs={sellingCosts}
          costTemplates={standardCosts.selling}
          onAddCost={onAddSellingCost}
          onUpdateCost={onUpdateCost}
          onRemoveCost={onRemoveCost}
          type="sellingCosts"
          baseAmount={sellingPrice}
          showMargin={true}
        />
      </Grid>

      <Grid item xs={12}>
        <CostSummary
          operationalCosts={operationalCosts}
          sellingCosts={sellingCosts}
          estimatedCost={estimatedCost}
          sellingPrice={sellingPrice}
        />
      </Grid>
    </Grid>
  );
});

CostBreakdownManager.displayName = 'CostBreakdownManager';

export default CostBreakdownManager;