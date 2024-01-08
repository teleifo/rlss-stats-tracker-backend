const express = require("express");
const cors = require("cors");
const { getFirestore, collection, doc, documentId, getDoc, getDocs, addDoc, query, where, and, or, Timestamp } = require("firebase/firestore");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const firebase = require("./firebase-app");
const db = getFirestore(firebase);

const JSONValidator = require("./json-validator");
const schemas = require("../schemas/schemas");

/**
 * * Get All Users
 */
app.get("/users", function (req, res, next) {
  console.log(`Servicing GET /users`);

  getDocs(collection(db, "users"))
    .then(snapshot => {
      const arr = [];
      snapshot.forEach(doc => {
        arr.push({
          id: doc.id,
          ...doc.data()
        });
      });

      res.send(arr);
    });
});

/**
 * * Get All User Info
 */
app.get("/user-info", function (req, res, next) {
  console.log(`Servicing GET /user-info`);

  getDocs(collection(db, "matches"))
    .then(matchSnapshot => {
      const matchArr = [];
      matchSnapshot.forEach(doc => {
        matchArr.push({
          id: doc.id,
          ...doc.data()
        });
      });

      getDocs(collection(db, "users"))
        .then(userSnapshot => {
          const userArr = [];
          userSnapshot.forEach(doc => {
            userArr.push({
              id: doc.id,
              ...doc.data()
            });
          });

          var allUserInfo = [];

          userArr.forEach(user => {
            var matchHistory = matchArr.filter(match => (match.winner === user.name || match.loser === user.name));
          
            var matchesWon = 0,
            goalsScored = 0,
            goalsConceded = 0;
              
            var matchesPlayed = matchHistory.length;
  
            matchHistory.forEach(match => { if (match.winner === user.name) matchesWon++ });
            
            var winPercentage = (matchesWon / matchesPlayed * 100).toFixed(2);
  
            matchHistory.forEach(match => {
              goalsScored += (match.winner === user.name) ? match.score[0] : match.score[1]
            });
  
            matchHistory.forEach(match => {
              goalsConceded += (match.winner === user.name) ? match.score[1] : match.score[0]
            });
  
            var averageGoals = (goalsScored / matchesPlayed).toFixed(2);

            allUserInfo.push({
              name: user.name,
              matchesPlayed,
              matchesWon,
              winPercentage,
              goalsScored,
              goalsConceded,
              averageGoals,
              matchHistory
            });
          });

          res.send(allUserInfo);
        });
    }).catch(err => {
      console.log(err);
      return next({ msg: err.code });
    });
});

/**
 * * Get Leaderboard
 */
