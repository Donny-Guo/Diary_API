import ratelimit from '../config/upstash.js'

const rateLimiter = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // limit by ip address
    const { success } = await ratelimit.limit(ip)

    if (!success) {
      return res.status(429).json({
        message: "Too man requests, please try again later"
      })
    }
    next()

  } catch (error) {
    console.log("Rate limit error", error)
    next(error)
  }
}

export default rateLimiter