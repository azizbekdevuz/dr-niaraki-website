export interface AcademicInitiative {
    title: string;
    collaborators: string[];
    duration: string;
    focus: string;
    highlights: string[];
  }
  
  export const academicInitiativesData: AcademicInitiative[] = [
    {
      title: "KAIST Dual-Degree Programs",
      collaborators: ["KAIST", "Sejong University"],
      duration: "2015 - 2018",
      focus: "Development of Master's and Ph.D. programs.",
      highlights: [
        "Established dual-degree programs in Technology and Culture.",
        "Strengthened international academic collaborations.",
      ],
    },
    {
      title: "ETRI Knowledge Sharing Project",
      collaborators: ["ETRI", "Iranian Vice Presidency for Science and Technology"],
      duration: "2016",
      focus: "International research collaboration and technology transfer.",
      highlights: [
        "Facilitated knowledge-sharing initiatives.",
        "Supported technology transfer for industry-academia partnerships.",
      ],
    },
    {
      title: "United Nations Telemedicine Workshops",
      collaborators: ["United Nations", "Iranian Space Agency"],
      duration: "2011",
      focus: "Use of space technology for telemedicine and GIS in healthcare.",
      highlights: [
        "Organized workshops on healthcare improvement through GIS.",
        "Demonstrated GIS applications for telemedicine.",
      ],
    },
  ];  