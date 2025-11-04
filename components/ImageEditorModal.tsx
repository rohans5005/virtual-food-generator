
import React, { useState, useCallback } from 'react';
import { GeneratedImage } from '../types';
import { editFoodImage } from '../services/geminiService';
import Spinner from './Spinner';

interface ImageEditorModalProps {
  image: GeneratedImage;
  onClose: () => void;
  onImageEdited: (editedImage: GeneratedImage) => void;
}

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ image, onClose, onImageEdited }) => {
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [editingImage, setEditingImage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentEditedImageUrl, setCurrentEditedImageUrl] = useState<string>(image.imageUrl);

  const handleEdit = useCallback(async () => {
    if (!editPrompt.trim()) {
      setError('Please enter an edit prompt.');
      return;
    }
    setEditingImage(true);
    setError(null);

    try {
      // Extract base64 data from the current image URL (remove data URI prefix)
      const base64Data = currentEditedImageUrl.split(',')[1];
      const mimeType = currentEditedImageUrl.split(';')[0].split(':')[1];

      if (!base64Data || !mimeType) {
        throw new Error('Could not extract image data for editing.');
      }

      const editedBase64 = await editFoodImage(base64Data, mimeType, editPrompt);
      const newImageUrl = `data:${mimeType};base64,${editedBase64}`;

      const updatedImage: GeneratedImage = {
        ...image,
        imageUrl: newImageUrl, // Update to the latest edited image
        editHistory: [...image.editHistory, { prompt: editPrompt, imageUrl: newImageUrl }],
      };
      onImageEdited(updatedImage); // Propagate the updated image to the parent
      setCurrentEditedImageUrl(newImageUrl); // Update local state for subsequent edits
      setEditPrompt(''); // Clear prompt after successful edit
    } catch (err) {
      console.error('Error during image editing:', err);
      setError(`Failed to edit image: ${(err as Error).message}`);
    } finally {
      setEditingImage(false);
    }
  }, [editPrompt, currentEditedImageUrl, image, onImageEdited]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 sm:p-6 md:p-8">
      <div className="relative w-full max-w-lg md:max-w-3xl lg:max-w-4xl bg-white rounded-lg shadow-xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Edit Photo: {image.dishName}</h2>

        <div className="mb-6 flex flex-col items-center">
          <img src={currentEditedImageUrl} alt={`Edited ${image.dishName}`} className="max-w-full h-auto rounded-md shadow-md mb-4 max-h-[40vh] object-contain" />
          <p className="text-sm text-gray-600">Original Prompt: <span className="italic">{image.originalPrompt}</span></p>
          {image.editHistory.length > 0 && (
            <div className="mt-2 text-sm text-gray-700">
              <p className="font-semibold">Edit History:</p>
              <ul className="list-disc list-inside text-xs text-gray-600 max-h-24 overflow-y-auto">
                {image.editHistory.map((edit, index) => (
                  <li key={index} className="truncate">{edit.prompt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="editPrompt" className="block text-gray-700 text-sm font-bold mb-2">
            Enter your edit prompt:
          </label>
          <textarea
            id="editPrompt"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-y min-h-[80px]"
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            placeholder="e.g., Add a retro filter, Remove the person in the background, Make it brighter"
            rows={3}
            disabled={editingImage}
          ></textarea>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
            disabled={editingImage}
          >
            Close
          </button>
          <button
            onClick={handleEdit}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 flex items-center justify-center"
            disabled={editingImage}
          >
            {editingImage ? <Spinner /> : 'Apply Edit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditorModal;
