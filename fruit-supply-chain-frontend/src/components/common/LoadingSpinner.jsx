import React from "react";

const LoadingSpinner = ({ message = "Đang tải..." }) => {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
};

export default LoadingSpinner;
