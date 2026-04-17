import cloudinary from "../config/cloudinary.js";

export function generateSignedUrl(publicId) {
    return cloudinary.url(publicId,{
        type: "authenticated",
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60
    })
}

export function generateSignedUrlMultiple(arr) {
   return arr.map((post)=>({...post,imgurl: generateSignedUrl(post.imgurl)})) 
}
