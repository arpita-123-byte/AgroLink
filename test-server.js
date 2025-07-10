const express = require("express");
const path = require("path");

const app = express();
const PORT = 5050;

// ✅ Serve current directory (where order-status.html is)
app.use(express.static(__dirname));

// ✅ Debug route
app.get("/", (req, res) => {
  res.send("Server is running! Try /order-status.html");
});

app.listen(PORT, () => {
  console.log(`✅ Test server running at http://localhost:${PORT}`);
});
