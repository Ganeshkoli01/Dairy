import { User } from '../models/User.js';
import { Branch } from '../models/Branch.js';
import { Farmer } from '../models/Farmer.js';
import { Otp } from '../models/Otp.js';
import { generateToken } from '../utils/generateToken.js';
import { sendEmail } from '../utils/sendEmail.js';
import dotenv from 'dotenv';

dotenv.config();

// Helper to determine display name
const getDisplayName = (user) => {
  if (user.role === 'farmer') return user.farmerProfile?.farmerName;
  if (user.role === 'dairyOwner') return user.dairyOwnerProfile?.ownerName;
  if (user.role === 'admin') return user.adminProfile?.name;
  return 'Unknown';
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user);
      return res.json({
        success: true,
        token,
        role: user.role,
        displayName: getDisplayName(user),
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          displayName: getDisplayName(user),
          farmerProfile: user.farmerProfile,
          dairyOwnerProfile: user.dairyOwnerProfile,
          adminProfile: user.adminProfile,
        },
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

// @desc    Register a new user based on role
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { role, email, password, phone } = req.body;
    
    let userData = {
      role,
      email,
      password,
      phone
    };

    if (role === 'admin') {
      const { name, adminSignupSecret } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, field: 'name', message: 'Admin name is required' });
      }

      if (adminSignupSecret !== process.env.ADMIN_SIGNUP_SECRET) {
        return res.status(403).json({ success: false, field: 'adminSignupSecret', message: 'Invalid admin signup secret' });
      }

      userData.adminProfile = { name };
    }

    const newUser = await User.create(userData);

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      token,
      role: newUser.role,
      displayName: getDisplayName(newUser),
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        displayName: getDisplayName(newUser),
        farmerProfile: newUser.farmerProfile,
        dairyOwnerProfile: newUser.dairyOwnerProfile,
        adminProfile: newUser.adminProfile,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during user registration',
    });
  }
};

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    if (req.user) {
      return res.json({
        success: true,
        user: {
          id: req.user._id,
          email: req.user.email,
          role: req.user.role,
          displayName: getDisplayName(req.user),
          farmerProfile: req.user.farmerProfile,
          dairyOwnerProfile: req.user.dairyOwnerProfile,
          adminProfile: req.user.adminProfile,
        },
      });
    }
    return res.status(404).json({
      success: false,
      message: 'User profile not found',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving user profile',
    });
  }
};

// @desc    Send OTP for Registration
// @route   POST /api/auth/send-otp
// @access  Public
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    // Generate a 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to database (using upsert logic)
    await Otp.findOneAndUpdate(
      { email: cleanEmail },
      { otp: otpCode, createdAt: Date.now() },
      { upsert: true, new: true }
    );

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 20px; text-align: center;">
          <h1 style="color: #f8fafc; margin: 0; font-size: 24px;">GK Dairy System</h1>
        </div>
        <div style="padding: 30px; background-color: #ffffff; color: #334155;">
          <h2 style="margin-top: 0;">Registration OTP</h2>
          <p>You requested an OTP for registration. Your 6-digit code is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #06b6d4;">${otpCode}</span>
          </div>
          <p style="font-size: 14px; color: #64748b;">This OTP is valid for 10 minutes.</p>
        </div>
      </div>
    `;

    const { info, previewUrl } = await sendEmail({
      to: cleanEmail,
      subject: 'Your Registration OTP - GK Dairy',
      html: emailHtml,
    });

    return res.json({
      success: true,
      message: 'OTP sent successfully! Please check your email.',
      previewUrl,
    });
  } catch (error) {
    console.error('Send OTP Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// @desc    Forgot Password (Send OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    // Generate a 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to database
    await Otp.findOneAndUpdate(
      { email: cleanEmail },
      { otp: otpCode, createdAt: Date.now() },
      { upsert: true, new: true }
    );

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 20px; text-align: center;">
          <h1 style="color: #f8fafc; margin: 0; font-size: 24px;">GK Dairy System</h1>
        </div>
        <div style="padding: 30px; background-color: #ffffff; color: #334155;">
          <h2 style="margin-top: 0;">Password Reset OTP</h2>
          <p>You requested a password reset. Your 6-digit verification code is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #06b6d4;">${otpCode}</span>
          </div>
          <p style="font-size: 14px; color: #64748b;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      </div>
    `;

    const { info, previewUrl } = await sendEmail({
      to: cleanEmail,
      subject: 'Password Reset OTP - GK Dairy',
      html: emailHtml,
    });

    return res.json({
      success: true,
      message: 'OTP sent successfully! Please check your email.',
      previewUrl,
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process forgot password request' });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Verify OTP
    const otpRecord = await Otp.findOne({ email: cleanEmail }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({ success: false, field: 'otp', message: 'No OTP found or OTP expired. Please request a new one.' });
    }
    if (otpRecord.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, field: 'otp', message: 'Invalid OTP' });
    }

    // Clear OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    // Update User Password
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    await user.save(); // Password hashing is handled by the pre-save hook in User model

    return res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

