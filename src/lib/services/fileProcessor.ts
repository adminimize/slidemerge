import type { SlideItem } from '../components/SlideManager.svelte';
import type { PresentationGroup } from '../components/PresentationManager.svelte';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// We'll use these variables to hold our dynamically imported modules
let saveAs: (blob: Blob, filename: string) => void;
let pptxgen: any;
let XLSX: any;
let JSZip: any;
let pdfjsLib: any;

// Dynamically import browser-only modules
if (isBrowser) {
  // Using the async import immediately executed
  (async () => {
    try {
      const fileSaverModule = await import('file-saver');
      saveAs = fileSaverModule.default || fileSaverModule.saveAs;

      const pptxgenModule = await import('pptxgenjs');
      pptxgen = pptxgenModule.default;
      
      const xlsxModule = await import('xlsx');
      XLSX = xlsxModule.default || xlsxModule;
      
      const jszipModule = await import('jszip');
      JSZip = jszipModule.default;
      
      // Load PDF.js
      const pdfjs = await import('pdfjs-dist');
      pdfjsLib = pdfjs;
      
      // Set the worker source for PDF.js
      if (pdfjsLib) {
        // Set the worker source to our static file
        console.log('Initializing PDF.js worker source');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
      }
    } catch (error) {
      console.error('Error loading browser modules:', error);
    }
  })();
}

// Function to get file extension
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// Function to check if file is an image
function isImageFile(fileType: string): boolean {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  return imageTypes.includes(fileType);
}

// Function to check if file is specifically a PNG
function isPngFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.png');
}

// Function to generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Process files based on their type
export async function processFiles(files: File[]): Promise<SlideItem[]> {
  if (!isBrowser) {
    console.warn('Attempted to process files in a non-browser environment');
    return [];
  }
  
  const slides: SlideItem[] = [];
  
  for (const file of files) {
    const fileType = getFileExtension(file.name);
    
    switch (fileType) {
      case 'pdf':
        const pdfSlides = await processPDF(file);
        slides.push(...pdfSlides);
        break;
      default:
        // Check if it's an image file
        if (isImageFile(fileType)) {
          const imageSlide = await processImage(file);
          slides.push(imageSlide);
        }
        // We're no longer handling PPT/PPTX files as requested
    }
  }
  
  return slides;
}

