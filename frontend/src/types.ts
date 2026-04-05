export interface Categories {
  subject: string;
  style: string;
  lighting: string;
  cameraAngle: string;
  lensSettings: string;
  colorPalette: string;
  mood: string;
  environment: string;
  artistReferences: string[];
  qualityModifiers: string[];
  negativePrompts: string;
  otherElements: string;
}

export interface SavedPrompt {
  userId: string;
  promptId: string;
  rawPrompt: string;
  title: string;
  categories: Categories;
  tags: string[];
  savedAt: string;
  notes: string;
}

export interface ListResponse {
  items: SavedPrompt[];
  nextCursor: string | null;
  count: number;
}
