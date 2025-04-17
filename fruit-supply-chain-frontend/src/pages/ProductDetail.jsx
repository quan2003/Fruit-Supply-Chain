import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Rating,
  Grid,
  TextField,
  Autocomplete,
} from "@mui/material";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useWeb3 } from "../contexts/Web3Context";

const ProductDetail = () => {
  const { listingId } = useParams();
  const { user } = useAuth();
  const { account, web3, contract, executeTransaction } = useWeb3();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [averageRating, setAverageRating] = useState(0);
  const [userRating, setUserRating] = useState(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [quantityToBuy, setQuantityToBuy] = useState(1); // Thêm state để lưu số lượng mua

  const GEOAPIFY_API_KEY = "eddb3992b3f349be9c31e3697cdeb9f5";

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setLoading(true);

        const response = await axios.get(
          `http://localhost:3000/product-detail/${listingId}`
        );
        console.log("Product Detail Response:", response.data);
        setProduct(response.data);

        let available =
          response.data.status === "Available" && response.data.quantity > 0;

        if (contract) {
          const productResponse = await contract.methods
            .getListedProduct(listingId)
            .call();
          console.log("Listed Product từ blockchain:", productResponse);

          if (
            productResponse.isActive === false &&
            response.data.status === "Available"
          ) {
            console.log(
              "Đồng bộ trạng thái: Blockchain (isActive: false) -> Cơ sở dữ liệu (status: Sold)"
            );
            await axios.post(
              "http://localhost:3000/sync-product",
              {
                listingId: listingId,
                quantity: 0,
                status: "Sold",
              },
              {
                headers: { "x-ethereum-address": account },
              }
            );
            available = false;
          } else {
            available =
              available &&
              productResponse.isActive &&
              productResponse.quantity > 0;
          }
        }

        setIsAvailable(available);
        console.log("Tính khả dụng (isAvailable):", available);

        const ratingResponse = await axios.get(
          `http://localhost:3000/products/${listingId}/rating`
        );
        setAverageRating(parseFloat(ratingResponse.data.average_rating) || 0);

        if (user) {
          const purchaseCheck = await axios.get(
            `http://localhost:3000/orders/check-purchase`,
            {
              params: { customerId: user.id, listingId: listingId },
              headers: { "x-ethereum-address": account },
            }
          );
          setHasPurchased(purchaseCheck.data.hasPurchased);

          if (purchaseCheck.data.hasPurchased) {
            const userRatingResponse = await axios.get(
              `http://localhost:3000/products/${listingId}/user-rating`,
              {
                params: { userId: user.id },
                headers: { "x-ethereum-address": account },
              }
            );
            setUserRating(userRatingResponse.data.rating || null);
          }
        }
      } catch (err) {
        console.error("Lỗi khi lấy chi tiết sản phẩm:", err);
        setError("Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [listingId, contract, user, account]);

  const handleAddressSearch = async (value) => {
    if (!value || value.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    setAddressLoading(true);
    try {
      const response = await axios.get(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
          value
        )}&apiKey=${GEOAPIFY_API_KEY}`
      );
      const suggestions = response.data.features.map((feature) => ({
        label: feature.properties.formatted,
        value: feature.properties.formatted,
      }));
      setAddressSuggestions(suggestions);
    } catch (err) {
      console.error("Lỗi khi tìm kiếm địa chỉ với Geoapify:", err);
      setAddressSuggestions([]);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleRatingSubmit = async (newRating) => {
    if (!hasPurchased) {
      alert("Bạn cần mua sản phẩm trước khi đánh giá!");
      return;
    }

    try {
      await axios.post(
        `http://localhost:3000/products/${listingId}/rate`,
        {
          userId: user.id,
          rating: newRating,
        },
        {
          headers: { "x-ethereum-address": account },
        }
      );

      setUserRating(newRating);

      const ratingResponse = await axios.get(
        `http://localhost:3000/products/${listingId}/rating`
      );
      setAverageRating(parseFloat(ratingResponse.data.average_rating) || 0);

      alert("Đánh giá của bạn đã được gửi thành công!");
    } catch (err) {
      console.error("Lỗi khi gửi đánh giá:", err);
      alert("Không thể gửi đánh giá. Vui lòng thử lại!");
    }
  };

  const handleBuyProduct = async () => {
    if (!user || !user.id) {
      alert("Vui lòng đăng nhập để thực hiện giao dịch!");
      return;
    }

    if (!account || !web3 || !contract) {
      alert(
        "Vui lòng kết nối ví MetaMask và khởi tạo hợp đồng trước khi thực hiện giao dịch!"
      );
      return;
    }

    if (!isAvailable) {
      alert("Sản phẩm hiện không khả dụng để mua!");
      return;
    }

    if (!shippingAddress) {
      alert("Vui lòng nhập địa chỉ giao hàng!");
      return;
    }

    if (quantityToBuy <= 0 || quantityToBuy > product.quantity) {
      alert("Số lượng mua không hợp lệ! Vui lòng chọn số lượng phù hợp.");
      return;
    }

    setPurchaseLoading(true);
    try {
      console.log("User trước khi mua:", user);
      const buyData = {
        listingId: product.listing_id,
        customerId: user.id,
        quantity: quantityToBuy, // Sử dụng số lượng người dùng chọn
        price: product.price,
        deliveryHubId: product.delivery_hub_id,
        shippingAddress,
      };

      const totalPriceInWei = web3.utils.toWei(
        (parseFloat(product.price) * quantityToBuy).toString(),
        "ether"
      );

      const transactionResult = await executeTransaction({
        type: "purchaseProduct",
        listingId: product.listing_id,
        totalPrice: totalPriceInWei,
        quantity: quantityToBuy, // Truyền số lượng mua vào
      });

      console.log("Kết quả giao dịch blockchain:", transactionResult);

      buyData.transactionHash = transactionResult.transactionHash;

      console.log("Dữ liệu gửi lên API /buy-product:", buyData);

      try {
        const response = await axios.post(
          "http://localhost:3000/buy-product",
          buyData,
          {
            headers: { "x-ethereum-address": account },
          }
        );
        console.log("Kết quả từ /buy-product:", response.data);
      } catch (buyError) {
        console.error("Lỗi khi gọi /buy-product:", buyError);
        await axios.post(
          "http://localhost:3000/sync-product",
          {
            listingId: buyData.listingId,
            quantity: buyData.quantity,
            status: buyData.quantity >= product.quantity ? "Sold" : "Available",
          },
          {
            headers: { "x-ethereum-address": account },
          }
        );
      }

      setSuccessMessage("Mua sản phẩm thành công!");
      setIsAvailable(product.quantity - quantityToBuy > 0); // Cập nhật tính khả dụng
      setHasPurchased(true);
    } catch (error) {
      console.error("Lỗi khi mua sản phẩm:", error);
      alert(`Lỗi khi mua sản phẩm: ${error.message}`);
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!product) {
    return (
      <Typography variant="h6" sx={{ my: 2 }}>
        Không tìm thấy sản phẩm.
      </Typography>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {successMessage && (
        <Alert severity="success" sx={{ my: 2 }}>
          {successMessage}
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Box
            component="img"
            src={product.imageurl || "https://via.placeholder.com/300"}
            alt={product.name}
            sx={{ width: "100%", height: "auto", borderRadius: 2 }}
          />
        </Grid>
        <Grid item xs={12} md={8}>
          <Typography variant="h4" gutterBottom>
            {product.name}
          </Typography>
          <Typography variant="h5" color="primary" gutterBottom>
            {product.price} AGT
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Đánh giá trung bình:
            </Typography>
            <Rating value={averageRating} readOnly precision={0.5} />
          </Box>
          {hasPurchased && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Đánh giá của bạn:
              </Typography>
              <Rating
                value={userRating}
                onChange={(event, newValue) => {
                  if (newValue !== null) {
                    handleRatingSubmit(newValue);
                  }
                }}
                precision={0.5}
              />
            </Box>
          )}
          <Typography variant="body1" gutterBottom>
            Số lượng còn lại: {product.quantity} Kg
          </Typography>
          <TextField
            label="Số lượng muốn mua"
            type="number"
            value={quantityToBuy}
            onChange={(e) => setQuantityToBuy(parseInt(e.target.value) || 1)}
            inputProps={{ min: 1, max: product.quantity }}
            sx={{ mb: 2, width: "150px" }}
          />
          <Typography variant="body1" gutterBottom>
            Mô tả: {product.description || "Không có mô tả"}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Ngày sản xuất: {new Date(product.productdate).toLocaleDateString()}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Hạn sử dụng: {new Date(product.expirydate).toLocaleDateString()}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Nguồn gốc: {product.origin.farm_name} (
            {product.origin.farm_location})
          </Typography>
          <Typography variant="body1" gutterBottom>
            Chứng nhận: {product.origin.certification}
          </Typography>

          <Autocomplete
            freeSolo
            options={addressSuggestions}
            getOptionLabel={(option) => option.label || ""}
            onInputChange={(event, value) => {
              setShippingAddress(value);
              handleAddressSearch(value);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Địa chỉ giao hàng"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {addressLoading ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            onChange={(event, value) => {
              setShippingAddress(value ? value.value : "");
            }}
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handleBuyProduct}
            disabled={purchaseLoading || !isAvailable}
            sx={{ mt: 2 }}
          >
            {purchaseLoading ? <CircularProgress size={24} /> : "Mua ngay"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductDetail;
