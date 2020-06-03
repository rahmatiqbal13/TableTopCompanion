<?php 
session_start();
include('koneksi.php');

if(isset($_POST['submit']))
{
  $username = $_POST['username'];
  $password = md5($_POST['password']);

  $user = mysqli_query($koneksi, "INSERT INTO tab_user (user_name, user_password, user_role) VALUES('".$username."','".$password."', 1)");

  if($user)
  {
    header("location:login.php");
  }
}
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

    <!--icon-->
    <link href="tampilan/font-awesome/css/font-awesome.min.css" rel="stylesheet" type="text/css">

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
          </ul>
        </div>
      </div>
    </nav>

    <div class="container">

      <div class="row">
        <div class="col-lg-8 col-lg-offset-3">
            <div class="panel panel-default">
                <div class="panel-heading text-center">
                    Register
                </div>
                <div class="panel-body">
                    <!-- Tab panes -->
                    <div class="tab-content">
                      <div class="">
                        <form class="form" action="" method="post">
                          <div class="form-group">
                            <label for="username">Username</label>
                            <input type="text" class="form-control" name="username" id="username" required placeholder="Username">
                          </div>
                          <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" class="form-control" name="password" id="password" required placeholder="Password">
                          </div>
                          <input class="btn btn-success" type="submit" name="submit" value="Register">
                        </form>
                      </div>
                    </div>
                </div>
                <!--panel body-->
            </div>
        </div>
      </div>

    </div>

   

    <!--plugin-->
    <script src="tampilan/js/jquery-3.4.1.min.js"></script>
    <script src="tampilan/js/bootstrap.min.js"></script>

  </body>
</html>
