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
  Security as SecurityIcon,
} from "@mui/icons-material";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useWeb3 } from "../../contexts/Web3Context";
import { sellProductToConsumer } from "../../services/deliveryHubService";
import axios from "axios";
import OutgoingProductsPage from "./OutgoingProductsPage";

const PurchasesPage = () => {
  const { user } = useAuth();
  const {
    account,
    web3,
    executeTransaction,
    addManager,
    connectWallet,
    walletError,
    userError,
    updateWalletAddress,
  } = useWeb3();

  const outletContext = useOutletContext() || {};
  const contextInventory = outletContext.inventory || [];
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
  const [outgoingProducts, setOutgoingProducts] = useState([]);
  const [managerDialogOpen, setManagerDialogOpen] = useState(false);
  const [managerAddress, setManagerAddress] = useState("");
  const [addingManager, setAddingManager] = useState(false);

  const fetchOutgoingProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:3000/outgoing-products",
        {
          headers: { "x-ethereum-address": account },
        }
      );
      setOutgoingProducts(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách sản phẩm đang bán:", error);
      setAlert({
        open: true,
        message: "Không thể tải danh sách sản phẩm đang bán.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account && user && user.role === "DeliveryHub") {
      fetchOutgoingProducts();
    }
  }, [account, user]);

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
    if (userError || walletError) {
      setAlert({
        open: true,
        message: userError || walletError,
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
        message: "Vui lòng nhập giá bán hợp lệ!",
        severity: "error",
      });
      return;
    }
    if (!account || userError || walletError || user.role !== "DeliveryHub") {
      setAlert({
        open: true,
        message:
          userError ||
          walletError ||
          "Vui lòng kết nối ví MetaMask hoặc đăng nhập với vai trò DeliveryHub!",
        severity: "error",
      });
      return;
    }

    const quantityToSell = selectedProduct.quantity; // Lấy số lượng từ inventory
    if (quantityToSell <= 0 || selectedProduct.quantity < quantityToSell) {
      setAlert({
        open: true,
        message: `Số lượng trong kho không đủ để đăng bán! Số lượng khả dụng: ${selectedProduct.quantity}`,
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
        quantity: quantityToSell,
        price: parseFloat(sellingPrice),
        fruitId: selectedProduct.fruit_id, // Lấy fruit_id từ inventory
      };

      if (!productData.fruitId) {
        throw new Error("Không tìm thấy fruitId trong bản ghi inventory!");
      }

      setTransactionStatus("pending");
      const transactionResult = await executeTransaction({
        type: "listProductForSale",
        fruitId: productData.fruitId, // Sử dụng fruitId thay vì productId
        price: web3.utils.toWei(productData.price.toString(), "ether"),
        quantity: productData.quantity,
      });

      setTransactionHash(transactionResult.transactionHash);
      setListingId(transactionResult.listingId);
      setTransactionStatus("confirmed");

      productData.transactionHash = transactionResult.transactionHash;
      productData.listingId = transactionResult.listingId;

      await sellProductToConsumer(productData);

      setAlert({
        open: true,
        message:
          "Đã đăng bán sản phẩm thành công! Đã chuyển sang mục 'Sản phẩm đang bán'.",
        severity: "success",
      });
      handleCloseSellDialog();
      fetchOutgoingProducts();
      contextHandleRefresh();
    } catch (error) {
      console.error("Lỗi khi đăng bán sản phẩm:", error);
      setTransactionStatus("failed");
      setAlert({
        open: true,
        message: error.message || "Không thể đăng bán sản phẩm!",
        severity: "error",
      });
    } finally {
      setSellingInProgress(false);
    }
  };

  const handleOpenManagerDialog = () => {
    if (!account) {
      setAlert({
        open: true,
        message: "Vui lòng kết nối ví MetaMask trước!",
        severity: "warning",
      });
      return;
    }
    setManagerDialogOpen(true);
    setManagerAddress("");
    setTransactionHash(null);
    setTransactionStatus(null);
  };

  const handleCloseManagerDialog = () => {
    setManagerDialogOpen(false);
    setManagerAddress("");
    setTransactionHash(null);
    setTransactionStatus(null);
  };

  const handleManagerAddressChange = (e) => {
    setManagerAddress(e.target.value);
  };

  const handleAddManager = async () => {
    if (!managerAddress || !web3.utils.isAddress(managerAddress)) {
      setAlert({
        open: true,
        message:
          "Vui lòng nhập địa chỉ ví hợp lệ (định dạng Ethereum address)!",
        severity: "error",
      });
      return;
    }

    setAddingManager(true);
    setTransactionStatus("preparing");

    try {
      setTransactionStatus("pending");
      const result = await addManager(managerAddress);
      setTransactionHash(result.transactionHash);
      setTransactionStatus("confirmed");

      setAlert({
        open: true,
        message: `Đã cấp quyền manager cho ${managerAddress} thành công!`,
        severity: "success",
      });
      handleCloseManagerDialog();
    } catch (error) {
      console.error("Lỗi khi thêm manager:", error);
      setTransactionStatus("failed");
      setAlert({
        open: true,
        message: `Lỗi: ${error.message}`,
        severity: "error",
      });
    } finally {
      setAddingManager(false);
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
        <Box>
          <Button
            startIcon={<SecurityIcon />}
            variant="outlined"
            color="secondary"
            onClick={handleOpenManagerDialog}
            sx={{ mr: 2 }}
          >
            Thêm quyền Manager
          </Button>
          <Button
            startIcon={<RefreshIcon />}
            variant="outlined"
            onClick={() => {
              fetchOutgoingProducts();
              contextHandleRefresh();
            }}
            disabled={loading}
          >
            Làm mới
          </Button>
        </Box>
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
            (contextInventory &&
            contextInventory.filter((item) => item.quantity > 0).length > 0 ? (
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
                    {contextInventory
                      .filter((item) => item.quantity > 0)
                      .map((item) => (
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

          {tabValue === 1 && (
            <OutgoingProductsPage
              outgoingProducts={outgoingProducts}
              formatImageUrl={formatImageUrl}
            />
          )}
        </>
      )}

      {/* Dialog đăng bán sản phẩm */}
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
            sx={{ position: "absolute", right: 8, top: 8 }}
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
                      Số lượng khả dụng: {selectedProduct.quantity || 1}
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
                      sx={{ bgcolor: "#f5f5f5", p: 1, borderRadius: 1 }}
                    >
                      {listingId.toString()}
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

      {/* Dialog thêm manager */}
      <Dialog
        open={managerDialogOpen}
        onClose={handleCloseManagerDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Thêm quyền Manager
          <IconButton
            aria-label="close"
            onClick={handleCloseManagerDialog}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Địa chỉ ví Manager (Ethereum Address)"
              variant="outlined"
              value={managerAddress}
              onChange={handleManagerAddressChange}
              placeholder="Ví dụ: 0x1234..."
              sx={{ mb: 2 }}
              disabled={addingManager || transactionStatus === "confirmed"}
            />
            <Alert severity="info" sx={{ mb: 2 }}>
              Chỉ tài khoản owner mới có thể cấp quyền manager. Giao dịch này
              yêu cầu xác nhận trên MetaMask.
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
                  "Đã cấp quyền manager thành công!"}
                {transactionStatus === "failed" &&
                  "Giao dịch thất bại. Vui lòng thử lại."}
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
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseManagerDialog} variant="outlined">
            Hủy
          </Button>
          <Button
            onClick={handleAddManager}
            variant="contained"
            color="secondary"
            disabled={
              addingManager ||
              !managerAddress ||
              transactionStatus === "confirmed"
            }
          >
            {addingManager ? (
              <CircularProgress size={24} />
            ) : transactionStatus === "confirmed" ? (
              "Đã thêm"
            ) : (
              "Thêm Manager"
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