// Process PDF files - now with actual PDF rendering!
async function processPDF(file: File): Promise<SlideItem[]> {
  if (!pdfjsLib) {
    console.warn('PDF.js library not loaded, using placeholders');
    return createPlaceholderSlides(file, 'pdf');
  }
  
  try {
    // Ensure worker source is set properly
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc || pdfjsLib.GlobalWorkerOptions.workerSrc === '') {
      console.log('Setting PDF.js worker source to /pdf.worker.mjs');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
    }
    
    // Load the PDF file
    const fileData = await readFileAsArrayBuffer(file);
    
    // Log the file size to help with debugging
    console.log(`Processing PDF: ${file.name}, size: ${file.size} bytes`);
    
    // Get document
    const loadingTask = pdfjsLib.getDocument({ data: fileData });
    
    // Add a timeout in case it gets stuck
    const pdf = await Promise.race([
      loadingTask.promise,
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('PDF loading timed out after 30 seconds')), 30000)
      )
    ]) as any;
    
    if (!pdf) {
      throw new Error('Failed to load PDF document');
    }
    
    const numPages = pdf.numPages;
    console.log(`PDF loaded: ${file.name}, pages: ${numPages}`);
    
    // Limit the number of pages to process to avoid memory issues
    const maxPages = Math.min(numPages, 50); // Process at most 50 pages
    if (numPages > 50) {
      console.warn(`PDF has ${numPages} pages, only processing first 50 to avoid memory issues`);
    }

    // Emit an initial progress event with total pages information
    if (isBrowser) {
      const event = new CustomEvent('pdfProcessingProgress', {
        detail: { 
          fileName: file.name,
          pageNum: 0,
          numPages: maxPages
        }
      });
      document.dispatchEvent(event);
    }
    
    // Create a slide for each page
    const slides: SlideItem[] = [];
    
    for (let i = 1; i <= maxPages; i++) {
      try {
        console.log(`Rendering page ${i} of ${file.name}`);
        const page = await pdf.getPage(i);

        // Emit progress event with current page
        if (isBrowser) {
          const event = new CustomEvent('pdfProcessingProgress', {
            detail: { 
              fileName: file.name,
              pageNum: i,
              numPages: maxPages
            }
          });
          document.dispatchEvent(event);
        }
        
        // Generate thumbnail (smaller size for UI display)
        const thumbnailCanvas = document.createElement('canvas');
        const thumbnailViewport = page.getViewport({ scale: 0.2 }); // Small scale for thumbnails
        thumbnailCanvas.width = thumbnailViewport.width;
        thumbnailCanvas.height = thumbnailViewport.height;
        
        const thumbnailContext = thumbnailCanvas.getContext('2d');
        if (!thumbnailContext) {
          throw new Error('Could not get canvas rendering context for thumbnail');
        }
        
        await page.render({
          canvasContext: thumbnailContext,
          viewport: thumbnailViewport
        }).promise;
        
        // Generate high-quality image for PowerPoint (using 16:9 aspect ratio)
        const fullCanvas = document.createElement('canvas');
        
        // Calculate viewport to fit PowerPoint slide (standard 16:9 ratio)
        // Use higher resolution for better quality in the presentation
        const pptxWidth = 1920; // Width in pixels
        const pptxHeight = 1080; // Height in pixels
        
        // Get the natural dimensions of the PDF page
        const originalViewport = page.getViewport({ scale: 1.0 });
        const pageRatio = originalViewport.width / originalViewport.height;
        
        // Calculate the scale to fill the slide while preserving aspect ratio
        let scale: number;
        if (pageRatio > (16/9)) {
          // Page is wider than 16:9, scale based on width
          scale = pptxWidth / originalViewport.width;
        } else {
          // Page is taller than 16:9, scale based on height
          scale = pptxHeight / originalViewport.height;
        }
        
        const scaledViewport = page.getViewport({ scale });
        
        // Set canvas dimensions
        fullCanvas.width = scaledViewport.width;
        fullCanvas.height = scaledViewport.height;
        
        const fullContext = fullCanvas.getContext('2d');
        if (!fullContext) {
          throw new Error('Could not get canvas rendering context for full image');
        }
        
        // Set white background for the PDF page
        fullContext.fillStyle = '#FFFFFF';
        fullContext.fillRect(0, 0, fullCanvas.width, fullCanvas.height);
        
        // Render the PDF page to the canvas
        await page.render({
          canvasContext: fullContext,
          viewport: scaledViewport
        }).promise;
        
        // Create the slide object
        slides.push({
          id: generateId(),
          file: file.name,
          fileType: 'pdf',
          index: i - 1, // 0-based index
          thumbnail: thumbnailCanvas.toDataURL('image/jpeg', 0.7), // Medium quality for thumbnails
          fullImage: fullCanvas.toDataURL('image/jpeg', 0.9), // High quality for the slides
          selected: true,
          // Store original dimensions for better slide positioning
          dimensions: {
            width: originalViewport.width,
            height: originalViewport.height,
            scaledWidth: scaledViewport.width,
            scaledHeight: scaledViewport.height
          }
        });
        
        // Clean up to help with memory management
        page.cleanup();
      } catch (pageError) {
        console.error(`Error rendering page ${i} of ${file.name}:`, pageError);
        // Add a placeholder slide for this page
        slides.push({
          id: generateId(),
          file: `${file.name} (Error on page ${i})`,
          fileType: 'pdf',
          index: i - 1,
          thumbnail: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
          fullImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
          selected: true
        });
      }
    }
    
    // Emit a completion event
    if (isBrowser) {
      const event = new CustomEvent('pdfProcessingComplete', {
        detail: { 
          fileName: file.name 
        }
      });
      document.dispatchEvent(event);
    }
    
    console.log(`Completed processing PDF: ${file.name}, extracted ${slides.length} slides`);
    return slides;
  } catch (error) {
    console.error('Error processing PDF file:', error);
    
    // Emit a completion event even on error
    if (isBrowser) {
      const event = new CustomEvent('pdfProcessingComplete', {
        detail: { 
          fileName: file.name 
        }
      });
      document.dispatchEvent(event);
    }
    
    return createPlaceholderSlides(file, 'pdf');
  }
}

// Helper function to create placeholder slides
function createPlaceholderSlides(file: File, fileType: string, count = 5): SlideItem[] {
  return Array(count).fill(null).map((_, index) => ({
    id: generateId(),
    file: file.name,
    fileType,
    index,
    thumbnail: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', // Placeholder
    fullImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', // Placeholder
    selected: true
  }));
}

// Helper function to read a file as ArrayBuffer
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Process PPTX files
async function processPPTX(file: File): Promise<SlideItem[]> {
  // For now, we'll just create placeholder slides
  return createPlaceholderSlides(file, 'pptx');
}

