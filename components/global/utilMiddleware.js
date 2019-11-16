/**
 * Set user id in query for querying docs and in body for creating doc
 * @param {string} location must be either 'body' or 'query'
 */
const setUserIdIn = location => {
  return (req, res, next) => {
    if (!req[location].user) req[location].user = req.user.id;
    next();
  };
};

module.exports = {
  setUserIdIn
};
