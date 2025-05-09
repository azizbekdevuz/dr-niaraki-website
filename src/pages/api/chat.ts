import type { NextApiRequest, NextApiResponse } from 'next';
import { resumeText } from '@/datasets/cvText';

// Enhanced conversation context
interface ConversationContext {
  lastQuestion?: string;
  lastResponse?: string;
  topic?: string;
  followUpCount: number;
  previousTopics: string[];
  userInterests: Set<string>;
  conversationStartTime: number;
  lastInteractionTime: number;
}

// Enhanced response templates with more variety
const responseTemplates = {
  greeting: [
    "Hello! I'm Dr. Niaraki's research assistant. How can I help you learn more about his professional background?",
    "Hi there! I'd be happy to tell you about Dr. Niaraki's work and achievements. What would you like to know?",
    "Welcome! I'm here to help you learn about Dr. Niaraki's research and expertise. What interests you?",
    "Greetings! I can tell you about Dr. Niaraki's academic journey, research, and achievements. What would you like to explore?",
    "Hello! I'm here to share insights about Dr. Niaraki's work in Geo-AI, XR technologies, and academic leadership. What would you like to know?"
  ],
  followUp: [
    "Would you like to know more about {topic}?",
    "I can tell you more about {topic} if you're interested.",
    "There's more to share about {topic}. Would you like to hear it?",
    "I notice you're interested in {topic}. Would you like to explore this further?",
    "Since you asked about {topic}, I can provide more specific details if you'd like."
  ],
  clarification: [
    "Could you please be more specific about what you'd like to know?",
    "I want to make sure I give you the most relevant information. Could you elaborate on your question?",
    "That's an interesting topic. Could you tell me more about what aspects you're interested in?",
    "To provide the most helpful response, could you clarify your question about {topic}?",
    "I'd like to ensure I address your specific interests. Could you provide more details about your question?"
  ],
  notFound: [
    "I don't have specific information about that, but I can tell you about Dr. Niaraki's {topics}.",
    "While I don't have details on that, I'd be happy to share information about his {topics}.",
    "I'm not sure about that specific detail, but I can tell you about his {topics}.",
    "That's an interesting question, but I can better assist you with information about his {topics}.",
    "I'd be happy to share what I know about Dr. Niaraki's {topics} instead."
  ],
  gratitude: [
    "You're welcome! Feel free to ask if you have any other questions about Dr. Niaraki's work.",
    "Happy to help! Don't hesitate to ask if you'd like to know more about his research or achievements.",
    "My pleasure! I'm here if you have any other questions about Dr. Niaraki's professional background.",
    "Glad I could assist! Feel free to ask about any other aspects of Dr. Niaraki's work.",
    "You're welcome! I'm here to help you learn more about Dr. Niaraki's contributions to the field."
  ],
  transition: [
    "Speaking of {topic}, did you know that...",
    "This reminds me of another interesting aspect of {topic}...",
    "That's related to {topic}, which is also fascinating because...",
    "This connects to {topic} in an interesting way...",
    "This brings to mind another achievement in {topic}..."
  ]
};

