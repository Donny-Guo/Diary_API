import express from 'express'
import multer from "multer"
import { getDiariesByUserId, deleteDiary, getSummaryByUserID, createDiary } from "../controllers/diaryController.js"

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

router.post("/upload", upload.single('image'), createDiary)

router.delete('/:id', deleteDiary)

router.get('/summary/:user_id', getSummaryByUserID)

export default router