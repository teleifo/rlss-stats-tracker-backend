const app = require("./controllers/app");

var server = app.listen(5000, function () {
  var port = server.address().port;
  console.log(`Server is running at localhost:%s`, port);
})