const config = require('../config');
const express = require('express');
const httpProxy = require('express-http-proxy');

const buildDir = config.path('build');

const app = express();

app.use(express.static(buildDir));
app.use('/node_modules', express.static(config.path('node_modules')));

function proxy(path) {
  return httpProxy(config.backendUrl, {
    proxyReqPathResolver: function(req) {
      return path + req.url;
    }
  });
}

app.use('/api', proxy('/api'));
app.use('/auth', proxy('/auth'));

app.get('/*', serveIndex);
app.get('/', serveIndex);

app.listen(config.port, function() {
  console.log(`Example app listening on port ${config.port}`);
});

function serveIndex(req, res) {
  res.sendFile('index.html', { root: config.path('build') });
}
