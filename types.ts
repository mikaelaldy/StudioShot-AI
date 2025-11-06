export interface GalleryItem {
  id: string;
  src: string;
  prompt: string;
  type: 'edited' | 'generated';
  originalSrc?: string;
}

export type OriginalImage = {
  file: File;
  dataUrl: string;
};
