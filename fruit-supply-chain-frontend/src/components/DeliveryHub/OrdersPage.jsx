import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import axios from "axios";
import { useWeb3 } from "../../contexts/Web3Context";
import { useAuth } from "../../contexts/AuthContext";

const OrdersPage = () => {
  const { user } = useAuth();
  const { account } = useWeb3();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [shippingLoading, setShippingLoading] = useState({});
  const [cancelLoading, setCancelLoading] = useState({});

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:3000/delivery-hub/orders",
        {
          headers: { "x-ethereum-address": account },
        }
      );
      console.log("Danh sách đơn hàng nhận được:", response.data);
      setOrders(response.data);
    } catch (err) {
      console.error("Lỗi khi tải danh sách đơn hàng:", err);
      setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleShipOrder = async (order) => {
    setShippingLoading((prev) => ({ ...prev, [order.id]: true }));
    try {
      const response = await axios.post(
        "http://localhost:3000/ship-to-customer",
        {
          productId: order.product_id,
          deliveryHubId: user.id,
          customerId: order.customer_id,
          quantity: order.quantity,
        },
        {
          headers: { "x-ethereum-address": account },
        }
      );

      setMessage({
        type: "success",
        text: "Lô hàng đã được gửi đi thành công!",
      });

      await fetchOrders();
    } catch (error) {
      console.error("Lỗi khi gửi lô hàng:", error);
      let errorMessage = "Lỗi khi gửi lô hàng: Lỗi không xác định";
      if (error.response) {
        errorMessage =
          error.response.data.message ||
          error.response.data.error ||
          errorMessage;
      } else {
        errorMessage = error.message || errorMessage;
      }
      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setShippingLoading((prev) => ({ ...prev, [order.id]: false }));
    }
  };

  const handleCancelOrder = async (order) => {
    setCancelLoading((prev) => ({ ...prev, [order.id]: true }));
    try {
      const response = await axios.post(
        "http://localhost:3000/cancel-order",
        { orderId: order.id },
        { headers: { "x-ethereum-address": account } }
      );

      setMessage({
        type: "success",
        text: "Hủy đơn hàng thành công!",
      });

      await fetchOrders();
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
      let errorMessage = "Lỗi khi hủy đơn hàng: Lỗi không xác định";
      if (error.response) {
        errorMessage =
          error.response.data.message ||
          error.response.data.error ||
          errorMessage;
      } else {
        errorMessage = error.message || errorMessage;
      }
      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setCancelLoading((prev) => ({ ...prev, [order.id]: false }));
    }
  };

  useEffect(() => {
    if (user && account) {
      fetchOrders();
    }
  }, [user, account]);

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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Trang Đơn Đặt Hàng
      </Typography>
      {message.text && (
        <Alert severity={message.type} sx={{ my: 2 }}>
          {message.text}
        </Alert>
      )}
      {orders.length === 0 ? (
        <Typography variant="body1">
          Hiện tại không có đơn hàng nào cần xử lý.
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID Đơn Hàng</TableCell>
                <TableCell>Tên Sản Phẩm</TableCell>
                <TableCell>Khách Hàng</TableCell>
                <TableCell>Số Lượng</TableCell>
                <TableCell>Giá</TableCell>
                <TableCell>Ngày Đặt Hàng</TableCell>
                <TableCell>Địa Chỉ Giao Hàng</TableCell>
                <TableCell>Trạng Thái</TableCell>
                <TableCell>Hành Động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.product_name}</TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>{order.price} AGT</TableCell>
                  <TableCell>
                    {new Date(order.order_date).toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell>{order.shipping_address}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>
                    {order.status === "Pending" ? (
                      <>
                        {order.available_quantity >= order.quantity ? (
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleShipOrder(order)}
                            disabled={shippingLoading[order.id]}
                            sx={{
                              backgroundColor: "#4caf50",
                              "&:hover": { backgroundColor: "#45a049" },
                              mr: 1,
                            }}
                          >
                            {shippingLoading[order.id] ? (
                              <CircularProgress size={24} />
                            ) : (
                              "Vận Chuyển"
                            )}
                          </Button>
                        ) : (
                          <Typography
                            variant="body2"
                            color="error"
                            sx={{ mr: 1, display: "inline" }}
                          >
                            Không đủ hàng (Còn: {order.available_quantity})
                          </Typography>
                        )}
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={() => handleCancelOrder(order)}
                          disabled={cancelLoading[order.id]}
                          sx={{
                            backgroundColor: "#f44336",
                            "&:hover": { backgroundColor: "#d32f2f" },
                          }}
                        >
                          {cancelLoading[order.id] ? (
                            <CircularProgress size={24} />
                          ) : (
                            "Hủy"
                          )}
                        </Button>
                      </>
                    ) : (
                      <Typography
                        variant="body2"
                        color={
                          order.status === "Cancelled"
                            ? "error"
                            : "textSecondary"
                        }
                      >
                        {order.status === "Cancelled"
                          ? "Đã hủy"
                          : "Đã vận chuyển"}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default OrdersPage;
