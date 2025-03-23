// src/components/FruitCatalog/CatalogList.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getFruitProducts } from "../../services/fruitService";
import LoadingSpinner from "../common/LoadingSpinner";
import "./CatalogStyles.css";

const CatalogList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getFruitProducts();
        console.log("Products in CatalogList:", data); // Thêm log để kiểm tra
        setProducts(data || []); // Đảm bảo data không undefined
        setLoading(false);
      } catch (err) {
        setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.");
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading)
    return (
      <div className="loading-message">
        <LoadingSpinner /> Đang tải dữ liệu...
      </div>
    );
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="catalog-container">
      <div className="catalog-header">
        <h2>Danh sách sản phẩm</h2>
        <Link to="/catalog/add" className="btn-add">
          Thêm sản phẩm
        </Link>
      </div>

      {products.length === 0 ? (
        <p>Không có sản phẩm nào để hiển thị. Hãy thêm sản phẩm mới!</p>
      ) : (
        <div className="catalog-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Mã sản phẩm</th>
                <th>Tên</th>
                <th>Hình ảnh</th>
                <th>Giá (AGT)</th>
                <th>Loại</th>
                <th>Mô tả</th>
                <th>Số lượng (hộp)</th>
                <th>Ngày sản xuất</th>
                <th>Hạn sử dụng</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.productCode}</td>
                  <td>{product.name}</td>
                  <td>
                    <img
                      src={
                        product.imageUrl || "https://via.placeholder.com/150"
                      } // Dùng ảnh mặc định nếu imageUrl không có
                      alt={product.name}
                      className="product-thumbnail"
                      style={{ width: "50px", height: "50px" }}
                    />
                  </td>
                  <td>{product.price}</td>
                  <td>{product.category}</td>
                  <td>{product.description}</td>
                  <td>{product.quantity}</td>
                  <td>
                    {new Date(product.productionDate).toLocaleDateString()}
                  </td>
                  <td>{new Date(product.expiryDate).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/catalog/${product.id}`} className="btn-view">
                        Xem
                      </Link>
                      <Link
                        to={`/catalog/edit/${product.id}`}
                        className="btn-edit"
                      >
                        Sửa
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CatalogList;
