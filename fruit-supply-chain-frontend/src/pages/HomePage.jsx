import React from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  IconButton,
} from "@mui/material";
import { motion } from "framer-motion";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../assets/styles/Carousel.css";
import Layout from "../components/common/Layout";
import Footer from "../components/common/Footer";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

// Custom arrow component for carousel
const CustomArrow = ({ direction, onClick }) => {
  return (
    <IconButton
      onClick={onClick}
      sx={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 2,
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.15)",
        width: 40,
        height: 40,
        "&:hover": {
          backgroundColor: "rgba(255, 255, 255, 0.9)",
        },
        ...(direction === "prev" ? { left: 16 } : { right: 16 }),
      }}
    >
      {direction === "prev" ? <ArrowBackIosNewIcon /> : <ArrowForwardIosIcon />}
    </IconButton>
  );
};

// Centralized image repository with consistent dimensions
const images = {
  farmer:
    "https://i.ex-cdn.com/nongnghiep.vn/files/news_old/2019/12/18/thu-hoach-5-1jpg-100609.jpg",
  supplyChain:
    "https://antinlogistics.com/wp-content/uploads/2023/07/logistics-va-quan-ly-chuoi-cung-ung-1.png",
  consumer:
    "https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80",
  transporter:
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80",
  distributionCenter:
    "https://images.unsplash.com/photo-1553413077-190dd305871c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  warehouse:
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80",
};

