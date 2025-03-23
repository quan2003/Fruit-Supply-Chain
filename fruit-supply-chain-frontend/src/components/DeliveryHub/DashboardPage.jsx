import React from "react";
import {
  Typography,
  Box,
  Paper,
  Button,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Alert,
} from "@mui/material";
import {
  LocalShipping as LocalShippingIcon,
  Inventory as InventoryIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Store as StoreIcon,
} from "@mui/icons-material";
import { useOutletContext } from "react-router-dom";
import IncomingShipmentsList from "./IncomingShipmentsList";
import InventoryList from "./InventoryList";
import OutgoingShipmentsList from "./OutgoingShipmentsList";
import ShipmentForm from "./ShipmentForm";

const DashboardPage = () => {
  const {
    tabValue,
    handleTabChange,
    searchTerm,
    handleSearchChange,
    handleRefresh,
    alertMessage,
    setAlertMessage,
    showShipmentForm,
    setShowShipmentForm,
    selectedShipment,
    setSelectedShipment,
    incomingShipments,
    inventory,
    outgoingShipments,
    handleReceiveShipment,
    handlePrepareShipment,
    handleShipmentCreated,
    getProducerInfo,
    filterData,
  } = useOutletContext();

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          <StoreIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          Quản lý trung tâm phân phối
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          Làm mới dữ liệu
        </Button>
      </Box>

      {alertMessage &&
        typeof alertMessage === "object" &&
        alertMessage.message && (
          <Alert
            severity={alertMessage.type || "info"}
            sx={{ mb: 3 }}
            onClose={() => setAlertMessage({ type: "", message: "" })}
          >
            {alertMessage.message}
          </Alert>
        )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Thông tin người bán
        </Typography>
        <Typography variant="body1">
          <strong>Tên người bán:</strong>{" "}
          {getProducerInfo ? getProducerInfo().name : "Lưu Quân"}
        </Typography>
        <Typography variant="body1">
          <strong>Địa chỉ ví:</strong>{" "}
          {getProducerInfo
            ? getProducerInfo().walletAddress
            : "0x751f328447976e78956cf46d339ef0d255d149ea"}
        </Typography>
        <Typography variant="body1">
          <strong>Vị trí:</strong>{" "}
          {getProducerInfo ? getProducerInfo().location : "Tỉnh Lào Cai"}
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Tìm kiếm theo tên sản phẩm, mã lô, nguồn gốc hoặc khách hàng..."
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
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab
            icon={<LocalShippingIcon />}
            label="Lô hàng đến"
            iconPosition="start"
          />
          <Tab
            icon={<InventoryIcon />}
            label="Hàng tồn kho"
            iconPosition="start"
          />
          <Tab
            icon={<LocalShippingIcon sx={{ transform: "scaleX(-1)" }} />}
            label="Lô hàng đi"
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Danh sách lô hàng đến
          </Typography>
          <IncomingShipmentsList
            shipments={filterData(incomingShipments)}
            onReceiveShipment={handleReceiveShipment}
          />
        </Paper>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Danh sách hàng tồn kho
          </Typography>
          <InventoryList
            inventory={filterData(inventory)}
            onPrepareShipment={handlePrepareShipment}
          />
        </Paper>
      )}

      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          {showShipmentForm ? (
            <>
              <Typography variant="h5" gutterBottom>
                Tạo lô hàng gửi đi
              </Typography>
              <ShipmentForm
                fruitItem={selectedShipment}
                onSubmit={handleShipmentCreated}
                onCancel={() => {
                  setShowShipmentForm(false);
                  setSelectedShipment(null);
                }}
              />
            </>
          ) : (
            <>
              <Typography variant="h5" gutterBottom>
                Danh sách lô hàng đi
              </Typography>
              <OutgoingShipmentsList
                shipments={filterData(outgoingShipments)}
              />
            </>
          )}
        </Paper>
      )}
    </>
  );
};

export default DashboardPage;
