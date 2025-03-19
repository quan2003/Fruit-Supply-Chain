import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Paper,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  LocalShipping as ShippingIcon,
  Agriculture as AgricultureIcon,
} from "@mui/icons-material";
import Layout from "../components/common/Layout";
import SupplyChainTracker from "../components/SupplyChain/SupplyChainTracker";
import FruitDetail from "../components/SupplyChain/FruitDetail";
import SupplyChainTimeline from "../components/SupplyChain/SupplyChainTimeline";
import HarvestForm from "../components/SupplyChain/HarvestForm";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useWeb3Context } from "../contexts/Web3Context";
import { useAuthContext } from "../contexts/AuthContext";
import {
  getFruitBatchByCode,
  getFruitBatches,
  getFruitBatchState,
  getSupplyChainSteps,
  registerHarvest,
} from "../services/web3Service";

const TrackerPage = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { isConnected, account } = useWeb3Context();
  const { user } = useAuthContext();

  const [tabValue, setTabValue] = useState(0);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [supplyChainData, setSupplyChainData] = useState(null);
  const [currentState, setCurrentState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHarvestForm, setShowHarvestForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCode, setSearchCode] = useState("");

  const canHarvest = user?.role === "producer" || user?.role === "admin";
  const canUpdateSupplyChain = [
    "producer",
    "thirdParty",
    "deliveryHub",
    "admin",
  ].includes(user?.role);

  useEffect(() => {
    const loadBatches = async () => {
      try {
        setLoading(true);
        const data = await getFruitBatches();
        setBatches(data);

        // If batchId is provided in URL, load that specific batch
        if (batchId) {
          const batch = await getFruitBatchByCode(batchId);
          setSelectedBatch(batch);

          // Load supply chain data
          const supplyChain = await getSupplyChainSteps(batchId);
          setSupplyChainData(supplyChain);

          // Get current state
          const state = await getFruitBatchState(batchId);
          setCurrentState(state);

          setTabValue(1); // Switch to detail tab
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading fruit batches:", error);
        setLoading(false);
      }
    };

    if (isConnected) {
      loadBatches();
    } else {
      setLoading(false);
    }
  }, [isConnected, batchId]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 0) {
      setSelectedBatch(null);
      setSupplyChainData(null);
      setCurrentState(null);
      setShowHarvestForm(false);
      navigate("/tracker");
    }
  };

  const handleSelectBatch = async (batch) => {
    try {
      setLoading(true);
      setSelectedBatch(batch);

      // Load supply chain data
      const supplyChain = await getSupplyChainSteps(batch.id);
      setSupplyChainData(supplyChain);

      // Get current state
      const state = await getFruitBatchState(batch.id);
      setCurrentState(state);

      setTabValue(1); // Switch to detail tab
      navigate(`/tracker/${batch.id}`);
      setLoading(false);
    } catch (error) {
      console.error("Error loading batch details:", error);
      setLoading(false);
    }
  };

  const handleHarvestClick = () => {
    setShowHarvestForm(true);
    setTabValue(2); // Switch to harvest tab
  };

  const handleHarvestRegistered = (newBatch) => {
    setBatches([...batches, newBatch]);
    setSelectedBatch(newBatch);
    setShowHarvestForm(false);

    // Set initial supply chain data
    setSupplyChainData([
      {
        step: "Harvested",
        timestamp: new Date().getTime(),
        actor: account,
        notes: "Initial harvest registered",
      },
    ]);

    setCurrentState("Harvested");
    setTabValue(1); // Switch to detail tab
    navigate(`/tracker/${newBatch.id}`);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchCodeChange = (event) => {
    setSearchCode(event.target.value);
  };

  const handleSearchCodeSubmit = async () => {
    if (!searchCode) return;

    try {
      setLoading(true);
      const batch = await getFruitBatchByCode(searchCode);
      if (batch) {
        await handleSelectBatch(batch);
      } else {
        alert("Không tìm thấy lô trái cây với mã này!");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error finding batch by code:", error);
      alert("Có lỗi xảy ra khi tìm kiếm mã lô trái cây!");
      setLoading(false);
    }
  };

  const filteredBatches = batches.filter(
    (batch) =>
      batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.fruitType.toLowerCase().includes(searchTerm.toLowerCase())
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
            Theo dõi chuỗi cung ứng
          </Typography>

          {canHarvest && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AgricultureIcon />}
              onClick={handleHarvestClick}
            >
              Đăng ký thu hoạch
            </Button>
          )}
        </Box>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Tìm kiếm nhanh theo mã lô
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Nhập mã lô trái cây..."
              value={searchCode}
              onChange={handleSearchCodeChange}
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleSearchCodeSubmit}
              startIcon={<SearchIcon />}
            >
              Tìm kiếm
            </Button>
          </Box>
        </Paper>

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Danh sách lô trái cây" />
            <Tab label="Chi tiết & Chuỗi cung ứng" disabled={!selectedBatch} />
            <Tab
              label="Đăng ký thu hoạch"
              disabled={!canHarvest || !showHarvestForm}
            />
          </Tabs>
        </Box>

        {!isConnected ? (
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Typography variant="h6">
              Vui lòng kết nối ví để theo dõi chuỗi cung ứng
            </Typography>
          </Box>
        ) : (
          <>
            {tabValue === 0 && (
              <>
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Tìm kiếm theo tên, nhà sản xuất hoặc loại trái cây..."
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
                <SupplyChainTracker
                  batches={filteredBatches}
                  onSelectBatch={handleSelectBatch}
                />
              </>
            )}

            {tabValue === 1 && selectedBatch && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <FruitDetail
                    batch={selectedBatch}
                    currentState={currentState}
                    canUpdate={canUpdateSupplyChain}
                    onStateUpdated={(updatedState) =>
                      setCurrentState(updatedState)
                    }
                  />
                </Grid>
                <Grid item xs={12} md={8}>
                  <SupplyChainTimeline
                    data={supplyChainData}
                    currentState={currentState}
                  />
                </Grid>
              </Grid>
            )}

            {tabValue === 2 && showHarvestForm && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Đăng ký thu hoạch trái cây
                </Typography>
                <HarvestForm onSuccess={handleHarvestRegistered} />
              </Paper>
            )}
          </>
        )}
      </Container>
    </Layout>
  );
};

export default TrackerPage;
