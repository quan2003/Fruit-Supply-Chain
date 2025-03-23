// src/pages/DeliveryHubPage.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Alert,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  LocalShipping as LocalShippingIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  ShoppingBag as ShoppingBagIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useWeb3 } from "../contexts/Web3Context";
import { useAuth } from "../contexts/AuthContext";
import IncomingShipmentsList from "../components/DeliveryHub/IncomingShipmentsList";
import OutgoingShipmentsList from "../components/DeliveryHub/OutgoingShipmentsList";
import InventoryList from "../components/DeliveryHub/InventoryList";
import ShipmentForm from "../components/DeliveryHub/ShipmentForm";
import StatisticsPage from "../components/DeliveryHub/StatisticsPage";
import ShopPage from "../components/DeliveryHub/ShopPage";
import {
  getIncomingShipments,
  getOutgoingShipments,
  getInventory,
  receiveShipment,
  shipToCustomer,
} from "../services/deliveryHubService";
import { getFarmByIdService } from "../services/farmService";
import {
  getAllUsersService,
  getUserByIdService,
} from "../services/userService";
import axios from "axios";

const API_URL = "http://localhost:3000";

const DeliveryHubPage = () => {
  const { account } = useWeb3();
  const { user } = useAuth();
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
  const [farmDetails, setFarmDetails] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [products, setProducts] = useState([]);

  // Hàm để lấy thông tin sản phẩm từ API
  const getProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      return response.data;
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  };

  // Hàm để tìm producer đúng với sản phẩm
  const findProducerUserForProduct = async (productName) => {
    try {
      const allUsers = await getAllUsersService();
      const producers = allUsers.filter((user) => user.role === "Producer");

      if (!producers || producers.length === 0) {
        return {
          id: 7,
          name: "Lưu Quân",
          walletAddress: "0x751f328447976e78956cf46d339ef0d255d149ea",
        };
      }

      return {
        id: producers[0].id,
        name: producers[0].name,
        walletAddress: producers[0].wallet_address,
      };
    } catch (error) {
      console.error("Error finding producer user:", error);
      return {
        id: 7,
        name: "Lưu Quân",
        walletAddress: "0x751f328447976e78956cf46d339ef0d255d149ea",
      };
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Lấy dữ liệu lô hàng và hàng tồn kho
        const incoming = await getIncomingShipments();
        setIncomingShipments(incoming);

        const outgoing = await getOutgoingShipments();
        setOutgoingShipments(outgoing);

        const inv = await getInventory();
        setInventory(inv);

        // Lấy danh sách sản phẩm
        const productList = await getProducts();
        setProducts(productList);

        // Lấy thông tin producer cho sản phẩm
        try {
          const currentProductName =
            productList && productList.length > 0 ? productList[0].name : null;

          const producer = await findProducerUserForProduct(currentProductName);

          if (producer) {
            setUserDetails(producer);

            try {
              const farmResponse = await getFarmByIdService("1");
              setFarmDetails({
                farm_name: farmResponse?.farm_name || "Tình Lá Cải",
                location: farmResponse?.location || "Tỉnh Lào Cai",
                weather_condition:
                  farmResponse?.weather_condition || "Nhiệt đới gió mùa",
                quality: farmResponse?.quality || "Nàng",
                current_conditions:
                  farmResponse?.current_conditions || "21.92°C, Nắng",
              });
            } catch (farmError) {
              console.error("Error fetching farm details:", farmError);
              setFarmDetails({
                farm_name: "Tình Lá Cải",
                location: "Tỉnh Lào Cai",
                weather_condition: "Nhiệt đới gió mùa",
                quality: "Nàng",
                current_conditions: "21.92°C, Nắng",
              });
            }
          } else {
            setUserDetails({
              id: 7,
              name: "Lưu Quân",
              walletAddress: "0x751f328447976e78956cf46d339ef0d255d149ea",
            });
            setFarmDetails({
              farm_name: "Tình Lá Cải",
              location: "Tỉnh Lào Cai",
              weather_condition: "Nhiệt đới gió mùa",
              quality: "Nàng",
              current_conditions: "21.92°C, Nắng",
            });
          }
        } catch (error) {
          console.error("Error fetching producer info:", error);
          setUserDetails({
            id: 7,
            name: "Lưu Quân",
            walletAddress: "0x751f328447976e78956cf46d339ef0d255d149ea",
          });
          setFarmDetails({
            farm_name: "Tình Lá Cải",
            location: "Tỉnh Lào Cai",
            weather_condition: "Nhiệt đới gió mùa",
            quality: "Nàng",
            current_conditions: "21.92°C, Nắng",
          });
        }

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

    if (account) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [account]);

  const handleMenuClick = (page) => {
    setCurrentPage(page);
    setDrawerOpen(false);
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
    try {
      setLoading(true);

      const incoming = await getIncomingShipments();
      setIncomingShipments(incoming);

      const outgoing = await getOutgoingShipments();
      setOutgoingShipments(outgoing);

      const inv = await getInventory();
      setInventory(inv);

      const productList = await getProducts();
      setProducts(productList);

      try {
        const currentProductName =
          productList && productList.length > 0 ? productList[0].name : null;

        const producer = await findProducerUserForProduct(currentProductName);

        if (producer) {
          setUserDetails(producer);

          try {
            const farmResponse = await getFarmByIdService("1");
            setFarmDetails({
              farm_name: farmResponse?.farm_name || "Tình Lá Cải",
              location: farmResponse?.location || "Tỉnh Lào Cai",
              weather_condition:
                farmResponse?.weather_condition || "Nhiệt đới gió mùa",
              quality: farmResponse?.quality || "Nàng",
              current_conditions:
                farmResponse?.current_conditions || "21.92°C, Nắng",
            });
          } catch (farmError) {
            console.error("Error fetching farm details:", farmError);
            setFarmDetails({
              farm_name: "Tình Lá Cải",
              location: "Tỉnh Lào Cai",
              weather_condition: "Nhiệt đới gió mùa",
              quality: "Nàng",
              current_conditions: "21.92°C, Nắng",
            });
          }
        } else {
          setUserDetails({
            id: 7,
            name: "Lưu Quân",
            walletAddress: "0x751f328447976e78956cf46d339ef0d255d149ea",
          });
          setFarmDetails({
            farm_name: "Tình Lá Cải",
            location: "Tỉnh Lào Cai",
            weather_condition: "Nhiệt đới gió mùa",
            quality: "Nàng",
            current_conditions: "21.92°C, Nắng",
          });
        }
      } catch (error) {
        console.error("Error fetching producer info:", error);
        setUserDetails({
          id: 7,
          name: "Lưu Quân",
          walletAddress: "0x751f328447976e78956cf46d339ef0d255d149ea",
        });
        setFarmDetails({
          farm_name: "Tình Lá Cải",
          location: "Tỉnh Lào Cai",
          weather_condition: "Nhiệt đới gió mùa",
          quality: "Nàng",
          current_conditions: "21.92°C, Nắng",
        });
      }

      setLoading(false);
      setAlertMessage({
        type: "success",
        message: "Dữ liệu đã được cập nhật thành công!",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      setAlertMessage({
        type: "error",
        message: "Có lỗi khi cập nhật dữ liệu. Vui lòng thử lại sau.",
      });
      setLoading(false);
    }
  };

  const handleReceiveShipment = async (shipmentId) => {
    try {
      setLoading(true);
      await receiveShipment(shipmentId);

      const incoming = await getIncomingShipments();
      setIncomingShipments(incoming);

      const inv = await getInventory();
      setInventory(inv);

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

      const inv = await getInventory();
      setInventory(inv);

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
    localStorage.removeItem("user");
    navigate("/");
  };

  const filterData = (data) => {
    if (!searchTerm) return data;

    return data.filter(
      (item) =>
        item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fruitType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Format wallet address for display
  const formatWalletAddress = (address) => {
    if (!address) return "";
    if (address.includes("...")) return address;
    return `${address.substring(0, 10)}...${address.substring(
      address.length - 8
    )}`;
  };

  // Get producer information
  const getProducerInfo = () => {
    return {
      name: userDetails?.name || "Lưu Quân",
      walletAddress: formatWalletAddress(
        userDetails?.walletAddress ||
          "0x751f328447976e78956cf46d339ef0d255d149ea"
      ),
      location: farmDetails?.location || "Tỉnh Lào Cai",
    };
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
          {currentPage === "statistics" && <StatisticsPage />}

          {currentPage === "shop" && <ShopPage />}

          {currentPage === "orders" && (
            <Typography variant="h5">
              Trang Đơn Đặt Hàng (Đang phát triển)
            </Typography>
          )}

          {currentPage === "purchases" && (
            <>
              <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
                Đơn Mua
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Mã sản phẩm</TableCell>
                      <TableCell>Tên</TableCell>
                      <TableCell>Hình ảnh</TableCell>
                      <TableCell>Giá</TableCell>
                      <TableCell>Loại</TableCell>
                      <TableCell>Mô tả</TableCell>
                      <TableCell>Số lượng</TableCell>
                      <TableCell>Ngày sản xuất</TableCell>
                      <TableCell>Hạn sử dụng</TableCell>
                      <TableCell>Thao tác</TableCell>
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
            </>
          )}

          {currentPage === "dashboard" && (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography variant="h4" component="h1">
                  <StoreIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                  Quản lý trung tâm phân phối
                </Typography>

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                >
                  Làm mới dữ liệu
                </Button>
              </Box>

              {alertMessage.message && (
                <Alert
                  severity={alertMessage.type}
                  sx={{ mb: 3 }}
                  onClose={() => setAlertMessage({ type: "", message: "" })}
                >
                  {alertMessage.message}
                </Alert>
              )}

              {/* Hiển thị thông tin người bán từ database */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Thông tin người bán
                </Typography>
                <Typography variant="body1">
                  <strong>Tên người bán:</strong> {getProducerInfo().name}
                </Typography>
                <Typography variant="body1">
                  <strong>Địa chỉ ví:</strong> {getProducerInfo().walletAddress}
                </Typography>
                <Typography variant="body1">
                  <strong>Vị trí:</strong> {getProducerInfo().location}
                </Typography>
              </Paper>

              <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Tìm kiếm theo tên sản phẩm, mã lô, nguồn gốc hoặc khách hàng..."
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
              </Paper>

              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab
                    icon={<LocalShippingIcon />}
                    label="Lô hàng đến"
                    iconPosition="start"
                  />
                  <Tab
                    icon={<InventoryIcon />}
                    label="Hàng tồn kho"
                    iconPosition="start"
                  />
                  <Tab
                    icon={
                      <LocalShippingIcon sx={{ transform: "scaleX(-1)" }} />
                    }
                    label="Lô hàng đi"
                    iconPosition="start"
                  />
                </Tabs>
              </Box>

              {tabValue === 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom>
                    Danh sách lô hàng đến
                  </Typography>
                  <IncomingShipmentsList
                    shipments={filterData(incomingShipments)}
                    onReceiveShipment={handleReceiveShipment}
                  />
                </Paper>
              )}

              {tabValue === 1 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom>
                    Danh sách hàng tồn kho
                  </Typography>
                  <InventoryList
                    inventory={filterData(inventory)}
                    onPrepareShipment={handlePrepareShipment}
                  />
                </Paper>
              )}

              {tabValue === 2 && (
                <Paper sx={{ p: 3 }}>
                  {showShipmentForm ? (
                    <>
                      <Typography variant="h5" gutterBottom>
                        Tạo lô hàng gửi đi
                      </Typography>
                      <ShipmentForm
                        fruitItem={selectedShipment}
                        onSubmit={handleShipmentCreated}
                        onCancel={() => {
                          setShowShipmentForm(false);
                          setSelectedShipment(null);
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <Typography variant="h5" gutterBottom>
                        Danh sách lô hàng đi
                      </Typography>
                      <OutgoingShipmentsList
                        shipments={filterData(outgoingShipments)}
                      />
                    </>
                  )}
                </Paper>
              )}
            </>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default DeliveryHubPage;
