import express from 'express'
import multer from "multer"
import { getDiariesByUserId, deleteDiary, getSummaryByUserID, createDiary, processImage, getToneFromImageUrl, getPersonaFromImageAndTone, getDiaryFromImageAndPersona, getAudioFromDiaryAndTone } from "../controllers/diaryController.js"

const router = express.Router()

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

router.get('/:user_id', getDiariesByUserId)

router.post('/upload/image', upload.single('image'), processImage)

router.post('/tone', getToneFromImageUrl)

router.post('/persona', getPersonaFromImageAndTone)

router.post('/newDiary', getDiaryFromImageAndPersona)

router.post('/audio', getAudioFromDiaryAndTone)

router.post("/upload", upload.single('image'), createDiary)

router.delete('/:id', deleteDiary)

router.get('/summary/:user_id', getSummaryByUserID)

export default router