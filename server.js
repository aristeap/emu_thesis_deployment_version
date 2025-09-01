const express = require('express');
const mongoose = require('mongoose');
const path = require('path');   // “path” helps us build file-paths in a safe way
const cors = require('cors');
const fs   = require('fs');     // “fs” lets us read and write files on disk  

// const archiver = require('archiver');
const os = require('os');
const tmp = require('tmp');
const PDFDocument = require('pdfkit'); // If not installed: npm install pdfkit

const ffmpeg = require('fluent-ffmpeg');
const {ObjectId } = require('mongodb');
const {MongoClient} = require('mongodb');
const pdfParse = require('pdf-parse');

const app = express();
const serverless = require('serverless-http');
const port = 3019;

const multer = require('multer');
const upload = multer(); // Initialize multer for parsing multipart form data

//for user login and signup---------------------------------------------------------:
//1. Dependencies : bcrypt secures passwords
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;   //controls how “strong” (and therefore how slow) each hash is—it’s a balance between security and performance.


//For deployment purposes------------------------------------------------------------|
require('dotenv').config();
//we must create a S3 client that will use the log-in credentials to communicate with the S3 bucket
//the purpose of this is to replace the gridFs reference and change it to a reference for the S3 bucket

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");  //imports all the necessary functions from the AWS SDK.
const s3Client = new S3Client({
  region: "us-east-1", // This is the region i chose for the bucket, when i created in the AWS   
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'src/views'))); // For HTML and other assets

// NEW: Serve EMU-DB annotation files directly from S3
app.get('/emuDB/:dbName/:bundleName/annot.json', async (req, res) => {
  const { dbName, bundleName } = req.params;
  const s3FileKey = `${bundleName}_annot.json`;

  const downloadParams = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: s3FileKey,
  };

  try {
    const { Body } = await s3Client.send(new GetObjectCommand(downloadParams));
    Body.pipe(res);
  } catch (err) {
    if (err.name === 'NoSuchKey') {
      console.warn(`Annotation file not found in S3: ${s3FileKey}`);
      // Serve a default, empty annotation if one doesn't exist
      const fallback = {
        levels: [],
        links: [],
        sampleRate: 20000, // You can set a default sample rate here
        pdfAnnotations: [],
        imageAnnotations: [],
        videoAnnotations: []
      };
      res.status(200).json(fallback);
    } else {
      console.error('Error serving annotation file from S3:', err);
      res.status(500).send('Error serving annotation file.');
    }
  }
});

const FileMetadata  = require('./FileMetadata');

const Users = require('./src/models/User');
// // 2. User schema/model: has email, hashed password, role (by default simle user)
// const userSchema = new mongoose.Schema({
//   email:    { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   role:     { type: String, default: 'simple' }  // simple user by default
// });
// const Users = mongoose.model('User', userSchema);

//bcrypt.hash is a one way hashing για τους κωδικους χρηστη. Δηλαδη οταν ο χρηστης κανει sign up, παιρνει τον κωδικα και τον πεταει μεσα σε μια hash function που κανει το 
//  'MyS3cr3t!' σε $2b$10$VhQx…. Αλλα απο το $2b$10$VhQx… δεν μπορει να βγει το 'MyS3cr3t!'. Οταν ο χρηστης κανει log in και βαζει τον κωδικο του, τον παιρνει και τον κανει hash,αν το αποτελεσμα
// ειναι ιδιο με καποιο που υπαρχει στη βαση τοτε γινεται succefull login. Με αυτο τον τροπο δν μαντευεται και ποτε ο κωδικος .


// List all users (or just those with admin roles)
app.get('/users', async (req, res) => {
  try {
    // if you only want “administrator” roles:
    // const admins = await Users.find({ role: 'administrator' }, 'email');
    const admins = await Users.find({}, 'email role');
    res.json(admins);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send(err.message);
  }
});


// DELETE a user and unassign them as researcher
app.delete('/users/:email', async (req, res) => {
  // 1) grab the raw param and decode it
  const rawParam = req.params.email;
  const email    = decodeURIComponent(rawParam);
  console.log('🗑️  DELETE /users/:email hit with param:', { rawParam, email });

  try {
    // 2) remove the user document
    const result = await Users.deleteOne({ email });
    console.log('   → deleteOne result:', result);
    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'No such user' });
    }

    // 3) pull that email out of any FileMetadata.researcherEmails arrays
    const update = await FileMetadata.updateMany(
      { researcherEmails: email },
      { $pull: { researcherEmails: email } }
    );
    console.log(`   → pulled "${email}" from ${update.nModified} file(s)`);

    // 4) success—204 No Content
    return res.sendStatus(204);
  }
  catch (err) {
    console.error('Error in DELETE /users/:email:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});


// NEW: Save annotJSON to S3
app.post('/api/emuDB/:dbName/:bundleName/annot', async (req, res) => {
  const { dbName, bundleName } = req.params;
  const annot = req.body;
  const s3FileKey = `${bundleName}_annot.json`;
  
  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME,     //so that the code knows where-in which bucket-it would store the annotation folders in
    Key: s3FileKey,                         //The Key parameter is what uniquely identifies the object within the bucket.
    Body: JSON.stringify(annot, null, 2),
    ContentType: 'application/json',
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));
    console.log(`Annotation for ${bundleName} saved to S3.`);
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving annotation to S3:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


app.post('/signup', async (req, res) => {
  try{
        
    const { email, password, role } = req.body;
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    // If role was passed in, use it; otherwise default to 'simple'
    await new Users({ email, password: hash, role: role || 'simple'}).save();

    res.json({ success: true });

  }catch(err){
    res.status(400).json({success:false, message: err.message});
  }

});

//the app.post('/signup) does:
// 1. pulls the incoming email,password,role out of the HTTP request body
// 2. hashes the password
// 3. stores a new user document in MongoDb
// 4. sends back a JSON response like { success: true, role: 'administrator' }


app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await Users.findOne({ email });
  if (!user) return res.status(401).json({ success: false, message: 'No such user' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ success: false, message: 'Wrong password' });
  res.json({ success: true, role: user.role });
});


// NEW: assign an admin to a file
app.post('/assign-admin', async (req, res) => {
  try {
    const { assignments } = req.body;
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No assignments provided'
      });
    }

    const ops = assignments.map(({ fileId, adminEmail }) => ({
      updateOne: {
        filter:  { _id: new mongoose.Types.ObjectId(fileId) },
        update:  { $set: { adminEmail } }
      }
    }));

    const result = await FileMetadata.bulkWrite(ops);
    console.log('Bulk assignment result:', result);
    return res.json({ success: true });
  }
  catch (err) {
    console.error('❌  Error in /assign-admin:', err);
    return res
      .status(500)
      .json({ success: false, message: err.message });
  }
});


