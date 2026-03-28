import { v2 as cloudinary } from 'cloudinary';

let isConfigured = false;

const ensureCloudinaryConfig = () => {
  if (isConfigured) {
    return;
  }

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error('Cloudinary environment variables are not configured');
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  isConfigured = true;
};

export const extractPublicIdFromUrl = (fileUrl = '') => {
  if (!fileUrl || typeof fileUrl !== 'string') {
    return null;
  }

  const cleanUrl = fileUrl.split('?')[0].split('#')[0];
  const uploadMarker = '/upload/';
  const uploadMarkerIndex = cleanUrl.indexOf(uploadMarker);

  if (uploadMarkerIndex === -1) {
    return null;
  }

  let afterUpload = cleanUrl.slice(uploadMarkerIndex + uploadMarker.length);
  afterUpload = afterUpload.replace(/^v\d+\//, '');

  if (!afterUpload) {
    return null;
  }

  return afterUpload.replace(/\.[^.\/]+$/, '');
};

export const deleteFromCloudinary = async ({
  publicId,
  url,
  resourceType = 'raw',
}) => {
  const resolvedPublicId = publicId || extractPublicIdFromUrl(url);

  if (!resolvedPublicId) {
    return {
      success: false,
      skipped: true,
      reason: 'Missing publicId and unable to parse from URL',
      publicId: null,
    };
  }

  ensureCloudinaryConfig();

  const resourceCandidates =
    resourceType === 'auto' ? ['raw', 'image', 'video'] : [resourceType];

  for (const candidateType of resourceCandidates) {
    const response = await cloudinary.uploader.destroy(resolvedPublicId, {
      resource_type: candidateType,
      invalidate: true,
    });

    if (response.result === 'ok' || response.result === 'not found') {
      return {
        success: true,
        skipped: false,
        result: response.result,
        publicId: resolvedPublicId,
        resourceType: candidateType,
      };
    }
  }

  return {
    success: false,
    skipped: false,
    publicId: resolvedPublicId,
    reason: 'Cloudinary destroy did not return ok/not found',
  };
};