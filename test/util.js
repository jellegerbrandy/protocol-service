module.exports = {

  user: {
    create: createUser,
    createN: createUsers,
    get: getUser,
    delete: deleteUser
  },

  bidding: {
    create: createBidding,
    get: getBidding,
    delete: deleteBidding,
    end: endBidding
  },

  contribution: {
    create: createContribution,
    get: getContribution,
    delete: deleteContribution
  },

  evaluation: {
    create: createEvaluations,
    get: getEvaluation,
    delete: deleteEvaluation
  },

  cleanseDB: cleanseDB,
  getCachedRep: getCachedRep,

  toBody: toBody,
  toBodies: toBodies,
  pp: parseProtocol,

  delayedGetCachedRep: delayedGetCachedRep,

  math: math

};

var _       = require('underscore');
var chakram = require('chakram');
var math    = require('decimal.js');
var Promise = require('promise');


// var URL = 'http://localhost:1465';
var URL = 'https://api.backfeed.cc/slant';

var params =  {
  headers: { 'x-api-key': process.env.X_API_KEY }
};

function createUser() { return chakram.post(URL + '/users/', {}, params) }
function getUser(id) { return chakram.get(URL + '/users/' + id, params) }
function deleteUser(id) { return chakram.delete(URL + '/users/' + id, {}, params) }

function createBidding() { return chakram.post(URL + '/biddings/', {}, params) }
function getBidding(id) { return chakram.get(URL + '/biddings/' + id, params) }
function deleteBidding(id) { return chakram.delete(URL + '/biddings/' + id, {}, params) }
function endBidding(id) { return chakram.put(URL + '/biddings/' + id, {}, params) }

function createContribution(body) { return chakram.post(URL + '/contributions/', body, params) }
function getContribution(id) { return chakram.get(URL + '/contributions/' + id, params) }
function deleteContribution(id) { return chakram.delete(URL + '/contributions/' + id, {}, params) }

function createEvaluations(body) { return chakram.post(URL + '/evaluations/submit', body, params) }
function getEvaluation(id) { return chakram.get(URL + '/evaluations/' + id , params) }
function deleteEvaluation(id) { return chakram.delete(URL + '/evaluations/' + id, {}, params) }

function getCachedRep() { return chakram.get(URL + '/util/getcachedrep/', {}, params) }

function createUsers(n) {
  var responses = [];
  _.times(n, function(n) {
    responses.push(createUser());
  });

  return chakram.all(responses).then(toBodies);
}

function cleanseDB() {
  return chakram.delete(URL + '/util/cleansedb', {}, params);
}

function toBodies(xs) {
  return _.map(xs, toBody);
}

function toBody(x) {
  return x.body;
}

function parseProtocol(n) {
  return math.round(n);
}

function promisedTimeout() {
  return new Promise(function (resolve, reject) {
    setTimeout(function() {
      resolve();
    }, 1000);
  });
}

// after a change in users table, give time for the event to trigger syncCachedRep function and process the new cahedRep value
function delayedGetCachedRep() {
  return promisedTimeout().then(function() {
    return getCachedRep();
  });
}
