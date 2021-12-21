const express = require('express')
const path = require('path')
const app = express();
const port = 3000;

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile('index.html', {root: __dirname })
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}! Navigate to http://127.0.0.1:${port} to view.`)
});
