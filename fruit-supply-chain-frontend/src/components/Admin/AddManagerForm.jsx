import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Alert,
  Typography,
  CircularProgress,
} from "@mui/material";
import { addManager } from "../../services/api";

const AddManagerForm = ({ onSuccess }) => {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!address) {
      setError("Vui lòng nhập địa chỉ ví!");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setError("Địa chỉ ví không hợp lệ! Vui lòng kiểm tra lại.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    setTransactionHash("");
    try {
      const response = await addManager({ address });
      onSuccess(response.user);
      setAddress("");
      setSuccess("Thêm quản lý thành công!");
      setTransactionHash(response.transactionHash || "");
      setTimeout(() => {
        setSuccess("");
        setTransactionHash("");
      }, 5000);
    } catch (error) {
      console.error("Error adding manager:", error);
      setError(
        error.message || "Có lỗi xảy ra khi thêm quản lý. Vui lòng thử lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        maxWidth: 500,
        mx: "auto",
        p: 2,
      }}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}
      {transactionHash && (
        <Box sx={{ mb: 2, bgcolor: "#f5f5f5", p: 2, borderRadius: 1 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: "medium" }}>
            Mã giao dịch Blockchain:
          </Typography>
          <Typography
            variant="body2"
            sx={{
              wordBreak: "break-all",
              fontFamily: "monospace",
              bgcolor: "#e0e0e0",
              p: 1,
              borderRadius: 1,
            }}
          >
            {transactionHash}
          </Typography>
        </Box>
      )}
      <TextField
        label="Địa chỉ ví Ethereum"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        fullWidth
        placeholder="Ví dụ: 0x1234..."
        disabled={loading}
        variant="outlined"
        InputProps={{
          sx: { fontFamily: "monospace" },
        }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : null}
      >
        {loading ? "Đang xử lý..." : "Thêm quản lý"}
      </Button>
    </Box>
  );
};

export default AddManagerForm;
