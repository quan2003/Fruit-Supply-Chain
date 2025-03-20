// src/pages/FarmManagement/FarmList.jsx
import React from "react";
import { Box, Typography, List, ListItem, ListItemText } from "@mui/material";

const FarmList = () => {
  const farms = [
    { id: 1, name: "Vùng trồng 1", location: "Đà Lạt" },
    { id: 2, name: "Vùng trồng 2", location: "Tiền Giang" },
    { id: 3, name: "Vùng trồng 3", location: "Long An" },
  ];

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
        Danh sách vùng trồng
      </Typography>
      <List>
        {farms.map((farm) => (
          <ListItem key={farm.id}>
            <ListItemText
              primary={farm.name}
              secondary={`Vị trí: ${farm.location}`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default FarmList;
