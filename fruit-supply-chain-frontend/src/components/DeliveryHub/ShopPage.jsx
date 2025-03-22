import React, { useState, useEffect, useRef } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  Search as SearchIcon,
  Close as CloseIcon,
  LocationOn as LocationOnIcon,
  Chat as ChatIcon,
} from "@mui/icons-material";
import { useWeb3 } from "../../contexts/Web3Context";
import { useAuth } from "../../contexts/AuthContext";
import {
  getFruitProducts,
  purchaseProduct,
  addToInventory,
  getInventory,
  getFruitProductById,
  addFruitProduct,
} from "../../services/fruitService";
import {
  getFarmByIdService,
  getAllFarmsService,
} from "../../services/farmService";
import { getAllUsersService } from "../../services/userService";

const ShopPage = () => {
  const { account, web3, connectWallet } = useWeb3();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [farmInfo, setFarmInfo] = useState(null);
  const [loadingFarmInfo, setLoadingFarmInfo] = useState(false);
  const [apiErrorInfo, setApiErrorInfo] = useState(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const catalogRef = useRef(null); // Thêm ref để cuộn đến catalog

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getFruitProducts();
        setProducts(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Không thể tải danh sách sản phẩm từ API.");
        setLoading(false);
      }
    };

    const fetchInventory = async () => {
      try {
        if (user?.id) {
          const data = await getInventory(user.id);
          setInventory(data);
          if (data.length > 0) {
            setShowCatalog(true);
          }
        } else {
          console.warn("User is not logged in or user.id is undefined");
        }
      } catch (err) {
        console.error("Error fetching inventory:", err);
        setError("Không thể tải danh sách đơn mua.");
      }
    };

    fetchProducts();
    fetchInventory();
  }, [user]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter products based on search term
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
      let success = false;
      let errorMessages = [];

      try {
        const allFarms = await getAllFarmsService();
        const allUsers = await getAllUsersService();

        if (product.farm_id) {
          try {
            const farmData = await getFarmByIdService(product.farm_id);
            if (farmData) {
              const producer = allUsers.find(
                (user) =>
                  user.role === "Producer" &&
                  user.id.toString() === farmData.producer_id?.toString()
              );

              setFarmInfo({
                ...farmData,
                producer_name: producer?.name,
                producer_wallet: producer?.wallet_address
                  ? formatWalletAddress(producer.wallet_address)
                  : null,
              });

              success = true;
            }
          } catch (error) {
            errorMessages.push(
              `Không thể tìm nông trại ID ${product.farm_id}: ${error.message}`
            );
          }
        }

        if (
          !success &&
          allFarms.length > 0 &&
          allUsers.some((user) => user.role === "Producer")
        ) {
          const farm = allFarms[0];
          const producer = allUsers.find((user) => user.role === "Producer");

          setFarmInfo({
            ...farm,
            producer_name: producer?.name,
            producer_wallet: producer?.wallet_address
              ? formatWalletAddress(producer.wallet_address)
              : null,
          });

          success = true;
        }
      } catch (error) {
        errorMessages.push(`Lỗi khi tải dữ liệu: ${error.message}`);
      }

      if (!success) {
        setApiErrorInfo({
          errors: errorMessages,
          timestamp: new Date().toISOString(),
        });
        console.error("API errors:", errorMessages);
      }
    } catch (error) {
      console.error("Error in handleProductClick:", error);
    } finally {
      setLoadingFarmInfo(false);
    }
  };

  // Helper function to format wallet address
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
    console.log("Starting purchase with account:", account, "web3:", web3);

    // Kiểm tra đăng nhập ngay từ đầu
    if (!user || !user.id) {
      alert("Vui lòng đăng nhập để thực hiện giao dịch!");
      return;
    }

    if (!account || !web3) {
      alert("Vui lòng kết nối ví MetaMask trước khi thực hiện giao dịch!");
      return;
    }

    setPurchaseLoading(true);
    try {
      const quantity = 2;
      console.log("Calling purchaseProduct API with:", {
        productId: product.id,
        buyerAddress: account,
        quantity,
      });

      const purchaseInfo = await purchaseProduct(product.id, account, quantity);
      console.log("Purchase info received:", purchaseInfo);

      // Kiểm tra nếu API trả về lỗi (chỉ ném lỗi nếu có thông báo lỗi thực sự)
      if (!purchaseInfo || purchaseInfo.error) {
        throw new Error(purchaseInfo.error || "Không thể thực hiện giao dịch!");
      }

      // Thông báo "Thông tin giao dịch đã được xác nhận..." là thông báo thành công, không phải lỗi
      if (purchaseInfo.message) {
        console.log("API message:", purchaseInfo.message);
        // Tiếp tục giao dịch, không ném lỗi
      }

      const {
        totalPriceInWei,
        producerAddress,
        deliveryHubId,
        productId,
        quantity: qty,
        price,
      } = purchaseInfo;

      // Kiểm tra các giá trị cần thiết trước khi gửi giao dịch
      if (!totalPriceInWei || !producerAddress || !deliveryHubId) {
        throw new Error("Thông tin giao dịch không đầy đủ!");
      }

      // Récupérer le nonce actuel du compte
      const nonce = await web3.eth.getTransactionCount(account, "pending");
      console.log("Current nonce for account:", nonce);

      console.log("Sending transaction with web3:", {
        from: account,
        to: producerAddress,
        value: totalPriceInWei,
        nonce,
      });
      const gasPrice = await web3.eth.getGasPrice();
      const transaction = await web3.eth.sendTransaction({
        from: account,
        to: producerAddress,
        value: totalPriceInWei,
        gas: 21000,
        gasPrice: gasPrice,
        nonce: nonce,
      });

      console.log("Transaction successful:", transaction.transactionHash);

      console.log("Adding to inventory:", {
        productId,
        deliveryHubId,
        qty,
        price,
      });
      await addToInventory(productId, deliveryHubId, qty, price);

      console.log("Fetching updated inventory for deliveryHubId:", user.id);
      const updatedInventory = await getInventory(user.id);
      setInventory(updatedInventory);
      setShowCatalog(true);

      // Hiển thị thông báo thành công trên giao diện
      setSuccessMessage(
        "Mua sản phẩm thành công! Xem danh sách sản phẩm đã mua bên dưới."
      );

      // Cuộn đến phần catalog
      if (catalogRef.current) {
        catalogRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error during purchase:", error);
      alert(`Lỗi khi mua sản phẩm: ${error.message}`);
    } finally {
      setPurchaseLoading(false);
    }
  };

  // Format image URL
  const formatImageUrl = (imageUrl) => {
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

          <Grid container spacing={3}>
            {filteredProducts.length === 0 ? (
              <Box sx={{ width: "100%", textAlign: "center", my: 3 }}>
                <Typography variant="body1">
                  Không tìm thấy sản phẩm nào phù hợp với tìm kiếm của bạn.
                </Typography>
              </Box>
            ) : (
              filteredProducts.map((product) => (
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
              ))
            )}
          </Grid>

          {/* Danh sách đơn mua (Catalog) */}
          {showCatalog && (
            <Box sx={{ mt: 5 }} ref={catalogRef}>
              <Typography
                variant="h4"
                component="h1"
                sx={{ mb: 3, color: "primary.main" }}
              >
                Danh sách sản phẩm đã mua
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Mã sản phẩm
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Tên</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Hình ảnh
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Giá</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Loại</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Mô tả</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Số lượng
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Ngày sản xuất
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Hạn sử dụng
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Thao tác
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>{item.productcode}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>
                          <img
                            src={formatImageUrl(item.imageurl)}
                            alt={item.name}
                            style={{
                              width: 50,
                              height: 50,
                              objectFit: "contain",
                            }}
                          />
                        </TableCell>
                        <TableCell>{item.price} AGT</TableCell>
                        <TableCell>{item.category || "ban cho"}</TableCell>
                        <TableCell>
                          {item.description || "Không có mô tả"}
                        </TableCell>
                        <TableCell>{item.quantity} hộp</TableCell>
                        <TableCell>
                          {new Date(item.productdate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(item.expirydate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="contained" color="secondary">
                            Đình bán
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          {/* Hiển thị thông báo nếu chưa có sản phẩm trong catalog */}
          {showCatalog && inventory.length === 0 && (
            <Box sx={{ mt: 5, textAlign: "center" }}>
              <Typography variant="body1">
                Chưa có sản phẩm nào trong danh sách đã mua.
              </Typography>
            </Box>
          )}

          {/* Product Details Dialog */}
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
                    {/* Main product info */}
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
                          Số lượng: {selectedProduct.quantity || 2} Kg
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

                    {/* Seller information */}
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

                    {/* Farm details section */}
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

                    {/* API Error message */}
                    {apiErrorInfo && !farmInfo && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Không thể tải thông tin nông trại từ máy chủ. Vui lòng
                        thử lại sau.
                      </Alert>
                    )}

                    {/* Product details */}
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
                              : "22/3/2025"}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            Hạn sử dụng sản xuất:{" "}
                            {selectedProduct.expirydate
                              ? new Date(
                                  selectedProduct.expirydate
                                ).toLocaleDateString()
                              : "29/3/2025"}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            Loại: {selectedProduct.category || "ban cho"}
                          </Typography>
                        </Grid>
                        {selectedProduct.productcode && (
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Productcode: {selectedProduct.productcode}
                            </Typography>
                          </Grid>
                        )}

                        {Object.entries(selectedProduct).map(([key, value]) => {
                          if (
                            [
                              "id",
                              "name",
                              "price",
                              "imageurl",
                              "description",
                              "quantity",
                              "productdate",
                              "expirydate",
                              "category",
                              "farm_id",
                              "producer_id",
                              "productcode",
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
