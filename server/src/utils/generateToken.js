import jwt from 'jsonwebtoken';

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      role: user.role,
      branch: user.branch?._id || user.branch || null,
      name: user.name,
    },
    process.env.JWT_SECRET || 'fallback_secret',
    {
      expiresIn: '7d',
    }
  );
};