// Process PPT files (older format)
async function processPPT(file: File): Promise<SlideItem[]> {
  // For now, we'll just create placeholder slides
  return createPlaceholderSlides(file, 'ppt');
}

// Process image files
async function processImage(file: File): Promise<SlideItem> {
  try {
    // Read the image file
    const dataUrl = await readFileAsDataURL(file);

    // Create an image with dimensions for proper slide placement
    return await createImageWithDimensions(file, dataUrl);
  } catch (error) {
    console.error('Error processing image file:', error);
    return createPlaceholderSlides(file, 'image', 1)[0];
  }
}

// Helper function to create image with dimensions
async function createImageWithDimensions(file: File, dataUrl: string): Promise<SlideItem> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      console.log(`Image loaded: ${file.name}, dimensions: ${img.width}x${img.height}`);
      
      // Make sure we have valid dimensions
      const width = img.width || 800; // Default width if we can't determine
      const height = img.height || 600; // Default height if we can't determine
      
      // For thumbnails, we want to ensure we have a cleaner version that's not 
      // the full high-res image to save memory
      const thumbnailCanvas = document.createElement('canvas');
      const MAX_THUMB_WIDTH = 300;
      const MAX_THUMB_HEIGHT = 225;
      
      // Calculate thumbnail dimensions (maintain aspect ratio)
      const ratio = width / height;
      let thumbWidth, thumbHeight;
      
      if (ratio > 1) {
        // Landscape
        thumbWidth = Math.min(width, MAX_THUMB_WIDTH);
        thumbHeight = thumbWidth / ratio;
      } else {
        // Portrait
        thumbHeight = Math.min(height, MAX_THUMB_HEIGHT);
        thumbWidth = thumbHeight * ratio;
      }
      
      thumbnailCanvas.width = thumbWidth;
      thumbnailCanvas.height = thumbHeight;
      
      // Draw the image at the smaller size
      const ctx = thumbnailCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, thumbWidth, thumbHeight);
        ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
      }
      
      // Generate the thumbnail data URL
      const thumbnailDataUrl = thumbnailCanvas.toDataURL('image/jpeg', 0.8);
      
      resolve({
        id: generateId(),
        file: file.name,
        fileType: 'image',
        index: 0,
        thumbnail: thumbnailDataUrl, // Use the smaller thumbnail
        fullImage: dataUrl, // Keep the original for the slide
        selected: true,
        dimensions: {
          width: width,
          height: height,
          scaledWidth: width,
          scaledHeight: height
        }
      });
    };
    img.onerror = (err) => {
      // Log the error for debugging
      console.error(`Error loading image ${file.name}:`, err);
      
      // Fallback if image loading fails
      resolve({
        id: generateId(),
        file: file.name,
        fileType: 'image',
        index: 0,
        thumbnail: dataUrl,
        fullImage: dataUrl,
        selected: true,
        // Add default dimensions even on error
        dimensions: {
          width: 800,
          height: 600,
          scaledWidth: 800,
          scaledHeight: 600
        }
      });
    };
    img.src = dataUrl;
  });
}

