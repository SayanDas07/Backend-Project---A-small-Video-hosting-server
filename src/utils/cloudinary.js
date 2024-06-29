import {v2 as cloudinary} from "cloudinary"
import { Console } from "console";

import fs from "fs"

// Configuring cloudinary
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//upload file on cloudinary
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // Upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto",
        });
        //succesfully file uploaded on cloudinary
        //console.log("file is uploaded on cloudinary !!",response.url);
        //Console.log('response = ',response)
        fs.unlinkSync(localFilePath); // remove the locally saved temp files as successfully uploaded on cloudinary
        
        return response;
        
    } catch (error) {
        fs.unlinkSync(localFilePath); // remove the locally saved temp files as failed to upload on cloudinary

        return null;

        
    }


}

export {uploadOnCloudinary}