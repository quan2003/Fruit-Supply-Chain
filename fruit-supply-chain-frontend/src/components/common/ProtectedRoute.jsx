import React from "react";
import { Navigate } from "react-router-dom";
import { useWeb3 } from "../../contexts/Web3Context";

const ProtectedRoute = ({ children, isAllowed }) => {
  const { account } = useWeb3();

  if (!account) {
    return <Navigate to="/" replace />;
  }

  if (!isAllowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
