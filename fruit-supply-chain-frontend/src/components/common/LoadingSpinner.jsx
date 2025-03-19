// fruit-supply-chain-frontend/src/components/common/LoadingSpinner.jsx
import React from "react";
import { CircularProgress, Box, Typography } from "@mui/material";

const LoadingSpinner = ({ message = "Đang tải..." }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <CircularProgress />
      <Typography variant="h6" sx={{ mt: 2 }}>
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingSpinner;
