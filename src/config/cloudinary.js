import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config'

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