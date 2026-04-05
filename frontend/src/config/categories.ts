export const CATEGORY_META: Record<string, { label: string; description: string; isArray: boolean }> = {
  subject:          { label: 'Subject',           description: 'Main subject, character, or object',         isArray: false },
  style:            { label: 'Style',              description: 'Art style, medium, or movement',              isArray: false },
  lighting:         { label: 'Lighting',           description: 'Lighting type, direction, and quality',       isArray: false },
  cameraAngle:      { label: 'Camera Angle',       description: 'Perspective and framing',                     isArray: false },
  lensSettings:     { label: 'Lens Settings',      description: 'Focal length, aperture, DOF, bokeh',          isArray: false },
  colorPalette:     { label: 'Color Palette',      description: 'Dominant colors or color scheme',             isArray: false },
  mood:             { label: 'Mood',               description: 'Emotional tone or atmosphere',                isArray: false },
  environment:      { label: 'Environment',        description: 'Setting, background, or location',            isArray: false },
  artistReferences: { label: 'Artist References',  description: 'Referenced artists or photographers',         isArray: true  },
  qualityModifiers: { label: 'Quality Modifiers',  description: 'Technical quality tags',                      isArray: true  },
  negativePrompts:  { label: 'Negative Prompts',   description: 'Elements to exclude from the image',          isArray: false },
  otherElements:    { label: 'Other Elements',     description: 'Remaining elements not captured above',       isArray: false },
};

export const CATEGORY_ORDER = [
  'subject',
  'style',
  'lighting',
  'cameraAngle',
  'lensSettings',
  'colorPalette',
  'mood',
  'environment',
  'artistReferences',
  'qualityModifiers',
  'negativePrompts',
  'otherElements',
] as const;

export type CategoryKey = (typeof CATEGORY_ORDER)[number];
