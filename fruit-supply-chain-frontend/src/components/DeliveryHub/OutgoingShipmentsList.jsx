// fruit-supply-chain-frontend/src/components/DeliveryHub/OutgoingShipmentsList.jsx
import React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  LocalShipping as LocalShippingIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

const OutgoingShipmentsList = ({ shipments }) => {
  if (!shipments || shipments.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Không có lô hàng gửi đi nào. Các lô hàng sẽ xuất hiện ở đây khi bạn
          tạo lô hàng mới để gửi đến khách hàng.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
            <TableCell>Mã lô hàng</TableCell>
            <TableCell>Tên sản phẩm</TableCell>
            <TableCell>Loại trái cây</TableCell>
            <TableCell>Số lượng</TableCell>
            <TableCell>Ngày gửi</TableCell>
            <TableCell>Khách hàng</TableCell>
            <TableCell>Địa chỉ</TableCell>
            <TableCell>Trạng thái</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {shipments.map((shipment) => (
            <TableRow key={shipment.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight="bold">
                  {shipment.id.substring(0, 8)}...
                </Typography>
              </TableCell>
              <TableCell>{shipment.productName}</TableCell>
              <TableCell>{shipment.fruitType}</TableCell>
              <TableCell>{shipment.quantity}</TableCell>
              <TableCell>
                {new Date(shipment.shippedDate).toLocaleDateString("vi-VN")}
              </TableCell>
              <TableCell>
                <Tooltip title={shipment.customerAddress}>
                  <Typography variant="body2">
                    {shipment.customerName}
                  </Typography>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                  {shipment.deliveryAddress}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  icon={
                    shipment.status === "Đang vận chuyển" ? (
                      <LocalShippingIcon fontSize="small" />
                    ) : (
                      <CheckCircleIcon fontSize="small" />
                    )
                  }
                  label={shipment.status}
                  color={
                    shipment.status === "Đang vận chuyển"
                      ? "primary"
                      : "success"
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default OutgoingShipmentsList;
