import React from "react";
import { Navigate } from "react-router-dom";
import { useWeb3 } from "../../contexts/Web3Context";
import { useAuth } from "../../contexts/AuthContext";

const ProtectedRoute = ({ children, isAllowed }) => {
  const { account, loading: web3Loading } = useWeb3();
  const { user, loading: authLoading } = useAuth();

  console.log("ProtectedRoute - User data:", user);
  console.log("ProtectedRoute - Account:", account);
  console.log("ProtectedRoute - Web3 Loading:", web3Loading);
  console.log("ProtectedRoute - Auth Loading:", authLoading);

  // Nếu đang loading (từ Web3Context hoặc AuthContext), hiển thị thông báo
  if (web3Loading || authLoading) {
    return <div>Đang tải...</div>;
  }

  // Nếu không có account hoặc account không khớp với user.walletAddress
  if (
    !account ||
    (user &&
      user.walletAddress &&
      account.toLowerCase() !== user.walletAddress.toLowerCase())
  ) {
    console.log("ProtectedRoute - No account or account mismatch");
    return <Navigate to="/dang-nhap" replace />;
  }

  // Nếu không có user hoặc user không thỏa mãn điều kiện isAllowed
  if (!user || !isAllowed(user)) {
    console.log("ProtectedRoute - Access denied");
    return <Navigate to="/unauthorized" replace />;
  }

  console.log("ProtectedRoute - Access granted");
  return children;
};

export default ProtectedRoute;
