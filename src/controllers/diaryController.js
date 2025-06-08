import { sql } from '../config/db.js'
import { uploadImage, uploadAudio } from "../config/cloudinary.js"
import { generateCatDiaryAllFromImage, detectCatToneFromImage, generatePersonaFromImage, generateCatDiary, chooseVoiceFromTone, generateAudio } from "../config/catDiaryService.js"

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

export async function getToneFromImageUrl(req, res) {
  try {
    const { image_url } = req.body
    console.log(req.body)
    if (!image_url) {
      return res.status(400).json({"error": "Image url is required"})
    }

    const tone = await detectCatToneFromImage(image_url)
    res.status(200).json({tone})

  } catch (error) {
    console.log("Error getting tone from image url:", error)
    res.status(500).json({ message: "Internal Server Error" })
  }
}

export async function processImage(req, res) {
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
    // console.log('image_url:', image_url)
    res.status(200).json({ image_url })

  } catch (error) {
    console.log("Error processing image:", error)
    res.status(500).json({ message: "Internal Server Error" })
  }
}

export async function getPersonaFromImageAndTone(req, res) {
  try {
    const {image_url, tone} = req.body
    if (!image_url) {
      return res.status(400).json({
        error: "image_url is required"
      })
    }

    if (!tone) {
      return res.status(400).json({
        error: "tone of the image is required"
      })
    }

    const persona = await generatePersonaFromImage(image_url, tone)
    res.status(200).json({persona})

  } catch (error) {
    console.log("Error getting persona from image and tone:", error)
    res.status(500).json({ message: "Internal Server Error" })
  }
}

export async function getDiaryFromImageAndPersona(req, res) {
  try {
    const { image_url, persona } = req.body
    if (!image_url) {
      return res.status(400).json({
        error: "image_url is required"
      })
    }

    if (!persona) {
      return res.status(400).json({
        error: "persona is required"
      })
    }

    const diary_text = await generateCatDiary(persona, image_url)

    res.status(200).json({ diary_text })

  } catch (error) {
    console.log("Error getting diary from image and persona:", error)
    res.status(500).json({ message: "Internal Server Error" })
  }
}

export async function getAudioFromDiaryAndTone(req, res) {
  try {
    const {text, tone} = req.body
    if (!text) {
      return res.status(400).json({
        error: "diary text is required"
      })
    }
    if (!tone) {
      return res.status(400).json({
        error: "tone is required"
      })
    }

    const voice = chooseVoiceFromTone(tone)
    console.log("generating audio...")
    const audioBuffer = await generateAudio(text, voice)
    console.log("uploading audio...")
    const audio_url = await uploadAudio(audioBuffer)
    if (!audio_url) throw new Error("Fail to get audio_url")
    console.log("audio_url:", audio_url)
    res.status(200).json({audio_url})
    
  } catch (error) {
    console.log("Error getting audio from Diary text and voice:", error)
    res.status(500).json({ message: "Internal Server Error" })
  }
}

// old create diary entry method
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

export async function createNewDiaryEntry(req, res) {
  // user_id, text, image_url, audio_url (may be null), emotion_category, 
  // animal_category

  try {
    const {user_id, text, image_url, emotion_category, animal_category} = req.body

    if (!user_id) {
      return res.status(400).json({error: "user_id can not be empty"})
    }
    if (!text) {
      return res.status(400).json({ error: "diary text can not be empty" })
    }
    if (!image_url) {
      return res.status(400).json({ error: "image_url can not be empty" })
    }
    if (!emotion_category) {
      return res.status(400).json({ error: "emotion_category can not be empty" })
    }
    if (!animal_category) {
      return res.status(400).json({ error: "animal_category can not be empty" })
    }

    let {audio_url} = req.body
    if (!audio_url) {
      audio_url = ""
    }

    const result = await sql`
      INSERT INTO diaries (user_id, text, image_url, audio_url, emotion_category, animal_category)
        VALUES (${user_id}, ${text}, ${image_url}, ${audio_url}, ${emotion_category}, ${animal_category} )
        RETURNING *;
    `
    res.status(200).json(result[0])

  } catch (error) {
    console.error("Error creating new diary entry in db:", error)
    res.status(500).json({message: "Internal Server Error"})
  }
}

export async function updateDiaryEntry(req, res) {
  try {
    const { id, user_id, text, image_url, emotion_category, animal_category } = req.body

    if (!id) {
      return res.status(400).json({error: "diary id can not be empty"})
    }
    if (!user_id) {
      return res.status(400).json({ error: "user_id can not be empty" })
    }
    if (!text) {
      return res.status(400).json({ error: "diary text can not be empty" })
    }
    if (!image_url) {
      return res.status(400).json({ error: "image_url can not be empty" })
    }
    if (!emotion_category) {
      return res.status(400).json({ error: "emotion_category can not be empty" })
    }
    if (!animal_category) {
      return res.status(400).json({ error: "animal_category can not be empty" })
    }

    let { audio_url } = req.body
    if (!audio_url) {
      audio_url = ""
    }

    const result = await sql`
      UPDATE diaries 
      SET text = ${text}, 
        image_url = ${image_url}, 
        audio_url = ${audio_url}, 
        emotion_category = ${emotion_category}, 
        animal_category = ${animal_category}
      WHERE id = ${id} AND user_id = ${user_id}
      RETURNING *;
    `
    if (result.length === 0) {
      return res.status(404).json({ error: 'Diary entry not found' });
    }

    return res.status(200).json({
      message: 'Diary updated successfully',
      data: result[0]
    })

  } catch (error) {
    console.error("Error updating diary entry:", error)
    res.status(500).json({ message: "Internal Server Error" })
  }
}