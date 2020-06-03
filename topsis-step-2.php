<?php
//koneksi
session_start();
include ("koneksi.php");

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
    <link href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.10.1/themes/base/jquery-ui.css" rel="stylesheet" type="text/css" />

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
        <div class="col-lg-6 col-lg-offset-3">
            <div class="panel panel-default">
                <div class="panel-heading text-center">
                    Panduan Pengisian Bobot
                </div>
                <div class="panel-body">
                    <!-- Tab panes -->
                    <div class="tab-content">
                      <div class="">
                        <!--tabel kriteria-->
                        <table class="table table-striped table-bordered table-hover">
                          <thead>
                            <tr>
                              <th>No.</th>
                              <th>Panduan</th>
                             
                            </tr>
                          </thead>
                          <tbody>
                            <tr> 
                              <td>1</td>
                              <td>Geser slider atau masukkan nilai yang anda inginkan pada masing-masing kolom</td>
                            </tr>
                            <tr> 
                              <td>2</td>
                              <td>Nilai dalam masing-masing kolom akan ditotal dan nilai total tidak boleh melebihi 100</td>
                            </tr>
                            <tr> 
                              <td>3</td>
                              <td>Apabila nilai bobot setiap kriteria sudah sesuai dengan yang anda inginkan silahkan pilih tombol simpan</td>
                            </tr>

                        
                          </tbody>
                        </table>
                        <!--tabel kriteria-->
                      </div>
                    </div>
                </div>

                
                        <!--tabel kriteria-->
                      
                  
                
            </div>
        </div>
      </div>

    </div>

    <div class="row">
        <div class="col-lg-6 col-lg-offset-3">
            <div class="panel panel-default">
                <div class="panel-heading text-center">
                    Panduan Pengisian Preferensi
                </div>
                <div class="panel-body">
                    <!-- Tab panes -->
                    <div class="tab-content">
                      <div class="">
                        <!--tabel kriteria-->
                        <table class="table table-striped table-bordered table-hover">
                          <thead>
                            <tr>
                              <th>Kriteria</th>
                              <th>Pertanyaan</th>
                              <th>Keterangan 1</th>
                              <th>Keterangan 2</th>
                             
                            </tr>
                          </thead>
                          <tbody>
                            <tr> 
                              <td>Pemain Minimal</td>
                              <td>Apakah anda ingin bermain dengan banyak orang atau hanya dengan sedikit orang?</td>
                              <td>Pilih Nilai Maksimal Untuk Banyak Orang</td>
                              <td>Pilih Nilai Minimal Untuk Orang Sedikit</td>
                            </tr>
                            <tr> 
                              <td>Rating Rata-Rata</td>
                              <td>Apakah anda ingin bermain dengan boardgame yang memiliki nilai rata-rata baik atau rendah?</td>
                              <td>Pilih Nilai Maksimal Untuk Nilai rata-rata baik</td>
                              <td>Pilih Nilai Minimal Untuk Nilai rata-rata terendah</td>
                            </tr>
                            <tr> 
                              <td>Kompleksitas Permainan</td>
                              <td>Bagimana tingakat kesulitan boardgame yang anda ingin mainkan?</td>
                              <td>Pilih Nilai Nilai Maksimal Untuk Sulit</td>
                              <td>Pilih Nilai Minimal Untuk Mudah</td>
                            </tr>
                            <tr> 
                              <td>Lama Permainan</td>
                              <td>Apakah anda ingin bermain dengan boardgame dalam waktu lama atau sebentar?</td>
                              <td>Pilih Nilai Maksimal Untuk Lama</td>
                              <td>Pilih Nilai Minimal Untuk Sebentar</td>
                            </tr>
                            <tr> 
                              <td>Rekomendasi Umur</td>
                              <td>Apakah anda ingin bermain dengan dengan anak-anak atau dewasa?</td>
                              <td>Pilih Nilai Maksimal Untuk Dewasa</td>
                              <td>Pilih Nilai Minimal Untuk Anak-anak</td>
                            </tr>

                        
                          </tbody>
                        </table>
                        <!--tabel kriteria-->
                      </div>
                    </div>
                </div>

                
                        <!--tabel kriteria-->
                      
                  
                
            </div>
        </div>
      </div>

    </div>

    <div class="container">

      <div class="row">
        <div class="col-lg-12">
            <div class="panel panel-default">
                <div class="panel-heading text-center">
                    Isi Kriteria sesuai bobot dari Anda
                </div>

                <div class="panel-body">
                    <!-- Tab panes -->
                    <div class="tab-content">
                      <div class="">
                      <form class="form" action="submitktuser.php" method="post">
                        <!--tabel kriteria-->
                        <table class="table table-striped table-bordered table-hover">
                          <thead>
                            <tr>
                              <th>ID Kriteria</th>
                              <th>Nama Kriteria</th>
                              <th>Input Bobot</th>
                              <th>Preferensi Anda</th>
                            </tr>
                          </thead>
                          <tbody>
                            <?php
                            $sql = $koneksi->query('SELECT * FROM tab_kriteria');
                            while ($row = $sql->fetch_array()) {
                            ?>
                            
                            <tr>
                              <td><?php echo $row[0] ?></td>
                              <td><?php echo $row[1] ?></td>
                              <td>
                              <div id="slider<?php echo $row[0] ?>" data-id="<?php echo $row[0] ?>" class="slider"></div>
                                <input id="input_slider_<?php echo $row[0] ?>" type="text" name="bobot[<?php echo $row[0] ?>]" value="0">
                            </td>
                              <td>
                              <div class="form-group">
                          <select name="tipe[<?php echo $row[0] ?>]" class="form-control" >
                        <option  value="max">Nilai Maksimal</option>
                        <option  value="min">Nilai Minimal</option>
                          </select>
                        </div>
                              </td>
                            </tr>
                            

                            <?php } ?>
                            
                          </tbody>
                        </table>
                        <!--tabel kriteria-->
                        <button type="submit" class="btn btn-succes btn-block">Simpan</button>
                        </form>
                            Makmisum bobot adalah 100<br>
                            Bobot saat ini <div id="total"></div>

                      </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

    </div>
    
    <!--footer-->
    

    <!--plugin-->
    <script src="tampilan/js/bootstrap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.4/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
    <script> 
        $('.slider').slider({
            min: 0,
            max: 100,
            slide: function (ev, ui) {
                var total = ui.value;
                $('.slider').not(this).each(function () {
                    total += $(this).slider('value');
                })
                if (total > 100) {
                    return false;
                }
            },
            change: function(ev, ui) {
                var total = ui.value;
                $('.slider').not(this).each(function () {
                    total += $(this).slider('value');
                })
                $('#input_slider_' + $(this).data('id')).val(ui.value);
                $('#total').text(total);
            }
        });
        </script>
  </body>
</html>
