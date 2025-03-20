// src/pages/FarmPage.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { motion } from "framer-motion";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../assets/styles/Carousel.css";
import Layout from "../components/common/Layout";
import Footer from "../components/common/Footer";
import { useWeb3 } from "../contexts/Web3Context";
import { Link } from "react-router-dom"; // Thêm import Link

// Hình ảnh cho các slide
const images = {
  farmMonitoring:
    "https://images.unsplash.com/photo-1500595046743-dd26eb716e7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80", // Hình ảnh vùng trồng
  farmUpdate:
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80", // Hình ảnh cập nhật dữ liệu
  recommendations:
    "https://www.healthyeating.org/images/default-source/home-0.0/nutrition-topics-2.0/general-nutrition-wellness/2-2-2-3foodgroups_fruits_detailfeature.jpg?sfvrsn=64942d53_4", // Hình ảnh trái cây
};

const FarmPage = () => {
  const { account } = useWeb3();
  const [farmData, setFarmData] = useState({
    weather: "Nắng nhẹ, 28°C",
    yield: "500 kg",
    quality: "Tốt",
  });
  const [updateData, setUpdateData] = useState({
    yield: "",
    condition: "",
  });
  const [error, setError] = useState("");

  // Lấy thông tin người dùng từ localStorage
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const isFarmer = user.role === "nguoi-dan";
  const isManager = user.role === "nha-quan-ly";

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
    centerMode: true,
    centerPadding: "0px",
  };

  // Dữ liệu khuyến nghị giả lập
  const recommendations = {
    farmer: {
      popularFruit: "Xoài",
      tip: "Tăng tưới nước vào buổi sáng để cải thiện chất lượng trái! 🌞",
    },
    manager: {
      supportRegion: "Vùng 3",
      forecast: "Dự báo sản lượng tăng 20% trong tháng tới! 📈",
    },
  };

  // Xử lý cập nhật thông tin vùng trồng
  const handleUpdateFarmData = (e) => {
    e.preventDefault();
    if (!updateData.yield || !updateData.condition) {
      setError("Vui lòng điền đầy đủ thông tin! 😅");
      return;
    }

    // Giả lập lưu dữ liệu lên Blockchain (dùng localStorage)
    const newFarmData = {
      weather: farmData.weather,
      yield: updateData.yield,
      quality: updateData.condition,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("farmData", JSON.stringify(newFarmData));
    setFarmData(newFarmData);
    setUpdateData({ yield: "", condition: "" });
    setError("");
    alert("Cập nhật thông tin vùng trồng thành công! 🎉");
  };

  // Lấy dữ liệu vùng trồng từ localStorage khi load trang
  useEffect(() => {
    const storedFarmData = JSON.parse(localStorage.getItem("farmData"));
    if (storedFarmData) {
      setFarmData(storedFarmData);
    }
  }, []);

  // Các slide cho carousel
  const slides = [
    {
      title: "Theo dõi vùng trồng của bạn ngay nào! 🌱",
      description: (
        <>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Thời tiết: {farmData.weather}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Sản lượng: {farmData.yield}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Chất lượng: {farmData.quality}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Dữ liệu được lưu trên Blockchain, đảm bảo minh bạch 100%! 🔒
          </Typography>
        </>
      ),
      cta: "Xem chi tiết! 📊",
      link: "/vung-trong/chi-tiet",
      image: images.farmMonitoring,
    },
    ...(isFarmer
      ? [
          {
            title: "Cập nhật thông tin vùng trồng ngay nào! 🚜",
            description: (
              <Box component="form" sx={{ maxWidth: "400px", mx: "auto" }}>
                {error && (
                  <Typography
                    variant="body2"
                    sx={{ color: "red", textAlign: "center", mb: 2 }}
                  >
                    {error}
                  </Typography>
                )}
                <TextField
                  fullWidth
                  label="Sản lượng (kg)"
                  variant="outlined"
                  sx={{ mb: 2 }}
                  value={updateData.yield}
                  onChange={(e) =>
                    setUpdateData({ ...updateData, yield: e.target.value })
                  }
                />
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Tình trạng cây trồng 🌿</InputLabel>
                  <Select
                    value={updateData.condition}
                    onChange={(e) =>
                      setUpdateData({
                        ...updateData,
                        condition: e.target.value,
                      })
                    }
                    label="Tình trạng cây trồng 🌿"
                  >
                    <MenuItem value="Tốt">Tốt</MenuItem>
                    <MenuItem value="Trung bình">Trung bình</MenuItem>
                    <MenuItem value="Kém">Kém</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            ),
            cta: "Cập nhật ngay! 🚀",
            onClick: handleUpdateFarmData,
            image: images.farmUpdate,
          },
        ]
      : []),
    {
      title: isFarmer
        ? "Khuyến nghị cho bạn đây! 🌟"
        : "Khuyến nghị cho nhà quản lý! 📈",
      description: (
        <>
          {isFarmer ? (
            <>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Loại trái cây đang hot: {recommendations.farmer.popularFruit} 🔥
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Mẹo trồng trọt: {recommendations.farmer.tip}
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Vùng cần hỗ trợ: {recommendations.manager.supportRegion} 🆘
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {recommendations.manager.forecast}
              </Typography>
            </>
          )}
          <Typography variant="body1" sx={{ mb: 1 }}>
            Dữ liệu phân tích từ Blockchain, chính xác 100%! 🔍
          </Typography>
        </>
      ),
      cta: "Xem thêm gợi ý! 🚀",
      link: "/khuyen-nghi",
      image: images.recommendations,
    },
  ];

  return (
    <Layout>
      <Box
        sx={{
          minHeight: "calc(100vh - 140px)",
          bgcolor: "#E6F4EA",
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
                        component={slide.link ? Link : "button"}
                        to={slide.link}
                        onClick={slide.onClick}
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
                        alt={`${slide.title} Image`}
                        sx={{
                          width: "100%",
                          borderRadius: 2,
                          boxShadow: 3,
                          maxHeight: "400px",
                          objectFit: "cover",
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
      <Footer />
    </Layout>
  );
};

export default FarmPage;
