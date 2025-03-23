// src/pages/UnauthorizedPage.jsx
import React from "react";
import { Container, Typography, Box, Button } from "@mui/material";
import { Link } from "react-router-dom";
import Layout from "../components/common/Layout";

const UnauthorizedPage = () => {
  return (
    <Layout>
      <Container maxWidth="md">
        <Box
          sx={{
            textAlign: "center",
            mt: 8,
            p: 4,
            border: "1px solid #f0f0f0",
            borderRadius: 2,
            backgroundColor: "#fff8f8",
          }}
        >
          <Typography variant="h4" color="error" gutterBottom>
            Không có quyền truy cập
          </Typography>
          <Typography variant="body1" paragraph>
            Bạn không có quyền truy cập vào trang này. Vui lòng đăng nhập với
            tài khoản có quyền phù hợp.
          </Typography>
          <Box mt={4}>
            <Button
              component={Link}
              to="/dang-nhap"
              variant="contained"
              color="primary"
              sx={{ mr: 2 }}
            >
              Đăng nhập
            </Button>
            <Button component={Link} to="/" variant="outlined">
              Về trang chủ
            </Button>
          </Box>
        </Box>
      </Container>
    </Layout>
  );
};

export default UnauthorizedPage;
