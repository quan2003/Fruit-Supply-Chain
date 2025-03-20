// src/pages/FarmManagement/RegisterFarmForm.jsx
import React, { useState } from "react";
import { Box, Typography, TextField, Button } from "@mui/material";

const RegisterFarmForm = ({ onRegister }) => {
  const [farmName, setFarmName] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister({ name: farmName, location });
    setFarmName("");
    setLocation("");
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
        Đăng ký vùng trồng mới
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Tên vùng trồng"
          variant="outlined"
          sx={{ mb: 2 }}
          value={farmName}
          onChange={(e) => setFarmName(e.target.value)}
        />
        <TextField
          fullWidth
          label="Vị trí"
          variant="outlined"
          sx={{ mb: 2 }}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
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
          Đăng ký
        </Button>
      </Box>
    </Box>
  );
};

export default RegisterFarmForm;
