export interface ExperienceData {
  title?: string; //title of experience
  role?: string; //role or job title
  institution?: string; //name of institution
  organization?: string; //organization & company name
  period: string; //period of job or experience
  additionalInformation?: string; //extra details
  description?: string;
  tags?: string | string[];
  icon?: React.ElementType;
  details?: string; //more sub details
  highlights: string[]; //key parts
  progressPercentage?: number; //indicator of progress level
  location?: string; //location
}

export const consultingData: ExperienceData[] = [
  //a dataset of information
  {
    title: "Korean Companies Consulting",
    institution: "Various Korean Technology Companies",
    period: "2015-2017",
    details:
      "Provided comprehensive consulting services to major companies including Hancom and KSIC.net",
    highlights: [
      "GIS technology implementation",
      "Strategic technology planning",
      "System architecture design",
      "Technical roadmap development",
    ],
    progressPercentage: 95,
  },
  {
    title: "Hi-Tech Workshops and Seminars",
    location: "Iran",
    period: "2014-2016",
    details:
      "Organized and directed various technology-focused workshops and seminars featuring Korean experts",
    highlights: [
      "Workshop organization",
      "International expert coordination",
      "Knowledge transfer programs",
      "Technical training sessions",
    ],
    progressPercentage: 90,
  },
  {
    title: "Gimpo Airport GIS Project",
    location: "Seoul, South Korea",
    period: "2013-2015",
    details:
      "Led development of advanced GIS services utilizing Context Awareness and AI for passenger navigation",
    highlights: [
      "Navigation system development",
      "AI integration",
      "Context-aware services",
      "Passenger experience optimization",
    ],
    progressPercentage: 100,
  },
];
