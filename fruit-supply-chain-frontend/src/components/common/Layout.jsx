import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import Sidebar from "./Sidebar";
import { useWeb3 } from "../../contexts/Web3Context";
import LoadingSpinner from "./LoadingSpinner";

const Layout = ({ children }) => {
  const { loading, error } = useWeb3();

  if (loading) {
    return <LoadingSpinner message="Đang kết nối với blockchain..." />;
  }

  if (error) {
    return (
      <div className="error-container">
        <h1>Lỗi kết nối</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Thử lại</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header />
      <div className="main-content">
        <Sidebar />
        <div className="content-area">{children}</div>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
