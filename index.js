const express = require("express");
const { Web3 } = require("web3");
const app = express();
app.use(express.json());

// Kết nối với Ganache
const web3 = new Web3("http://127.0.0.1:7545");

// Thông tin contract
const contractAddress = "0x20456308Aef9aF8D43C2f831bF666Fe4451eC36d";
const contractABI = require("./build/contracts/FruitSupplyChain.json").abi;
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Tài khoản từ Ganache
const account = "0x33dbE90872BbF0a67692D7B533D57A6c185F42bC";

// API: Thu hoạch
app.post("/harvest", async (req, res) => {
  const { fruitType, origin } = req.body;
  try {
    await contract.methods
      .harvestFruit(fruitType, origin)
      .send({ from: account, gas: 300000 });
    const fruitId = await contract.methods.fruitCount().call();
    res.json({ message: "Fruit harvested", fruitId: fruitId.toString() }); // Chuyển BigInt thành string
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Ghi bước
app.post("/record-step", async (req, res) => {
  const { fruitId, step } = req.body;
  try {
    await contract.methods
      .recordStep(fruitId, step)
      .send({ from: account, gas: 300000 });
    res.json({ message: `Step ${step} recorded` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Tra cứu
app.get("/fruit/:id", async (req, res) => {
  const fruitId = req.params.id;
  try {
    const fruit = await contract.methods.getFruit(fruitId).call();
    res.json({
      fruitType: fruit[0],
      origin: fruit[1],
      producer: fruit[2],
      history: fruit[3],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
