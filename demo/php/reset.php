<?php

$db = new PDO('sqlite:cars.sqlite'); //will create the file in current directory. Current directory must be writable

$db->exec("DELETE FROM cars");