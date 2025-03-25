# Quizzet Translate Extension

Quizzet Translate Extension này cho phép người dùng dịch văn bản đã chọn trên trang web bằng API Google Translate. Nó hiển thị một biểu tượng bên dưới từ đã chọn, và khi nhấp vào biểu tượng, bản dịch sẽ được hiển thị cùng với tùy chọn lưu bản dịch vào mục đánh dấu.

## Tính Năng

-   Phát hiện văn bản được chọn trên trang web.
-   Hiển thị biểu tượng dịch thuật bên dưới từ đã chọn.
-   Dịch văn bản đã chọn bằng API Google Translate.
-   Khi bấm vào đánh dấu (icon Star) thì sẽ tự động lưu vào từ điển lên trang quizzet.site

## Cấu Trúc Dự Án

```
translation-extension
├── src
│   ├── content.js          # Logic phát hiện văn bản được chọn và hiển thị biểu tượng
│   ├── background.js       # Quản lý tác vụ nền và tương tác API
│   ├── popup
│   │   ├── popup.html      # Cấu trúc HTML cho popup
│   │   ├── popup.js        # Logic cho chức năng popup
│   │   └── popup.css       # Kiểu dáng cho popup
│   └── utils
│       └── translator.js    # Các hàm tương tác với API Google Translate
├── manifest.json           # Tệp cấu hình cho tiện ích mở rộng Chrome
├── package.json            # Tệp cấu hình npm với các phụ thuộc
└── README.md               # Tài liệu cho dự án
```

## Cài đặt

1. Clone hoặc tải về repository này.
2. Mở Chrome và điều hướng đến `chrome://extensions/`.
3. Bật "Chế độ nhà phát triển" bằng cách bật công tắc ở góc trên bên phải.
4. Nhấp vào "Tải tiện ích đã giải nén" và chọn thư mục nơi bạn đã tải về hoặc clone repository này.

## Cách Sử Dụng

1. Chọn bất kỳ văn bản nào trên trang web.
2. Nhấp vào biểu tượng dịch thuật xuất hiện bên dưới văn bản đã chọn.
3. Xem bản dịch trong popup và lưu vào mục đánh dấu nếu muốn.

## Giao diện

<img src="screenshots/img1.png"/>
<img src="screenshots/img2.png"/>

## Giấy phép

Dự án này được cấp phép theo Giấy phép MIT. Xem tệp [LICENSE](LICENSE) để biết chi tiết.

## Ghi công

-   Phát triển bởi Nguyen Trong An (trongandev) © 2025
-   Sử dụng Google Translate API để dịch

## Đóng góp

Bạn có thể tự do phát triển dựa trên dự án này, nhưng vui lòng ghi nhận tác giả gốc. Sự tôn trọng của bạn dành cho tác phẩm gốc được trân trọng. Vui lòng mở một issue hoặc gửi một pull request trên GitHub.

## Liên hệ

Nếu có bất kỳ câu hỏi hoặc phản hồi nào, vui lòng liên hệ với tôi tại trongandev@gmail.com.
