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
                    Kriteria
                </div>

                <ul class="nav nav-tabs">
                    <li class="active">
                      <a href="kriteria.php" data-toggle="tab">Tabel Kriteria</a>
                    </li>
                    <?php if(isset($_SESSION['user_role']) && $_SESSION['user_role'] == 0) : ?>
                    <li>
                      <a href="kriteriatambah.php" data-toggle="tab">Tambah Kriteria</a>
                    </li>
                  <?php endif; ?>
                    

                <div class="panel-body">
                    <!-- Tab panes -->
                    <div class="tab-content">
                      <div class="">
                        <!--tabel kriteria-->
                        <table class="table table-striped table-bordered table-hover">
                          <thead>
                            <tr>
                              <th>ID Kriteria</th>
                              <th>Nama Kriteria</th>
                              <th>Bobot</th>
                              <th>Tipe</th>
                              <?php if(isset($_SESSION['user_role']) && $_SESSION['user_role'] == 0) : ?>
                              <th colspan="2">Aksi</th>
                              <?php endif; ?>
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
                              <td><?php echo $row[2] ?></td>
                              <td><?php echo $row[3] ?></td>
                              <?php if(isset($_SESSION['user_role']) && $_SESSION['user_role'] == 0) : ?>
                              <td align="center">
                                <a href="editkriteria.php?id_kriteria=<?php echo $row['id_kriteria'] ?>"> <i class="fa fa-edit fa-fw"></i>
                                </td>
                              <td align="center">
                                <a href="hapuskriteria.php?id_kriteria=<?php echo $row['id_kriteria'] ?>"> <i class="fa fa-trash fa-fw"></i>
                                </td>
                                <?php endif; ?>
                                
                            </tr>
                            

                            <?php } ?>
                            
                          </tbody>
                        </table>
                        <!--tabel kriteria-->
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

  </body>
</html>
