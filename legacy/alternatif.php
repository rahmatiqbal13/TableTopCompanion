<?php
//koneksi
session_start();
include ("koneksi.php");

$sql = "SELECT b.id_alternatif, b.nama_alternatif, b.id_genre, d.nama_genre,c.nama_kriteria,a.nilai,c.bobot
FROM
  tab_alternatif b
  JOIN
    tab_topsis a USING(id_alternatif)
  JOIN
    tab_kriteria c USING(id_kriteria)
  JOIN
    tab_genre d USING(id_genre) ";


$is_where = false;
$sql_where = '';

if(isset($_POST['filter_genre']) && $_POST['filter_genre'] != 'all') {
  if(!$is_where)
    $is_where = true;
    
    $sql_where .=  "d.id_genre = '".$_POST['filter_genre']."'";
} 
  
if(isset($_POST['filter_tahun']) && $_POST['filter_tahun'] != 'all'){
    if(!$is_where)
      $is_where = true;
 
    if($sql_where == '')
      $sql_where .=  "b.tahun_rilis = '".$_POST['filter_tahun']."'";

    $sql_where .=  " AND b.tahun_rilis = '".$_POST['filter_tahun']."'";
}

if($is_where){
  $sql = $sql . " WHERE " . $sql_where;
}

$tampil = $koneksi->query($sql);

$data      =array();
$kriterias =array();
$bobot     =array();
$nilai_kuadrat =array();

if ($tampil) {
  while($row=$tampil->fetch_object()){
    if(!isset($data[$row->nama_alternatif])){
      $data[$row->nama_alternatif]=array();
    }
    if(!isset($data[$row->nama_alternatif][$row->nama_kriteria])){
      $data[$row->nama_alternatif][$row->nama_kriteria]=array();
    }
    if(!isset($nilai_kuadrat[$row->nama_kriteria])){
      $nilai_kuadrat[$row->nama_kriteria]=0;
    }

    $bobot[$row->nama_kriteria]=$row->bobot;
    $data[$row->nama_alternatif][$row->nama_kriteria]=$row->nilai;
    $data[$row->nama_alternatif]['Genre']=$row->nama_genre;
    $data[$row->nama_alternatif]['id_alternatif'] = $row->id_alternatif;
    $nilai_kuadrat[$row->nama_kriteria]+=pow($row->nilai,2);
    $kriterias[]=$row->nama_kriteria;
  }
}

$genre = $koneksi->query("SELECT * FROM tab_genre");

while ($row = $genre->fetch_array()){
    $genre_array[] = $row;
}


$kriteria     =array_unique($kriterias);
$jml_kriteria =count($kriteria);
 ?>

