<?php
//koneksi
session_start();
include ("koneksi.php");
if(isset($_GET['is_user'])){
  $sql_tabel = 'tab_kriteria_user';
}else{
  $sql_tabel = 'tab_kriteria';
}
$sql = "SELECT b.id_alternatif, b.nama_alternatif, b.id_genre, d.nama_genre,c.nama_kriteria,a.nilai,c.bobot, c.tipe, b.link_url
FROM
  tab_alternatif b
  JOIN
    tab_topsis a USING(id_alternatif)
  JOIN
    ".$sql_tabel." c USING(id_kriteria)
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
    $data[$row->nama_alternatif]['link_url'] = $row->link_url;
    $nilai_kuadrat[$row->nama_kriteria]+=pow($row->nilai,2);
    $kriterias[]=$row->nama_kriteria;
  }
}


$genre = $koneksi->query("SELECT * FROM tab_genre");

while ($row = $genre->fetch_array()){
    $genre_array[] = $row;
}

$tampil_kriteria = $koneksi->query("SELECT * FROM ".$sql_tabel);

while ($row = $tampil_kriteria->fetch_array()){
    $kriteria_array[] = $row;
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

    <!--tabel-tabel-->
    <div class="container"> <!--container-->
      <div class="row">
      	<div class="col-lg-12">
      	  <div class="panel panel-default">
      	    <div class="panel-heading">
              Matriks Keputusan (x<sub>ij</sub>)
      	    </div>
            <div class="panel-body">
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
              <table id="table_alternatif" class="table table-striped table-bordered table-hover">
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
      	<div class="col-lg-12">
      	  <div class="panel panel-default">
      	    <div class="panel-heading">
            <div class="panel panel-default">
            <div class="panel-heading">
              Rating Kinerja Ternormalisasi (r<sub>ij</sub>)
            </div>
            <div class="panel-body">
              <table id="table_ternormalisasi"class="table table-striped table-bordered table-hover">
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
      	<div class="col-lg-12">
      	  <div class="panel panel-default">
      	    <div class="panel-heading">
            <div class="panel panel-default">
            <div class="panel-heading">
              Rating Bobot Ternormalisasi(y<sub>ij</sub>)
            </div>
            <div class="panel-body">
              <table id="table_terbobot"class="table table-striped table-bordered table-hover">
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
      	<div class="col-lg-12">
      	  <div class="panel panel-default">
      	    <div class="panel-heading">
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
                    foreach($kriteria_array as $item){
                      $k = $item['nama_kriteria'];
                      $tipe = $item['tipe'];
                      $yplus[$k] = ($tipe == 'max'? max($y[$k]) : min($y[$k]) );
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
      	<div class="col-lg-12">
      	  <div class="panel panel-default">
      	    <div class="panel-heading">
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
                    foreach($kriteria_array as $item){
                      $k = $item['nama_kriteria'];
                      $tipe = $item['tipe'];
                      $ymin[$k] = ( $tipe == 'min' ? max($y[$k]) : min($y[$k]) );
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
      	<div class="col-lg-12">
      	  <div class="panel panel-default">
      	    <div class="panel-heading">
            <div class="panel panel-default">
            <div class="panel-heading">
              Jarak positif (D<sub>i</sub><sup>+</sup>)
            </div>
            <div class="panel-body">
              <table id="table_dplus"class="table table-striped table-bordered table-hover">
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
                    $dplus[$i-1] = round(sqrt($dplus[$i-1]),6); 
                    echo "<td>". $dplus[$i-1]."</td>
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
      	<div class="col-lg-12">
      	  <div class="panel panel-default">
      	    <div class="panel-heading">
            <div class="panel panel-default">
            <div class="panel-heading">
              Jarak negatif (D<sub>i</sub><sup>-</sup>)
            </div>
            <div class="panel-body">
              <table id="table_dmin" class="table table-striped table-bordered table-hover">
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
                  echo " <tr>
                      <td>".(++$i)."</td>
                      <th>A{$i}</th>
                      <td>{$nama}</td>";
                    foreach($kriteria as $k){
                      if(!isset($dmin[$i-1]))$dmin[$i-1]=0;
                      $dmin[$i-1]+=pow($ymin[$k]-$y[$k][$i-1],2);
                    }
                    $dmin[$i-1] = round(sqrt($dmin[$i-1]),6); 
                   echo "<td>" .$dmin[$i-1]."</td>
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
        <div class="col-lg-12">
          <div class="panel panel-default">
            <div class="panel-heading">
              Nilai Preferensi(V<sub>i</sub>)
            </div>
            <div class="panel-body">
              <table id="tabel-data" class="table table-striped table-bordered table-hover">
                <thead>
                  <tr>
                    <th>No</th>
                 
                    <th>Nama</th>
                    <th>Performance Score</th>
                    <th>Rangking</th>
                  </tr>
                </thead>
                <tbody>
                  <?php
                  $i=0;
                  $data_v=array();
                  $rank=1;
                 

                  
                  foreach($data as $nama=>$krit){
                    $V['no'] = (++$i);
                    $V['nama'] = $nama;
                    $V['rank'] = ($rank++);
                    $V['link_url'] = $krit['link_url'];
                    // foreach($kriteria as $k)
                    // {
                      if($dmin[0] != 0 && $dplus[0] != 0){
                        $V[$i-1]=$dmin[$i-1]/($dmin[$i-1]+$dplus[$i-1]);
                      }
                      else 
                      {
                        $V[$i-1]= 0;
                      }
                    // }
                    
                    $V['VI'] = $V[$i-1];
                    $data_v[] = $V;
                    $V['rank'] = $V[$i-1];
                    $data_rank[] = $rank;
                  }
                  function cmp($a, $b){    
                    return strcmp($b['VI'], $a['VI']);
                    return strcmp($b['rank'], $a['rank']);
                  }

                  usort($data_v, "cmp");
                  usort($data_rank, "cmp");
                  foreach($data_v as $goblok){
                    echo "<tr>
                      <td>".$goblok['no']."</td>
                     
                      <td><a href='{$goblok['link_url']}'>{$goblok['nama']}</a></td>";                    
                    echo "<td>{$goblok['VI']}</td>
                    <td></td></tr>\n"                             ;
                  }
                  ?>
                </tbody>
              </table>
              <p id="date"></p>
            </div>
          </div>
        </div>
      </div>
    </div> <!--container-->

    <!--footer-->
    

    <!--plugin-->
    <script src="js/bootstrap.min.js"></script>
    <script src="https://code.jquery.com/jquery-3.1.0.js"></script>
    <script src="https://cdn.datatables.net/1.10.12/js/dataTables.bootstrap.min.js"></script>
<script src="//cdn.datatables.net/1.10.12/js/jquery.dataTables.min.js"></script>
<link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" />
<link rel="stylesheet" href="https://cdn.datatables.net/1.10.12/css/dataTables.bootstrap.min.css" />
<script>
    $(document).ready(function() {
      n =  new Date();
y = n.getFullYear();
m = n.getMonth() + 1;
d = n.getDate();
document.getElementById("date").innerHTML = "Data diolah pada tanggal: " +m + "/" + d + "/" + y;

    $('#tabel-data').dataTable( {
        lengthMenu: [[5, 10, 25, -1], [5, 10, 25, "All"]],
        drawCallback: function () {
          api = this.api();
          var arr = api.columns(2).data()[0];  //get array of column 3 (extn)
          var sorted = arr.slice().sort(function(a,b){return b-a});
          var ranks = arr.slice().map(function(v){ return sorted.indexOf(v)+1 });
          // interate through each row
          api.rows().every( function ( rowIdx, tableLoop, rowLoop ) {
            var data = this.data();
            data[3] = ranks[arr.indexOf(data[2])];  //set the rank column = the array index of the extn in the ranked array
            // $('#tabel-data tbody tr:eq('+rowIdx+') td:eq(3)').html(ranks[arr.indexOf(data[2])]);
            this.data(data);
          } );
        api.rows().invalidate();
      }
    } );

    $('#table_alternatif').dataTable( {
        lengthMenu: [[5, 10, 25, -1], [5, 10, 25, "All"]]
    } );
    $('#table_ternormalisasi').dataTable( {
        lengthMenu: [[5, 10, 25, -1], [5, 10, 25, "All"]]
    } );

    $('#table_terbobot').dataTable( {
        lengthMenu: [[5, 10, 25, -1], [5, 10, 25, "All"]]
    } );

    $('#table_dplus').dataTable( {
        lengthMenu: [[5, 10, 25, -1], [5, 10, 25, "All"]]
    } );

    $('#table_dmin').dataTable( {
        lengthMenu: [[5, 10, 25, -1], [5, 10, 25, "All"]]
    } );

} );
    
</script>

  </body>
</html>
