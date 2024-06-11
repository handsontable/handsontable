const express = require('express');
const history = require('connect-history-api-fallback');
const path = require('path');

const app = express();

app.use(history());

app.use(express.static(path.join(__dirname, 'dist')));

app.listen(8082, () => {
  console.log('Server is running on http://localhost:8082');
});