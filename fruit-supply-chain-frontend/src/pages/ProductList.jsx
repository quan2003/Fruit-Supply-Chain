import React, { useState, useEffect } from 'react';
import { 
  Grid, Card, CardContent, CardMedia, Typography, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Box, Divider 
} from '@mui/material';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchedProducts = [
      { id: 1, name: 'Rau muống', image_url: 'https://via.placeholder.com/150', price: 12, unit: 'AGT', quantity: '2 Kg', seller: 'Nhà sản xuất', location: 'Tư Mơ Rông, Quảng Nam', dateProduced: '29/12/2024', expiryDate: '21/01/2025' },
      { id: 2, name: 'Cà chua', image_url: 'https://via.placeholder.com/150', price: 15, unit: 'AGT', quantity: '1.5 Kg', seller: 'Nhà cung cấp A', location: 'Đà Lạt, Lâm Đồng', dateProduced: '01/01/2025', expiryDate: '30/01/2025' },
      { id: 3, name: 'Cải xanh', image_url: 'https://via.placeholder.com/150', price: 18, unit: 'AGT', quantity: '3 Kg', seller: 'Hợp tác xã B', location: 'Huế, Việt Nam', dateProduced: '05/01/2025', expiryDate: '04/02/2025' },
      { id: 4, name: 'Dưa hấu', image_url: 'https://via.placeholder.com/150', price: 25, unit: 'AGT', quantity: '5 Kg', seller: 'Nhà nông D', location: 'Tiền Giang, Việt Nam', dateProduced: '02/01/2025', expiryDate: '15/01/2025' },
      { id: 5, name: 'Xoài cát', image_url: 'https://via.placeholder.com/150', price: 30, unit: 'AGT', quantity: '4 Kg', seller: 'Hộ nông dân C', location: 'An Giang, Việt Nam', dateProduced: '07/01/2025', expiryDate: '28/01/2025' },
      { id: 6, name: 'Nho Ninh Thuận', image_url: 'https://via.placeholder.com/150', price: 50, unit: 'AGT', quantity: '2.5 Kg', seller: 'Trang trại E', location: 'Ninh Thuận, Việt Nam', dateProduced: '10/01/2025', expiryDate: '05/02/2025' },
      { id: 7, name: 'Chuối sứ', image_url: 'https://via.placeholder.com/150', price: 20, unit: 'AGT', quantity: '3 Kg', seller: 'Nông trại F', location: 'Đắk Lắk, Việt Nam', dateProduced: '03/01/2025', expiryDate: '22/01/2025' },
      { id: 8, name: 'Bắp cải', image_url: 'https://via.placeholder.com/150', price: 17, unit: 'AGT', quantity: '2.8 Kg', seller: 'HTX G', location: 'Hà Nội, Việt Nam', dateProduced: '06/01/2025', expiryDate: '02/02/2025' },
    ];
    setProducts(fetchedProducts);
  }, []);

  const handleOpen = (product) => {
    setSelectedProduct(product);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom align="center">
        Danh sách sản phẩm
      </Typography>

      <Grid container spacing={3} justifyContent="center">
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <Card sx={{ maxWidth: 300, textAlign: 'center', p: 2, borderRadius: 3, boxShadow: 3 }}>
              <CardMedia
                component="img"
                height="180"
                image={product.image_url}
                alt={product.name}
                sx={{ borderRadius: 2, objectFit: 'cover' }}
              />
              <CardContent>
                <Typography variant="h6">{product.name}</Typography>
                <Typography variant="body1" color="textSecondary">
                  {product.price} {product.unit}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2, borderRadius: 2 }}
                  onClick={() => handleOpen(product)}
                >
                  Thu mua
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Hộp thoại chi tiết sản phẩm */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        {selectedProduct && (
          <>
            <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
              Thông tin sản phẩm
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={5} textAlign="center">
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: 10 }}
                  />
                </Grid>

                <Grid item xs={12} md={7}>
                  <Typography variant="h6" fontWeight="bold">{selectedProduct.name}</Typography>
                  <Typography variant="body1" color="primary" fontWeight="bold">
                    Giá: {selectedProduct.price} {selectedProduct.unit}
                  </Typography>
                  <Typography variant="body2">
                    Số lượng: <strong>{selectedProduct.quantity}</strong>
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2, width: '100%', borderRadius: 2 }}
                  >
                    Thu mua
                  </Button>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" alignItems="center" p={2} bgcolor="#f5f5f5" borderRadius={2}>
                <Avatar sx={{ mr: 2 }}>S</Avatar>
                <Box>
                  <Typography variant="body1">
                    <strong>Người bán:</strong> {selectedProduct.seller}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedProduct.location}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="body2"><strong>Ngày sản xuất:</strong> {selectedProduct.dateProduced}</Typography>
                <Typography variant="body2"><strong>Hạn sử dụng:</strong> {selectedProduct.expiryDate}</Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center' }}>
              <Button onClick={handleClose} color="secondary" variant="contained" sx={{ borderRadius: 2 }}>
                Đóng
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
};

export default ProductList;
