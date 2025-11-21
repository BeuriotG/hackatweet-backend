const mongoose = require('mongoose');

const tweetSchema = mongoose.Schema({
  author: {type: mongoose.Schema.Types.ObjectId, ref: 'users'},
  message: String,
  hashtag: Array,
  date: Date,
  nbOfLikes: Array,
});

const Tweet = mongoose.model('tweets', tweetSchema);

module.exports = Tweet;
