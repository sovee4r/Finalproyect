const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

const publicPath = path.join(__dirname, "frontend");

app.use(express.static(publicPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
