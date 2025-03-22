// fruit-supply-chain-frontend/src/components/DeliveryHub/IncomingShipmentsList.jsx
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
  Button,
  Tooltip,
} from "@mui/material";
import {
  Check as CheckIcon,
  LocalShipping as LocalShippingIcon,
  ErrorOutline as ErrorOutlineIcon,
} from "@mui/icons-material";

const IncomingShipmentsList = ({ shipments, onReceiveShipment }) => {
  if (!shipments || shipments.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Không có lô hàng đến nào. Các lô hàng sẽ xuất hiện ở đây khi nhà vận
          chuyển gửi đến trung tâm phân phối.
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
            <TableCell>Xuất xứ</TableCell>
            <TableCell>Ngày gửi</TableCell>
            <TableCell>Nhà vận chuyển</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell align="center">Thao tác</TableCell>
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
              <TableCell>{shipment.origin}</TableCell>
              <TableCell>
                {new Date(shipment.shippedDate).toLocaleDateString("vi-VN")}
              </TableCell>
              <TableCell>
                <Tooltip title={shipment.shipperAddress}>
                  <Typography variant="body2">
                    {shipment.shipperName}
                  </Typography>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  icon={
                    shipment.status === "Đang vận chuyển" ? (
                      <LocalShippingIcon fontSize="small" />
                    ) : (
                      <ErrorOutlineIcon fontSize="small" />
                    )
                  }
                  label={shipment.status}
                  color={
                    shipment.status === "Đang vận chuyển" ? "primary" : "error"
                  }
                />
              </TableCell>
              <TableCell align="center">
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<CheckIcon />}
                  color="success"
                  disabled={shipment.status !== "Đang vận chuyển"}
                  onClick={() => onReceiveShipment(shipment.id)}
                  sx={{ minWidth: "120px" }}
                >
                  Nhận hàng
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default IncomingShipmentsList;
