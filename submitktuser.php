<?php
//untuk koneksi ke database
session_start();
include ("koneksi.php");

//proses submit
$bobot    = $_POST['bobot'];
$tipe    = $_POST['tipe'];

$sql = "";

foreach($bobot as $i => $value){
$sql .= "UPDATE tab_kriteria_user SET bobot ='".($value/100)."', tipe= '".$tipe[$i]. "' WHERE id_kriteria='".$i."' ;";
}

$koneksi = mysqli_multi_query ($koneksi,$sql);

echo "<script>alert('Simpan Data Berhasil') </script>";
echo "<script>window.location.href = \"hastop.php?is_user=yes\" </script>";
?>
