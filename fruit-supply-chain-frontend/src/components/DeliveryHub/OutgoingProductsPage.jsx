// components/DeliveryHub/OutgoingProductsPage.jsx
import React from "react";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

const OutgoingProductsPage = ({ outgoingProducts, formatImageUrl }) => {
  // Kiểm tra nếu outgoingProducts không tồn tại hoặc không phải là mảng
  if (!outgoingProducts || !Array.isArray(outgoingProducts)) {
    return <Typography>Chưa có sản phẩm nào đang bán.</Typography>;
  }

  return (
    <div>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ fontWeight: "bold", color: "#FF6F91" }}
      >
        Sản phẩm đang bán
      </Typography>
      {outgoingProducts.length === 0 ? (
        <Typography>Chưa có sản phẩm nào đang bán.</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Hình ảnh</TableCell>
              <TableCell>Tên sản phẩm</TableCell>
              <TableCell>Giá (AGT)</TableCell>
              <TableCell>Số lượng</TableCell>
              <TableCell>Ngày đăng bán</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {outgoingProducts.map((product) => (
              <TableRow key={product.listing_id}>
                <TableCell>
                  <img
                    src={formatImageUrl(product.imageurl)}
                    alt={product.name}
                    style={{ width: 50, height: 50, objectFit: "cover" }}
                  />
                </TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.price}</TableCell>
                <TableCell>{product.quantity}</TableCell>
                <TableCell>
                  {new Date(product.listed_date).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default OutgoingProductsPage;
