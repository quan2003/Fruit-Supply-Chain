import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Divider,
  Button,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useWeb3 } from "../contexts/Web3Context";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const StyledContainer = styled(Container)(({ theme }) => ({
  background: "#ffffff",
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  minHeight: "100vh",
  position: "relative",
}));

const StyledCard = styled(Card)(({ theme }) => ({
  boxShadow: theme.shadows[2],
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
  backgroundColor: "#fff",
}));

const StatusTypography = styled(Typography)(({ theme, status }) => ({
  color:
    status === "Delivered"
      ? theme.palette.success.main
      : status === "Processing"
      ? theme.palette.warning.main
      : theme.palette.info.main,
  fontWeight: "bold",
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#FF6F91",
  "&:hover": {
    backgroundColor: "#FF4D73",
  },
  fontWeight: "bold",
  padding: "8px 16px",
  fontSize: "0.875rem",
  borderRadius: theme.shape.borderRadius,
  textTransform: "none",
  margin: theme.spacing(1),
  color: "#fff",
}));

const CustomerOrders = () => {
  const { user, loading: authLoading } = useAuth();
  const { account, connectWallet, loading: web3Loading } = useWeb3();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState({ type: "", message: "" });

  useEffect(() => {
    const fetchOrders = async () => {
      console.log("User tại thời điểm gọi fetchOrders:", user);
      console.log("Account tại thời điểm gọi fetchOrders:", account);

      // Kiểm tra xem user có tồn tại và có vai trò Customer không
      if (!user || user.role !== "Customer" || !user.id) {
        console.log("User không hợp lệ hoặc không phải Customer:", user);
        setAlertMessage({
          type: "error",
          message: "Vui lòng đăng nhập với vai trò người tiêu dùng!",
        });
        setLoading(false);
        return;
      }

      // Kiểm tra xem ví MetaMask đã được kết nối chưa
      if (!account) {
        console.log("Account không tồn tại, yêu cầu kết nối ví MetaMask.");
        setAlertMessage({
          type: "error",
          message: "Vui lòng kết nối ví MetaMask để xem đơn hàng!",
        });
        setLoading(false);
        return;
      }

      // Kiểm tra xem user có walletAddress không
      if (!user.walletAddress) {
        console.log("User không có walletAddress:", user);
        setAlertMessage({
          type: "error",
          message:
            "Tài khoản của bạn chưa liên kết ví MetaMask. Vui lòng cập nhật ví trong hồ sơ!",
        });
        setLoading(false);
        return;
      }

      // So sánh account và user.walletAddress một cách an toàn
      const accountLower = account ? account.toLowerCase() : "";
      const walletAddressLower = user.walletAddress
        ? user.walletAddress.toLowerCase()
        : "";
      console.log("So sánh account và walletAddress:", {
        accountLower,
        walletAddressLower,
      });
      if (accountLower !== walletAddressLower) {
        console.log("Account không khớp với walletAddress:", {
          accountLower,
          walletAddressLower,
        });
        setAlertMessage({
          type: "error",
          message:
            "Địa chỉ ví MetaMask không khớp với tài khoản của bạn! Vui lòng kết nối đúng ví.",
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/customer/orders`, {
          headers: { "x-ethereum-address": account },
        });
        console.log("Danh sách đơn hàng:", response.data);
        setOrders(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách đơn hàng:", error);
        setAlertMessage({
          type: "error",
          message:
            error.response?.data?.error ||
            "Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.",
        });
      } finally {
        setLoading(false);
      }
    };

    // Đợi cả authLoading và web3Loading hoàn tất trước khi gọi fetchOrders
    if (!authLoading && !web3Loading) {
      fetchOrders();
    }
  }, [user, account, authLoading, web3Loading]);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error("Lỗi khi kết nối ví MetaMask:", error);
      setAlertMessage({
        type: "error",
        message: "Không thể kết nối ví MetaMask. Vui lòng thử lại.",
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) {
      return "Không có thông tin";
    }
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading || authLoading || web3Loading) {
    return (
      <StyledContainer sx={{ textAlign: "center", mt: 4 }}>
        <CircularProgress sx={{ color: "#FF6F91" }} />
        <Typography variant="body1" sx={{ mt: 2, color: "text.secondary" }}>
          Đang tải danh sách đơn hàng...
        </Typography>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: "bold",
          color: "#FF6F91",
          mb: 4,
          textAlign: "center",
        }}
      >
        Quản lý đơn hàng
      </Typography>

      {alertMessage.message && (
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Alert severity={alertMessage.type} sx={{ mb: 2 }}>
            {alertMessage.message}
          </Alert>
          {alertMessage.message.includes("MetaMask") && (
            <StyledButton variant="contained" onClick={handleConnectWallet}>
              Kết nối ví MetaMask
            </StyledButton>
          )}
        </Box>
      )}

      {!alertMessage.message && orders.length === 0 ? (
        <Typography
          variant="body1"
          sx={{ textAlign: "center", color: "text.secondary" }}
        >
          Bạn chưa có đơn hàng nào.
        </Typography>
      ) : (
        orders.map((order) => (
          <StyledCard key={order.id}>
            <CardHeader
              title={`Đơn hàng #${order.id}`}
              subheader={`Ngày đặt: ${formatDate(order.order_date)}`}
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
              subheaderTypographyProps={{
                variant: "body2",
                color: "text.secondary",
              }}
            />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Trung tâm phân phối: {order.delivery_hub_name}
                </Typography>
                <StatusTypography variant="body1" status={order.status}>
                  Trạng thái:
                  {order.status === "Pending"
                    ? "Đang chờ xử lý"
                    : order.status === "Processing"
                    ? "Đang xử lý"
                    : order.status === "Delivered"
                    ? "Đã giao"
                    : order.status}
                </StatusTypography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" sx={{ mb: 1, fontWeight: "bold" }}>
                Sản phẩm đã mua:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary={`${order.product_name}`}
                    secondary={`Số lượng: ${order.quantity} - Giá: ${
                      order.price ? `${order.price} AGT` : "Giá không khả dụng"
                    }`}
                  />
                </ListItem>
              </List>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1">
                Địa chỉ giao hàng:{" "}
                {order.shipping_address || "Không có thông tin"}
              </Typography>
            </CardContent>
          </StyledCard>
        ))
      )}
    </StyledContainer>
  );
};

export default CustomerOrders;
