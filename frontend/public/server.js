const express = require("express");
const path = require("path");

const app = express();

app.use(express.static(__dirname));

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
