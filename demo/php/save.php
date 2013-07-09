<?php
/**
 * This is an example code that shows how you can save Handsontable data on server using PHP with PDO (SQLite).
 * This code is not intended to be maximally efficient nor safe. It is for demonstrational purposes only.
 * Changes and more examples in different languages are welcome.
 *
 * Copyright 2012, Marcin Warpechowski
 * Licensed under the MIT license.
 * http://warpech.github.com/jquery-handsontable/
 */

require_once('functions.php');

try {
  //open the database
  $db =  getConnection();
  createCarsTable($db);
  
  $colMap = array(
    0 => 'manufacturer',
    1 => 'year',
    2 => 'price'
  );
  
  if (isset($_POST['changes']) && $_POST['changes']) {
    foreach ($_POST['changes'] as $change) {
      $rowId  = $change[0] + 1;
      $colId  = $change[1];
      $newVal = $change[3];
      
      if (!isset($colMap[$colId])) {
        echo "\n spadam";
        continue;
      }

      $select = $db->prepare('SELECT id FROM cars WHERE id=? LIMIT 1');
      $select->execute(array(
        $rowId
      ));
      
      if ($row = $select->fetch()) {
        $query = $db->prepare('UPDATE cars SET `' . $colMap[$colId] . '` = :newVal WHERE id = :id');
      } else {
        $query = $db->prepare('INSERT INTO cars (id, `' . $colMap[$colId] . '`) VALUES(:id, :newVal)');
      }
      $query->bindValue(':id', $rowId, PDO::PARAM_INT);
      $query->bindValue(':newVal', $newVal, PDO::PARAM_STR);
      $query->execute();
    }
  } elseif (isset($_POST['data']) && $_POST['data']) {
    $select = $db->prepare('DELETE FROM cars');
    $select->execute();
    
    for ($r = 0, $rlen = count($_POST['data']); $r < $rlen; $r++) {
      $rowId = $r + 1;
      for ($c = 0, $clen = count($_POST['data'][$r]); $c < $clen; $c++) {
        if (!isset($colMap[$c])) {
          continue;
        }
        
        $newVal = $_POST['data'][$r][$c];
        
        $select = $db->prepare('SELECT id FROM cars WHERE id=? LIMIT 1');
        $select->execute(array(
          $rowId
        ));
        
        if ($row = $select->fetch()) {
          $query = $db->prepare('UPDATE cars SET `' . $colMap[$c] . '` = :newVal WHERE id = :id');
        } else {
          $query = $db->prepare('INSERT INTO cars (id, `' . $colMap[$c] . '`) VALUES(:id, :newVal)');
        }
        $query->bindValue(':id', $rowId, PDO::PARAM_INT);
        $query->bindValue(':newVal', $newVal, PDO::PARAM_STR);
        $query->execute();
      }
    }
  }

  $out = array(
    'result' => 'ok'
  );
  echo json_encode($out);
  
  closeConnection($db);
}
catch (PDOException $e) {
  print 'Exception : ' . $e->getMessage();
}
?>