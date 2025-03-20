// src/components/FruitCatalog/AddCatalogForm.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addFruitProduct } from "../../services/fruitService";
import "./CatalogStyles.css";

const AddCatalogForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [product, setProduct] = useState({
    name: "",
    productCode: "",
    category: "ban cho", // Giá trị mặc định
    description: "",
    price: "",
    quantity: "",
    imageUrl: "",
    productionDate: "",
    expiryDate: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({
      ...product,
      [name]: value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProduct({
          ...product,
          imageUrl: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await addFruitProduct(product);
      setLoading(false);
      navigate("/catalog");
    } catch (err) {
      setError("Không thể thêm sản phẩm. Vui lòng thử lại sau.");
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Thêm sản phẩm mới</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Tên sản phẩm</label>
          <input
            type="text"
            id="name"
            name="name"
            value={product.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="productCode">Mã sản phẩm</label>
          <input
            type="text"
            id="productCode"
            name="productCode"
            value={product.productCode}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Loại</label>
          <select
            id="category"
            name="category"
            value={product.category}
            onChange={handleChange}
            required
          >
            <option value="ban cho">Bán cho</option>
            <option value="nhap vao">Nhập vào</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Mô tả</label>
          <textarea
            id="description"
            name="description"
            value={product.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="price">Giá (AGT)</label>
          <input
            type="number"
            id="price"
            name="price"
            value={product.price}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="quantity">Số lượng (hộp)</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={product.quantity}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="imageUpload">Hình ảnh</label>
          <input
            type="file"
            id="imageUpload"
            name="imageUpload"
            accept="image/*"
            onChange={handleImageChange}
            required
          />
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt="Product preview"
              className="image-preview"
              style={{ maxWidth: "200px", marginTop: "10px" }}
            />
          )}
        </div>

        <div className="form-group">
          <label htmlFor="productionDate">Ngày sản xuất</label>
          <input
            type="date"
            id="productionDate"
            name="productionDate"
            value={product.productionDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="expiryDate">Hạn sử dụng</label>
          <input
            type="date"
            id="expiryDate"
            name="expiryDate"
            value={product.expiryDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate("/catalog")}
          >
            Hủy
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Đang xử lý..." : "Thêm sản phẩm"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCatalogForm;
