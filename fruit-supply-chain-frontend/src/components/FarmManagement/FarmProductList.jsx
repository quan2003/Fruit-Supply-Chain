import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWeb3 } from "../../contexts/Web3Context";
import { getFruitProducts } from "../../services/fruitService";
import LoadingSpinner from "../common/LoadingSpinner";
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
  Box,
  TablePagination,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import "../FruitCatalog/CatalogStyles.css";

const FarmProductList = () => {
  const navigate = useNavigate();
  const { account } = useWeb3();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const user = JSON.parse(localStorage.getItem("user")) || {};

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user.email || !account) {
        setError("Vui lòng đăng nhập và kết nối ví MetaMask!");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getFruitProducts(user.email, {
          "x-ethereum-address": account,
        });
        setProducts(data || []);
        setLoading(false);

        // Kiểm tra xem có farm không
        const response = await fetch(
          `http://localhost:3000/farms/user?email=${user.email}`,
          {
            headers: {
              "Content-Type": "application/json",
              "x-ethereum-address": account,
            },
          }
        );
        const farms = await response.json();
        if (!response.ok || farms.length === 0) {
          setError("Không tìm thấy farm của bạn! Vui lòng tạo farm trước.");
          setTimeout(() => navigate("/farms/register"), 3000);
        }
      } catch (err) {
        setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.");
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user.email, account, navigate]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading)
    return (
      <div className="loading-message">
        <LoadingSpinner /> Đang tải dữ liệu...
      </div>
    );

  if (error) {
    return (
      <Box sx={{ p: 3, maxWidth: "1200px", margin: "0 auto" }}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate("/farms/register")}
            >
              Tạo Farm
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: "1200px", margin: "0 auto" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: "bold", color: "#2E7D32" }}>
          Danh sách sản phẩm trong Farms
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          to="/farms/add-product"
          sx={{
            bgcolor: "#1976D2",
            "&:hover": { bgcolor: "#115293" },
            textTransform: "none",
            fontWeight: "bold",
          }}
        >
          Thêm sản phẩm
        </Button>
      </Box>

      {products.length === 0 ? (
        <Typography>
          Không có sản phẩm nào để hiển thị. Hãy thêm sản phẩm mới!
        </Typography>
      ) : (
        <>
          <TableContainer
            component={Paper}
            sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#E8F5E9" }}>
                  <TableCell sx={{ fontWeight: "bold", color: "#388E3C" }}>
                    ID
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "#388E3C" }}>
                    Mã sản phẩm
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "#388E3C" }}>
                    Tên
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "#388E3C" }}>
                    Hình ảnh
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "#388E3C" }}>
                    Giá (AGT)
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "#388E3C" }}>
                    Loại
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "#388E3C" }}>
                    Mô tả
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "#388E3C" }}>
                    Số lượng (hộp)
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "#388E3C" }}>
                    Ngày sản xuất
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "#388E3C" }}>
                    Hạn sử dụng
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((product) => (
                    <TableRow
                      key={product.id}
                      sx={{
                        "&:hover": { bgcolor: "#F5F5F5" },
                        transition: "background-color 0.3s",
                      }}
                    >
                      <TableCell>{product.id}</TableCell>
                      <TableCell>{product.productcode}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>
                        <img
                          src={
                            product.imageurl
                              ? `http://localhost:3000${product.imageurl}`
                              : "https://via.placeholder.com/150"
                          }
                          alt={product.name}
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
                      <TableCell>{product.price}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.description}</TableCell>
                      <TableCell>{product.quantity}</TableCell>
                      <TableCell>
                        {new Date(product.productdate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(product.expirydate).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={products.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ mt: 2 }}
          />
        </>
      )}
    </Box>
  );
};

export default FarmProductList;
