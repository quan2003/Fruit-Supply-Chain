// fruit-supply-chain-frontend/src/pages/FarmPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
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

import { useWeb3 } from "../contexts/Web3Context";
import { useAuth } from "../contexts/AuthContext";
import {
  getAllFarmsService,
  getFarmByIdService,
  registerFarmService,
} from "../services/farmService";

import { useWeb3 } from "../contexts/Web3Context"; // ✅ Sửa lỗi import
import { useAuth } from "../contexts/AuthContext";
import { getAllFarms, getFarmById } from "../services/farmService";

const FarmPage = () => {
  const { farmId } = useParams();
  const navigate = useNavigate();

  const { account } = useWeb3();

  const { isConnected, account } = useWeb3(); // ✅ Sửa lỗi useWeb3Context()

  const { user } = useAuth();

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
        const data = await getAllFarmsService();
        setFarms(data);

        if (farmId) {
          const farm = await getFarmByIdService(farmId);
          setSelectedFarm(farm);
          setTabValue(1);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error loading farms:", error);
        setLoading(false);
      }
    };

    if (account) {
      loadFarms();
    } else {
      setLoading(false);
    }
  }, [account, farmId]);

  useEffect(() => {
    if (selectedFarm && account) {
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h4">Quản lý vùng trồng</Typography>
          {canRegisterFarm && (
            <Button variant="contained" color="primary" startIcon={<AddIcon />}>
              Đăng ký vùng trồng mới
            </Button>
          )}
        </Box>

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

        {!account ? (
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
