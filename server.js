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
      
      
    //For the search metadata feature
    // at top of file:
    // const Recordings = mongoose.model('Recording', recordingSchema);
    // (make sure that’s already defined)

    app.get('/api/search', async (req, res) => {
      const { fileType, date, location, genre, corpusType, source } = req.query;   //gives the five filters as

      console.log('> /api/search req.query:', req.query);

      try {
        if (fileType === 'wav/video') {
          // Build a mongoose query for Recordings
          const q = {};

          // 1) date exact match (you can extend to ranges later)
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

    // helper: read & parse a JSON file
    function loadAnnot(dbName, bundleName) {
      const p = path.join(__dirname, 'emuDBrepo', dbName, `${bundleName}_annot.json`);
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }

    app.get('/api/search/annotations/recordings', async (req, res) => {
      const { fileType, level, embodiedAction, label } = req.query;
      if (fileType !== 'wav/video') {
        return res.status(400).json({ message: 'Only wav/video supported right now' });
      }

      try {
        const repoPath = path.join(__dirname, 'emuDBrepo');
        const dbDirs   = fs
          .readdirSync(repoPath)
          .filter(d => fs.statSync(path.join(repoPath, d)).isDirectory());

        const hits = [];

        for (const dbName of dbDirs) {
          const bundleFiles = fs
            .readdirSync(path.join(repoPath, dbName))
            .filter(fn => fn.endsWith('_annot.json'));

          for (const annotFile of bundleFiles) {
            const bundleName = annotFile.replace('_annot.json', '');
            const annot      = loadAnnot(dbName, bundleName);
            const lvls       = annot.levels;

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
                    dbName,
                    bundleName,
                    level: l.name,
                    itemId: it.id,
                    fileType: meta?.fileType || 'audio'  // fallback to 'audio'
                  });
                }
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
        const repoPath = path.join(__dirname, 'emuDBrepo');
        const hits = [];

        // iterate over every EMU‐DB folder
        for (const dbName of fs
          .readdirSync(repoPath)
          .filter(d => fs.statSync(path.join(repoPath, d)).isDirectory())
        ) {
          // for each bundle in that dbName
          const bundleFiles = fs
            .readdirSync(path.join(repoPath, dbName))
            .filter(fn => fn.endsWith('_annot.json'));

          for (const annotFile of bundleFiles) {
            const bundleName = annotFile.replace('_annot.json', '');
            const { pdfAnnotations = [] } = loadAnnot(dbName, bundleName);

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
                dbName,
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
        const repoPath = path.join(__dirname, 'emuDBrepo');
        const dbDirs   = fs.readdirSync(repoPath).filter(d => fs.statSync(path.join(repoPath, d)).isDirectory());
        const symbols  = new Set();
        const phrases = new Set();
        // console.log("repoPath: ",repoPath, " dbDirs: ",dbDirs," symbols: ",symbols);

        for (const db of dbDirs) {
          const files = fs.readdirSync(path.join(repoPath, db)).filter(fn => fn.endsWith('_annot.json'));
          // console.log("files: ",files);
          for (const fn of files) {
            const bundle = loadAnnot(db, fn.replace('_annot.json',''));
            // console.log("bundle: ",bundle);
            //console.log("bundle.imageAnnotations: ",bundle.imageAnnotations);
            (bundle.imageAnnotations || []).forEach(ann => {
              if (ann.moSymbol) symbols.add(ann.moSymbol);
              //console.log("ann.moSymbol: ",ann.moSymbol);

              if (ann.moPhrase) phrases.add(ann.moPhrase);
              //console.log("ann.moPhrase: ",ann.moPhrase);

            });
          }
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
      const { letter, moSymbol, moPhrase, comment } = req.query;

      // figure out which single filter was used
      const filters = { letter, moSymbol, moPhrase, comment };
      const activeKeys = Object.keys(filters).filter(k => filters[k]);
      if (activeKeys.length !== 1) {
        // require exactly one criterion
        return res.json({ results: [] });
      }
      const key = activeKeys[0];
      const value = filters[key].toString().toLowerCase();

      try {
        const repoPath = path.join(__dirname, 'emuDBrepo');
        const dbDirs = fs.readdirSync(repoPath).filter(d => fs.statSync(path.join(repoPath, d)).isDirectory());

        const hits = [];

        for (const dbName of dbDirs) {
          const annotFiles = fs.readdirSync(path.join(repoPath, dbName)).filter(fn => fn.endsWith('_annot.json'));

          for (const fn of annotFiles) {
            const bundleName = fn.replace('_annot.json', '');
            const annot = loadAnnot(dbName, bundleName);
            const items = annot.imageAnnotations || [];

            // check if *any* annotation item matches your single filter:
            let match = false;
            if (key === 'letter') {
              match = items.some(i => i.engAlpha.toLowerCase() === value);
            } else if (key === 'moSymbol') {
              match = items.some(i => i.moSymbol.toLowerCase() === value);
            } else if (key === 'moPhrase') {
              match = items.some(i => i.moPhrase.toLowerCase() === value);
            } else if (key === 'comment') {
              match = items.some(i => i.comment.toLowerCase().includes(value));
            }

            if (match) {
              hits.push({ dbName, bundleName });
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

        // 1) Load annotations JSON
        const annotPath = path.join(__dirname, 'emuDBrepo', dbName, `${bundle}_annot.json`);
        if (!fs.existsSync(annotPath)) {
          return res.status(404).send('Annotations not found');
        }
        const { levels, sampleRate } = JSON.parse(fs.readFileSync(annotPath, 'utf8'));

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

        // 4) Look up the file’s GridFS _id (match .wav or .mp4)
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
          // VIDEO BRANCH (only modify inside here)
          // ───────────────────────────────────────────────
        console.log(`→ Entering VIDEO branch for ${meta.fileName}`);

          // (a) Build a “tmp” path under YOUR application’s ./tmp/ folder:
          const tmpDir      = path.resolve(__dirname, 'tmp');
          const tmpFilename = `${bundle}_${level}_${itemId}_${Date.now()}.mp4`;
          const tmpVideoPath = path.join(tmpDir, tmpFilename);

          // Ensure ./tmp/ exists:
          if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
          }

          console.log("tmpVideoPath", tmpVideoPath);
          console.log(`  Downloading ${meta.fileName} → ${tmpVideoPath}`);

          // (b) Download from GridFS into tmpVideoPath
          await new Promise((resolve, reject) => {
            const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
            bucket.openDownloadStream(new ObjectId(meta.gridFSRef))
              .pipe(fs.createWriteStream(tmpVideoPath))
              .on('error', reject)
              .on('finish', resolve);
          });

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
            // We’ll try anyway—if truly out of range, FFmpeg will error.
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

          // (b) Open a GridFS read stream, feed it into FFmpeg, and immediately pipe to `res`
          const bucket      = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
          const inputStream = bucket.openDownloadStream(new ObjectId(meta.gridFSRef));

          ffmpeg(inputStream)
            .inputFormat('wav')
            .outputOptions([
              `-ss ${startSec}`,   // seek after “-i”
              `-t ${durSec}`       // clip length
            ])
            .format('wav')
            .on('start', cmd => console.log('FFmpeg (audio) command:', cmd))
            .on('error', err => {
              console.error('FFmpeg error during segment export:', err);
              if (!res.headersSent) res.status(500).end();
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
    // Single‐segment export endpoint (handles .pdf exports)
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

        // 1) Load the annotation JSON
        const annotPath = path.join(__dirname, 'emuDBrepo', dbName, `${bundle}_annot.json`);
        if (!fs.existsSync(annotPath)) {
          return res.status(404).send('Annotations not found');
        }
        const { pdfAnnotations = [] } = JSON.parse(fs.readFileSync(annotPath, 'utf8'));

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








 


      

});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
