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

  return humps.camelizeKeys(parsed);
};

const getCurrentDate = () => new Date().toLocaleString()

const customConsole = function (oldCons) {
  return {
    log: function (text) {
      oldCons.log(`[${getCurrentDate()}] ${text}`);
    },
    info: function (text) {
      oldCons.info(`[${getCurrentDate()}] ${text}`);
    },
    warn: function (text) {
      oldCons.warn(`[${getCurrentDate()}] ${text}`);
    },
    error: function (text) {
      oldCons.error(`[${getCurrentDate()}] ${text}`);
    }
  };
}(global.console)

module.exports = { randomCharacters, formatArrayUrlParams, JSONConverter, postProcessDbResponse, parseConnectionString, customConsole };
