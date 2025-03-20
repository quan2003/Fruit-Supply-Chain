import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Typography } from '@mui/material';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);

  // Giả lập dữ liệu đơn hàng
  useEffect(() => {
    const fetchedOrders = [
      { id: 1, productName: 'Sản phẩm A', price: 100, quantity: 2, address: 'Địa chỉ 1', receiver: 'Nguyễn Văn A' },
      { id: 2, productName: 'Sản phẩm B', price: 150, quantity: 1, address: 'Địa chỉ 2', receiver: 'Trần Thị B' },
      { id: 3, productName: 'Sản phẩm C', price: 200, quantity: 3, address: 'Địa chỉ 3', receiver: 'Lê Văn C' },
    ];
    setOrders(fetchedOrders);
  }, []);

  const handleDelivery = (id) => {
    // Giả lập hành động giao hàng
    console.log(`Giao hàng cho đơn hàng với ID: ${id}`);
    // Cập nhật trạng thái sau khi giao hàng (có thể thêm logic tùy theo yêu cầu)
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Quản lý đơn hàng
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Tên sản phẩm</TableCell>
              <TableCell>Giá</TableCell>
              <TableCell>Số lượng</TableCell>
              <TableCell>Thành tiền</TableCell>
              <TableCell>Địa chỉ</TableCell>
              <TableCell>Tên người nhận</TableCell>
              <TableCell>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.productName}</TableCell>
                <TableCell>{order.price.toLocaleString()} VND</TableCell>
                <TableCell>{order.quantity}</TableCell>
                <TableCell>{(order.price * order.quantity).toLocaleString()} VND</TableCell>
                <TableCell>{order.address}</TableCell>
                <TableCell>{order.receiver}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleDelivery(order.id)}
                  >
                    Giao hàng
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default OrderManagement;
