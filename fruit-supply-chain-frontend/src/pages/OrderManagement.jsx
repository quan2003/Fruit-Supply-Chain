import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid
} from '@mui/material';

const PurchasedProducts = () => {
  const [products, setProducts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sellPrice, setSellPrice] = useState('');
  const [sellingStatus, setSellingStatus] = useState({});

  useEffect(() => {
    const fetchedProducts = [
      {
        id: 1,
        productCode: 'TAO001',
        productName: 'Táo Fuji',
        quantity: 50,
        price: 30000,
        category: 'Trái cây',
        description: 'Táo Fuji nhập khẩu từ Nhật Bản, giòn và ngọt.',
        productionDate: '2025-01-01',
        expiryDate: '2025-06-01',
        imageUrl: 'https://via.placeholder.com/200',
      },
      {
        id: 2,
        productCode: 'CAM002',
        productName: 'Cam Sành',
        quantity: 40,
        price: 25000,
        category: 'Trái cây',
        description: 'Cam sành miền Tây, giàu vitamin C.',
        productionDate: '2025-02-15',
        expiryDate: '2025-07-15',
        imageUrl: 'https://via.placeholder.com/200',
      },
      {
        id: 3,
        productCode: 'GAO003',
        productName: 'Gạo Lứt',
        quantity: 100,
        price: 15000,
        category: 'Lương thực',
        description: 'Gạo lứt hữu cơ, tốt cho sức khỏe.',
        productionDate: '2025-03-10',
        expiryDate: '2026-03-10',
        imageUrl: 'https://via.placeholder.com/200',
      },
    ];
    setProducts(fetchedProducts);
  }, []);

  const handleOpenDialog = (product) => {
    setSelectedProduct(product);
    setSellPrice('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleConfirmSell = () => {
    if (selectedProduct) {
      setSellingStatus((prevStatus) => ({
        ...prevStatus,
        [selectedProduct.id]: true, // Đánh dấu sản phẩm này đang được đăng bán
      }));
      console.log(`Sản phẩm: ${selectedProduct.productName}`);
      console.log(`Giá bán: ${sellPrice} VND`);
    }
    setOpenDialog(false);
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Danh sách sản phẩm đã thu mua
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Mã sản phẩm</TableCell>
              <TableCell>Hình ảnh</TableCell>
              <TableCell>Tên sản phẩm</TableCell>
              <TableCell>Số lượng</TableCell>
              <TableCell>Giá cả</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell>Ngày sản xuất</TableCell>
              <TableCell>Hạn sử dụng</TableCell>           
              <TableCell>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.id}</TableCell>
                <TableCell>{product.productCode}</TableCell>
                <TableCell>
                  <img src={product.imageUrl} alt={product.productName} width="50" height="50" />
                </TableCell>
                <TableCell>{product.productName}</TableCell>
                <TableCell>{product.quantity}</TableCell>
                <TableCell>{product.price.toLocaleString()} VND</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.description}</TableCell>
                <TableCell>{product.productionDate}</TableCell>
                <TableCell>{product.expiryDate}</TableCell>            
                <TableCell>
                  {sellingStatus[product.id] ? (
                    <Typography color="primary"><b>Đang đăng bán</b></Typography>
                  ) : (
                    <Button variant="contained" color="primary" onClick={() => handleOpenDialog(product)}>
                      Đăng bán
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Form */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Đăng bán sản phẩm</DialogTitle>
        {selectedProduct && (
          <DialogContent>
            <Grid container spacing={2}>
              {/* Hình ảnh chiếm 1/2 form bên trái */}
              <Grid item xs={6}>
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.productName}
                  style={{ width: '100%', height: 'auto', borderRadius: '10px' }}
                />
              </Grid>

              {/* Thông tin sản phẩm chiếm 1/2 form bên phải */}
              <Grid item xs={6} container direction="column" spacing={2}>
                <Grid item>
                  <Typography variant="h6">{selectedProduct.productName}</Typography>
                </Grid>
                <Grid item>
                  <TextField
                    label="Giá bán"
                    type="number"
                    fullWidth
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    margin="dense"
                  />
                </Grid>
              </Grid>
            </Grid>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Hủy
          </Button>
          <Button onClick={handleConfirmSell} color="primary" variant="contained">
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PurchasedProducts;
