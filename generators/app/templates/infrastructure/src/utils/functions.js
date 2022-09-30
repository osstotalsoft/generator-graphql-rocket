const humps = require("humps");

const randomCharacters = length => Math.random().toString(36).substr(2, length)

const formatArrayUrlParams = obj => {
  const searchParams = new URLSearchParams();
  Object.keys(obj).forEach(a =>
    Array.isArray(obj[a]) ? obj[a].forEach(arr => searchParams.append(a, arr)) : searchParams.append(a, obj[a])
  );
  return searchParams;
};

function JSONConverter(obj) {
  const keys = Object.keys(obj);
  let newObj = {};
  while (keys.length--) {
    const key = keys[keys.length];
    newObj[key.charAt(0).toLowerCase() + key.slice(1)] = obj[key];
  }
  return newObj;
}

const postProcessDbResponse = result => {
  if (Array.isArray(result)) {
    return result.map(row => humps.camelizeKeys(row));
  } else {
    return humps.camelizeKeys(result);
  }
};

const parseConnectionString = connectionString => {
  const parsed = connectionString
    .replace(" ", "")
    .split(";")
    .reduce((a, b) => {
      const prop = b.split("=");
      return (a[prop[0]] = prop[1]), a;
    }, {});

  return sanitizeConnectionInfo(parsed);
};


const sanitizeConnectionInfo = connectionInfo => {
  connectionInfo = humps.camelizeKeys(connectionInfo)

  const portSplit = connectionInfo.server?.split(',')
  if (portSplit?.length > 1) {
    connectionInfo.server = portSplit[0]
    connectionInfo.port = portSplit[1]
  }

  const instanceSplit = connectionInfo.server?.split('\\')
  if (instanceSplit?.length > 1) {
    connectionInfo.server = instanceSplit[0]
    connectionInfo.instanceName = instanceSplit[1]
  }

  const otherParams = connectionInfo.otherParams
    ?.split(';')
    .filter(i => i)
    .map(pair => pair.split('='))
  if (otherParams) {
    connectionInfo = { ...connectionInfo, ...humps.camelizeKeys(Object.fromEntries(otherParams)) }
  }

  return connectionInfo
}

const publicRoute = (ctx, publicRoutes = []) => {
  if (
    ctx.method === 'GET' ||
    ctx.request.body.operationName === 'IntrospectionQuery' ||
    || (ctx.request.body.query && ctx.request.body.query.includes("IntrospectionQuery"))
    || publicRoutes.includes(ctx.path.toLowerCase())
  ) {
    return true
  } else {
    return false
  }
}

module.exports = { randomCharacters, formatArrayUrlParams, JSONConverter, postProcessDbResponse, parseConnectionString, sanitizeConnectionInfo, publicRoute };
