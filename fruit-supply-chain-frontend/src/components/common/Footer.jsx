import React from "react";

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-info">
          <h3>Quản lý Chuỗi Cung ứng Trái cây</h3>
          <p>Blockchain-based Supply Chain Management System</p>
        </div>
        <div className="footer-links">
          <h4>Liên kết</h4>
          <ul>
            <li>
              <a href="/about">Giới thiệu</a>
            </li>
            <li>
              <a href="/contact">Liên hệ</a>
            </li>
            <li>
              <a href="/terms">Điều khoản sử dụng</a>
            </li>
            <li>
              <a href="/privacy">Chính sách bảo mật</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="copyright">
        &copy; {new Date().getFullYear()} Hệ thống Quản lý Chuỗi Cung ứng Trái
        cây
      </div>
    </footer>
  );
};

export default Footer;
