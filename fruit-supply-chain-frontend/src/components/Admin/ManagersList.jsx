import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { addManager } from "../../services/api"; // Import addManager để cấp quyền

const ManagersList = ({ users, onRevokeManager }) => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRevoke = async (user) => {
    try {
      setError("");
      setSuccess("");
      await onRevokeManager(user); // Truyền toàn bộ user object
      setSuccess("Thu hồi quyền quản lý thành công!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error revoking manager:", error);
      setError(error.message || "Có lỗi xảy ra khi thu hồi quyền quản lý!");
    }
  };

  const handleGrant = async (user) => {
    try {
      setError("");
      setSuccess("");
      await addManager({ address: user.wallet_address });
      setSuccess(`Đã cấp quyền quản lý cho ${user.name}!`);
      setTimeout(() => setSuccess(""), 3000);
      // Cập nhật danh sách người dùng (có thể cần làm mới danh sách từ API)
      user.role = "Admin";
    } catch (error) {
      console.error("Error granting manager role:", error);
      setError(error.message || "Có lỗi xảy ra khi cấp quyền quản lý!");
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      {users.length === 0 ? (
        <Typography>Không có người dùng nào.</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tên</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Địa chỉ ví</TableCell>
              <TableCell>Vai trò</TableCell>
              <TableCell>Ngày tạo</TableCell>
              <TableCell>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.wallet_address}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  {user.created_at
                    ? new Date(user.created_at).toLocaleString("vi-VN")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {user.role === "Admin" ? (
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => handleRevoke(user)}
                    >
                      Thu hồi quyền
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleGrant(user)}
                    >
                      Cấp quyền quản lý
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
};

export default ManagersList;
