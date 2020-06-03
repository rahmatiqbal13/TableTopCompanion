<?php
//koneksi
session_start();
include ("koneksi.php");

if(isset($_POST['filter_genre']) && $_POST['filter_genre'] == 'all' && isset($_POST['filter_subtitle']) && $_POST['filter_subtitle'] == 'all') 
{
  $tampil = $koneksi->query("SELECT b.id_alternatif, b.nama_alternatif, b.id_genre, b.subtitle, d.nama_genre,c.nama_kriteria,a.nilai,c.bobot
        FROM
          tab_alternatif b
          JOIN
            tab_topsis a USING(id_alternatif)
          JOIN
            tab_kriteria c USING(id_kriteria)
          JOIN
            tab_genre d ON b.id_genre = d.id_genre");
} elseif(isset($_POST['filter_genre']) && $_POST['filter_genre'] != 'all' && isset($_POST['filter_subtitle']) && $_POST['filter_subtitle'] == 'all')
{
  $tampil = $koneksi->query("SELECT b.id_alternatif, b.nama_alternatif, b.id_genre, b.subtitle, d.nama_genre,c.nama_kriteria,a.nilai,c.bobot
        FROM
          tab_alternatif b
          JOIN
            tab_topsis a USING(id_alternatif)
          JOIN
            tab_kriteria c USING(id_kriteria)
          JOIN
            tab_genre d ON b.id_genre = d.id_genre
          WHERE
            d.id_genre = '".$_POST['filter_genre']."'"); 
}
elseif(isset($_POST['filter_genre']) && $_POST['filter_genre'] == 'all' && isset($_POST['filter_subtitle']) && $_POST['filter_subtitle'] != 'all')
{
  $tampil = $koneksi->query("SELECT b.id_alternatif, b.nama_alternatif, b.id_genre, b.subtitle, d.nama_genre,c.nama_kriteria,a.nilai,c.bobot
        FROM
          tab_alternatif b
          JOIN
            tab_topsis a USING(id_alternatif)
          JOIN
            tab_kriteria c USING(id_kriteria)
          JOIN
            tab_genre d ON b.id_genre = d.id_genre
          WHERE
            b.subtitle = '".$_POST['filter_subtitle']."'");
}
elseif(isset($_POST['filter_genre']) && isset($_POST['filter_subtitle']))
{
   $tampil = $koneksi->query("SELECT b.id_alternatif, b.nama_alternatif, b.id_genre, b.subtitle, d.nama_genre,c.nama_kriteria,a.nilai,c.bobot
        FROM
          tab_alternatif b
          JOIN
            tab_topsis a USING(id_alternatif)
          JOIN
            tab_kriteria c USING(id_kriteria)
          JOIN
            tab_genre d ON b.id_genre = d.id_genre
          WHERE
            d.id_genre = '".$_POST['filter_genre']."' AND b.subtitle = '".$_POST['filter_subtitle']."'"); 
}
elseif(isset($_POST['filter_subtitle']) && $_POST['filter_subtitle'] != 'all')
{
   $tampil = $koneksi->query("SELECT b.id_alternatif, b.nama_alternatif, b.id_genre, b.subtitle, d.nama_genre,c.nama_kriteria,a.nilai,c.bobot
        FROM
          tab_alternatif b
          JOIN
            tab_topsis a USING(id_alternatif)
          JOIN
            tab_kriteria c USING(id_kriteria)
          JOIN
            tab_genre d ON b.id_genre = d.id_genre
          WHERE
            b.subtitle = '".$_POST['filter_subtitle']."'"); 
}
elseif(isset($_POST['filter_genre']) && $_POST['filter_genre'] != 'all')
{
 $tampil = $koneksi->query("SELECT b.id_alternatif, b.nama_alternatif, b.id_genre, b.subtitle, d.nama_genre,c.nama_kriteria,a.nilai,c.bobot
        FROM
          tab_alternatif b
          JOIN
            tab_topsis a USING(id_alternatif)
          JOIN
            tab_kriteria c USING(id_kriteria)
          JOIN
            tab_genre d ON b.id_genre = d.id_genre
          WHERE
            d.id_genre = '".$_POST['filter_genre']."'"); 
} 
else
{
  $tampil = $koneksi->query("SELECT b.id_alternatif, b.nama_alternatif, b.id_genre, b.subtitle, d.nama_genre,c.nama_kriteria,a.nilai,c.bobot
        FROM
          tab_alternatif b
          JOIN
            tab_topsis a USING(id_alternatif)
          JOIN
            tab_kriteria c USING(id_kriteria)
          JOIN
            tab_genre d ON b.id_genre = d.id_genre");
}

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
    $data[$row->nama_alternatif]['subtitle'] = $row->subtitle;
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

    <title>DRAMARANKS</title>
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
          <a class="navbar-brand" href="index.php">Rangking Drama Jepang</a>
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

    <!--tabel-tabel-->
    <div class="container"> <!--container-->
      <div class="row">
      	<div class="col-lg-8 col-lg-offset-2">
      	  <div class="panel panel-default">
      	    <div class="panel-heading">
              Matriks Keputusan (x<sub>ij</sub>)
      	    </div>
            <div class="panel-body">
              <table class="table table-striped table-bordered table-hover">
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
                      <select name="filter_subtitle" class="form-control" id="filter_subtitle" onchange="this.form.submit()" action="">
                        <option selected disabled hidden value="">Filter Subtitle</option>
                        <option value="all"  <?php echo isset($_POST['filter_subtitle']) && $_POST['filter_subtitle'] == 'all' ? 'selected' : '' ?>>Semua</option>
                        <option value="0" <?php echo isset($_POST['filter_subtitle']) && $_POST['filter_subtitle'] == '0' ? 'selected' : '' ?>>Tidak Ada</option>
                        <option value="1" <?php echo isset($_POST['filter_subtitle']) && $_POST['filter_subtitle'] == 1 ? 'selected' : '' ?>>Ada</option>
                      </select>
                    </div>
                  </form>
                <thead>
                  <tr>
                    <th rowspan='3'>No</th>
                    <th rowspan='3'>Alternatif</th>
                    <th rowspan='3'>Nama</th>
                   
                    <th colspan='<?php echo $jml_kriteria;?>'>Kriteria</th>
                  </tr>
                  <tr>
                    <?php
                    foreach($kriteria as $k)
                      echo "<th>$k</th>\n";
                    ?>
                  </tr>
                  <tr>
                    <?php
                    for($n=1;$n<=$jml_kriteria;$n++)
                      echo "<th>K$n</th>";
                    ?>
                  </tr>
                </thead>
                <tbody>
                  <?php
                  $i=0;
                  foreach($data as $nama=>$krit){
                    $subtitle = $krit['subtitle'] == 0 ? 'Tidak Ada' : 'Ada';
                    echo "<tr>
                      <td>".(++$i)."</td>
                      <th>A$i</th>
                      <td>$nama</td>
                      
                      ";
                    foreach($kriteria as $k){
                      echo "<td align='center'>$krit[$k]</td>";
                    }
                    echo "</tr>\n";
                  }
                  ?>
                </tbody>
              </table>
            </div>
      	  </div>
      	</div>
      </div>

    <div class="row">
        <div class="col-lg-8 col-lg-offset-2">
          <div class="panel panel-default">
            <div class="panel-heading">
              Normalisasi(r<sub>ij</sub>)
            </div>
            <div class="panel-body">
              <table class="table table-striped table-bordered table-hover">
                <thead>
                  <tr>
                    <th rowspan='3'>No</th>
                    <th rowspan='3'>Alternatif</th>
                    <th rowspan='3'>Nama</th>
                    <th colspan='<?php echo $jml_kriteria;?>'>Kriteria</th>
                  </tr>
                  <tr>
                    <?php
                    foreach($kriteria as $k)
                      echo "<th>$k</th>\n";
                    ?>
                  </tr>
                  <tr>
                    <?php
                    for($n=1;$n<=$jml_kriteria;$n++)
                      echo "<th>K$n</th>";
                    ?>
                  </tr>
                </thead>
                <tbody>
                  <?php
                  $i=0;
                  foreach($data as $nama=>$krit){
                    echo "<tr>
                      <td>".(++$i)."</td>
                      <th>A{$i}</th>
                      <td>{$nama}</td>";
                    foreach($kriteria as $k){
                      echo "<td align='center'>".round(($krit[$k]/sqrt($nilai_kuadrat[$k])),4)."</td>";
                    }
                    echo
                     "</tr>\n";
                  }
                  ?>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-lg-8 col-lg-offset-2">
          <div class="panel panel-default">
            <div class="panel-heading">
             Normalisasi Terbobot(y<sub>ij</sub>)
            </div>
            <div class="panel-body">
              <table class="table table-striped table-bordered table-hover">
                <thead>
                  <tr>
                    <th rowspan='3'>No</th>
                    <th rowspan='3'>Alternatif</th>
                    <th rowspan='3'>Nama</th>
                    <th colspan='<?php echo $jml_kriteria;?>'>Kriteria</th>
                  </tr>
                  <tr>
                    <?php
                    foreach($kriteria as $k)
                      echo "<th>$k</th>\n";
                    ?>
                  </tr>
                  <tr>
                    <?php
                    for($n=1;$n<=$jml_kriteria;$n++)
                      echo "<th>K$n</th>";
                    ?>
                  </tr>
                </thead>
                <tbody>
                  <?php
                  $i=0;
                  $y=array();
                  foreach($data as $nama=>$krit){
                    echo "<tr>
                      <td>".(++$i)."</td>
                      <th>A{$i}</th>
                      <td>{$nama}</td>";
                    foreach($kriteria as $k){
                      $y[$k][$i-1]=round(($krit[$k]/sqrt($nilai_kuadrat[$k])),4)*$bobot[$k];
                      echo "<td align='center'>".$y[$k][$i-1]."</td>";
                    }
                    echo
                     "</tr>\n";
                  }
                  ?>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-lg-8 col-lg-offset-2">
          <div class="panel panel-default">
            <div class="panel-heading">
              Solusi Ideal positif (A<sup>+</sup>)
            </div>
            <div class="panel-body">
              <table class="table table-striped table-bordered table-hover">
                <thead>
                  <tr>
                    <th colspan='<?php echo $jml_kriteria;?>'>Kriteria</th>
                  </tr>
                  <tr>
                    <?php
                    foreach($kriteria as $k)
                      echo "<th>$k</th>\n";
                    ?>
                  </tr>
                  <tr>
                    <?php
                    for($n=1;$n<=$jml_kriteria;$n++)
                      echo "<th>y<sub>{$n}</sub><sup>+</sup></th>";
                    ?>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <?php
                    $yplus=array();
                    foreach($kriteria as $k){
                      $yplus[$k]=([$k]?max($y[$k]):min($y[$k]));
                      echo "<th>$yplus[$k]</th>";
                    }
                    ?>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-lg-8 col-lg-offset-2">
          <div class="panel panel-default">
            <div class="panel-heading">
              Solusi Ideal negatif (A<sup>-</sup>)
            </div>
            <div class="panel-body">
              <table class="table table-striped table-bordered table-hover">
                <thead>
                  <tr>
                    <th colspan='<?php echo $jml_kriteria;?>'>Kriteria</th>
                  </tr>
                  <tr>
                    <?php
                    foreach($kriteria as $k)
                      echo "<th>{$k}</th>\n";
                    ?>
                  </tr>
                  <tr>
                    <?php
                    for($n=1;$n<=$jml_kriteria;$n++)
                      echo "<th>y<sub>{$n}</sub><sup>-</sup></th>";
                    ?>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <?php
                    $ymin=array();
                    foreach($kriteria as $k){
                      $ymin[$k]=[$k]?min($y[$k]):max($y[$k]);
                      echo "<th>{$ymin[$k]}</th>";
                    }

                    ?>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-lg-8 col-lg-offset-2">
          <div class="panel panel-default">
            <div class="panel-heading">
              Jarak positif (D<sub>i</sub><sup>+</sup>)
            </div>
            <div class="panel-body">
              <table class="table table-striped table-bordered table-hover">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Alternatif</th>
                    <th>Nama</th>
                    <th>D<suo>+</sup></th>
                  </tr>
                </thead>
                <tbody>
                  <?php
                  $i=0;
                  $dplus=array();
                  foreach($data as $nama=>$krit){
                    echo "<tr>
                      <td>".(++$i)."</td>
                      <th>A{$i}</th>
                      <td>{$nama}</td>";
                    foreach($kriteria as $k){
                      if(!isset($dplus[$i-1])) $dplus[$i-1]=0;
                      $dplus[$i-1]+=pow($yplus[$k]-$y[$k][$i-1],2);
                    }
                    echo "<td>".round(sqrt($dplus[$i-1]),6)."</td>
                     </tr>\n";
                  }
                  ?>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-lg-8 col-lg-offset-2">
          <div class="panel panel-default">
            <div class="panel-heading">
              Jarak negatif (D<sub>i</sub><sup>-</sup>)
            </div>
            <div class="panel-body">
              <table class="table table-striped table-bordered table-hover">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Alternatif</th>
                    <th>Nama</th>
                    <th>D<suo>-</sup></th>
                  </tr>
                </thead>
                <tbody>
                  <?php
                  $i=0;
                  $dmin=array();
                  foreach($data as $nama=>$krit){
                    echo "<tr>
                      <td>".(++$i)."</td>
                      <th>A{$i}</th>
                      <td>{$nama}</td>";
                    foreach($kriteria as $k){
                      if(!isset($dmin[$i-1]))$dmin[$i-1]=0;
                      $dmin[$i-1]+=pow($ymin[$k]-$y[$k][$i-1],2);
                    }
                    echo "<td>".round(sqrt($dmin[$i-1]),6)."</td>
                     </tr>\n";
                  }
                  ?>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div> 

      <div class="row">
        <div class="col-lg-8 col-lg-offset-2">
          <div class="panel panel-default">
            <div class="panel-heading">
              Nilai Preferensi(V<sub>i</sub>)
            </div>
            <div class="panel-body">
              <table class="table table-striped table-bordered table-hover">
                <thead>
                  <tr>
                    <th>No</th>
                 
                    <th>Nama</th>
                    <th>V<sub>i</sub></th>
                  </tr>
                </thead>
                <tbody>
                  <?php
                  $i=0;
                  $data_v=array();

                  
                  foreach($data as $nama=>$krit){
                    $V['no'] = (++$i);
                    $V['nama'] = $nama;
                    foreach($kriteria as $k)
                    {
                      if($dmin[0] != 0 && $dplus[0] != 0){
                        $V[$i-1]=$dmin[$i-1]/($dmin[$i-1]+$dplus[$i-1]);
                      }
                      else 
                      {
                        $V[$i-1]= 0;
                      }
                    }
                    
                    $V['VI'] = $V[$i-1];
                    $data_v[] = $V;
                  }
                  function cmp($a, $b){    
                    return strcmp($b['VI'], $a['VI']);
                  }

                  usort($data_v, "cmp");
                  foreach($data_v as $goblok){
                    echo "<tr>
                      <td>".$goblok['no']."</td>
                     
                      <td>{$goblok['nama']}</td>";                    
                    echo "<td>{$goblok['VI']}</td></tr>\n";
                  }
                  ?>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div> <!--container-->

    <!--footer-->
    

    <!--plugin-->
    <script src="tampilan/js/bootstrap.min.js"></script>

  </body>
</html>
