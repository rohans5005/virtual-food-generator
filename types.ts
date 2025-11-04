
export enum ImageStyle {
  RUSTIC_DARK = 'Rustic/Dark',
  BRIGHT_MODERN = 'Bright/Modern',
  SOCIAL_MEDIA = 'Social Media (Top-Down)',
}

export interface GeneratedImage {
  id: string;
  dishName: string;
  imageUrl: string;
  originalPrompt: string;
  editHistory: { prompt: string; imageUrl: string; }[];
}
