// Simple in-memory storage for the resume text
// This file is kept for compatibility with the existing codebase structure

/**
 * A simplified implementation that doesn't require external APIs or libraries
 */
class SimpleVectorStore {
  private text: string;
  private sections: { title: string; content: string }[];

  constructor(text: string) {
    this.text = text;
    this.sections = this.processTextIntoSections(text);
  }

  /**
   * Split the CV text into logical sections for easier searching
   */
  private processTextIntoSections(text: string) {
    // Split the text into sections using the separator
    const rawSections = text.split('####################################################################');
    
    // Process each section to extract title and content
    return rawSections.map(section => {
      const lines = section.trim().split('\n');
      const title = lines[0] || 'Header';
      const content = lines.slice(1).join('\n').trim();
      return { title, content };
    }).filter(section => section.content.length > 0); // Remove empty sections
  }

  /**
   * Match interface expected by the API handler
   */
  asRetriever() {
    return {
      getRelevantDocuments: async() => {
        // In a real vector store, this would use embeddings to find similar content
        return [{
          pageContent: this.text,
          metadata: { source: 'resume', sections: this.sections }
        }];
      }
    };
  }
}

/**
 * Create a store for the resume text - kept for API compatibility
 */
export async function createResumeStore(resumeText: string) {
  // Process the resume text to optimize it for search
  const cleanedText = resumeText
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/\n{3,}/g, '\n\n');  // Remove excessive line breaks
  
  // Create a simple in-memory store instead of using external APIs
  return new SimpleVectorStore(cleanedText);
}