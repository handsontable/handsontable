<?php

require_once('functions.php');


try {
    $db = getConnection();
    resetCarsTable($db);
    closeConnection($db);
}
catch (PDOException $e) {
    print 'Exception : ' . $e->getMessage();
}

