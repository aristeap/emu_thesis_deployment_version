const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');


const app = express();
const port = 3019;

const multer = require('multer');
const upload = multer(); // Initialize multer for parsing multipart form data

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'src/views'))); // For HTML and other assets

// Connect to MongoDB
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


// NEW: Connect to MongoDB for PDF metadata (new database)
const pdfConnection = mongoose.createConnection('mongodb://127.0.0.1:27017/metadata_forpdf_db', { useNewUrlParser: true, useUnifiedTopology: true });
pdfConnection.once('open', () => {
    console.log('PDF MongoDB connection successful');
});

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
const PdfCorpus = pdfConnection.model('PdfCorpus', pdfCorpusSchema);
const PdfAuthor = pdfConnection.model('PdfAuthor', pdfAuthorSchema);
const PdfLanguage = pdfConnection.model('PdfLanguage', pdfLanguageSchema);


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
// NEW: Connect to MongoDB for Image metadata (new database)
const imgConnection = mongoose.createConnection('mongodb://127.0.0.1:27017/metadata_forimg_db', { useNewUrlParser: true, useUnifiedTopology: true });
imgConnection.once('open', () => {
    console.log('Image MongoDB connection successful');
});

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
const ImgImage = imgConnection.model('ImgImage', imgImageSchema);
const ImgBasic = imgConnection.model('ImgBasic', imgBasicSchema);
const ImgTech = imgConnection.model('ImgTech', imgTechSchema);

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


// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
