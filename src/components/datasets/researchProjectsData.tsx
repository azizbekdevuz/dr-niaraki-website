export interface ResearchProject {
  title: string;
  fundingAgency: string;
  duration: string;
  role: string;
  achievements: string[];
}

export const researchProjectsData: ResearchProject[] = [
  {
    title: "Super-Realistic XR Technology Research Center",
    fundingAgency: "Ministry of Science and ICT, South Korea",
    duration: "2022 - 2030",
    role: "Lead Researcher",
    achievements: [
      "Developed interconnected Metaverse technologies.",
      "Advanced XR applications in Real-Virtual integration.",
      "Collaborated with multidisciplinary teams.",
    ],
  },
  {
    title: "Mobile Virtual Reality Research Center",
    fundingAgency: "Ministry of Science and ICT, South Korea",
    duration: "2017 - 2021",
    role: "Research Professor",
    achievements: [
      "Conducted VR and MR research under IITP supervision.",
      "Integrated GIS with virtual environments.",
      "Secured government research funding.",
    ],
  },
  {
    title: "Malaria Susceptibility Mapping Project",
    fundingAgency: "Korean National Research Foundation",
    duration: "2013 - 2015",
    role: "Principal Investigator",
    achievements: [
      "Developed GIS-based healthcare mapping solutions.",
      "Prepared malaria susceptibility maps.",
    ],
  },
  {
    title: "Ubiquitous Passenger Navigation System",
    fundingAgency: "Korea Airports Corporation",
    duration: "2009 - 2010",
    role: "Project Lead",
    achievements: [
      "Designed context-aware navigation systems.",
      "Integrated AI with GIS for seamless passenger experience.",
    ],
  },
  {
    title: "Iranian Road Network Projects",
    fundingAgency: "Road Maintenance and Transportation Organization (RMTO)",
    duration: "2002 - 2004",
    role: "GIS Manager",
    achievements: [
      "Developed GIS and GPS-based road mapping systems.",
      "Created WebGIS for national road networks.",
    ],
  },
  {
    title: "Urban GIS Projects",
    fundingAgency: "Tehran and Shiraz Municipalities",
    duration: "2000 - 2001",
    role: "GIS Project Manager",
    achievements: [
      "Updated GIS databases for Shiraz City.",
      "Implemented GIS construction projects for Tehran City.",
    ],
  },
  {
    title: "Surveying and Map Generation Project",
    fundingAgency: "Tehran Municipality",
    duration: "1997",
    role: "Survey Manager",
    achievements: ["Produced 1/200 topographic maps for urban development."],
  },
];
