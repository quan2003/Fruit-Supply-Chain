// src/components/FruitCatalog/CatalogDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getFruitProductById } from "../../services/fruitService";
import LoadingSpinner from "../common/LoadingSpinner";
import "./CatalogStyles.css";

const CatalogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setLoading(true);
        const data = await getFruitProductById(id);
        console.log("Product detail:", data); // Thêm log để kiểm tra
        setProduct(data);
        setLoading(false);
      } catch (err) {
        setError("Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.");
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [id]);

  if (loading)
    return (
      <div className="loading-message">
        <LoadingSpinner /> Đang tải dữ liệu...
      </div>
    );
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!product) return <div>Không tìm thấy sản phẩm</div>;

  return (
    <div className="product-detail-container">
      <div className="detail-header">
        <h2>Chi tiết sản phẩm</h2>
        <Link to="/catalog" className="btn-back">
          Quay lại danh sách
        </Link>
      </div>

      <div className="product-detail-content">
        <div className="product-detail-image">
          <img
            src={product.imageUrl || "https://via.placeholder.com/150"}
            alt={product.name}
            style={{ maxWidth: "200px" }}
          />
        </div>

        <div className="product-detail-info">
          <table className="detail-table">
            <tbody>
              <tr>
                <th>ID:</th>
                <td>{product.id}</td>
              </tr>
              <tr>
                <th>Mã sản phẩm:</th>
                <td>{product.productCode}</td>
              </tr>
              <tr>
                <th>Tên:</th>
                <td>{product.name}</td>
              </tr>
              <tr>
                <th>Giá (AGT):</th>
                <td>{product.price}</td>
              </tr>
              <tr>
                <th>Loại:</th>
                <td>{product.category}</td>
              </tr>
              <tr>
                <th>Mô tả:</th>
                <td>{product.description}</td>
              </tr>
              <tr>
                <th>Số lượng (hộp):</th>
                <td>{product.quantity}</td>
              </tr>
              <tr>
                <th>Ngày sản xuất:</th>
                <td>{new Date(product.productionDate).toLocaleDateString()}</td>
              </tr>
              <tr>
                <th>Hạn sử dụng:</th>
                <td>{new Date(product.expiryDate).toLocaleDateString()}</td>
              </tr>
            </tbody>
          </table>

          <div className="product-actions">
            <Link to={`/catalog/edit/${product.id}`} className="btn-edit">
              Chỉnh sửa
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogDetail;
