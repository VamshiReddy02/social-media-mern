const User = require("../models/User");



exports.register = async (req, res) => {
    try {
      const { name, email, password, avatar } = req.body;
  
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ success: false, message: "User already exists" });
      }
  
      user = await User.create({
        name,
        email,
        password,
        avatar: { public_id: "Sample_id", url: "samepleUrl" },
      });
  
      const token = await user.generateToken();
  
      const options = {
        expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
  
      res.status(201).cookie("token", token, options).json({
        success: true,
        user,
        token,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  exports.login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const user = await User.findOne({ email })
        .select("+password")
  
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User does not exist",
        });
      }
  
      const isMatch = await user.matchPassword(password);
  
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Incorrect password",
        });
      }
  
      const token = await user.generateToken();
  
      const options = {
        expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
  
      res.status(200).cookie("token", token, options).json({
        success: true,
        user,
        token,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  exports.logout = async (req, res) => {
    try {
      res
        .status(200)
        .cookie("token", null, { expires: new Date(Date.now()), httpOnly: true })
        .json({
          success: true,
          message: "Logged out",
        });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  

  exports.followUser = async (req, res) => {
    try {
      const userToFollow = await User.findById(req.params.id);
      const loggedInUser = await User.findById(req.user._id);
  
      if (!userToFollow || !loggedInUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      const isFollowing = loggedInUser.following.includes(userToFollow._id);
  
      if (isFollowing) {
        // Unfollow logic
        const update = { $pull: { following: userToFollow._id } };
        await User.findOneAndUpdate({ _id: loggedInUser._id }, update);
        await User.findOneAndUpdate({ _id: userToFollow._id }, { $pull: { followers: loggedInUser._id } });
        res.status(200).json({
          success: true,
          message: "User Unfollowed",
        });
      } else {
        // Follow logic
        const update = { $addToSet: { following: userToFollow._id } };
        await User.findOneAndUpdate({ _id: loggedInUser._id }, update);
        await User.findOneAndUpdate({ _id: userToFollow._id }, { $addToSet: { followers: loggedInUser._id } });
        res.status(200).json({
          success: true,
          message: "User followed",
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  