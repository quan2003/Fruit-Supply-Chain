// src/pages/FarmManagement/FarmDetail.jsx
import React from "react";
import { Box, Typography } from "@mui/material";

const FarmDetail = ({ farmData }) => {
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
        Thông tin vùng trồng
      </Typography>
      <Typography sx={{ mb: 1, color: "#333" }}>
        Thời tiết: {farmData.weather}
      </Typography>
      <Typography sx={{ mb: 1, color: "#333" }}>
        Sản lượng: {farmData.yield}
      </Typography>
      <Typography sx={{ mb: 1, color: "#333" }}>
        Chất lượng: {farmData.quality}
      </Typography>
      <Typography sx={{ color: "#666", mt: 1 }}>
        Dữ liệu được lưu trữ trên Blockchain.
      </Typography>
    </Box>
  );
};

export default FarmDetail;
