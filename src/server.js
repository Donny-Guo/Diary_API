import express from 'express'
import 'dotenv/config'
import { uploadImage } from './config/cloudinary.js'
import multer from "multer"
import { sql, initDB } from './config/db.js'

const PORT = process.env.PORT
const app = express()

// multer storage
const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
})

// middleware
app.use(express.json())

app.get('/', async (req, res) => {

})

app.post("/upload", upload.single('image'), async (req, res) => {
  try {
    // Get other parameters
    const { user_id } = req.body;

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        error: 'Please upload an image'
      });
    }

    // Validate required fields
    if (!user_id) {
      return res.status(400).json({
        error: 'user_id is required'
      });
    }

    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    // upload to cloudinary
    const uploadResult = await uploadImage(dataURI, [user_id, 'test'])
    const image_url = uploadResult["secure_url"]
    const text = "hello world"
    const emotion_category = "happy"
    const animal_category = "cat"
    console.log('image_url:', image_url)

    // add entry to postgres db
    try {
      await sql`
        INSERT INTO diaries (user_id, text, image_url, emotion_category, animal_category)
        VALUES (${user_id}, ${text}, ${image_url}, ${emotion_category}, ${animal_category} )
        RETURNING *;
      `
    } catch (error) {
      console.log("Error adding new entry to db:", error)
      res.status(500).json({ message: "Internal Server Error" })
    }

    res.status(200).json({ 'image_url': image_url })

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to upload image',
      message: error.message
    });
  }

})

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("Server is up and running on Port:", PORT)
    })
  })
