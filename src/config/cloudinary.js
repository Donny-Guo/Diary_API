import { v2 as cloudinary } from 'cloudinary'
import 'dotenv/config'
import { Readable } from 'stream';

// Configuration
cloudinary.config();

// Upload an image
export const uploadImage = async (file, tags) => {
  const uploadResult = await cloudinary.uploader
    .upload(
      file,
      {
        asset_folder: "cat_diary",
        tags,
      }
    )
    .catch((error) => {
      console.log(error);
    });

  console.log("Upload image successfully")
  return uploadResult
}

// upload an mp3 audio
export const uploadAudio = async (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video', // for audio files, use "video"
        folder: 'cat_audio',    // optional folder
        format: 'mp3',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    Readable.from(buffer).pipe(stream);
  });
}