import * as pdfjsLib from 'pdfjs-dist';

// Setting worker source to a CDN for ease of use in Vite/PWA context
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extracts text from a PDF file.
 * @param {File} file - The PDF file object from an input element.
 * @returns {Promise<string>} - The extracted text.
 */
export const extractTextFromPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(" ");
      fullText += pageText + "\n";
    }
    
    return fullText.trim();
  } catch (error) {
    console.error("PDF Parsing Error:", error);
    throw new Error("Failed to extract text from PDF. Ensure it's a searchable PDF.");
  }
};
