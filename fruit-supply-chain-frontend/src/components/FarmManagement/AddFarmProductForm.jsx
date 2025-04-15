import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../../contexts/Web3Context";
import { addFruitProduct } from "../../services/fruitService";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import "../FruitCatalog/CatalogStyles.css";

const fruitHashMapping = {
  Thom: "QmeTDW7o2ZHAKJJW8A5Jfbe1mv7RZo8sdcDTxq1mP6X5MN",
  "Vu Sua": "QmXtKxu41xyvx4x9XXz6WRTRFCnKwriWfrHCtiYTHDJF1u",
  "Dua Hau": "QmNYb72BzVRhxTcXAefSg4QESHK2fEn2T3hFUE8Gvz6gM5",
  "Mang Cut": "QmdHct5JMUtw3VpDMJg4LYLvFqkVUsoZAVmy8wqgjs8T8d",
  "Trai Thanh Long": "QmdTqSueXLd6J6EMbXvemP3VVPpUo3dkkWwbiNmKV4Cegy",
  "Trai Xoai": "QmcwFdYQXKVsPd7qhCeXowwVDbHrnmMM6hCtsfJ7US4nXT",
};

const AddFarmProductForm = () => {
  const navigate = useNavigate();
  const {
    account,
    contract,
    connectWallet,
    updateWalletAddress,
    loading: web3Loading,
    walletError,
    userError,
    contractError,
    setWalletError,
  } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [farms, setFarms] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const validFruits = [
    "Thom",
    "Vu Sua",
    "Dua Hau",
    "Mang Cut",
    "Trai Thanh Long",
    "Trai Xoai",
  ];

  const [product, setProduct] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    quantity: "",
    productiondate: "",
    expirydate: "",
    farm_id: "",
  });

  useEffect(() => {
    if (!user.email) {
      navigate("/dang-nhap");
      return;
    }
    if (!account) return;

    const fetchFarms = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/farms/user?email=${user.email}`,
          {
            headers: {
              "Content-Type": "application/json",
              "x-ethereum-address": account,
            },
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Không thể lấy danh sách farm");
        }
        const data = await response.json();
        if (data.length > 0) {
          setFarms(data);
          setProduct((prev) => ({ ...prev, farm_id: data[0].id }));
        } else {
          setError("Không tìm thấy farm của bạn! Vui lòng tạo farm trước.");
          setTimeout(() => navigate("/farms/register"), 3000);
        }
      } catch (err) {
        setError("Không thể lấy danh sách farm: " + err.message);
      }
    };

    fetchFarms();
  }, [user.email, account, navigate]);

  useEffect(() => {
    if (success && !redirecting) {
      setRedirecting(true);
      const timer = setTimeout(() => navigate("/farms/products"), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, redirecting, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
    if (name === "category") {
      setPrediction(null);
      setPredictionError(null);
      setImageFile(null);
      setImagePreview(null);
      setSnackbarOpen(false);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const predictImage = async (file, category) => {
    setPredictionLoading(true);
    setPredictionError(null);
    setPrediction(null);
    setSnackbarOpen(false);

    try {
      const reader = new FileReader();
      const base64Image = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(file);
      });

      let roboflowEndpoint;
      if (category === "Dua Hau") {
        roboflowEndpoint = "https://serverless.roboflow.com/watermelon-xztju/5";
      } else if (category === "Mang Cut") {
        roboflowEndpoint = "https://detect.roboflow.com/mangosteen-2grlu/4";
      } else if (category === "Trai Thanh Long") {
        roboflowEndpoint =
          "https://detect.roboflow.com/thanh-long-detection-znzlc/3";
      } else if (category === "Trai Xoai") {
        roboflowEndpoint = "https://detect.roboflow.com/dataset-s2doa/20";
      } else if (category === "Vu Sua") {
        roboflowEndpoint = "https://detect.roboflow.com/anh-vusua/1";
      } else {
        throw new Error("Loại trái cây không được hỗ trợ nhận diện!");
      }

      const roboflowResponse = await axios({
        method: "POST",
        url: roboflowEndpoint,
        params: {
          api_key: "E8YOwnmbHAOZ5OCaS8GZ",
        },
        data: base64Image,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const roboflowResult = roboflowResponse.data;
      if (
        !roboflowResult.predictions ||
        roboflowResult.predictions.length === 0 ||
        !roboflowResult.predictions[0]?.class
      ) {
        throw new Error("Hình ảnh không phù hợp với loại trái cây được chọn!");
      }

      let predictionResult = roboflowResult.predictions[0].class;

      if (category === "Trai Thanh Long" && predictionResult === "raw") {
        predictionResult = "unripe";
      }
      if (category === "Trai Xoai") {
        if (predictionResult === "mango") {
          predictionResult = "ripe";
        } else {
          throw new Error(
            "Hình ảnh không phù hợp với loại trái cây được chọn!"
          );
        }
      }
      if (category === "Vu Sua") {
        if (predictionResult === "0") {
          predictionResult = "ripe";
        } else if (predictionResult === "1") {
          predictionResult = "unripe";
        } else {
          throw new Error(
            "Hình ảnh không phù hợp với loại trái cây được chọn!"
          );
        }
      }

      if (
        (category === "Dua Hau" &&
          !["ripe", "unripe"].includes(predictionResult)) ||
        (category === "Mang Cut" &&
          !["ripe", "unripe"].includes(predictionResult)) ||
        (category === "Trai Thanh Long" &&
          !["ripe", "unripe"].includes(predictionResult)) ||
        (category === "Trai Xoai" && predictionResult !== "ripe") ||
        (category === "Vu Sua" &&
          !["ripe", "unripe"].includes(predictionResult))
      ) {
        throw new Error("Hình ảnh không phù hợp với loại trái cây được chọn!");
      }

      const apiKey = "AIzaSyDiyzVcJ5v9BOpy-_c-60ahkzI-BM0tEvc";
      const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: `Tôi có một ${category} với trạng thái chín là ${predictionResult}. Hãy đưa ra khuyến nghị bảo quản chi tiết theo định dạng sau:
                - Khuyến nghị: [chi tiết cách bảo quản, bao gồm nhiệt độ và thời gian]
                - Mẹo: [một mẹo cụ thể]
                Ví dụ:
                Khuyến nghị: Bảo quản ở 5-10°C trong 2-3 tuần.
                Mẹo: Bọc kín để tránh mùi.
                Trả về văn bản không chứa dấu * để tránh định dạng lộn xộn.`,
              },
            ],
          },
        ],
      };

      const geminiResponse = await axios({
        method: "POST",
        url: apiEndpoint,
        data: requestBody,
        headers: { "Content-Type": "application/json" },
      });

      const geminiResult = geminiResponse.data;
      let generatedText = geminiResult.candidates[0].content.parts[0].text;

      generatedText = generatedText.replace(/\*/g, "");

      const recommendationMatch = generatedText.match(
        /Khuyến nghị:\s*([^\n]+)/
      );
      const tipMatch = generatedText.match(/Mẹo:\s*([^\n]+)/);

      const formattedMessage = `
        <div style="line-height: 1.5;">
          <strong style="color: #1976D2;">Trạng thái:</strong> ${
            predictionResult === "ripe" ? "Đã chín" : "Chưa chín"
          }<br />
          <strong style="color: #1976D2;">Khuyến nghị:</strong> ${
            recommendationMatch
              ? recommendationMatch[1].trim()
              : "Không có thông tin."
          }<br />
          <strong style="color: #1976D2;">Mẹo:</strong> ${
            tipMatch ? tipMatch[1].trim() : "Không có mẹo."
          }
        </div>
      `;

      setSnackbarMessage(formattedMessage);
      setSnackbarSeverity(predictionResult === "ripe" ? "success" : "warning");
      setSnackbarOpen(true);

      setPrediction(predictionResult);
      return predictionResult;
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
      setPredictionError(
        "Không thể nhận diện hoặc tạo khuyến nghị: " + error.message
      );
      return null;
    } finally {
      setPredictionLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Hình ảnh quá lớn! Vui lòng chọn hình ảnh dưới 5MB.");
        return;
      }
      if (!product.category) {
        setError("Vui lòng chọn loại trái cây trước khi upload hình ảnh!");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      if (
        [
          "Dua Hau",
          "Mang Cut",
          "Trai Thanh Long",
          "Trai Xoai",
          "Vu Sua",
        ].includes(product.category)
      ) {
        await predictImage(file, product.category);
      }
    }
  };

  const handleConnectWallet = async () => {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length > 0) {
        setError(null);
        return;
      }
      await connectWallet();
      setError(null);
    } catch (err) {
      setError("Không thể kết nối ví MetaMask: " + err.message);
    }
  };

  const handleUpdateWallet = async () => {
    try {
      await updateWalletAddress(user.email);
      setWalletError(null);
      setError(null);
      const fetchFarms = async () => {
        try {
          const response = await fetch(
            `http://localhost:3000/farms/user?email=${user.email}`,
            {
              headers: {
                "Content-Type": "application/json",
                "x-ethereum-address": account || "",
              },
            }
          );
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Không thể lấy danh sách farm");
          }
          const data = await response.json();
          if (data.length > 0) {
            setFarms(data);
            setProduct((prev) => ({ ...prev, farm_id: data[0].id }));
          } else {
            setError("Không tìm thấy farm của bạn! Vui lòng tạo farm trước.");
            setTimeout(() => navigate("/farms/register"), 3000);
          }
        } catch (err) {
          setError("Không thể lấy danh sách farm: " + err.message);
        }
      };
      await fetchFarms();
    } catch (err) {
      setError("Không thể cập nhật ví: " + err.message);
    }
  };

  const generateProductCode = (name) => {
    const nameWithoutDiacritics = name
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

  const uploadToIPFS = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("http://localhost:3000/ipfs/add", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Lỗi khi upload lên IPFS");
      }
      const data = await response.json();
      return data.hash;
    } catch (error) {
      throw new Error("Không thể upload ảnh lên IPFS: " + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!account || !contract) {
      setError("Vui lòng kết nối ví MetaMask và khởi tạo hợp đồng!");
      setLoading(false);
      return;
    }

    if (
      [
        "Dua Hau",
        "Mang Cut",
        "Trai Thanh Long",
        "Trai Xoai",
        "Vu Sua",
      ].includes(product.category) &&
      imageFile
    ) {
      if (!prediction) {
        setError("Vui lòng chờ nhận diện hình ảnh trước khi thêm sản phẩm!");
        setLoading(false);
        return;
      }
      if (prediction !== "ripe") {
        setError("Sản phẩm chưa chín! Vui lòng chọn sản phẩm đã chín để thêm.");
        setLoading(false);
        return;
      }
    }

    try {
      const productCode = generateProductCode(product.name);
      const fruitType = product.category;
      let ipfsHash = imageFile
        ? await uploadToIPFS(imageFile)
        : fruitHashMapping[fruitType];
      if (!ipfsHash) {
        throw new Error("Loại trái cây không được hỗ trợ!");
      }

      let gasLimit;
      try {
        const gasEstimate = await contract.methods
          .setFruitHash(fruitType, ipfsHash)
          .estimateGas({ from: account });
        gasLimit = Math.floor(Number(gasEstimate) * 3);
      } catch (err) {
        gasLimit = 1000000;
      }

      await contract.methods.setFruitHash(fruitType, ipfsHash).send({
        from: account,
        gas: gasLimit,
      });

      const productData = {
        name: product.name,
        productcode: productCode,
        category: product.category,
        description: product.description,
        price: product.price,
        quantity: product.quantity,
        productdate: product.productiondate,
        expirydate: product.expirydate,
        farm_id: product.farm_id,
        email: user.email,
        frontendHash: ipfsHash,
      };

      await addFruitProduct(productData, { "x-ethereum-address": account });
      setLoading(false);
      setSuccess("Thêm sản phẩm thành công!");
    } catch (err) {
      console.error("Lỗi khi thêm sản phẩm:", err);
      let errorMessage = "Không thể thêm sản phẩm. Vui lòng thử lại sau.";
      if (err.code === -32603) {
        errorMessage = "Lỗi giao dịch blockchain: Kiểm tra Hardhat node.";
      } else if (err.message.includes("out of gas")) {
        errorMessage = "Giao dịch hết gas.";
      } else if (err.message.includes("revert")) {
        errorMessage = "Hợp đồng từ chối giao dịch.";
      } else if (err.message.includes("Failed to fetch")) {
        errorMessage = "Không thể kết nối đến backend.";
      }
      setError(errorMessage);
      setLoading(false);
    }
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
          Thêm sản phẩm
        </Typography>

        {web3Loading && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Đang khởi tạo Web3, vui lòng chờ...
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        {walletError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {walletError}
          </Alert>
        )}
        {walletError &&
          walletError.includes("Địa chỉ ví MetaMask không được liên kết") && (
            <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleUpdateWallet}
                sx={{
                  textTransform: "none",
                  fontWeight: "bold",
                  bgcolor: "#f50057",
                  "&:hover": { bgcolor: "#c51162" },
                }}
              >
                Cập nhật ví MetaMask
              </Button>
            </Box>
          )}
        {userError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {userError}
          </Alert>
        )}
        {contractError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {contractError}
          </Alert>
        )}
        {!account && !web3Loading && (
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleConnectWallet}
              sx={{
                textTransform: "none",
                fontWeight: "bold",
                bgcolor: "#1976D2",
                "&:hover": { bgcolor: "#115293" },
              }}
            >
              Kết nối ví MetaMask
            </Button>
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nhập tên sản phẩm"
                name="name"
                value={product.name}
                onChange={handleChange}
                required
                variant="standard"
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth variant="standard" sx={{ mb: 2 }}>
                <InputLabel shrink>Loại trái cây</InputLabel>
                <Select
                  name="category"
                  value={product.category}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="" disabled>
                    Chọn loại trái cây
                  </MenuItem>
                  {validFruits.map((fruit) => (
                    <MenuItem key={fruit} value={fruit}>
                      {fruit}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nhập giá sản phẩm (AGT token)"
                name="price"
                type="number"
                value={product.price}
                onChange={handleChange}
                required
                variant="standard"
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nhập số lượng (hộp)"
                name="quantity"
                type="number"
                value={product.quantity}
                onChange={handleChange}
                required
                variant="standard"
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nhập thông tin mô tả sản phẩm tại đây..."
                name="description"
                value={product.description}
                onChange={handleChange}
                required
                variant="standard"
                InputLabelProps={{ shrink: true }}
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hình ảnh"
                name="imageUpload"
                type="file"
                onChange={handleImageChange}
                InputLabelProps={{ shrink: true }}
                variant="standard"
                sx={{ mb: 2 }}
              />
              {imagePreview && (
                <Box sx={{ mt: 2 }}>
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    style={{ maxWidth: "200px", borderRadius: "5px" }}
                  />
                </Box>
              )}
              {predictionLoading && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Đang nhận diện hình ảnh, vui lòng chờ...
                </Alert>
              )}
              {predictionError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {predictionError}
                </Alert>
              )}
              {prediction && !predictionLoading && (
                <Alert
                  severity={prediction === "ripe" ? "success" : "warning"}
                  sx={{ mt: 2 }}
                >
                  {prediction === "ripe"
                    ? "Sản phẩm đã chín, sẵn sàng để bán!"
                    : "Sản phẩm chưa chín, bạn nên chờ thêm trước khi bán."}
                </Alert>
              )}
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ngày sản xuất"
                name="productiondate"
                type="date"
                value={product.productiondate}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
                variant="standard"
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ngày hết hạn"
                name="expirydate"
                type="date"
                value={product.expirydate}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
                variant="standard"
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth variant="standard" sx={{ mb: 2 }}>
                <InputLabel shrink>Farm</InputLabel>
                <Select
                  name="farm_id"
                  value={product.farm_id}
                  onChange={handleChange}
                  required
                >
                  {farms.map((farm) => (
                    <MenuItem key={farm.id} value={farm.id}>
                      {farm.farm_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={
                    loading ||
                    !account ||
                    !contract ||
                    web3Loading ||
                    predictionLoading
                  }
                  sx={{
                    textTransform: "none",
                    fontWeight: "bold",
                    bgcolor: "#1976D2",
                    "&:hover": { bgcolor: "#115293" },
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : "Thêm sản phẩm"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          <div dangerouslySetInnerHTML={{ __html: snackbarMessage }} />
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddFarmProductForm;
