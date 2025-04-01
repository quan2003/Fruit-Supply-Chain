// D:\fruit-supply-chain\fruit-supply-chain-frontend\src\utils\ipfsClient.js
async function uploadToIPFS(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("http://localhost:3000/ipfs/add", {
      method: "POST",
      body: formData,
    });
    const { hash } = await response.json();
    if (!hash) throw new Error("Không nhận được hash từ backend");
    return hash;
  } catch (error) {
    console.error("Lỗi khi upload lên IPFS qua backend:", error);
    throw error;
  }
}

export default { uploadToIPFS };
