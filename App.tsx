
import React, { useState, useCallback, useEffect } from 'react';
import { generateFoodImage } from './services/geminiService';
import { GeneratedImage, ImageStyle } from './types';
import { v4 as uuidv4 } from 'uuid';
import ImageCard from './components/ImageCard';
import ImageEditorModal from './components/ImageEditorModal';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  const [menuText, setMenuText] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>(ImageStyle.BRIGHT_MODERN);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<GeneratedImage | null>(null);

  const handleGenerateImages = useCallback(async () => {
    if (!menuText.trim()) {
      setError('Please enter your menu items.');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedImages([]); // Clear previous images

    const dishes = menuText.split('\n').map((line) => line.trim()).filter(Boolean);
    const newImages: GeneratedImage[] = [];
    const imagePromises = dishes.map(async (dish) => {
      try {
        const base64ImageBytes = await generateFoodImage(dish, selectedStyle);
        // Assuming JPEG for generated images for simplicity, actual MIME type is 'image/jpeg' from service
        const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
        return {
          id: uuidv4(),
          dishName: dish,
          imageUrl,
          originalPrompt: dish,
          editHistory: [],
        };
      } catch (err) {
        console.error(`Error generating image for ${dish}:`, err);
        setError(`Failed to generate image for "${dish}". Please try again.`);
        return null;
      }
    });

    const results = await Promise.all(imagePromises);
    results.forEach((result) => {
      if (result) {
        newImages.push(result);
      }
    });

    setGeneratedImages(newImages);
    setLoading(false);
  }, [menuText, selectedStyle]);

  const handleEditImage = useCallback((image: GeneratedImage) => {
    setEditingImage(image);
  }, []);

  const handleImageEdited = useCallback((updatedImage: GeneratedImage) => {
    setGeneratedImages((prevImages) =>
      prevImages.map((img) => (img.id === updatedImage.id ? updatedImage : img))
    );
    // Keep the modal open for continuous edits on the same image, but update its display
    setEditingImage(updatedImage);
  }, []);

  const closeEditorModal = useCallback(() => {
    setEditingImage(null);
  }, []);

  // Ensure initial focus for accessibility or provide a good starting point
  useEffect(() => {
    // You could add logic here to focus on the menuTextarea if desired
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-3xl font-extrabold mb-2 sm:mb-0">Virtual Food Photographer</h1>
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white text-sm hover:underline"
          >
            Billing Info
          </a>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <section className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">1. Enter Your Menu</h2>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[150px] sm:min-h-[200px]"
            placeholder="Enter one dish per line, e.g.
Grilled Salmon with Asparagus
Spicy Chicken Tacos
Vegetable Stir Fry"
            value={menuText}
            onChange={(e) => setMenuText(e.target.value)}
            disabled={loading}
          ></textarea>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">2. Choose Your Style</h2>
          <div className="flex flex-wrap gap-4 mb-6">
            {Object.values(ImageStyle).map((style) => (
              <label key={style} className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="form-radio h-5 w-5 text-blue-600"
                  name="imageStyle"
                  value={style}
                  checked={selectedStyle === style}
                  onChange={() => setSelectedStyle(style)}
                  disabled={loading}
                />
                <span className="ml-2 text-gray-700">{style}</span>
              </label>
            ))}
          </div>

          <button
            onClick={handleGenerateImages}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? <Spinner /> : 'Generate Food Photos'}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <p>{error}</p>
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Your Food Photos</h2>
          {generatedImages.length === 0 && !loading && !error && (
            <p className="text-gray-600 text-center">No images generated yet. Enter your menu and click "Generate Food Photos".</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {generatedImages.map((image) => (
              <ImageCard key={image.id} image={image} onEdit={handleEditImage} />
            ))}
          </div>
        </section>
      </main>

      {editingImage && (
        <ImageEditorModal
          image={editingImage}
          onClose={closeEditorModal}
          onImageEdited={handleImageEdited}
        />
      )}
    </div>
  );
};

export default App;
