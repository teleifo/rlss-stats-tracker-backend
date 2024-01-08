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
 * * Get Users
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
 * * Get User
 */
app.get("/user", function (req, res, next) {
  console.log(`Servicing GET /user`);

  var data = req.query;

  const validator = JSONValidator(data, schemas.getUser);
  if (!validator.valid) {
    const err = validator.errors[0];

    switch (err.property) {
      case "instance":
        return next({
          msg: `Invalid value for "${err.argument}"`,
          status: 400
        });

      case "instance.user":
        return next({
          msg: "Invalid value for \"user\"",
          status: 400
        });

      default:
        return next({
          msg: "Unknown server error",
          status: 500
        });
    }
  }

  const userRef = doc(db, "users", data.user);
  getDoc(userRef)
    .then(snapshot => {
      if (snapshot.exists()) {
        const matchesRef = collection(db, "matches");
        const q = query(matchesRef,
          or(
            where("winner", "==", data.user),
            where("loser", "==", data.user)
          )
        );

        getDocs(q)
          .then(snapshot => {
            const arr = [];
            snapshot.forEach(doc => {
              arr.push({
                id: doc.id,
                ...doc.data()
              });
            });

            var matchesWon = 0,
              goalsScored = 0,
              goalsConceded = 0;
              
            var matchesPlayed = arr.length;

            arr.forEach(match => { if (match.winner === data.user) matchesWon++ });
            
            var winPercentage = (matchesWon / matchesPlayed * 100).toFixed(2);

            arr.forEach(match => {
              goalsScored += (match.winner === data.user) ? match.score[0] : match.score[1]
            });

            arr.forEach(match => {
              goalsConceded += (match.winner === data.user) ? match.score[1] : match.score[0]
            });

            var averageGoals = (goalsScored / matchesPlayed).toFixed(2);
            
            res.send({
              matchesPlayed,
              matchesWon,
              winPercentage,
              goalsScored,
              goalsConceded,
              averageGoals,
              matchHistory: arr
            });
          }).catch(err => {
            console.log(err);
            return next({ msg: err.code });
          });
      } else return next({
        msg: `User "${data.user}" not found`,
        status: 400
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

  var data = req.query;

  const validator = JSONValidator(data, schemas.getLeaderboard);
  if (!validator.valid) {
    const err = validator.errors[0];

    switch (err.property) {
      case "instance":
        return next({
          msg: `Invalid value for "${err.argument}"`,
          status: 400
        });

      case "instance.category":
        return next({
          msg: "Invalid value for \"category\"",
          status: 400
        });

      default:
        return next({
          msg: "Unknown server error",
          status: 500
        });
    }
  }

  getDocs(collection(db, "matches"))
    .then(snapshot=> {
      const arr = [];
      snapshot.forEach(doc => {
        arr.push({
          id: doc.id,
          ...doc.data()
        });
      });

      res.send(arr);
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