import React from "react";
import { Navigate } from "react-router-dom";
import { useWeb3 } from "../../contexts/Web3Context";

const ProtectedRoute = ({ children, isAllowed }) => {
  const { account } = useWeb3();

  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem("user"));

  console.log("ProtectedRoute - User data:", user);
  console.log("ProtectedRoute - Account:", account);

  if (!account) {
    return <Navigate to="/dang-nhap" replace />;
  }

  // Check if user data exists and if the isAllowed function returns true
  // when called with the user data
  if (!user || !isAllowed(user)) {
    console.log("ProtectedRoute - Access denied");
    return <Navigate to="/unauthorized" replace />;
  }

  console.log("ProtectedRoute - Access granted");
  return children;
};

export default ProtectedRoute;
