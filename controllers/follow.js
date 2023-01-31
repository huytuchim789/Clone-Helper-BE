const Follow = require('../models/follow');
const { body, validationResult } = require('express-validator');

exports.follow = async (req, res) => {
  const { id } = req.user;
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array({ onlyFirstError: true });
    return res.status(422).json({ errors });
  }
  try {
    // console.log(id, req.body.followee);
    const { followee } = req.body;
    const result = await Follow.findOne({ follower: id, followee }).exec();
    if (result) {
      const delRes = await Follow.findOneAndDelete({ follower: id, followee }).exec();
      return res.status(200).json({ msg: 'Successfully Unfollow', isFollow: false });
    }
    const follow = await Follow.create({ follower: id, followee });
    return res.status(200).json({ msg: 'Successfully Follow', isFollow: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error });
  }
};
exports.isFollow = async (req, res) => {
  const { id } = req.user;
  const { followee } = req.query;
  if (!followee) {
    const errors = result.array({ onlyFirstError: true });
    return res.status(422).json({ errors });
  }
  try {
    // console.log(id, req.body.followee);
    const result = await Follow.findOne({ follower: id, followee }).exec();
    if (!result) {
      return res.status(200).json({ isFollow: false });
    }
    return res.status(200).json({ isFollow: true });
  } catch (error) {
    return res.status(500).json({ error: error });
  }
};
exports.followValidate = [body('followee').exists().trim().withMessage('is required')];
