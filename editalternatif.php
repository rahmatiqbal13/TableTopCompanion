<?php
//koneksi
session_start();
include ("koneksi.php");

$id_alter   = $_GET['id_alternatif'];
$alternatif = $koneksi->query("SELECT * FROM tab_alternatif WHERE id_alternatif = '".$id_alter."'");

while ($row = $alternatif->fetch_row())
  {
    $nama  = $row[1];
    $genre_alternatif = $row[2];
    $subtitle = $row[3];
    $tahun_rilis = $row[4];
  }

$array_kriteria = array();
$kriteria = $koneksi->query("SELECT * FROM tab_topsis JOIN tab_kriteria USING(id_kriteria) WHERE id_alternatif = '".$id_alter."'");

while($row = $kriteria->fetch_assoc())
{
  $array_kriteria[] = $row;
}


$genre = $koneksi->query("SELECT * FROM tab_genre");

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

    <title>Metode Topsis</title>
    <!--bootstrap-->
    <link href="tampilan/css/bootstrap.min.css" rel="stylesheet">

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

        </div>
      </div>
    </nav>

    <div class="container">

      <div class="row">
        <!--form alternatif-->
        <div class="col-lg-6 col-lg-offset-3">
          <div class="panel panel-default">
            <div class="panel-heading text-center">
              Edit Alternatif
            </div>

            <div class="panel-body">
              <div class="row">
                <div class="col-lg-12">
                  <form class="form" action="edita.php" method="post">
                    <div class="form-group">
                      <input class="form-control" type="hidden" name="id" value="<?php echo $_GET['id_alternatif']; ?>" >
                    </div>
                    <div class="form-group">
                      <label for="Nama Drama">Nama BoardGame</label>
                      <input class="form-control" type="text" name="nama" value="<?php echo isset($nama) ? $nama : ''; ?>" >
                    </div>
                    <div class="form-group">
                      <label for="Genre">Genre</label>
                      <select name="id_genre" class="form-control" id="id_genre">
                        <?php foreach($genre_array as $genres => $genre)
                        {
                          $selected = isset($genre_alternatif) && $genre_alternatif == $genre['id_genre'] ? 'selected' : '';
                          ?>
                          <option <?php echo $selected; ?> value="<?php echo $genre['id_genre']; ?>"><?php echo $genre['nama_genre']; ?></option>
                        <?php
                        } 
                        ?>
                      </select>
                    </div>
                    <div class="form-group">
                      <label for="Genre">Subtitle</label>
                      <select name="subtitle" class="form-control" id="subtitle">
                        <option value="all">Semua</option>
                        <option value="0" <?php echo isset($subtitle) && $subtitle == 0 ? 'selected' : '' ?>>Tidak Ada</option>
                        <option value="1" <?php echo isset($subtitle) && $subtitle == 1 ? 'selected' : '' ?>>Ada</option>
                      </select>
                    </div>
                        <div class="form-group">
                            <?php $tahun_awal = 2009;
                              $tahun_terbaru = date('Y');
                             ?>
                             <label for="tahun_rilis">Tahun Rilis</label>
                            <select class="form-control" name="tahun_rilis">
                              <option value="" selected hidden>Tahun Rilis</option>
                               <?php
                                foreach ( range( $tahun_terbaru, $tahun_awal ) as $i ) {
                                  $selected = $tahun_rilis == $i ? 'selected' : '';
                                  // Prints the option with the next year in range.
                                  echo '<option value="'.$i.'" '.$selected.'>'.$i.'</option>';
                                } ?>
                            </select>
                          </div>
                    <?php foreach($array_kriteria as $k => $v) : ?>
                    <div class="form-group">
                      <label for="<?php echo $v['nama_kriteria']; ?>"><?php echo $v['nama_kriteria']; ?></label>
                      <input class="form-control" type="text" name="kriteria[<?php echo $v['id_kriteria']; ?>]" value="<?php echo $v['nilai']; ?>" >
                    </div>
                    <?php endforeach; ?>
                    <div class="form-group">
                      <button type="submit" class="btn btn-success">Ubah</button>
                      <a href="alternatif.php"><button type="button" class="btn btn-danger">Batal</button></a>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!--form alternatif-->

      </div>
    </div>

    <!--footer-->
    

    <!--plugin-->
    <script src="tampilan/js/bootstrap.min.js"></script>

  </body>
</html>
