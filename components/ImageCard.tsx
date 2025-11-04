
import React from 'react';
import { GeneratedImage } from '../types';

interface ImageCardProps {
  image: GeneratedImage;
  onEdit: (image: GeneratedImage) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onEdit }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full">
      <div className="aspect-w-16 aspect-h-9 sm:aspect-w-4 sm:aspect-h-3 md:aspect-w-16 md:aspect-h-9 lg:aspect-w-4 lg:aspect-h-3 xl:aspect-w-16 xl:aspect-h-9 flex-shrink-0">
        <img
          src={image.imageUrl}
          alt={image.dishName}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://picsum.photos/400/300?grayscale'; // Fallback
            e.currentTarget.alt = 'Image failed to load';
          }}
        />
      </div>
      <div className="p-4 flex flex-col justify-between flex-grow">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{image.dishName}</h3>
        <button
          onClick={() => onEdit(image)}
          className="mt-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
        >
          Edit Photo
        </button>
      </div>
    </div>
  );
};

export default ImageCard;
