import { useState } from 'react';

export function useAvatarUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadAvatar = async (file: File): Promise<string> => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only images are allowed');
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Image must be less than 2MB');
    }

    setIsUploading(true);

    try {
      // Convert to base64 data URL — stored locally, no server needed
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadAvatar, isUploading };
}
