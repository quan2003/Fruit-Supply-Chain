// fruit-supply-chain-frontend/src/components/common/Layout.jsx
import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
} from "@mui/material"; // Thêm Button vào import
import { Link } from "react-router-dom";

const Layout = ({ children }) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{ flexGrow: 1, textDecoration: "none", color: "inherit" }}
          >
            Fruit Supply Chain
          </Typography>
          <Button color="inherit" component={Link} to="/dashboard">
            Dashboard
          </Button>
          <Button color="inherit" component={Link} to="/farms">
            Farms
          </Button>
          <Button color="inherit" component={Link} to="/catalog">
            Catalog
          </Button>
          <Button color="inherit" component={Link} to="/analytics">
            Analytics
          </Button>
          <Button color="inherit" component={Link} to="/admin">
            Admin
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>{children}</Container>
    </Box>
  );
};

export default Layout;
