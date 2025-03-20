// fruit-supply-chain-frontend/src/components/common/Sidebar.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useMediaQuery,
  useTheme,
  Drawer,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  Speed,
  Agriculture,
  Add,
  ManageAccounts,
  Help,
  Book,
  ContactSupport,
} from "@mui/icons-material";

const Sidebar = () => {
  const { isManager, isFarmer, userFarms } = useAuth();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const linkHover = {
    scale: 1.05,
    color: "#FFD700",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: "4px",
    transition: { duration: 0.3 },
  };

  const sidebarContent = (
    <>
      <Box sx={{ mb: 3, mt: 2 }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              background: "linear-gradient(45deg, #FFFFFF 30%, #FFD700 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textAlign: "center",
            }}
          >
            Menu
          </Typography>
        </motion.div>
      </Box>

      <Divider sx={{ background: "rgba(255, 255, 255, 0.3)", mb: 2 }} />

      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: "bold",
            mb: 1,
            textAlign: "center",
            color: "white",
          }}
        >
          Truy cập nhanh
        </Typography>
        <List>
          <motion.div whileHover={linkHover}>
            <ListItem button component={Link} to="/tracker">
              <ListItemIcon>
                <Speed sx={{ color: "white" }} />
              </ListItemIcon>
              <ListItemText
                primary="Truy xuất nguồn gốc"
                primaryTypographyProps={{
                  color: "white",
                  fontWeight: "medium",
                }}
              />
            </ListItem>
          </motion.div>
          {isFarmer && (
            <motion.div whileHover={linkHover}>
              <ListItem button component={Link} to="/farms/harvest">
                <ListItemIcon>
                  <Agriculture sx={{ color: "white" }} />
                </ListItemIcon>
                <ListItemText
                  primary="Thu hoạch mới"
                  primaryTypographyProps={{
                    color: "white",
                    fontWeight: "medium",
                  }}
                />
              </ListItem>
            </motion.div>
          )}
        </List>
      </Box>

      {isFarmer && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: "bold",
              mb: 1,
              textAlign: "center",
              color: "white",
            }}
          >
            Nông trại của tôi
          </Typography>
          <List>
            {userFarms.map((farm, index) => (
              <motion.div
                key={farm.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={linkHover}
              >
                <ListItem button component={Link} to={`/farms/${farm.id}`}>
                  <ListItemIcon>
                    <Agriculture sx={{ color: "white" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={farm.location}
                    primaryTypographyProps={{
                      color: "white",
                      fontWeight: "medium",
                    }}
                  />
                </ListItem>
              </motion.div>
            ))}
            <motion.div whileHover={linkHover}>
              <ListItem button component={Link} to="/farms/register">
                <ListItemIcon>
                  <Add sx={{ color: "white" }} />
                </ListItemIcon>
                <ListItemText
                  primary="+ Đăng ký nông trại mới"
                  primaryTypographyProps={{
                    color: "white",
                    fontWeight: "medium",
                  }}
                />
              </ListItem>
            </motion.div>
          </List>
        </Box>
      )}

      {isManager && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: "bold",
              mb: 1,
              textAlign: "center",
              color: "white",
            }}
          >
            Quản lý
          </Typography>
          <List>
            <motion.div whileHover={linkHover}>
              <ListItem button component={Link} to="/admin/managers">
                <ListItemIcon>
                  <ManageAccounts sx={{ color: "white" }} />
                </ListItemIcon>
                <ListItemText
                  primary="Quản lý người dùng"
                  primaryTypographyProps={{
                    color: "white",
                    fontWeight: "medium",
                  }}
                />
              </ListItem>
            </motion.div>
            <motion.div whileHover={linkHover}>
              <ListItem button component={Link} to="/admin/catalogs">
                <ListItemIcon>
                  <ManageAccounts sx={{ color: "white" }} />
                </ListItemIcon>
                <ListItemText
                  primary="Quản lý danh mục"
                  primaryTypographyProps={{
                    color: "white",
                    fontWeight: "medium",
                  }}
                />
              </ListItem>
            </motion.div>
          </List>
        </Box>
      )}

      <Box>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: "bold",
            mb: 1,
            textAlign: "center",
            color: "white",
          }}
        >
          Hỗ trợ
        </Typography>
        <List>
          <motion.div whileHover={linkHover}>
            <ListItem button component="a" href="/guide">
              <ListItemIcon>
                <Book sx={{ color: "white" }} />
              </ListItemIcon>
              <ListItemText
                primary="Hướng dẫn sử dụng"
                primaryTypographyProps={{
                  color: "white",
                  fontWeight: "medium",
                }}
              />
            </ListItem>
          </motion.div>
          <motion.div whileHover={linkHover}>
            <ListItem button component="a" href="/faq">
              <ListItemIcon>
                <Help sx={{ color: "white" }} />
              </ListItemIcon>
              <ListItemText
                primary="Câu hỏi thường gặp"
                primaryTypographyProps={{
                  color: "white",
                  fontWeight: "medium",
                }}
              />
            </ListItem>
          </motion.div>
          <motion.div whileHover={linkHover}>
            <ListItem button component="a" href="/contact">
              <ListItemIcon>
                <ContactSupport sx={{ color: "white" }} />
              </ListItemIcon>
              <ListItemText
                primary="Liên hệ hỗ trợ"
                primaryTypographyProps={{
                  color: "white",
                  fontWeight: "medium",
                }}
              />
            </ListItem>
          </motion.div>
        </List>
      </Box>
    </>
  );

  // For desktop, use permanent sidebar
  if (isDesktop) {
    return (
      <Box
        component="aside"
        sx={{
          width: 250,
          background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
          color: "white",
          p: 2,
          minHeight: "100%",
          boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1000,
          display: { xs: "none", md: "block" },
          mt: 8, // Space for header
          pt: 2,
          overflowY: "auto",
          height: "calc(100% - 64px - 48px)", // Subtract app bar height and footer height (48px)
        }}
      >
        {sidebarContent}
      </Box>
    );
  }

  // For mobile, don't render anything - the drawer will be handled in Layout component
  return null;
};

export default Sidebar;
