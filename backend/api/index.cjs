const appPromise = import("../app.js");

module.exports = async (req, res) => {
  const app = (await appPromise).default;
  return app(req, res);
};
