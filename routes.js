const {
  validateUser,
  signup,
  authenticate,
  listUsers,
  search,
  find,
  blockUser,
  editUser
} = require('./controllers/users');
const {
  loadQuestions,
  questionValidate,
  createQuestion,
  show,
  listQuestions,
  listByTags,
  listByUser,
  removeQuestion,
  blockQuestion
} = require('./controllers/questions');
const {
  loadBlogs,
  listBlogs,
  createBlog,
  blogValidate,
  showBlog,
  editBlog,
  listBlogsByUser
} = require('./controllers/blogs');
const {
  loadAnswers,
  answerValidate,
  createAnswer,
  removeAnswer,
  editAnswer,
  blockAnswer
} = require('./controllers/answers');
const { listPopulerTags, searchTags, listTags } = require('./controllers/tags');
const { upvote, downvote, unvote } = require('./controllers/votes');
const {
  loadComments,
  validate,
  createComment,
  removeComment,
  editComment,
  createCommentBlog
} = require('./controllers/comments');

const { requireAuth, requireAdmin } = require('./middlewares/requireAuth');
const questionAuth = require('./middlewares/questionAuth');
const commentAuth = require('./middlewares/commentAuth');
const answerAuth = require('./middlewares/answerAuth');
const { follow, followValidate, isFollow, listFollowing } = require('./controllers/follow');

const router = require('express').Router();

//authentication
router.post('/signup', validateUser, signup);
router.post('/authenticate', validateUser, authenticate);

//users
router.get('/users', listUsers);
router.get('/users/:search', search);
router.get('/user/:username', find);
router.post('/user-edit', [requireAuth], editUser);
//questions
router.param('question', loadQuestions);
router.post('/questions', [requireAuth, questionValidate], createQuestion);
router.get('/question/:question', show);
router.get('/question', listQuestions);
router.get('/questions/:tags', listByTags);
router.get('/question/user/:username', listByUser);
router.delete('/question/:question', [requireAuth, questionAuth], removeQuestion);

//blogs
router.param('/blog', loadBlogs);
router.get('/blog-by-id', showBlog);
router.get('/blog', listBlogs);
router.post('/blog', [requireAuth, blogValidate], createBlog);
router.put('/blog/:id', editBlog);
router.get('/blog/user/:username', listBlogsByUser);

//tags
router.get('/tags/populertags', listPopulerTags);
router.get('/tags/:tag', searchTags);
router.get('/tags', listTags);

//answers
router.param('answer', loadAnswers);
router.post('/answer/:question', [requireAuth, answerValidate], createAnswer);
router.delete('/answer/:question/:answer', [requireAuth, answerAuth], removeAnswer);
router.put('/answer/:question/:answer', [requireAuth, answerAuth], editAnswer);

//votes
router.get('/votes/upvote/:question/:answer?', requireAuth, upvote);
router.get('/votes/downvote/:question/:answer?', requireAuth, downvote);
router.get('/votes/unvote/:question/:answer?', requireAuth, unvote);

//comments
router.param('comment', loadComments);
router.post('/comment/:question/:answer?', [requireAuth, validate], createComment);
router.post('/comment-blog/:question/:answer?', [requireAuth, validate], createCommentBlog);
router.put('/comment/:question/:answer/:comment?', [requireAuth, validate], editComment);

router.delete('/comment/:question/:comment', [requireAuth, commentAuth], removeComment);
router.delete('/comment/:question/:answer/:comment', [requireAuth, commentAuth], removeComment);

//blocked
router.put('/blocked/question/:question/', [requireAuth, validate, requireAdmin], blockQuestion);
router.put('/blocked/user/:username/', [requireAuth, validate, requireAdmin], blockUser);

//follow
router.post('/follow', [requireAuth, followValidate], follow);
router.get('/:username/follow-list', listFollowing);
router.get('/is-follow', [requireAuth], isFollow);

module.exports = (app) => {
  app.use('/api', router);

  app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
  });

  app.use((error, req, res, next) => {
    res.status(error.status || 500).json({
      message: error.message
    });
  });
};
