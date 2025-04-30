require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });             // 1. Load your `.env` file so `process.env.MONGO_URI`, `process.env.EY_PW`, etc. become available
const mongoose = require('mongoose');    // 2. ODM library for talking to MongoDB
const bcrypt   = require('bcrypt');      // 3. Library for hashing passwords
const SALT_ROUNDS = 10;                  // 4. How “strong” (and slow) the password hash should be

//We are bringing in the User schema from the models/User (we are exporting it in there)
const User = require('../../src/models/User');


async function seedAdmins() {
  // 🔗 1️⃣ Connect to your MongoDB using the URI from .env
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,       // (these options prevent deprecation warnings)
    useUnifiedTopology: true,
  });

  // 🔒 2️⃣ Hash each of the raw passwords you stored in `.env`
  const eyHash   = await bcrypt.hash(process.env.EY_PW,   SALT_ROUNDS);
  const progHash = await bcrypt.hash(process.env.PROG_PW, SALT_ROUNDS);

  // 👥 3️⃣ Define the two “special” accounts you want in your DB
  const admins = [
    { email: 'ey@yourdomain.com',   password: eyHash,   role: 'EY' },
    { email: 'prog@yourdomain.com', password: progHash, role: 'programmer' },
  ];

  // ⬆️ 4️⃣ For each admin account, do an “upsert”:
  //     – If a user with that email already exists, update their password+role.
  //     – If not, create a brand-new document.
  for (const a of admins) {
    await User.updateOne(
      { email: a.email }, // find by email
      { $set: a },        // set (or overwrite) password & role
      { upsert: true }    // insert if it didn’t already exist
    );
    console.log(`Seeded ${a.role} (${a.email})`);
  }

  // 🔌 5️⃣ Disconnect cleanly when you’re done
  await mongoose.disconnect();
}

// Finally, run the function and crash out if anything goes wrong
seedAdmins().catch(err => {
  console.error(err);
  process.exit(1);
});
