import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addFruitProduct } from "../../services/fruitService";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import "../FruitCatalog/CatalogStyles.css";

const AddFarmProductForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [snackOpen, setSnackOpen] = useState(false);

  // Xử lý countdown và chuyển hướng
  useEffect(() => {
    if (success) {
      setSnackOpen(true);

      const countdownInterval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            navigate("/farms");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(countdownInterval);
      };
    }
  }, [success, navigate]);

  const [product, setProduct] = useState({
    name: "",
    category: "ban cho",
    description: "",
    price: "",
    quantity: "",
    imageurl: "",
    productiondate: "",
    expirydate: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({
      ...product,
      [name]: value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Hình ảnh quá lớn! Vui lòng chọn hình ảnh dưới 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProduct({
          ...product,
          imageurl: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateProductCode = (name) => {
    const nameWithoutDiacritics = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
    const namePrefix = nameWithoutDiacritics
      .toUpperCase()
      .replace(/\s/g, "")
      .slice(0, 8);
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${namePrefix}${randomNum}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const productCode = generateProductCode(product.name);
      const productWithCode = {
        ...product,
        productcode: productCode,
      };

      await addFruitProduct(productWithCode);
      setLoading(false);
      setSuccess("Thêm sản phẩm thành công!");
      setRedirectCountdown(3);
    } catch (err) {
      console.error("Lỗi khi thêm sản phẩm:", err);
      setError(err.message || "Không thể thêm sản phẩm. Vui lòng thử lại sau.");
      setLoading(false);
    }
  };

  const handleCloseSnack = () => {
    setSnackOpen(false);
  };

  return (
    <Box sx={{ p: 3, maxWidth: "600px", margin: "0 auto" }}>
      <Paper
        elevation={0}
        sx={{ p: 4, borderRadius: 2, border: "1px solid #ddd" }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: "bold", color: "#000", mb: 3 }}
        >
          Thêm sản phẩm
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 3,
              display: "flex",
              alignItems: "center",
              backgroundColor: "#e8f5e9",
              border: "1px solid #81c784",
            }}
            icon={<CheckCircleIcon fontSize="inherit" />}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Typography variant="body1">
                {success} Bạn sẽ được chuyển hướng sau {redirectCountdown}{" "}
                giây...
              </Typography>
              {loading ? (
                <CircularProgress size={20} thickness={5} sx={{ ml: 2 }} />
              ) : (
                <Button
                  size="small"
                  onClick={() => navigate("/farms")}
                  sx={{ ml: 2 }}
                >
                  Đi ngay
                </Button>
              )}
            </Box>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nhập tên sản phẩm"
                name="name"
                value={product.name}
                onChange={handleChange}
                required
                variant="standard"
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth variant="standard" sx={{ mb: 2 }}>
                <InputLabel shrink>Phân loại</InputLabel>
                <Select
                  name="category"
                  value={product.category}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="ban cho">Bán cho</MenuItem>
                  <MenuItem value="nhap vao">Nhập vào</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nhập giá sản phẩm (AGT token)"
                name="price"
                type="number"
                value={product.price}
                onChange={handleChange}
                required
                variant="standard"
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nhập số lượng (Kg)"
                name="quantity"
                type="number"
                value={product.quantity}
                onChange={handleChange}
                required
                variant="standard"
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nhập thông tin mô tả sản phẩm tại đây..."
                name="description"
                value={product.description}
                onChange={handleChange}
                required
                variant="standard"
                InputLabelProps={{ shrink: true }}
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hình ảnh"
                name="imageUpload"
                type="file"
                onChange={handleImageChange}
                required
                InputLabelProps={{ shrink: true }}
                variant="standard"
                sx={{ mb: 2 }}
              />
              {product.imageurl && (
                <Box sx={{ mt: 2 }}>
                  <img
                    src={product.imageurl}
                    alt="Product preview"
                    style={{ maxWidth: "200px", borderRadius: "5px" }}
                  />
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ngày sản xuất"
                name="productiondate"
                type="date"
                value={product.productiondate}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
                variant="standard"
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ngày hết hạn"
                name="expirydate"
                type="date"
                value={product.expirydate}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
                variant="standard"
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || success}
                  sx={{
                    textTransform: "none",
                    fontWeight: "bold",
                    bgcolor: "#1976D2",
                    "&:hover": { bgcolor: "#115293" },
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : "Thêm sản phẩm"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar
        open={snackOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnack}
        message={success}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      />
    </Box>
  );
};

export default AddFarmProductForm;
