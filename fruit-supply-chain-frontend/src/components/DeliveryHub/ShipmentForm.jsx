// fruit-supply-chain-frontend/src/components/DeliveryHub/ShipmentForm.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Alert,
} from "@mui/material";
import {
  LocalShipping as LocalShippingIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { getCustomers } from "../../services/deliveryHubService";

const ShipmentForm = ({ fruitItem, onSubmit, onCancel }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fruitId: fruitItem?.id || "",
    quantity: 1,
    customerId: "",
    deliveryAddress: "",
    deliveryDate: new Date(),
    notes: "",
  });

  const [formErrors, setFormErrors] = useState({
    quantity: "",
    customerId: "",
    deliveryAddress: "",
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const customersList = await getCustomers();
        setCustomers(customersList);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching customers:", err);
        setError("Không thể tải danh sách khách hàng. Vui lòng thử lại sau.");
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  useEffect(() => {
    if (fruitItem) {
      setFormData((prev) => ({
        ...prev,
        fruitId: fruitItem.id,
        quantity: 1,
      }));
    }
  }, [fruitItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleDateChange = (newDate) => {
    setFormData((prev) => ({
      ...prev,
      deliveryDate: newDate,
    }));
  };

  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      customerId,
    }));

    // Auto-fill delivery address if available
    const selectedCustomer = customers.find((c) => c.id === customerId);
    if (selectedCustomer?.address) {
      setFormData((prev) => ({
        ...prev,
        deliveryAddress: selectedCustomer.address,
      }));
    }

    // Clear error
    setFormErrors((prev) => ({
      ...prev,
      customerId: "",
    }));
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!formData.customerId) {
      errors.customerId = "Vui lòng chọn khách hàng";
      isValid = false;
    }

    if (!formData.deliveryAddress) {
      errors.deliveryAddress = "Vui lòng nhập địa chỉ giao hàng";
      isValid = false;
    }

    if (!formData.quantity || formData.quantity <= 0) {
      errors.quantity = "Số lượng phải lớn hơn 0";
      isValid = false;
    }

    if (fruitItem && formData.quantity > fruitItem.quantity) {
      errors.quantity = `Số lượng không thể vượt quá ${fruitItem.quantity}`;
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Transform data for API
    const shipmentData = {
      ...formData,
      fruitId: fruitItem.id,
      productName: fruitItem.productName,
      fruitType: fruitItem.fruitType,
    };

    onSubmit(shipmentData);
  };

  if (!fruitItem) {
    return (
      <Alert severity="error">
        Không có thông tin sản phẩm để tạo lô hàng. Vui lòng chọn sản phẩm từ
        kho hàng.
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Thông tin sản phẩm
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tên sản phẩm"
              value={fruitItem.productName}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Loại trái cây"
              value={fruitItem.fruitType}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Xuất xứ"
              value={fruitItem.origin}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Số lượng hiện có"
              value={fruitItem.quantity}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Thông tin giao hàng
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!formErrors.customerId}>
              <InputLabel>Khách hàng</InputLabel>
              <Select
                name="customerId"
                value={formData.customerId}
                onChange={handleCustomerChange}
                label="Khách hàng"
              >
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name} ({customer.email})
                  </MenuItem>
                ))}
              </Select>
              {formErrors.customerId && (
                <FormHelperText>{formErrors.customerId}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Số lượng gửi"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              InputProps={{
                inputProps: { min: 1, max: fruitItem.quantity },
              }}
              error={!!formErrors.quantity}
              helperText={formErrors.quantity}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Địa chỉ giao hàng"
              name="deliveryAddress"
              value={formData.deliveryAddress}
              onChange={handleChange}
              error={!!formErrors.deliveryAddress}
              helperText={formErrors.deliveryAddress}
              multiline
              rows={2}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Ngày giao hàng dự kiến"
              type="date"
              name="deliveryDate"
              value={new Date().toISOString().split("T")[0]}
              onChange={(e) =>
                handleChange({
                  target: {
                    name: "deliveryDate",
                    value: new Date(e.target.value),
                  },
                })
              }
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Ghi chú"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={3}
            />
          </Grid>

          <Grid item xs={12}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                mt: 2,
              }}
            >
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<CancelIcon />}
                onClick={onCancel}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<LocalShippingIcon />}
                disabled={loading}
              >
                Tạo lô hàng
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ShipmentForm;
