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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useForm } from "react-hook-form";
import "../FruitCatalog/CatalogStyles.css";
import MetaMaskSDK from "@metamask/sdk";
import { ethers } from "ethers";

// Định nghĩa BACKEND_URL từ biến môi trường
const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:3000";

// Định nghĩa IPFS Gateway (Pinata)
const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

// Cấu hình nhận diện hình ảnh
const predictionConfig = {
  "Dua Hau": {
    endpoint: "https://serverless.roboflow.com/watermelon-xztju/5",
    validClasses: ["ripe", "unripe"],
  },
  "Mang Cut": {
    endpoint: "https://serverless.roboflow.com/mangosteen-fruit/1",
    validClasses: ["ripe", "unripe"],
    classMapping: { "Ripe": "ripe", "Un_Ripe": "unripe"},
  },
  "Trai Thanh Long": {
    endpoint: "https://serverless.roboflow.com/thanh-long-detection-znzlc/3?",
    validClasses: ["ripe", "unripe"],
    classMapping: { raw: "unripe" },
  },
  "Trai Xoai": {
    endpoint: "https://serverless.roboflow.com/mango-fruit-iwvzr/2",
    validClasses: ["ripe", "semiripe", "unripe"], // Cập nhật để khớp với nhãn sau ánh xạ
    classMapping: { "Ripe": "ripe", "Semi_Un_Ripe": "semiripe", "Un_Ripe": "unripe" },
  },
  "Vu Sua": {
    endpoint: "https://serverless.roboflow.com/anh-vusua/1?",
    validClasses: ["ripe", "unripe"],
    classMapping: { 0: "ripe", 1: "unripe" },
  },
};

// Cập nhật fruitHashMapping với CID mới từ Pinata
const fruitHashMapping = {
  Thom: "bafkreialmzlmexrfgud3tp6kg3yced537auuvzioxzbjak44nxuhqg37gy",
  "Vu Sua": "bafkreibqvvcnsclx4lk4mtbw3eczguyxp7xm3bky6t37bfifonlp2ihr3y",
  "Dua Hau": "bafkreiez45cp5h5yuiqncthniqpbw6i45vvk24wiwfo2bonsvc2klmju4a",
  "Mang Cut": "bafkreigvwkm5fh3izkrzodki3rdsnjcqdohbqhxf6v62wipvpajzejm22a",
  "Trai Thanh Long":
    "bafkreiaeqi66du64o4qk3wpptt4qwubr5niw3mulc7zh3di2ofwowkv2ki",
  "Trai Xoai": "bafkreibwq5ir7riyrmy5zz7p2l2xukn2agx7gfh42yyplmdbui6lavr4ki",
};

// Khởi tạo MetaMask SDK
const MMSDK = new MetaMaskSDK({
  dappMetadata: {
    name: "Fruit Supply Chain",
    url: window.location.origin,
  },
});

// Hook xử lý Web3
const useWeb3Actions = () => {
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

  const handleConnect = async () => {
    try {
      const ethereum = MMSDK.getProvider();
      await ethereum.request({ method: "eth_requestAccounts" });
      await connectWallet();
    } catch (err) {
      throw new Error("Không thể kết nối ví MetaMask: " + err.message);
    }
  };

  return {
    account,
    contract,
    handleConnect,
    updateWalletAddress,
    web3Loading,
    walletError,
    userError,
    contractError,
    setWalletError,
  };
};

