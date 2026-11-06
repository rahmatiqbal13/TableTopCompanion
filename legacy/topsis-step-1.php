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
                    Pilih bobot yang digunakan
                </div>
                    
                <a href="topsis-step-2.php"><button type="button" class="btn btn-succes btn-block">Bobot sendiri</button></a>
                <br>
                <a href="hastop.php"><button type="button" class="btn btn-succes btn-block">Bobot oleh admin</button></a>
            </div>
        </div>
      </div>

    </div>

    <!--footer-->
    

    <!--plugin-->
    <script src="tampilan/js/bootstrap.min.js"></script>

  </body>
</html>
