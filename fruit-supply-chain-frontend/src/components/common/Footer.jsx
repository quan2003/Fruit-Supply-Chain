// fruit-supply-chain-frontend/src/components/common/Footer.jsx
import React from "react";
import { Box, Container, Typography, Link as MuiLink } from "@mui/material";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Footer = () => {
  const linkHover = {
    scale: 1.1,
    color: "#FF8E53",
    transition: { duration: 0.3 },
  };

  return (
    <Box
      component="footer"
      sx={{
        background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
        color: "white",
        py: 4,
        mt: 4,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box sx={{ mb: { xs: 2, md: 0 } }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  background:
                    "linear-gradient(45deg, #FFFFFF 30%, #FFD700 90%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Quản lý Chuỗi Cung ứng Trái cây
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Blockchain-based Supply Chain Management System
              </Typography>
            </motion.div>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: { xs: "center", md: "flex-start" },
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              Liên kết
            </Typography>
            <motion.div whileHover={linkHover}>
              <MuiLink
                component={Link}
                to="/about"
                sx={{ color: "white", textDecoration: "none", mb: 0.5 }}
              >
                Giới thiệu
              </MuiLink>
            </motion.div>
            <motion.div whileHover={linkHover}>
              <MuiLink
                component={Link}
                to="/contact"
                sx={{ color: "white", textDecoration: "none", mb: 0.5 }}
              >
                Liên hệ
              </MuiLink>
            </motion.div>
            <motion.div whileHover={linkHover}>
              <MuiLink
                component={Link}
                to="/terms"
                sx={{ color: "white", textDecoration: "none", mb: 0.5 }}
              >
                Điều khoản sử dụng
              </MuiLink>
            </motion.div>
            <motion.div whileHover={linkHover}>
              <MuiLink
                component={Link}
                to="/privacy"
                sx={{ color: "white", textDecoration: "none" }}
              >
                Chính sách bảo mật
              </MuiLink>
            </motion.div>
          </Box>
        </Box>
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Typography variant="body2">
            © {new Date().getFullYear()} Hệ thống Quản lý Chuỗi Cung ứng Trái
            cây
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
