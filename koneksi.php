<?php
$host = "localhost";
$user = "root";
$pass = "";
$db   = "bg_topsis";
// $db   = "topsis_drama_film";

$koneksi = mysqli_connect($host, $user, $pass, $db);
if (!$koneksi) {
  echo "Belum Konek";
} else {
  //echo "Sudah Konek";
}
 ?>
