// fruit-supply-chain-frontend/src/components/DeliveryHub/InventoryList.jsx
import React, { useState } from "react";
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
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
} from "@mui/material";
import {
  LocalShipping as LocalShippingIcon,
  InfoOutlined as InfoOutlinedIcon,
} from "@mui/icons-material";

const InventoryList = ({ inventory, onPrepareShipment }) => {
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleOpenDetailDialog = (item) => {
    setSelectedItem(item);
    setDetailDialogOpen(true);
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedItem(null);
  };

  if (!inventory || inventory.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Không có hàng trong kho. Hàng hóa sẽ xuất hiện ở đây sau khi bạn nhận
          lô hàng từ nhà vận chuyển.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell>Mã sản phẩm</TableCell>
              <TableCell>Tên sản phẩm</TableCell>
              <TableCell>Loại trái cây</TableCell>
              <TableCell>Xuất xứ</TableCell>
              <TableCell>Số lượng</TableCell>
              <TableCell>Ngày nhận</TableCell>
              <TableCell>Hạn sử dụng</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {item.id.substring(0, 8)}...
                  </Typography>
                </TableCell>
                <TableCell>{item.productName}</TableCell>
                <TableCell>{item.fruitType}</TableCell>
                <TableCell>{item.origin}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>
                  {new Date(item.receivedDate).toLocaleDateString("vi-VN")}
                </TableCell>
                <TableCell>
                  {new Date(item.expiryDate).toLocaleDateString("vi-VN")}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={
                      new Date(item.expiryDate) < new Date()
                        ? "Hết hạn"
                        : "Còn hạn"
                    }
                    color={
                      new Date(item.expiryDate) < new Date()
                        ? "error"
                        : "success"
                    }
                  />
                </TableCell>
                <TableCell align="center">
                  <Box
                    sx={{ display: "flex", justifyContent: "center", gap: 1 }}
                  >
                    <Tooltip title="Xem chi tiết">
                      <Button
                        variant="outlined"
                        size="small"
                        color="info"
                        onClick={() => handleOpenDetailDialog(item)}
                      >
                        <InfoOutlinedIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Tạo lô hàng gửi đi">
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        startIcon={<LocalShippingIcon />}
                        onClick={() => onPrepareShipment(item)}
                        disabled={
                          new Date(item.expiryDate) < new Date() ||
                          item.quantity <= 0
                        }
                      >
                        Gửi hàng
                      </Button>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Chi tiết sản phẩm Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
        maxWidth="md"
      >
        {selectedItem && (
          <>
            <DialogTitle>Chi tiết sản phẩm</DialogTitle>
            <DialogContent>
              <DialogContentText component="div">
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {selectedItem.productName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Mã sản phẩm:</strong> {selectedItem.id}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Loại trái cây:</strong> {selectedItem.fruitType}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Xuất xứ:</strong> {selectedItem.origin}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Nhà sản xuất:</strong> {selectedItem.producer}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Mô tả:</strong>{" "}
                    {selectedItem.description || "Không có mô tả"}
                  </Typography>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Thông tin lưu kho
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Ngày nhận:</strong>{" "}
                      {new Date(selectedItem.receivedDate).toLocaleDateString(
                        "vi-VN"
                      )}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Hạn sử dụng:</strong>{" "}
                      {new Date(selectedItem.expiryDate).toLocaleDateString(
                        "vi-VN"
                      )}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Số lượng:</strong> {selectedItem.quantity}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Điều kiện lưu trữ:</strong>{" "}
                      {selectedItem.storageConditions || "Nhiệt độ phòng"}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Truy xuất nguồn gốc
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Thu hoạch:</strong>{" "}
                      {new Date(selectedItem.harvestDate).toLocaleDateString(
                        "vi-VN"
                      )}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Đã vận chuyển bởi:</strong> {selectedItem.shipper}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Chất lượng:</strong> {selectedItem.quality}
                    </Typography>
                  </Box>
                </Box>
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetailDialog}>Đóng</Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<LocalShippingIcon />}
                onClick={() => {
                  handleCloseDetailDialog();
                  onPrepareShipment(selectedItem);
                }}
                disabled={
                  new Date(selectedItem.expiryDate) < new Date() ||
                  selectedItem.quantity <= 0
                }
              >
                Tạo lô hàng
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default InventoryList;
