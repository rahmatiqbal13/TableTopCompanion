# Legacy PHP version (2020)

Sistem Pendukung Keputusan Menggunakan Metode TOPSIS: the original PHP/MySQL app this project grew from.
It is kept for reference and is **not maintained**. Do not deploy it publicly: it has SQL injection,
MD5 passwords, and admin endpoints without server-side checks. Everything it did lives on in [`../web`](../web).

To run it locally (XAMPP or similar): import `db/bg_topsis.sql`, copy `koneksi.example.php` to
`koneksi.php` with your MySQL credentials, and open `index.php`.
