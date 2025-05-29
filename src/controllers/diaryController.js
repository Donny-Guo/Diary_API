import { sql } from '../config/db.js'
import { uploadImage } from "../config/cloudinary.js"
import { generateCatDiaryAllFromImage } from "../config/catDiaryService.js"

export async function getDiariesByUserId(req, res) {
  try {
    const { user_id } = req.params
    const diaries = await sql`
      SELECT * FROM diaries WHERE user_id = ${user_id}
      ORDER BY created_at DESC;
    `
    res.status(200).json(diaries)

  } catch (error) {
    console.log("Error getting user diaries:", error)
    res.status(500).json({ message: "Internal Server Error" })
  }
}

export async function createDiary(req, res) {
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
    console.log('image_url:', image_url)
    // Initialize default value
    let text = "hello world"
    let emotion_category = "happy"
    let animal_category = "cat"

    // get generated text from AI
    try {
      // no audio version
      const generatedResult = await generateCatDiaryAllFromImage(image_url)
      text = generatedResult.text
      emotion_category = generatedResult.tone
      console.log("Diary generated successfully:", generatedResult);
    } catch (error) {
      console.error("Error generating cat diary:", error.message);
    }
    

    // add entry to postgres db
    try {
      const result = await sql`
        INSERT INTO diaries (user_id, text, image_url, emotion_category, animal_category)
        VALUES (${user_id}, ${text}, ${image_url}, ${emotion_category}, ${animal_category} )
        RETURNING *;
      `
      res.status(200).json(result[0])

    } catch (error) {
      console.log("Error adding new entry to db:", error)
      res.status(500).json({ message: "Internal Server Error" })
    }

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to upload image',
      message: error.message
    });
  }
}

export async function deleteDiary(req, res) {
  try {
    const { id } = req.params
    // validate diary entry id is number
    if (isNaN(Number(id))) {
      return res.status(400).json({ message: "Invalid diary entry id" })
    }

    const result = await sql`
      DELETE FROM diaries WHERE id = ${id}
      RETURNING *;
    `
    if (result.length === 0) {
      res.status(404).json({ message: "Diary entry not found" })
    } else {
      res.status(200).json({ message: "Diary entry deleted successfully" })
    }

  } catch (error) {
    console.log("Error deleting diary entry:", error)
    res.status(500).json({ message: "Internal Server Error" })
  }
}

export async function getSummaryByUserID(req, res) {
  try {
    const { user_id } = req.params

    const summary = await sql`
      SELECT COUNT(*) FROM diaries WHERE user_id = ${user_id};
    `

    res.status(200).json({ entry_count: summary[0] })

  } catch (error) {
    console.log("Error getting user summary:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}