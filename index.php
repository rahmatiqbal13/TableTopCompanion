<?php
//koneksi
session_start();
include "koneksi.php";

 ?>
 <!doctype html>
    <html>
    <head>
    <meta charset="utf-8">
    <meta content='width=device-width, initial-scale=1.0' name='viewport'>
    <title>TableTopCompanion</title>
    
    <!-- Mobile Specific Metas -->
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    	
    <!--Favicons -->
    <link rel="shortcut icon" href="images/icon1.png">     

    <!--styles -->
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
     <!-- The HTML5 shim, for IE6-8 support of HTML5 elements -->
        <!--[if lt IE 9]>
        <script src="js/html5shiv.js"></script>
        <script src="js/respond.min.js"></script>
    <![endif]-->
        
    </head>
  

  <body  data-spy="scroll" data-target="#main-menu">
 
   <!--Start Page loader -->
   <div id="pageloader">   
        <div class="loader">
          <img src="images/progress.gif" alt='loader' />
        </div>
   </div>
   <!--End Page loader -->
      
    <!--Start Navigation-->
		<header id="header">
				<div class="container">
					<div class="row">
						<div class="col-sm-12">
							<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#main-menu">
								<span class="sr-only">Toggle navigation</span>
								<span class="fa fa-bars"></span>
								<span class="icon-bar"></span>
								<span class="icon-bar"></span>
							</button>
                            <!--Start Logo -->
							
                            <!--End Logo -->
							<div class="clear-toggle"></div>
							<div id="main-menu" class="collapse scroll navbar-right">
								<ul class="nav">
                                
								    <li class="active"> <a href="#home">Home</a> </li>
									
									<li> <a href="#feature">About</a> </li>
                  <li> <a href="#contact">Contact</a> </li>
                  
                  
                  
                                    <li> <a href="kriteria.php">Kriteria</a> </li>
                                    
                                    <li> <a href="alternatif.php">Alternatif</a> </li>
                                    
                                    <li> <a href="topsis-step-1.php">Hasil Topsis</a> </li>
                                    
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
							</div><!-- end main-menu -->
						</div>
					</div>
				</div>
			</header>
    <!--End Navigation-->


      <!--Start Static Banner-->
      <section id="home" class="banner full-height">
          <div class="overlay"></div>
          <div class="banner-inner">
              <div class="banner-caption-main">
                 <div class="container scroll ">
                           <h2 class="uppercase">TableTopCompanion</h2>
                           <a href="#feature" class="btn btn-white-border">About US</a>
                           <a href="#contact" class="btn btn-primary">Contact US</a>
                  </div>
              </div>
          </div>
      </section>
      <!--End Static Banner-->


     <!--Start About Section-->
     <section id="feature" class="section featue-section">
          <div class="container">
              <div class="row">
              
                  <div class="section-heading text-center col-md-12">
                     <h2>Welcome To TableTopCompanion</h2>
                     <p class="lead">TableTopCompanion merupakan tempat untuk melihat rekomendasi BoardGame berdasarkan salah satu metode perhitungan dari Sistem Pendukung Keputusan.Nilai dari kriteria-kriteria yang digunakan diambil dari Boardgamegeek
                    <br></p>
                     <h3>Untuk Pengguna</h3>
                    <p class = "lead"> 
                    <ol>
	                    <li>Pilih Menu Kriteria untuk melihat kriteria BoardGame yang digunakan</li>
	                    <li>Pilih Menu Alternatif untuk melihat data BoardGame yang dikumpulkan untuk perhitungan</li>
                        <li>Pilih Menu Hasil Topsis untuk melihat perhitungan dan rekomendasi BoardGame</li>
                        <li>Pilih Pembobotan Oleh Admin untuk langsung menuju hasil perhitungan dan rekomendasi</li>
                        <li>Pilih Pembobotan Oleh user untuk memberikan nilai pada kriteria sesuai dengan keinginan user</li>	
                    </ol>
                    </p>
                   </div>

                
                                    
              </div>
          </div>
     </section>
     <!--End About Section-->

  

     
     <!--Start Contact Section-->
     <section id="contact" class="section contact-section ">
          <div class="container">
              <div class="row">
                  
                  <div class="section-heading  text-center"> <h2>Get in Touch</h2>  </div>
                  <div class="col-md-4">
                  <div class="contact-info">
                  
                          <div class="contact-info-box">
                              <div class="contact-icon"><i class="fa fa-map-o"></i>  </div>
                              <div class="contact-desc">
                              <h5>Address</h5>
                              <p>Surabaya</p>
                              </div>
                          </div>
                      
                          <div class="contact-info-box">
                               <div class="contact-icon"><i class="fa fa-envelope-o "></i>  </div>
                               <div class="contact-desc">
                              <h5>Email</h5>
                              <p>rahmat.iqbal13@gmail.com</p>
                               </div>
                          </div>
                      
                          
                  
              
                  
              </div>
          </div>
     </section>
     <!--End Contact Section-->
     
     
     <!--Start Footer-->
     <footer>
       <div class="container">
           <div class="row">
               <!--Start copyright-->
               <div class="col-md-6 col-sm-6">
                   <div class="copyright"><p>Copyright &copy; 2020 All Rights Reserved : Rio Ramadhan
                 </p></div>
               </div>
               <!--End copyright-->
               
               <!--start social icons-->
               <div class="col-md-6 col-sm-6">
                   <div class="social-icons">
                       <ul>
                        <li><a href="#"><i class="fa fa-facebook"></i></a></li>
                        <li> <a href="#"><i class="fa fa-twitter"></i></a></li>
                        <li><a href="#"><i class="fa fa-google-plus"></i></a></li>
                        <li><a href="#"><i class="fa fa-instagram"></i></a></li>
                       </ul>
                    </div>
               </div>
               <!--End social icons-->
           </div> <!-- /.row-->
       </div> <!-- /.container-->
    </footer>
     <!--End Footer-->
     
    <a href="#" class="scrollup"> <i class="fa fa-chevron-up"> </i> </a>
    
    <!--Plugins-->
	<script src="js/jquery.min.js" type="text/javascript"></script>
    <script src="js/bootstrap.min.js" type="text/javascript"></script>
    <script src="js/owl-carousel/owl.carousel.js" type="text/javascript"></script>
    <script src="js/jquery.parallax-1.1.3.js" type="text/javascript" ></script>
    <script src="js/jquery.mixitup.js" type="text/javascript" ></script>
    <script src="js/jquery.magnific-popup.min.js"  type="text/javascript" ></script>
    <script src="js/easing.js"  type="text/javascript"></script>
    <script src="js/slick.js" type="text/javascript"></script>
    <script src="js/custom.js" type="text/javascript"></script>
    
    </body>
    
</html>
