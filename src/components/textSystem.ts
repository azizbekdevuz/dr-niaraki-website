export interface TextSystem {
  dark: {
    primary: string;
    secondary: string;
    tertiary: string;
    accent: string;
    muted: string;
    gradient: string;
  };
  light: {
    primary: string;
    secondary: string;
    tertiary: string;
    accent: string;
    muted: string;
    gradient: string;
  };
}

const textSystem: TextSystem = {
  dark: {
    primary: "text-white",
    secondary: "text-gray-100",
    tertiary: "text-blue-200",
    accent: "text-blue-300",
    muted: "text-gray-300",
    gradient: "from-blue-200 to-purple-300",
  },
  light: {
    primary: "text-gray-900",
    secondary: "text-blue-800",
    tertiary: "text-blue-700",
    accent: "text-blue-700",
    muted: "text-gray-600",
    gradient: "from-blue-700 to-purple-700",
  },
};

export default textSystem;