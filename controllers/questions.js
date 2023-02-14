const Question = require('../models/question');
const User = require('../models/user');
const Blog = require('../models/blog');

const { body, validationResult } = require('express-validator');

exports.loadQuestions = async (req, res, next, id) => {
  try {
    const question = await Question.findById(id);
    if (!question) return res.status(404).json({ message: 'Question not found.' });
    req.question = question;
  } catch (error) {
    if (error.name === 'CastError')
      return res.status(400).json({ message: 'Invalid question id.' });
    return next(error);
  }
  next();
};

exports.createQuestion = async (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array({ onlyFirstError: true });
    return res.status(422).json({ errors });
  }
  try {
    const { title, tags, text } = req.body;
    const author = req.user.id;
    const question = await Question.create({
      title,
      author,
      tags,
      text
    });
    res.status(201).json(question);
  } catch (error) {
    next(error);
  }
};

exports.show = async (req, res, next) => {
  try {
    const { id } = req.question;
    const question = await Question.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('answers');
    res.json(question);
  } catch (error) {
    next(error);
  }
};
exports.listQuestions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * pageSize;

    const total = await Question.countDocuments(
      req.query.key
        ? {
            $and: [
              {
                $or: [
                  { title: { $regex: req.query.key, $options: 'i' } },
                  { text: { $regex: req.query.key, $options: 'i' } }
                ]
              },
              { isBlocked: false }
            ]
          }
        : { isBlocked: false }
    );

    const result = await Question.find(
      req.query.key
        ? {
            $and: [
              {
                $or: [
                  { title: { $regex: req.query.key, $options: 'i' } },
                  { text: { $regex: req.query.key, $options: 'i' } }
                ]
              },
              { isBlocked: false }
            ]
          }
        : { isBlocked: false }
    )
      .skip(skip)
      .limit(pageSize);

    const pages = Math.ceil(total / pageSize);

    res.status(200).json({
      status: 'success',
      count: result.length,
      page,
      pages,
      total,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.listByTags = async (req, res, next) => {
  try {
    const { sortType = '-score', tags } = req.params;
    const questions = await Question.find({ tags: { $all: tags } }).sort(sortType);
    res.json(questions);
  } catch (error) {
    next(error);
  }
};

exports.listByUser = async (req, res, next) => {
  try {
    const { username } = req.params;
    const { sortType = '-created' } = req.body;
    const author = await User.findOne({ username });
    const questions = await Question.find({ author: author.id }).sort(sortType).limit(10);
    res.json(questions);
  } catch (error) {
    next(error);
  }
};

exports.removeQuestion = async (req, res, next) => {
  try {
    await req.question.remove();
    res.json({ message: 'Your question successfully deleted.' });
  } catch (error) {
    next(error);
  }
};

exports.loadComment = async (req, res, next, id) => {
  try {
    const comment = await req.question.comments.id(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });
    req.comment = comment;
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid comment id.' });
    return next(error);
  }
  next();
};
exports.blockQuestion = async (req, res, next) => {
  const result = validationResult(req);

  try {
    const { id } = req.user;
    const question = await req.question.blockQuestion(id);

    res.status(201).json(question);
  } catch (error) {
    console.log(error);
    next(error);
  }
};
exports.questionValidate = [
  body('title')
    .exists()
    .trim()
    .withMessage('is required')

    .notEmpty()
    .withMessage('cannot be blank')

    .isLength({ max: 180 })
    .withMessage('must be at most 180 characters long'),

  body('text')
    .exists()
    .trim()
    .withMessage('is required')

    .isLength({ min: 10 })
    .withMessage('must be at least 10 characters long')

    .isLength({ max: 5000 })
    .withMessage('must be at most 5000 characters long'),

  body('tags').exists().withMessage('is required')
];