<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>TableTopCompanion</title>
    <!--bootstrap-->
    <link href="css/bootstrap.min.css" media="screen" rel="stylesheet" type="text/css" />
    <link href="css/font-awesome/font-awesome.css" media="screen" rel="stylesheet" type="text/css" />
    <link href="css/et-line-font/et-lineicono.css" media="screen" rel="stylesheet" type="text/css" />
    <link href="js/owl-carousel/owl.theme.default.css" media="screen" rel="stylesheet" type="text/css" />
    <link href="js/owl-carousel/owl.carousel.css" media="screen" rel="stylesheet" type="text/css" />
    <link href="css/magnific-popup.css" media="screen" rel="stylesheet" type="text/css" />
    <link href="css/slick.css" media="screen" rel="stylesheet" type="text/css" />
    <link href="css/slick-theme.css" media="screen" rel="stylesheet" type="text/css" />
    <link href="css/style.css" media="screen" rel="stylesheet" type="text/css" />
    <link href="css/responsive.css" media="screen" rel="stylesheet" type="text/css" />

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
            <?php if(isset($_SESSION['status']) && $_SESSION['status'] == 'login'){

?>
<li>
<a href="logout.php">Logout</a>
</li>
<?php 
} else {
?>
<li>
<a href="login.php">Login</a>
</li>
<?php } ?>
          </ul>
        </div>
      </div>
    </nav>

    <div class="container">

      <div class="row">
        <div class="col-lg-12">
            <div class="panel panel-default">
                <div class="panel-heading text-center">
                    Alternatif
                </div>

                <ul class="nav nav-tabs">
                    <li class="active">
                      <a href="alternatif.php" data-toggle="tab">Tabel Alternatif</a>
                    </li>
                    <?php if(isset($_SESSION['user_role']) && $_SESSION['user_role'] == 0) : ?>
                    <li>
                      <a href="alternatiftambah.php" data-toggle="tab">Tambah Alternatif</a>
                    </li>
                  <?php endif; ?>
                </ul>

                <div class="panel-body">
                    <!-- Tab panes -->
                    <div class="tab-content">
                      <div class="">
                  <!--tabel alternatif-->
                <table class="table table-striped table-bordered table-hover" id="table-topsis">
                <thead>
                  <form action="" method="POST">
                    <div class="form-group col-md-3">
                      <select name="filter_genre" class="form-control" id="filter_genre" onchange="this.form.submit()" action="">
                        <option selected disabled hidden value="">Filter Genre</option>
                        <option value="all" <?php echo isset($_POST['filter_genre']) && $_POST['filter_genre'] == 'all' ? 'selected' : '' ?> >Semua Genre</option>
                        <?php foreach($genre_array as $genres => $genre)
                        {
                          $selected = isset($_POST['filter_genre']) && $_POST['filter_genre'] == $genre['id_genre'] ? 'selected' : '';
                          ?>
                          <option <?php echo $selected; ?> value="<?php echo $genre['id_genre']; ?>"><?php echo $genre['nama_genre']; ?></option>
                        <?php
                        } 
                        ?>
                      </select>
                      </div>
                      <div class="form-group col-md-3">
                    </div>
                        <div class="form-group col-md-3">
                            <?php $tahun_awal = 2000;
                              $tahun_terbaru = date('Y');
                             ?>
                            <select class="form-control" name="filter_tahun" id="filter_tahun"  onchange="this.form.submit()" action="">
                              <option value="" selected disabled hidden>Tahun Rilis</option>
                              <option value="all" <?php echo isset($_POST['filter_tahun']) && $_POST['filter_tahun'] == 'all' ? 'selected' : '' ?> >Semua Tahun</option>
                               <?php
                                foreach ( range( $tahun_terbaru, $tahun_awal ) as $i ) {
                                  $selected = $_POST['filter_tahun'] == $i ? 'selected' : '';
                                  // Prints the option with the next year in range.
                                  echo '<option value="'.$i.'" '.$selected.'>'.$i.'</option>';
                                } ?>
                            </select>
                          </div>
                  </form>
                  <tr>
                    <th>No</th>
                    <th>Alternatif</th>
                    <th>Nama</th>
                    <th>Genre</th>
                  
                    <?php

                    foreach($kriteria as $k)
                    echo "<th>$k</th>\n";
                    ?>
                    <?php if(isset($_SESSION['user_role']) && $_SESSION['user_role'] == 0) : ?>
                    <th colspan='2'>Aksi</th>
                    <?php endif; ?>
                  </tr>
                </thead>
                <tbody>
                  <?php
                  $i=0;
                  foreach($data as $nama=>$krit){
                    echo "<tr>
                      <td>".(++$i)."</td>
                      <td>A$i</td>
                      <td>$nama</td>
                      <td>".$krit['Genre']."</td>";

                    foreach($kriteria as $k){
                      echo "<td align='center'>$krit[$k]</td>";
                    }
                    ?>
                    <?php if(isset($_SESSION['user_role']) && $_SESSION['user_role'] == 0) : ?>
                    <td align="center">
                                <a href="editalternatif.php?id_alternatif=<?php echo $krit['id_alternatif'] ?>"> <i class="fa fa-edit fa-fw"></i>
                                </td>
                              <td align="center">
                                <a href="hapusalternatif.php?id_alternatif=<?php echo $krit['id_alternatif'] ?>"> <i class="fa fa-trash fa-fw"></i>
                                </td>
                     <?php endif; ?>           
                  <?php  
                    echo "</tr>\n";
                  }
                  ?>
                </tbody>
              </table>
                        <!--tabel alternatif-->
                      </div>
                    </div>
                </div>
                <!--panel body-->
            </div>
        </div>
      </div>

    </div>

   

    <!--plugin-->

    <script src="js/bootstrap.min.js"></script>

    <script>
    </script>

  </body>
</html>
