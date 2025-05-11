import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
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
  const [suggestedContracts, setSuggestedContracts] = useState([]);
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

      console.log("Bắt đầu lấy dữ liệu ban đầu", {
        authLoading,
        user,
        isGovernment,
        account,
      });

      try {
        if (authLoading) {
          console.log("Đang tải thông tin xác thực, tạm dừng");
          return;
        }

        if (!user || !isGovernment) {
          console.log(
            "Chuyển hướng đến trang đăng nhập do thiếu user hoặc không phải chính phủ",
            {
              user,
              isGovernment,
            }
          );
          navigate("/login?role=Government");
          return;
        }

        if (!account) {
          console.log("Không có tài khoản, hiển thị lỗi");
          setError("Vui lòng kết nối ví MetaMask để tiếp tục!");
          setLoading(false);
          return;
        }

        console.log("Tiếp tục lấy dữ liệu", {
          user,
          isGovernment,
          account,
        });

        // Lấy danh sách nông trại
        try {
          const farmsResponse = await axios.get(
            "http://localhost:3000/government/farms",
            {
              headers: { "x-ethereum-address": account },
            }
          );
          console.log("Danh sách nông trại:", farmsResponse.data);
          setFarms(farmsResponse.data);
          if (farmsResponse.data.length > 0) {
            setSelectedFarmId(farmsResponse.data[0]);
          } else {
            console.log("Không tìm thấy nông trại");
            setError(
              "Không tìm thấy nông trại nào. Vui lòng đăng ký nông trại trước!"
            );
          }
        } catch (farmError) {
          console.error("Lỗi khi lấy danh sách nông trại:", farmError);
          setError(
            farmError.response?.data?.message ||
              "Không thể lấy danh sách nông trại từ backend!"
          );
          setFarms([]);
        }

        // Lấy danh sách tỉnh
        try {
          const provincesResponse = await axios.get(
            "http://localhost:3000/government/provinces",
            {
              headers: { "x-ethereum-address": account },
            }
          );
          console.log("Danh sách tỉnh:", provincesResponse.data);
          setProvinces(provincesResponse.data);
          if (provincesResponse.data.length > 0) {
            setSelectedProvince(provincesResponse.data[0]);
          } else {
            console.log("Không tìm thấy tỉnh");
            setError(
              "Không tìm thấy tỉnh nào. Vui lòng đăng ký nông trại với thông tin tỉnh!"
            );
          }
        } catch (provinceError) {
          console.error("Lỗi khi lấy danh sách tỉnh:", provinceError);
          setError(
            provinceError.response?.data?.message ||
              "Không thể lấy danh sách tỉnh từ backend!"
          );
          setProvinces([]);
        }

        // Lấy danh sách hợp đồng gợi ý
        try {
          const suggestedContractsResponse = await axios.get(
            "http://localhost:3000/government/suggested-contracts",
            {
              headers: { "x-ethereum-address": account },
            }
          );
          console.log(
            "Danh sách hợp đồng gợi ý:",
            suggestedContractsResponse.data
          );
          setSuggestedContracts(suggestedContractsResponse.data);
        } catch (suggestedError) {
          console.error("Lỗi khi lấy hợp đồng gợi ý:", suggestedError);
          setSuggestedContracts([]);
        }
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu ban đầu:", err);
        setError(
          err.response?.data?.message ||
            "Không thể lấy dữ liệu ban đầu từ backend!"
        );
      } finally {
        setLoading(false);
        console.log("Hoàn tất lấy dữ liệu ban đầu", { loading: false, error });
      }
    };

    fetchInitialData();
  }, [authLoading, user, isGovernment, account, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      console.log("Bắt đầu lấy dữ liệu chi tiết", {
        selectedFarmId,
        selectedProvince,
        account,
      });

      try {
        // Đồng bộ hợp đồng
        try {
          const syncResponse = await axios.post(
            "http://localhost:3000/government/sync-contracts",
            {},
            {
              headers: { "x-ethereum-address": account },
            }
          );
          console.log("Kết quả đồng bộ hợp đồng:", syncResponse.data);
        } catch (syncError) {
          console.error("Lỗi khi đồng bộ hợp đồng:", syncError);
          setError(
            syncError.response?.data?.message ||
              "Không thể đồng bộ hợp đồng. Vui lòng thử lại!"
          );
        }

        // Lấy danh sách hợp đồng
        const contractsResponse = await axios.get(
          "http://localhost:3000/government/contracts",
          {
            headers: { "x-ethereum-address": account },
          }
        );
        console.log("Danh sách hợp đồng:", contractsResponse.data);
        setContracts(
          contractsResponse.data.map((contract) => ({
            ...contract,
            creationDate: new Date(contract.creationDate).toLocaleString(
              "vi-VN"
            ),
            expiryDate: new Date(contract.expiryDate).toLocaleString("vi-VN"),
          }))
        );

        // Lấy thống kê nông trại
        if (selectedFarmId) {
          try {
            const farmStatResponse = await axios.get(
              `http://localhost:3000/government/farm-stats/${selectedFarmId}`,
              {
                headers: { "x-ethereum-address": account },
              }
            );
            console.log("Thống kê nông trại:", farmStatResponse.data);
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
            console.error("Lỗi khi lấy thống kê nông trại:", farmStatError);
            setFarmStats([]);
          }
        }

        // Lấy thống kê tỉnh
        if (selectedProvince) {
          try {
            const provinceStatResponse = await axios.get(
              `http://localhost:3000/government/province-stats/${selectedProvince}`,
              {
                headers: { "x-ethereum-address": account },
              }
            );
            console.log("Thống kê tỉnh:", provinceStatResponse.data);
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
                  ? new Date(
                      provinceStatResponse.data.lastUpdate
                    ).toLocaleString("vi-VN")
                  : "Chưa cập nhật",
              },
            ]);
          } catch (provinceError) {
            console.error("Lỗi khi lấy thống kê tỉnh:", provinceError);
            setProvinceStats([]);
          }
        }
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu chi tiết:", err);
        setError(
          err.response?.data?.message || "Không thể lấy dữ liệu từ backend!"
        );
      } finally {
        setLoading(false);
        console.log("Hoàn tất lấy dữ liệu chi tiết", { loading: false, error });
      }
    };

    if (selectedFarmId || selectedProvince) {
      fetchData();
    }
  }, [selectedFarmId, selectedProvince, account]);

  const handleOpenDialog = (suggestedContract = null) => {
    if (suggestedContract) {
      setNewContract({
        farmId: suggestedContract.farmId,
        deliveryHubWalletAddress: suggestedContract.deliveryHubWalletAddress,
        validityPeriod: suggestedContract.validityPeriod || 30,
        totalQuantity: suggestedContract.totalQuantity || 0,
        pricePerUnit: suggestedContract.pricePerUnit || 0,
      });
    } else {
      setNewContract({
        farmId: "",
        deliveryHubWalletAddress: "",
        validityPeriod: 30,
        totalQuantity: 0,
        pricePerUnit: 0,
      });
    }
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

      console.log("Tạo hợp đồng mới:", newContract);
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
      console.log("Kết quả tạo hợp đồng:", response.data);

      const { contractId } = response.data;

      const contractResponse = await axios.get(
        "http://localhost:3000/government/contracts",
        {
          headers: { "x-ethereum-address": account },
        }
      );
      console.log("Danh sách hợp đồng cập nhật:", contractResponse.data);
      setContracts(
        contractResponse.data.map((contract) => ({
          ...contract,
          creationDate: new Date(contract.creationDate).toLocaleString("vi-VN"),
          expiryDate: new Date(contract.expiryDate).toLocaleString("vi-VN"),
        }))
      );

      // Làm mới danh sách hợp đồng gợi ý
      try {
        const suggestedContractsResponse = await axios.get(
          "http://localhost:3000/government/suggested-contracts",
          {
            headers: { "x-ethereum-address": account },
          }
        );
        setSuggestedContracts(suggestedContractsResponse.data);
      } catch (suggestedError) {
        console.error("Lỗi khi làm mới hợp đồng gợi ý:", suggestedError);
        setSuggestedContracts([]);
      }

      handleCloseDialog();
    } catch (err) {
      console.error("Lỗi khi tạo hợp đồng:", err);
      setError(err.response?.data?.message || "Không thể tạo hợp đồng ba bên!");
    }
  };

  const handleDownloadPDF = async (contractId) => {
    try {
      console.log("Tải PDF cho hợp đồng ID:", contractId);
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
      console.log("Tải PDF thành công");
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
            Trang Quản Lý Cơ Quan Nhà Nước
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
                  onClick={() => handleOpenDialog()}
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
                Danh Sách Hợp Đồng Gợi Ý
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID Nông Trại</TableCell>
                      <TableCell>Địa Chỉ Đại Lý</TableCell>
                      <TableCell>Tổng Số Lượng (hộp)</TableCell>
                      <TableCell>Giá Mỗi Đơn Vị (ETH)</TableCell>
                      <TableCell>Hành Động</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {suggestedContracts.length > 0 ? (
                      suggestedContracts.map((contract) => (
                        <TableRow key={contract.suggestionId}>
                          <TableCell>{contract.farmId}</TableCell>
                          <TableCell>
                            {contract.deliveryHubWalletAddress}
                          </TableCell>
                          <TableCell>{contract.totalQuantity}</TableCell>
                          <TableCell>{contract.pricePerUnit}</TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              color="primary"
                              onClick={() => handleOpenDialog(contract)}
                            >
                              Xem & Tạo
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          Không có hợp đồng gợi ý nào. Vui lòng kiểm tra danh
                          sách sản phẩm hoặc thêm sản phẩm mới!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h5" sx={{ mb: 2 }}>
                Danh Sách Hợp Đồng Ba Bên
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID Hợp Đồng</TableCell>
                      <TableCell>ID Nông Trại</TableCell>
                      <TableCell>Địa Chỉ Đại Lý</TableCell>
                      <TableCell>Ngày Tạo</TableCell>
                      <TableCell>Ngày Hết Hạn</TableCell>
                      <TableCell>Tổng Số Lượng (hộp)</TableCell>
                      <TableCell>Giá Mỗi Đơn Vị (ETH)</TableCell>
                      <TableCell>Điều Khoản</TableCell>
                      <TableCell>Trạng Thái</TableCell>
                      <TableCell>Đã Hoàn Thành</TableCell>
                      <TableCell>Hành Động</TableCell>
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
                          Không có hợp đồng nào. Vui lòng tạo hợp đồng mới!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h5" sx={{ mb: 2 }}>
                Thống Kê Nông Trại
              </Typography>
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Chọn Nông Trại</InputLabel>
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
                      <MenuItem disabled>Không có nông trại nào</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Box>
              <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID Nông Trại</TableCell>
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
                          {selectedFarmId
                            ? `Không có dữ liệu thống kê cho nông trại ${selectedFarmId}. Vui lòng tạo hợp đồng để có dữ liệu!`
                            : "Vui lòng chọn một nông trại để xem thống kê."}
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
                      <TableCell>Số Lượng Nông Trại</TableCell>
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
                          {selectedProvince
                            ? `Không có dữ liệu thống kê cho tỉnh ${selectedProvince}. Vui lòng tạo hợp đồng để có dữ liệu!`
                            : "Vui lòng chọn một tỉnh để xem thống kê."}
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
                label="ID Nông Trại"
                name="farmId"
                value={newContract.farmId}
                onChange={handleInputChange}
                sx={{ mb: 2, mt: 1 }}
                required
              />
              <TextField
                fullWidth
                label="Địa Chỉ Ví Đại Lý (MetaMask)"
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