// POST /assign-researcher
app.post('/assign-researchers', async (req, res) => {
  try {
    const { assignments } = req.body; // array of { fileId, researcherEmails?[], researcherEmail? }
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ success: false, message: 'No assignments provided' });
    }

    const ops = assignments.map(a => {
      const filter = { _id: new mongoose.Types.ObjectId(a.fileId) };
      let update;
      if (Array.isArray(a.researcherEmails)) {
        // wholesale replace
        update = { $set: { researcherEmails: a.researcherEmails } };
      } else if (typeof a.researcherEmail === 'string' && a.researcherEmail !== '') {
        // add a single researcher (deduped)
        update = { $addToSet: { researcherEmails: a.researcherEmail } };
      } else {
        // remove a single researcher (or if empty string, clear all)
        if (a.researcherEmail === '') {
          update = { $set: { researcherEmails: [] } };
        } else {
          update = { $pull: { researcherEmails: a.researcherEmail } };
        }
      }
      return { updateOne: { filter, update } };
    });

    await FileMetadata.bulkWrite(ops);
    res.json({ success: true });
  } catch (err) {
    console.error('Error in /assign-researchers:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});




// Connect to MongoDB for main metadata and GridFS --LOCALLY--
// mongoose.connect('mongodb://127.0.0.1:27017/metadata_db', { useNewUrlParser: true, useUnifiedTopology: true });
// const db = mongoose.connection;
//  db.once('open', () => {
//      console.log('MongoDB connection successful');
//  });

// Connect to MongoDB for main metadata and GridFS ---FOR DEPLOYMENT--
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
 db.once('open', () => {
   console.log('MongoDB--ONLINE FOR DEPLOYMENT--connected successfully!');
 });

// Schemas and Models
const recordingSchema = new mongoose.Schema({
    filename: String,
    title: String,
    description: String,
    date: Date,
    continent: String,
    country: String,
    region: String,
    address: String,
});
const actorSchema = new mongoose.Schema({
    first_name: String,
    full_name: String,
    age: Number,
    sex: String,
    education: String,
    ethnicity: String,
    email: String,
});
const contentSchema = new mongoose.Schema({
    genre: String,
    modalities: String,
    planning_type: String,
});
const languageSchema = new mongoose.Schema({
    lang_id : String,
    lang_name: String,
    dominant: String,
    source_lang: String,
    target_lang: String,
});

// Models
const Recordings = mongoose.model('Recording', recordingSchema);
const Actors = mongoose.model('Actor', actorSchema);
const Contents = mongoose.model('Content', contentSchema);
const Languages = mongoose.model('Language', languageSchema);


//NEW: Connect to MongoDB for PDF metadata (same metadata_db database but different collections)

// New schemas for PDF metadata
const pdfCorpusSchema = new mongoose.Schema({
    doc_title: String,
    corpus_type: String,
    genre: String,
    pub_year: Number,
    corpus_purpose: String,
    word_count: Number,
});
const pdfAuthorSchema = new mongoose.Schema({
    first_name: String,
    full_name: String,
    age: Number,
    sex: String,
    education: String,
    ethnicity: String,
    email: String,
});
const pdfLanguageSchema = new mongoose.Schema({
    lang_id: String,
    lang_name: String,
    dominant: String,
    source_lang: String,
    target_lang: String,
});

// Models for PDF metadata (using pdfConnection)
const PdfCorpus = mongoose.model('PdfCorpus', pdfCorpusSchema);
const PdfAuthor = mongoose.model('PdfAuthor', pdfAuthorSchema);
const PdfLanguage = mongoose.model('PdfLanguage', pdfLanguageSchema);


// Handle MetadataButton.component.html submissions
//Προς το παρον δεν αλλαζει γτ με το done κουμπι κανουμε τα data temporarily saved στο
app.post('/post-recording', upload.none(), async (req, res) => {
    try {
        const recording = new Recordings(req.body);
        await recording.save();
        console.log('Recording saved:', recording);
        res.send('Recording Submission Successful');
    } catch (err) {
        console.error('Error saving recording:', err);
        res.status(500).send('Error saving recording');
    }
});




app.post('/post-actor', upload.none(), async (req, res) => {
    try {
        // Log the parsed request body for debugging
        //console.log('Request body:', req.body);

        // Create a new actor using the parsed data
        const actor = new Actors(req.body);

        // Save the actor to the database
        await actor.save();

        // Log the saved actor to the console
        console.log('Actor saved:', actor);

        // Send a success response
        res.send('Actor Submission Successful');
    } catch (err) {
        // Handle errors and send an appropriate response
        console.error('Error saving actor:', err);
        res.status(500).send('Error saving actor');
    }
});


app.post('/post-content', upload.none(), async (req, res) => {
    try {
        const content = new Contents(req.body);
        await content.save();
        console.log('Content saved:', content);
        res.send('Content Submission Successful');
    } catch (err) {
        console.error('Error saving content:', err);
        res.status(500).send('Error saving content');
    }
});

app.post('/post-language', upload.none(), async (req, res) => {
    try {
        const language = new Languages(req.body);
        await language.save();
        console.log('Language saved:', language);
        res.send('Language Submission Successful');
    } catch (err) {
        console.error('Error saving language:', err);
        res.status(500).send('Error saving language');
    }
});


// Save metadata endpoint
app.post("/save-metadata", async (req, res) => {
    try {
      const { recording, content, actors, languages } = req.body;
  
      // Save recording
      if (recording && Object.keys(recording).length) {
        const newRecording = new Recordings(recording);
        await newRecording.save();
        console.log("Recording saved:", newRecording);
      }
  
      // Save content
      if (content && Object.keys(content).length) {
        const newContent = new Contents(content);
        await newContent.save();
        console.log("Content saved:", newContent);
      }
  
      // Save actors
      if (actors && actors.length) {
        for (const actor of actors) {
          const newActor = new Actors(actor);
          await newActor.save();
          console.log("Actor saved:", newActor);
        }
      }
  
      // Save languages
      if (languages && languages.length) {
        for (const language of languages) {
          const newLanguage = new Languages(language);
          await newLanguage.save();
          console.log("Language saved:", newLanguage);
        }
      }
  
      res.json({ message: "All metadata saved successfully!" });
    } catch (err) {
      console.error("Error saving metadata:", err);
      res.status(500).send("Error saving metadata");
    }
});
  

// ----------------------------------------------------------------------------------------------------------------------------------------
// NEW: Routes for PDF metadata submissions
app.post('/post-pdf-corpus', upload.none(), async (req, res) => {
    try {
        const pdfCorpus = new PdfCorpus(req.body);
        await pdfCorpus.save();
        console.log('PDF Corpus saved:', pdfCorpus);
        res.send('PDF Corpus Submission Successful');
    } catch (err) {
        console.error('Error saving PDF corpus:', err);
        res.status(500).send('Error saving PDF corpus');
    }
});

app.post('/post-pdf-author', upload.none(), async (req, res) => {
    try {
        const pdfAuthor = new PdfAuthor(req.body);
        await pdfAuthor.save();
        console.log('PDF Author saved:', pdfAuthor);
        res.send('PDF Author Submission Successful');
    } catch (err) {
        console.error('Error saving PDF author:', err);
        res.status(500).send('Error saving PDF author');
    }
});

app.post('/post-pdf-language', upload.none(), async (req, res) => {
    try {
        const pdfLanguage = new PdfLanguage(req.body);
        await pdfLanguage.save();
        console.log('PDF Language saved:', pdfLanguage);
        res.send('PDF Language Submission Successful');
    } catch (err) {
        console.error('Error saving PDF language:', err);
        res.status(500).send('Error saving PDF language');
    }
});

app.post("/save-pdf-metadata", async (req, res) => {
    try {
      const { corpus, authors, languages } = req.body;
      if (corpus && Object.keys(corpus).length) {
        const newCorpus = new PdfCorpus(corpus);
        await newCorpus.save();
        console.log("PDF Corpus saved:", newCorpus);
      }
      if (authors && authors.length) {
        for (const author of authors) {
          const newAuthor = new PdfAuthor(author);
          await newAuthor.save();
          console.log("PDF Author saved:", newAuthor);
        }
      }
      if (languages && languages.length) {
        for (const language of languages) {
          const newLanguage = new PdfLanguage(language);
          await newLanguage.save();
          console.log("PDF Language saved:", newLanguage);
        }
      }
      res.json({ message: "All PDF metadata saved successfully!" });
    } catch (err) {
      console.error("Error saving PDF metadata:", err);
      res.status(500).send("Error saving PDF metadata");
    }
});



// ----------------------------------------------------------------------------------------------------------------------------------------
// NEW: Connect to MongoDB for Image metadata (same metadata_db database but different collections)

// New schemas for Image metadata
const imgImageSchema = new mongoose.Schema({
    filename: String,
});
const imgBasicSchema = new mongoose.Schema({
    title: String,
    description: String,
    capture_date: Date,
    photographer: String,
    location: String,
});
const imgTechSchema = new mongoose.Schema({
    file_format: String,
    resolution: String,
    camera_model: String,
    exposure: String,
});

// Models for Image metadata (using imgConnection)
const ImgImage = mongoose.model('ImgImage', imgImageSchema);
const ImgBasic = mongoose.model('ImgBasic', imgBasicSchema);
const ImgTech = mongoose.model('ImgTech', imgTechSchema);

// ------------------------------
// Routes for Image metadata submissions

// Route for main image info (e.g. image name)
app.post('/post-image', upload.none(), async (req, res) => {
    try {
        const image = new ImgImage(req.body);
        await image.save();
        console.log('Image saved:', image);
        res.send('Image Submission Successful');
    } catch (err) {
        console.error('Error saving image:', err);
        res.status(500).send('Error saving image');
    }
});

// Route for Basic Info submissions
app.post('/post-img-basic', upload.none(), async (req, res) => {
    try {
        const basic = new ImgBasic(req.body);
        await basic.save();
        console.log('Image Basic Info saved:', basic);
        res.send('Image Basic Info Submission Successful');
    } catch (err) {
        console.error('Error saving image basic info:', err);
        res.status(500).send('Error saving image basic info');
    }
});

// Route for Technical Details submissions
app.post('/post-img-tech', upload.none(), async (req, res) => {
    try {
        const tech = new ImgTech(req.body);
        await tech.save();
        console.log('Image Technical Details saved:', tech);
        res.send('Image Technical Details Submission Successful');
    } catch (err) {
        console.error('Error saving image technical details:', err);
        res.status(500).send('Error saving image technical details');
    }
});

// Consolidated endpoint to save all image metadata
app.post("/save-img-metadata", async (req, res) => {
    try {
      const { image, basicInfo, techDetails } = req.body;
      
      // Save main image data
      if (image && Object.keys(image).length) {
        const newImage = new ImgImage(image);
        await newImage.save();
        console.log("Image saved:", newImage);
      }
      
      // Save basic info
      if (basicInfo && Object.keys(basicInfo).length) {
        const newBasic = new ImgBasic(basicInfo);
        await newBasic.save();
        console.log("Image Basic Info saved:", newBasic);
      }
      
      // Save technical details
      if (techDetails && Object.keys(techDetails).length) {
        const newTech = new ImgTech(techDetails);
        await newTech.save();
        console.log("Image Technical Details saved:", newTech);
      }
      
      res.json({ message: "All image metadata saved successfully!" });
    } catch (err) {
      console.error("Error saving image metadata:", err);
      res.status(500).send("Error saving image metadata");
    }
});


// ----------------------------------------------------------------------------------------------------------------------------------------

// Wait for the MongoDB connection to open
db.once('open', () => {
    console.log('Main MongoDB connection successful for S3 bucket');

    // NEW: For storing all the contents of files in S3
    const { Upload } = require("@aws-sdk/lib-storage");
    const {
      S3Client,
      PutObjectCommand,
      ListObjectsV2Command,
      GetObjectCommand,
      DeleteObjectCommand // You may need this for future updates
    } = require('@aws-sdk/client-s3');
    const { v4: uuidv4 } = require('uuid'); // Used to generate unique IDs for S3 filenames

    // My S3 bucket name from .env
    const bucketName = process.env.S3_BUCKET_NAME;

    // File upload endpoint: Upload file to S3 and save metadata
    app.post('/upload-file', upload.single('file'), async (req, res) => {
      const file = req.file;
      if (!file) return res.status(400).send('No file uploaded.');


      const fileExtension = path.extname(file.originalname);   // Get the file extension (e.g., .wav, .jpg) from the original filename
      const uniqueId = uuidv4();                      // Generate a unique ID to prevent filename conflicts in S3
      const s3FileName = `${uniqueId}${fileExtension}`;         // Combine the unique ID and the original extension to create a new, unique S3 filename

      // Parameters for S3 upload
      const uploadParams = {
        Bucket: bucketName,
        Key: s3FileName,              // The unique name of the file in the S3 bucket
        Body: file.buffer,            // The file content itself
        ContentType: file.mimetype,   // The file type (e.g., audio/wav)
      };

      try {
        // Perform the S3 upload

        const upload = new Upload({           // Create an instance of the Upload class to handle the upload to S3
          client: s3Client,
          params: uploadParams
        });

        // Run the upload operation and wait for it to finish
        const s3Result = await upload.done();

        // Create a new document in your MongoDB collection to store the file's metadata
        const FileMetadata = require('./FileMetadata');
        const fileMetadata = new FileMetadata({
          fileType: file.mimetype.split('/')[0],          // Extract the main file type (e.g., "audio")
          fileName: file.originalname,                    // Store the original filename provided by the user
          s3Ref: s3Result.Key,                       // <-- Corrected: Use s3Result.Key instead of s3Result.Location
        });

        console.log("s3Result.Key:  ",s3Result.Key);

        await fileMetadata.save();              // Save the metadata document to your MongoDB database
        console.log('File uploaded to S3 and metadata saved:', fileMetadata);
        res.status(200).send('File uploaded and metadata saved');
      } catch (err) {
        console.error('Error uploading file to S3:', err);
        res.status(500).send('Error uploading file.');
      }
    });
    

    // Endpoint to list all uploaded files (technical metadata)
    app.get('/files', async (req, res) => {
        try {
            const FileMetadata = require('./FileMetadata');
            const files = await FileMetadata.find();
            res.json(files);
        } catch (err) {
            console.error('Error retrieving files:', err);
            res.status(500).send('Error retrieving files');
        }
    });

    // NEW: Endpoint to download/stream a file from S3 by its metadata ID (in the s3Ref)
    app.get('/download-file/:id',async (req, res) => {
        try {
            const fileId = req.params.id; // Get the file's unique ID from the URL parameter
            
            // Find the metadata document in MongoDB to get the S3 URL
            const FileMetadata = require('./FileMetadata');
            const fileMetadata = await FileMetadata.findById(fileId);

            if (!fileMetadata) {
              return res.status(404).send('File not found in database.');
            }

            // The S3 URL is a full URL (e.g., https://bucket.s3.region.amazonaws.com/unique-id.wav)
            // We need to extract just the unique S3 filename (Key) from the end of the URL
            const s3FileKey = fileMetadata.s3Ref.split('/').pop();


            // Prepare S3 download parameters
            const downloadParams = {
              Bucket: process.env.S3_BUCKET_NAME,
              Key: s3FileKey,
            };

            // Get the file object from S3
            const { Body } = await s3Client.send(new GetObjectCommand(downloadParams));
            
            // Set response headers to stream the file back
            res.setHeader('Content-Type', fileMetadata.fileType);
            res.setHeader('Content-Disposition', `attachment; filename="${fileMetadata.fileName}"`);

            // Pipe the S3 file stream directly to the response
            Body.pipe(res);


        } catch (err) {

          console.error('Error downloading file from S3:', err);
          res.status(500).send('Error downloading file.');
        }
    });


    // NEW: Endpoint to delete a file from S3 and metadata from MongoDB
    app.delete('/delete-file/:id', async (req, res) => {
      try {
        const fileId = req.params.id; // Get the file's unique ID from the URL parameter

        // Find the metadata document to get the S3 URL and original filename
        const FileMetadata = require('./FileMetadata');
        const fileMetadata = await FileMetadata.findById(fileId);

        if (!fileMetadata) {
          return res.status(404).send('File not found in database.');
        }

        // Extract the S3 file Key (the unique filename) from the S3 URL
        const s3FileKey = fileMetadata.s3Ref.split('/').pop();

        // Prepare the parameters for the S3 delete command
        const deleteParams = {
          Bucket: process.env.S3_BUCKET_NAME, // The name of your S3 bucket
          Key: s3FileKey, // The unique name of the file in the S3 bucket
        };

        // Delete the file from the S3 bucket
        await s3Client.send(new DeleteObjectCommand(deleteParams));

        // Delete the metadata document from your MongoDB database using its ID
        await FileMetadata.findByIdAndDelete(fileId);

        // NEW: Delete the corresponding annotation JSON from S3
        const originalFilename = fileMetadata.fileName;
        const basename = path.basename(originalFilename, path.extname(originalFilename));
        const annotFilename = `${basename}_annot.json`;

        const deleteAnnotParams = {
              Bucket: process.env.S3_BUCKET_NAME,
              Key: annotFilename,
        };

        try {
          await s3Client.send(new DeleteObjectCommand(deleteAnnotParams));
          console.log(`Deleted annotation JSON from S3: ${annotFilename}`);
        }catch (err) {
          if (err.name === 'NoSuchKey') {
              console.warn(`No annotation file to delete in S3: ${annotFilename}`);
          } else {
            console.error(`Failed to delete annotation file from S3: ${annotFilename}`, err);
            // You may choose to still return a success message here, as the primary file is deleted.
          }
        }

        console.log('File deleted successfully (S3 + metadata + annotation), ID:', fileId);
        return res.send('File deleted successfully.');
      } catch (err) {
        console.error('Error deleting file:', err);
        return res.status(500).send('Error deleting file.');
      }
    });
      
    //For the search metadata feature
    app.get('/api/search', async (req, res) => {
      const { fileType, date, location, genre, corpusType, source } = req.query;   //gives the five filters as

      console.log('> /api/search req.query:', req.query);

      try {
        if (fileType === 'wav/video') {
          // Build a mongoose query for Recordings
          const q = {};

          // 1) date exact match 
          if (date) {
            // take only the YYYY-MM-DD part
            const [year, month, day] = date.split('-').map(Number);
            const dayStart = new Date(Date.UTC(year, month - 1, day,   0, 0, 0));
            const dayEnd   = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0));
            q.date = { $gte: dayStart, $lt: dayEnd };       
          }

          // 2) location in continent, country or region
          if (location) {
            const re = new RegExp(location, 'i');
            q.$or = [
              { continent: re },
              { country:   re },
              { region:    re },
              { address:   re }
            ];
          }

          if (req.query.title) {
            // case‐insensitive exact match
            q.title = new RegExp(`^${req.query.title}$`, 'i');
          }

          console.log('> /api/search mongo filter q:', JSON.stringify(q, null, 2));

          const results = await Recordings.find(q).lean();  // fetches only those documents and returns them as plain JS objects.
          return res.json({ results });     //we send back the results at the searchThroughDatabase.controller.ts

        }else if(fileType === 'pdf'){ 
          const q ={}

          //2)the date is pub_year (publication year) for the pdf:
          if(date){
            // date comes in as "YYYY-MM-DD", grab the year
            q.pub_year = parseInt(date.split('-')[0], 10);

          }

          if(genre){
            q.genre = new RegExp(`^${genre}$`, 'i');
          }

          if(corpusType){
            q.corpus_type = new RegExp(`^${corpusType}$`, 'i');
          }

          const results = await PdfCorpus.find(q).lean();
          return res.json({ results });

        }else if(fileType === 'image'){
            const q = {}

            // 2) Capture date (same day-range logic as audio)
            if (date) {
              const [Y, M, D] = date.split('-').map(Number);
              const start = new Date(Date.UTC(Y, M-1, D, 0,0,0));
              const end   = new Date(Date.UTC(Y, M-1, D+1, 0,0,0));
              q.capture_date = { $gte: start, $lt: end };
            }
            // 3) Location
            if (location) {
              const re = new RegExp(location, 'i');
              q.location = re;
            } 

            if(source){
              q.photographer = new RegExp(`^${source}$`, 'i');
            }

            const results = await ImgBasic.find(q).lean();
            return res.json({ results });
          }

        // you can add branches for image/pdf later
        return res.status(400).json({ message: 'Unsupported fileType' });
      } catch (err) {
        console.error('Search error:', err);
        return res.status(500).json({ message: 'Server error during search' });
      }
    });


    //the updated search-annotations endpoint now that we will move from the local version to the cloud one, will follow a different approach
    //the emuDBrepo folder will be removed so now the code cannot iterate through the directories searching for the correct annotation folder
    //The plan:
    //1.Remove File System Operations: Delete all fs references from the code.
    //2.Retrieve Annotations from S3: Since we cannot directly search the contents of files in S3, we will have to download all the annotation files and then perform the search. We will fetch a list of all annotation files in the S3 bucket and download each one individually. 
    //3.Perform Search In-Memory: We'll then iterate through the downloaded annotations, searching for matches based on the query parameters.

    // A helper function to convert a stream to a string
    function streamToString (stream) {
      const chunks = [];
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      });
    }

    app.get('/api/search/annotations/recordings', async (req, res) => {
      const { fileType, level, embodiedAction, label } = req.query;
      
      console.log("INSIDE THE annotations/recordings endpoint-------------------------------------");

      try {
        const hits = [];

        //1.List all annotation files from S3
        // ADAPTATION: We can no longer use fs.readdirSync to list files from a local folder.
        // Instead, we use the S3 SDK to list objects within our S3 bucket.
        const listParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Prefix: '', // This prefix lets us list all objects in the bucket
        };

        // Asynchronously send the ListObjectsV2Command to S3 to get a list of all objects.
        const listedObjects = await s3Client.send(new ListObjectsV2Command(listParams));
        
        // ADAPTATION: We filter the S3 objects to find only the annotation files (those ending in '_annot.json').
        const annotKeys = listedObjects.Contents.filter(obj => obj.Key.endsWith('_annot.json')).map(obj => obj.Key);

        // ADAPTATION: We loop through each annotation file key found in S3. 
        for (const s3FileKey  of annotKeys) {
          // ADAPTATION: We cannot read a file directly from the local file system.
          // We must now use a GetObjectCommand to download the file's content from S3.
          const getParams = {
              Bucket: process.env.S3_BUCKET_NAME,
              Key: s3FileKey,
          };


          const { Body } = await s3Client.send(new GetObjectCommand(getParams));
          console.log("Body::: ",Body);
          // ADAPTATION: The Body from S3 is a stream, so we use a helper function to
          // convert it to a string before parsing it as JSON. This replaces fs.readFileSync().
          const annotString = await streamToString(Body);
          const annot = JSON.parse(annotString);
          
          const bundleName = s3FileKey.replace('_annot.json', '');
          const lvls = annot.levels;

          // 3. Perform the search in memory
          for (const l of lvls) {
            for (const it of l.items) {
              let match = true;

              if (level) {
                match = match && l.name.toLowerCase() === level.toLowerCase();
              }

              if (match && label) {
                match = it.labels.some(lbl =>
                  lbl.value.toLowerCase() === label.toLowerCase()
                );
              }

              if (match && embodiedAction) {
                if (l.role !== 'embodied') {
                  match = false;
                } else if (embodiedAction === 'nothing') {
                  match = it.labels.length === 0;
                } else {
                  match = it.labels.some(lbl =>
                    lbl.value.toLowerCase() === embodiedAction.toLowerCase()
                  );
                }
              }

              if (match) {
                // 🔍 Lookup fileType from metadata
                const meta = await FileMetadata.findOne({
                  fileName: { $regex: new RegExp(`^${bundleName}\\.(wav|mp4)$`, 'i') }
                });

                hits.push({
                  dbName: 'myEmuDB', // We can hardcode this since all are in one bucket
                  bundleName,
                  level: l.name,
                  itemId: it.id,
                  fileType: meta?.fileType || 'audio'  // fallback to 'audio'
                });
              }
            }
          }
        }

        return res.json({ results: hits });
      } catch (err) {
        console.error('Annotation search error:', err);
        return res.status(500).json({ message: 'Server error during annotation search' });
      }
    });


    // NEW: Search for PDF annotations in S3
    app.get('/api/search/annotations/pdf', async (req, res) => {
      let { fileType, word = '', comment = '' } = req.query;
      let pos = req.query.pos || [], ner = req.query.ner || [], sa = req.query.sa || [];

      // normalize to arrays
      if (!Array.isArray(pos)) pos = [pos];
      if (!Array.isArray(ner)) ner = [ner];
      if (!Array.isArray(sa))  sa  = [sa];

      if (fileType !== 'pdf') {
        return res.status(400).json({ message: 'Only pdf supported here' });
      }

      try {
        const hits = [];

        // ADAPTATION: Use the AWS S3 SDK to list objects in the bucket.
        const listParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Prefix: '',     //all objects
        };

        // Asynchronously send the ListObjectsV2Command to S3 to get a list of all objects.
        const listedObjects = await s3Client.send(new ListObjectsV2Command(listParams));

        // ADAPTATION: Filter for annotation files that are likely to belong to PDFs.
        const annotKeys = listedObjects.Contents
          .filter(obj => obj.Key.endsWith('_annot.json'))
          .map(obj => obj.Key);
        
        
        // ADAPTATION: Loop through each annotation file key from S3
        for (const s3FileKey  of annotKeys){
          
          const getParams = {
              Bucket: process.env.S3_BUCKET_NAME,
              Key: s3FileKey,
          };

          const { Body } = await s3Client.send(new GetObjectCommand(getParams));
          const annotString = await streamToString(Body);
          const { pdfAnnotations = [] } = JSON.parse(annotString);

          if (pdfAnnotations.length === 0) {
                  continue;
          }

          const bundleName = s3FileKey.replace('_annot.json', '');

          // instead of .some(…), we loop through each annotation record
          for (const ann of pdfAnnotations) {
            // check all filters
            if (word && (!ann.word || ann.word.toLowerCase() !== word.toLowerCase())) {
              continue;
            }
            if (comment && (!ann.comment || !ann.comment.toLowerCase().includes(comment.toLowerCase()))) {
              continue;
            }
            if (pos.length && (!ann.pos || !pos.includes(ann.pos))) {
              continue;
            }
            if (ner.length && (!ann.ner || !ner.includes(ann.ner))) {
              continue;
            }
            if (sa.length && (!ann.sa || !sa.includes(ann.sa))) {
              continue;
            }

            // If we reach here, this annotation `ann` matches all requested filters.
            // Push a richer object back to the client.
            hits.push({
              dbName: 'myEmuDB',
              bundleName,
              word:   ann.word,
              pos:    ann.pos,
              ner:    ann.ner,
              sa:     ann.sa,
              comment: ann.comment,
              page:   ann.page,      // <-- the new page field
              pdfId:  ann.pdfId
            });
          }
          
        }

        return res.json({ results: hits });
      } catch (err) {
        console.error('PDF annotation search error:', err);
        return res.status(500).json({ message: 'Server error during PDF annotation search' });
      }
    });




    // return unique "moSymbol" and "moPhrase" values found across all imageAnnotations
    app.get('/api/annotations/image/symbolsAndPhrases', async (req, res) => {
      try {
        const symbols  = new Set();
        const phrases = new Set();

        // ADAPTATION: Use the AWS S3 SDK to list objects in the bucket.
        const listParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Prefix: '',
        };
        
        const listedObjects = await s3Client.send(new ListObjectsV2Command(listParams));

        // ADAPTATION: Filter for annotation files.
        const annotKeys = listedObjects.Contents
          .filter(obj => obj.Key.endsWith('_annot.json'))
          .map(obj => obj.Key);


        for (const s3FileKey  of annotKeys) {
          const getParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: s3FileKey,
          };

          const { Body } = await s3Client.send(new GetObjectCommand(getParams));
          const annotString = await streamToString(Body);
          const bundle = JSON.parse(annotString);
      
          (bundle.imageAnnotations || []).forEach(ann => {
            if (ann.moSymbol) symbols.add(ann.moSymbol);
            if (ann.moPhrase) phrases.add(ann.moPhrase);
          });
        }

        return res.json({ 
          symbols: Array.from(symbols).sort() ,
          phrases: Array.from(phrases).sort()
        });
        
        
      } catch (err) {
        console.error('Error collecting image symbol options:', err);
        return res.status(500).json({ message: 'Server error' });
      }
    });


    app.get('/api/search/annotations/image', async (req, res) => {
      const { letter = '', moSymbol = '', moPhrase = '', comment = '' } = req.query;

      // figure out which single filter was used
      const filters    = { letter, moSymbol, moPhrase, comment };
      const activeKeys = Object.keys(filters).filter(k => filters[k]);
      if (activeKeys.length !== 1) {
        // require exactly one criterion
        return res.json({ results: [] });
      }

      const key   = activeKeys[0];
      const value = filters[key].toString().toLowerCase();

      try {
        const hits = [];

        // ADAPTATION: Use the AWS S3 SDK to list objects.
        const listParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Prefix: '',
        };
        const listedObjects = await s3Client.send(new ListObjectsV2Command(listParams));

        // ADAPTATION: Filter for annotation files that are likely to belong to images.
        const annotKeys = listedObjects.Contents
          .filter(obj => obj.Key.endsWith('_annot.json'))
          .map(obj => obj.Key);

        // ADAPTATION: Loop through each annotation file key from S3.
        for (const s3FileKey  of annotKeys) {
          const getParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: s3FileKey,
          };

          const { Body } = await s3Client.send(new GetObjectCommand(getParams));
          const annotString = await streamToString(Body);
          const { imageAnnotations = [] } = JSON.parse(annotString);

          // If the annotation file has no imageAnnotations, skip it.
          if (imageAnnotations.length === 0) {
            continue;
          }
        
          const bundleName = s3FileKey.replace('_annot.json', '');

          // Loop through every single annotation entry
          for (const item of imageAnnotations) {
            let doesMatch = false;

            if (key === 'letter' && item.engAlpha) {
              doesMatch = item.engAlpha.toLowerCase() === value;
            }
            else if (key === 'moSymbol' && item.moSymbol) {
              doesMatch = item.moSymbol.toLowerCase() === value;
            }
            else if (key === 'moPhrase' && item.moPhrase) {
              doesMatch = item.moPhrase.toLowerCase() === value;
            }
            else if (key === 'comment' && item.comment) {
              doesMatch = item.comment.toLowerCase().includes(value);
            }

            if (doesMatch) {
              hits.push({
                dbName: 'myEmuDB', // We can hardcode this since all are in one bucket
                bundleName,
                word: item.word,
                bbox: item.bbox
              });
            }
          }
        }

        return res.json({ results: hits });
      } catch (err) {
        console.error('Image annotation search error:', err);
        return res.status(500).json({ message: 'Server error during image‐annotation search' });
      }
    });


    // ----------------------------------------------------------------------------
    // Single‐segment export endpoint WAV AND VIDEO:
    // ----------------------------------------------------------------------------
    app.get('/api/export/segment', async (req, res) => {
      try {
        console.log("------------------------------------------------------");
        const { dbName, bundle, level, itemId } = req.query;
        console.log(
          "dbName:", dbName,
          "bundle:", bundle,
          "level:", level,
          "itemId:", itemId
        );

        if (!dbName || !bundle || !level || !itemId) {
          return res.status(400).send('Missing parameters');
        }

        // ADAPTATION: Load annotations JSON from S3 instead of the local file system.
        const getAnnotParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: `${bundle}_annot.json`, // This is the correct key
        };

        console.log("getAnnotParams: ",getAnnotParams);
        let levels, sampleRate;

        try {
          const { Body } = await s3Client.send(new GetObjectCommand(getAnnotParams));
          const annotString = await streamToString(Body);
          const annotData = JSON.parse(annotString);
          levels = annotData.levels;
          sampleRate = annotData.sampleRate;
        } catch (err) {
          console.error("Error fetching annotation file from S3:", err);
          return res.status(404).send('Annotations not found in S3');
        }

        // 2) Find the right level & item
        const lvl = levels.find(l => l.name === level);
        if (!lvl) return res.status(404).send('Level not found');
        const item = lvl.items.find(i => String(i.id) === String(itemId));
        if (!item) return res.status(404).send('Annotation item not found');

        // 3) Compute start/duration in seconds (handle SEGMENT vs EVENT)
        let { sampleStart, sampleDur } = item;
        if (lvl.type === 'EVENT') {
          // 200 ms window around the timestamp
          const halfSamples = Math.floor((0.2 * sampleRate) / 2);
          sampleStart = Math.max(0, sampleStart - halfSamples);
          sampleDur   = halfSamples * 2;
        }
        const startSec = sampleStart / sampleRate;
        let   durSec   = sampleDur / sampleRate;
        if (!isFinite(startSec) || !isFinite(durSec) || durSec <= 0) {
          return res.status(500).send('Invalid start/duration');
        }

        // 4) Look up the file’s S3 reference from the MongoDB metadata
        const meta = await FileMetadata.findOne({
          fileName: { $regex: new RegExp(`^${bundle}\\.(wav|mp4)$`, 'i') }
        });
        if (!meta) {
          return res.status(404).send('File metadata not found');
        }
        console.log("--------------meta: ", meta);

        // Derive extension & detect video vs. audio
        const ext     = path.extname(meta.fileName).toLowerCase();   // “.wav” or “.mp4”
        const isVideo = (meta.fileType === 'video' || ext === '.mp4');

        if (isVideo) {
          // ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
          // VIDEO BRANCH 
          // ───────────────────────────────────────────────
          console.log(`→ Entering VIDEO branch for ${meta.fileName}`);

          // (a) Build a “tmp” path under our application’s ./tmp/ folder:
          const tmpDir      = path.resolve(__dirname, 'tmp');
          const tmpFilename = `${bundle}_${level}_${itemId}_${Date.now()}.mp4`;
          const tmpVideoPath = path.join(tmpDir, tmpFilename);

          // Ensure ./tmp/ exists:
          if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
          }

          // ADAPTATION: Download the video from S3 instead of GridFS.
          // We will create a local temporary file because FFmpeg needs it.
          // console.log(`  Downloading ${meta.fileName} from S3 → ${tmpVideoPath}`);
          console.log("meta.s3Ref: ",meta.s3Ref, "meta.fileName: ",meta.fileName);
          const s3DownloadParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: meta.s3Ref,             //the Key parameter indicate the object's name within the bucket
          };
          console.log("s3DownloadParams: ",s3DownloadParams);

          await new Promise(async (resolve, reject) => {
            try {
              const { Body } = await s3Client.send(new GetObjectCommand(s3DownloadParams));
              const fileStream = fs.createWriteStream(tmpVideoPath);
              Body.pipe(fileStream);
              fileStream.on('error', reject);
              fileStream.on('finish', resolve);
            } catch (err) {
              reject(err);
            }
          });
          console.log("File downloaded successfully from S3.");

          // (c) Probe the actual video duration so we can clamp durSec
          let videoDur = Infinity;
          try {
            const probeData = await new Promise((resolve, reject) => {
              ffmpeg.ffprobe(tmpVideoPath, (err, data) =>
                err ? reject(err) : resolve(data)
              );
            });
            videoDur = probeData.format.duration || Infinity;
            console.log(`  Video duration of ${bundle}: ${videoDur}s`);

            if (startSec > videoDur) {
              console.warn(
                `  Skipping ${bundle}_${level}_${itemId}: start ${startSec}s beyond video duration ${videoDur}s`
              );
              fs.unlinkSync(tmpVideoPath);
              return res.status(416).send('Requested start beyond video duration');
            }

            // Clamp durSec so that (startSec + durSec) ≤ videoDur
            durSec = Math.min(durSec, Math.max(0, videoDur - startSec));
            if (durSec <= 0) {
              console.warn(
                `  Skipping ${bundle}_${level}_${itemId}: zero‐length video segment`
              );
              fs.unlinkSync(tmpVideoPath);
              return res.status(416).send('Requested zero‐length video');
            }
          } catch (probeErr) {
            console.warn(`  Could not ffprobe “${bundle}”: ${probeErr.message}`);
          }

          // (d) Set response headers so the client knows to expect an MP4
          // Set headers
          res.setHeader('Content-Type', 'video/mp4');
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="${bundle}_${level}_${itemId}.mp4"`
          );

          const clippedPath = path.join(tmpDir, `clipped_${Date.now()}.mp4`);

          ffmpeg(tmpVideoPath)
            .outputOptions([
              `-ss ${startSec}`,     // now placed AFTER input
              `-t ${durSec}`,
              '-avoid_negative_ts make_zero',
              '-c:v libx264',
              '-preset veryfast',
              '-c:a aac',            // re-encode audio too
              '-movflags +faststart' // for smoother start playback
            ])
            .format('mp4')
            .on('start', cmd => {
              console.log('FFmpeg command:', cmd);
            })
            .on('error', err => {
              console.error('FFmpeg export error:', err.message);
              if (!res.headersSent) {
                res.status(500).send('FFmpeg video trim failed');
              }
              try { fs.unlinkSync(tmpVideoPath); } catch {}
              try { fs.unlinkSync(clippedPath); } catch {}
            })
            .on('end', () => {
              console.log('Video segment exported successfully:', clippedPath);

              const stream = fs.createReadStream(clippedPath);
              stream.pipe(res);

              stream.on('close', () => {
                try { fs.unlinkSync(tmpVideoPath); } catch {}
                try { fs.unlinkSync(clippedPath); } catch {}
              });
            })
            .save(clippedPath);


          // ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
          // End of VIDEO branch
          // ─────────────────────────────────────────────────────────────────


        } else {
          // ───────────────────────────────────────────────
          // AUDIO BRANCH (WAV)
          // ───────────────────────────────────────────────

          // (a) Set headers so the browser knows it’s getting a WAV:
          res.setHeader('Content-Type', 'audio/wav');
          res.setHeader(
            'Content-Disposition',  
            `attachment; filename="${bundle}_${level}_${itemId}.wav"`
          );
          
          // ADAPTATION: Open an S3 download stream, feed it into FFmpeg, and immediately pipe to `res`.
          const s3DownloadParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: meta.s3Ref, // Use the correct s3Ref from MongoDB, which is now the unique S3 key
          };
          
          const { Body } = await s3Client.send(new GetObjectCommand(s3DownloadParams));

         
          ffmpeg(Body)
            .inputFormat('wav')
            .outputOptions([
              `-ss ${startSec}`,   // seek after “-i”
              `-t ${durSec}`       // clip length
            ])
            .format('wav')
            .on('start', cmd => console.log('FFmpeg (audio) command:', cmd))
            .on('error', err => {
              console.error('FFmpeg error during segment export:', err);
            if (!res.headersSent) res.status(500).send('FFmpeg audio trim failed');
            })
            .on('end', () => {
              console.log(`Finished exporting ${bundle}_${level}_${itemId}.wav`);
            })
            .pipe(res, { end: true });
        }
      } catch (err) {
        console.error('Error in /api/export/segment:', err);
        if (!res.headersSent) {
          res.status(500).send('Server error');
        }
      }
    });


    // ----------------------------------------------------------------------------
    // ΝEW: Single‐segment export endpoint (handles .pdf exports) from S3
    // ----------------------------------------------------------------------------
    app.get('/api/export/pdfSegment', async (req, res) => {
      try {
        const { dbName, bundle, word, pos, page } = req.query;
        if (!dbName || !bundle || !word || !page) {
          return res.status(400).send('Missing parameters (need dbName, bundle, word, and page)');
        }
        const pageNum = parseInt(page, 10);
        if (isNaN(pageNum) || pageNum < 1) {
          return res.status(400).send('Invalid page number');
        }

        // 1) ADAPTATION: Load the annotation JSON from S3
        const getAnnotParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: `${bundle}_annot.json`,
        };
        
        let pdfAnnotations = [];

        try {
          const { Body } = await s3Client.send(new GetObjectCommand(getAnnotParams));
          const annotString = await streamToString(Body);
          const { pdfAnnotations: loadedAnnotations = [] } = JSON.parse(annotString);
          pdfAnnotations = loadedAnnotations;
        } catch (err) {
          console.error("Error fetching annotation file from S3:", err);
          return res.status(404).send('Annotations not found in S3');
        }

        // 2) Find the exact annotation
        const matches = pdfAnnotations.filter(item => {
          if (!item.word || item.word.toLowerCase() !== word.toLowerCase()) {
            return false;
          }
          if (item.page !== pageNum) {
            return false;
          }
          if (pos && item.pos && item.pos.toLowerCase() !== pos.toLowerCase()) {
            return false;
          }
          return true;
        });
        if (matches.length === 0) {
          console.warn(`→ no matching pdfAnnotations for word="${word}", pos="${pos||''}", page=${pageNum}`);
          return res.status(404).send('No matching annotation found');
        }

        // (We’ll just take the first match)
        const ann = matches[0];
        if (!ann.sentence) {
          console.warn(`→ annotation ${ann.word} has no sentence saved!`);
          return res.status(500).send('Annotation missing its sentence field');
        }

        // 3) Send back that exact sentence
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${bundle}_${word}_p${pageNum}.txt"`
        );
        return res.send(ann.sentence.trim() + '\n');
      }
      catch (err) {
        console.error('Error in /api/export/pdfSegment:', err);
        if (!res.headersSent) {
          res.status(500).send('Server error');
        }
      }
    });


    // ----------------------------------------------------------------------------
    // Single‐segment export endpoint (handles .image exports)
    // ----------------------------------------------------------------------------
    app.get('/api/export/imageSegment', async (req, res) => {
      try {
        const { dbName, bundle, top, left, width, height } = req.query;

        if (!dbName || !bundle || top == null || left == null || width == null || height == null) {
          return res.status(400).send('Missing parameters: need dbName, bundle, top, left, width, height');
        }

        const x = parseInt(left, 10);
        const y = parseInt(top, 10);
        const w = parseInt(width, 10);
        const h = parseInt(height, 10);

        if ([x, y, w, h].some(n => isNaN(n) || n < 0)) {
          return res.status(400).send('Invalid crop rectangle');
        }

        // 1) Look up the image’s metadata
        const meta = await FileMetadata.findOne({
          fileName: { $regex: new RegExp(`^${bundle}\\.(jpg|jpeg|png)$`, 'i') }
        });
        if (!meta) {
          return res.status(404).send('Image metadata not found');
        }

        // ADAPTATION: Create an S3 download stream and pipe it directly into FFmpeg
        const { Body } = await s3Client.send(new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: meta.s3Ref, 
        }));

        res.setHeader('Content-Type', 'image/png');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${bundle}_${x}_${y}_${w}x${h}.png"`
        );

        ffmpeg(Body) // Pipe the S3 stream directly to ffmpeg
          .inputOptions(['-f image2pipe']) // Tell FFmpeg to expect piped input
          .outputOptions([
            `-vf crop=${w}:${h}:${x}:${y}`,
            '-f image2pipe',
            '-vcodec png'
          ])
          .on('start', cmdline => {
            console.log('FFmpeg (image‐crop) command:', cmdline);
          })
          .on('error', (err, stdout, stderr) => {
            console.error('FFmpeg error while cropping image:', err.message);
            console.error('FFmpeg stderr:', stderr);
            if (!res.headersSent) {
              res.status(500).send('Server error while cropping image');
            }
          })
          .on('end', () => {
            console.log(`Finished cropping ${bundle} @ [${x},${y},${w}x${h}].png`);
          })
          .pipe(res, { end: true });

      } catch (err) {
        console.error('Error in /api/export/imageSegment:', err);
        if (!res.headersSent) {
          res.status(500).send('Server error');
        }
      }
    });




 


      

});

// Start the server
// We no longer start the server. Instead, we export a handler for Lambda.
module.exports.handler = serverless(app);
