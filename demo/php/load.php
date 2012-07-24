<?php
/**
 * This is an example code that shows how you can load Handsontable data from server using PHP with PDO (SQLite).
 * This code is not intended to be maximally efficient nor safe. It is for demonstrational purposes only.
 * Changes and more examples in different languages are welcome.
 *
 * Copyright 2012, Marcin Warpechowski
 * Licensed under the MIT license.
 * http://warpech.github.com/jquery-handsontable/
 */

try {
  //open the database
  $db = new PDO('sqlite:cars.sqlite'); //will create the file in current directory. Current directory must be writable
  
  //create the database if does not exist
  $db->exec("CREATE TABLE IF NOT EXISTS cars (id INTEGER PRIMARY KEY, manufacturer TEXT, year INTEGER, price INTEGER)");
  
  //select all data from the table
  $select = $db->prepare('SELECT * FROM cars ORDER BY id ASC LIMIT 100');
  $select->execute();
  
  $out = array(
    'cars' => $select->fetchAll(PDO::FETCH_ASSOC)
  );
  echo json_encode($out);
  
  // close the database connection
  $db = NULL;
}
catch (PDOException $e) {
  print 'Exception : ' . $e->getMessage();
}
?>