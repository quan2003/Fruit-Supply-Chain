// fruit-supply-chain-frontend/src/pages/TrackerPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Search as SearchIcon,
  Agriculture as AgricultureIcon,
} from "@mui/icons-material";
import Layout from "../components/common/Layout";
import SupplyChainTracker from "../components/SupplyChain/SupplyChainTracker";
import FruitDetail from "../components/SupplyChain/FruitDetail";
import SupplyChainTimeline from "../components/SupplyChain/SupplyChainTimeline";
import HarvestForm from "../components/SupplyChain/HarvestForm";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useWeb3 } from "../contexts/Web3Context"; // Sửa từ useWeb3Context thành useWeb3
import { useAuth } from "../contexts/AuthContext"; // Sửa từ useAuthContext thành useAuth

const TrackerPage = () => {
  const { fruitId } = useParams(); // Sửa từ batchId thành fruitId để phù hợp với contract
  const navigate = useNavigate();
  const { account, getFruit, harvestFruit } = useWeb3();
  const { isFarmer } = useAuth();

  const [tabValue, setTabValue] = useState(0);
  const [fruits, setFruits] = useState([]);
  const [selectedFruit, setSelectedFruit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHarvestForm, setShowHarvestForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCode, setSearchCode] = useState("");

  const canHarvest = isFarmer; // Dựa vào isFarmer từ AuthContext

  useEffect(() => {
    const loadFruits = async () => {
      try {
        setLoading(true);
        // Giả lập danh sách trái cây, bạn có thể thay bằng API thật
        const fruitData = [
          {
            id: "1",
            fruitType: "Xoài",
            origin: "Tiền Giang",
            producer: account,
          },
          {
            id: "2",
            fruitType: "Thanh Long",
            origin: "Bình Thuận",
            producer: account,
          },
        ];
        setFruits(fruitData);

        // Nếu fruitId được cung cấp trong URL, load thông tin trái cây đó
        if (fruitId) {
          const fruit = await getFruit(fruitId);
          setSelectedFruit(fruit);
          setTabValue(1); // Chuyển sang tab chi tiết
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading fruits:", error);
        setLoading(false);
      }
    };

    if (account) {
      loadFruits();
    } else {
      setLoading(false);
    }
  }, [account, fruitId, getFruit]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 0) {
      setSelectedFruit(null);
      setShowHarvestForm(false);
      navigate("/tracker");
    }
  };

  const handleSelectFruit = async (fruit) => {
    try {
      setLoading(true);
      const fruitData = await getFruit(fruit.id);
      setSelectedFruit(fruitData);
      setTabValue(1); // Chuyển sang tab chi tiết
      navigate(`/tracker/${fruit.id}`);
    } catch (error) {
      console.error("Error loading fruit details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleHarvestClick = () => {
    setShowHarvestForm(true);
    setTabValue(2); // Chuyển sang tab thu hoạch
  };

  const handleHarvestRegistered = async (fruitData) => {
    try {
      const result = await harvestFruit(fruitData.fruitType, fruitData.origin);
      const newFruitId = result.events.StepRecorded.returnValues.fruitId;
      const newFruit = {
        id: newFruitId,
        fruitType: fruitData.fruitType,
        origin: fruitData.origin,
        producer: account,
      };
      setFruits([...fruits, newFruit]);
      setSelectedFruit(newFruit);
      setShowHarvestForm(false);
      setTabValue(1); // Chuyển sang tab chi tiết
      navigate(`/tracker/${newFruitId}`);
    } catch (error) {
      console.error("Error registering harvest:", error);
    }
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
      const fruit = await getFruit(searchCode);
      if (fruit) {
        setSelectedFruit(fruit);
        setTabValue(1);
        navigate(`/tracker/${searchCode}`);
      } else {
        alert("Không tìm thấy trái cây với ID này!");
      }
    } catch (error) {
      console.error("Error finding fruit by ID:", error);
      alert("Có lỗi xảy ra khi tìm kiếm ID trái cây!");
    } finally {
      setLoading(false);
    }
  };

  const filteredFruits = fruits.filter(
    (fruit) =>
      fruit.fruitType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fruit.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fruit.producer.toLowerCase().includes(searchTerm.toLowerCase())
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
            Tìm kiếm nhanh theo ID trái cây
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Nhập ID trái cây..."
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
            <Tab label="Danh sách trái cây" />
            <Tab label="Chi tiết & Chuỗi cung ứng" disabled={!selectedFruit} />
            <Tab
              label="Đăng ký thu hoạch"
              disabled={!canHarvest || !showHarvestForm}
            />
          </Tabs>
        </Box>

        {!account ? (
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
                    placeholder="Tìm kiếm theo loại trái cây, xuất xứ hoặc nhà sản xuất..."
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
                  batches={filteredFruits}
                  onSelectBatch={handleSelectFruit}
                />
              </>
            )}

            {tabValue === 1 && selectedFruit && (
              <Box>
                <FruitDetail batch={selectedFruit} />
                <SupplyChainTimeline data={selectedFruit.history} />
              </Box>
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
