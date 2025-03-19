import React from "react";
import { Link } from "react-router-dom";

const RecentActivities = ({ activities }) => {
  return (
    <div className="recent-activities">
      <h2>Hoạt động gần đây</h2>

      {activities.length === 0 ? (
        <p className="no-data">Không có hoạt động nào gần đây</p>
      ) : (
        <ul className="activity-list">
          {activities.map((activity, index) => (
            <li key={index} className="activity-item">
              <div className="activity-info">
                <span className="activity-type">{activity.type}</span>
                <span className="activity-time">
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="activity-description">{activity.description}</p>
              {activity.fruitId && (
                <Link
                  to={`/tracker?fruitId=${activity.fruitId}`}
                  className="activity-link"
                >
                  Xem chi tiết
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentActivities;
