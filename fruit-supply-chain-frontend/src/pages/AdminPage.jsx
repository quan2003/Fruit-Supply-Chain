import React, { useState, useEffect, useCallback } from "react";
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
import { useWeb3 } from "../contexts/Web3Context";
import { useAuth } from "../contexts/AuthContext";
import { getAllManagers, addManager, revokeManagerRole, getBlockchainInfo, getSystemStats } from "../services/api";

// Hook riêng để fetch dữ liệu quản lý
const useAdminData = (account, user) => {
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState([]);
  const [blockchainInfo, setBlockchainInfo] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!account || !user) {
      setLoading(false);
      setErrorMessage("Vui lòng kết nối ví và đăng nhập để tiếp tục");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [managersData, blockchainData, stats] = await Promise.all([
          getAllManagers(),
          getBlockchainInfo(),
          getSystemStats(),
        ]);
        setManagers(managersData);
        setBlockchainInfo(blockchainData);
        setSystemStats(stats);
      } catch (error) {
        setErrorMessage("Có lỗi khi tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [account, user]);

  return { loading, managers, blockchainInfo, systemStats, errorMessage, setManagers };
};

const AdminPage = () => {
  const { account } = useWeb3();
  const { user } = useAuth();
  const { loading, managers, blockchainInfo, systemStats, errorMessage, setManagers } = useAdminData(account, user);

  const [tabValue, setTabValue] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setShowAddForm(false);
  };

  const handleAddManagerClick = () => {
    setShowAddForm(true);
    setTabValue(1);
  };

  const handleManagerAdded = (newManager) => {
    setManagers((prev) => [...prev, newManager]);
    setShowAddForm(false);
  };

  const openConfirmationDialog = useCallback((manager) => {
    setSelectedManager(manager);
    setOpenDialog(true);
  }, []);

  const closeDialog = () => {
    setOpenDialog(false);
    setSelectedManager(null);
  };

  const handleRevokeManager = async () => {
    if (!selectedManager) return;
    try {
      await revokeManagerRole(selectedManager.id);
      setManagers((prev) => prev.filter((manager) => manager.id !== selectedManager.id));
    } catch (error) {
      console.error("Error revoking manager role:", error);
    }
    closeDialog();
  };

  if (loading) return <LoadingSpinner />;

  if (!account)
    return (
      <Layout>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Typography variant="h6">Vui lòng kết nối ví để truy cập trang quản trị</Typography>
          </Box>
        </Container>
      </Layout>
    );

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h4">
            <SecurityIcon sx={{ mr: 1 }} />
            Trang quản trị hệ thống
          </Typography>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleAddManagerClick}>
            Thêm Sản phẩm
          </Button>
        </Box>

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tab label="Danh sách sản phẩm" />
          <Tab label="Quản lý đơn hàng" />
          <Tab label="lịch sử đơn hàng" />
        </Tabs>

        {/* Danh sách sản phẩm*/}
        {tabValue === 0 && systemStats && (
          <Grid container spacing={3}>
            {["totalFarms", "totalBatches", "totalTransactions", "totalUsers"].map((key, index) => (
              <Grid item xs={12} md={3} key={index}>
                <Paper sx={{ p: 3, textAlign: "center" }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {key.replace("total", "Tổng số ")}
                  </Typography>
                  <Typography variant="h4">{systemStats[key]}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Quản lý đơn hàng */}
        {tabValue === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {showAddForm ? (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h5">Thanh toán </Typography>
                  <AddManagerForm onSuccess={handleManagerAdded} />
                </Paper>
              ) : (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h5">Danh sách </Typography>
                  <ManagersList managers={managers} onRevokeManager={openConfirmationDialog} />
                </Paper>
              )}
            </Grid>
          </Grid>
        )}

        {/* Dialog Xác nhận */}
        <Dialog open={openDialog} onClose={closeDialog}>
          <DialogTitle>Xác nhận</DialogTitle>
          <DialogContent>Bạn có chắc muốn thu hồi quyền quản lý của {selectedManager?.name}?</DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>Hủy</Button>
            <Button onClick={handleRevokeManager} color="error">
              Thu hồi
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default AdminPage;
