import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const QuickActions = () => {
  const { isFarmer, isManager } = useAuth();

  return (
    <div className="quick-actions">
      <h2>Truy cập nhanh</h2>
      <div className="actions-container">
        <Link to="/tracker" className="action-btn">
          Truy xuất nguồn gốc
        </Link>

        {isFarmer && (
          <>
            <Link to="/farms/harvest" className="action-btn">
              Thu hoạch trái cây
            </Link>
            <Link to="/farms/register" className="action-btn">
              Đăng ký nông trại
            </Link>
          </>
        )}

        {isManager && (
          <>
            <Link to="/admin/catalogs" className="action-btn">
              Quản lý danh mục
            </Link>
            <Link to="/analytics" className="action-btn">
              Xem báo cáo
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default QuickActions;