// @desc    Admin Create Dairy Owner (with OTP)
// @route   POST /api/auth/admin/create-owner
// @access  Private (Admin)
export const adminCreateOwner = async (req, res) => {
  try {
    const { ownerName, email, password, phone, branchId, otp } = req.body;

    if (!ownerName || !email || !password || !branchId || !otp) {
      return res.status(400).json({ success: false, message: 'Missing required fields or OTP' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }
    
    // Check if user already exists
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ success: false, field: 'email', message: 'Email already registered' });
    }

    // Verify OTP
    const otpRecord = await Otp.findOne({ email: cleanEmail }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({ success: false, field: 'otp', message: 'No OTP found or OTP expired. Please resend.' });
    }
    if (otpRecord.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, field: 'otp', message: 'Invalid OTP' });
    }

    // Clear OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    // Verify Branch
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, field: 'branchId', message: 'Branch not found' });
    }

    // Create User
    const newUser = await User.create({
      email: cleanEmail,
      password: String(password).trim(),
      role: 'dairyOwner',
      name: ownerName,
      phone: phone ? String(phone).trim() : '',
      branch: branch._id,
      dairyOwnerProfile: {
        ownerName: ownerName,
        branchName: branch.name,
        branchNumber: branch.code,
        branchId: branch._id,
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Dairy Owner created successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Admin Create Owner Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create Dairy Owner' });
  }
};

// @desc    Admin get owners for a specific branch
// @route   GET /api/auth/admin/owners/:branchId
// @access  Private (Admin)
export const getAdminBranchOwners = async (req, res) => {
  try {
    const { branchId } = req.params;
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    const owners = await User.find({
      role: 'dairyOwner',
      $or: [
        { 'dairyOwnerProfile.branchId': branch._id },
        { 'dairyOwnerProfile.branchNumber': branch.code }
      ]
    }).select('-password');

    return res.json({ success: true, count: owners.length, data: owners });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch owners' });
  }
};

// @desc    Admin update owner details
// @route   PUT /api/auth/admin/owner/:id
// @access  Private (Admin)
export const adminUpdateOwner = async (req, res) => {
  try {
    const { ownerName, phone, email, password } = req.body;
    
    const owner = await User.findById(req.params.id);
    if (!owner || owner.role !== 'dairyOwner') {
      return res.status(404).json({ success: false, message: 'Owner not found' });
    }

    if (email) {
      const cleanEmail = String(email).trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(cleanEmail)) {
        const userExists = await User.findOne({ email: cleanEmail, _id: { $ne: owner._id } }).catch(() => null);
        if (userExists) {
          return res.status(400).json({ success: false, message: 'Email already registered for another user account' });
        }
        owner.email = cleanEmail;
      }
    }

    if (password) {
      owner.password = String(password).trim();
    }

    if (ownerName) {
      owner.name = ownerName;
      if (owner.dairyOwnerProfile) {
        owner.dairyOwnerProfile.ownerName = ownerName;
      }
    }
    
    if (phone !== undefined) {
      owner.phone = phone.trim();
    }

    await owner.save();

    return res.json({
      success: true,
      message: 'Owner updated successfully',
      data: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to update owner' });
  }
};

// @desc    Admin delete owner
// @route   DELETE /api/auth/admin/owner/:id
// @access  Private (Admin)
export const adminDeleteOwner = async (req, res) => {
  try {
    const owner = await User.findById(req.params.id);
    if (!owner || owner.role !== 'dairyOwner') {
      return res.status(404).json({ success: false, message: 'Owner not found' });
    }

    await User.findByIdAndDelete(req.params.id);

    return res.json({ success: true, message: 'Owner deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete owner' });
  }
};
