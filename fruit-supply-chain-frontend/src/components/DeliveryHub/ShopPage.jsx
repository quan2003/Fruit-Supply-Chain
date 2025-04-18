import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  Close as CloseIcon,
  LocationOn as LocationOnIcon,
  Chat as ChatIcon,
} from "@mui/icons-material";
import { useWeb3 } from "../../contexts/Web3Context";
import { useAuth } from "../../contexts/AuthContext";
import { useOutletContext } from "react-router-dom";
import {
  getFruitProducts,
  purchaseProduct,
  addToInventory,
  getInventory,
} from "../../services/fruitService";
import {
  getFarmByIdService,
  getAllFarmsService,
  getProducerByIdService,
} from "../../services/farmService";

const ShopPage = () => {
  const {
    inventory,
    setInventory,
    handleMenuClick,
    handleRefresh,
    formatImageUrl: formatImageUrlFromContext,
  } = useOutletContext();
  const { account, web3, connectWallet } = useWeb3();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [farmInfo, setFarmInfo] = useState(null);
  const [loadingFarmInfo, setLoadingFarmInfo] = useState(false);
  const [apiErrorInfo, setApiErrorInfo] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.id || !user.email) {
        setError("Vui lòng đăng nhập để xem danh sách sản phẩm.");
        setLoading(false);
        return;
      }

      if (user.role !== "DeliveryHub") {
        setError("Bạn không có quyền truy cập trang này!");
        setLoading(false);
        return;
      }

      if (!account) {
        setError("Vui lòng kết nối ví MetaMask để tiếp tục.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const headers = {
          "x-ethereum-address": account,
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        };

        // Fetch products
        const productData = await getFruitProducts(null, headers);
        setProducts(productData);

        // Fetch inventory
        console.log("Fetching inventory for user.id:", user.id);
        let inventoryData = [];
        try {
          inventoryData = await getInventory(user.id, headers);
          console.log("Inventory data:", inventoryData);
        } catch (err) {
          console.warn("Inventory is empty or inaccessible:", err);
          inventoryData = [];
        }
        setInventory(inventoryData);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
        setLoading(false);
      }
    };

    fetchData();
  }, [user, account, setInventory]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductClick = async (product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
    setFarmInfo(null);
    setLoadingFarmInfo(true);
    setApiErrorInfo(null);

    try {
      const headers = {
        "x-ethereum-address": account,
      };

      const allFarms = await getAllFarmsService(headers);

      let farmData = null;
      let producer = null;

      if (product.farm_id) {
        farmData = await getFarmByIdService(product.farm_id, headers);
      }

      if (!farmData && allFarms.length > 0) {
        farmData = allFarms[0];
      }

      if (farmData && farmData.producer_id) {
        try {
          producer = await getProducerByIdService(
            farmData.producer_id,
            headers
          );
        } catch (error) {
          console.error("Producer not found, using default info:", error);
          producer = { name: "Không có thông tin", wallet_address: null };
        }
      }

      if (farmData) {
        setFarmInfo({
          ...farmData,
          producer_name: producer?.name || "Không có thông tin",
          producer_wallet: producer?.wallet_address
            ? formatWalletAddress(producer.wallet_address)
            : "Không có thông tin",
        });
      } else {
        setApiErrorInfo({
          errors: ["Không tìm thấy thông tin nông trại."],
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error fetching farm info:", error);
      setApiErrorInfo({
        errors: [error.message || "Lỗi khi tải thông tin nông trại."],
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoadingFarmInfo(false);
    }
  };

  const formatWalletAddress = (address) => {
    if (!address) return null;
    if (address.includes("...")) return address;
    return `${address.substring(0, 10)}...${address.substring(
      address.length - 8
    )}`;
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFarmInfo(null);
    setApiErrorInfo(null);
  };

  const handlePurchase = async (product) => {
    if (!user || !user.id) {
      alert("Vui lòng đăng nhập để thực hiện giao dịch!");
      return;
    }

    if (!account || !web3) {
      alert("Vui lòng kết nối ví MetaMask trước khi thực hiện giao dịch!");
      return;
    }

    if (!web3.utils.isAddress(account)) {
      alert("Địa chỉ ví MetaMask không hợp lệ!");
      return;
    }

    setPurchaseLoading(true);
    try {
      const quantity = product.quantity; // Lấy số lượng từ product

      const headers = {
        "x-ethereum-address": account,
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      };

      console.log("Purchase headers:", headers);

      const purchaseInfo = await purchaseProduct(
        product.id,
        account,
        quantity,
        headers
      );

      if (!purchaseInfo || purchaseInfo.error) {
        throw new Error(purchaseInfo.error || "Không thể thực hiện giao dịch!");
      }

      const {
        totalPriceInWei,
        producerAddress,
        deliveryHubId,
        productId,
        quantity: qty,
        price,
      } = purchaseInfo;

      if (!totalPriceInWei || !producerAddress || !deliveryHubId) {
        throw new Error("Thông tin giao dịch không đầy đủ!");
      }

      const nonce = await web3.eth.getTransactionCount(account, "pending");
      const gasPrice = await web3.eth.getGasPrice();
      const transactionResult = await web3.eth.sendTransaction({
        from: account,
        to: producerAddress,
        value: totalPriceInWei,
        gas: 21000,
        gasPrice: gasPrice,
        nonce: nonce,
      });

      const transactionHash = transactionResult.transactionHash;

      // Gọi addToInventory với headers chứa x-ethereum-address
      await addToInventory(
        productId,
        deliveryHubId,
        qty,
        price,
        product.productdate || new Date().toISOString(),
        product.expirydate ||
          new Date(
            new Date().setMonth(new Date().getMonth() + 1)
          ).toISOString(),
        transactionHash,
        headers // Truyền headers đúng
      );

      await handleRefresh();

      setSuccessMessage(
        "Mua sản phẩm thành công! Chuyển đến trang Đơn Mua sau 2 giây..."
      );

      setTimeout(() => {
        handleMenuClick("purchases");
      }, 2000);
    } catch (error) {
      console.error("Error during purchase:", error);
      alert(`Lỗi khi mua sản phẩm: ${error.message}`);
    } finally {
      setPurchaseLoading(false);
    }
  };

  const formatImageUrl = (imageUrl) => {
    if (formatImageUrlFromContext) {
      return formatImageUrlFromContext(imageUrl);
    }
    if (!imageUrl) return "https://via.placeholder.com/150";
    if (imageUrl.startsWith("/uploads")) {
      return `http://localhost:3000${imageUrl}`;
    }
    return imageUrl;
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="warning" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ my: 2, bgcolor: "success.light" }}>
          {successMessage}
        </Alert>
      )}

      {!account && (
        <Box sx={{ textAlign: "center", my: 5 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Vui lòng kết nối ví MetaMask để tiếp tục
          </Typography>
          <Button variant="contained" color="primary" onClick={connectWallet}>
            Kết nối ví MetaMask
          </Button>
        </Box>
      )}

      {account && (
        <>
          <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
            Nguồn cung cấp được phẩm giá rẻ tại đây
          </Typography>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {filteredProducts.length === 0 ? (
            <Box sx={{ width: "100%", textAlign: "center", my: 3 }}>
              <Typography variant="body1">
                {error ||
                  "Không tìm thấy sản phẩm nào phù hợp với tìm kiếm của bạn."}
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredProducts.map((product) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "transform 0.2s",
                      "&:hover": {
                        transform: "scale(1.02)",
                        boxShadow: 3,
                      },
                      cursor: "pointer",
                    }}
                    onClick={() => handleProductClick(product)}
                  >
                    <CardMedia
                      component="img"
                      height="180"
                      image={formatImageUrl(product.imageurl)}
                      alt={product.name}
                      sx={{ objectFit: "contain", p: 2 }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="h6"
                        component="div"
                        align="center"
                        gutterBottom
                      >
                        {product.name}
                      </Typography>
                      <Typography
                        variant="h6"
                        color="primary"
                        align="center"
                        gutterBottom
                      >
                        $ {product.price} AGT
                      </Typography>
                    </CardContent>
                    <Box sx={{ p: 2, textAlign: "center" }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePurchase(product);
                        }}
                        fullWidth
                        sx={{ borderRadius: 28 }}
                        disabled={purchaseLoading}
                      >
                        {purchaseLoading ? (
                          <CircularProgress size={24} />
                        ) : (
                          "Thu mua"
                        )}
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          <Dialog
            open={dialogOpen}
            onClose={handleCloseDialog}
            maxWidth="md"
            PaperProps={{
              sx: {
                borderRadius: 2,
                maxWidth: 600,
              },
            }}
          >
            {selectedProduct && (
              <>
                <DialogTitle sx={{ pr: 6 }}>
                  Thông tin sản phẩm
                  <IconButton
                    aria-label="close"
                    onClick={handleCloseDialog}
                    sx={{
                      position: "absolute",
                      right: 8,
                      top: 8,
                      color: (theme) => theme.palette.grey[500],
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </DialogTitle>
                <DialogContent>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <Box sx={{ display: "flex", mb: 2 }}>
                      <Box sx={{ width: "40%", pr: 2 }}>
                        <img
                          src={formatImageUrl(selectedProduct.imageurl)}
                          alt={selectedProduct.name}
                          style={{ width: "100%", objectFit: "contain" }}
                        />
                      </Box>
                      <Box sx={{ width: "60%" }}>
                        <Typography variant="caption" color="text.secondary">
                          [{selectedProduct.description || "sản phẩm sạch"}]
                        </Typography>
                        <Typography
                          variant="h5"
                          component="h2"
                          sx={{ mt: 0.5, fontWeight: "bold" }}
                        >
                          {selectedProduct.name}
                        </Typography>
                        <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                          Giá: {selectedProduct.price} AGT
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Số lượng: {selectedProduct.quantity} hộp (Bắt buộc thu
                          mua toàn bộ)
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handlePurchase(selectedProduct)}
                            sx={{ borderRadius: 28 }}
                            disabled={purchaseLoading}
                          >
                            {purchaseLoading ? (
                              <CircularProgress size={24} />
                            ) : (
                              "Thu mua"
                            )}
                          </Button>
                        </Box>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        backgroundColor: "#f5f5f5",
                        p: 2,
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        mt: 1,
                      }}
                    >
                      {loadingFarmInfo ? (
                        <CircularProgress
                          size={24}
                          sx={{ mx: "auto", my: 2 }}
                        />
                      ) : (
                        <>
                          <Box
                            sx={{
                              width: 50,
                              height: 50,
                              borderRadius: "50%",
                              backgroundColor: "#e0e0e0",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              mr: 2,
                            }}
                          >
                            <Typography variant="body1">👨‍🌾</Typography>
                          </Box>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: "medium" }}
                            >
                              Người bán:{" "}
                              {farmInfo?.producer_name || "Không có thông tin"}
                              {farmInfo?.producer_wallet &&
                                ` [${farmInfo.producer_wallet}]`}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mt: 1,
                              }}
                            >
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<ChatIcon />}
                                sx={{
                                  mr: 2,
                                  borderRadius: 16,
                                  fontSize: "0.75rem",
                                }}
                              >
                                Chat ngay
                              </Button>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  color: "text.secondary",
                                }}
                              >
                                <LocationOnIcon
                                  fontSize="small"
                                  sx={{ mr: 0.5 }}
                                />
                                <Typography variant="body2">
                                  {farmInfo?.location ||
                                    "Không có thông tin vị trí"}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </>
                      )}
                    </Box>

                    {farmInfo && (
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant="h6"
                          gutterBottom
                          sx={{
                            textTransform: "uppercase",
                            fontWeight: "bold",
                            fontSize: "0.9rem",
                            color: "text.secondary",
                          }}
                        >
                          THÔNG TIN NÔNG TRẠI
                        </Typography>
                        <Divider />
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          {Object.entries(farmInfo).map(([key, value]) => {
                            if (
                              [
                                "producer_name",
                                "producer_wallet",
                                "id",
                              ].includes(key) ||
                              value === null ||
                              value === undefined
                            ) {
                              return null;
                            }

                            const displayKey = key
                              .replace(/_/g, " ")
                              .split(" ")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ");

                            return (
                              <Grid item xs={6} key={key}>
                                <Typography variant="body2">
                                  <strong>{displayKey}:</strong>{" "}
                                  {value.toString()}
                                </Typography>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </Box>
                    )}

                    {apiErrorInfo && !farmInfo && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Không thể tải thông tin nông trại từ máy chủ. Vui lòng
                        thử lại sau.
                      </Alert>
                    )}

                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          textTransform: "uppercase",
                          fontWeight: "bold",
                          fontSize: "0.9rem",
                          color: "text.secondary",
                        }}
                      >
                        CHI TIẾT SẢN PHẨM
                      </Typography>
                      <Divider />
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            Ngày sản xuất:{" "}
                            {selectedProduct.productdate
                              ? new Date(
                                  selectedProduct.productdate
                                ).toLocaleDateString()
                              : "Không có thông tin"}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            Hạn sử dụng sản xuất:{" "}
                            {selectedProduct.expirydate
                              ? new Date(
                                  selectedProduct.expirydate
                                ).toLocaleDateString()
                              : "Không có thông tin"}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            Loại:{" "}
                            {selectedProduct.category || "Không có thông tin"}
                          </Typography>
                        </Grid>
                        {selectedProduct.productcode && (
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Productcode: {selectedProduct.productcode}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </Box>
                </DialogContent>
              </>
            )}
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default ShopPage;
