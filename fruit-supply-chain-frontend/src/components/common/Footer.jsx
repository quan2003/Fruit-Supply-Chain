// fruit-supply-chain-frontend/src/components/common/Footer.jsx
import React from "react";
import { Box, Container, Typography, Link as MuiLink } from "@mui/material";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Info, ContactMail, Gavel, PrivacyTip } from "@mui/icons-material";

const Footer = () => {
  const linkHover = {
    scale: 1.1,
    color: "#FFD700",
    transition: { duration: 0.3 },
  };

  return (
    <Box
      component="footer"
      sx={{
        background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
        color: "white",
        py: 1.5,
        mt: "auto",
        boxShadow: "0 -2px 5px rgba(0,0,0,0.1)",
        zIndex: 1200, // Đảm bảo Footer có zIndex cao hơn Sidebar
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: { xs: 1, md: 2 },
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: "bold",
                background: "linear-gradient(45deg, #FFFFFF 30%, #FFD700 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              © {new Date().getFullYear()} Hệ thống Quản lý Chuỗi Cung ứng Trái
              cây
            </Typography>
          </motion.div>

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: { xs: 1, md: 2 },
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <motion.div whileHover={linkHover}>
              <MuiLink
                component={Link}
                to="/about"
                sx={{
                  color: "white",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "0.875rem",
                }}
              >
                <Info sx={{ mr: 0.5, fontSize: 16 }} />
                Giới thiệu
              </MuiLink>
            </motion.div>
            <motion.div whileHover={linkHover}>
              <MuiLink
                component={Link}
                to="/contact"
                sx={{
                  color: "white",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "0.875rem",
                }}
              >
                <ContactMail sx={{ mr: 0.5, fontSize: 16 }} />
                Liên hệ
              </MuiLink>
            </motion.div>
            <motion.div whileHover={linkHover}>
              <MuiLink
                component={Link}
                to="/terms"
                sx={{
                  color: "white",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "0.875rem",
                }}
              >
                <Gavel sx={{ mr: 0.5, fontSize: 16 }} />
                Điều khoản sử dụng
              </MuiLink>
            </motion.div>
            <motion.div whileHover={linkHover}>
              <MuiLink
                component={Link}
                to="/privacy"
                sx={{
                  color: "white",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "0.875rem",
                }}
              >
                <PrivacyTip sx={{ mr: 0.5, fontSize: 16 }} />
                Chính sách bảo mật
              </MuiLink>
            </motion.div>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
