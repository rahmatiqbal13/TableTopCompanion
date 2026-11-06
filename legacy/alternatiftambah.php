<?php
//koneksi
session_start();
include ("koneksi.php");

//pemberian kode id secara otomatis
$carikode = $koneksi->query("SELECT id_alternatif FROM tab_alternatif") or die(mysqli_error());
$datakode = $carikode->fetch_array();
$jumlah_data = mysqli_num_rows($carikode);

if ($datakode) {
  $nilaikode = substr($jumlah_data[0], 1);
  $kode = (int) $nilaikode;
  $kode = $jumlah_data + 1;
  $kode_otomatis = str_pad($kode, 0, STR_PAD_LEFT);
} else {
  $kode_otomatis = "1";
}

$datakriteria = $koneksi->query("SELECT * FROM `tab_kriteria`") or die(mysqli_error());

//genre
$genre = $koneksi->query("SELECT * FROM tab_genre") or die(mysqli_error());

while ($row = $genre->fetch_array()){
    $genre_array[] = $row;
}

 ?>

<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>TableTopCompanion</title>
    <!--bootstrap-->
    <link href="css/bootstrap.min.css" rel="stylesheet">

    <!--Favicons -->
    <link rel="shortcut icon" href="images/icon1.png">

    <!--icon-->
    <link href="font-awesome/css/font-awesome.min.css" rel="stylesheet" type="text/css">

  </head>
  <body>

    <!--menu-->
    <nav class="navbar navbar-default navbar-custom">
      <div class="container">
        <div class="navbar-header">
          <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
            <span class="sr-only">Toggle navigation</span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
          <a class="navbar-brand" href="index.php">Rekomendasi BoardGame</a>
        </div>

        <div class="collapse navbar-collapse">
          <ul class="nav navbar-nav navbar-right">
            <li>
              <a href="kriteria.php">Kriteria</a>
            </li>
            <li>
              <a href="alternatif.php">Alternatif</a>
            </li>
            
            <li>
              <a href="topsis-step-1.php">Hasil Topsis</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <div class="container">

      <div class="row">
        <div class="col-lg-8 col-lg-offset-3">
            <div class="panel panel-default">
                <div class="panel-heading text-center">
                    Alternatif
                </div>

                <ul class="nav nav-tabs">
                    <li>
                      <a href="alternatif.php" data-toggle="tab">Tabel Alternatif</a>
                    </li>
                    <li class="active">
                      <a href="alternatiftambah.php" data-toggle="tab">Tambah Alternatif</a>
                    </li>
                </ul>

                <div class="panel-body">
                    <!-- Tab panes -->
                    <div class="tab-content">
                      <div class="">
                        <!--form alternatif-->
                        <form class="form" action="alternatiftambah.php" method="post">
                          <div class="form-group">
                            <input class="form-control" type="text" name="id_alter" value="<?php echo $kode_otomatis ?>" readonly>
                          </div>
                          <div class="form-group">
                            <input class="form-control" type="text" name="nm_alter" placeholder="Nama Alternatif">
                          </div>
                          <div class="form-group">
                            <select class="form-control" name="genre_alter">
                              <option value="" selected hidden>Genre</option>
                              <?php
                                foreach($genre_array as $genre){
                                ?>
                                <option value="<?php echo $genre['id_genre'] ?>"><?php echo $genre['nama_genre'] ?></option>
                              <?php
                                }
                               ?>
                            </select>  
                          </div>
                          <div class="form-group">
                            <?php $tahun_awal = 2009;
                              $tahun_terbaru = date('Y');
                             ?>
                            <select class="form-control" name="tahun_rilis">
                              <option value="" selected hidden>Tahun Rilis</option>
                               <?php
                                foreach ( range( $tahun_terbaru, $tahun_awal ) as $i ) {
                                  // Prints the option with the next year in range.
                                  echo '<option value="'.$i.'">'.$i.'</option>';
                                } ?>
                            </select>
                          </div>
                          <?php while($row=$datakriteria->fetch_array()){ ?>
                            <?php $step = $row['nama_kriteria'] == 'Rating Overall Cast' ? 'step="0.01"' : ''; ?>
                          <div class="form-group">
                            <input class="form-control" type="number" min="0" max="99" <?php echo $step; ?> name="kriteria[<?php echo $row['id_kriteria']; ?>]" placeholder="<?php echo $row['nama_kriteria']; ?>">
                          </div>
                          <?php } ?>
                          
                          <div class="form-group">
                            <input class="btn btn-success" type="submit" name="simpan" value="Tambah">
                          </div>
                        </form>
                        <!--form alternatif-->
                      </div>
                    </div>
                </div>
                <!--panel body-->
            </div>
          </div>
        </div>

    </div>

    <!--footer-->
    

    <?php

    if (isset($_POST['simpan'])) {
      $id_alter   = $_POST['id_alter'];
      $alternatif = $_POST['nm_alter'];
      $genre_alter = $_POST['genre_alter'];
      $row_kriteria = $_POST['kriteria'];
      $tahun_rilis = $_POST['tahun_rilis'];
     
      $masuk = "";
      $masuk .= "INSERT INTO tab_alternatif VALUES ('".$id_alter."','".$alternatif."', '".$tahun_rilis."', '".$genre_alter."' );";
      foreach($row_kriteria as $key => $k){
        $masuk .= "INSERT INTO tab_topsis VALUES ('".$id_alter."','".$key."', '".$k."');";
      }
      $buat  = $koneksi->multi_query($masuk) or die(mysqli_error());

      echo "<script>alert('Input Data Berhasil') </script>";
      echo "<script>window.location.href = \"alternatif.php\" </script>";
    }

     ?>


    <!--plugin-->
    <script src="js/bootstrap.min.js"></script>

  </body>
</html>
