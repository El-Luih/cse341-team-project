import { createUser, findUserByEmail, verifyPassword } from '../models/auth.js';

export function registerPage(req, res) {
  return res.render('register', { title: 'Register' });
}

export function loginPage(req, res) {
  return res.render('login', { title: 'Login' });
}

export async function register(req, res) {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    return res.status(400).render('register', {
      title: 'Register',
      name,
      username,
      email,
      error: 'All registration fields are required.'
    });
  }

  if (password.length < 8) {
    return res.status(400).render('register', {
      title: 'Register',
      name,
      username,
      email,
      error: 'Password must be at least 8 characters.'
    });
  }

  try {
    const user = await createUser({ name, username, email, password });
    const role = await user.populate('role');

    req.session.user = {
      id: role._id.toString(),
      name: role.name,
      username: role.username,
      email: role.email,
      role: role.role.name
    };

    return req.session.save((error) => {
      if (error) {
        console.error('Failed to save session:', error);
        return res.status(500).render('errors/500', {
          title: 'Server Error',
          error: 'Unable to complete login.'
        });
      }
      return res.redirect('/');
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).render('register', {
        title: 'Register',
        name,
        username,
        email,
        error: 'A user with that username or email already exists.'
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).render('register', {
        title: 'Register',
        name,
        username,
        email,
        error: error.message
      });
    }

    console.error('Registration failed:', error);
    return res.status(500).render('errors/500', {
      title: 'Server Error',
      error: 'Unable to register account.'
    });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).render('login', {
      title: 'Login',
      email,
      error: 'Email and password are required.'
    });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).render('login', {
        title: 'Login',
        email,
        error: 'Invalid email or password.'
      });
    }

    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role.name
    };

    return req.session.save((error) => {
      if (error) {
        console.error('Failed to save session:', error);
        return res.status(500).render('errors/500', {
          title: 'Server Error',
          error: 'Unable to complete login.'
        });
      }
      return res.redirect('/');
    });
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).render('errors/500', {
      title: 'Server Error',
      error: 'Unable to log in.'
    });
  }
}

export function logout(req, res) {
  req.session.destroy((error) => {
    if (error) {
      console.error('Logout failed:', error);
      return res.status(500).render('errors/500', {
        title: 'Server Error',
        error: 'Unable to log out.'
      });
    }
    res.clearCookie('connect.sid');
    return res.redirect('/login');
  });
}

export function adminDashboard(req, res) {
  return res.render('admin', { title: 'Admin Dashboard' });
}
