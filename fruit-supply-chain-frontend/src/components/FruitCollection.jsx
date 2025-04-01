import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  TextField,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

// Danh sách trái cây với hash IPFS và icon
const fruits = [
  {
    name: "Dưa Hấu",
    hash: "QmNYb72BzVRhxTcXAefSg4QESHK2fEn2T3hFUE8Gvz6gM5",
    icon: "🍉",
  },
  {
    name: "Măng Cụt",
    hash: "QmdHct5JMUtw3VpDMJg4LYLvFqkVUsoZAVmy8wqgjs8T8d",
    icon: "🥭",
  }, // Không có emoji chính xác, tạm dùng 🥭
  {
    name: "Trái Cam",
    hash: "QmWDN5vHi1apdzmjpi2CncLhpLgd1cJskWQDWFW8jQTHZo",
    icon: "🍊",
  },
  {
    name: "Trái Thanh Long",
    hash: "QmdTqSueXLd6J6EMbXvemP3VVPpUo3dkkWwbiNmKV4Cegy",
    icon: "🐉",
  }, // Không có emoji chính xác, tạm dùng 🐉
  {
    name: "Trái Xoài",
    hash: "QmcwFdYQXKVsPd7qhCeXowwVDbHrnmMM6hCtsfJ7US4nXT",
    icon: "🥭",
  },
  {
    name: "Vú Sữa",
    hash: "QmXtKxu41xyvx4x9XXz6WRTRFCnKwriWfrHCtiYTHDJF1u",
    icon: "🥛",
  }, // Không có emoji chính xác, tạm dùng 🥛
];

const gateways = [
  { name: "Cục bộ", url: "http://localhost:8080/ipfs/" },
  { name: "IPFS.io", url: "https://ipfs.io/ipfs/" },
  { name: "Cloudflare", url: "https://cloudflare-ipfs.com/ipfs/" },
  { name: "Dweb.link", url: "https://dweb.link/ipfs/" },
];

const FruitCollection = () => {
  const [selectedFruit, setSelectedFruit] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentGatewayIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const gateway = gateways[currentGatewayIndex];

  const filteredFruits = fruits.filter((fruit) =>
    fruit.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFruitSelect = (fruit) => {
    setSelectedFruit(fruit);
    setContent(null);
    setError(null);
  };

  useEffect(() => {
    if (!selectedFruit) return;

    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      setContent(null);

      try {
        const response = await fetch(`${gateway.url}${selectedFruit.hash}`);
        if (response.ok) {
          const html = await response.text();

          if (html.includes("<html") && html.includes("Index of")) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const links = doc.querySelectorAll("a");

            const fileList = [];
            for (let i = 1; i < links.length; i++) {
              const fileName = links[i].textContent.trim();
              if (!fileName.startsWith(".")) {
                fileList.push({
                  name: fileName,
                  path: `${selectedFruit.hash}/${fileName}`,
                });
              }
            }

            setContent({ type: "list", files: fileList });
          } else {
            setContent({ type: "direct", data: html });
          }
        } else {
          setError("Không thể tải nội dung từ IPFS.");
        }
      } catch (err) {
        setError(`Đã xảy ra lỗi: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [selectedFruit, gateway]);

  const handleFileClick = async (path) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${gateway.url}${path}`);
      if (response.ok) {
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.startsWith("image/")) {
          setContent({ type: "image", src: `${gateway.url}${path}` });
        } else if (contentType && contentType.includes("text")) {
          const text = await response.text();
          setContent({ type: "text", data: text });
        } else {
          setContent({ type: "download", url: `${gateway.url}${path}` });
        }
      } else {
        setError("Không thể tải tệp.");
      }
    } catch (err) {
      setError(`Đã xảy ra lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography
        variant="h5"
        sx={{ fontWeight: "bold", color: "#2E7D32", mb: 3 }}
      >
        Bộ sưu tập Trái cây
      </Typography>

      <TextField
        fullWidth
        placeholder="Tìm kiếm trái cây..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        {filteredFruits.length > 0 ? (
          filteredFruits.map((fruit) => (
            <Button
              key={fruit.name}
              variant={
                selectedFruit?.name === fruit.name ? "contained" : "outlined"
              }
              onClick={() => handleFruitSelect(fruit)}
              startIcon={<span>{fruit.icon}</span>}
              sx={{
                fontSize: "16px",
                padding: "8px 16px",
                borderRadius: "5px",
                color:
                  selectedFruit?.name === fruit.name ? "#FFFFFF" : "#2E7D32",
                bgcolor:
                  selectedFruit?.name === fruit.name
                    ? "#4CAF50"
                    : "transparent",
                borderColor: "#2E7D32",
                "&:hover": {
                  bgcolor:
                    selectedFruit?.name === fruit.name ? "#388E3C" : "#E8F5E9",
                  borderColor: "#388E3C",
                },
                transition: "all 0.3s ease",
              }}
            >
              {fruit.name}
            </Button>
          ))
        ) : (
          <Typography>Không tìm thấy trái cây nào phù hợp.</Typography>
        )}
      </Box>

      <Paper
        sx={{ p: 3, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
      >
        <Typography variant="h6" sx={{ color: "#FF6200", mb: 2 }}>
          {selectedFruit
            ? selectedFruit.name
            : "Vui lòng chọn một loại trái cây"}
        </Typography>
        <Typography
          sx={{
            bgcolor: "#F5F5F5",
            p: 1,
            borderRadius: "5px",
            fontFamily: "monospace",
            wordBreak: "break-all",
            mb: 2,
          }}
        >
          {selectedFruit && `Hash IPFS: ${selectedFruit.hash}`}
        </Typography>

        {loading && (
          <CircularProgress
            size={24}
            sx={{ display: "block", mx: "auto", my: 2 }}
          />
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {content && (
          <>
            {content.type === "list" && (
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  Danh sách nội dung:
                </Typography>
                <List>
                  {content.files.map((file) => (
                    <ListItem
                      key={file.name}
                      onClick={() => handleFileClick(file.path)}
                      sx={{
                        bgcolor: "#F9F9F9",
                        borderRadius: "3px",
                        cursor: "pointer",
                        "&:hover": { bgcolor: "#E9E9E9" },
                      }}
                    >
                      <ListItemText primary={file.name} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            {content.type === "image" && (
              <img
                src={content.src}
                alt="Hình ảnh trái cây"
                style={{
                  maxWidth: "100%",
                  borderRadius: "5px",
                  margin: "10px 0",
                }}
              />
            )}
            {content.type === "text" && <pre>{content.data}</pre>}
            {content.type === "download" && (
              <Typography>
                Không thể hiển thị trực tiếp loại tệp này.{" "}
                <a href={content.url} target="_blank" rel="noopener noreferrer">
                  Nhấn vào đây để mở trong tab mới
                </a>
              </Typography>
            )}
          </>
        )}
        {!content && !loading && !error && (
          <Typography>Nội dung sẽ hiển thị ở đây</Typography>
        )}

        <Typography
          variant="caption"
          sx={{ display: "block", color: "#666", mt: 2 }}
        >
          Đang sử dụng gateway: {gateway.name} ({gateway.url})
        </Typography>
      </Paper>
    </Box>
  );
};

export default FruitCollection;