// Define semantic patterns for better understanding
const semanticPatterns = [
  {
    category: 'education',
    patterns: [
      /(education|degree|university|phd|study|qualification)/i,
      /(where|which|what).*(study|graduate|degree)/i,
      /(background|qualification)/i
    ],
    response: "Dr. Niaraki holds a Ph.D. in Geo-Informatics Engineering from INHA University (2005-2008), an M.Sc. in GIS Engineering from K.N. Toosi University of Technology (2000-2002), and a B.Sc. in Geomatics-Civil Engineering from KNTU (1995-1999). He also completed post-doctoral fellowships at the University of Melbourne (2012) and INHA University (2008-2009).",
    followUp: "Would you like to know about his research work during his studies or his post-doctoral experiences?"
  },
  {
    category: 'experience',
    patterns: [
      /(experience|work|position|job|career)/i,
      /(where|which).*(work|employed|position)/i,
      /(current|present).*(position|role)/i
    ],
    response: "Dr. Niaraki is currently an Associate Professor in the Department of Computer Science & Engineering at Sejong University (2017-present) and a Research Professor at the XR Metaverse Research Center (2022-2030). Previously, he was an Assistant Professor at INHA University (2009-2017) and has held positions at various institutions including the University of Melbourne and KSIC. He has over 15 years of academic experience.",
    followUp: "Would you like to know about his specific research projects or teaching experience?"
  },
  {
    category: 'research',
    patterns: [
      /(research|project|investigation)/i,
      /(what|which).*(research|study|investigate)/i,
      /(focus|area|specialization)/i
    ],
    response: "Dr. Niaraki's research focuses on Geo-AI, GIS, HCI, IoT, and Metaverse technologies. He has led major projects including the Super-Realistic XR Technology Research Center (2022-2030) and Mobile Virtual Reality Research Center (2017-2021). His research has been supported by the Korean Ministry of Science and ICT, with projects totaling over $9.3M in funding.",
    followUp: "Would you like to know about his specific research achievements or publications?"
  },
  {
    category: 'publications',
    patterns: [
      /(publication|paper|journal|article)/i,
      /(how many|number of).*(paper|publication)/i,
      /(publish|author)/i
    ],
    response: "Dr. Niaraki has published over 200 peer-reviewed papers in top-tier journals and international conferences. He has also published two books on Python programming for GIS applications. His research focuses on Geo-AI, XR technologies, and spatial computing.",
    followUp: "Would you like to know about his most cited works or recent publications?"
  },
  {
    category: 'patents',
    patterns: [
      /(patent|invention|innovation)/i,
      /(how many|number of).*(patent)/i,
      /(invent|develop)/i
    ],
    response: "Dr. Niaraki has secured 22+ patents in spatial analysis and XR technologies, including both US and Korean patents. These patents demonstrate his significant contributions to technological innovation in the field.",
    followUp: "Would you like to know about specific patents or his innovation process?"
  },
  {
    category: 'contact',
    patterns: [
      /(contact|email|phone|reach|address)/i,
      /(how|where).*(contact|reach|email)/i,
      /(website|linkedin|social)/i
    ],
    response: "You can reach Dr. Niaraki at his official email: a.sadeghi@sejong.ac.kr or personal email: a.sadeqi313@gmail.com. His office is located at Sejong University, 209- Gwangjin-gu, Gunja-dong, Neungdong-ro, Seoul, Republic of Korea. Phone: +82 2-3408-2981, Cell: +82 10 4253-5-313. You can also visit his website: www.abolghasemsadeghi-n.com or find him on LinkedIn and Google Scholar.",
    followUp: "Would you like to know about his office location or preferred contact method?"
  },
  {
    category: 'teaching',
    patterns: [
      /(teaching|course|class|lecture|student)/i,
      /(teach|supervise|mentor)/i,
      /(student|graduate|phd)/i
    ],
    response: "Dr. Niaraki has supervised 40+ Master's and 6+ Ph.D. students during his 15 years of academic experience. He teaches courses in Artificial Intelligence and Big Data, Human-Computer Interaction (HCI), Advanced XR Technologies, and IoT and Biometrics Applications at Sejong University.",
    followUp: "Would you like to know about specific courses or his teaching philosophy?"
  },
  {
    category: 'awards',
    patterns: [
      /(award|honor|recognition|achievement)/i,
      /(receive|win|earn).*(award|recognition)/i,
      /(prestigious|notable)/i
    ],
    response: "Dr. Niaraki has received several prestigious awards including the Australian Endeavour Fellowship Award in 2012. He is recognized as one of the top 2% scientists in the Stanford-Elsevier dataset for 2024 and was honored as one of the top 100 international distinguished researchers by the Australian Government. He is also a Fellow at Harvard's Spatial Data Lab (SDL) and a member of the American Association of Geographers (AAG).",
    followUp: "Would you like to know about specific awards or his research impact?"
  },
  {
    category: 'skills',
    patterns: [
      /(skill|expertise|ability|technology)/i,
      /(what|which).*(technology|tool|software)/i,
      /(proficient|expert|specialist)/i
    ],
    response: "Dr. Niaraki is an expert in Geo-AI, GIS, HCI, IoT, and Metaverse technologies. He is skilled in TensorFlow, Hugging Face, LangChain, and big data technologies including Apache Spark, PySpark, and Hadoop. He has published two books on Python programming for GIS applications and is proficient in web development, XR technologies, and bioinformatics sensors.",
    followUp: "Would you like to know about his specific technical skills or research methodologies?"
  }
];

// Function to get a random response from templates
function getRandomResponse(template: string[], context: Record<string, string> = {}): string {
  const response = template[Math.floor(Math.random() * template.length)];
  return response.replace(/\{(\w+)\}/g, (match, key) => context[key] || match);
}