app.get("/leaderboard", function (req, res, next) {
  console.log(`Servicing GET /leaderboard`);

  getDocs(collection(db, "matches"))
    .then(matchSnapshot => {
      const matchArr = [];
      matchSnapshot.forEach(doc => {
        matchArr.push({
          id: doc.id,
          ...doc.data()
        });
      });

      getDocs(collection(db, "users"))
        .then(userSnapshot => {
          const userArr = [];
          userSnapshot.forEach(doc => {
            userArr.push({
              id: doc.id,
              ...doc.data()
            });
          });

          var allUserInfo = [], leaderboard = [];

          userArr.forEach(user => {
            var matchHistory = matchArr.filter(match => (match.winner === user.name || match.loser === user.name));
          
            var matchesWon = 0,
            goalsScored = 0,
            goalsConceded = 0;
              
            var matchesPlayed = matchHistory.length;
  
            matchHistory.forEach(match => { if (match.winner === user.name) matchesWon++ });
            
            var winPercentage = (matchesWon / matchesPlayed * 100).toFixed(2);
  
            matchHistory.forEach(match => {
              goalsScored += (match.winner === user.name) ? match.score[0] : match.score[1]
            });
  
            matchHistory.forEach(match => {
              goalsConceded += (match.winner === user.name) ? match.score[1] : match.score[0]
            });
  
            var averageGoals = (goalsScored / matchesPlayed).toFixed(2);

            allUserInfo.push({
              name: user.name,
              matchesPlayed,
              matchesWon,
              winPercentage,
              goalsScored,
              goalsConceded,
              averageGoals
            });
          });

          const mostMatchesPlayed = 
            allUserInfo.map(userInfo => ({ username: userInfo.name, stat: userInfo.matchesPlayed }))
              .sort((a, b) => b.stat - a.stat);

          const mostMatchesWon = 
            allUserInfo.map(userInfo => ({ username: userInfo.name, stat: userInfo.matchesWon }))
              .sort((a, b) => b.stat - a.stat);

          const highestWinPercentage = 
            allUserInfo.map(userInfo => ({ username: userInfo.name, stat: userInfo.winPercentage }))
              .sort((a, b) => b.stat - a.stat);

          const mostGoalsScored = 
            allUserInfo.map(userInfo => ({ username: userInfo.name, stat: userInfo.goalsScored }))
              .sort((a, b) => b.stat - a.stat);
          
          const mostGoalsConceded = 
            allUserInfo.map(userInfo => ({ username: userInfo.name, stat: userInfo.goalsConceded }))
              .sort((a, b) => b.stat - a.stat);

          const highestAverageGoals = 
            allUserInfo.map(userInfo => ({ username: userInfo.name, stat: userInfo.averageGoals }))
              .sort((a, b) => b.stat - a.stat);

          res.send({
            mostMatchesPlayed: {
              leaderboardName: "Most Matches Played",
              categoryName: "Matches Played",
              leaderboard: mostMatchesPlayed
            },
            mostMatchesWon: {
              leaderboardName: "Most Matches Won",
              categoryName: "Matches Won",
              leaderboard: mostMatchesWon
            },
            highestWinPercentage: {
              leaderboardName: "Highest Win Percentage",
              categoryName: "Win Percentage",
              leaderboard: highestWinPercentage
            },
            mostGoalsScored: {
              leaderboardName: "Most Goals Scored",
              categoryName: "Goals Scored",
              leaderboard: mostGoalsScored
            },
            mostGoalsConceded: {
              leaderboardName: "Most Goals Conceded", 
              categoryName: "Goals Conceded",
              leaderboard: mostGoalsConceded
            },
            highestAverageGoals: {
              leaderboardName: "Highest Average Goals",
              categoryName: "Average Goals Per Match",
              leaderboard: highestAverageGoals
            }
          });
        });
    })
    .catch(err => {
      console.log(err);
      return next({ msg: err.code });
    });
});

/**
 * * Add Match
 */
app.post("/match", function (req, res, next) {
  console.log(`Servicing POST /match`);

  var data = req.body;

  const validator = JSONValidator(data, schemas.addMatch);
  if (!validator.valid) {
    const err = validator.errors[0];
    
    switch (err.property) {
      case "instance":
        return next({
          msg: `Invalid value for "${err.argument}"`,
          status: 400
        });

      case "instance.winner":
        return next({
          msg: "Invalid value for \"winner\"",
          status: 400
        });

      case "instance.loser":
        return next({
          msg: "Invalid value for \"loser\"",
          status: 400
        });

      case "instance.score":
        return next({
          msg: "Invalid value for \"score\"",
          status: 400
        });

      case "instance.date":
        return next({
          msg: "Invalid value for \"date\"",
          status: 400
        });

      case "instance.season":
        return next({
          msg: "Invalid value for \"season\"",
          status: 400
        });

      default:
        return next({
          msg: "Unknown server error",
          status: 500
        });
    }
  }

  const usersRef = collection(db, "users");
  const q = query(usersRef,
    or(
      where(documentId(), "==", data.winner),
      where(documentId(), "==", data.loser)
    )
  );

  getDocs(q)
    .then(snapshot => {
      const arr = [];
      snapshot.forEach(doc => { arr.push(doc.id); });

      if (!arr.includes(data.winner)) return next({
        msg: `User "${data.winner}" not found`,
        status: 400
      });
      else if (!arr.includes(data.loser)) return next({
        msg: `User "${data.loser}" not found`,
        status: 400
      });
      else {
        const payload = {
          winner: data.winner,
          loser: data.loser,
          score: data.score,
          date: Timestamp.fromDate(new Date(data.date)),
          season: data.season
        }

        addDoc(collection(db, "matches"), payload)
          .then(docRef => {
            // console.log(docRef);
            res.send({
              success: true,
              id: docRef.id
            });
          }).catch(err => {
            console.log(err);
            return next({ msg: err.code });
          });
      }
    }).catch(err => {
      console.log(err);
      return next({ msg: err.code });
    });
});

/**
 * * 404 Handler
 */
app.use(function (req, res, next) {
  res.status(404).send("Sorry can't find that!");
});

/**
 * * Error Handler
 */
app.use(function (err, req, res, next) {
  res.status(err.status || 500).send({ msg: err.msg });
});

module.exports = app;