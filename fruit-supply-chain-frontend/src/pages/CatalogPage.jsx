// fruit-supply-chain-frontend/src/pages/CatalogPage.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Search as SearchIcon, Add as AddIcon } from "@mui/icons-material";
import Layout from "../components/common/Layout";
import CatalogList from "../components/FruitCatalog/CatalogList";
import CatalogDetail from "../components/FruitCatalog/CatalogDetail";
import AddCatalogForm from "../components/FruitCatalog/AddCatalogForm";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useWeb3 } from "../contexts/Web3Context";
import { useAuth } from "../contexts/AuthContext";
import { getAllFruitCatalogsService } from "../services/fruitService"; // Sửa từ getAllFruitCatalogs thành getAllFruitCatalogsService

const CatalogPage = () => {
  const { account } = useWeb3();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [catalogs, setCatalogs] = useState([]);
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const canAddCatalog = user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    const loadCatalogs = async () => {
      if (!account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getAllFruitCatalogsService();
        setCatalogs(data);
      } catch (error) {
        console.error("Error loading fruit catalogs:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCatalogs();
  }, [account]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSelectedCatalog(null);
    setShowAddForm(false);
  };

  const handleSelectCatalog = (catalog) => {
    setSelectedCatalog(catalog);
    setTabValue(1);
  };

  const handleAddCatalogClick = () => {
    setShowAddForm(true);
    setTabValue(2);
  };

  const handleCatalogAdded = (newCatalog) => {
    setCatalogs((prev) => [...prev, newCatalog]);
    setShowAddForm(false);
    setTabValue(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredCatalogs =
    catalogs?.filter(
      (catalog) =>
        catalog.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        catalog.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        catalog.description.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

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
            Danh mục trái cây
          </Typography>

          {canAddCatalog && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddCatalogClick}
            >
              Thêm loại trái cây
            </Button>
          )}
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Tìm kiếm theo tên, xuất xứ hoặc mô tả..."
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

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Danh sách" />
            <Tab label="Chi tiết" disabled={!selectedCatalog} />
            <Tab label="Thêm mới" disabled={!canAddCatalog || !showAddForm} />
          </Tabs>
        </Box>

        {!account ? (
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Typography variant="h6">
              Vui lòng kết nối ví để xem danh mục trái cây
            </Typography>
          </Box>
        ) : (
          <>
            {tabValue === 0 && (
              <CatalogList
                catalogs={filteredCatalogs}
                onSelectCatalog={handleSelectCatalog}
              />
            )}
            {tabValue === 1 && selectedCatalog && (
              <CatalogDetail catalog={selectedCatalog} />
            )}
            {tabValue === 2 && showAddForm && (
              <AddCatalogForm onSuccess={handleCatalogAdded} />
            )}
          </>
        )}
      </Container>
    </Layout>
  );
};

export default CatalogPage;