// Function to detect conversation intent
function detectIntent(question: string): string {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.match(/^(hi|hello|hey|greetings)/i)) return 'greeting';
  if (lowerQuestion.match(/^(thanks|thank you|appreciate)/i)) return 'gratitude';
  if (lowerQuestion.match(/\?$/)) return 'question';
  if (lowerQuestion.match(/^(tell me|can you|could you|would you|please)/i)) return 'request';
  if (lowerQuestion.match(/^(i want|i need|i'm looking for)/i)) return 'desire';
  if (lowerQuestion.match(/^(what|who|where|when|why|how)/i)) return 'inquiry';
  return 'statement';
}

// Function to find related topics
function findRelatedTopics(topic: string): string[] {
  const topicRelations: Record<string, string[]> = {
    'education': ['research', 'teaching', 'publications'],
    'experience': ['research', 'projects', 'teaching'],
    'research': ['publications', 'patents', 'projects'],
    'publications': ['research', 'patents', 'awards'],
    'patents': ['research', 'publications', 'projects'],
    'contact': ['experience', 'teaching', 'research'],
    'teaching': ['education', 'experience', 'research'],
    'awards': ['research', 'publications', 'experience'],
    'skills': ['research', 'projects', 'publications']
  };
  return topicRelations[topic] || [];
}

// Enhanced response generation
function generateResponse(question: string, context: ConversationContext): { answer: string; context: ConversationContext } {
  const intent = detectIntent(question);
  const lowerQuestion = question.toLowerCase();
  
  // Update context
  const newContext: ConversationContext = {
    ...context,
    lastQuestion: question,
    lastInteractionTime: Date.now(),
    previousTopics: [...context.previousTopics, context.topic].filter((topic): topic is string => topic !== undefined)
  };

  // Handle different intents
  switch (intent) {
    case 'greeting':
      return {
        answer: getRandomResponse(responseTemplates.greeting),
        context: { ...newContext, followUpCount: 0 }
      };
    
    case 'gratitude':
      return {
        answer: getRandomResponse(responseTemplates.gratitude),
        context: { ...newContext, followUpCount: 0 }
      };
  }

  // Find matching semantic pattern
  for (const pattern of semanticPatterns) {
    if (pattern.patterns.some(p => p.test(lowerQuestion))) {
      // Update user interests
      newContext.userInterests.add(pattern.category);
      
      // Generate response with potential related topics
      let answer = pattern.response;
      
      // Add follow-up question if appropriate
      if (newContext.followUpCount < 2 && Math.random() < 0.7) {
        answer += "\n\n" + pattern.followUp;
      }
      
      // Add related topic if conversation is flowing
      if (newContext.followUpCount > 0 && Math.random() < 0.3) {
        const relatedTopics = findRelatedTopics(pattern.category);
        if (relatedTopics.length > 0) {
          const relatedTopic = relatedTopics[Math.floor(Math.random() * relatedTopics.length)];
          answer += "\n\n" + getRandomResponse(responseTemplates.transition, { topic: relatedTopic });
        }
      }

      return {
        answer,
        context: {
          ...newContext,
          topic: pattern.category,
          lastResponse: pattern.response,
          followUpCount: newContext.followUpCount + 1
        }
      };
    }
  }

  // If no pattern matches, try to find relevant sections from the CV
  const sections = resumeText.split('####################################################################');
  const keywords = lowerQuestion.split(/\s+/).filter(word => word.length > 3);
  
  const relevantSections = sections.filter(section => 
    keywords.some(keyword => section.toLowerCase().includes(keyword))
  );

  if (relevantSections.length > 0) {
    const response = relevantSections[0].trim();
    const answer = response.length > 500 ? response.substring(0, 500) + '...' : response;
    
    return {
      answer,
      context: {
        ...newContext,
        lastResponse: answer,
        followUpCount: 0
      }
    };
  }

  // If no relevant sections found, return a default response with available topics
  const availableTopics = semanticPatterns.map(p => p.category).join(', ');
  return {
    answer: getRandomResponse(responseTemplates.notFound, { topics: availableTopics }),
    context: {
      ...newContext,
      followUpCount: 0
    }
  };
}

// Store conversation contexts with enhanced initialization
const conversationContexts: Record<string, ConversationContext> = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { question, sessionId = 'default' } = req.body;
  if (!question) return res.status(400).json({ error: "No question provided" });

  try {
    // Initialize or get conversation context
    const context = conversationContexts[sessionId] || {
      followUpCount: 0,
      previousTopics: [],
      userInterests: new Set<string>(),
      conversationStartTime: Date.now(),
      lastInteractionTime: Date.now()
    };
    
    // Add a small delay to simulate natural conversation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate and return the response
    const { answer, context: newContext } = generateResponse(question, context);
    conversationContexts[sessionId] = newContext;
    
    res.status(200).json({ answer });
  } catch (error) {
    console.error("❌ Error in /api/chat:", error);
    res.status(500).json({ 
      answer: "I'm having trouble processing your question at the moment. Please try again shortly, or you can find information about Dr. Sadeghi-Niaraki on his website." 
    });
  }
}