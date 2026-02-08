const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

// 📌 IMPORTANTE: ESTA ES LA RUTA CORRECTA PARA TU CASO
app.use(express.static(path.join(__dirname, "Frontend/Public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Frontend/Public/Index.html"));
});

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
