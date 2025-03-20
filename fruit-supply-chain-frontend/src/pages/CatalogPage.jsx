// src/pages/CatalogPage.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "../components/common/Layout";
import CatalogList from "../components/FruitCatalog/CatalogList";
import CatalogDetail from "../components/FruitCatalog/CatalogDetail";
import AddCatalogForm from "../components/FruitCatalog/AddCatalogForm";

const CatalogPage = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<CatalogList />} />
        <Route path="/add" element={<AddCatalogForm />} />
        <Route path="/:id" element={<CatalogDetail />} />
        <Route path="/edit/:id" element={<AddCatalogForm />} />
      </Routes>
    </Layout>
  );
};

export default CatalogPage;

// src/services/fruitService.js
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

// Danh sách mock dữ liệu cho trường hợp phát triển
const mockProducts = [
  {
    id: 16,
    productCode: "969d3f59-d5de-4...",
    name: "Dưa leo",
    imageUrl: "/images/cucumber.png",
    price: 10,
    category: "ban cho",
    description: "Vị của dưa leo rất ngon",
    quantity: 4,
    productionDate: "04/12/2024",
    expiryDate: "11/02/2025",
  },
  {
    id: 15,
    productCode: "d3b8ccd1-6e5a-...",
    name: "Chanh vàng",
    imageUrl: "/images/lemon.png",
    price: 22,
    category: "ban cho",
    description: "Chanh giấy rất ngon",
    quantity: 1,
    productionDate: "01/12/2024",
    expiryDate: "15/01/2025",
  },
  {
    id: 14,
    productCode: "cb147e98-0b29-...",
    name: "Bắp cải",
    imageUrl: "/images/cabbage.png",
    price: 24,
    category: "ban cho",
    description: "Vị của bắp cải rất ngon",
    quantity: 2,
    productionDate: "01/12/2024",
    expiryDate: "04/01/2025",
  },
  {
    id: 13,
    productCode: "4de59188-cc1f-4...",
    name: "Ớt chuông",
    imageUrl: "/images/bellpepper.png",
    price: 15,
    category: "ban cho",
    description: "Vị của ớt chuông rất ngon",
    quantity: 3,
    productionDate: "27/10/2024",
    expiryDate: "30/12/2024",
  },
];

// Mock API cho quá trình phát triển
export const getFruitProducts = async () => {
  try {
    // Trong môi trường phát triển, sử dụng dữ liệu mock
    if (process.env.NODE_ENV === "development") {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockProducts), 500);
      });
    }

    // Trong môi trường production, gọi API thực tế
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) {
      throw new Error("Không thể tải danh sách sản phẩm");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

export const getFruitProductById = async (id) => {
  try {
    // Trong môi trường phát triển, sử dụng dữ liệu mock
    if (process.env.NODE_ENV === "development") {
      return new Promise((resolve) => {
        const product = mockProducts.find((p) => p.id === parseInt(id));
        setTimeout(() => resolve(product), 500);
      });
    }

    // Trong môi trường production, gọi API thực tế
    const response = await fetch(`${API_URL}/products/${id}`);
    if (!response.ok) {
      throw new Error("Không thể tải thông tin sản phẩm");
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
};

export const addFruitProduct = async (productData) => {
  try {
    // Trong môi trường phát triển, giả lập thêm sản phẩm
    if (process.env.NODE_ENV === "development") {
      return new Promise((resolve) => {
        const newProduct = {
          id: mockProducts.length + 1,
          ...productData,
        };
        mockProducts.push(newProduct);
        setTimeout(() => resolve(newProduct), 500);
      });
    }

    // Trong môi trường production, gọi API thực tế
    const response = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      throw new Error("Không thể thêm sản phẩm");
    }

    return await response.json();
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

export const updateFruitProduct = async (id, productData) => {
  try {
    // Trong môi trường phát triển, giả lập cập nhật sản phẩm
    if (process.env.NODE_ENV === "development") {
      return new Promise((resolve) => {
        const index = mockProducts.findIndex((p) => p.id === parseInt(id));
        if (index !== -1) {
          mockProducts[index] = { ...mockProducts[index], ...productData };
          setTimeout(() => resolve(mockProducts[index]), 500);
        }
      });
    }

    // Trong môi trường production, gọi API thực tế
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      throw new Error("Không thể cập nhật sản phẩm");
    }

    return await response.json();
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    throw error;
  }
};
