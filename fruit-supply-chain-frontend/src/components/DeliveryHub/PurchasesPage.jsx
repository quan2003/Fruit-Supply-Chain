// src/components/DeliveryHub/PurchasesPage.jsx
import React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from "@mui/material";
import { useOutletContext } from "react-router-dom";

const PurchasesPage = () => {
  const { inventory, formatImageUrl, handleRefresh } = useOutletContext();

  const handleSellProduct = async (inventoryId, quantity) => {
    try {
      const response = await fetch("http://localhost:3000/sell-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryId, quantity }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Sản phẩm đã được đưa lên bán thành công!");
        await handleRefresh(); // Cập nhật inventory sau khi bán
      } else {
        alert(data.message || "Có lỗi xảy ra khi đưa sản phẩm lên bán!");
      }
    } catch (error) {
      console.error("Error selling product:", error);
      alert("Có lỗi xảy ra khi đưa sản phẩm lên bán!");
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Đơn Mua
        </Typography>
        <Button variant="contained" color="primary" onClick={handleRefresh}>
          Làm mới
        </Button>
      </Box>

      {inventory.length === 0 ? (
        <Typography>Không có đơn mua nào để hiển thị.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Mã sản phẩm</TableCell>
                <TableCell>Tên</TableCell>
                <TableCell>Hình ảnh</TableCell>
                <TableCell>Giá (AGT)</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell>Mô tả</TableCell>
                <TableCell>Số lượng (Hộp)</TableCell>
                <TableCell>Ngày xuất</TableCell>
                <TableCell>Hạn sử dụng</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.productcode || "Không có"}</TableCell>
                  <TableCell>{item.name || "Không có"}</TableCell>
                  <TableCell>
                    <img
                      src={formatImageUrl(item.imageurl)}
                      alt={item.name || "Sản phẩm"}
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "5px",
                      }}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/150";
                      }}
                    />
                  </TableCell>
                  <TableCell>{item.price || "Không có"} AGT</TableCell>
                  <TableCell>{item.category || "Không có"}</TableCell>
                  <TableCell>{item.description || "Không có"}</TableCell>
                  <TableCell>{item.quantity || "Không có"}</TableCell>
                  <TableCell>
                    {item.productdate
                      ? new Date(item.productdate).toLocaleDateString()
                      : "Không có"}
                  </TableCell>
                  <TableCell>
                    {item.expirydate
                      ? new Date(item.expirydate).toLocaleDateString()
                      : "Không có"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleSellProduct(item.id, item.quantity)}
                    >
                      ĐANG BÁN
                    </Button>
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

export default PurchasesPage;
