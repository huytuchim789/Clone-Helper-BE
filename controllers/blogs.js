const Blog = require('../models/blog');
const User = require('../models/user');
const { body, validationResult } = require('express-validator');

exports.loadBlogs = async (req, res, next, id) => {
  try {
    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: 'blog not found.' });
    req.blog = blog;
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid blog id.' });
    return next(error);
  }
  next();
};
exports.listBlogsByUser = async (req, res, next) => {
  try {
    const { username } = req.params;
    const { sortType = '-created' } = req.body;
    const author = await User.findOne({ username });
    const questions = await Blog.find({ author: author.id }).sort(sortType).limit(10);
    res.json(questions);
  } catch (error) {
    next(error);
  }
};

exports.createBlog = async (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array({ onlyFirstError: true });
    return res.status(422).json({ errors });
  }
  try {
    const { title, text } = req.body;
    const author = req.user.id;
    const question = await Blog.create({
      title,
      author,
      text
    });
    res.status(201).json(question);
  } catch (error) {
    next(error);
  }
};

exports.showBlog = async (req, res, next) => {
  try {
    const question = await Blog.findByIdAndUpdate(
      req.query.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('answers');
    res.json(question);
  } catch (error) {
    next(error);
  }
};

exports.listBlogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * pageSize;

    const total = await Blog.countDocuments(
      req.query.key
        ? {
            $or: [
              { title: { $regex: req.query.key, $options: 'i' } },
              { text: { $regex: req.query.key, $options: 'i' } }
            ]
          }
        : {}
    );

    const result = await Blog.find(
      req.query.key
        ? {
            $or: [
              { title: { $regex: req.query.key, $options: 'i' } },
              { text: { $regex: req.query.key, $options: 'i' } }
            ]
          }
        : {}
    )
      .sort({ created: -1 })
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

exports.editBlog = async (req, res) => {
  let blog = req.body;

  // const editBlog = new Blog(blog);
  try {
    await Blog.updateOne({ _id: req.params.id }, blog);
    res.status(201).json(blog);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

exports.removeQuestion = async (req, res, next) => {
  try {
    await req.blog.remove();
    res.json({ message: 'Your question successfully deleted.' });
  } catch (error) {
    next(error);
  }
};

exports.blogValidate = [
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
    .withMessage('must be at most 5000 characters long')
];
