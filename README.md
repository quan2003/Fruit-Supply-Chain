# ỨNG DỤNG BLOCKCHAIN VÀ AI TRONG VIỆC TẠO CHUỖI CUNG ỨNG VÀ NHẬN DIỆN TRÁI CÂY CHÍN

## Giới thiệu
Hệ thống này sử dụng công nghệ Blockchain để quản lý và theo dõi chuỗi cung ứng trái cây, đảm bảo tính minh bạch, không thể chỉnh sửa và dễ dàng truy xuất nguồn gốc. Người dùng có thể biết rõ từng loại trái cây được thu hoạch từ đâu, ai trồng và trải qua các khâu nào trước khi đến tay họ.

## Mục tiêu chính
- Lưu trữ và quản lý 6 bộ dữ liệu danh mục trái cây trên Blockchain để hỗ trợ truy xuất nguồn gốc.
- Đảm bảo dữ liệu minh bạch, không thể chỉnh sửa, tăng độ tin cậy cho nông dân, nhà quản lý và người tiêu dùng.
- Cung cấp phân tích dữ liệu để đưa ra gợi ý cho nông dân và nhà quản lý.
- Xây dựng module theo dõi và cập nhật thông tin vùng trồng theo thời gian thực.

## Quy trình chuỗi cung ứng
Hệ thống ghi nhận và quản lý các giai đoạn sau trên Blockchain:
1. **Thu hoạch (Harvested)**: Trái cây được thu hoạch bởi nông dân.
2. **Mua bởi bên thứ ba (PurchasedByThirdParty)**: Nông dân bán trái cây cho bên thứ ba.
3. **Vận chuyển bởi nông dân (ShippedByFarmer)**: Nông dân vận chuyển trái cây cho bên thứ ba.
4. **Nhận bởi bên thứ ba (ReceivedByThirdParty)**: Bên thứ ba nhận hàng.
5. **Bán bởi bên thứ ba (SellByThirdParty)**: Bên thứ ba đăng bán sản phẩm.
6. **Mua bởi khách hàng (PurchasedByCustomer)**: Khách hàng mua sản phẩm.
7. **Vận chuyển bởi bên thứ ba (ShippedByThirdParty)**: Bên thứ ba vận chuyển đến trung tâm phân phối.
8. **Nhận bởi trung tâm phân phối (ReceivedByDeliveryHub)**: Trung tâm phân phối nhận hàng.
9. **Vận chuyển bởi trung tâm phân phối (ShippedByDeliveryHub)**: Trung tâm phân phối vận chuyển đến khách hàng cuối.
10. **Nhận bởi khách hàng (ReceivedByCustomer)**: Khách hàng cuối nhận hàng.

## Tính năng hỗ trợ
- **Truy xuất nguồn gốc**: Người tiêu dùng có thể kiểm tra lịch sử sản phẩm từ lúc thu hoạch đến khi nhận hàng.
- **Khuyến nghị sản xuất**: Phân tích dữ liệu để gợi ý loại trái cây phổ biến và phương pháp canh tác hiệu quả.
- **Quản lý dữ liệu thời gian thực**: Cập nhật thông tin vùng trồng, thời tiết, sản lượng và chất lượng trái cây.

## Vai trò người dùng
- **Nông dân (Producer)**: Theo dõi tình trạng nông trại, nhận khuyến nghị sản xuất và quản lý bán hàng.
- **Nhà quản lý (Government)**: Giám sát chuỗi cung ứng, đảm bảo tuân thủ và truy cập dữ liệu minh bạch.
- **Trung tâm phân phối (DeliveryHub)**: Quản lý kho, xử lý đơn hàng và phân phối trái cây.
- **Người tiêu dùng (Customer)**: Truy xuất nguồn gốc trái cây, đảm bảo chất lượng sản phẩm.
- **Quản trị viên (Admin)**: Quản lý người dùng hệ thống và giám sát hoạt động.

## Công nghệ sử dụng
- **Blockchain**: Dựa trên Ethereum để lưu trữ dữ liệu bất biến.
- **Smart Contract**: Tự động hóa giao dịch và cập nhật trạng thái chuỗi cung ứng với Hardhat.
- **Ethers.js**: Kết nối ứng dụng web với Blockchain.
- **React.js**: Giao diện người dùng frontend.
- **Node.js / Express.js**: API backend.
- **IPFS (qua Pinata)**: Lưu trữ phi tập trung cho hình ảnh và metadata sản phẩm.
- **PostgreSQL**: Cơ sở dữ liệu cho dữ liệu off-chain.
- **Hardhat**: Môi trường phát triển để biên dịch, triển khai và kiểm thử smart contract.

## Cài đặt & Chạy hệ thống
### Yêu cầu hệ thống
- Node.js (phiên bản 16 trở lên) & npm
- Hardhat
- MetaMask (để tích hợp ví)
- PostgreSQL
- Tài khoản Pinata (để tích hợp IPFS)
- Hardhat node hoặc mạng thử nghiệm Ethereum (ví dụ: localhost:8545)

### Hướng dẫn cài đặt
1. **Clone Repository**
   ```sh
   git clone https://github.com/your-repo/fruit-supply-chain.git
   cd fruit-supply-chain
   ```

2. **Cài đặt Dependencies**
   ```sh
   npm install
   ```

3. **Cấu hình Biến môi trường**
   Tạo file `.env` trong thư mục gốc và thêm các thông tin sau:
   ```env
   PINATA_API_KEY=your_pinata_api_key
   PINATA_API_SECRET=your_pinata_api_secret
   API_URL=http://localhost:3000
   DATABASE_URL=postgresql://user:password@localhost:5432/fruit_supply_db
   ```
   - Thay `your_pinata_api_key` và `your_pinata_api_secret` bằng thông tin Pinata của bạn.
   - Cập nhật `DATABASE_URL` với chuỗi kết nối PostgreSQL của bạn.

