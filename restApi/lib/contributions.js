'use strict';

module.exports = {
  createContribution          : createContribution,
  getContribution             : getContribution,
  getContributionEvaluations  : getContributionEvaluations,
  getContributionUsers        : getContributionUsers,
  deleteContribution          : deleteContribution
};

var async           = require('async');
var util            = require('./helper');
var db              = require('./db');
var config          = require('./config');
var biddingLib      = require('./biddings');
var usersLib        = require('./users');
var protocol        = require('./protocol');
var evaluationsLib  = require('./evaluations');
var getCachedRep    = require('./getCachedRep');

function createContribution(event, cb) {

  var newContribution = {
    "id": util.uuid(),
    "userId": event.userId,
    "biddingId": event.biddingId,
    "createdAt": Date.now()
  };

  var params = {
    TableName : config.tables.contributions,
    Item: newContribution
  };

  async.waterfall([
    function(waterfallCB) {
      biddingLib.getBidding({ id: event.biddingId }, waterfallCB);
    },
    function(bidding, waterfallCB) {
      if (bidding.status === 'Completed') return cb(new Error('400. bad request. bidding is complete, no more contributions please!'));
      usersLib.getUser({ id: event.userId }, waterfallCB);
    },
    function(user, waterfallCB) {
      if (protocol.notEnoughTokens(user)) return cb(new Error('400. bad request. not enough tokens for the contribution fee'));
      user = protocol.payContributionFee(user);
      usersLib.updateUser(user, waterfallCB);
    },
    function() {
      return db.put(params, cb, newContribution);
    }
  ], function (err) {
    if (err) {
      return cb(err);
    }
  });

}

function getContribution(event, cb) {

  var params = {
    TableName : config.tables.contributions,
    Key: { id: event.id }
  };

  return db.get(params, cb);
}

function getContributionScore(event, cb) {

  async.waterfall([
      // get all evaluations from db
      function(waterfallCB) {
        getContributionEvaluations(event, waterfallCB);
      },
      function(evaluations, waterfallCB) {
        async.parallel({
            cachedRep: function(parallelCB) {
              getCachedRep(parallelCB);
            },
            evaluationsVoteOne: function(parallelCB) {
              evaluationsLib.getByValue(biddingId, 1, parallelCB);
            },
            evaluationsVoteZero: function(parallelCB) {
              evaluationsLib.getByValue(biddingId, 0, parallelCB);
            }
          },
          function(err, results) {
            waterfallCB(err, results);
          }
        );
      },

      function(results, waterfallCB) {

      },

      function(result, waterfallCB) {
      }

    ],
    function(err, result) {
      return cb(err, newEvalId);
    }
  );
  // waterfall
  // get all evaluations from db

  //    parallel
  // protocol. get eval by value 0
  // evaluationsLib.getByValue(biddingId, 0, cb);
  // get all users from db - voted 0
  // protocol sumRep

  // protocol. get eval by value 1
  // evaluationsLib.getByValue(biddingId, 1, cb);
  // get all users from db - voted 1
  // protocol sumRep

  // getCached

  //    parallel result
  // protocol calcScore

}

function getContributionEvaluations(event, cb) {

  var params = {
    TableName : config.tables.evaluations,
    IndexName: 'evaluations-contributionId-createdAt',
    KeyConditionExpression: 'contributionId = :hkey',
    ExpressionAttributeValues: { ':hkey': event.id }
  };

  db.query(params, cb);
}

function getContributionUsers(event, cb) {
  var response = [];
  return cb(null, response);
}

function deleteContribution(event, cb) {

  var params = {
    TableName : config.tables.contributions,
    Key: { id: event.id },
    ReturnValues: 'ALL_OLD'
  };

  return db.del(params, cb);
}
