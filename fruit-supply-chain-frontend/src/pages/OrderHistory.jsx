import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

const OrderHistory = () => {
  const [orderHistory, setOrderHistory] = useState([]);

  // Giả lập dữ liệu lịch sử đơn hàng đã giao
  useEffect(() => {
    const fetchedOrderHistory = [
      { id: 1, productName: 'Sản phẩm A', price: 100, quantity: 2, receiver: 'Nguyễn Văn A', address: 'Địa chỉ 1', deliveryPerson: 'Lý Thị M' },
      { id: 2, productName: 'Sản phẩm B', price: 150, quantity: 1, receiver: 'Trần Thị B', address: 'Địa chỉ 2', deliveryPerson: 'Nguyễn Quang H' },
      { id: 3, productName: 'Sản phẩm C', price: 200, quantity: 3, receiver: 'Lê Văn C', address: 'Địa chỉ 3', deliveryPerson: 'Đặng Minh T' },
    ];
    setOrderHistory(fetchedOrderHistory);
  }, []);

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Lịch sử đơn hàng đã giao
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
              <TableCell>Người nhận</TableCell>
              <TableCell>Địa chỉ</TableCell>
              <TableCell>Người giao</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orderHistory.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.productName}</TableCell>
                <TableCell>{order.price.toLocaleString()} VND</TableCell>
                <TableCell>{order.quantity}</TableCell>
                <TableCell>{(order.price * order.quantity).toLocaleString()} VND</TableCell>
                <TableCell>{order.receiver}</TableCell>
                <TableCell>{order.address}</TableCell>
                <TableCell>{order.deliveryPerson}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default OrderHistory;
