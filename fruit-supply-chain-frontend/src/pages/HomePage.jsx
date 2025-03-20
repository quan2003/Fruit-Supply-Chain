// src/pages/HomePage.jsx
import React from "react";
import { Container, Typography, Box, Grid, Button } from "@mui/material";
import { motion } from "framer-motion";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../assets/styles/Carousel.css";
import Layout from "../components/common/Layout";
import Footer from "../components/common/Footer";
import { Link, useNavigate } from "react-router-dom";

// Hình ảnh cho các slide
const images = {
  farmer:
    "https://icdn.dantri.com.vn/k:2016/1-qua1-1465463524850/man-nhan-voi-hinh-anh-trai-cay-chin-mong-trong-mua-thu-hoach.jpg", // Hình ảnh vùng trồng
  supplyChain:
    "https://antinlogistics.com/wp-content/uploads/2023/07/logistics-va-quan-ly-chuoi-cung-ung-1.png", // Hình ảnh chuỗi cung ứng
  consumer:
    "https://www.healthyeating.org/images/default-source/home-0.0/nutrition-topics-2.0/general-nutrition-wellness/2-2-2-3foodgroups_fruits_detailfeature.jpg?sfvrsn=64942d53_4", // Hình ảnh trái cây tươi ngon
};

const HomePage = () => {
  const navigate = useNavigate();

  // Cài đặt cho carousel
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
  };

  // Kiểm tra trạng thái đăng nhập
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const isLoggedIn = !!user.role; // Kiểm tra xem người dùng đã đăng nhập hay chưa

  // Hàm xử lý khi nhấn nút "Theo dõi ngay!"
  const handleFarmerRedirect = () => {
    if (isLoggedIn) {
      navigate("/farms"); // Nếu đã đăng nhập, chuyển hướng đến trang Farms
    } else {
      navigate("/dang-nhap?role=nguoi-dan"); // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
    }
  };

  // Dữ liệu cho các slide
  const slides = [
    {
      target: "Người dân",
      title: "Nông dân ơi, sản xuất đỉnh cao nha! 🌱",
      description:
        "Theo dõi vùng trồng, nhận gợi ý siêu xịn để trái cây ngon hơn, năng suất cao hơn! Đảm bảo sạch 100%, ai cũng mê! 🥦",
      cta: "Theo dõi ngay! 🚜",
      image: images.farmer,
      link: "/farms", // Link này sẽ được xử lý bởi handleFarmerRedirect
      action: handleFarmerRedirect, // Thêm action để xử lý điều hướng
    },
    {
      target: "Nhà quản lý",
      title: "Quản lý chuỗi cung ứng dễ ẹc! 📊",
      description:
        "Dữ liệu minh bạch, quản lý từ A-Z, đưa ra quyết định chuẩn không cần chỉnh! Tất cả trong tầm tay bạn! 📈",
      cta: "Quản lý ngay! 🔧",
      image: images.supplyChain,
      link: "/quan-ly",
    },
    {
      target: "Người tiêu dùng",
      title: "Nông sản xịn, chất lượng đỉnh cao! 🍎",
      description:
        "Trái cây tươi ngon, nguồn gốc rõ ràng, từ vườn đến tay bạn! Đảm bảo sạch 100%, không ngon hoàn tiền liền tay! 🥭🍋",
      cta: "Khám phá ngay! 🚀",
      image: images.consumer,
      link: "/truy-xuat",
    },
  ];

  return (
    <Layout>
      {/* Main Section với Carousel */}
      <Box
        sx={{
          minHeight: "calc(100vh - 140px)",
          bgcolor: "#E6F4EA", // Màu nền xanh nhạt
          display: "flex",
          alignItems: "center",
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <Slider {...settings}>
            {slides.map((slide, index) => (
              <Box key={index}>
                <Grid container spacing={3} alignItems="center">
                  {/* Left Section: Text and CTA */}
                  <Grid item xs={12} md={6}>
                    <motion.div
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.8 }}
                    >
                      <Typography
                        variant="h3"
                        sx={{
                          fontWeight: "bold",
                          color: "black",
                          mb: 2,
                          lineHeight: 1.2,
                        }}
                      >
                        {slide.title}
                      </Typography>
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ mb: 3, lineHeight: 1.6 }}
                      >
                        {slide.description}
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={slide.action || (() => navigate(slide.link))} // Sử dụng action nếu có, nếu không thì dùng Link mặc định
                        sx={{
                          bgcolor: "#42A5F5",
                          color: "white",
                          borderRadius: "50px",
                          px: 4,
                          py: 1.5,
                          fontWeight: "bold",
                          "&:hover": { bgcolor: "#1E88E5" },
                        }}
                      >
                        {slide.cta}
                      </Button>
                    </motion.div>
                  </Grid>

                  {/* Right Section: Image */}
                  <Grid item xs={12} md={6}>
                    <motion.div
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.8 }}
                    >
                      <Box
                        component="img"
                        src={slide.image}
                        alt={`${slide.target} Image`}
                        sx={{
                          width: "100%",
                          borderRadius: 2,
                          boxShadow: 3,
                        }}
                      />
                    </motion.div>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Slider>
        </Container>
      </Box>

      {/* Footer */}
      <Footer />
    </Layout>
  );
};

export default HomePage;
