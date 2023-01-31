const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userModel = new Schema({
  username: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  profile: { type: String },

  password: { type: String, required: true },
  role: { type: String, required: true, default: 'user' },
  isAdmin: { type: Boolean, default: false },
  profilePhoto: {
    type: String,
    default: function () {
      return `https://secure.gravatar.com/avatar/${this._id}?s=90&d=identicon`;
    }
  },
  isBlocked: { type: Boolean, default: false },
  created: { type: Date, default: Date.now }
});

userModel.set('toJSON', { getters: true });
userModel.options.toJSON.transform = (doc, ret) => {
  const obj = { ...ret };
  delete obj._id;
  delete obj.__v;
  delete obj.password;
  return obj;
};
userModel.methods = {
  blockUser: function () {
    this.isBlocked = true;
    this.save();
    return this;
  }
};
module.exports = mongoose.model('user', userModel);
