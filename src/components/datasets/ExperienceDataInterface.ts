export interface ExperienceData {
  title?: string; //title of experience
  role?: string; //role or job title
  institution?: string; //name of institution
  organization?: string; //organization & company name
  period: string; //period of job or experience
  additionalInformation?: string; //extra details
  details?: string; //more sub details
  highlights: string[]; //key parts
  progressPercentage?: number; //indicator of progress level
  location?: string; //location
}
