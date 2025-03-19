import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Sidebar = () => {
  const { isManager, isFarmer, userFarms } = useAuth();

  return (
    <aside className="app-sidebar">
      <div className="sidebar-section">
        <h3>Truy cập nhanh</h3>
        <ul>
          <li>
            <Link to="/tracker">Truy xuất nguồn gốc</Link>
          </li>
          {isFarmer && (
            <li>
              <Link to="/farms/harvest">Thu hoạch mới</Link>
            </li>
          )}
        </ul>
      </div>

      {isFarmer && (
        <div className="sidebar-section">
          <h3>Nông trại của tôi</h3>
          <ul>
            {userFarms.map((farm) => (
              <li key={farm.id}>
                <Link to={`/farms/${farm.id}`}>{farm.location}</Link>
              </li>
            ))}
            <li>
              <Link to="/farms/register" className="add-new">
                + Đăng ký nông trại mới
              </Link>
            </li>
          </ul>
        </div>
      )}

      {isManager && (
        <div className="sidebar-section">
          <h3>Quản lý</h3>
          <ul>
            <li>
              <Link to="/admin/managers">Quản lý người dùng</Link>
            </li>
            <li>
              <Link to="/admin/catalogs">Quản lý danh mục</Link>
            </li>
          </ul>
        </div>
      )}

      <div className="sidebar-section">
        <h3>Hỗ trợ</h3>
        <ul>
          <li>
            <a href="/guide">Hướng dẫn sử dụng</a>
          </li>
          <li>
            <a href="/faq">Câu hỏi thường gặp</a>
          </li>
          <li>
            <a href="/contact">Liên hệ hỗ trợ</a>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
