//This is a script that will probably be used only once to sign-up the EY and programmer with their respected roles. To run -> node create-special-users.js 
//Reminder : these users cannot be signed-up through the log-in/sign-up page cause all the users that sign-up from there will role:'simple'

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Users = require('./src/models/User');

// My MongoDB Atlas URI from the .env file
const dbURI = process.env.MONGODB_URI;

// List of special users to create
const specialUsers = [
  {
    email: 'ey@yourdomain.com',
    passwordEnv: 'EY_PW',
    role: 'EY'
  },
  {
    email: 'prog@yourdomain.com',
    passwordEnv: 'PROG_PW',
    role: 'programmer'
  }
];

// Main function to connect and create users
async function createUsers() {
  try {
    await mongoose.connect(dbURI);
    console.log('Connected to MongoDB Atlas.');

    for (const user of specialUsers) {
      // Check if user already exists
      const existingUser = await Users.findOne({ email: user.email });
      if (existingUser) {
        console.log(`User ${user.email} already exists. Skipping.`);
        continue;
      }

      // Hash the password from the .env file
      const plainPassword = process.env[user.passwordEnv];
      if (!plainPassword) {
        console.error(`Password for ${user.email} not found in .env. Skipping.`);
        continue;
      }
      const hashedPassword = await bcrypt.hash(plainPassword, 10); // 10 is the salt rounds

      // Create and save the new user
      const newUser = new Users({
        email: user.email,
        password: hashedPassword,
        role: user.role
      });

      await newUser.save();
      console.log(`Successfully created user: ${user.email} with role: ${user.role}`);
    }

  } catch (err) {
    console.error('Error creating users:', err);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB Atlas.');
  }
}

createUsers();