// Hook xử lý nhận diện hình ảnh
const useImagePrediction = () => {
  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  const predict = async (file, category) => {
    setPredictionLoading(true);
    setPredictionError(null);
    setPrediction(null);

    try {
      const config = predictionConfig[category];
      if (!config)
        throw new Error("Loại trái cây không được hỗ trợ nhận diện!");

      const reader = new FileReader();
      const base64Image = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(file);
      });

      const roboflowResponse = await axios({
        method: "POST",
        url: config.endpoint,
        params: {
          api_key:
            process.env.REACT_APP_ROBOFLOW_API_KEY || "E8YOwnmbHAOZ5OCaS8GZ",
        },
        data: base64Image,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const roboflowResult = roboflowResponse.data;
      if (
        !roboflowResult.predictions ||
        roboflowResult.predictions.length === 0
      ) {
        throw new Error("Hình ảnh không phù hợp với loại trái cây được chọn!");
      }

      let predictionResult = roboflowResult.predictions[0].class;
      if (config.classMapping && config.classMapping[predictionResult]) {
        predictionResult = config.classMapping[predictionResult];
      }

      if (!config.validClasses.includes(predictionResult)) {
        throw new Error("Hình ảnh không phù hợp với loại trái cây được chọn!");
      }

      const geminiResponse = await axios({
        method: "POST",
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${
          process.env.REACT_APP_GEMINI_API_KEY ||
          "AIzaSyAY9ZNyI-iddot-okqT0Y5qac-uwwld-QI"
        }`,
        data: {
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
        },
        headers: { "Content-Type": "application/json" },
      });

      const geminiResult = geminiResponse.data;
      let generatedText =
        geminiResult.candidates[0].content.parts[0].text.replace(/\*/g, "");
      const recommendationMatch = generatedText.match(
        /Khuyến nghị:\s*([^\n]+)/
      );
      const tipMatch = generatedText.match(/Mẹo:\s*([^\n]+)/);

      const formattedMessage = `
        <div style="line-height: 1.5;">
          <strong style="color: #1976D2;">Trạng thái:</strong> ${
            predictionResult === "ripe"
              ? "Đã chín"
              : predictionResult === "semiripe"
              ? "Chín một phần"
              : "Chưa chín"
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
      setSnackbarSeverity(
        predictionResult === "ripe"
          ? "success"
          : predictionResult === "semiripe"
          ? "info"
          : "warning"
      );
      setPrediction(predictionResult);
      return predictionResult;
    } catch (error) {
      setPredictionError(
        "Không thể nhận diện hoặc tạo khuyến nghị: " + error.message
      );
      return null;
    } finally {
      setPredictionLoading(false);
    }
  };

  return {
    prediction,
    predictionLoading,
    predictionError,
    snackbarMessage,
    snackbarSeverity,
    predict,
  };
};

// Component Form
const ProductForm = ({
  register,
  errors,
  handleImageChange,
  farms,
  product,
  imagePreview,
  prediction,
  predictionLoading,
  predictionError,
}) => {
  const validFruits = [
    "Thom",
    "Vu Sua",
    "Dua Hau",
    "Mang Cut",
    "Trai Thanh Long",
    "Trai Xoai",
  ];

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Nhập tên sản phẩm"
          {...register("name", { required: "Tên sản phẩm là bắt buộc" })}
          error={!!errors.name}
          helperText={errors.name?.message}
          variant="standard"
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth variant="standard">
          <InputLabel shrink>Loại trái cây</InputLabel>
          <Select
            {...register("category", { required: "Loại trái cây là bắt buộc" })}
            error={!!errors.category}
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
          {errors.category && (
            <Typography color="error">{errors.category.message}</Typography>
          )}
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Nhập giá sản phẩm (AGT token)"
          type="number"
          {...register("price", {
            required: "Giá là bắt buộc",
            min: { value: 0, message: "Giá phải lớn hơn 0" },
          })}
          error={!!errors.price}
          helperText={errors.price?.message}
          variant="standard"
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Nhập số lượng (hộp)"
          type="number"
          {...register("quantity", {
            required: "Số lượng là bắt buộc",
            min: { value: 1, message: "Số lượng phải lớn hơn 0" },
          })}
          error={!!errors.quantity}
          helperText={errors.quantity?.message}
          variant="standard"
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Nhập thông tin mô tả sản phẩm tại đây..."
          {...register("description", { required: "Mô tả là bắt buộc" })}
          error={!!errors.description}
          helperText={errors.description?.message}
          variant="standard"
          InputLabelProps={{ shrink: true }}
          multiline
          rows={2}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Hình ảnh"
          type="file"
          onChange={handleImageChange}
          InputLabelProps={{ shrink: true }}
          variant="standard"
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
            severity={
              prediction === "ripe"
                ? "success"
                : prediction === "semiripe"
                ? "info"
                : "warning"
            }
            sx={{ mt: 2 }}
          >
            {prediction === "ripe"
              ? "Sản phẩm đã chín, sẵn sàng để bán!"
              : prediction === "semiripe"
              ? "Sản phẩm chín một phần, có thể bán nhưng nên kiểm tra kỹ!"
              : "Sản phẩm chưa chín, bạn nên chờ thêm trước khi bán."}
          </Alert>
        )}
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Ngày sản xuất"
          type="date"
          {...register("productiondate", {
            required: "Ngày sản xuất là bắt buộc",
          })}
          error={!!errors.productiondate}
          helperText={errors.productiondate?.message}
          InputLabelProps={{ shrink: true }}
          variant="standard"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Ngày hết hạn"
          type="date"
          {...register("expirydate", {
            required: "Ngày hết hạn là bắt buộc",
            validate: (value, { productiondate }) =>
              new Date(value) > new Date(productiondate) ||
              "Ngày hết hạn phải sau ngày sản xuất",
          })}
          error={!!errors.expirydate}
          helperText={errors.expirydate?.message}
          InputLabelProps={{ shrink: true }}
          variant="standard"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth variant="standard">
          <InputLabel shrink>Farm</InputLabel>
          <Select
            {...register("farm_id", { required: "Farm là bắt buộc" })}
            error={!!errors.farm_id}
          >
            {farms.map((farm) => (
              <MenuItem key={farm.id} value={farm.id}>
                {farm.farm_name}
              </MenuItem>
            ))}
          </Select>
          {errors.farm_id && (
            <Typography color="error">{errors.farm_id.message}</Typography>
          )}
        </FormControl>
      </Grid>
    </Grid>
  );
};

