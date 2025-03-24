import type { NextApiRequest, NextApiResponse } from 'next';
// import { resumeText } from '@/components/datasets/cvText';
// import OpenAI from 'openai';

// Initialize OpenAI client
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // Extract most relevant CV sections based on question topics
// function extractRelevantCVSections(question: string): string {
//   // Convert question to lowercase for matching
//   const lowerQuestion = question.toLowerCase();
  
//   // Define section keywords to identify relevant parts of the CV
//   const sectionKeywords: Record<string, string[]> = {
//     'education': ['education', 'academic', 'degree', 'university', 'phd', 'qualification', 'study'],
//     'experience': ['experience', 'work', 'position', 'job', 'career', 'professional', 'industry'],
//     'skills': ['skills', 'expertise', 'abilities', 'technologies', 'programming', 'technical', 'competent'],
//     'research': ['research', 'interest', 'focus', 'area', 'specialization', 'investigate'],
//     'publications': ['publications', 'papers', 'journal', 'article', 'conference', 'publish', 'author'],
//     'awards': ['awards', 'honors', 'recognition', 'achievement', 'received', 'prize', 'medal'],
//     'patents': ['patents', 'invention', 'intellectual property', 'innovation'],
//     'projects': ['project', 'initiative', 'grant', 'funding', 'develop', 'lead'],
//     'contact': ['contact', 'email', 'phone', 'reach', 'address', 'location'],
//     'teaching': ['teaching', 'course', 'class', 'lecture', 'student', 'supervisor', 'mentor'],
//   };
  
//   // Split CV into sections
//   const sections = resumeText.split('####################################################################');
  
//   // Find relevant sections based on question
//   const relevantSections: string[] = [];
  
//   // Always include intro section for context
//   const introSection = sections[0] || '';
//   const professionalSummary = sections.find(section => 
//     section.toLowerCase().includes('professional summary')) || '';
  
//   // Add basic info and professional summary first
//   relevantSections.push(introSection.trim());
//   relevantSections.push(professionalSummary.trim());
  
//   // Find which categories are relevant to the question
//   const matchingCategories: string[] = [];
//   for (const [category, keywords] of Object.entries(sectionKeywords)) {
//     if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
//       matchingCategories.push(category);
//     }
//   }
  
//   // If no specific categories matched, use a general approach
//   if (matchingCategories.length === 0) {
//     // Check for research-related terms
//     if (
//       lowerQuestion.includes('research') || 
//       lowerQuestion.includes('work') || 
//       lowerQuestion.includes('do') || 
//       lowerQuestion.includes('specialty')
//     ) {
//       const researchSections = sections.filter(section => 
//         section.toLowerCase().includes('research') || 
//         section.toLowerCase().includes('project')
//       );
//       relevantSections.push(...researchSections.map(s => s.trim()));
//     }
    
//     // Add qualifications for general questions
//     const qualifications = sections.find(section => 
//       section.toLowerCase().includes('academic qualifications')) || '';
//     relevantSections.push(qualifications.trim());
    
//     // Add skills for general questions
//     const skills = sections.find(section => 
//       section.toLowerCase().includes('skills')) || '';
//     relevantSections.push(skills.trim());
//   } else {
//     // Add matched category sections
//     for (const category of matchingCategories) {
//       // Find sections that could be related to this category
//       const matchingSections = sections.filter(section => {
//         const lowerSection = section.toLowerCase();
//         return sectionKeywords[category].some(keyword => 
//           lowerSection.includes(keyword)
//         );
//       });
      
//       // Add the first few matching sections
//       const sectionsToAdd = matchingSections.slice(0, 2);
//       for (const section of sectionsToAdd) {
//         if (section.trim()) {
//           relevantSections.push(section.trim());
//         }
//       }
//     }
//   }
  
//   // Handle special cases and common questions
//   if (lowerQuestion.includes('best') || lowerQuestion.includes('top') || lowerQuestion.includes('significant')) {
//     // Find publications and awards sections
//     const significantSections = sections.filter(section => 
//       section.toLowerCase().includes('publication') || 
//       section.toLowerCase().includes('award') || 
//       section.toLowerCase().includes('recognition')
//     );
//     relevantSections.push(...significantSections.map(s => s.trim()));
//   }
  
//   if (lowerQuestion.includes('contact') || lowerQuestion.includes('email') || lowerQuestion.includes('reach')) {
//     // Ensure contact info is included
//     const contactSection = introSection.trim();
//     if (!relevantSections.includes(contactSection)) {
//       relevantSections.push(contactSection);
//     }
//   }
  
//   // Combine sections, but limit total length to avoid token issues
//   let combinedText = relevantSections.join('\n\n');
//   const maxLength = 8000; // Conservative limit to avoid token issues
  
//   if (combinedText.length > maxLength) {
//     combinedText = combinedText.substring(0, maxLength) + '...';
//   }
  
//   return combinedText;
// }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "No question provided" });

  await new Promise(resolve => setTimeout(resolve, 800));
    
  // Return a fixed message explaining the service status
  return res.status(200).json({ 
    answer: "Thank you for your interest in Dr. Sadeghi-Niaraki's research assistant. The AI-powered version of this assistant is currently being upgraded. Once activated, I'll be able to answer detailed questions about Dr. Sadeghi-Niaraki's research, publications, background, and expertise. In the meantime, please explore the website to learn more about his work." 
  });
//   try {
//     // Extract most relevant sections from the CV
//     const relevantCVText = extractRelevantCVSections(question);
    
//     // Create a system message that explains the context
//     const systemMessage = `You are Dr. Sadeghi-Niaraki's research assistant, an AI expert who helps answer questions about his background, research, and expertise.
// Answer questions accurately using ONLY the information provided from his CV. If the information isn't in the CV, politely say you don't have that specific information.
// Be professional but conversational. Format your answers clearly using concise paragraphs and occasionally use bullet points for lists.
// Always refer to Dr. Sadeghi-Niaraki respectfully. Emphasize his expertise in Geo-AI, XR technologies, and spatial computing when relevant.`;

//     // Create a context message with the relevant CV sections
//     const contextMessage = `Here are relevant sections from Dr. Sadeghi-Niaraki's CV:\n\n${relevantCVText}`;
    
//     // Call OpenAI API
//     const response = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo", // You can use "gpt-4" for better results but higher cost
//       messages: [
//         { role: "system", content: systemMessage },
//         { role: "user", content: contextMessage },
//         { role: "user", content: question }
//       ],
//       temperature: 0.7,
//       max_tokens: 500,
//     });
    
//     // Extract the answer from the response
//     const answer = response.choices[0]?.message?.content || 
//       "I'm sorry, I couldn't process your question at this time.";
    
//     // Return the answer
//     res.status(200).json({ answer });
//   } catch (error: any) {
//     console.error("❌ Error in /api/chat:", error);
    
//     // Return a helpful error message
//     let errorMessage = "An error occurred while processing your request.";
//     if (error.message?.includes("API key")) {
//       errorMessage = "The OpenAI API key is missing or invalid. Please check your server configuration.";
//     } else if (error.message?.includes("rate limit")) {
//       errorMessage = "The request was rate limited. Please try again in a moment.";
//     }
    
//     res.status(500).json({ 
//       answer: "I'm having trouble connecting to my knowledge base at the moment. Please try again shortly, or you can find information about Dr. Sadeghi-Niaraki on his website." 
//     });
//   };
};