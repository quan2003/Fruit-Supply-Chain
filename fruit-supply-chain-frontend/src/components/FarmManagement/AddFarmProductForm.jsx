// src/components/FarmManagement/AddFarmProductForm.jsx
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
} from "@mui/material";
import "../FruitCatalog/CatalogStyles.css";

const AddFarmProductForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [farms, setFarms] = useState([]); // Danh sách farm của producer
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const [product, setProduct] = useState({
    name: "",
    category: "ban cho",
    description: "",
    price: "",
    quantity: "",
    productiondate: "",
    expirydate: "",
    farm_id: "", // Sẽ được cập nhật sau khi lấy danh sách farm
  });

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/farms/user?email=${user.email}`
        );
        const data = await response.json();
        if (response.ok && data.length > 0) {
          setFarms(data);
          setProduct((prev) => ({ ...prev, farm_id: data[0].id })); // Chọn farm đầu tiên mặc định
        } else {
          setError("Không tìm thấy farm của bạn! Vui lòng tạo farm trước.");
        }
      } catch (err) {
        setError("Không thể lấy danh sách farm. Vui lòng thử lại sau.");
      }
    };

    if (user.email) {
      fetchFarms();
    } else {
      setError("Vui lòng đăng nhập để thêm sản phẩm!");
    }
  }, [user.email]);

  useEffect(() => {
    if (success) {
      setRedirecting(true);
      const timer = setTimeout(() => {
        navigate("/farms/products");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

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
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
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

      const formData = new FormData();
      formData.append("name", product.name);
      formData.append("productcode", productCode);
      formData.append("category", product.category);
      formData.append("description", product.description);
      formData.append("price", product.price);
      formData.append("quantity", product.quantity);
      formData.append("image", imageFile);
      formData.append("productdate", product.productiondate);
      formData.append("expirydate", product.expirydate);
      formData.append("farm_id", product.farm_id);
      formData.append("email", user.email); // Truyền email để backend kiểm tra

      await addFruitProduct(formData);
      setLoading(false);
      setSuccess("Thêm sản phẩm thành công!");
    } catch (err) {
      console.error("Lỗi khi thêm sản phẩm:", err);
      setError(err.message || "Không thể thêm sản phẩm. Vui lòng thử lại sau.");
      setLoading(false);
    }
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
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
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
              {imagePreview && (
                <Box sx={{ mt: 2 }}>
                  <img
                    src={imagePreview}
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
              <FormControl fullWidth variant="standard" sx={{ mb: 2 }}>
                <InputLabel shrink>Farm</InputLabel>
                <Select
                  name="farm_id"
                  value={product.farm_id}
                  onChange={handleChange}
                  required
                >
                  {farms.map((farm) => (
                    <MenuItem key={farm.id} value={farm.id}>
                      {farm.farm_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
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
    </Box>
  );
};

export default AddFarmProductForm;
