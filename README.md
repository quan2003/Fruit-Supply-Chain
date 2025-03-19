# Hệ thống quản lý chuỗi cung ứng trái cây trên nền tảng Blockchain

## Giới thiệu
Hệ thống này sử dụng công nghệ Blockchain để quản lý và theo dõi chuỗi cung ứng trái cây, đảm bảo tính minh bạch, không thể chỉnh sửa và dễ dàng truy xuất nguồn gốc. Người dùng có thể biết rõ từng loại trái cây được thu hoạch từ đâu, ai trồng, trải qua những khâu nào trước khi đến tay họ.

## Mục tiêu chính
- Đưa 6 bộ dữ liệu về danh mục các loại trái cây lên nền tảng Blockchain để hỗ trợ truy xuất nguồn gốc.
- Đảm bảo dữ liệu minh bạch, không thể chỉnh sửa, giúp tăng độ tin cậy cho người dân và nhà quản lý.
- Cung cấp chức năng phân tích dữ liệu để đưa ra gợi ý cho người dân và nhà quản lý.
- Xây dựng module quan sát và cập nhật thông tin vùng trồng theo thời gian thực.

## Quy trình chuỗi cung ứng
Hệ thống sẽ ghi nhận và quản lý các bước sau trên Blockchain:
1. **Harvested**: Trái cây được thu hoạch bởi nhà sản xuất (Producer).
2. **PurchasedByThirdParty**: Nhà sản xuất bán trái cây cho bên thứ ba (Third Party).
3. **ShippedByFarmer**: Nhà sản xuất vận chuyển trái cây cho bên thứ ba.
4. **ReceivedByThirdParty**: Bên thứ ba nhận hàng.
5. **SellByThirdParty**: Bên thứ ba bán lại hàng.
6. **PurchasedByCustomer**: Khách hàng mua hàng.
7. **ShippedByThirdParty**: Bên thứ ba vận chuyển đến trung tâm phân phối (Delivery Hub).
8. **ReceivedByDeliveryHub**: Trung tâm phân phối nhận hàng.
9. **ShippedByDeliveryHub**: Trung tâm phân phối vận chuyển hàng đến khách hàng cuối cùng.
10. **ReceivedByCustomer**: Người tiêu dùng cuối cùng nhận hàng.

## Chức năng hỗ trợ
- **Truy xuất nguồn gốc**: Người tiêu dùng có thể kiểm tra lịch sử sản phẩm từ lúc thu hoạch đến khi nhận hàng.
- **Khuyến nghị sản xuất**: Hệ thống phân tích dữ liệu để đưa ra gợi ý về loại trái cây đang được ưa chuộng, cách trồng hiệu quả.
- **Quản lý dữ liệu theo thời gian thực**: Cập nhật thông tin vùng trồng, tình hình thời tiết, sản lượng, chất lượng trái cây.

## Đối tượng sử dụng
- **Người dân**: Theo dõi thông tin vùng trồng, nhận khuyến nghị để cải thiện sản xuất.
- **Nhà quản lý**: Quản lý toàn bộ chuỗi cung ứng, đưa ra quyết định dựa trên dữ liệu minh bạch.
- **Người tiêu dùng**: Truy xuất nguồn gốc trái cây, yên tâm về chất lượng sản phẩm.

## Công nghệ sử dụng
- **Blockchain**: Ghi nhận và quản lý thông tin chuỗi cung ứng.
- **Smart Contract**: Tự động hóa các giao dịch và cập nhật trạng thái chuỗi cung ứng.
- **Web3.js**: Kết nối ứng dụng web với Blockchain.
- **React.js / Vue.js**: Giao diện người dùng.
- **Node.js / Express.js**: Backend API.
- **IPFS**: Lưu trữ thông tin phân tán.

## Cài đặt & Chạy hệ thống
### Yêu cầu hệ thống
- Node.js & npm
- Ganache (hoặc bất kỳ mạng thử nghiệm Ethereum nào)
- Truffle hoặc Hardhat (cho Smart Contract)

### Cài đặt
```sh
# Clone repository
git clone https://github.com/your-repo/blockchain-fruit-supply.git
cd blockchain-fruit-supply

# Cài đặt dependencies
npm install

# Triển khai hợp đồng thông minh
truffle migrate --network development

# Chạy server
npm start
```

## Đóng góp
Chúng tôi hoan nghênh mọi đóng góp! Vui lòng fork repository, tạo branch mới và gửi pull request.

## Giấy phép
Dự án này được cấp phép theo MIT License.
