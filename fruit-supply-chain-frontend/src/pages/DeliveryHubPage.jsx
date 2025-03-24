// src/pages/DeliveryHubPage.jsx
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
import {
  getIncomingShipments,
  getOutgoingShipments,
  getInventory,
  receiveShipment,
  shipToCustomer,
} from "../services/deliveryHubService";

const DeliveryHubPage = () => {
  const { account } = useWeb3();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [incomingShipments, setIncomingShipments] = useState([]);
  const [outgoingShipments, setOutgoingShipments] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showShipmentForm, setShowShipmentForm] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [alertMessage, setAlertMessage] = useState({ type: "", message: "" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("statistics");

  const fetchData = async () => {
    if (!account || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const incoming = await getIncomingShipments();
      setIncomingShipments(incoming);

      const outgoing = await getOutgoingShipments();
      setOutgoingShipments(outgoing);

      const inv = await getInventory(user.id);
      console.log("Fetched inventory data:", inv);
      setInventory(inv);

      setLoading(false);
    } catch (error) {
      console.error("Error loading delivery hub data:", error);
      setAlertMessage({
        type: "error",
        message: "Có lỗi khi tải dữ liệu. Vui lòng thử lại sau.",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setShowShipmentForm(false);
    setSelectedShipment(null);
    setAlertMessage({ type: "", message: "" });
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
      setAlertMessage({
        type: "success",
        message: "Đã nhận lô hàng thành công!",
      });
    } catch (error) {
      console.error("Error receiving shipment:", error);
      setAlertMessage({
        type: "error",
        message: "Có lỗi khi nhận lô hàng. Vui lòng thử lại sau.",
      });
      setLoading(false);
    }
  };

  const handlePrepareShipment = (fruitItem) => {
    setSelectedShipment(fruitItem);
    setShowShipmentForm(true);
    setTabValue(2);
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
      setAlertMessage({
        type: "success",
        message: "Đã tạo lô hàng gửi đi thành công!",
      });
    } catch (error) {
      console.error("Error creating shipment:", error);
      setAlertMessage({
        type: "error",
        message: "Có lỗi khi tạo lô hàng. Vui lòng thử lại sau.",
      });
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/");
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
              handleReceiveShipment,
              handlePrepareShipment,
              handleShipmentCreated,
              filterData,
              formatImageUrl,
              handleMenuClick,
            }}
          />
        </Container>
      </Box>
    </Box>
  );
};

export default DeliveryHubPage;
