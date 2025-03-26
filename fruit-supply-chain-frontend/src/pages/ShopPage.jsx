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
  Box,
  Fade,
  IconButton,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import axios from "axios";
import { useWeb3 } from "../contexts/Web3Context";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import RefreshIcon from "@mui/icons-material/Refresh";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

// Styled components để tùy chỉnh giao diện
const StyledCard = styled(Card)(({ theme }) => ({
  boxShadow: theme.shadows[3],
  borderRadius: theme.shape.borderRadius * 2,
  transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
  "&:hover": {
    transform: "scale(1.05)",
    boxShadow: theme.shadows[6],
  },
  maxWidth: 300,
  margin: "0 auto",
  backgroundColor: theme.palette.background.paper,
  display: "flex",
  flexDirection: "column",
  height: "100%",
}));

const StyledCardMedia = styled(CardMedia)(({ theme }) => ({
  width: "100%",
  aspectRatio: "1/1", // Tỷ lệ 1:1 để hình ảnh hiển thị đầy đủ
  objectFit: "contain", // Hiển thị toàn bộ hình ảnh, không cắt
  padding: "8px", // Thêm padding để tạo khoảng cách
  backgroundColor: "#f5f5f5", // Nền nhạt để hình ảnh nổi bật
  borderRadius: "8px", // Bo góc hình ảnh
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)", // Thêm bóng nhẹ
  maxHeight: "200px", // Giới hạn chiều cao tối đa
  display: "flex", // Căn giữa hình ảnh
  justifyContent: "center",
  alignItems: "center",
  transition: "transform 0.3s ease-in-out",
  "&:hover": {
    transform: "scale(1.05)", // Hiệu ứng phóng to khi hover
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#FF6F91",
  "&:hover": {
    backgroundColor: "#FF4D73",
  },
  fontWeight: "bold",
  padding: "6px 16px",
  fontSize: "0.875rem",
  borderRadius: theme.shape.borderRadius,
  textTransform: "none",
}));

const ShopPage = () => {
  const { account, walletError, connectWallet, web3, executeTransaction } =
    useWeb3();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState({ type: "", message: "" });

  const formatImageUrl = (imageUrl) => {
    if (!imageUrl) return "https://via.placeholder.com/150";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `http://localhost:3000${imageUrl}`;
  };

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

  useEffect(() => {
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

      // Tính tổng giá trị giao dịch
      const totalPriceInWei = web3.utils.toWei(
        (product.price * 1).toString(),
        "ether"
      );

      // Gọi giao dịch blockchain
      const tx = await executeTransaction({
        type: "purchaseProduct",
        listingId: product.listing_id,
        totalPrice: totalPriceInWei,
      });

      // Gọi API để lưu giao dịch
      const response = await axios.post(
        `${API_URL}/buy-product`,
        {
          listingId: product.listing_id,
          customerId: user.id,
          quantity: 1,
          price: product.price,
          deliveryHubId: product.delivery_hub_id,
          transactionHash: tx.transactionHash,
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

      // Làm mới danh sách sản phẩm
      await fetchProducts();

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

  const handleRefresh = async () => {
    setLoading(true);
    setAlertMessage({ type: "", message: "" });
    await fetchProducts();
  };

  if (!account) {
    return (
      <Container sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Vui lòng kết nối ví MetaMask để mua sắm!
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={connectWallet}
          sx={{ mt: 2, bgcolor: "#FF6F91", "&:hover": { bgcolor: "#FF4D73" } }}
        >
          Kết nối ví MetaMask
        </Button>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container sx={{ textAlign: "center", mt: 4 }}>
        <CircularProgress sx={{ color: "#FF6F91" }} />
        <Typography variant="body1" sx={{ mt: 2, color: "text.secondary" }}>
          Đang tải sản phẩm...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#FF6F91" }}>
          Cửa hàng trái cây
        </Typography>
        <Tooltip title="Làm mới danh sách">
          <IconButton onClick={handleRefresh} sx={{ color: "#FF6F91" }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {walletError && (
        <Fade in={!!walletError}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {walletError}
          </Alert>
        </Fade>
      )}
      {alertMessage.message && (
        <Fade in={!!alertMessage.message}>
          <Alert severity={alertMessage.type} sx={{ mb: 2 }}>
            {alertMessage.message}
          </Alert>
        </Fade>
      )}

      {products.length === 0 ? (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            Hiện tại không có sản phẩm nào để bán.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ mt: 2, color: "#FF6F91", borderColor: "#FF6F91" }}
          >
            Làm mới
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.listing_id}>
              <Fade in={true} timeout={500}>
                <StyledCard>
                  <StyledCardMedia
                    component="img"
                    image={formatImageUrl(product.imageurl)}
                    alt={product.name}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/150";
                      setAlertMessage({
                        type: "warning",
                        message: `Không thể tải hình ảnh cho sản phẩm ${product.name}.`,
                      });
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1, padding: "12px 16px" }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: "bold",
                        color: "#333",
                        mb: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {product.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Giá: {product.price} AGT
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Số lượng: {product.quantity}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Trung tâm phân phối: {product.delivery_hub_name}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                    <StyledButton
                      variant="contained"
                      startIcon={<ShoppingCartIcon />}
                      onClick={() => handleBuyProduct(product)}
                      disabled={product.quantity === 0 || loading}
                    >
                      Mua ngay
                    </StyledButton>
                  </CardActions>
                </StyledCard>
              </Fade>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ShopPage;
