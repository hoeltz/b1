import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Inventory as InventoryIcon,
  LocationOn as LocationIcon,
  LocalShipping as ShippingIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import dataSyncService from '../services/dataSync';
import notificationService from '../services/notificationService';

const WarehouseForm = ({ open, onClose, warehouse, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    type: 'Main Warehouse',
    capacity: '',
    currentStock: '',
    manager: '',
    contactNumber: '',
    address: '',
    description: '',
    status: 'Active'
  });

  useEffect(() => {
    if (warehouse) {
      setFormData(warehouse);
    } else {
      setFormData({
        name: '',
        code: '',
        location: '',
        type: 'Main Warehouse',
        capacity: '',
        currentStock: '',
        manager: '',
        contactNumber: '',
        address: '',
        description: '',
        status: 'Active'
      });
    }
  }, [warehouse]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving warehouse:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {warehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Warehouse Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Warehouse Code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Warehouse Type</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleChange}
                label="Warehouse Type"
              >
                <MenuItem value="Main Warehouse">Main Warehouse</MenuItem>
                <MenuItem value="Distribution Center">Distribution Center</MenuItem>
                <MenuItem value="Regional Warehouse">Regional Warehouse</MenuItem>
                <MenuItem value="Transit Warehouse">Transit Warehouse</MenuItem>
                <MenuItem value="Cold Storage">Cold Storage</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Capacity (sqm)"
              name="capacity"
              type="number"
              value={formData.capacity}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Current Stock Level"
              name="currentStock"
              type="number"
              value={formData.currentStock}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Manager"
              name="manager"
              value={formData.manager}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Number"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {warehouse ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const InventoryForm = ({ open, onClose, item, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    quantity: '',
    minStock: '',
    maxStock: '',
    unit: 'pcs',
    location: '',
    supplier: '',
    costPrice: '',
    sellingPrice: '',
    description: '',
    expiryDate: '',
    batchNumber: ''
  });

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        name: '',
        sku: '',
        category: '',
        quantity: '',
        minStock: '',
        maxStock: '',
        unit: 'pcs',
        location: '',
        supplier: '',
        costPrice: '',
        sellingPrice: '',
        description: '',
        expiryDate: '',
        batchNumber: ''
      });
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving inventory item:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {item ? 'Edit Inventory Item' : 'Add New Inventory Item'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Item Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="SKU"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Unit</InputLabel>
              <Select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                label="Unit"
              >
                <MenuItem value="pcs">Pieces</MenuItem>
                <MenuItem value="kg">Kilograms</MenuItem>
                <MenuItem value="liter">Liters</MenuItem>
                <MenuItem value="box">Boxes</MenuItem>
                <MenuItem value="pallet">Pallets</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Min Stock"
              name="minStock"
              type="number"
              value={formData.minStock}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Max Stock"
              name="maxStock"
              type="number"
              value={formData.maxStock}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Cost Price"
              name="costPrice"
              type="number"
              value={formData.costPrice}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Selling Price"
              name="sellingPrice"
              type="number"
              value={formData.sellingPrice}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Supplier"
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Batch Number"
              name="batchNumber"
              value={formData.batchNumber}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Expiry Date"
              name="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {item ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const WarehouseManagement = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [warehouseDialog, setWarehouseDialog] = useState(false);
  const [inventoryDialog, setInventoryDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuType, setMenuType] = useState('');
  const [menuId, setMenuId] = useState(null);

  useEffect(() => {
    loadWarehouses();
    loadInventory();
  }, []);

  const loadWarehouses = async () => {
    try {
      // Mock data for warehouses
      const mockWarehouses = [
        {
          id: '1',
          name: 'Jakarta Main Warehouse',
          code: 'JKT-MW-001',
          location: 'Jakarta',
          type: 'Main Warehouse',
          capacity: 5000,
          currentStock: 3200,
          manager: 'Budi Santoso',
          contactNumber: '08123456789',
          address: 'Jl. Raya Jakarta No. 123',
          description: 'Main warehouse for Jakarta region',
          status: 'Active'
        },
        {
          id: '2',
          name: 'Surabaya Distribution Center',
          code: 'SBY-DC-001',
          location: 'Surabaya',
          type: 'Distribution Center',
          capacity: 3000,
          currentStock: 1800,
          manager: 'Siti Nurhaliza',
          contactNumber: '08198765432',
          address: 'Jl. Raya Surabaya No. 456',
          description: 'Distribution center for East Java',
          status: 'Active'
        }
      ];
      setWarehouses(mockWarehouses);
    } catch (error) {
      console.error('Error loading warehouses:', error);
    }
  };

  const loadInventory = async () => {
    try {
      // Mock data for inventory
      const mockInventory = [
        {
          id: '1',
          name: 'Laptop Dell Inspiron',
          sku: 'LT-DELL-001',
          category: 'Electronics',
          quantity: 50,
          minStock: 10,
          maxStock: 100,
          unit: 'pcs',
          location: 'JKT-MW-001-A1',
          supplier: 'Dell Indonesia',
          costPrice: 8000000,
          sellingPrice: 9500000,
          description: 'Dell Inspiron 15 3000 series',
          expiryDate: '',
          batchNumber: 'BATCH-2024-001'
        },
        {
          id: '2',
          name: 'Office Chair',
          sku: 'FR-CH-001',
          category: 'Furniture',
          quantity: 25,
          minStock: 5,
          maxStock: 50,
          unit: 'pcs',
          location: 'JKT-MW-001-B2',
          supplier: 'Furniture Corp',
          costPrice: 500000,
          sellingPrice: 750000,
          description: 'Ergonomic office chair',
          expiryDate: '',
          batchNumber: 'BATCH-2024-002'
        }
      ];
      setInventory(mockInventory);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  const handleWarehouseSave = async (warehouseData) => {
    try {
      if (selectedWarehouse) {
        setWarehouses(prev => prev.map(w => w.id === selectedWarehouse.id ? { ...warehouseData, id: selectedWarehouse.id } : w));
        notificationService.showSuccess('Warehouse updated successfully');
      } else {
        const newWarehouse = { ...warehouseData, id: Date.now().toString() };
        setWarehouses(prev => [...prev, newWarehouse]);
        notificationService.showSuccess('Warehouse created successfully');
      }
    } catch (error) {
      notificationService.showError('Failed to save warehouse');
    }
  };

  const handleInventorySave = async (itemData) => {
    try {
      if (selectedInventoryItem) {
        setInventory(prev => prev.map(item => item.id === selectedInventoryItem.id ? { ...itemData, id: selectedInventoryItem.id } : item));
        notificationService.showSuccess('Inventory item updated successfully');
      } else {
        const newItem = { ...itemData, id: Date.now().toString() };
        setInventory(prev => [...prev, newItem]);
        notificationService.showSuccess('Inventory item created successfully');
      }
    } catch (error) {
      notificationService.showError('Failed to save inventory item');
    }
  };

  const handleDeleteWarehouse = async (id) => {
    try {
      setWarehouses(prev => prev.filter(w => w.id !== id));
      notificationService.showSuccess('Warehouse deleted successfully');
    } catch (error) {
      notificationService.showError('Failed to delete warehouse');
    }
  };

  const handleDeleteInventory = async (id) => {
    try {
      setInventory(prev => prev.filter(item => item.id !== id));
      notificationService.showSuccess('Inventory item deleted successfully');
    } catch (error) {
      notificationService.showError('Failed to delete inventory item');
    }
  };

  const getStockStatus = (item) => {
    const quantity = parseInt(item.quantity);
    const minStock = parseInt(item.minStock);

    if (quantity === 0) return { status: 'Out of Stock', color: 'error' };
    if (quantity <= minStock) return { status: 'Low Stock', color: 'warning' };
    return { status: 'In Stock', color: 'success' };
  };

  const filteredWarehouses = warehouses.filter(warehouse =>
    warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Warehouse Management</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedWarehouse(null);
              setWarehouseDialog(true);
            }}
          >
            Add Warehouse
          </Button>
          <Button
            variant="contained"
            startIcon={<InventoryIcon />}
            onClick={() => {
              setSelectedInventoryItem(null);
              setInventoryDialog(true);
            }}
          >
            Add Inventory Item
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            label="Search warehouses and inventory..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </CardContent>
      </Card>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<LocationIcon />} label="Warehouses" />
          <Tab icon={<InventoryIcon />} label="Inventory" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Warehouse Info</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Stock Level</TableCell>
                <TableCell>Manager</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredWarehouses.map((warehouse) => (
                <TableRow key={warehouse.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{warehouse.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {warehouse.code}
                    </Typography>
                  </TableCell>
                  <TableCell>{warehouse.type}</TableCell>
                  <TableCell>{warehouse.location}</TableCell>
                  <TableCell>
                    {warehouse.capacity.toLocaleString()} sqm
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2">
                        {warehouse.currentStock.toLocaleString()} / {warehouse.capacity.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        ({Math.round((warehouse.currentStock / warehouse.capacity) * 100)}%)
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{warehouse.manager}</TableCell>
                  <TableCell>
                    <Chip
                      label={warehouse.status}
                      color={warehouse.status === 'Active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setAnchorEl(e.currentTarget);
                        setMenuType('warehouse');
                        setMenuId(warehouse.id);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {activeTab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item Details</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Stock Status</TableCell>
                <TableCell>Value</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item);
                return (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{item.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {item.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {item.sku}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.quantity} {item.unit}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>
                      <Chip
                        label={stockStatus.status}
                        color={stockStatus.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Cost: Rp {item.costPrice.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        Sell: Rp {item.sellingPrice.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setAnchorEl(e.currentTarget);
                          setMenuType('inventory');
                          setMenuId(item.id);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {menuType === 'warehouse' && (
          <>
            <MenuItem onClick={() => {
              setSelectedWarehouse(warehouses.find(w => w.id === menuId));
              setWarehouseDialog(true);
              setAnchorEl(null);
            }}>
              <EditIcon sx={{ mr: 1 }} />
              Edit
            </MenuItem>
            <MenuItem onClick={() => {
              handleDeleteWarehouse(menuId);
              setAnchorEl(null);
            }}>
              <DeleteIcon sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          </>
        )}
        {menuType === 'inventory' && (
          <>
            <MenuItem onClick={() => {
              setSelectedInventoryItem(inventory.find(item => item.id === menuId));
              setInventoryDialog(true);
              setAnchorEl(null);
            }}>
              <EditIcon sx={{ mr: 1 }} />
              Edit
            </MenuItem>
            <MenuItem onClick={() => {
              handleDeleteInventory(menuId);
              setAnchorEl(null);
            }}>
              <DeleteIcon sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          </>
        )}
      </Menu>

      <WarehouseForm
        open={warehouseDialog}
        onClose={() => {
          setWarehouseDialog(false);
          setSelectedWarehouse(null);
        }}
        warehouse={selectedWarehouse}
        onSave={handleWarehouseSave}
      />

      <InventoryForm
        open={inventoryDialog}
        onClose={() => {
          setInventoryDialog(false);
          setSelectedInventoryItem(null);
        }}
        item={selectedInventoryItem}
        onSave={handleInventorySave}
      />
    </Box>
  );
};

export default WarehouseManagement;