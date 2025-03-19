// fruit-supply-chain-frontend/src/components/common/Layout.jsx
import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
} from "@mui/material";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Layout = ({ children }) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="static"
        sx={{ background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)" }}
      >
        <Toolbar>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                flexGrow: 1,
                textDecoration: "none",
                color: "white",
                fontWeight: "bold",
              }}
            >
              Fruit Supply Chain
            </Typography>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              color="inherit"
              component={Link}
              to="/dashboard"
              sx={{ color: "white", fontWeight: "bold" }}
            >
              Dashboard
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              color="inherit"
              component={Link}
              to="/farms"
              sx={{ color: "white", fontWeight: "bold" }}
            >
              Farms
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              color="inherit"
              component={Link}
              to="/catalog"
              sx={{ color: "white", fontWeight: "bold" }}
            >
              Catalog
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              color="inherit"
              component={Link}
              to="/analytics"
              sx={{ color: "white", fontWeight: "bold" }}
            >
              Analytics
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              color="inherit"
              component={Link}
              to="/admin"
              sx={{ color: "white", fontWeight: "bold" }}
            >
              Admin
            </Button>
          </motion.div>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>{children}</Container>
    </Box>
  );
};

export default Layout;
