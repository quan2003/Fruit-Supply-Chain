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
  Rating as MuiRating,
  TextField,
  Select,
  MenuItem,
  Slider,
  FormControl,
  InputLabel,
  Chip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import axios from "axios";
import { useWeb3 } from "../contexts/Web3Context";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import RefreshIcon from "@mui/icons-material/Refresh";
import InfoIcon from "@mui/icons-material/Info";
import SearchIcon from "@mui/icons-material/Search";
import { QRCodeSVG } from "qrcode.react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

// Danh sách các loại trái cây
const fruitTypes = [
  "Thơm",
  "Vú sữa",
  "Dưa hấu",
  "Măng cụt",
  "Thanh long",
  "Xoài",
];

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
  position: "relative",
  cursor: "pointer",
}));

const StyledCardMedia = styled(CardMedia)(({ theme }) => ({
  width: "100%",
  aspectRatio: "1/1",
  objectFit: "contain",
  padding: "8px",
  backgroundColor: "#f5f5f5",
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  maxHeight: "200px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  transition: "transform 0.3s ease-in-out",
  "&:hover": {
    transform: "scale(1.05)",
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
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState({ type: "", message: "" });
  const [productRatings, setProductRatings] = useState({});
  const [userRatings, setUserRatings] = useState({});
  const [deliveryHubs, setDeliveryHubs] = useState([]); // Danh sách đại lý
  const [searchCriteria, setSearchCriteria] = useState({
    fruitType: "",
    deliveryHub: "",
    priceRange: [0, 1000],
    productionDateRange: ["", ""],
  });

  const formatImageUrl = (imageUrl) => {
    if (!imageUrl) return "https://via.placeholder.com/150";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `${API_URL}${imageUrl}`;
  };

  const formatDate = (dateString) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) {
      return "Không có thông tin";
    }
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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
      const fetchedProducts = response.data;
      setProducts(fetchedProducts);
      setFilteredProducts(fetchedProducts);

      // Lấy danh sách đại lý từ dữ liệu sản phẩm
      const hubs = [
        ...new Set(fetchedProducts.map((p) => p.delivery_hub_name)),
      ];
      setDeliveryHubs(hubs);

      const ratings = {};
      for (const product of fetchedProducts) {
        const ratingResponse = await axios.get(
          `${API_URL}/products/${product.listing_id}/rating`,
          {
            headers: {
              "x-ethereum-address": account,
            },
          }
        );
        ratings[product.listing_id] = ratingResponse.data;
      }
      setProductRatings(ratings);

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

  useEffect(() => {
    // Lọc sản phẩm dựa trên tiêu chí tìm kiếm
    let filtered = products;

    // Lọc theo loại trái cây
    if (searchCriteria.fruitType) {
      filtered = filtered.filter((product) =>
        product.name
          .toLowerCase()
          .includes(searchCriteria.fruitType.toLowerCase())
      );
    }

    // Lọc theo đại lý
    if (searchCriteria.deliveryHub) {
      filtered = filtered.filter(
        (product) => product.delivery_hub_name === searchCriteria.deliveryHub
      );
    }

    // Lọc theo giá
    filtered = filtered.filter(
      (product) =>
        product.price >= searchCriteria.priceRange[0] &&
        product.price <= searchCriteria.priceRange[1]
    );

    // Lọc theo ngày sản xuất
    if (
      searchCriteria.productionDateRange[0] &&
      searchCriteria.productionDateRange[1]
    ) {
      const startDate = new Date(searchCriteria.productionDateRange[0]);
      const endDate = new Date(searchCriteria.productionDateRange[1]);
      filtered = filtered.filter((product) => {
        const productDate = new Date(product.productdate);
        return productDate >= startDate && productDate <= endDate;
      });
    }

    setFilteredProducts(filtered);
  }, [searchCriteria, products]);

  const handleBuyProduct = async (product, event) => {
    event.stopPropagation();
    if (!account || !user || user.role !== "Customer") {
      setAlertMessage({
        type: "error",
        message:
          "Vui lòng kết nối ví MetaMask và đăng nhập với vai trò người tiêu dùng!",
      });
      return;
    }

    try {
      setLoading(true);
      const totalPriceInWei = web3.utils.toWei(
        (product.price * 1).toString(),
        "ether"
      );
      const tx = await executeTransaction({
        type: "purchaseProduct",
        listingId: product.listing_id,
        totalPrice: totalPriceInWei,
      });

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
      await fetchProducts();
      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi mua sản phẩm:", error);
      setAlertMessage({
        type: "error",
        message: error.response?.data?.message || "Không thể mua sản phẩm.",
      });
      setLoading(false);
    }
  };

  const handleSubmitRating = async (productId, ratingValue, event) => {
    event.stopPropagation();
    if (
      !user ||
      !user.id ||
      !ratingValue ||
      ratingValue < 1 ||
      ratingValue > 5
    ) {
      setAlertMessage({
        type: "error",
        message: "Vui lòng chọn một mức đánh giá hợp lệ (1-5)!",
      });
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/products/${productId}/rating`,
        {
          rating: ratingValue,
          customerId: user.id,
        },
        {
          headers: {
            "x-ethereum-address": account,
          },
        }
      );

      if (response.status === 201) {
        setAlertMessage({
          type: "success",
          message: "Đánh giá đã được gửi thành công!",
        });

        const updatedRatingResponse = await axios.get(
          `${API_URL}/products/${productId}/rating`,
          {
            headers: {
              "x-ethereum-address": account,
            },
          }
        );
        setProductRatings((prev) => ({
          ...prev,
          [productId]: updatedRatingResponse.data,
        }));

        setUserRatings((prev) => ({
          ...prev,
          [productId]: ratingValue,
        }));
      }
    } catch (error) {
      console.error("Lỗi khi gửi đánh giá:", error);
      setAlertMessage({
        type: "error",
        message: error.response?.data?.message || "Không thể gửi đánh giá.",
      });
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setAlertMessage({ type: "", message: "" });
    setUserRatings({});
    setSearchCriteria({
      fruitType: "",
      deliveryHub: "",
      priceRange: [0, 1000],
      productionDateRange: ["", ""],
    });
    await fetchProducts();
  };

  const handleSearchChange = (key, value) => {
    setSearchCriteria((prev) => ({
      ...prev,
      [key]: value,
    }));
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
          Đang tải dữ liệu...
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

      {/* Bộ lọc tìm kiếm */}
      <Box
        sx={{
          mb: 4,
          p: 3,
          backgroundColor: "#f5f5f5",
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, color: "#FF6F91" }}>
          Tìm kiếm sản phẩm
        </Typography>
        <Grid container spacing={3}>
          {/* Lọc theo loại trái cây */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Loại trái cây</InputLabel>
              <Select
                value={searchCriteria.fruitType}
                label="Loại trái cây"
                onChange={(e) =>
                  handleSearchChange("fruitType", e.target.value)
                }
              >
                <MenuItem value="">Tất cả</MenuItem>
                {fruitTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Lọc theo đại lý */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Đại lý</InputLabel>
              <Select
                value={searchCriteria.deliveryHub}
                label="Đại lý"
                onChange={(e) =>
                  handleSearchChange("deliveryHub", e.target.value)
                }
              >
                <MenuItem value="">Tất cả</MenuItem>
                {deliveryHubs.map((hub) => (
                  <MenuItem key={hub} value={hub}>
                    {hub}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Lọc theo giá */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography gutterBottom>Khoảng giá (AGT)</Typography>
            <Slider
              value={searchCriteria.priceRange}
              onChange={(e, newValue) =>
                handleSearchChange("priceRange", newValue)
              }
              valueLabelDisplay="auto"
              min={0}
              max={1000}
              step={10}
              sx={{ color: "#FF6F91" }}
            />
            <Typography variant="body2" color="text.secondary">
              Từ {searchCriteria.priceRange[0]} đến{" "}
              {searchCriteria.priceRange[1]} AGT
            </Typography>
          </Grid>

          {/* Lọc theo ngày sản xuất */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography gutterBottom>Khoảng ngày sản xuất</Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                type="date"
                label="Từ ngày"
                value={searchCriteria.productionDateRange[0]}
                onChange={(e) =>
                  handleSearchChange("productionDateRange", [
                    e.target.value,
                    searchCriteria.productionDateRange[1],
                  ])
                }
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
              <TextField
                type="date"
                label="Đến ngày"
                value={searchCriteria.productionDateRange[1]}
                onChange={(e) =>
                  handleSearchChange("productionDateRange", [
                    searchCriteria.productionDateRange[0],
                    e.target.value,
                  ])
                }
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
            </Box>
          </Grid>
        </Grid>
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

      {filteredProducts.length === 0 ? (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            Không tìm thấy sản phẩm nào phù hợp.
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
          {filteredProducts.map((product) => {
            const ratingData = productRatings[product.listing_id] || {
              average_rating: 0,
              rating_count: 0,
            };
            const userRating = userRatings[product.listing_id] || 0;

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.listing_id}>
                <Fade in={true} timeout={500}>
                  <StyledCard
                    onClick={() =>
                      navigate(`/product-detail/${product.listing_id}`)
                    }
                  >
                    {/* Icon xem chi tiết ở góc trên cùng bên phải */}
                    <Tooltip title="Xem chi tiết">
                      <IconButton
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/product-detail/${product.listing_id}`);
                        }}
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          color: "#FF6F91",
                        }}
                      >
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>

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
                        sx={{ fontWeight: "bold", color: "#333", mb: 1 }}
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
                        sx={{ mb: 0.5 }}
                      >
                        Ngày sản xuất: {formatDate(product.productdate)}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        Ngày hết hạn: {formatDate(product.expirydate)}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        Đại lý: {product.delivery_hub_name}
                      </Typography>
                      {/* Hiển thị sao trung bình */}
                      <Box sx={{ mb: 1 }}>
                        <MuiRating
                          value={ratingData.average_rating}
                          precision={0.1}
                          readOnly
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                      {/* Hiển thị đánh giá của người dùng */}
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Đánh giá của bạn:
                        </Typography>
                        <MuiRating
                          value={userRating}
                          onChange={(event, newValue) =>
                            handleSubmitRating(
                              product.listing_id,
                              newValue,
                              event
                            )
                          }
                          precision={1}
                          readOnly={userRating > 0}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </CardContent>
                    <CardActions sx={{ justifyContent: "space-around", pb: 2 }}>
                      <StyledButton
                        variant="contained"
                        startIcon={<ShoppingCartIcon />}
                        onClick={(event) => handleBuyProduct(product, event)}
                        disabled={product.quantity === 0 || loading}
                      >
                        Mua ngay
                      </StyledButton>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Tooltip title="Quét để truy xuất nguồn gốc">
                          <QRCodeSVG
                            value={product.traceUrl}
                            size={60}
                            level="H"
                            includeMargin={true}
                            onClick={(event) => event.stopPropagation()}
                          />
                        </Tooltip>
                      </Box>
                    </CardActions>
                  </StyledCard>
                </Fade>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default ShopPage;