4. **Cấu hình Hardhat**
   - Đảm bảo Hardhat được cấu hình trong `hardhat.config.js` để kết nối với node Ethereum (ví dụ: `http://127.0.0.1:8545/`).
   - Triển khai smart contract:
     ```sh
     npx hardhat compile
     npx hardhat run scripts/deploy.js --network localhost
     ```
   - Lưu địa chỉ contract đã triển khai (`FruitSupplyChain` và `GovernmentRegulator`) vào file `contract-addresses.json` trong thư mục gốc.

5. **Cấu hình PostgreSQL**
   - Tạo cơ sở dữ liệu có tên `fruit_supply_db`.
   - Chạy các migration để thiết lập schema cơ sở dữ liệu (đảm bảo `db.js` được cấu hình đúng):
     ```sh
     node migrations/setupDatabase.js
     ```

6. **Chạy Hardhat Node**
   ```sh
   npx hardhat node
   ```

7. **Khởi động Server**
   ```sh
   npm start
   ```
   Server sẽ chạy tại `http://localhost:3000`.

8. **Truy cập Frontend**
   - Đảm bảo frontend (React.js) được thiết lập trong repository hoặc thư mục riêng.
   - Cấu hình frontend để tương tác với API backend tại `http://localhost:3000`.

## API Endpoints
### Xác thực
- `POST /register`: Đăng ký người dùng mới (Producer, Government, DeliveryHub, Customer, Admin).
- `POST /login`: Đăng nhập người dùng.
- `POST /logout`: Đăng xuất người dùng.
- `POST /update-wallet`: Liên kết ví MetaMask với tài khoản người dùng.

### Nông dân (Producer)
- `POST /farm`: Đăng ký nông trại mới.
- `GET /farms/user`: Lấy danh sách nông trại của nông dân.
- `GET /farms/stats`: Lấy thống kê nông trại (tổng sản phẩm, sản phẩm đã bán, doanh thu).
- `GET /farms/yield`: Lấy dữ liệu sản lượng hàng tháng của nông trại.
- `POST /products`: Thêm sản phẩm mới vào nông trại.
- `POST /harvest`: Ghi nhận vụ thu hoạch trái cây.
- `PUT /farm/:farmId`: Cập nhật điều kiện nông trại.

### Trung tâm phân phối (DeliveryHub)
- `POST /purchase-product`: Mua sản phẩm từ nông dân.
- `POST /sell-product`: Đăng bán sản phẩm cho người tiêu dùng.
- `POST /add-to-inventory`: Thêm sản phẩm đã mua vào kho.
- `GET /inventory/:deliveryHubId`: Lấy danh sách sản phẩm trong kho.
- `PUT /inventory/:inventoryId/price`: Cập nhật giá sản phẩm trong kho.
- `POST /ship-to-customer`: Vận chuyển sản phẩm đến khách hàng.
- `GET /delivery-hub/orders`: Lấy danh sách đơn hàng của khách hàng.
- `GET /stats/:deliveryHubId`: Lấy thống kê trung tâm phân phối.

### Người tiêu dùng (Customer)
- `POST /buy-product`: Mua sản phẩm từ trung tâm phân phối.
- `GET /customer/orders`: Lấy danh sách đơn hàng của khách hàng.
- `POST /receive-order`: Xác nhận nhận hàng.
- `POST /products/:id/rate`: Đánh giá sản phẩm đã mua.

### Nhà quản lý (Government)
- `POST /government/sync-contracts`: Đồng bộ hợp đồng ba bên từ Blockchain.
- `GET /government/contracts`: Lấy danh sách hợp đồng ba bên.
- `POST /government/create-contract`: Tạo hợp đồng ba bên mới.
- `GET /government/farm-stats/:farmId`: Lấy thống kê nông trại.
- `GET /government/province-stats/:province`: Lấy thống kê tỉnh.
- `GET /government/contract/pdf/:contractId`: Tạo PDF cho hợp đồng chưa ký.

### Chung
- `GET /products`: Lấy danh sách tất cả sản phẩm.
- `GET /all-outgoing-products`: Lấy danh sách sản phẩm đang bán.
- `GET /trace-product/:listingId`: Truy xuất nguồn gốc sản phẩm.
- `POST /ipfs/add`: Tải file lên IPFS qua Pinata.
- `GET /contract-address`: Lấy địa chỉ smart contract.
- `POST /contract/sign/:contractId`: Ký hợp đồng ba bên.
- `GET /contract/signed/pdf/:contractId`: Tạo PDF cho hợp đồng đã ký.

## Smart Contract
- **FruitSupplyChain.sol**: Quản lý chuỗi cung ứng trái cây, bao gồm đăng bán sản phẩm, mua hàng và chuyển đổi trạng thái.
- **GovernmentRegulator.sol**: Quản lý hợp đồng ba bên giữa nông dân, trung tâm phân phối và nhà quản lý.

## Đóng góp
Chúng tôi hoan nghênh mọi đóng góp! Vui lòng làm theo các bước sau:
1. Fork repository.
2. Tạo branch mới (`git checkout -b feature/your-feature`).
3. Commit thay đổi (`git commit -m "Thêm tính năng của bạn"`).
4. Push lên branch (`git push origin feature/your-feature`).
5. Tạo pull request.

## Giấy phép
Dự án này được cấp phép theo MIT License. Xem file `LICENSE` để biết thêm chi tiết.
