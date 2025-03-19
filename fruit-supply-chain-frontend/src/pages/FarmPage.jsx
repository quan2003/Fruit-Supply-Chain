import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Tabs,
  Tab,
  Paper,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import Layout from "../components/common/Layout";
import FarmList from "../components/FarmManagement/FarmList";
import FarmDetail from "../components/FarmManagement/FarmDetail";
import RegisterFarmForm from "../components/FarmManagement/RegisterFarmForm";
import UpdateFarmConditions from "../components/FarmManagement/UpdateFarmConditions";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useWeb3Context } from "../contexts/Web3Context";
import { useAuthContext } from "../contexts/AuthContext";
import {
  getAllFarms,
  getFarmById,
  registerFarm,
} from "../services/farmService";

const FarmPage = () => {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const { isConnected, account } = useWeb3Context();
  const { user } = useAuthContext();

  const [tabValue, setTabValue] = useState(0);
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  const canRegisterFarm = user?.role === "producer" || user?.role === "admin";

  useEffect(() => {
    const loadFarms = async () => {
      try {
        setLoading(true);
        const data = await getAllFarms();
        setFarms(data);

        // If farmId is provided in URL, load that specific farm
        if (farmId) {
          const farm = await getFarmById(farmId);
          setSelectedFarm(farm);
          setTabValue(1); // Switch to detail tab
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading farms:", error);
        setLoading(false);
      }
    };

    if (isConnected) {
      loadFarms();
    } else {
      setLoading(false);
    }
  }, [isConnected, farmId]);

  useEffect(() => {
    if (selectedFarm && account) {
      // Check if current user is the farm owner
      setIsOwner(
        selectedFarm.ownerAddress.toLowerCase() === account.toLowerCase()
      );
    }
  }, [selectedFarm, account]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 0) {
      setSelectedFarm(null);
      setShowRegisterForm(false);
      setShowUpdateForm(false);
      navigate("/farms");
    }
  };

  const handleSelectFarm = (farm) => {
    setSelectedFarm(farm);
    setTabValue(1); // Switch to detail tab
    navigate(`/farms/${farm.id}`);
  };

  const handleRegisterFarmClick = () => {
    setShowRegisterForm(true);
    setTabValue(2); // Switch to register tab
  };

  const handleUpdateFarmClick = () => {
    setShowUpdateForm(true);
    setTabValue(3); // Switch to update tab
  };

  const handleFarmRegistered = (newFarm) => {
    setFarms([...farms, newFarm]);
    setSelectedFarm(newFarm);
    setShowRegisterForm(false);
    setTabValue(1); // Switch to detail tab
    navigate(`/farms/${newFarm.id}`);
  };

  const handleFarmUpdated = (updatedFarm) => {
    setFarms(
      farms.map((farm) => (farm.id === updatedFarm.id ? updatedFarm : farm))
    );
    setSelectedFarm(updatedFarm);
    setShowUpdateForm(false);
    setTabValue(1); // Switch back to detail tab
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredFarms = farms.filter(
    (farm) =>
      farm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner />;
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
            Quản lý vùng trồng
          </Typography>

          {canRegisterFarm && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleRegisterFarmClick}
            >
              Đăng ký vùng trồng mới
            </Button>
          )}
        </Box>

        {tabValue === 0 && (
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Tìm kiếm theo tên, địa điểm hoặc chủ sở hữu..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Danh sách vùng trồng" />
            <Tab label="Chi tiết vùng trồng" disabled={!selectedFarm} />
            <Tab
              label="Đăng ký vùng trồng"
              disabled={!canRegisterFarm || !showRegisterForm}
            />
            <Tab
              label="Cập nhật thông tin"
              disabled={!isOwner || !showUpdateForm}
            />
          </Tabs>
        </Box>

        {!isConnected ? (
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Typography variant="h6">
              Vui lòng kết nối ví để xem thông tin vùng trồng
            </Typography>
          </Box>
        ) : (
          <>
            {tabValue === 0 && (
              <FarmList farms={filteredFarms} onSelectFarm={handleSelectFarm} />
            )}

            {tabValue === 1 && selectedFarm && (
              <Box>
                <FarmDetail farm={selectedFarm} />

                {isOwner && (
                  <Box
                    sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<EditIcon />}
                      onClick={handleUpdateFarmClick}
                    >
                      Cập nhật thông tin vùng trồng
                    </Button>
                  </Box>
                )}
              </Box>
            )}

            {tabValue === 2 && showRegisterForm && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Đăng ký vùng trồng mới
                </Typography>
                <RegisterFarmForm onSuccess={handleFarmRegistered} />
              </Paper>
            )}

            {tabValue === 3 && showUpdateForm && selectedFarm && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Cập nhật thông tin vùng trồng
                </Typography>
                <UpdateFarmConditions
                  farm={selectedFarm}
                  onSuccess={handleFarmUpdated}
                />
              </Paper>
            )}
          </>
        )}
      </Container>
    </Layout>
  );
};

export default FarmPage;
