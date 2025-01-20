import { FileText, Medal, Calendar, BarChart, Brain, ChevronRight } from "lucide-react"; // Add other icons as needed

// Contact Information
export interface ContactInfo {
  position: string;
  department: string;
  center: string;
  university: string;
  address: string;
  tel: string;
  fax: string;
  email: string;
}

export const contactInfo: ContactInfo = {
  position: "Associate Professor",
  department: "Dept. of Computer Science & Engineering",
  center: "eXtended Reality (XR) Center",
  university: "Sejong University",
  address: "209- Gwangjin-gu, Gunja-dong, Neungdong-ro, Seoul, Republic of Korea",
  tel: "+82 2-3408-2981",
  fax: "+82 2-3408-4321",
  email: "a.sadeghi@sejong.ac.kr",
};

// Career Timeline
export interface CareerTimelineEntry {
  period: string;
  role: string;
  institution: string;
  details: string;
}

export const careerTimeline: CareerTimelineEntry[] = [
  {
    period: "2022-Present",
    role: "Research Professor",
    institution: "XR Metaverse Research Center, Sejong University",
    details: "Leading research in XR and Metaverse technologies",
  },
  {
    period: "2017-Present",
    role: "Associate Professor",
    institution: "Dept. of Computer Science and Engineering, Sejong University",
    details: "Teaching and researching in AI, XR, and Computer Science",
  },
  {
    period: "2017-2021",
    role: "Research Professor",
    institution: "Mobile Virtual Reality Research Center",
    details: "Led major VR research initiatives",
  },
  {
    period: "2009-2017",
    role: "Assistant Professor",
    institution: "INHA University",
    details: "Department of Geo-Informatics Engineering",
  },
];

// Research Stats
export interface ResearchStat {
  number: string;
  label: string;
  subtext: string;
  icon: React.ComponentType; // React component type for Lucide icons
}

export const researchStats: ResearchStat[] = [
  {
    number: "99+",
    label: "Research Publications",
    subtext: "in top-tier journals",
    icon: FileText,
  },
  {
    number: "23+",
    label: "Patents",
    subtext: "including US and international",
    icon: Medal,
  },
  {
    number: "15+",
    label: "Years Experience",
    subtext: "in academia and research",
    icon: Calendar,
  },
  {
    number: "30M+",
    label: "Research Grants",
    subtext: "in funded projects",
    icon: BarChart,
  },
];

// Research Areas
export interface ResearchArea {
  title: string;
  description: string;
  projects: string[];
}

export const researchAreas: ResearchArea[] = [
  {
    title: "AI & Large Models",
    description: "Advanced research in artificial intelligence and large language models",
    projects: ["AI-Enhanced GIS Systems", "Machine Learning Applications", "Neural Networks"],
  },
  {
    title: "XR & Metaverse",
    description: "Pioneering work in Extended Reality and Metaverse technologies",
    projects: ["Super-Realistic XR Technology", "Mobile Virtual Reality", "Mixed Reality Applications"],
  },
  {
    title: "GeoAI & Smart Cities",
    description: "Integration of AI with geographic information systems",
    projects: ["Urban Computing", "Spatial Analysis", "Smart Infrastructure"],
  },
  {
    title: "Healthcare Tech",
    description: "Technology applications in healthcare and medical systems",
    projects: ["Telemedicine Solutions", "Health Monitoring Systems", "Medical Imaging AI"],
  },
];

// Major Projects
export interface MajorProject {
  title: string;
  period: string;
  funding: string;
  description: string;
  impact: string;
}

export const majorProjects: MajorProject[] = [
  {
    title: "Super-Realistic XR Technology Research",
    period: "2022-2030",
    funding: "IITP, Ministry of Science",
    description: "Research for Real-Virtual Interconnected Metaverse",
    impact: "Leading research in immersive XR technologies",
  },
  {
    title: "Mobile Virtual Reality Research Center",
    period: "2017-2021",
    funding: "Korean Ministry of Science and ICT",
    description: "Large-scale research project on mobile VR technologies",
    impact: "Pioneering mobile VR solutions",
  },
  {
    title: "Knowledge Sharing Project (KSP)",
    period: "2016-2017",
    funding: "ETRI & Iranian VPST",
    description: "Industry/Trade Policy Consulting",
    impact: "International technology transfer",
  },
];

// Patents
export interface Patent {
  title: string;
  id: string;
  date: string;
  type: string;
  status: string;
}

export const patents: Patent[] = [
  {
    title: "SUPER-REALISTIC XR TECHNOLOGY FOR REAL-VIRTUAL INTERCONNECTED METAVERSE",
    id: "US11,816,804B2",
    date: "2023",
    type: "US International Patent",
    status: "Registered",
  },
  {
    title: "GEOSPATIAL INFORMATION SYSTEM-BASED MODELING FOR LEAKAGE MANAGEMENT",
    id: "10-2356500",
    date: "2022",
    type: "Domestic Patent",
    status: "Registered",
  },
  {
    title: "GROUNDWATER POTENTIAL MAPPING USING AI",
    id: "10-2307898",
    date: "2021",
    type: "Domestic Patent",
    status: "Registered",
  },
];

// Teaching Areas
export interface TeachingAreas {
  graduate: string[];
  undergraduate: string[];
}

export const teachingAreas: TeachingAreas = {
  graduate: [
    "Artificial Intelligence and Big Data",
    "Advances in Human-Computer Interaction (HCI)",
    "Special Topic in IoT",
    "Special Topics in Biometrics",
  ],
  undergraduate: [
    "Artificial Intelligence and Big Data",
    "Web Programming",
    "Operating Systems",
    "GIS Programming",
  ],
};

// Editorial Positions
export interface EditorialPosition {
  role: string;
  journal: string;
  region?: string;
  since?: string;
}

export const editorialPositions: EditorialPosition[] = [
  {
    role: "Associate Editor",
    journal: "International Journal of Geosensing and Geocomputing",
    region: "East Asia and Pacific",
  },
  {
    role: "Editorial Board Member",
    journal: "Journal of Geodesy and Geomatics Engineering",
    since: "2014",
  },
];