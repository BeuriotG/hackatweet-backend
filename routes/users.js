var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const uid2 = require('uid2');
const User = require('../models/users');

router.post('/signup', (req, res) => {
  const {firstname, username, password} = req.body;
  if (!firstname || !username || !password) {
    res.status(406).json({result: false, error: 'One or many of the fields are missing'});
  } else {
    User.findOne({username}).then((data) => {
      if (!data) {
        const hash = bcrypt.hashSync(password, 10);
        const newUser = new User({
          firstname,
          username,
          password: hash,
          token: uid2(32),
        });
        newUser.save().then((data) => {
          if (data) {
            const {username, token} = data;
            res.status(201).json({
              result: true,
              message: 'User created',
              userData: {username, token},
            });
          } else {
            res.status(500).json({
              result: false,
              error: 'Error while trying to connect you to the DB. Try later',
            });
          }
        });
      } else {
        res.status(401).json({result: false, error: 'Unauthorized to create an account'});
      }
    });
  }
});

router.post('/signin', (req, res) => {
  const {username, password} = req.body;
  if (!username || !password) {
    res.status(406).json({result: false, error: 'One or many of the fields are missing'});
  } else {
    User.findOne({username}).then((data) => {
      if (!data) {
        res.status(404).json({result: false, error: 'User not found, try again!'});
      } else {
        const comparePassword = bcrypt.compareSync(password, data.password);
        if (!comparePassword) {
          res.status(401).json({result: false, error: 'Unauthorized'});
        } else {
          const {username, token} = data;
          res.status(200).json({result: true, userData: {username, token}});
        }
      }
    });
  }
});

module.exports = router;
