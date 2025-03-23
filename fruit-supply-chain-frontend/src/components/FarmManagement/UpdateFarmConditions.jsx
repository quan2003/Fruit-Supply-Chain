// src/pages/FarmManagement/UpdateFarmContent.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";

const UpdateFarmContent = ({ onUpdate, initialData }) => {
  const [updateData, setUpdateData] = useState({
    yield: initialData?.yield || "",
    condition: initialData?.condition || "",
  });
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!updateData.yield || !updateData.condition) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    onUpdate(updateData);
    setError("");
  };

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: "#FFFFFF",
        borderRadius: 2,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #E8F5E9",
      }}
    >
      <Typography
        variant="h6"
        sx={{ mb: 2, fontWeight: "bold", color: "#388E3C" }}
      >
        Cập nhật thông tin vùng trồng
      </Typography>
      {error && <Typography sx={{ color: "red", mb: 2 }}>{error}</Typography>}
      <Box component="form" onSubmit={handleSubmit}>
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
          <InputLabel>Tình trạng cây trồng</InputLabel>
          <Select
            value={updateData.condition}
            onChange={(e) =>
              setUpdateData({ ...updateData, condition: e.target.value })
            }
            label="Tình trạng cây trồng"
          >
            <MenuItem value="Tốt">Tốt</MenuItem>
            <MenuItem value="Trung bình">Trung bình</MenuItem>
            <MenuItem value="Kém">Kém</MenuItem>
          </Select>
        </FormControl>
        <Button
          fullWidth
          variant="contained"
          type="submit"
          sx={{
            bgcolor: "#1976D2",
            "&:hover": { bgcolor: "#115293" },
            py: 1.5,
            fontWeight: "bold",
          }}
        >
          Cập nhật
        </Button>
      </Box>
    </Box>
  );
};

export default UpdateFarmContent;