// Helper function to read a file as DataURL
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Function to merge selected slides and create PPTX
export async function mergeSlides(slides: SlideItem[]): Promise<Blob> {
  // Filter only selected slides
  const selectedSlides = slides.filter(slide => slide.selected);
  
  if (!isBrowser) {
    console.warn('Attempted to merge slides in a non-browser environment');
    // Return an empty blob for SSR
    return new Blob([], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
  }
  
  try {
    // Dynamically import pptxgenjs if needed
    if (!pptxgen) {
      const pptxgenModule = await import('pptxgenjs');
      pptxgen = pptxgenModule.default;
    }
    
    // Log the slides for debugging
    console.log('Processing slides:', selectedSlides.map(s => ({
      file: s.file,
      type: s.fileType,
      hasDimensions: !!s.dimensions,
      startOfImage: s.fullImage?.substring(0, 50)
    })));

    // Create a new PowerPoint presentation
    const pptx = new pptxgen();
    
    // Set presentation properties
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'Slide Merge';
    pptx.title = 'Merged Presentation';
    
    // For each selected slide, add it to the presentation
    for (const slide of selectedSlides) {
      // Create a new slide
      const pptxSlide = pptx.addSlide();
      
      // Create a notes string with attribution
      let notesText = `Created with slidemerge\n\nSource: ${slide.file}`;
      if (slide.fileType === 'pdf') {
        notesText += ` (Page ${slide.index + 1})`;
      }
      
      // Add the notes to the slide
      pptxSlide.addNotes(notesText);
      
      // The placeholder image starts with a specific base64 pattern
      const isPlaceholder = slide.fullImage && 
        slide.fullImage.startsWith('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==');
      
      // Fill the entire slide with a white background first
      pptxSlide.background = { color: "FFFFFF" };
      
      // Calculate positioning to center the content
      // Standard PowerPoint dimensions in inches (16:9 ratio)
      const slideWidth = 10;  // PowerPoint uses ~10 inches for width in 16:9
      const slideHeight = 5.625; // 10 * (9/16) = 5.625 inches height
      
      // Get content dimensions if available, otherwise use default positioning
      let x = 0;
      let y = 0;
      let w = slideWidth;
      let h = slideHeight;
      
      // If we have dimensions, use them to calculate proper positioning
      if (slide.dimensions) {
        // Calculate aspect ratio
        const contentRatio = slide.dimensions.width / slide.dimensions.height;
        
        if (contentRatio > (16/9)) {
          // Content is wider than slide, fill width and center vertically
          w = slideWidth;
          h = slideWidth / contentRatio;
          x = 0;
          y = (slideHeight - h) / 2;
        } else {
          // Content is taller than slide, fill height and center horizontally
          h = slideHeight;
          w = slideHeight * contentRatio;
          x = (slideWidth - w) / 2;
          y = 0;
        }
      }
      
      // If the slide is not a placeholder, add the image
      if (!isPlaceholder && slide.fullImage) {
        // Add the image to the slide with calculated dimensions
        pptxSlide.addImage({
          data: slide.fullImage,
          x: x,
          y: y,
          w: w,
          h: h
        });
      } else {
        // This is a placeholder or error case, add a text message
        pptxSlide.addText(`Content from "${slide.file}" could not be loaded`, {
          x: 0.5,
          y: 2.5,
          w: 9,
          h: 0.6,
          fontSize: 18,
          color: '666666',
          fontFace: 'Arial',
          align: 'center'
        });
      }
    }
    
    // Generate the PPTX file as a blob
    return await pptx.writeFile({ outputType: 'blob' }) as Blob;
  } catch (error) {
    console.error('Error generating PPTX:', error);
    // Return an empty blob if there's an error
    return new Blob([], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
  }
}

// Function to download the merged presentation
export async function downloadPresentation(blob: Blob, filename: string): Promise<void> {
  if (!isBrowser) {
    console.warn('Attempted to download file in a non-browser environment');
    return;
  }
  
  try {
    // Dynamically import file-saver if needed
    if (!saveAs) {
      const fileSaverModule = await import('file-saver');
      saveAs = fileSaverModule.default || fileSaverModule.saveAs;
    }
    
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error downloading file:', error);
  }
}

// Process files into presentation groups (one group per file)
export async function processFilesAsGroups(files: File[]): Promise<PresentationGroup[]> {
  if (!isBrowser) {
    console.warn('Attempted to process files in a non-browser environment');
    return [];
  }
  
  const presentationGroups: PresentationGroup[] = [];
  
  for (const file of files) {
    const fileType = getFileExtension(file.name);
    
    switch (fileType) {
      case 'pdf':
        const pdfSlides = await processPDF(file);
        if (pdfSlides.length > 0) {
          presentationGroups.push({
            id: generateId(),
            fileName: file.name,
            fileType: 'pdf',
            slides: pdfSlides,
            selected: true,
            thumbnail: pdfSlides[0].thumbnail // Use the first slide as thumbnail
          });
        }
        break;
      default:
        // Check if it's an image file
        if (isImageFile(fileType)) {
          const imageSlide = await processImage(file);
          presentationGroups.push({
            id: generateId(),
            fileName: file.name,
            fileType: 'image',
            slides: [imageSlide],
            selected: true,
            thumbnail: imageSlide.thumbnail
          });
        }
        // We're no longer handling PPT/PPTX files as requested
    }
  }
  
  return presentationGroups;
}

// Updated mergeSlides to take presentation groups
export async function mergePresentations(presentationGroups: PresentationGroup[]): Promise<Blob> {
  // Filter only selected presentation groups
  const selectedGroups = presentationGroups.filter(group => group.selected);
  
  // Flatten all slides from selected groups into a single array
  let allSelectedSlides: SlideItem[] = [];
  for (const group of selectedGroups) {
    allSelectedSlides = [...allSelectedSlides, ...group.slides];
  }
  
  // Use the existing mergeSlides function with the flattened array
  return await mergeSlides(allSelectedSlides);
} 