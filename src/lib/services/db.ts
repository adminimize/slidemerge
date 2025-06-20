import Dexie, { type Table } from 'dexie';

export interface SlideItem {
  id: string;
  file: string;
  fileType: string;
  index: number;
  thumbnail: string;
  fullImage?: string;
  selected: boolean;
  dimensions?: {
    width: number;
    height: number;
    scaledWidth: number;
    scaledHeight: number;
  };
}

export interface PresentationGroup {
  id: string;
  fileName: string;
  fileType: string;
  slides: SlideItem[];
  selected: boolean;
  thumbnail: string;
}

class SlideMergeDB extends Dexie {
  slides!: Table<SlideItem>;
  presentations!: Table<PresentationGroup>;

  constructor() {
    super('SlideMergeDB');
    this.version(1).stores({
      slides: 'id, file, fileType, index',
      presentations: 'id, fileName, fileType'
    });
  }
}

export const db = new SlideMergeDB();

// Helper functions for managing slides and presentations
export async function saveSlides(slides: SlideItem[]): Promise<void> {
  await db.slides.bulkPut(slides);
}

export async function savePresentations(presentations: PresentationGroup[]): Promise<void> {
  await db.presentations.bulkPut(presentations);
}

export async function getSlides(): Promise<SlideItem[]> {
  return await db.slides.toArray();
}

export async function getPresentations(): Promise<PresentationGroup[]> {
  return await db.presentations.toArray();
}

export async function clearDatabase(): Promise<void> {
  await db.slides.clear();
  await db.presentations.clear();
} 