<?php

$cars = array(
    'Acura',
    'Audi',
    'BMW',
    'Buick',
    'Cadillac',
    'Chevrolet',
    'Chrysler',
    'Citroen',
    'Dodge',
    'Eagle',
    'Ferrari',
    'Ford',
    'General Motors',
    'GMC',
    'Honda',
    'Hummer',
    'Hyundai',
    'Infiniti',
    'Isuzu',
    'Jaguar',
    'Jeep',
    'Kia',
    'Lamborghini',
    'Land Rover',
    'Lexus',
    'Lincoln',
    'Lotus',
    'Mazda',
    'Mercedes-Benz',
    'Mercury',
    'Mitsubishi',
    'Nissan',
    'Oldsmobile',
    'Peugeot',
    'Pontiac',
    'Porsche',
    'Regal',
    'Renault',
    'Saab',
    'Saturn',
    'Seat',
    'Skoda',
    'Subaru',
    'Suzuki',
    'Toyota',
    'Volkswagen',
    'Volvo'
);

function match($val) {
  global $query;
  if (strpos(strtolower($val), $query) !== false) {
    return true;
  }
  else {
    return false;
  }
}

header("Content-type: application/json");

if (!empty($_GET['query'])) {
  $query = strtolower(trim($_GET['query']));
  $out = array_values(array_filter($cars, 'match'));
}
else {
  $out = $cars;
}

echo json_encode($out);
?>