const User = require('../models/user');
const jwtDecode = require('jwt-decode');
const { cloudinary } = require('../utils/cloudinary');
const axios = require('axios');

const { body, validationResult } = require('express-validator');

const { createToken, hashPassword, verifyPassword } = require('../utils/authentication');

exports.signup = async (req, res) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array({ onlyFirstError: true });
    return res.status(422).json({ errors });
  }

  try {
    const { username } = req.body;

    const hashedPassword = await hashPassword(req.body.password);

    const userData = {
      username: username.toLowerCase(),
      password: hashedPassword
    };

    const existingUsername = await User.findOne({
      username: userData.username
    });

    if (existingUsername) {
      return res.status(400).json({
        message: 'Username already exists.'
      });
    }

    const newUser = new User(userData);
    const savedUser = await newUser.save();

    if (savedUser) {
      const token = createToken(savedUser);
      const decodedToken = jwtDecode(token);
      const expiresAt = decodedToken.exp;

      const { username, role, id, created, profilePhoto } = savedUser;
      const userInfo = {
        username,
        role,
        id,
        created,
        profilePhoto
      };

      return res.json({
        message: 'User created!',
        token,
        userInfo,
        expiresAt
      });
    } else {
      return res.status(400).json({
        message: 'There was a problem creating your account.'
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      message: 'There was a problem creating your account.'
    });
  }
};

exports.authenticate = async (req, res) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array({ onlyFirstError: true });
    return res.status(422).json({ errors });
  }
  try {
    const { username, password } = req.body;
    const user = await User.findOne({
      username: username.toLowerCase()
    });

    if (!user) {
      return res.status(403).json({
        message: 'Wrong username or password.'
      });
    }
    if (user?.isBlocked)
      return res.status(401).json({
        message: 'Your account has been blocked or deleted.'
      });
    const passwordValid = await verifyPassword(password, user.password);

    if (passwordValid) {
      const token = createToken(user);
      const decodedToken = jwtDecode(token);
      const expiresAt = decodedToken.exp;
      const { username, role, id, created, profilePhoto, exp } = user;
      const userInfo = { username, role, id, created, profilePhoto, exp };

      res.json({
        message: 'Authentication successful!',
        token,
        userInfo,
        expiresAt
      });
    } else {
      res.status(403).json({
        message: 'Wrong username or password.'
      });
    }
  } catch (error) {
    return res.status(400).json({
      message: 'Something went wrong.'
    });
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const { sortType = '-created' } = req.body;
    const users = await User.find().sort(sortType);
    res.json(users);
  } catch (error) {
    next(error);
  }
};

exports.search = async (req, res, next) => {
  try {
    const users = await User.find({ username: { $regex: req.params.search, $options: 'i' } });
    res.json(users);
  } catch (error) {
    next(error);
  }
};
exports.editUser = async (req, res, next) => {
  const { id } = req.user;
  try {
    if (!req.body.img) {
      const result = await User.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            displayName: req.body.displayName,
            profile: req.body.profile,
            exp: req.body.exp
          }
        }
      );
    } else {
      const uploadedResponse = await cloudinary.uploader.upload(req.body.img, {
        upload_preset: 'ehwtbisx'
      });
      const result = await User.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            profilePhoto: uploadedResponse.url,
            displayName: req.body.displayName,
            profile: req.body.profile,
            exp: req.body.exp
          }
        }
      );
    }
    return res.status(200).json({});
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};
exports.find = async (req, res, next) => {
  try {
    const users = await User.findOne({ username: req.params.username });
    res.json(users);
  } catch (error) {
    next(error);
  }
};
exports.blockUser = async (req, res, next) => {
  const result = validationResult(req);
  try {
    const user = await User.findOne({ _id: req.params.username });
    user.isBlocked = true;
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.log(error);
    next(error);
  }
};
exports.validateUser = [
  body('username')
    .exists()
    .trim()
    .withMessage('is required')

    .notEmpty()
    .withMessage('cannot be blank')

    .isLength({ max: 16 })
    .withMessage('must be at most 16 characters long')

    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('contains invalid characters'),

  body('password')
    .exists()
    .trim()
    .withMessage('is required')

    .notEmpty()
    .withMessage('cannot be blank')

    .isLength({ min: 6 })
    .withMessage('must be at least 6 characters long')

    .isLength({ max: 50 })
    .withMessage('must be at most 50 characters long')
];
