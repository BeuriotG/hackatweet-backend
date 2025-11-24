const express = require('express');
const router = express.Router();
const Tweet = require('../models/tweets');
const User = require('../models/users');
var moment = require('moment');

// Route get pour trouver tous les tweets
router.get('/', (req, res) => {
  // Cherche tous les tweets
  Tweet.find()
    .populate('author')
    .sort({date: -1})
    .then((data) => {
      if (!data) {
        res.status(404).json({result: false, error: `Couldn't find the tweet feed`});
      } else {
        // création d'un array d'hashtags uniques, pour plus facilement le récupérer dans le front
        let uniqueHashtagsArray = [];
        data.map((t) => {
          if (!t.hashtag) {
            return;
          }
          for (const h of t.hashtag) {
            const isPresent = uniqueHashtagsArray.some((hash) => hash === h);
            if (!isPresent) {
              uniqueHashtagsArray.push(h);
            }
          }
        });
        //
        const fromattedData = data.map((d) => {
          const now = moment().format('DD/MM/YYYY HH:mm');
          return {
            _id: d._id,
            author: {
              firstname: d.author.firstname,
              username: d.author.username,
              token: d.author.token,
            },
            message: d.message,
            hashtag: d.hashtag,
            date: now,
            nbOfLikes: d.nbOfLikes,
          };
        });
        res.status(200).json({result: true, data: fromattedData, uniqueHashtagsArray});
      }
    });
});

// Route post poster un tweet
router.post('/', (req, res) => {
  // récupère l'utilisateur pour attribuer l'id du user au tweet
  const {message, token} = req.body;
  if (!message || !token) {
    res.status(406).json({result: false, error: 'One or many of the fields are missing'});
  } else {
    User.findOne({token}).then((data) => {
      if (!data) {
        res.status(401).json({
          result: false,
          error: 'Unauthorized to post a tweet without a valid account',
        });
      } else {
        // récuperation des hashtags avec une regExp
        const pattern = /#\S+/g;
        const isHashtag = message.match(pattern);
        const newDate = new Date(Date.now());
        // création du tweet
        const newTweet = new Tweet({
          author: data._id,
          message,
          hashtag: isHashtag,
          date: newDate,
          nbOfLikes: [],
        });
        // Sauvegarde du tweet
        newTweet.save().then((data) => {
          if (!data) {
            res.status(500).json({
              result: false,
              error: `Couldn't create the tweet, try later !`,
            });
          } else {
            // récupération du tweet pour populate la section author et envoyer au front les informations du user
            const tweetId = data._id;
            Tweet.findOne({_id: tweetId})
              .populate('author')
              .then((data) => {
                const {firstname, username} = data.author;
                const {message, hashtag, date, nbOfLikes} = data;
                if (!data) {
                  res.status(404).json({result: false, error: 'tweet not synchronized'});
                } else {
                  res.status(201).json({
                    result: true,
                    message: 'tweet created',
                    tweetData: {
                      firstname,
                      username,
                      message,
                      hashtag,
                      date,
                      nbOfLikes: [],
                    },
                  });
                }
              });
          }
        });
      }
    });
  }
});

// Route pour like un tweet
router.post('/like', (req, res) => {
  const {tweetId, token} = req.body;
  if (!tweetId || !token) {
    res.status(406).json({result: false, error: 'One or many of the fields are missing'});
  } else {
    Tweet.findOne({_id: tweetId}).then((data) => {
      if (!data) {
        res.status(401).json({
          result: false,
          error: 'Tweet not found',
        });
      } else {
        const tokenLikes = data.nbOfLikes;
        if (tokenLikes.find((e) => e === token)) {
          // res.json({result: false, error: 'already liked'});

          Tweet.updateOne({_id: tweetId}, {$pull: {nbOfLikes: token}}).then((data) => {
            res.status(200).json({result: false});
          });
        } else {
          Tweet.updateOne({_id: tweetId}, {$push: {nbOfLikes: token}}).then((data) => {
            res.status(200).json({result: true});
          });
        }
        // if(token === ) {
        //   console.log("already exist")
        // }
      }
    });
  }
});

// Route pour delete un tweet
router.delete('/', (req, res) => {
  // Récupération du token utilisateur et de l'id du tweet, cela servira à vérifier si le user est le propriétaire du tweet
  const {token, tweetId} = req.body;

  Tweet.findOne({_id: tweetId})
    .populate('author')
    .then((data) => {
      if (!data) {
        res.status(404).json({result: false, error: 'Tweet not found'});
      } else {
        if (data.author.token !== token) {
          res.status(401).json({result: false, error: 'Unauthorized'});
        } else {
          Tweet.deleteOne({_id: tweetId}).then((data) => {
            if (data.deleteCount !== 0) {
              res.status(200).json({result: true, data});
            } else {
              res.status(500).json({result: false, error: `DB couldn't delete the tweet`});
            }
          });
        }
      }
    });
});

// Route pour pour les tweets hashtags

module.exports = router;
