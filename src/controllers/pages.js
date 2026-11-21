export const homePage = (req, res) => {
  res.render('home', { title: 'Kizuna Rail' });
};

export const aboutPage = (req, res) => {
  res.render('about', { title: 'About' });
};

export const testErrorPage = (req, res, next) => {
  const error = new Error('This is a test error so you can see what it looks like.');
  error.status = 500;
  next(error);
};
