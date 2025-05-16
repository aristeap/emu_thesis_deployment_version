const express = require('express');
const mongoose = require('mongoose');
const path = require('path');   // “path” helps us build file-paths in a safe way
const cors = require('cors');
const fs   = require('fs');     // “fs” lets us read and write files on disk  


const app = express();
const port = 3019;

const multer = require('multer');
const upload = multer(); // Initialize multer for parsing multipart form data

//for user login and signup---------------------------------------------------------:
//1. Dependencies : bcrypt secures passwords
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;   //controls how “strong” (and therefore how slow) each hash is—it’s a balance between security and performance.

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'src/views'))); // For HTML and other assets

// serve EMU-DB files
app.use(
  '/emuDB',
  express.static(path.join(__dirname, 'emuDBrepo'))
);

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




// Save posted annotJSON into EmuDB
//a “save” endpoint that writes whatever annotation JSON you POST into the right _annot.json file in your Emu DB folder.
app.post('/api/emuDB/:dbName/:bundleName/annot', (req, res) => {        //This says: “Whenever the server gets a POST to /api/emuDB/<yourDB>/<yourBundle>/annot, run the function inside.”
  const { dbName, bundleName } = req.params;                  //dbName and bundleName come from the URL you called.
  const annot = req.body;                                      //annot is the JSON your Angular app sent in the body.
  const out = path.join(__dirname, 'emuDBrepo', dbName, `${bundleName}_annot.json`);      //Builds the exact filename where we want to save, e.g.
  fs.writeFile(out, JSON.stringify(annot, null, 2), 'utf8', err => {
    if (err) {
      console.error('💥 write error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true });
  });
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




// Connect to MongoDB for main metadata and GridFS
mongoose.connect('mongodb://127.0.0.1:27017/metadata_db', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
 db.once('open', () => {
     console.log('MongoDB connection successful');
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
// NEW: For storing all the contents of files in the database (along with the FileMetadata.js)
const { GridFSBucket } = require('mongodb');

// Wait for the MongoDB connection to open
db.once('open', () => {
    console.log('Main MongoDB connection successful for GridFS');

    // Initialize GridFSBucket
    const { GridFSBucket } = require('mongodb');
    const bucket = new GridFSBucket(db.db, { bucketName: 'uploads' });

    // File upload endpoint: Upload file to GridFS and save technical metadata
    app.post('/upload-file', upload.single('file'), (req, res) => {
        const file = req.file;
        if (!file) return res.status(400).send('No file uploaded.');


        console.log("Original file name:", file.originalname);
        // Convert the filename using Buffer conversion
        const fixedName = Buffer.from(file.originalname, 'binary').toString('utf8');
        console.log("Converted file name:", fixedName);


        const uploadStream = bucket.openUploadStream(fixedName, {
          contentType: file.mimetype
        });
    
        uploadStream.on('error', (err) => {
          console.error('Error uploading file to GridFS:', err);
          return res.status(500).send('Error uploading file.');
        });
    
        uploadStream.on('finish', async () => {
          // Now the file has been written and uploadStream.id holds the _id of the stored file.
          const FileMetadata = require('./FileMetadata');
          const fileMetadata = new FileMetadata({
            fileType: file.mimetype.split('/')[0],  // e.g., "audio" from "audio/wav"
            fileName: fixedName,
            gridFSRef: uploadStream.id,             // Use the id from the upload stream
          });
    
          try {
            await fileMetadata.save();
            console.log('File metadata saved:', fileMetadata);
            res.send('File uploaded and metadata saved');
          } catch (saveError) {
            console.error('Error saving file metadata:', saveError);
            res.status(500).send('Error saving file metadata.');
          }
        });
    
        // Write the file buffer into the stream and close it.
        uploadStream.end(file.buffer);
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

    // Endpoint to download/stream a file from GridFS by its ID
    app.get('/download-file/:id', (req, res) => {
        try {
            const fileId = new mongoose.Types.ObjectId(req.params.id);
            bucket.openDownloadStream(fileId)
                .pipe(res)
                .on('error', (err) => {
                    console.error('Error downloading file:', err);
                    res.status(500).send('Error downloading file');
                });
        } catch (err) {
            res.status(400).send('Invalid file id');
        }
    });

    app.delete('/delete-file/:id', async (req, res) => {
        try {
          const fileId = new mongoose.Types.ObjectId(req.params.id);
      
          // Check if the file exists in GridFS
          const files = await bucket.find({ _id: fileId }).toArray();
          if (!files || files.length === 0) {
            console.error('File not found in GridFS for id', fileId);
            return res.status(404).send('File not found in GridFS.');
          }
      
          // Delete the file from GridFS
          await bucket.delete(fileId);
      
          // Delete metadata record
          const FileMetadata = require('./FileMetadata');
          await FileMetadata.deleteOne({ gridFSRef: fileId });
      
          console.log('File deleted successfully, ID:', fileId);
          res.send('File deleted successfully.');
        } catch (err) {
          console.error('Error deleting file:', err);
          res.status(500).send('Error deleting file.');
        }
    });
      
      
      

});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
