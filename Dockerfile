# Sử dụng hình ảnh Node.js 18 LTS nhẹ (Alpine) làm base
FROM node:18-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và package-lock.json (nếu có) để cài đặt phụ thuộc
COPY package*.json ./

# Cài đặt các phụ thuộc
RUN npm install

# Sao chép toàn bộ mã nguồn ứng dụng
COPY . .

# Tạo thư mục uploads
RUN mkdir -p uploads

# Mở cổng mà ứng dụng chạy
EXPOSE 3000

# Lệnh để chạy ứng dụng
CMD ["node", "index.js"]