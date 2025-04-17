//This metadata file is for storing the contents that the database should hold (οπως λεει στην εκφωνηση της διπλωματικης)
//This schema is only for technical details (like file type, name, etc.) and will link to the actual file stored in GridFS. 
//It had NOTHING to do with the 'Add Metadata' page

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fileMetadataSchema = new Schema({
  fileType: { type: String, required: true },      // e.g., 'audio', 'video', 'image'
  fileName: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  gridFSRef: { type: Schema.Types.ObjectId, ref: 'fs.files' },
  // Optional fields
  duration: Number,         // for audio/video files
  resolution: String        // for image/video files (e.g., '1920x1080')
});

module.exports = mongoose.model('FileMetadata', fileMetadataSchema);
