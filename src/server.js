import express from 'express'
import 'dotenv/config'
import { initDB } from './config/db.js'
import diaryRouter from "./routes/diaryRoute.js"
import rateLimiter from './middleware/rateLimiter.js'
import job from "./config/cron.js"

if (process.env.NODE_ENV === "production") {
  job.start()
}

const PORT = process.env.PORT
const app = express()
app.set('trust proxy', 1);

// middleware
app.use(rateLimiter)
app.use(express.json())

app.use('/api/user', diaryRouter)

app.get('/api/health', async (req, res) => {
  res.status(200).json({ status: "ok" })
})

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("Server is up and running on Port:", PORT)
    })
  })
