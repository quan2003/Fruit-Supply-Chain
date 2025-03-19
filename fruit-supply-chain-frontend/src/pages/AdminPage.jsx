import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Add as AddIcon, Security as SecurityIcon } from "@mui/icons-material";
import Layout from "../components/common/Layout";
import ManagersList from "../components/Admin/ManagersList";
import AddManagerForm from "../components/Admin/AddManagerForm";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useWeb3Context } from "../contexts/useWeb3";
import { useAuthContext } from "../contexts/AuthContext";
import {
  getAllManagers,
  addManager,
  revokeManagerRole,
  getBlockchainInfo,
  getSystemStats,
} from "../services/api";

const AdminPage = () => {
  const { isConnected, account } = useWeb3();
  const { user } = useAuthContext();

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [blockchainInfo, setBlockchainInfo] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState(null);
  const [selectedManager, setSelectedManager] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        setLoading(true);
        // Check if current user is admin based on role
        if (user && user.role === "admin") {
          setIsAdmin(true);

          // If admin, load manager data
          const managersData = await getAllManagers();
          setManagers(managersData);

          // Load blockchain info
          const blockchainData = await getBlockchainInfo();
          setBlockchainInfo(blockchainData);

          // Load system statistics
          const stats = await getSystemStats();
          setSystemStats(stats);
        } else {
          setIsAdmin(false);
          setErrorMessage("Bạn không có quyền truy cập vào trang quản trị");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        setErrorMessage(
          "Có lỗi khi kiểm tra quyền truy cập. Vui lòng thử lại sau."
        );
        setLoading(false);
      }
    };

    if (isConnected && user) {
      checkAdmin();
    } else {
      setLoading(false);
      setErrorMessage("Vui lòng kết nối ví và đăng nhập để tiếp tục");
    }
  }, [isConnected, user]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setShowAddForm(false);
  };

  const handleAddManagerClick = () => {
    setShowAddForm(true);
    setTabValue(1); // Switch to managers tab if not already there
  };

  const handleManagerAdded = (newManager) => {
    setManagers([...managers, newManager]);
    setShowAddForm(false);
  };

  // Dialog handlers
  const openConfirmationDialog = (action, manager = null) => {
    setDialogAction(action);
    setSelectedManager(manager);
    setOpenDialog(true);
  };

  const closeDialog = () => {
    setOpenDialog(false);
    setDialogAction(null);
    setSelectedManager(null);
  };

  const handleRevokeManager = async (managerId) => {
    try {
      setLoading(true);
      await revokeManagerRole(managerId);
      // Update managers list by removing the revoked manager
      setManagers(managers.filter((manager) => manager.id !== managerId));
      setLoading(false);
    } catch (error) {
      console.error("Error revoking manager role:", error);
      setLoading(false);
    }
  };

  const handleDialogConfirm = () => {
    if (dialogAction === "revoke" && selectedManager) {
      handleRevokeManager(selectedManager.id);
    }
    closeDialog();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isConnected) {
    return (
      <Layout>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Typography variant="h6">
              Vui lòng kết nối ví để truy cập trang quản trị
            </Typography>
          </Box>
        </Container>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <Container maxWidth="lg">
          <Box sx={{ mt: 4 }}>
            <Alert severity="error">{errorMessage}</Alert>
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h1">
            <SecurityIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Trang quản trị hệ thống
          </Typography>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddManagerClick}
          >
            Thêm quản lý mới
          </Button>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Tổng quan hệ thống" />
            <Tab label="Quản lý người dùng" />
            <Tab label="Thông tin Blockchain" />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Thống kê hệ thống
                </Typography>
                {systemStats && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                      <Box
                        sx={{
                          p: 2,
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="subtitle2" color="text.secondary">
                          Tổng số vùng trồng
                        </Typography>
                        <Typography variant="h4">
                          {systemStats.totalFarms}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box
                        sx={{
                          p: 2,
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="subtitle2" color="text.secondary">
                          Tổng số lô trái cây
                        </Typography>
                        <Typography variant="h4">
                          {systemStats.totalBatches}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box
                        sx={{
                          p: 2,
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="subtitle2" color="text.secondary">
                          Tổng số giao dịch
                        </Typography>
                        <Typography variant="h4">
                          {systemStats.totalTransactions}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box
                        sx={{
                          p: 2,
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="subtitle2" color="text.secondary">
                          Tổng số người dùng
                        </Typography>
                        <Typography variant="h4">
                          {systemStats.totalUsers}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          p: 2,
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="subtitle2" color="text.secondary">
                          Hoạt động gần đây
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          {systemStats.recentActivities.map(
                            (activity, index) => (
                              <Box
                                key={index}
                                sx={{
                                  p: 1,
                                  borderBottom:
                                    index <
                                    systemStats.recentActivities.length - 1
                                      ? "1px solid #f0f0f0"
                                      : "none",
                                  "&:hover": { bgcolor: "#f9f9f9" },
                                }}
                              >
                                <Typography variant="body2">
                                  {activity.message}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {new Date(
                                    activity.timestamp
                                  ).toLocaleString()}
                                </Typography>
                              </Box>
                            )
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}

        {tabValue === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {showAddForm ? (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom>
                    Thêm quản lý mới
                  </Typography>
                  <AddManagerForm onSuccess={handleManagerAdded} />
                </Paper>
              ) : (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom>
                    Danh sách quản lý
                  </Typography>
                  <ManagersList
                    managers={managers}
                    onRevokeManager={(manager) =>
                      openConfirmationDialog("revoke", manager)
                    }
                  />
                </Paper>
              )}
            </Grid>
          </Grid>
        )}

        {tabValue === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Thông tin Blockchain
                </Typography>
                {blockchainInfo && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Box
                        sx={{
                          p: 2,
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="subtitle2" color="text.secondary">
                          Network
                        </Typography>
                        <Typography variant="h6">
                          {blockchainInfo.network}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box
                        sx={{
                          p: 2,
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="subtitle2" color="text.secondary">
                          Trạng thái Smart Contract
                        </Typography>
                        <Typography
                          variant="h6"
                          color={
                            blockchainInfo.contractStatus === "Active"
                              ? "success.main"
                              : "error.main"
                          }
                        >
                          {blockchainInfo.contractStatus}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box
                        sx={{
                          p: 2,
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="subtitle2" color="text.secondary">
                          Block hiện tại
                        </Typography>
                        <Typography variant="h6">
                          {blockchainInfo.currentBlock}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          p: 2,
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="subtitle2" color="text.secondary">
                          Địa chỉ Smart Contract
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ wordBreak: "break-all" }}
                        >
                          {blockchainInfo.contractAddress}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          p: 2,
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="subtitle2" color="text.secondary">
                          Thông tin phiên bản
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            <strong>Contract Version:</strong>{" "}
                            {blockchainInfo.version}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Deployed Date:</strong>{" "}
                            {new Date(
                              blockchainInfo.deploymentDate
                            ).toLocaleString()}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Last Updated:</strong>{" "}
                            {new Date(
                              blockchainInfo.lastUpdated
                            ).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>

      {/* Confirmation Dialog */}
      <Dialog open={openDialog} onClose={closeDialog}>
        <DialogTitle>
          {dialogAction === "revoke" && "Thu hồi quyền quản lý"}
        </DialogTitle>
        <DialogContent>
          {dialogAction === "revoke" && selectedManager && (
            <Typography variant="body1">
              Bạn có chắc chắn muốn thu hồi quyền quản lý của{" "}
              {selectedManager.name} (
              {selectedManager.walletAddress.substring(0, 6)}...
              {selectedManager.walletAddress.substring(38)})?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Hủy</Button>
          <Button
            onClick={handleDialogConfirm}
            color="primary"
            variant="contained"
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default AdminPage;
