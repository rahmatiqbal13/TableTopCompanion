<?php
//untuk koneksi ke database
session_start();
include ("koneksi.php");

//proses edit
$id_alter   = $_POST['id'];
$alternatif = $_POST['nama'];

$ubah = mysqli_query($koneksi, "UPDATE tab_alternatif SET nama_alternatif ='".$alternatif."', id_genre = '".$_POST['id_genre']."', tahun_rilis = '".$_POST['tahun_rilis']."' WHERE id_alternatif ='".$id_alter."'");

foreach($_POST['kriteria'] as $key => $value){
	$ubah_nilai = mysqli_query($koneksi, "UPDATE tab_topsis SET nilai = '".$value."' WHERE id_alternatif = '".$id_alter."' AND id_kriteria = '".$key."'");
}

if($ubah_nilai == TRUE){
	echo "<script>alert('Ubah Data Dengan ID = ".$id_alter." Berhasil') </script>";
	echo "<script>window.location.href = \"alternatif.php\" </script>";
} else {
	echo mysqli_error($koneksi); 
}

?>
