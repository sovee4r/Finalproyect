<?php
$host = "localhost";
$user = "root";        // Usuario por defecto en XAMPP
$pass = "engel007";            // Contraseña por defecto en XAMPP (vacía)
$db   = "sistema_login";

$conexion = mysqli_connect($host, $user, $pass, $db);

// Verificar si la conexión falló
if (!$conexion) {
    die("Error de conexión: " . mysqli_connect_error());
}

// Configurar para que acepte tildes y ñ (UTF-8)
mysqli_set_charset($conexion, "utf8");
?>