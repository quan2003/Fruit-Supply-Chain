// pages/ShopPage.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import { useWeb3 } from "../contexts/Web3Context";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const ShopPage = () => {
  const { account, walletError } = useWeb3();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState({ type: "", message: "" });

  useEffect(() => {
    const fetchProducts = async () => {
      if (!account) {
        setAlertMessage({
          type: "error",
          message: "Vui lòng kết nối ví MetaMask để mua sắm!",
        });
        setLoading(false);
        return;
      }

      if (!user?.id || user.role !== "Customer") {
        setAlertMessage({
          type: "error",
          message: "Vui lòng đăng nhập với vai trò người tiêu dùng để mua sắm!",
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/all-outgoing-products`, {
          headers: {
            "x-ethereum-address": account,
          },
        });
        setProducts(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm:", error);
        setAlertMessage({
          type: "error",
          message: "Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.",
        });
        setLoading(false);
      }
    };

    fetchProducts();
  }, [account, user]);

  const handleBuyProduct = async (product) => {
    if (!account) {
      setAlertMessage({
        type: "error",
        message: "Vui lòng kết nối ví MetaMask để mua hàng!",
      });
      return;
    }

    if (!user || user.role !== "Customer") {
      setAlertMessage({
        type: "error",
        message: "Vui lòng đăng nhập với vai trò người tiêu dùng để mua hàng!",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/buy-product`,
        {
          listingId: product.listing_id,
          customerId: user.id,
          quantity: 1, // Có thể thêm giao diện để người dùng chọn số lượng
          price: product.price,
          deliveryHubId: product.delivery_hub_id,
        },
        {
          headers: {
            "x-ethereum-address": account,
          },
        }
      );

      setAlertMessage({
        type: "success",
        message: "Mua sản phẩm thành công! Đơn hàng đang được xử lý.",
      });

      // Cập nhật lại danh sách sản phẩm sau khi mua
      const updatedProducts = await axios.get(
        `${API_URL}/all-outgoing-products`,
        {
          headers: {
            "x-ethereum-address": account,
          },
        }
      );
      setProducts(updatedProducts.data);

      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi mua sản phẩm:", error);
      setAlertMessage({
        type: "error",
        message:
          error.response?.data?.message ||
          "Không thể mua sản phẩm. Vui lòng thử lại sau.",
      });
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ textAlign: "center", mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: "bold", color: "#FF6F91" }}
      >
        Cửa hàng trái cây
      </Typography>
      {walletError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {walletError}
        </Alert>
      )}
      {alertMessage.message && (
        <Alert severity={alertMessage.type} sx={{ mb: 2 }}>
          {alertMessage.message}
        </Alert>
      )}
      {products.length === 0 ? (
        <Typography variant="h6" sx={{ textAlign: "center", mt: 4 }}>
          Hiện tại không có sản phẩm nào để bán.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} key={product.listing_id}>
              <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={product.imageurl || "https://via.placeholder.com/150"}
                  alt={product.name}
                  sx={{ objectFit: "cover" }}
                />
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Giá: {product.price} AGT
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Số lượng: {product.quantity}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Trung tâm phân phối: {product.delivery_hub_name}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleBuyProduct(product)}
                    disabled={product.quantity === 0 || loading}
                    sx={{
                      bgcolor: "#FF6F91",
                      "&:hover": { bgcolor: "#FF4D73" },
                      fontWeight: "bold",
                    }}
                  >
                    Mua ngay
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ShopPage;
