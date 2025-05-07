import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import Layout from "../components/common/Layout";
import Footer from "../components/common/Footer";

const GovernmentPage = () => {
  const navigate = useNavigate();
  const { user, isGovernment, loading: authLoading, account } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [farmStats, setFarmStats] = useState([]);
  const [provinceStats, setProvinceStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [farms, setFarms] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");

  const [newContract, setNewContract] = useState({
    farmId: "",
    deliveryHubWalletAddress: "",
    validityPeriod: 30,
    totalQuantity: 0,
    pricePerUnit: 0,
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);

      console.log("fetchInitialData started", {
        authLoading,
        user,
        isGovernment,
        account,
      });

      try {
        if (authLoading) {
          console.log("authLoading is true, returning early");
          return;
        }

        if (!user || !isGovernment) {
          console.log("Redirecting to login due to !user || !isGovernment", {
            user,
            isGovernment,
          });
          navigate("/login?role=Government");
          return;
        }

        if (!account) {
          console.log("No account, setting error");
          setError("Vui lòng kết nối ví MetaMask để tiếp tục!");
          setLoading(false);
          return;
        }

        console.log("Proceeding with data fetching", {
          user,
          isGovernment,
          account,
        });

        try {
          const farmsResponse = await axios.get(
            "http://localhost:3000/government/farms",
            {
              headers: { "x-ethereum-address": account },
            }
          );
          console.log("Farms response:", farmsResponse.data);
          setFarms(farmsResponse.data);
          if (farmsResponse.data.length > 0) {
            setSelectedFarmId(farmsResponse.data[0]);
          } else {
            console.log("No farms found");
          }
        } catch (farmError) {
          console.error("Lỗi khi lấy danh sách farm:", farmError);
          setError(
            farmError.response?.data?.message ||
              "Không thể lấy danh sách farm từ backend!"
          );
          setFarms([]);
        }

        try {
          const provincesResponse = await axios.get(
            "http://localhost:3000/government/provinces",
            {
              headers: { "x-ethereum-address": account },
            }
          );
          console.log("Provinces response:", provincesResponse.data);
          setProvinces(provincesResponse.data);
          if (provincesResponse.data.length > 0) {
            setSelectedProvince(provincesResponse.data[0]);
          } else {
            console.log("No provinces found");
          }
        } catch (provinceError) {
          console.error("Lỗi khi lấy danh sách tỉnh:", provinceError);
          setError(
            provinceError.response?.data?.message ||
              "Không thể lấy danh sách tỉnh từ backend!"
          );
          setProvinces([]);
        }
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu ban đầu:", err);
        setError(
          err.response?.data?.message ||
            "Không thể lấy dữ liệu ban đầu từ backend!"
        );
      } finally {
        setLoading(false);
        console.log("fetchInitialData completed", { loading: false, error });
      }
    };

    fetchInitialData();
  }, [authLoading, user, isGovernment, account, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedFarmId || !selectedProvince) {
        console.log(
          "Skipping fetchData due to missing selectedFarmId or selectedProvince",
          {
            selectedFarmId,
            selectedProvince,
          }
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      console.log("fetchData started", {
        selectedFarmId,
        selectedProvince,
        account,
      });

      try {
        try {
          const syncResponse = await axios.post(
            "http://localhost:3000/government/sync-contracts",
            {},
            {
              headers: { "x-ethereum-address": account },
            }
          );
          console.log("Sync contracts response:", syncResponse.data);
        } catch (syncError) {
          console.error("Lỗi khi đồng bộ hợp đồng:", syncError);
          setError(
            syncError.response?.data?.message ||
              "Không thể đồng bộ hợp đồng. Vui lòng thử lại!"
          );
          setLoading(false);
          return;
        }

        const contractsResponse = await axios.get(
          "http://localhost:3000/government/contracts",
          {
            headers: { "x-ethereum-address": account },
          }
        );
        console.log("Contracts response:", contractsResponse.data);
        setContracts(
          contractsResponse.data.map((contract) => ({
            ...contract,
            creationDate: new Date(contract.creationDate).toLocaleString(
              "vi-VN"
            ),
            expiryDate: new Date(contract.expiryDate).toLocaleString("vi-VN"),
          }))
        );

        try {
          const farmStatResponse = await axios.get(
            `http://localhost:3000/government/farm-stats/${selectedFarmId}`,
            {
              headers: { "x-ethereum-address": account },
            }
          );
          console.log("Farm stats response:", farmStatResponse.data);
          setFarmStats([
            {
              farmId: farmStatResponse.data.farmId,
              totalFruitHarvested: farmStatResponse.data.totalFruitHarvested,
              totalContractsCreated:
                farmStatResponse.data.totalContractsCreated,
              totalContractsCompleted:
                farmStatResponse.data.totalContractsCompleted,
              lastUpdate: farmStatResponse.data.lastUpdate
                ? new Date(farmStatResponse.data.lastUpdate).toLocaleString(
                    "vi-VN"
                  )
                : "Chưa cập nhật",
            },
          ]);
        } catch (farmStatError) {
          console.error("Lỗi khi lấy thống kê farm:", farmStatError);
          setFarmStats([]);
          setError(
            farmStatError.response?.data?.message ||
              "Không thể lấy thống kê farm!"
          );
        }

        try {
          const provinceStatResponse = await axios.get(
            `http://localhost:3000/government/province-stats/${selectedProvince}`,
            {
              headers: { "x-ethereum-address": account },
            }
          );
          console.log("Province stats response:", provinceStatResponse.data);
          setProvinceStats([
            {
              province: provinceStatResponse.data.province,
              totalFruitHarvested:
                provinceStatResponse.data.totalFruitHarvested,
              totalContractsCreated:
                provinceStatResponse.data.totalContractsCreated,
              totalContractsCompleted:
                provinceStatResponse.data.totalContractsCompleted,
              farmCount: provinceStatResponse.data.farmCount,
              lastUpdate: provinceStatResponse.data.lastUpdate
                ? new Date(provinceStatResponse.data.lastUpdate).toLocaleString(
                    "vi-VN"
                  )
                : "Chưa cập nhật",
            },
          ]);
        } catch (provinceError) {
          console.error("Lỗi khi lấy thống kê tỉnh:", provinceError);
          setProvinceStats([]);
          setError(
            provinceError.response?.data?.message ||
              "Không thể lấy thống kê tỉnh!"
          );
        }
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu:", err);
        setError(
          err.response?.data?.message || "Không thể lấy dữ liệu từ backend!"
        );
      } finally {
        setLoading(false);
        console.log("fetchData completed", { loading: false, error });
      }
    };

    fetchData();
  }, [selectedFarmId, selectedProvince, account]);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewContract({
      farmId: "",
      deliveryHubWalletAddress: "",
      validityPeriod: 30,
      totalQuantity: 0,
      pricePerUnit: 0,
    });
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewContract((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateContract = async () => {
    try {
      setError(null);
      if (
        !newContract.farmId ||
        !newContract.deliveryHubWalletAddress ||
        !newContract.validityPeriod ||
        !newContract.totalQuantity ||
        !newContract.pricePerUnit
      ) {
        setError("Vui lòng điền đầy đủ thông tin!");
        return;
      }

      console.log("Creating new contract:", newContract);
      const response = await axios.post(
        "http://localhost:3000/government/create-contract",
        {
          farmId: newContract.farmId,
          deliveryHubWalletAddress: newContract.deliveryHubWalletAddress,
          validityPeriod: newContract.validityPeriod,
          totalQuantity: newContract.totalQuantity,
          pricePerUnit: newContract.pricePerUnit,
        },
        {
          headers: { "x-ethereum-address": account },
        }
      );
      console.log("Create contract response:", response.data);

      const { contractId } = response.data;

      const contractResponse = await axios.get(
        "http://localhost:3000/government/contracts",
        {
          headers: { "x-ethereum-address": account },
        }
      );
      console.log("Updated contracts response:", contractResponse.data);
      setContracts(
        contractResponse.data.map((contract) => ({
          ...contract,
          creationDate: new Date(contract.creationDate).toLocaleString("vi-VN"),
          expiryDate: new Date(contract.expiryDate).toLocaleString("vi-VN"),
        }))
      );

      handleCloseDialog();
    } catch (err) {
      console.error("Lỗi khi tạo hợp đồng:", err);
      setError(err.response?.data?.message || "Không thể tạo hợp đồng ba bên!");
    }
  };

  const handleDownloadPDF = async (contractId) => {
    try {
      console.log("Downloading PDF for contractId:", contractId);
      const response = await axios.get(
        `http://localhost:3000/government/contract/pdf/${contractId}`,
        {
          headers: { "x-ethereum-address": account },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Hợp đồng ba bên ${contractId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      console.log("PDF downloaded successfully");
    } catch (err) {
      console.error("Lỗi khi tải PDF:", err);
      setError(err.response?.data?.message || "Không thể tải PDF hợp đồng!");
    }
  };

  return (
    <Layout>
      <Box sx={{ minHeight: "calc(100vh - 140px)", py: 4 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", mb: 4, textAlign: "center" }}
          >
            Trang Cơ Quan Quản Lý
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          ) : (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  mb: 4,
                  gap: 2,
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleOpenDialog}
                >
                  Tạo Hợp Đồng Ba Bên
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate("/sign-contract")}
                >
                  Ký Hợp Đồng
                </Button>
              </Box>

              <Typography variant="h5" sx={{ mb: 2 }}>
                Danh Sách Hợp Đồng Ba Bên
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID Hợp Đồng</TableCell>
                      <TableCell>Farm ID</TableCell>
                      <TableCell>DeliveryHub Address</TableCell>
                      <TableCell>Ngày Tạo</TableCell>
                      <TableCell>Ngày Hết Hạn</TableCell>
                      <TableCell>Tổng Số Lượng (hộp)</TableCell>
                      <TableCell>Giá Mỗi Đơn Vị (ETH)</TableCell>
                      <TableCell>Điều Khoản</TableCell>
                      <TableCell>Trạng Thái</TableCell>
                      <TableCell>Đã Hoàn Thành</TableCell>
                      <TableCell>Hành động</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contracts.length > 0 ? (
                      contracts.map((contract) => (
                        <TableRow key={contract.contractId}>
                          <TableCell>{contract.contractId}</TableCell>
                          <TableCell>{contract.farmId}</TableCell>
                          <TableCell>
                            {contract.deliveryHubWalletAddress}
                          </TableCell>
                          <TableCell>{contract.creationDate}</TableCell>
                          <TableCell>{contract.expiryDate}</TableCell>
                          <TableCell>{contract.totalQuantity}</TableCell>
                          <TableCell>{contract.pricePerUnit}</TableCell>
                          <TableCell>{contract.terms}</TableCell>
                          <TableCell>
                            {contract.isActive
                              ? "Hoạt động"
                              : "Không hoạt động"}
                          </TableCell>
                          <TableCell>
                            {contract.isCompleted ? "Có" : "Không"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              color="primary"
                              onClick={() =>
                                handleDownloadPDF(contract.contractId)
                              }
                            >
                              Tải PDF
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={11} align="center">
                          Không có hợp đồng nào.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h5" sx={{ mb: 2 }}>
                Thống Kê Farm
              </Typography>
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Chọn Farm</InputLabel>
                  <Select
                    value={selectedFarmId}
                    onChange={(e) => setSelectedFarmId(e.target.value)}
                  >
                    {farms.length > 0 ? (
                      farms.map((farmId) => (
                        <MenuItem key={farmId} value={farmId}>
                          {farmId}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>Không có farm nào</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Box>
              <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Farm ID</TableCell>
                      <TableCell>Tổng Sản Lượng (hộp)</TableCell>
                      <TableCell>Hợp Đồng Đã Tạo</TableCell>
                      <TableCell>Hợp Đồng Đã Hoàn Thành</TableCell>
                      <TableCell>Cập Nhật Lần Cuối</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {farmStats.length > 0 ? (
                      farmStats.map((stat) => (
                        <TableRow key={stat.farmId}>
                          <TableCell>{stat.farmId}</TableCell>
                          <TableCell>{stat.totalFruitHarvested}</TableCell>
                          <TableCell>{stat.totalContractsCreated}</TableCell>
                          <TableCell>{stat.totalContractsCompleted}</TableCell>
                          <TableCell>{stat.lastUpdate}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          Không có dữ liệu thống kê farm.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h5" sx={{ mb: 2 }}>
                Thống Kê Tỉnh
              </Typography>
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Chọn Tỉnh</InputLabel>
                  <Select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                  >
                    {provinces.length > 0 ? (
                      provinces.map((province) => (
                        <MenuItem key={province} value={province}>
                          {province}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>Không có tỉnh nào</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tỉnh</TableCell>
                      <TableCell>Tổng Sản Lượng (hộp)</TableCell>
                      <TableCell>Hợp Đồng Đã Tạo</TableCell>
                      <TableCell>Hợp Đồng Đã Hoàn Thành</TableCell>
                      <TableCell>Số Lượng Farm</TableCell>
                      <TableCell>Cập Nhật Lần Cuối</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {provinceStats.length > 0 ? (
                      provinceStats.map((stat) => (
                        <TableRow key={stat.province}>
                          <TableCell>{stat.province}</TableCell>
                          <TableCell>{stat.totalFruitHarvested}</TableCell>
                          <TableCell>{stat.totalContractsCreated}</TableCell>
                          <TableCell>{stat.totalContractsCompleted}</TableCell>
                          <TableCell>{stat.farmCount}</TableCell>
                          <TableCell>{stat.lastUpdate}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          Không có dữ liệu thống kê tỉnh. Vui lòng kiểm tra lại
                          dữ liệu trên blockchain hoặc tạo thêm hợp đồng cho
                          tỉnh đã chọn.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          <Dialog open={openDialog} onClose={handleCloseDialog}>
            <DialogTitle>Tạo Hợp Đồng Ba Bên</DialogTitle>
            <DialogContent>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              <TextField
                fullWidth
                label="Farm ID"
                name="farmId"
                value={newContract.farmId}
                onChange={handleInputChange}
                sx={{ mb: 2, mt: 1 }}
                required
              />
              <TextField
                fullWidth
                label="Địa Chỉ DeliveryHub (Ví MetaMask)"
                name="deliveryHubWalletAddress"
                value={newContract.deliveryHubWalletAddress}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                label="Thời Hạn Hợp Đồng (ngày)"
                name="validityPeriod"
                type="number"
                value={newContract.validityPeriod}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                label="Tổng Số Lượng (hộp)"
                name="totalQuantity"
                type="number"
                value={newContract.totalQuantity}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                label="Giá Mỗi Đơn Vị (ETH)"
                name="pricePerUnit"
                type="number"
                value={newContract.pricePerUnit}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
                required
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} color="secondary">
                Hủy
              </Button>
              <Button onClick={handleCreateContract} color="primary">
                Tạo Hợp Đồng
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
      <Footer />
    </Layout>
  );
};

export default GovernmentPage;