const HomePage = () => {
  // Carousel settings with fixed configuration
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    fade: true,
    cssEase: "linear",
    prevArrow: <CustomArrow direction="prev" />,
    nextArrow: <CustomArrow direction="next" />,
  };

  // Standardized carousel slides with consistent structure
  const slides = [
    {
      target: "Người tiêu dùng",
      role: "Customer",
      title: "Nông sản xịn, chất lượng đỉnh cao!",
      description:
        "Trái cây tươi ngon, nguồn gốc rõ ràng, từ vườn đến tay bạn! Đảm bảo sạch 100%, không ngon hoàn tiền liền tay!",
      cta: "KHÁM PHÁ NGAY! 🚀",
      image: images.consumer,
      link: "/truy-xuat",
      emoji: "🍎",
      layout: "left",
    },
    {
      target: "Người dân",
      role: "Producer",
      title: "Nông dân ơi, sản xuất đỉnh cao nha!",
      description:
        "Theo dõi vùng trồng, nhận gợi ý siêu xịn để trái cây ngon hơn, năng suất cao hơn! Đảm bảo sạch 100%, ai cũng mê!",
      cta: "THEO DÕI NGAY! 🚜",
      image: images.farmer,
      link: "/farms",
      emoji: "🌱",
      layout: "left",
    },
    {
      target: "Nhà quản lý",
      role: "Admin",
      title: "Quản lý chuỗi cung ứng dễ ẹc!",
      description:
        "Dữ liệu minh bạch, quản lý từ A-Z, đưa ra quyết định chuẩn không cần chỉnh! Tất cả trong tầm tay bạn!",
      cta: "QUẢN LÝ NGAY! 🔧",
      image: images.supplyChain,
      link: "/quan-ly",
      emoji: "📊",
      layout: "left",
    },
    {
      target: "Trung tâm phân phối",
      role: "Distributor",
      title: "Phân phối hiệu quả, không lo tồn kho!",
      description:
        "Quản lý hàng hóa thông minh, phân phối đúng nơi, đúng lúc, giảm thiểu lãng phí và tối ưu lợi nhuận!",
      cta: "BẮT ĐẦU NGAY! 🛠️",
      image: images.distributionCenter,
      link: "/phan-phoi",
      emoji: "🏬",
      layout: "left",
    },
    {
      target: "Nhà vận chuyển",
      role: "Transporter",
      title: "Vận chuyển nhanh, chuẩn, an toàn!",
      description:
        "Theo dõi lộ trình, tối ưu hóa thời gian giao hàng, đảm bảo nông sản luôn tươi ngon khi đến tay khách hàng!",
      cta: "THAM GIA NGAY! 📦",
      image: images.warehouse,
      link: "/van-chuyen",
      emoji: "🚚",
      layout: "left",
    },
  ];

  // Standardized feature cards with consistent structure
  const featureCards = [
    {
      title: "Lời khuyên trồng trọt thông minh",
      description:
        "Hệ thống tự động phân tích dữ liệu vùng trồng và đưa ra gợi ý tối ưu: từ cách tưới nước, bón phân đến thời điểm thu hoạch, giúp cây trồng đạt chất lượng cao nhất! 🌿",
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTeru4SbyCW8Hdb6fgxANlZySCnKEmzuaB2hA&s",
    },
    {
      title: "Kiểm tra chất lượng tự động",
      description:
        "Nông sản được hệ thống kiểm tra kỹ lưỡng qua hình ảnh và dữ liệu. Nếu chưa chín hoặc không đạt tiêu chuẩn, hệ thống sẽ từ chối đăng bán để đảm bảo chất lượng! 🍎",
      image:
        "https://soyte.hatinh.gov.vn/upload/1000030/20171026/12da6a063c0f8bbf872b1ce8dac3970f1_4-trai-cay4-1437268105198.jpg",
    },
    {
      title: "Hướng dẫn bảo quản chuyên nghiệp",
      description:
        "Hệ thống cung cấp hướng dẫn bảo quản chi tiết, từ nhiệt độ, độ ẩm đến cách đóng gói, giúp nông sản giữ được độ tươi ngon lâu nhất! 🥦",
      image: "https://cdn.tgdd.vn/2021/03/CookProduct/4-1200x676-2.jpg",
    },
  ];

  // Standardized testimonials with consistent structure
  const testimonials = [
    {
      quote:
        "Nhờ hệ thống, tôi biết chính xác thời điểm thu hoạch và cách bảo quản. Trái cây của tôi giờ được khách hàng khen hết lời!",
      author: "Chị Lan",
      role: "Nông dân",
    },
    {
      quote:
        "Tôi yên tâm mua nông sản vì biết rõ nguồn gốc và chất lượng. Hệ thống kiểm tra rất đáng tin cậy!",
      author: "Anh Hùng",
      role: "Người tiêu dùng",
    },
    {
      quote:
        "Hệ thống giúp tôi quản lý nông sản dễ dàng, từ kiểm tra chất lượng đến phân phối, mọi thứ đều minh bạch!",
      author: "Chị Mai",
      role: "Nhà quản lý",
    },
  ];

  // Common styling constants for consistency
  const styles = {
    section: {
      py: 6,
    },
    sectionTitle: {
      fontWeight: "bold",
      color: "#333",
      textAlign: "center",
      mb: 4,
      fontFamily: "'Roboto', sans-serif",
    },
    card: {
      textAlign: "center",
      bgcolor: "white",
      borderRadius: 4,
      p: 4,
      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
      transition: "transform 0.3s ease",
      "&:hover": {
        transform: "translateY(-5px)",
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
      },
    },
    cardTitle: {
      fontWeight: "bold",
      mb: 2,
      color: "#42A5F5",
      fontFamily: "'Roboto', sans-serif",
    },
    cardImage: {
      width: "100%",
      height: 180,
      objectFit: "cover",
      borderRadius: 3,
      mb: 3,
    },
    button: {
      bgcolor: "#42A5F5",
      color: "white",
      borderRadius: "50px",
      px: 5,
      py: 1.5,
      fontWeight: "bold",
      fontFamily: "'Roboto', sans-serif",
      fontSize: "1rem",
      "&:hover": {
        bgcolor: "#1E88E5",
        transform: "translateY(-3px)",
        boxShadow: "0 4px 12px rgba(66, 165, 245, 0.5)",
      },
      transition: "all 0.3s ease",
    },
    ctaButton: {
      backgroundColor: "#42A5F5",
      color: "white",
      borderRadius: "50px",
      px: 4,
      py: 1.2,
      fontWeight: "bold",
      fontSize: "1rem",
      letterSpacing: "0.5px",
      boxShadow: "0 4px 10px rgba(0, 105, 217, 0.3)",
      transition: "all 0.3s ease",
      "&:hover": {
        backgroundColor: "#1976D2",
        transform: "translateY(-3px)",
        boxShadow: "0 6px 15px rgba(0, 105, 217, 0.4)",
      },
    },
    // Carousel specific styles
    carouselSection: {
      background: "linear-gradient(135deg, #E6F4EA 0%, #CCEAE3 100%)",
      py: 0,
      my: 0,
      overflow: "hidden",
    },
    carouselSlide: {
      height: "550px",
      position: "relative",
    },
    slideContent: {
      maxWidth: "1200px",
      mx: "auto",
      height: "100%",
      position: "relative",
      px: { xs: 2, md: 3, lg: 4 },
    },
    slideTitle: {
      fontWeight: "900",
      fontSize: { xs: "2.5rem", md: "3.5rem" },
      lineHeight: 1.1,
      color: "#4993E5",
      fontFamily: "'Roboto', sans-serif",
      mb: 2,
    },
    slideDescription: {
      fontSize: "1.2rem",
      color: "#555",
      lineHeight: 1.6,
      fontFamily: "'Roboto', sans-serif",
      mb: 3,
      maxWidth: { xs: "100%", md: "80%" },
    },
    slideImage: {
      width: "100%",
      height: "auto",
      maxHeight: "350px",
      objectFit: "contain",
      borderRadius: "16px",
      display: "block",
    },
    // Layout-specific styles
    leftLayout: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: "100%",
      flexDirection: { xs: "column", md: "row" },
    },
    rightLayout: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: "100%",
      flexDirection: { xs: "column", md: "row-reverse" },
    },
    centerLayout: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      height: "100%",
      px: { xs: 2, md: 10 },
    },
    textContainer: {
      width: { xs: "100%", md: "50%" },
      pr: { xs: 0, md: 4 },
      mb: { xs: 3, md: 0 },
    },
    imageContainer: {
      width: { xs: "100%", md: "50%" },
      pl: { xs: 0, md: 4 },
      display: "flex",
      justifyContent: "center",
    },
    centerTextContainer: {
      width: "100%",
      maxWidth: "700px",
      mb: 4,
    },
    centerImageContainer: {
      width: "100%",
      maxWidth: "700px",
      display: "flex",
      justifyContent: "center",
    },
  };

  return (
    <Layout>
      <Box
        sx={{
          bgcolor: "#E6F4EA",
          minHeight: "100vh",
          width: "100%",
          m: 0,
          p: 0,
        }}
      >
        {/* Carousel Section */}
        <Box sx={styles.carouselSection}>
          <Slider {...settings}>
            {slides.map((slide, index) => (
              <Box key={index} sx={styles.carouselSlide}>
                <Box sx={styles.slideContent}>
                  {slide.layout === "left" && (
                    <Box sx={styles.leftLayout}>
                      <Box sx={styles.textContainer}>
                        <Typography variant="h3" sx={styles.slideTitle}>
                          {slide.title} {slide.emoji}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={styles.slideDescription}
                        >
                          {slide.description}
                        </Typography>
                        <Button
                          variant="contained"
                          sx={styles.ctaButton}
                          href={slide.link}
                        >
                          {slide.cta}
                        </Button>
                      </Box>
                      <Box sx={styles.imageContainer}>
                        <Box
                          component="img"
                          src={slide.image}
                          alt={`${slide.target} Image`}
                          sx={styles.slideImage}
                        />
                      </Box>
                    </Box>
                  )}

                  {slide.layout === "right" && (
                    <Box sx={styles.rightLayout}>
                      <Box sx={styles.textContainer}>
                        <Typography variant="h3" sx={styles.slideTitle}>
                          {slide.title} {slide.emoji}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={styles.slideDescription}
                        >
                          {slide.description}
                        </Typography>
                        <Button
                          variant="contained"
                          sx={styles.ctaButton}
                          href={slide.link}
                        >
                          {slide.cta}
                        </Button>
                      </Box>
                      <Box sx={styles.imageContainer}>
                        <Box
                          component="img"
                          src={slide.image}
                          alt={`${slide.target} Image`}
                          sx={styles.slideImage}
                        />
                      </Box>
                    </Box>
                  )}

                  {slide.layout === "center" && (
                    <Box sx={styles.centerLayout}>
                      <Box sx={styles.centerTextContainer}>
                        <Typography
                          variant="h3"
                          sx={{ ...styles.slideTitle, textAlign: "center" }}
                        >
                          {slide.title} {slide.emoji}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            ...styles.slideDescription,
                            textAlign: "center",
                            mx: "auto",
                          }}
                        >
                          {slide.description}
                        </Typography>
                        <Button
                          variant="contained"
                          sx={{
                            ...styles.ctaButton,
                            mx: "auto",
                            display: "block",
                            mb: 4,
                          }}
                          href={slide.link}
                        >
                          {slide.cta}
                        </Button>
                      </Box>
                      <Box sx={styles.centerImageContainer}>
                        <Box
                          component="img"
                          src={slide.image}
                          alt={`${slide.target} Image`}
                          sx={styles.slideImage}
                        />
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Slider>
        </Box>

        {/* Section: Hỗ trợ nông dân - Standardized feature cards */}
        <Box sx={{ bgcolor: "#E6F4EA", ...styles.section }}>
          <Container maxWidth="lg">
            <Typography variant="h3" sx={styles.sectionTitle}>
              Hệ thống thông minh hỗ trợ nông dân 🌱
            </Typography>
            <Grid container spacing={4}>
              {featureCards.map((card, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.2 }}
                  >
                    <Box sx={styles.card}>
                      <Box
                        component="img"
                        src={card.image}
                        alt={card.title}
                        sx={styles.cardImage}
                      />
                      <Typography variant="h5" sx={styles.cardTitle}>
                        {card.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontFamily: "'Roboto', sans-serif",
                          lineHeight: 1.6,
                          height: "120px", // Fixed height for all descriptions
                          overflow: "hidden", // Prevent overflow
                        }}
                      >
                        {card.description}
                      </Typography>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Section: Quy trình - Fixed layout */}
        <Box sx={{ bgcolor: "#F8FAFC", ...styles.section }}>
          <Container maxWidth="lg">
            <Typography variant="h3" sx={styles.sectionTitle}>
              Hành trình từ vườn đến tay bạn 🍋
            </Typography>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <Box
                    sx={{
                      bgcolor: "white",
                      borderRadius: 4,
                      p: 4,
                      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
                      height: "400px", // Fixed height
                      overflow: "auto", // Allow scrolling if needed
                    }}
                  >
                    <Typography variant="h5" sx={styles.cardTitle}>
                      1. Trồng trọt với công nghệ
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{
                        mb: 3,
                        fontFamily: "'Roboto', sans-serif",
                        lineHeight: 1.6,
                      }}
                    >
                      Nông dân nhận được gợi ý thông minh từ hệ thống: từ cách
                      chăm sóc cây, phát hiện sâu bệnh sớm, đến thời điểm thu
                      hoạch lý tưởng, đảm bảo nông sản đạt chất lượng cao nhất.
                    </Typography>
                    <Typography variant="h5" sx={styles.cardTitle}>
                      2. Kiểm tra và bảo quản
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{
                        mb: 3,
                        fontFamily: "'Roboto', sans-serif",
                        lineHeight: 1.6,
                      }}
                    >
                      Hệ thống tự động kiểm tra chất lượng nông sản. Nếu chưa
                      đạt, nông dân sẽ nhận hướng dẫn bảo quản để giữ sản phẩm
                      tươi ngon, sẵn sàng cho lần kiểm tra sau.
                    </Typography>
                    <Typography variant="h5" sx={styles.cardTitle}>
                      3. Đưa đến người tiêu dùng
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{
                        fontFamily: "'Roboto', sans-serif",
                        lineHeight: 1.6,
                      }}
                    >
                      Chỉ những sản phẩm đạt chuẩn mới được đăng bán, đảm bảo
                      người tiêu dùng nhận được nông sản tươi ngon, sạch 100%
                      với nguồn gốc rõ ràng.
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <Box
                    component="img"
                    src="https://images.unsplash.com/photo-1516594798947-e65505dbb29d"
                    alt="Quy trình"
                    sx={{
                      width: "100%",
                      height: "400px", // Fixed height to match text box
                      objectFit: "cover",
                      borderRadius: 4,
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                      transition: "transform 0.5s ease",
                      "&:hover": { transform: "scale(1.03)" },
                    }}
                  />
                </motion.div>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Section: Testimonials - Standardized layout */}
        <Box sx={{ bgcolor: "#E6F4EA", ...styles.section }}>
          <Container maxWidth="lg">
            <Typography variant="h3" sx={styles.sectionTitle}>
              Nông dân và khách hàng nói gì? 🌟
            </Typography>
            <Grid container spacing={4}>
              {testimonials.map((testimonial, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.2 }}
                  >
                    <Box
                      sx={{
                        ...styles.card,
                        height: "200px", // Fixed height for all testimonials
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: "'Roboto', sans-serif",
                          fontStyle: "italic",
                          lineHeight: 1.6,
                        }}
                      >
                        "{testimonial.quote}"
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontFamily: "'Roboto', sans-serif",
                          fontWeight: "bold",
                        }}
                      >
                        - {testimonial.author}, {testimonial.role}
                      </Typography>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Call to Action - Fixed height */}
        <Box
          sx={{
            py: 8,
            background: "linear-gradient(135deg, #42A5F5 0%, #1E88E5 100%)",
            color: "white",
            textAlign: "center",
            height: "300px", // Fixed height
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Container maxWidth="md">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontWeight: "bold",
                  mb: 3,
                  fontFamily: "'Roboto', sans-serif",
                }}
              >
                Cùng xây dựng nông nghiệp bền vững! 🌍
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mb: 4,
                  fontFamily: "'Roboto', sans-serif",
                  maxWidth: 600,
                  mx: "auto",
                  lineHeight: 1.6,
                }}
              >
                Tham gia ngay để trải nghiệm hệ thống thông minh, giúp nông dân
                trồng trọt hiệu quả và mang nông sản chất lượng đến mọi nhà!
              </Typography>
              <Button
                variant="contained"
                sx={{
                  bgcolor: "white",
                  color: "#42A5F5",
                  borderRadius: "50px",
                  px: 5,
                  py: 1.5,
                  fontWeight: "bold",
                  fontFamily: "'Roboto', sans-serif",
                  fontSize: "1rem",
                  "&:hover": {
                    bgcolor: "#f5f5f5",
                    transform: "translateY(-3px)",
                    boxShadow: "0 4px 12px rgba(255, 255, 255, 0.5)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                Tham gia ngay
              </Button>
            </motion.div>
          </Container>
        </Box>
      </Box>

      <Footer />
    </Layout>
  );
};

export default HomePage;
