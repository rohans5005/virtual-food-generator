
import { GoogleGenAI, GenerateContentResponse, Modality } from '@google/genai';
import { ImageStyle } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is not defined. Please set the environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! }); // Non-null assertion because we check above.

/**
 * Converts a Blob or File object to a Base64 string.
 * @param blob The Blob or File to convert.
 * @returns A Promise that resolves with the Base64 string.
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URI prefix (e.g., "data:image/jpeg;base64,")
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error("Failed to convert blob to base64 string."));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Generates an image based on a text prompt and desired style using imagen-4.0-generate-001.
 * @param prompt The text prompt for image generation.
 * @param style The desired aesthetic style for the image.
 * @returns The base64 encoded image string.
 * @throws Error if image generation fails or no image is returned.
 */
export async function generateFoodImage(prompt: string, style: ImageStyle): Promise<string> {
  if (!API_KEY) {
    throw new Error("API Key is missing. Cannot generate image.");
  }

  let fullPrompt = prompt;
  let aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9' = '1:1';

  switch (style) {
    case ImageStyle.RUSTIC_DARK:
      fullPrompt = `High-end, professional food photography, rustic, dark lighting, moody, close-up, ${prompt}`;
      aspectRatio = '4:3';
      break;
    case ImageStyle.BRIGHT_MODERN:
      fullPrompt = `High-end, professional food photography, bright, modern, clean background, vibrant colors, ${prompt}`;
      aspectRatio = '16:9';
      break;
    case ImageStyle.SOCIAL_MEDIA:
      fullPrompt = `High-end, professional food photography, top-down view, social media ready, bright, clean, well-lit, ${prompt}`;
      aspectRatio = '1:1'; // Square for social media
      break;
  }

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio,
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages[0].image.imageBytes;
    } else {
      throw new Error("No image generated.");
    }
  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error(`Failed to generate image: ${(error as Error).message}`);
  }
}

/**
 * Edits an existing image using a text prompt with gemini-2.5-flash-image.
 * @param base64ImageData The base64 encoded string of the image to edit (without the data URI prefix).
 * @param mimeType The MIME type of the image (e.g., 'image/jpeg', 'image/png').
 * @param editPrompt The text prompt for editing the image.
 * @returns The base64 encoded edited image string.
 * @throws Error if image editing fails or no image is returned.
 */
export async function editFoodImage(
  base64ImageData: string,
  mimeType: string,
  editPrompt: string
): Promise<string> {
  if (!API_KEY) {
    throw new Error("API Key is missing. Cannot edit image.");
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: editPrompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const editedImagePart = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData?.mimeType?.startsWith('image/')
    );

    if (editedImagePart?.inlineData?.data) {
      return editedImagePart.inlineData.data;
    } else {
      throw new Error("No edited image returned by the model.");
    }
  } catch (error) {
    console.error('Error editing image:', error);
    throw new Error(`Failed to edit image: ${(error as Error).message}`);
  }
}
