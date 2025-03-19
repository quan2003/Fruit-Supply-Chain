import React from "react";

const DashboardStats = ({ stats }) => {
  return (
    <div className="dashboard-stats">
      <div className="stat-card">
        <h3>Tổng số trái cây</h3>
        <div className="stat-value">{stats.fruitCount}</div>
      </div>
      <div className="stat-card">
        <h3>Tổng số nông trại</h3>
        <div className="stat-value">{stats.farmCount}</div>
      </div>
      <div className="stat-card">
        <h3>Đang vận chuyển</h3>
        <div className="stat-value">{stats.inTransit}</div>
      </div>
      <div className="stat-card">
        <h3>Đã giao hôm nay</h3>
        <div className="stat-value">{stats.deliveredToday}</div>
      </div>
    </div>
  );
};

export default DashboardStats;
