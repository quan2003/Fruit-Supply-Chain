import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../../contexts/Web3Context";
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const RegisterFarmForm = () => {
  const navigate = useNavigate();
  const { account } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [snackOpen, setSnackOpen] = useState(false);
  const [provinces, setProvinces] = useState([]);

  const [farm, setFarm] = useState({
    farmName: "",
    location: "",
    climate: "",
    soil: "",
    currentConditions: "",
  });

  const climates = [
    "Nhiệt đới gió mùa",
    "Ôn đới",
    "Khí hậu núi cao",
    "Khí hậu cận nhiệt đới",
  ];

  const soils = [
    "Đất đỏ bazan",
    "Đất phù sa",
    "Đất feralit",
    "Đất cát",
    "Đất mặn",
    "Đất phèn",
  ];

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await fetch("https://provinces.open-api.vn/api/p/");
        const data = await response.json();
        setProvinces(data);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách tỉnh/thành phố:", err);
        setError(
          "Không thể lấy danh sách tỉnh/thành phố. Vui lòng thử lại sau."
        );
      }
    };

    fetchProvinces();
  }, []);

  const fetchWeatherData = async (location) => {
    try {
      const apiKey = "d9ec71718fb4f20fe64c75961433a71b";
      const cityName = location.replace("Thành phố ", "").replace("Tỉnh ", "");
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&units=metric`
      );
      if (!response.ok) {
        throw new Error(
          "Không thể lấy thông tin thời tiết. Vui lòng kiểm tra vị trí."
        );
      }
      const data = await response.json();
      const temperature = data.main.temp;
      const weatherDescription = data.weather[0].description.toLowerCase();
      let condition;
      if (weatherDescription.includes("clear")) condition = "Nắng";
      else if (weatherDescription.includes("rain")) condition = "Mưa";
      else if (weatherDescription.includes("cloud")) condition = "Ẩm ướt";
      else if (
        weatherDescription.includes("mist") ||
        weatherDescription.includes("fog")
      )
        condition = "Sương mù";
      else if (weatherDescription.includes("wind")) condition = "Gió mạnh";
      else if (weatherDescription.includes("dry")) condition = "Khô hạn";
      else condition = "Ẩm ướt";
      return `${temperature}°C, ${condition}`;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const suggestSoilType = (location) => {
    if (location.includes("Đà Lạt") || location.includes("Lâm Đồng"))
      return "Đất đỏ bazan";
    if (
      location.includes("Hà Nội") ||
      location.includes("Bắc Ninh") ||
      location.includes("Hải Dương")
    )
      return "Đất phù sa";
    if (
      location.includes("Hồ Chí Minh") ||
      location.includes("Cần Thơ") ||
      location.includes("Tiền Giang")
    )
      return "Đất phù sa";
    if (location.includes("Nha Trang") || location.includes("Phan Thiết"))
      return "Đất cát";
    if (location.includes("Quảng Nam") || location.includes("Quảng Ngãi"))
      return "Đất feralit";
    return "Đất feralit";
  };

  const handleLocationChange = async (e) => {
    const { name, value } = e.target;
    setFarm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "location" && value) {
      setLoading(true);
      const condition = await fetchWeatherData(value);
      const suggestedSoil = suggestSoilType(value);
      setLoading(false);
      if (condition) {
        setFarm((prev) => ({
          ...prev,
          currentConditions: condition,
          soil: suggestedSoil,
        }));
        setError(null);
      }
    }
  };

  const generateFarmId = (farmName) => {
    if (!farmName) return "";
    const nameWithoutDiacritics = farmName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
    const namePrefix = nameWithoutDiacritics
      .toUpperCase()
      .replace(/\s/g, "")
      .slice(0, 8);
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${namePrefix}${randomNum}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFarm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!account) {
      setError("Vui lòng kết nối ví MetaMask!");
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user")) || {};
      if (!user.email) {
        setError("Vui lòng đăng nhập để tạo farm!");
        setLoading(false);
        return;
      }

      const farmId = generateFarmId(farm.farmName);

      const response = await fetch("http://localhost:3000/farm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ethereum-address": account,
        },
        body: JSON.stringify({
          farmId,
          location: farm.location,
          climate: farm.climate,
          soil: farm.soil,
          currentConditions: farm.currentConditions,
          email: user.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Không thể tạo farm");
      }

      setLoading(false);
      setSuccess("Tạo farm thành công!");
      setRedirectCountdown(3);
    } catch (err) {
      console.error("Lỗi khi tạo farm:", err);
      setError(err.message || "Không thể tạo farm. Vui lòng thử lại sau.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (success) {
      setSnackOpen(true);

      const countdownInterval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            navigate("/farms");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(countdownInterval);
      };
    }
  }, [success, navigate]);

  const handleCloseSnack = () => {
    setSnackOpen(false);
  };

  return (
    <Box sx={{ p: 3, maxWidth: "600px", margin: "0 auto" }}>
      <Paper
        elevation={0}
        sx={{ p: 4, borderRadius: 2, border: "1px solid #ddd" }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: "bold", color: "#000", mb: 3 }}
        >
          Tạo Farm Mới
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 3,
              display: "flex",
              alignItems: "center",
              backgroundColor: "#e8f5e9",
              border: "1px solid #81c784",
            }}
            icon={<CheckCircleIcon fontSize="inherit" />}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Typography variant="body1">
                {success} Bạn sẽ được chuyển hướng sau {redirectCountdown}{" "}
                giây...
              </Typography>
              {loading ? (
                <CircularProgress size={20} thickness={5} sx={{ ml: 2 }} />
              ) : (
                <Button
                  size="small"
                  onClick={() => navigate("/farms")}
                  sx={{ ml: 2 }}
                >
                  Đi ngay
                </Button>
              )}
            </Box>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tên Farm"
                name="farmName"
                value={farm.farmName}
                onChange={handleChange}
                required
                variant="standard"
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth variant="standard" sx={{ mb: 2 }}>
                <InputLabel shrink>Vị trí</InputLabel>
                <Select
                  name="location"
                  value={farm.location}
                  onChange={handleLocationChange}
                  required
                >
                  <MenuItem value="">Chọn tỉnh/thành phố</MenuItem>
                  {provinces.map((province) => (
                    <MenuItem key={province.code} value={province.name}>
                      {province.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth variant="standard" sx={{ mb: 2 }}>
                <InputLabel shrink>Khí hậu</InputLabel>
                <Select
                  name="climate"
                  value={farm.climate}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="">Chọn khí hậu</MenuItem>
                  {climates.map((climate) => (
                    <MenuItem key={climate} value={climate}>
                      {climate}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth variant="standard" sx={{ mb: 2 }}>
                <InputLabel shrink>Loại đất</InputLabel>
                <Select
                  name="soil"
                  value={farm.soil}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="">Chọn loại đất</MenuItem>
                  {soils.map((soil) => (
                    <MenuItem key={soil} value={soil}>
                      {soil}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Điều kiện hiện tại"
                name="currentConditions"
                value={farm.currentConditions}
                onChange={handleChange}
                required
                variant="standard"
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || success}
                  sx={{
                    textTransform: "none",
                    fontWeight: "bold",
                    bgcolor: "#1976D2",
                    "&:hover": { bgcolor: "#115293" },
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : "Tạo Farm"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar
        open={snackOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnack}
        message={success}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      />
    </Box>
  );
};

export default RegisterFarmForm;
