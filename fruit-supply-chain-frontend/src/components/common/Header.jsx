import React from "react";
import { Link } from "react-router-dom";
import { useWeb3 } from "../../contexts/Web3Context";
import { useAuth } from "../../contexts/AuthContext";

const Header = () => {
  const { account, connectWallet } = useWeb3();
  const { isManager } = useAuth();

  return (
    <header className="app-header">
      <div className="logo">
        <Link to="/">Quản lý Chuỗi Cung ứng Trái cây</Link>
      </div>
      <nav className="main-nav">
        <ul>
          <li>
            <Link to="/">Trang chủ</Link>
          </li>
          <li>
            <Link to="/catalog">Danh mục trái cây</Link>
          </li>
          <li>
            <Link to="/farms">Quản lý nông trại</Link>
          </li>
          <li>
            <Link to="/tracker">Truy xuất nguồn gốc</Link>
          </li>
          <li>
            <Link to="/analytics">Phân tích dữ liệu</Link>
          </li>
          {isManager && (
            <li>
              <Link to="/admin">Quản trị</Link>
            </li>
          )}
        </ul>
      </nav>
      <div className="wallet-connect">
        {account ? (
          <div className="account-info">
            <span className="account-address">
              {`${account.substring(0, 6)}...${account.substring(
                account.length - 4
              )}`}
            </span>
            <div className="account-status connected">Đã kết nối</div>
          </div>
        ) : (
          <button className="connect-btn" onClick={connectWallet}>
            Kết nối ví
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
