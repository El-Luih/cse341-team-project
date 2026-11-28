import bcrypt from 'bcrypt';
import Role from './schemas/roles.js';
import User from './schemas/users.js';

export async function createUser({ name, username, email, password }) {
  const customerRole = await Role.findOne({ name: 'customer' });
  if (!customerRole) {
    throw new Error('The customer role is not initialized. Run npm run db:import.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  return User.create({
    name,
    username,
    email,
    passwordHash,
    role: customerRole._id
  });
}

export async function findUserByEmail(email) {
  return User.findOne({ email: email.toLowerCase() }).populate('role');
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}
