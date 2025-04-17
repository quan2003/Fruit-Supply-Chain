import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Tabs,
  Tab,
  Snackbar, // Thêm Snackbar
} from "@mui/material";
import {
  Assessment as AssessmentIcon,
  ShoppingBag as ShoppingBagIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { Outlet, useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useWeb3 } from "../contexts/Web3Context";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import {
  getIncomingShipments,
  getOutgoingShipments,
  getInventory,
  receiveShipment,
  shipToCustomer,
  getOutgoingProducts,
  addToInventory,
  sellProductToConsumer,
} from "../services/deliveryHubService";

const DeliveryHubPage = () => {
  const { account, walletError, setWalletError, executeTransaction, contract } =
    useWeb3();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [incomingShipments, setIncomingShipments] = useState([]);
  const [outgoingShipments, setOutgoingShipments] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [outgoingProducts, setOutgoingProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showShipmentForm, setShowShipmentForm] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [alertMessage, setAlertMessage] = useState({ type: "", message: "" });
  const [snackOpen, setSnackOpen] = useState(false); // State cho Snackbar
  const [snackMessage, setSnackMessage] = useState(""); // Nội dung thông báo
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("statistics");

  const fetchData = async () => {
    if (!account) {
      setAlertMessage({
        type: "error",
        message: "Vui lòng kết nối ví MetaMask để tiếp tục!",
      });
      setLoading(false);
      return;
    }

    if (!user?.id) {
      setAlertMessage({
        type: "error",
        message: "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại!",
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const walletCheck = await axios.post(
        "http://localhost:3000/check-role",
        {},
        { headers: { "x-ethereum-address": account } }
      );

      if (walletCheck.data.error) {
        setAlertMessage({
          type: "error",
          message: walletCheck.data.error,
        });
        setLoading(false);
        return;
      }

      const allowedRoles = ["DeliveryHub", "Admin"];
      if (!allowedRoles.includes(walletCheck.data.role)) {
        setAlertMessage({
          type: "error",
          message:
            "Ví của bạn không có quyền truy cập trang này! Vai trò yêu cầu: DeliveryHub hoặc Admin.",
        });
        setLoading(false);
        return;
      }

      const incoming = await getIncomingShipments();
      setIncomingShipments(incoming);

      const outgoing = await getOutgoingShipments();
      setOutgoingShipments(outgoing);

      const inv = await getInventory(user.id);
      console.log("Fetched inventory data:", inv);
      setInventory(inv);

      const outgoingProds = await getOutgoingProducts(user.id);
      console.log("Fetched outgoing products data:", outgoingProds);
      setOutgoingProducts(outgoingProds);

      setLoading(false);
    } catch (error) {
      console.error("Error loading delivery hub data:", error);
      setAlertMessage({
        type: "error",
        message:
          error.response?.data?.error ||
          "Có lỗi khi tải dữ liệu. Vui lòng thử lại sau.",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Current account:", account);
    if (account && user) {
      fetchData();
    }
  }, [account, user]);

  useEffect(() => {
    if (currentPage === "purchases" && user?.id) {
      fetchData();
    }
  }, [currentPage, user]);

  const handleMenuClick = (page) => {
    setCurrentPage(page);
    setDrawerOpen(false);
    navigate(`/delivery-hub/${page}`);
    switch (page) {
      case "statistics":
        setTabValue(0);
        break;
      case "shop":
        setTabValue(1);
        break;
      case "orders":
        setTabValue(2);
        break;
      case "purchases":
        setTabValue(3);
        break;
      case "outgoing-products":
        setTabValue(4);
        break;
      default:
        setTabValue(0);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setShowShipmentForm(false);
    setSelectedShipment(null);
    setAlertMessage({ type: "", message: "" });
    switch (newValue) {
      case 0:
        navigate("/delivery-hub/statistics");
        setCurrentPage("statistics");
        break;
      case 1:
        navigate("/delivery-hub/shop");
        setCurrentPage("shop");
        break;
      case 2:
        navigate("/delivery-hub/orders");
        setCurrentPage("orders");
        break;
      case 3:
        navigate("/delivery-hub/purchases");
        setCurrentPage("purchases");
        break;
      case 4:
        navigate("/delivery-hub/outgoing-products");
        setCurrentPage("outgoing-products");
        break;
      default:
        navigate("/delivery-hub/statistics");
        setCurrentPage("statistics");
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleRefresh = async () => {
    await fetchData();
  };

  const handleReceiveShipment = async (shipmentId) => {
    try {
      setLoading(true);
      await receiveShipment(shipmentId);

      const incoming = await getIncomingShipments();
      setIncomingShipments(incoming);

      await fetchData();

      setLoading(false);
      setSnackMessage("Đã nhận lô hàng thành công!"); // Dùng Snackbar
      setSnackOpen(true);
    } catch (error) {
      console.error("Error receiving shipment:", error);
      setAlertMessage({
        type: "error",
        message:
          error.message || "Có lỗi khi nhận lô hàng. Vui lòng thử lại sau.",
      });
      setLoading(false);
    }
  };

  const handlePrepareShipment = (fruitItem) => {
    setSelectedShipment(fruitItem);
    setShowShipmentForm(true);
    setTabValue(2);
    navigate("/delivery-hub/orders");
    setCurrentPage("orders");
  };

  const handleShipmentCreated = async (shipmentData) => {
    try {
      setLoading(true);
      await shipToCustomer(shipmentData);

      const outgoing = await getOutgoingShipments();
      setOutgoingShipments(outgoing);

      await fetchData();

      setShowShipmentForm(false);
      setSelectedShipment(null);
      setLoading(false);
      setSnackMessage("Đã tạo lô hàng gửi đi thành công!"); // Dùng Snackbar
      setSnackOpen(true);
    } catch (error) {
      console.error("Error creating shipment:", error);
      setAlertMessage({
        type: "error",
        message:
          error.message || "Có lỗi khi tạo lô hàng. Vui lòng thử lại sau.",
      });
      setLoading(false);
    }
  };

  const handleHarvestFruit = async (fruitType, origin, farmId, quality) => {
    try {
      setLoading(true);
      console.log("Calling harvestFruit with:", {
        fruitType,
        origin,
        farmId,
        quality,
      });

      const transactionResult = await executeTransaction({
        type: "harvestFruit",
        fruitType,
        origin,
        farmId: farmId || "defaultFarm",
        quality: quality || "Good",
      });

      console.log("Harvest successful:", transactionResult);

      await fetchData();

      setLoading(false);
      setSnackMessage("Đã thu hoạch trái cây thành công!"); // Dùng Snackbar
      setSnackOpen(true);

      return transactionResult;
    } catch (error) {
      console.error("Error harvesting fruit:", error);
      setAlertMessage({
        type: "error",
        message:
          error.message ||
          "Có lỗi khi thu hoạch trái cây. Vui lòng thử lại sau.",
      });
      setLoading(false);
      throw error;
    }
  };

  const handlePurchaseProduct = async (
    productId,
    quantity,
    price,
    transactionHash
  ) => {
    try {
      setLoading(true);

      await addToInventory(
        productId,
        user.id,
        quantity,
        price,
        new Date().toISOString(),
        new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        transactionHash
      );

      const updatedInventory = await getInventory(user.id);
      setInventory(updatedInventory);

      const inventoryItem = updatedInventory.find(
        (item) => item.product_id === productId
      );
      if (!inventoryItem) {
        throw new Error("Không tìm thấy sản phẩm trong kho!");
      }
      const inventoryId = inventoryItem.id;

      const transactionResult = await executeTransaction({
        type: "listProductForSale",
        productId,
        price,
        quantity,
        inventoryId,
      });

      await sellProductToConsumer({
        inventoryId,
        quantity,
        price,
        transactionHash: transactionResult.transactionHash,
        listingId: transactionResult.listingId,
      });

      setInventory((prevInventory) =>
        prevInventory.filter((item) => item.id !== inventoryId)
      );

      const updatedOutgoingProducts = await getOutgoingProducts(user.id);
      setOutgoingProducts(updatedOutgoingProducts);

      setTabValue(4);
      navigate("/delivery-hub/outgoing-products");
      setCurrentPage("outgoing-products");

      setLoading(false);
      setSnackMessage(
        "Đã mua, đăng bán và chuyển sản phẩm sang mục đang bán thành công!"
      ); // Dùng Snackbar
      setSnackOpen(true);
    } catch (error) {
      console.error("Error adding product to inventory after purchase:", error);
      setAlertMessage({
        type: "error",
        message:
          error.message ||
          "Có lỗi khi thêm sản phẩm vào kho hoặc đăng bán. Vui lòng thử lại sau.",
      });
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleUpdateWallet = async () => {
    try {
      const response = await axios.post("http://localhost:3000/update-wallet", {
        email: user.email,
        walletAddress: account,
      });
      setWalletError(null);
      setSnackMessage(response.data.message); // Dùng Snackbar
      setSnackOpen(true);
      fetchData();
    } catch (error) {
      console.error("Error updating wallet:", error);
      setAlertMessage({
        type: "error",
        message:
          error.response?.data?.message ||
          "Có lỗi khi cập nhật ví. Vui lòng thử lại sau.",
      });
    }
  };

  const handleCloseSnack = () => {
    setSnackOpen(false);
  };

  const filterData = (data) => {
    if (!searchTerm) return data;

    return data.filter(
      (item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id?.toString().includes(searchTerm.toLowerCase())
    );
  };

  const formatWalletAddress = (address) => {
    if (!address) return "";
    if (address.includes("...")) return address;
    return `${address.substring(0, 10)}...${address.substring(
      address.length - 8
    )}`;
  };

  const formatImageUrl = (imageUrl) => {
    if (!imageUrl) return "https://via.placeholder.com/150";
    if (imageUrl.startsWith("/uploads")) {
      return `http://localhost:3000${imageUrl}`;
    }
    return imageUrl;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!account) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography variant="h6">
            Vui lòng kết nối ví để sử dụng chức năng của trung tâm phân phối
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", flexDirection: "column" }}>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 250, bgcolor: "#FFFFFF", height: "100%", p: 2 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", color: "#333", mb: 2 }}
          >
            Fruit Supply Chain
          </Typography>
          <Typography variant="subtitle2" sx={{ color: "#888", mt: 2, mb: 1 }}>
            TỔNG QUAN
          </Typography>
          <List>
            <ListItem
              button
              onClick={() => handleMenuClick("statistics")}
              sx={{
                bgcolor:
                  currentPage === "statistics" ? "#007BFF" : "transparent",
                color: currentPage === "statistics" ? "white" : "inherit",
                "&:hover": {
                  bgcolor: currentPage === "statistics" ? "#0069D9" : "#f0f0f0",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: currentPage === "statistics" ? "white" : "inherit",
                }}
              >
                <AssessmentIcon />
              </ListItemIcon>
              <ListItemText primary="Thống kê" />
            </ListItem>
          </List>
          <Typography variant="subtitle2" sx={{ color: "#888", mt: 2, mb: 1 }}>
            SẢN PHẨM
          </Typography>
          <List>
            <ListItem
              button
              onClick={() => handleMenuClick("shop")}
              sx={{
                bgcolor: currentPage === "shop" ? "#007BFF" : "transparent",
                color: currentPage === "shop" ? "white" : "inherit",
                "&:hover": {
                  bgcolor: currentPage === "shop" ? "#0069D9" : "#f0f0f0",
                },
              }}
            >
              <ListItemIcon
                sx={{ color: currentPage === "shop" ? "white" : "inherit" }}
              >
                <ShoppingBagIcon />
              </ListItemIcon>
              <ListItemText primary="Shop" />
            </ListItem>
            <ListItem
              button
              onClick={() => handleMenuClick("orders")}
              sx={{
                bgcolor: currentPage === "orders" ? "#007BFF" : "transparent",
                color: currentPage === "orders" ? "white" : "inherit",
                "&:hover": {
                  bgcolor: currentPage === "orders" ? "#0069D9" : "#f0f0f0",
                },
              }}
            >
              <ListItemIcon
                sx={{ color: currentPage === "orders" ? "white" : "inherit" }}
              >
                <ReceiptIcon />
              </ListItemIcon>
              <ListItemText primary="Đơn Đặt Hàng" />
            </ListItem>
            <ListItem
              button
              onClick={() => handleMenuClick("purchases")}
              sx={{
                bgcolor:
                  currentPage === "purchases" ? "#007BFF" : "transparent",
                color: currentPage === "purchases" ? "white" : "inherit",
                "&:hover": {
                  bgcolor: currentPage === "purchases" ? "#0069D9" : "#f0f0f0",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: currentPage === "purchases" ? "white" : "inherit",
                }}
              >
                <ShoppingCartIcon />
              </ListItemIcon>
              <ListItemText primary="Đơn Mua" />
            </ListItem>
            <ListItem
              button
              onClick={() => handleMenuClick("outgoing-products")}
              sx={{
                bgcolor:
                  currentPage === "outgoing-products"
                    ? "#007BFF"
                    : "transparent",
                color:
                  currentPage === "outgoing-products" ? "white" : "inherit",
                "&:hover": {
                  bgcolor:
                    currentPage === "outgoing-products" ? "#0069D9" : "#f0f0f0",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color:
                    currentPage === "outgoing-products" ? "white" : "inherit",
                }}
              >
                <ShoppingCartIcon />
              </ListItemIcon>
              <ListItemText primary="Sản phẩm đang bán" />
            </ListItem>
          </List>
          <Divider sx={{ my: 2 }} />
          <ListItem button onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Đăng xuất" />
          </ListItem>
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            bgcolor: "#F8F9FA",
            borderBottom: "1px solid #E9ECEF",
          }}
        >
          <Button onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </Button>
          <Typography variant="h6">
            Hi, {user?.name || "Đại lý"} ({account.substring(0, 6)}...
            {account.substring(38)})
          </Typography>
        </Box>

        <Container maxWidth="lg" sx={{ mt: 3 }}>
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
          {alertMessage.message && (
            <Alert severity={alertMessage.type} sx={{ mb: 2 }}>
              {alertMessage.message}
            </Alert>
          )}
          <Tabs value={tabValue} onChange={handleTabChange} centered>
            <Tab label="Thống kê" />
            <Tab label="Shop" />
            <Tab label="Đơn đặt hàng" />
            <Tab label="Đơn mua" />
            {/* <Tab label="Sản phẩm đang bán" /> */}
          </Tabs>
          <Outlet
            context={{
              tabValue,
              handleTabChange,
              searchTerm,
              handleSearchChange,
              handleRefresh,
              alertMessage,
              setAlertMessage,
              showShipmentForm,
              setShowShipmentForm,
              selectedShipment,
              setSelectedShipment,
              incomingShipments,
              inventory,
              setInventory,
              outgoingShipments,
              outgoingProducts,
              setOutgoingProducts,
              handleReceiveShipment,
              handlePrepareShipment,
              handleShipmentCreated,
              handleHarvestFruit,
              handlePurchaseProduct,
              executeTransaction,
              contract,
              filterData,
              formatImageUrl,
              handleMenuClick,
            }}
          />
        </Container>

        {/* Thêm Snackbar để hiển thị thông báo thành công */}
        <Snackbar
          open={snackOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnack}
          message={snackMessage}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        />
      </Box>
    </Box>
  );
};

export default DeliveryHubPage;
