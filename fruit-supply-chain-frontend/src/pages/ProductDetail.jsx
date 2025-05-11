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
  Modal,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useWeb3 } from "../contexts/Web3Context";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import StoreIcon from "@mui/icons-material/Store";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import debounce from "lodash/debounce";

// Định nghĩa hằng số
const API_URL = "http://localhost:3000";
const SHIPPING_FEE = 14;
const OPENCAGE_API_KEY = "71eedb55387e4304b5cc8d19af2d8525";

const ProductDetail = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { account, web3, contract } = useWeb3();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [averageRating, setAverageRating] = useState(0);
  const [userRating, setUserRating] = useState(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [quantityToBuy, setQuantityToBuy] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isAddressSelected, setIsAddressSelected] = useState(false);
  const [quantityError, setQuantityError] = useState("");

  // Hàm tìm kiếm địa chỉ với debounce
  const handleAddressSearch = debounce(async (value) => {
    if (!value || value.length < 2 || isAddressSelected) {
      setAddressSuggestions([]);
      return;
    }

    setAddressLoading(true);
    try {
      const sanitizedQuery = value.replace(/[^\w\s,.-]/g, "").trim();
      if (!sanitizedQuery) {
        setAddressSuggestions([]);
        return;
      }

      const response = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json`,
        {
          params: {
            q: sanitizedQuery,
            key: OPENCAGE_API_KEY,
            countrycode: "vn",
            limit: 20,
            language: "vi",
            pretty: 1,
          },
        }
      );

      const suggestions = response.data.results.map((result) => ({
        label: result.formatted,
        value: result.formatted,
      }));
      setAddressSuggestions(suggestions);
    } catch (err) {
      setAddressSuggestions([]);
      setMessage({
        type: "error",
        text:
          err.response?.status === 400
            ? "Truy vấn địa chỉ không hợp lệ. Vui lòng nhập thêm ký tự!"
            : "Không thể tìm kiếm địa chỉ. Vui lòng thử lại!",
      });
    } finally {
      setAddressLoading(false);
    }
  }, 300);

  // Hàm làm mới dữ liệu (retry)
  const handleRetry = async () => {
    setMessage({ type: "", text: "" });
    await fetchProductDetail();
  };

  // Hàm lấy chi tiết sản phẩm và đồng bộ với blockchain
  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      // Đồng bộ dữ liệu với blockchain trước khi lấy chi tiết sản phẩm
      const syncResponse = await axios.post(
        `${API_URL}/sync-product`,
        { listingId: listingId },
        { headers: { "x-ethereum-address": account } }
      );
      console.log("Kết quả đồng bộ:", syncResponse.data);

      // Lấy chi tiết sản phẩm sau khi đồng bộ
      const response = await axios.get(
        `${API_URL}/product-detail/${listingId}`,
        { headers: { "x-ethereum-address": account } }
      );
      const productData = response.data;
      setProduct(productData);

      // Kiểm tra trạng thái khả dụng
      let available =
        productData.status === "Available" && productData.quantity > 0;

      if (contract) {
        // Kiểm tra trạng thái blockchain
        const productResponse = await contract.methods
          .getListedProduct(listingId)
          .call();
        console.log("Trạng thái blockchain:", productResponse);

        const blockchainQuantity = parseInt(productResponse.quantity);
        const isActive = productResponse.isActive;

        // Cập nhật trạng thái dựa trên blockchain
        if (!isActive || blockchainQuantity === 0) {
          available = false;
          setProduct({
            ...productData,
            status: "Sold",
            quantity: 0,
          });
        } else if (blockchainQuantity !== productData.quantity) {
          // Nếu blockchain và cơ sở dữ liệu không khớp, cập nhật lại
          available = isActive && blockchainQuantity > 0;
          setProduct({
            ...productData,
            quantity: blockchainQuantity,
            status: isActive && blockchainQuantity > 0 ? "Available" : "Sold",
          });
        }
      }

      setIsAvailable(available);

      if (!available) {
        setMessage({
          type: "error",
          text: (
            <>
              Sản phẩm không khả dụng trên blockchain!{" "}
              <Button onClick={handleRetry} color="primary">
                Thử lại
              </Button>
            </>
          ),
        });
      }

      // Lấy đánh giá
      const ratingResponse = await axios.get(
        `${API_URL}/products/${listingId}/rating`
      );
      setAverageRating(parseFloat(ratingResponse.data.average_rating) || 0);

      if (user) {
        const purchaseCheck = await axios.get(
          `${API_URL}/orders/check-purchase`,
          {
            params: { customerId: user.id, listingId: listingId },
            headers: { "x-ethereum-address": account },
          }
        );
        setHasPurchased(purchaseCheck.data.hasPurchased);

        if (purchaseCheck.data.hasPurchased) {
          setUserRating(ratingResponse.data.user_rating || null);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải chi tiết sản phẩm:", err);
      setError("Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // Gửi đánh giá sản phẩm
  const handleRatingSubmit = async (newRating) => {
    if (!hasPurchased) {
      setMessage({
        type: "error",
        text: "Bạn cần mua sản phẩm trước khi đánh giá!",
      });
      return;
    }

    try {
      await axios.post(
        `${API_URL}/products/${listingId}/rate`,
        {
          userId: user.id,
          rating: newRating,
        },
        { headers: { "x-ethereum-address": account } }
      );

      setUserRating(newRating);

      const ratingResponse = await axios.get(
        `${API_URL}/products/${listingId}/rating`
      );
      setAverageRating(parseFloat(ratingResponse.data.average_rating) || 0);

      setMessage({
        type: "success",
        text: "Đánh giá của bạn đã được gửi thành công!",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: "Không thể gửi đánh giá. Vui lòng thử lại!",
      });
    }
  };

  // Kiểm tra và mở modal thanh toán
  const handleOpenModal = () => {
    if (!user || !user.id) {
      setMessage({
        type: "error",
        text: "Vui lòng đăng nhập để thực hiện giao dịch!",
      });
      return;
    }

    if (!isAvailable) {
      setMessage({
        type: "error",
        text: (
          <>
            Sản phẩm hiện không khả dụng để mua!{" "}
            <Button onClick={handleRetry} color="primary">
              Thử lại
            </Button>
          </>
        ),
      });
      return;
    }

    if (!shippingAddress) {
      setMessage({
        type: "error",
        text: "Vui lòng nhập địa chỉ giao hàng!",
      });
      return;
    }

    if (quantityToBuy <= 0 || quantityToBuy > product.quantity) {
      setMessage({
        type: "error",
        text: `Số lượng mua không hợp lệ! Vui lòng chọn từ 1 đến ${product.quantity} hộp.`,
      });
      return;
    }

    setOpenModal(true);
  };

  // Xử lý giao dịch mua sản phẩm
  const handleBuyProduct = async () => {
    if (!paymentMethod) {
      setMessage({
        type: "error",
        text: "Vui lòng chọn phương thức thanh toán!",
      });
      return;
    }

    if (quantityToBuy <= 0 || quantityToBuy > product.quantity) {
      setMessage({
        type: "error",
        text: `Số lượng mua không hợp lệ! Vui lòng chọn từ 1 đến ${product.quantity} hộp.`,
      });
      return;
    }

    setPurchaseLoading(true);
    try {
      // Đồng bộ dữ liệu sản phẩm trước khi thực hiện giao dịch
      const syncResponse = await axios.post(
        `${API_URL}/sync-product`,
        { listingId: product.listing_id },
        { headers: { "x-ethereum-address": account } }
      );
      console.log("Kết quả đồng bộ trước giao dịch:", syncResponse.data);

      // Cập nhật lại product với dữ liệu đã đồng bộ
      const updatedResponse = await axios.get(
        `${API_URL}/product-detail/${product.listing_id}`,
        { headers: { "x-ethereum-address": account } }
      );
      const updatedProduct = updatedResponse.data;
      setProduct(updatedProduct);

      let available =
        updatedProduct.status === "Available" && updatedProduct.quantity > 0;

      if (contract) {
        const productResponse = await contract.methods
          .getListedProduct(product.listing_id)
          .call();
        const blockchainQuantity = parseInt(productResponse.quantity);
        const isActive = productResponse.isActive;

        if (!isActive || blockchainQuantity === 0) {
          available = false;
          setProduct({
            ...updatedProduct,
            status: "Sold",
            quantity: 0,
          });
        } else if (blockchainQuantity !== updatedProduct.quantity) {
          available = isActive && blockchainQuantity > 0;
          setProduct({
            ...updatedProduct,
            quantity: blockchainQuantity,
            status: isActive && blockchainQuantity > 0 ? "Available" : "Sold",
          });
        }
      }

      setIsAvailable(available);

      if (!available || updatedProduct.quantity < quantityToBuy) {
        setMessage({
          type: "error",
          text: (
            <>
              Sản phẩm không khả dụng hoặc số lượng không đủ! Còn lại:{" "}
              {updatedProduct.quantity} hộp.{" "}
              <Button onClick={handleRetry} color="primary">
                Thử lại
              </Button>
            </>
          ),
        });
        setPurchaseLoading(false);
        return;
      }

      // Tiếp tục với logic mua sản phẩm
      const pricePerUnit =
        parseFloat(product.price) / product.original_quantity;
      const totalProductPrice = (pricePerUnit * quantityToBuy).toFixed(2);

      const buyData = {
        listingId: product.listing_id,
        customerId: user.id,
        quantity: quantityToBuy,
        price: pricePerUnit.toFixed(2),
        deliveryHubId: product.delivery_hub_id,
        shippingAddress,
        shippingFee: SHIPPING_FEE,
        paymentMethod,
      };

      let transactionHash;
      if (paymentMethod === "MetaMask" && !buyData.transactionHash) {
        if (!account || !web3 || !contract) {
          setMessage({
            type: "error",
            text: "Vui lòng kết nối ví MetaMask trước khi thực hiện giao dịch!",
          });
          setPurchaseLoading(false);
          return;
        }

        const productResponse = await contract.methods
          .getListedProduct(product.listing_id)
          .call();
        const blockchainQuantity = parseInt(productResponse.quantity);
        const isActive = productResponse.isActive;

        if (!isActive || blockchainQuantity < quantityToBuy) {
          setMessage({
            type: "error",
            text: (
              <>
                Sản phẩm không khả dụng hoặc số lượng không đủ trên blockchain!
                Còn lại: {blockchainQuantity} hộp.{" "}
                <Button onClick={handleRetry} color="primary">
                  Thử lại
                </Button>
              </>
            ),
          });
          await fetchProductDetail();
          setPurchaseLoading(false);
          return;
        }

        const pricePerUnitInWei =
          parseInt(productResponse.price) / blockchainQuantity;
        const totalPriceInWei = pricePerUnitInWei * quantityToBuy;

        const balance = await web3.eth.getBalance(account);
        if (BigInt(balance) < BigInt(totalPriceInWei)) {
          setMessage({
            type: "error",
            text: "Số dư ví MetaMask không đủ để thực hiện giao dịch!",
          });
          setPurchaseLoading(false);
          return;
        }

        const gasEstimate = await contract.methods
          .purchaseProduct(product.listing_id, quantityToBuy)
          .estimateGas({
            from: account,
            value: totalPriceInWei,
          });

        const transactionResult = await contract.methods
          .purchaseProduct(product.listing_id, quantityToBuy)
          .send({
            from: account,
            value: totalPriceInWei,
            gas: Math.floor(Number(gasEstimate) * 1.5),
          });
        transactionHash = transactionResult.transactionHash;
        buyData.transactionHash = transactionHash;
      }

      // Gửi yêu cầu đến backend
      const response = await axios.post(`${API_URL}/buy-product`, buyData, {
        headers: { "x-ethereum-address": account },
      });

      setMessage({
        type: "success",
        text: "Mua sản phẩm thành công!",
      });
      setIsAvailable(updatedProduct.quantity - quantityToBuy > 0);
      setHasPurchased(true);
      setOpenModal(false);

      setTimeout(() => {
        navigate("/customer/orders");
      }, 2000);

      await fetchProductDetail();
    } catch (error) {
      console.error("Lỗi khi mua sản phẩm:", error);
      let errorMessage = "Lỗi khi mua sản phẩm.";
      if (error.response?.data?.message) {
        errorMessage = (
          <>
            {error.response.data.message}{" "}
            <Button onClick={handleRetry} color="primary">
              Thử lại
            </Button>
          </>
        );
      } else if (error.message.includes("User denied transaction signature")) {
        errorMessage = "Bạn đã từ chối ký giao dịch trên MetaMask.";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Số dư ví MetaMask không đủ.";
      } else {
        errorMessage += ` Chi tiết: ${error.message}`;
      }
      setMessage({ type: "error", text: errorMessage });
      await fetchProductDetail();
    } finally {
      setPurchaseLoading(false);
    }
  };

  // Xử lý thay đổi số lượng mua
  const handleQuantityChange = (e) => {
    const value = e.target.value;
    const parsedValue = parseInt(value);
    if (isNaN(parsedValue) || parsedValue < 1) {
      setQuantityToBuy(1);
      setQuantityError("Số lượng phải lớn hơn hoặc bằng 1!");
    } else if (parsedValue > product.quantity) {
      setQuantityToBuy(product.quantity);
      setQuantityError(`Số lượng tối đa là ${product.quantity} hộp!`);
    } else {
      setQuantityToBuy(parsedValue);
      setQuantityError("");
    }
  };

  // Gọi fetchProductDetail khi component được mount hoặc các dependency thay đổi
  useEffect(() => {
    fetchProductDetail();
  }, [listingId, contract, user, account]);

  // Trạng thái loading
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Trạng thái lỗi
  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  // Nếu không tìm thấy sản phẩm
  if (!product) {
    return (
      <Typography variant="h6" sx={{ my: 2 }}>
        Không tìm thấy sản phẩm.
      </Typography>
    );
  }

  // Tính giá hiển thị
  const pricePerUnit = parseFloat(product.price) / product.original_quantity;
  const totalProductPrice = (pricePerUnit * quantityToBuy).toFixed(2);
  const totalWithShipping = (
    parseFloat(totalProductPrice) + SHIPPING_FEE
  ).toFixed(2);

  return (
    <Box sx={{ p: 3 }}>
      {message.text && (
        <Alert severity={message.type} sx={{ my: 2 }}>
          {message.text}
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
            {pricePerUnit.toFixed(2)} AGT/hộp
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
          {isAvailable ? (
            <>
              <Typography variant="body1" gutterBottom>
                Số lượng còn lại: {product.quantity} hộp
              </Typography>
              <TextField
                label="Số lượng muốn mua"
                type="number"
                value={quantityToBuy || 1}
                onChange={handleQuantityChange}
                error={!!quantityError}
                helperText={quantityError}
                sx={{ mb: 2, width: "150px" }}
                inputProps={{ step: 1, min: 1, max: product.quantity }}
                disabled={!isAvailable}
              />
            </>
          ) : (
            <Typography variant="body1" color="error" gutterBottom>
              Sản phẩm đã bán hết hoặc không khả dụng!{" "}
              <Button onClick={handleRetry} color="primary">
                Thử lại
              </Button>
            </Typography>
          )}
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
              setIsAddressSelected(false);
              handleAddressSearch(value);
            }}
            onChange={(event, value) => {
              if (value) {
                setShippingAddress(value.value);
                setIsAddressSelected(true);
              }
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
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenModal}
            disabled={purchaseLoading || !isAvailable || !!quantityError}
            sx={{
              mt: 2,
              backgroundColor: "#4caf50",
              "&:hover": { backgroundColor: "#45a049" },
            }}
          >
            {purchaseLoading ? <CircularProgress size={24} /> : "Mua ngay"}
          </Button>
        </Grid>
      </Grid>

      {/* Modal thanh toán */}
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box
          sx={{
            bgcolor: "white",
            borderRadius: 3,
            boxShadow: 24,
            p: 3,
            width: { xs: "90%", sm: 450 },
            maxHeight: "90vh",
            overflowY: "auto",
            position: "relative",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              fontWeight: "bold",
              textAlign: "center",
              color: "#333",
            }}
          >
            THANH TOÁN ĐƠN HÀNG
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <LocationOnIcon sx={{ color: "#f44336", mr: 1 }} />
            <Typography variant="body2">
              <strong>Địa chỉ:</strong> {shippingAddress}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <StoreIcon sx={{ color: "#2196f3", mr: 1 }} />
            <Typography variant="body2">
              <strong>Trung tâm phân phối:</strong> {product?.delivery_hub_name}
            </Typography>
          </Box>
          <Typography
            variant="body1"
            sx={{ mb: 1, fontWeight: "bold", color: "#333" }}
          >
            Thông tin sản phẩm
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 2,
              backgroundColor: "#f5f5f5",
              p: 1,
              borderRadius: 2,
            }}
          >
            <Box
              component="img"
              src={product?.imageurl || "https://via.placeholder.com/50"}
              alt={product?.name}
              sx={{ width: 50, height: 50, mr: 2, borderRadius: 1 }}
            />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                {product?.name}
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                {quantityToBuy} hộp
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                {pricePerUnit.toFixed(2)} AGT/hộp
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography
            variant="body2"
            sx={{ mb: 1, fontWeight: "bold", color: "#333" }}
          >
            Phương thức thanh toán
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Chọn phương thức</InputLabel>
            <Select
              value={paymentMethod}
              label="Chọn phương thức"
              onChange={(e) => setPaymentMethod(e.target.value)}
              sx={{
                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                },
              }}
            >
              <MenuItem value="Cash">
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <LocalAtmIcon sx={{ mr: 1, color: "#4caf50" }} />
                  Tiền mặt
                </Box>
              </MenuItem>
              <MenuItem value="MetaMask">
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <AccountBalanceWalletIcon sx={{ mr: 1, color: "#f57c00" }} />
                  Ví MetaMask
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2">Tổng tiền hàng:</Typography>
            <Typography variant="body2">{totalProductPrice} AGT</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="body2">Phí vận chuyển:</Typography>
            <Typography variant="body2">{SHIPPING_FEE} AGT</Typography>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography
              variant="body1"
              sx={{ fontWeight: "bold", color: "#333" }}
            >
              Tổng thanh toán:
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontWeight: "bold", color: "#d32f2f" }}
            >
              {totalWithShipping} AGT
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleBuyProduct}
            disabled={purchaseLoading || !!quantityError}
            sx={{
              mt: 2,
              backgroundColor: "#4caf50",
              "&:hover": { backgroundColor: "#45a049" },
              fontWeight: "bold",
            }}
          >
            {purchaseLoading ? <CircularProgress size={24} /> : "Đặt hàng"}
          </Button>
          <Typography
            variant="caption"
            sx={{ mt: 2, color: "#666", display: "block", textAlign: "center" }}
          >
            Nhấn "Đặt hàng" đồng nghĩa với việc bạn đồng ý tuân theo{" "}
            <a href="#" style={{ color: "#2196f3" }}>
              Điều khoản sử dụng
            </a>
            .
          </Typography>
        </Box>
      </Modal>
    </Box>
  );
};

export default ProductDetail;
