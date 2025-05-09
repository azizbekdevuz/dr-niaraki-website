import React from "react";
import { LucideProps, GraduationCap, Building } from "lucide-react";

interface TimelineItem {
  title: string;
  institution: string;
  year: string;
  details: string;
  icon: React.FC<LucideProps>;
}

export interface Experience {
  position: string;
  institution: string;
  duration: string;
  details: string;
  achievements: string[];
  projects: string[];
}

export interface Awards {
  award: string;
  organization: string;
  year: string;
  details: string;
  impact: string;
  color: string;
}

// Data
export const academicJourney: TimelineItem[] = [
  {
    title: "Ph.D. in Geo-Informatics Engineering",
    institution: "INHA University, South Korea",
    year: "Ph.D. Completed",
    details: "Specialized in advanced Geo-AI applications and spatial analysis",
    icon: GraduationCap,
  },
  {
    title: "Post-doctoral Research",
    institution: "University of Melbourne, Australia",
    year: "Post-Doc",
    details:
      "Focused on integrating XR technologies with geographical information systems",
    icon: Building,
  },
  {
    title: "M.Sc. in GIS Engineering",
    institution: "K.N. Toosi University of Technology, Iran",
    year: "Master's Degree",
    details: "Research focused on GIS applications in urban planning",
    icon: GraduationCap,
  },
  {
    title: "B.Sc. in Geomatics-Civil Engineering",
    institution: "K.N. Toosi University of Technology, Iran",
    year: "Bachelor's Degree",
    details: "Foundation in geospatial technologies and civil engineering",
    icon: GraduationCap,
  },
];

export const experiences: Experience[] = [
  {
    position: "Associate Professor",
    institution: "Sejong University, South Korea",
    duration: "2017 - Present",
    details: "Leading research in Geo-AI and XR technologies",
    achievements: [
      "Published 30+ research papers",
      "Supervised 15+ graduate students",
      "Secured major research grants",
    ],
    projects: [
      "Smart City Development",
      "AI-Enhanced GIS",
      "XR Navigation Systems",
    ],
  },
  {
    position: "Research Consultant",
    institution: "Various International Projects",
    duration: "2010 - Present",
    details: "Providing expert consultation on GIS implementation",
    achievements: [
      "Led 10+ international projects",
      "Developed innovative GIS solutions",
      "Collaborated with global teams",
    ],
    projects: [
      "Urban Planning Systems",
      "Environmental Monitoring",
      "Transportation Analytics",
    ],
  },
];

export const awards: Awards[] = [
  {
    award: "Best Research Paper Award",
    organization: "GIS International Conference",
    year: "2020",
    details: "Recognition for innovative work in Geo-AI integration",
    impact: "Cited by 100+ researchers worldwide",
    color: "from-blue-500 to-purple-500",
  },
  {
    award: "Outstanding Educator Award",
    organization: "Sejong University",
    year: "2019",
    details: "Acknowledged for excellence in teaching and mentorship",
    impact: "Improved student satisfaction rates by 40%",
    color: "from-green-500 to-blue-500",
  },
];
