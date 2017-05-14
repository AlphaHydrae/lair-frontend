const _ = require('lodash');
const dotenv = require('dotenv');
const path = require('path');
const pkg = require('../package');

const envs = [ 'development', 'production' ];
const env = process.env.ENV || process.env.NODE_ENV || 'development';
const root = path.normalize(path.join(__dirname, '..'));

const fixed = {
  env: env,
  path: buildPath,
  root: root,
  version: pkg.version
};

dotenv.config();

const envConfig = {
  googleClientId: get('GOOGLE_CLIENT_ID'),
  liveReloadUrl: get('LIVE_RELOAD_URL'),
  port: parseConfigInt(get('PORT'))
};

const defaultConfig = {
  backendUrl: 'http://localhost:3000',
  liveReloadUrl: getLiveReloadUrl(),
  port: 4000
};

const config = _.defaults({}, fixed, envConfig, defaultConfig);

if (!_.includes(envs, config.env)) {
  throw new Error(`Unsupported environment ${config.env} (allowed: ${envs.join(', ')})`);
} else if (!config.googleClientId) {
  throw new Error('$GOOGLE_CLIENT_ID must be set');
}

module.exports = config;

function buildPath(...parts) {
  parts.unshift(root);
  return path.join.apply(path, parts);
}

function getLiveReloadUrl() {
  if (env == 'production') {
    return;
  }

  const port = parseConfigInt(get('LIVE_RELOAD_PORT')) || 35729;
  return `http://localhost:${port}/livereload.js`;
}

function get(name) {

  const fileVar = `${name}_FILE`;
  if (_.has(process.env, name) && _.has(process.env, fileVar)) {
    throw new Error(`Both $${name} and $${fileVar} cannot be set`);
  } else if (_.has(process.env, name)) {
    return process.env[name];
  }

  const file = process.env[fileVar];

  try {
    fs.statSync(file);
    return fs.readFileSync(file, 'utf-8').trim();
  } catch (err) {
    return undefined;
  }
}

function parseConfigInt(value) {
  if (value === undefined) {
    return undefined;
  } else if (_.isInteger(value)) {
    return value;
  }

  value = parseInt(value, 10);
  if (_.isNaN(value)) {
    throw new Error('Value must be an integer');
  }

  return value;
}
