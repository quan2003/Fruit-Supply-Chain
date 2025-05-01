import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";
import Layout from "../components/common/Layout";
import Footer from "../components/common/Footer";

const SignContractPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSignDialog, setOpenSignDialog] = useState(false);
  const [currentContractId, setCurrentContractId] = useState(null);
  const [signature, setSignature] = useState(null);
  const signatureRef = useRef();

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      setError(null);

      try {
        if (authLoading) {
          console.log("Đang tải dữ liệu xác thực...");
          return;
        }

        console.log("Dữ liệu người dùng:", user);

        if (!user) {
          console.log("Không có người dùng, chuyển hướng đến trang đăng nhập");
          navigate("/login");
          return;
        }

        if (!user.walletAddress) {
          console.log("Không tìm thấy walletAddress trong dữ liệu người dùng");
          setError("Địa chỉ ví MetaMask không khả dụng. Vui lòng kết nối ví!");
          setLoading(false);
          return;
        }

        console.log(
          "Lấy danh sách hợp đồng với địa chỉ ví:",
          user.walletAddress
        );
        console.log("Vai trò người dùng:", user.role);
        const response = await axios.get(`http://localhost:3000/contracts`, {
          headers: { "x-ethereum-address": user.walletAddress },
        });

        console.log("Dữ liệu hợp đồng trả về:", response.data);

        if (!Array.isArray(response.data)) {
          console.log("Dữ liệu trả về không đúng định dạng:", response.data);
          setError("Dữ liệu trả về không đúng định dạng!");
          setLoading(false);
          return;
        }

        if (response.data.length === 0) {
          console.log("Không có hợp đồng nào để hiển thị");
          setError(
            user.role === "Government" || user.role === "Admin"
              ? "Không có hợp đồng nào để hiển thị. Vui lòng tạo hợp đồng trước!"
              : "Không có hợp đồng nào để hiển thị. Vui lòng liên hệ Cơ quan quản lý để tạo hợp đồng!"
          );
        }

        const mappedContracts = response.data.map((contract) => {
          console.log("Hợp đồng:", contract);
          return {
            contractId: contract.contract_id,
            farmId: contract.farm_id,
            agentAddress: contract.agent_address,
            creationDate: new Date(contract.creation_date).toLocaleString(
              "vi-VN"
            ),
            expiryDate: new Date(contract.expiry_date).toLocaleString("vi-VN"),
            totalQuantity: contract.total_quantity,
            pricePerUnit: contract.price_per_unit,
            terms: contract.terms,
            isActive: contract.is_active,
            isCompleted: contract.is_completed,
            isFarmSigned: contract.is_farm_signed,
            isAgentSigned: contract.is_agent_signed,
            isGovernmentSigned: contract.is_government_signed,
          };
        });

        console.log("Hợp đồng sau khi ánh xạ:", mappedContracts);
        setContracts(mappedContracts);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách hợp đồng:", err);
        setError(
          err.response?.data?.details ||
            err.response?.data?.error ||
            "Không thể lấy danh sách hợp đồng! Vui lòng thử lại."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [authLoading, user, navigate]);

  const handleOpenSignDialog = (contractId) => {
    setCurrentContractId(contractId);
    setSignature(null);
    setOpenSignDialog(true);
  };

  const handleCloseSignDialog = () => {
    setOpenSignDialog(false);
    setCurrentContractId(null);
    setSignature(null);
    signatureRef.current.clear();
  };

  const handleSignContract = async () => {
    try {
      setError(null);

      const signatureData = signatureRef.current.isEmpty()
        ? null
        : signatureRef.current.toDataURL("image/png");

      if (!signatureData) {
        setError("Vui lòng cung cấp chữ ký!");
        return;
      }

      await axios.post(
        `http://localhost:3000/contract/sign/${currentContractId}`,
        {
          role: user.role,
          signature: signatureData,
        },
        {
          headers: { "x-ethereum-address": user.walletAddress },
        }
      );

      const response = await axios.get(`http://localhost:3000/contracts`, {
        headers: { "x-ethereum-address": user.walletAddress },
      });

      const updatedContracts = response.data.map((contract) => ({
        contractId: contract.contract_id,
        farmId: contract.farm_id,
        agentAddress: contract.agent_address,
        creationDate: new Date(contract.creation_date).toLocaleString("vi-VN"),
        expiryDate: new Date(contract.expiry_date).toLocaleString("vi-VN"),
        totalQuantity: contract.total_quantity,
        pricePerUnit: contract.price_per_unit,
        terms: contract.terms,
        isActive: contract.is_active,
        isCompleted: contract.is_completed,
        isFarmSigned: contract.is_farm_signed,
        isAgentSigned: contract.is_agent_signed,
        isGovernmentSigned: contract.is_government_signed,
      }));

      setContracts(updatedContracts);
      handleCloseSignDialog();
    } catch (err) {
      console.error("Lỗi khi ký hợp đồng:", err);
      setError(err.response?.data?.message || "Không thể ký hợp đồng!");
    }
  };

  const handleDownloadSignedPDF = async (contractId) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/contract/signed/pdf/${contractId}`,
        {
          headers: { "x-ethereum-address": user.walletAddress },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Hợp đồng ba bên ${contractId} - Đã ký.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Lỗi khi tải PDF đã ký:", err);
      setError("Không thể tải PDF đã ký!");
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
            Ký Hợp Đồng Ba Bên
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
              <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID Hợp Đồng</TableCell>
                      <TableCell>Farm ID</TableCell>
                      <TableCell>Agent Address</TableCell>
                      <TableCell>Ngày Tạo</TableCell>
                      <TableCell>Ngày Hết Hạn</TableCell>
                      <TableCell>Tổng Số Lượng (hộp)</TableCell>
                      <TableCell>Giá Mỗi Đơn Vị (ETH)</TableCell>
                      <TableCell>Trạng Thái</TableCell>
                      <TableCell>Đã Hoàn Thành</TableCell>
                      <TableCell>Chữ Ký Bên Farm</TableCell>
                      <TableCell>Chữ Ký Bên Agent</TableCell>
                      <TableCell>Chữ Ký Chính Phủ</TableCell>
                      <TableCell>Hành động</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contracts.length > 0 ? (
                      contracts.map((contract) => (
                        <TableRow key={contract.contractId}>
                          <TableCell>{contract.contractId}</TableCell>
                          <TableCell>{contract.farmId}</TableCell>
                          <TableCell>{contract.agentAddress}</TableCell>
                          <TableCell>{contract.creationDate}</TableCell>
                          <TableCell>{contract.expiryDate}</TableCell>
                          <TableCell>{contract.totalQuantity}</TableCell>
                          <TableCell>{contract.pricePerUnit}</TableCell>
                          <TableCell>
                            {contract.isActive
                              ? "Hoạt động"
                              : "Không hoạt động"}
                          </TableCell>
                          <TableCell>
                            {contract.isCompleted ? "Có" : "Không"}
                          </TableCell>
                          <TableCell>
                            {contract.isFarmSigned ? "Đã ký" : "Chưa ký"}
                          </TableCell>
                          <TableCell>
                            {contract.isAgentSigned ? "Đã ký" : "Chưa ký"}
                          </TableCell>
                          <TableCell>
                            {contract.isGovernmentSigned ? "Đã ký" : "Chưa ký"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              color="primary"
                              onClick={() =>
                                handleOpenSignDialog(contract.contractId)
                              }
                              disabled={
                                (user.role === "Farm" &&
                                  contract.isFarmSigned) ||
                                (user.role === "Producer" &&
                                  contract.isFarmSigned) ||
                                (user.role === "Agent" &&
                                  contract.isAgentSigned) ||
                                (user.role === "Government" &&
                                  contract.isGovernmentSigned)
                              }
                              sx={{ mr: 1 }}
                            >
                              Ký Hợp Đồng
                            </Button>
                            {contract.isFarmSigned &&
                              contract.isAgentSigned &&
                              contract.isGovernmentSigned && (
                                <Button
                                  variant="outlined"
                                  color="secondary"
                                  onClick={() =>
                                    handleDownloadSignedPDF(contract.contractId)
                                  }
                                >
                                  Tải PDF Đã Ký
                                </Button>
                              )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={13} align="center">
                          Không có hợp đồng nào.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          <Dialog
            open={openSignDialog}
            onClose={handleCloseSignDialog}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Ký Hợp Đồng Ba Bên</DialogTitle>
            <DialogContent>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              <Typography variant="h6">
                Chữ Ký Của Bạn ({user?.role || "Không xác định"})
              </Typography>
              <SignatureCanvas
                ref={signatureRef}
                penColor="black"
                canvasProps={{
                  width: 500,
                  height: 200,
                  className: "sigCanvas",
                  style: { border: "1px solid #000" },
                }}
              />
              <Button
                onClick={() => signatureRef.current.clear()}
                sx={{ mt: 1, mb: 2 }}
              >
                Xóa Chữ Ký
              </Button>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseSignDialog} color="secondary">
                Hủy
              </Button>
              <Button onClick={handleSignContract} color="primary">
                Ký Hợp Đồng
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
      <Footer />
    </Layout>
  );
};

export default SignContractPage;
