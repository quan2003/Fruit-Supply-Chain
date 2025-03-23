import React from "react";
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useOutletContext } from "react-router-dom";

const PurchasesPage = () => {
  const { inventory, loading, alertMessage, formatImageUrl } =
    useOutletContext();

  const formatDate = (date) => {
    if (!date || isNaN(new Date(date))) {
      return "Không có dữ liệu";
    }
    return new Date(date).toLocaleDateString();
  };

  return (
    <>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Đơn Mua
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
          <CircularProgress />
        </Box>
      ) : alertMessage &&
        typeof alertMessage === "object" &&
        alertMessage.type === "error" &&
        alertMessage.message ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {alertMessage.message}
        </Alert>
      ) : inventory.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Chưa có sản phẩm nào trong danh sách đơn mua.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Mã sản phẩm</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Tên</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Hình ảnh</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Giá (AGT)</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Loại</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Mô tả</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Số lượng</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Ngày sản xuất</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Hạn sử dụng</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.productcode || "Không có"}</TableCell>
                  <TableCell>{item.name || "Không có"}</TableCell>
                  <TableCell>
                    {item.imageurl ? (
                      <img
                        src={formatImageUrl(item.imageurl)}
                        alt={item.name || "Sản phẩm"}
                        style={{
                          width: 50,
                          height: 50,
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      "Không có"
                    )}
                  </TableCell>
                  <TableCell>{item.price} AGT</TableCell>
                  <TableCell>{item.category || "Không có"}</TableCell>
                  <TableCell>{item.description || "Không có mô tả"}</TableCell>
                  <TableCell>{item.quantity} hộp</TableCell>
                  <TableCell>{formatDate(item.productdate)}</TableCell>
                  <TableCell>{formatDate(item.expirydate)}</TableCell>
                  <TableCell>
                    <Button variant="contained" color="primary">
                      Đăng bán
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

export default PurchasesPage;
