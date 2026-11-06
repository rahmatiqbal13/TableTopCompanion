<?php 
session_start();
session_unset();
unset($_SESSION['status']);
session_destroy();

header("Location: index.php");
?>