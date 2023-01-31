const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const followSchema = new Schema({
  follower: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  followee: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  }
});

followSchema.set('toJSON', { getters: true });

followSchema.options.toJSON.transform = (doc, ret) => {
  const obj = { ...ret };
  delete obj._id;
  delete obj.__v;
  return obj;
};

followSchema.methods = {
  follow: function (follower, followee) {
    this.follower = follower;
    this.followee = followee;
    return this.save();
  }
};

followSchema.pre(/^find/, function () {
  this.populate('follower').populate('followee');
});

followSchema.pre('save', function (next) {
  this.wasNew = this.isNew;
  next();
});

followSchema.post('save', function (doc, next) {
  doc
    .populate('follower')
    .populate('followee')
    .execPopulate()
    .then(() => next());
});

module.exports = mongoose.model('Follow', followSchema);
