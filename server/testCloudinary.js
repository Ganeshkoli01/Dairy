import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const secretsToTest = [
  '5-lAeJ941buTn--gSuu7d9caCVA',
  '5-lAeJ94lbuTn--gSuu7d9caCVA',
  '5-IAeJ94lbuTn--gSuu7d9caCVA',
  '5-IAeJ941buTn--gSuu7d9caCVA'
];

async function testSecret(secret) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: secret,
  });

  return new Promise((resolve) => {
    cloudinary.uploader.upload('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 
      { folder: 'test' }, 
      (error, result) => {
        if (error) {
          console.log(`Failed with ${secret}`);
          resolve(false);
        } else {
          console.log(`SUCCESS with ${secret}`);
          resolve(true);
        }
      }
    );
  });
}

(async () => {
  for (const secret of secretsToTest) {
    if (await testSecret(secret)) break;
  }
})();

console.log('Testing cloudinary config with:');
console.log('Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API key:', process.env.CLOUDINARY_API_KEY);

cloudinary.uploader.upload('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 
  { folder: 'test' }, 
  (error, result) => {
    if (error) {
      console.error('Upload Error:', error);
    } else {
      console.log('Upload Success:', result.secure_url);
    }
  }
);
