import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

const AUDIO_BUCKET = 'audio';
const IMAGES_BUCKET = 'images';

/**
 * Upload an audio file to Supabase Storage
 * @param {Blob} audioBlob - The audio blob to upload
 * @param {string} userId - The user's ID
 * @param {string} entryId - Optional entry ID for organization
 * @returns {Promise<{url: string, path: string} | null>}
 */
export async function uploadAudio(audioBlob, userId, entryId = null) {
  const fileId = uuidv4();
  const extension = 'webm'; // Default to webm for MediaRecorder
  const fileName = entryId
    ? `${userId}/${entryId}/${fileId}.${extension}`
    : `${userId}/${fileId}.${extension}`;

  const { data, error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(fileName, audioBlob, {
      contentType: 'audio/webm',
      cacheControl: '3600',
    });

  if (error) {
    console.error('Error uploading audio:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(AUDIO_BUCKET)
    .getPublicUrl(data.path);

  return {
    url: publicUrl,
    path: data.path,
  };
}

/**
 * Upload an image file to Supabase Storage
 * @param {File} imageFile - The image file to upload
 * @param {string} userId - The user's ID
 * @param {string} entryId - Optional entry ID for organization
 * @returns {Promise<{url: string, path: string} | null>}
 */
export async function uploadImage(imageFile, userId, entryId = null) {
  const fileId = uuidv4();
  const extension = imageFile.name.split('.').pop() || 'jpg';
  const fileName = entryId
    ? `${userId}/${entryId}/${fileId}.${extension}`
    : `${userId}/${fileId}.${extension}`;

  const { data, error } = await supabase.storage
    .from(IMAGES_BUCKET)
    .upload(fileName, imageFile, {
      contentType: imageFile.type,
      cacheControl: '3600',
    });

  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(IMAGES_BUCKET)
    .getPublicUrl(data.path);

  return {
    url: publicUrl,
    path: data.path,
  };
}

/**
 * Delete a file from storage
 * @param {string} bucket - The bucket name
 * @param {string} path - The file path
 */
export async function deleteFile(bucket, path) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error('Error deleting file:', error);
    return false;
  }

  return true;
}

/**
 * Get a signed URL for temporary access
 * @param {string} bucket - The bucket name
 * @param {string} path - The file path
 * @param {number} expiresIn - Seconds until expiration (default 1 hour)
 */
export async function getSignedUrl(bucket, path, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }

  return data.signedUrl;
}
