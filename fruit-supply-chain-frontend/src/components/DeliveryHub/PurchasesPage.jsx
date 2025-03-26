import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  IconButton,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Close as CloseIcon,
  ShoppingBag as ShoppingBagIcon,
} from "@mui/icons-material";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useWeb3 } from "../../contexts/Web3Context";
import { sellProductToConsumer } from "../../services/deliveryHubService";

const PurchasesPage = () => {
  const { user } = useAuth();
  const {
    account,
    web3,
    executeTransaction,
    getSellerListings,
    connectWallet,
    walletError,
    userError,
    updateWalletAddress,
  } = useWeb3();

  const outletContext = useOutletContext() || {};
  const contextInventory = outletContext.inventory || [];
  const contextOutgoingProducts = outletContext.outgoingProducts || [];
  const contextHandleRefresh = outletContext.handleRefresh || (() => {});
  const formatImageUrl = outletContext.formatImageUrl || ((url) => url);

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [sellingPrice, setSellingPrice] = useState("");
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [sellingInProgress, setSellingInProgress] = useState(false);
  const [transactionHash, setTransactionHash] = useState(null);
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [listingId, setListingId] = useState(null);
  const [blockchainListings, setBlockchainListings] = useState([]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const handleOpenSellDialog = (product) => {
    if (!account) {
      setAlert({
        open: true,
        message: "Vui lòng kết nối ví MetaMask trước khi đăng bán!",
        severity: "warning",
      });
      return;
    }

    if (userError) {
      setAlert({
        open: true,
        message: userError,
        severity: "error",
      });
      return;
    }

    if (walletError) {
      setAlert({
        open: true,
        message: walletError,
        severity: "error",
      });
      return;
    }

    if (user.role !== "DeliveryHub") {
      setAlert({
        open: true,
        message:
          "Bạn không có quyền thực hiện hành động này! Vui lòng đăng nhập với vai trò DeliveryHub.",
        severity: "error",
      });
      return;
    }

    setSelectedProduct(product);
    const suggestedPrice = product.price
      ? (parseFloat(product.price) * 1.15).toFixed(2)
      : "";
    setSellingPrice(suggestedPrice);
    setSellDialogOpen(true);
    setTransactionHash(null);
    setTransactionStatus(null);
    setListingId(null);
  };

  const handleCloseSellDialog = () => {
    setSellDialogOpen(false);
    setSelectedProduct(null);
    setSellingPrice("");
    setTransactionHash(null);
    setTransactionStatus(null);
    setListingId(null);
  };

  const handleSellingPriceChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setSellingPrice(value);
    }
  };

  const handleListForSale = async () => {
    if (!selectedProduct || !sellingPrice || parseFloat(sellingPrice) <= 0) {
      setAlert({
        open: true,
        message: "Vui lòng nhập giá bán hợp lệ",
        severity: "error",
      });
      return;
    }

    if (!account) {
      setAlert({
        open: true,
        message: "Vui lòng kết nối ví MetaMask trước khi đăng bán!",
        severity: "warning",
      });
      return;
    }

    if (userError) {
      setAlert({
        open: true,
        message: userError,
        severity: "error",
      });
      return;
    }

    if (walletError) {
      setAlert({
        open: true,
        message: walletError,
        severity: "error",
      });
      return;
    }

    if (user.role !== "DeliveryHub") {
      setAlert({
        open: true,
        message:
          "Bạn không có quyền thực hiện hành động này! Vui lòng đăng nhập với vai trò DeliveryHub.",
        severity: "error",
      });
      return;
    }

    setSellingInProgress(true);
    setTransactionStatus("preparing");

    try {
      const productData = {
        inventoryId: selectedProduct.id,
        productId: selectedProduct.product_id,
        quantity: parseInt(selectedProduct.quantity || 1, 10),
        price: parseFloat(sellingPrice),
      };

      if (
        isNaN(productData.productId) ||
        isNaN(productData.quantity) ||
        isNaN(productData.price)
      ) {
        throw new Error(
          "Dữ liệu không hợp lệ: productId, quantity hoặc price không phải là số!"
        );
      }

      console.log("Chuẩn bị đăng bán sản phẩm:", productData);

      try {
        setTransactionStatus("pending");
        const transactionResult = await executeTransaction({
          type: "listProductForSale",
          productId: productData.productId,
          price: productData.price,
          quantity: productData.quantity,
          inventoryId: productData.inventoryId,
        });

        setTransactionHash(transactionResult.transactionHash);
        setListingId(transactionResult.listingId);
        setTransactionStatus("confirmed");

        console.log("Giao dịch xác nhận:", transactionResult);

        productData.transactionHash = transactionResult.transactionHash;
        productData.listingId = transactionResult.listingId;

        const response = await sellProductToConsumer(productData);
        console.log("Kết quả đăng bán sản phẩm:", response);

        setAlert({
          open: true,
          message: "Đã đăng bán sản phẩm thành công!",
          severity: "success",
        });

        handleCloseSellDialog();
        contextHandleRefresh();
      } catch (txError) {
        console.error("Lỗi giao dịch:", txError);
        setTransactionStatus("failed");

        let txErrorMessage = txError.message || "Giao dịch blockchain thất bại";
        setAlert({
          open: true,
          message: `Lỗi giao dịch: ${txErrorMessage}`,
          severity: "error",
        });

        throw new Error(txErrorMessage);
      }
    } catch (error) {
      console.error("Lỗi khi đăng bán sản phẩm:", error);

      if (transactionStatus !== "failed") {
        setTransactionStatus("failed");
      }

      let errorMessage = error.message || "Vui lòng thử lại sau";
      setAlert({
        open: true,
        message: `Lỗi khi đăng bán sản phẩm: ${errorMessage}`,
        severity: "error",
      });
    } finally {
      setSellingInProgress(false);
    }
  };

  const handleUpdateWallet = async () => {
    try {
      await updateWalletAddress(user.email);
      setAlert({
        open: true,
        message: "Cập nhật ví MetaMask thành công!",
        severity: "success",
      });
    } catch (error) {
      setAlert({
        open: true,
        message: error.message || "Không thể cập nhật ví. Vui lòng thử lại!",
        severity: "error",
      });
    }
  };

  const handleLoginRedirect = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  useEffect(() => {
    const fetchBlockchainListings = async () => {
      if (account && tabValue === 1) {
        try {
          const listings = await getSellerListings();
          setBlockchainListings(listings);
          console.log("Danh sách giao dịch blockchain:", listings);
        } catch (error) {
          console.error("Lỗi khi lấy danh sách giao dịch blockchain:", error);
          setBlockchainListings([]);
        }
      }
    };

    fetchBlockchainListings();
  }, [account, tabValue, getSellerListings]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch (error) {
      return dateString;
    }
  };

  if (userError) {
    return (
      <Box sx={{ textAlign: "center", my: 5 }}>
        <Typography variant="h6">{userError}</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleLoginRedirect}
          sx={{ mt: 2 }}
        >
          Đăng nhập lại
        </Button>
      </Box>
    );
  }

  if (!account) {
    return (
      <Box sx={{ textAlign: "center", my: 5 }}>
        <Typography variant="h6">
          Vui lòng kết nối ví để xem danh sách đơn mua
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={connectWallet}
          sx={{ mt: 2 }}
        >
          Kết nối ví MetaMask
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {walletError && (
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
          <Alert severity="error">{walletError}</Alert>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpdateWallet}
          >
            Cập nhật ví
          </Button>
        </Box>
      )}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" component="h1">
          Quản lý sản phẩm
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          variant="outlined"
          onClick={contextHandleRefresh}
          disabled={loading}
        >
          Làm mới
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="inventory tabs"
        >
          <Tab label="Sản phẩm trong kho" />
          <Tab label="Sản phẩm đang bán" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {tabValue === 0 &&
            (contextInventory && contextInventory.length > 0 ? (
              <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableCell>ID</TableCell>
                      <TableCell>Tên sản phẩm</TableCell>
                      <TableCell>Loại</TableCell>
                      <TableCell>Nguồn gốc</TableCell>
                      <TableCell align="center">Số lượng</TableCell>
                      <TableCell align="right">Giá mua (AGT)</TableCell>
                      <TableCell>Ngày sản xuất</TableCell>
                      <TableCell>Hạn sử dụng</TableCell>
                      <TableCell align="center">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contextInventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            {item.imageurl && (
                              <Box
                                component="img"
                                src={
                                  formatImageUrl
                                    ? formatImageUrl(item.imageurl)
                                    : item.imageurl
                                }
                                alt={item.name}
                                sx={{
                                  width: 40,
                                  height: 40,
                                  mr: 1,
                                  objectFit: "cover",
                                }}
                                onError={(e) => {
                                  e.target.src =
                                    "https://via.placeholder.com/40";
                                }}
                              />
                            )}
                            {item.name || "Sản phẩm"}
                          </Box>
                        </TableCell>
                        <TableCell>{item.category || "Trái cây"}</TableCell>
                        <TableCell>{item.origin || "Việt Nam"}</TableCell>
                        <TableCell align="center">
                          {item.quantity || 1}
                        </TableCell>
                        <TableCell align="right">
                          {item.price || "N/A"}
                        </TableCell>
                        <TableCell>{formatDate(item.productdate)}</TableCell>
                        <TableCell>{formatDate(item.expirydate)}</TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => handleOpenSellDialog(item)}
                            sx={{ borderRadius: 2 }}
                            startIcon={<ShoppingBagIcon />}
                          >
                            Đăng bán
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box
                sx={{
                  textAlign: "center",
                  my: 5,
                  py: 5,
                  bgcolor: "#f5f5f5",
                  borderRadius: 2,
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  Bạn chưa có sản phẩm nào trong kho
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2 }}
                  onClick={() => (window.location.href = "/delivery-hub/shop")}
                >
                  Đi đến cửa hàng
                </Button>
              </Box>
            ))}

          {tabValue === 1 &&
            (contextOutgoingProducts && contextOutgoingProducts.length > 0 ? (
              <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableCell>ID</TableCell>
                      <TableCell>Tên sản phẩm</TableCell>
                      <TableCell>Loại</TableCell>
                      <TableCell align="center">Số lượng</TableCell>
                      <TableCell align="right">Giá bán (AGT)</TableCell>
                      <TableCell>Ngày đăng</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell>Mã giao dịch</TableCell>
                      <TableCell>Listing ID</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contextOutgoingProducts.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            {item.imageurl && (
                              <Box
                                component="img"
                                src={
                                  formatImageUrl
                                    ? formatImageUrl(item.imageurl)
                                    : item.imageurl
                                }
                                alt={item.name}
                                sx={{
                                  width: 40,
                                  height: 40,
                                  mr: 1,
                                  objectFit: "cover",
                                }}
                                onError={(e) => {
                                  e.target.src =
                                    "https://via.placeholder.com/40";
                                }}
                              />
                            )}
                            {item.name || "Sản phẩm"}
                          </Box>
                        </TableCell>
                        <TableCell>{item.category || "Trái cây"}</TableCell>
                        <TableCell align="center">
                          {item.quantity || 1}
                        </TableCell>
                        <TableCell align="right">
                          {item.price || "N/A"}
                        </TableCell>
                        <TableCell>{formatDate(item.listed_date)}</TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              bgcolor:
                                item.status === "Available"
                                  ? "success.light"
                                  : "info.light",
                              color:
                                item.status === "Available"
                                  ? "success.dark"
                                  : "info.dark",
                              py: 0.5,
                              px: 1,
                              borderRadius: 1,
                              display: "inline-block",
                              fontSize: "0.75rem",
                            }}
                          >
                            {item.status === "Available"
                              ? "Đang bán"
                              : item.status}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {item.transaction_hash ? (
                            <Typography
                              variant="body2"
                              sx={{ fontSize: "0.75rem" }}
                            >
                              {`${item.transaction_hash.substring(
                                0,
                                6
                              )}...${item.transaction_hash.substring(
                                item.transaction_hash.length - 4
                              )}`}
                            </Typography>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>{item.listingId || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box
                sx={{
                  textAlign: "center",
                  my: 5,
                  py: 5,
                  bgcolor: "#f5f5f5",
                  borderRadius: 2,
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  Bạn chưa có sản phẩm nào đang bán
                </Typography>
                {contextInventory && contextInventory.length > 0 && (
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={() => setTabValue(0)}
                  >
                    Đăng bán sản phẩm
                  </Button>
                )}
              </Box>
            ))}
        </>
      )}

      <Dialog
        open={sellDialogOpen}
        onClose={handleCloseSellDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Thiết lập giá bán
          <IconButton
            aria-label="close"
            onClick={handleCloseSellDialog}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {selectedProduct && (
              <>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  {selectedProduct.imageurl && (
                    <Box
                      component="img"
                      src={
                        formatImageUrl
                          ? formatImageUrl(selectedProduct.imageurl)
                          : selectedProduct.imageurl
                      }
                      alt={selectedProduct.name}
                      sx={{ width: 80, height: 80, mr: 2, objectFit: "cover" }}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/80";
                      }}
                    />
                  )}
                  <Box>
                    <Typography variant="h6">
                      {selectedProduct.name || "Sản phẩm"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Giá mua: {selectedProduct.price || "N/A"} AGT
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Số lượng: {selectedProduct.quantity || 1}
                    </Typography>
                  </Box>
                </Box>

                <TextField
                  fullWidth
                  label="Giá bán (AGT)"
                  variant="outlined"
                  value={sellingPrice}
                  onChange={handleSellingPriceChange}
                  InputProps={{
                    endAdornment: <Typography variant="body2">AGT</Typography>,
                  }}
                  sx={{ mb: 2 }}
                  disabled={transactionStatus === "confirmed"}
                />

                <Alert severity="info" sx={{ mb: 2 }}>
                  Giá bán được đề xuất nên cao hơn giá mua để đảm bảo lợi nhuận
                  cho bạn. Đăng bán sẽ yêu cầu xác nhận giao dịch trên MetaMask.
                </Alert>

                {transactionStatus && (
                  <Alert
                    severity={
                      transactionStatus === "preparing"
                        ? "info"
                        : transactionStatus === "pending"
                        ? "warning"
                        : transactionStatus === "confirmed"
                        ? "success"
                        : "error"
                    }
                    sx={{ mb: 2 }}
                  >
                    {transactionStatus === "preparing" &&
                      "Đang chuẩn bị giao dịch blockchain..."}
                    {transactionStatus === "pending" &&
                      "Đang xử lý giao dịch blockchain. Vui lòng xác nhận trong MetaMask..."}
                    {transactionStatus === "confirmed" &&
                      "Giao dịch blockchain thành công!"}
                    {transactionStatus === "failed" &&
                      "Giao dịch blockchain thất bại. Vui lòng thử lại."}
                  </Alert>
                )}

                {transactionHash && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Mã giao dịch:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        wordBreak: "break-all",
                        bgcolor: "#f5f5f5",
                        p: 1,
                        borderRadius: 1,
                      }}
                    >
                      {transactionHash}
                    </Typography>
                  </Box>
                )}

                {listingId && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Listing ID:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        bgcolor: "#f5f5f5",
                        p: 1,
                        borderRadius: 1,
                      }}
                    >
                      {listingId}
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseSellDialog} variant="outlined">
            Hủy
          </Button>
          <Button
            onClick={handleListForSale}
            variant="contained"
            color="primary"
            disabled={
              !sellingPrice ||
              parseFloat(sellingPrice) <= 0 ||
              sellingInProgress ||
              transactionStatus === "confirmed"
            }
          >
            {sellingInProgress ? (
              <CircularProgress size={24} />
            ) : transactionStatus === "confirmed" ? (
              "Đã đăng bán"
            ) : (
              "Đăng bán"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          sx={{ width: "100%" }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PurchasesPage;
