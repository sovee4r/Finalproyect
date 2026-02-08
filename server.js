const express = require("express");
const path = require("path");

const app = express();
const PORT = 8080;

app.use(express.static(path.join(__dirname, "frontend", "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