// Component chính
const AddFarmProductForm = () => {
  const navigate = useNavigate();
  const {
    account,
    contract,
    handleConnect,
    updateWalletAddress,
    web3Loading,
    walletError,
    userError,
    contractError,
    setWalletError,
  } = useWeb3Actions();
  const {
    prediction,
    predictionLoading,
    predictionError,
    snackbarMessage,
    snackbarSeverity,
    predict,
  } = useImagePrediction();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [farms, setFarms] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      category: "",
      price: "",
      quantity: "",
      description: "",
      productiondate: "",
      expirydate: "",
      farm_id: "",
    },
  });

  const product = watch();

  useEffect(() => {
    if (!user.email) {
      navigate("/dang-nhap");
      return;
    }
    if (!account) return;

    const fetchFarms = async () => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/farms/user?email=${user.email}`,
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
    if (success) {
      const timer = setTimeout(() => navigate("/farms/products"), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

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
        await predict(file, product.category);
        setSnackbarOpen(true);
      }
    }
  };

  const handleUpdateWallet = async () => {
    try {
      await updateWalletAddress(user.email);
      setWalletError(null);
      setError(null);
      const response = await fetch(
        `${BACKEND_URL}/farms/user?email=${user.email}`,
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
      } else {
        setError("Không tìm thấy farm của bạn! Vui lòng tạo farm trước.");
        setTimeout(() => navigate("/farms/register"), 3000);
      }
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
      const response = await fetch(`${BACKEND_URL}/ipfs/add`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || errorData.details || "Lỗi khi upload lên IPFS"
        );
      }
      const data = await response.json();
      if (!data.hash) {
        throw new Error("Không nhận được hash từ IPFS");
      }
      // Kiểm tra xem hash IPFS có hợp lệ không
      const checkResponse = await fetch(`${IPFS_GATEWAY}${data.hash}`, {
        method: "HEAD",
      });
      if (!checkResponse.ok) {
        throw new Error("Hash IPFS không hợp lệ hoặc không tồn tại.");
      }
      return data.hash;
    } catch (error) {
      throw new Error("Không thể upload ảnh lên IPFS: " + error.message);
    }
  };

  const onSubmit = async (data) => {
    if (!account || !contract) {
      setError("Vui lòng kết nối ví MetaMask và khởi tạo hợp đồng!");
      return;
    }

    if (
      [
        "Dua Hau",
        "Mang Cut",
        "Trai Thanh Long",
        "Trai Xoai",
        "Vu Sua",
      ].includes(data.category) &&
      imageFile
    ) {
      if (!prediction) {
        setError("Vui lòng chờ nhận diện hình ảnh trước khi thêm sản phẩm!");
        return;
      }
      if (prediction !== "ripe" && prediction !== "semiripe") {
        setError("Sản phẩm chưa chín! Vui lòng chọn sản phẩm đã chín để thêm.");
        return;
      }
    }

    setOpenConfirm(true);
  };

  const confirmSubmit = async (data) => {
    setOpenConfirm(false);
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const productCode = generateProductCode(data.name);
      const fruitType = data.category;
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
        gasLimit = Math.floor(Number(gasEstimate) * 1.2); // Tăng 20% để an toàn
      } catch (err) {
        gasLimit = 1000000;
      }

      await contract.methods.setFruitHash(fruitType, ipfsHash).send({
        from: account,
        gas: gasLimit,
      });

      const productData = {
        name: data.name,
        productcode: productCode,
        category: data.category,
        description: data.description,
        price: data.price,
        quantity: data.quantity,
        productdate: data.productiondate,
        expirydate: data.expirydate,
        farm_id: data.farm_id,
        email: user.email,
        frontendHash: ipfsHash,
      };

      await addFruitProduct(productData, { "x-ethereum-address": account });
      setSuccess("Thêm sản phẩm thành công!");
    } catch (err) {
      let errorMessage = "Không thể thêm sản phẩm. Vui lòng thử lại sau.";
      if (err.code === -32603) {
        errorMessage = "Lỗi giao dịch blockchain: Kiểm tra Hardhat node.";
      } else if (err.message.includes("out of gas")) {
        errorMessage = "Giao dịch hết gas.";
      } else if (err.message.includes("revert")) {
        errorMessage = "Hợp đồng từ chối giao dịch.";
      } else if (err.message.includes("Failed to fetch")) {
        errorMessage = "Không thể kết nối đến backend.";
      } else if (err.message.includes("IPFS")) {
        errorMessage = err.message; // Hiển thị lỗi IPFS chi tiết
      }
      setError(errorMessage);
    } finally {
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
            {walletError.includes(
              "Địa chỉ ví MetaMask không được liên kết"
            ) && (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleUpdateWallet}
                sx={{
                  ml: 2,
                  textTransform: "none",
                  bgcolor: "#f50057",
                  "&:hover": { bgcolor: "#c51162" },
                }}
              >
                Cập nhật ví MetaMask
              </Button>
            )}
          </Alert>
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
              onClick={handleConnect}
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

        <form onSubmit={handleSubmit(onSubmit)}>
          <ProductForm
            register={register}
            errors={errors}
            handleImageChange={handleImageChange}
            farms={farms}
            product={product}
            imagePreview={imagePreview}
            prediction={prediction}
            predictionLoading={predictionLoading}
            predictionError={predictionError}
          />
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
        </form>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          <div dangerouslySetInnerHTML={{ __html: snackbarMessage }} />
        </Alert>
      </Snackbar>

      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>Xác nhận thêm sản phẩm</DialogTitle>
        <DialogContent>
          Bạn có chắc muốn thêm sản phẩm này? Giao dịch sẽ được ghi lên
          blockchain.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>Hủy</Button>
          <Button onClick={() => confirmSubmit(product)}>Xác nhận</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddFarmProductForm;