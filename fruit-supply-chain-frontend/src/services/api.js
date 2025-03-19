import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL,
});

// Thêm interceptor để gắn địa chỉ Ethereum vào header của mỗi request
api.interceptors.request.use((config) => {
  const account = localStorage.getItem("account");
  if (account) {
    config.headers["x-ethereum-address"] = account;
  }
  return config;
});

export default api;
