"use strict";
exports.__esModule = true;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var react_intersection_observer_1 = require("react-intersection-observer");
var VideoS_1 = require("./VideoS");
var textSystem_1 = require("./textSystem");
var lucide_react_1 = require("lucide-react");
// Utility Components
var ScrollReveal = function (_a) {
  var children = _a.children;
  var _b = react_intersection_observer_1.useInView({
      threshold: 0.1,
      triggerOnce: true,
    }),
    ref = _b[0],
    inView = _b[1];
  return react_1["default"].createElement(
    framer_motion_1.motion.div,
    {
      ref: ref,
      initial: { opacity: 0, y: 50 },
      animate: inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 },
      transition: { duration: 0.6, ease: "easeOut" },
    },
    children,
  );
};
var FloatingElement = function (_a) {
  var children = _a.children;
  var y = framer_motion_1.useMotionValue(0);
  react_1.useEffect(function () {
    framer_motion_1.animate(y, [0, -10, 0], {
      duration: 4,
      ease: "easeInOut",
      repeat: Infinity,
    });
  }, []);
  return react_1["default"].createElement(
    framer_motion_1.motion.div,
    { style: { y: y } },
    children,
  );
};
var CustomCursor = function () {
  var cursorRef = react_1.useRef(null);
  var _a = react_1.useState({ x: 0, y: 0 }),
    position = _a[0],
    setPosition = _a[1];
  react_1.useEffect(function () {
    var updatePosition = function (e) {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", updatePosition);
    return function () {
      return window.removeEventListener("mousemove", updatePosition);
    };
  }, []);
  return react_1["default"].createElement(
    framer_motion_1.motion.div,
    {
      ref: cursorRef,
      className: "fixed w-6 h-6 pointer-events-none z-50 mix-blend-difference",
      animate: {
        x: position.x - 12,
        y: position.y - 12,
        scale: 1,
      },
    },
    react_1["default"].createElement("div", {
      className: "w-full h-full rounded-full bg-blue-500/30 backdrop-blur-sm",
    }),
  );
};
var ParallaxHeader = function (_a) {
  var darkMode = _a.darkMode;
  var _b = react_1.useState({ x: 0, y: 0 }),
    mousePosition = _b[0],
    setMousePosition = _b[1];
  return react_1["default"].createElement(
    framer_motion_1.motion.div,
    {
      className: "relative h-[40vh] overflow-hidden rounded-2xl mb-16",
      onMouseMove: function (e) {
        var clientX = e.clientX,
          clientY = e.clientY;
        var innerWidth = window.innerWidth,
          innerHeight = window.innerHeight;
        setMousePosition({
          x: (clientX - innerWidth / 2) / 100,
          y: (clientY - innerHeight / 2) / 100,
        });
      },
    },
    react_1["default"].createElement(framer_motion_1.motion.div, {
      className:
        "absolute inset-0 bg-gradient-to-br " +
        (darkMode
          ? "from-blue-600/20 to-purple-600/20"
          : "from-blue-400/20 to-purple-400/20"),
      style: {
        x: mousePosition.x * -15,
        y: mousePosition.y * -15,
      },
    }),
    react_1["default"].createElement(
      framer_motion_1.motion.div,
      {
        className:
          "relative z-10 flex flex-col items-center justify-center h-full",
        style: {
          x: mousePosition.x * 10,
          y: mousePosition.y * 10,
        },
      },
      react_1["default"].createElement(
        framer_motion_1.motion.h2,
        {
          className:
            "text-4xl md:text-5xl lg:text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r " +
            (darkMode
              ? textSystem_1["default"].dark.gradient
              : textSystem_1["default"].light.gradient),
        },
        "About Dr. Sadeghi-Niaraki",
      ),
    ),
  );
};
var About = function (_a) {
  var darkMode = _a.darkMode;
  var _b = react_1.useState(null),
    expandedExp = _b[0],
    setExpandedExp = _b[1];
  var _c = react_1.useState(0),
    selectedJourney = _c[0],
    setSelectedJourney = _c[1];
  var _d = react_1.useState(null),
    hoveredAward = _d[0],
    setHoveredAward = _d[1];
  // First part of the component remains exactly the same until Academic Journey
  var academicJourney = [
    {
      title: "Ph.D. in Geo-Informatics Engineering",
      institution: "INHA University, South Korea",
      year: "Ph.D. Completed",
      details:
        "Specialized in advanced Geo-AI applications and spatial analysis",
      icon: lucide_react_1.GraduationCap,
    },
    {
      title: "Post-doctoral Research",
      institution: "University of Melbourne, Australia",
      year: "Post-Doc",
      details:
        "Focused on integrating XR technologies with geographical information systems",
      icon: lucide_react_1.Building,
    },
    {
      title: "M.Sc. in GIS Engineering",
      institution: "K.N. Toosi University of Technology, Iran",
      year: "Master's Degree",
      details: "Research focused on GIS applications in urban planning",
      icon: lucide_react_1.GraduationCap,
    },
    {
      title: "B.Sc. in Geomatics-Civil Engineering",
      institution: "K.N. Toosi University of Technology, Iran",
      year: "Bachelor's Degree",
      details: "Foundation in geospatial technologies and civil engineering",
      icon: lucide_react_1.GraduationCap,
    },
  ];
  var experiences = [
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
  var awards = [
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
  return react_1["default"].createElement(
    react_1["default"].Fragment,
    null,
    react_1["default"].createElement(CustomCursor, null),
    react_1["default"].createElement(
      framer_motion_1.motion.section,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.5 },
        className: "relative min-h-screen overflow-hidden",
      },
      react_1["default"].createElement(ParallaxHeader, { darkMode: darkMode }),
      react_1["default"].createElement(
        "div",
        { className: "max-w-7xl mx-auto px-4 md:px-8 py-16" },
        react_1["default"].createElement(
          ScrollReveal,
          null,
          react_1["default"].createElement(
            "div",
            { className: "grid md:grid-cols-2 gap-12 mb-16 items-center" },
            react_1["default"].createElement(
              FloatingElement,
              null,
              react_1["default"].createElement(
                framer_motion_1.motion.div,
                {
                  whileHover: { scale: 1.02, rotateY: 5 },
                  className:
                    "p-8 rounded-2xl backdrop-blur-sm " +
                    (darkMode ? "bg-gray-900/30" : "bg-white/30") +
                    " shadow-xl",
                  style: { perspective: 1000 },
                },
                react_1["default"].createElement(
                  "p",
                  {
                    className:
                      "text-xl md:text-2xl " +
                      (darkMode
                        ? textSystem_1["default"].dark.tertiary
                        : textSystem_1["default"].light.tertiary),
                  },
                  "About Dr. Sadeghi-Niaraki",
                ),
              ),
            ),
            react_1["default"].createElement(VideoS_1["default"], {
              darkMode: darkMode,
            }),
          ),
        ),
        react_1["default"].createElement(
          ScrollReveal,
          null,
          react_1["default"].createElement(
            "div",
            { className: "grid md:grid-cols-2 gap-12 mb-16 items-center" },
            react_1["default"].createElement(
              FloatingElement,
              null,
              react_1["default"].createElement(
                framer_motion_1.motion.div,
                {
                  whileHover: { scale: 1.02, rotateY: 5 },
                  className:
                    "p-8 rounded-2xl backdrop-blur-sm " +
                    (darkMode ? "bg-gray-900/30" : "bg-white/30") +
                    " shadow-xl",
                  style: { perspective: 1000 },
                },
                react_1["default"].createElement(
                  "p",
                  {
                    className:
                      "text-xl md:text-2xl " +
                      (darkMode
                        ? textSystem_1["default"].dark.tertiary
                        : textSystem_1["default"].light.tertiary),
                  },
                  "Dr. Abolghasem Sadeghi-Niaraki, an Iranian scholar and researcher, is an Associate Professor at Sejong University, specializing in Geo-AI, XR, and GIS. His journey in academia and industry spans over 15 years, driven by a commitment to advancing technology and education.",
                ),
              ),
            ),
            react_1["default"].createElement(VideoS_1["default"], {
              darkMode: darkMode,
            }),
          ),
        ),
        react_1["default"].createElement(
          ScrollReveal,
          null,
          react_1["default"].createElement(
            "div",
            { className: "mb-24 perspective-1000" },
            react_1["default"].createElement(
              framer_motion_1.motion.div,
              {
                initial: { opacity: 0, y: 20, rotateX: -20 },
                animate: { opacity: 1, y: 0, rotateX: 0 },
                className: "flex items-center justify-center gap-3 mb-12",
              },
              react_1["default"].createElement(lucide_react_1.Calendar, {
                className: darkMode ? "text-blue-400" : "text-blue-600",
                size: 32,
              }),
              react_1["default"].createElement(
                "h3",
                {
                  className:
                    "text-3xl font-bold " +
                    (darkMode
                      ? textSystem_1["default"].dark.primary
                      : textSystem_1["default"].light.primary),
                },
                "Academic Journey",
              ),
            ),
            react_1["default"].createElement(
              "div",
              { className: "relative" },
              react_1["default"].createElement(framer_motion_1.motion.div, {
                initial: { scaleY: 0 },
                animate: { scaleY: 1 },
                transition: { duration: 1.5, ease: "easeInOut" },
                className:
                  "absolute top-0 left-1/2 w-1 h-full transform -translate-x-1/2 \n          bg-gradient-to-b " +
                  (darkMode
                    ? "from-blue-500 via-purple-500 to-blue-500"
                    : "from-blue-400 via-purple-400 to-blue-400"),
              }),
              react_1["default"].createElement(
                "div",
                { className: "relative flex flex-col space-y-12" },
                academicJourney.map(function (item, index) {
                  return react_1["default"].createElement(
                    framer_motion_1.motion.div,
                    {
                      key: index,
                      onClick: function () {
                        return setSelectedJourney(index);
                      },
                      initial: {
                        opacity: 0,
                        x: index % 2 === 0 ? -50 : 50,
                        rotateY: -15,
                      },
                      animate: { opacity: 1, x: 0, rotateY: 0 },
                      whileHover: {
                        scale: 1.02,
                        rotateY: index % 2 === 0 ? 5 : -5,
                      },
                      transition: {
                        duration: 0.5,
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100,
                      },
                      className:
                        "flex items-center cursor-pointer " +
                        (index % 2 === 0 ? "flex-row" : "flex-row-reverse") +
                        " gap-8",
                    },
                    react_1["default"].createElement(
                      "div",
                      {
                        className:
                          "flex-1 " +
                          (index % 2 === 0 ? "text-right" : "text-left"),
                      },
                      react_1["default"].createElement(
                        framer_motion_1.motion.div,
                        {
                          className:
                            "inline-block p-6 rounded-xl backdrop-blur-sm \n          " +
                            (selectedJourney === index
                              ? "shadow-2xl " +
                                (darkMode
                                  ? "bg-gray-700/50 ring-2 ring-blue-500/50"
                                  : "bg-white/60 ring-2 ring-blue-400/50")
                              : "shadow-lg " +
                                (darkMode ? "bg-gray-800/40" : "bg-white/40")) +
                            "\n          transform transition-all duration-300",
                          style: { perspective: 1000 },
                        },
                        react_1["default"].createElement(
                          "h4",
                          {
                            className:
                              "text-xl font-bold " +
                              (darkMode
                                ? textSystem_1["default"].dark.primary
                                : textSystem_1["default"].light.primary),
                          },
                          item.title,
                        ),
                        react_1["default"].createElement(
                          "p",
                          {
                            className: darkMode
                              ? textSystem_1["default"].dark.secondary
                              : textSystem_1["default"].light.secondary,
                          },
                          item.institution,
                        ),
                        react_1["default"].createElement(
                          "p",
                          {
                            className:
                              "text-sm mt-2 " +
                              (darkMode ? "text-blue-400" : "text-blue-600"),
                          },
                          item.year,
                        ),
                        react_1["default"].createElement(
                          framer_motion_1.AnimatePresence,
                          null,
                          selectedJourney === index &&
                            react_1["default"].createElement(
                              framer_motion_1.motion.p,
                              {
                                initial: { opacity: 0, height: 0 },
                                animate: { opacity: 1, height: "auto" },
                                exit: { opacity: 0, height: 0 },
                                transition: { duration: 0.3 },
                                className:
                                  "mt-4 " +
                                  (darkMode
                                    ? textSystem_1["default"].dark.tertiary
                                    : textSystem_1["default"].light.tertiary),
                              },
                              item.details,
                            ),
                        ),
                      ),
                    ),
                    react_1["default"].createElement(
                      framer_motion_1.motion.div,
                      {
                        className: "relative z-10",
                        whileHover: { scale: 1.2 },
                        animate: {
                          rotateY: selectedJourney === index ? 180 : 0,
                          transition: { duration: 0.6 },
                        },
                      },
                      react_1["default"].createElement(
                        "div",
                        {
                          className:
                            "\n        w-16 h-16 rounded-full \n        flex items-center justify-center \n        shadow-lg backdrop-blur-md\n        " +
                            (darkMode
                              ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20"
                              : "bg-gradient-to-br from-blue-400/20 to-purple-400/20") +
                            "\n      ",
                        },
                        react_1["default"].createElement(item.icon, {
                          className:
                            "w-8 h-8 " +
                            (selectedJourney === index
                              ? "text-white"
                              : darkMode
                                ? "text-blue-400"
                                : "text-blue-600"),
                        }),
                      ),
                    ),
                  );
                }),
              ),
            ),
          ),
        ),
        react_1["default"].createElement(
          ScrollReveal,
          null,
          react_1["default"].createElement(
            "div",
            { className: "mb-24" },
            react_1["default"].createElement(
              framer_motion_1.motion.div,
              {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                className: "flex items-center justify-center gap-3 mb-12",
              },
              react_1["default"].createElement(lucide_react_1.Briefcase, {
                className: darkMode ? "text-blue-400" : "text-blue-600",
                size: 32,
              }),
              react_1["default"].createElement(
                "h3",
                {
                  className:
                    "text-3xl font-bold " +
                    (darkMode
                      ? textSystem_1["default"].dark.primary
                      : textSystem_1["default"].light.primary),
                },
                "Professional Experience",
              ),
            ),
            react_1["default"].createElement(
              "div",
              { className: "space-y-6" },
              experiences.map(function (exp, index) {
                return react_1["default"].createElement(
                  framer_motion_1.motion.div,
                  {
                    key: index,
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    transition: { delay: 0.2 * index },
                    className:
                      "rounded-xl overflow-hidden " +
                      (darkMode ? "bg-gray-800/40" : "bg-white/40"),
                  },
                  react_1["default"].createElement(
                    framer_motion_1.motion.div,
                    {
                      className: "p-6 cursor-pointer",
                      onClick: function () {
                        return setExpandedExp(
                          expandedExp === index ? null : index,
                        );
                      },
                    },
                    react_1["default"].createElement(
                      "div",
                      { className: "flex justify-between items-start" },
                      react_1["default"].createElement(
                        "div",
                        { className: "flex-1" },
                        react_1["default"].createElement(
                          "h4",
                          {
                            className:
                              "text-xl font-bold " +
                              (darkMode
                                ? textSystem_1["default"].dark.primary
                                : textSystem_1["default"].light.primary),
                          },
                          exp.position,
                        ),
                        react_1["default"].createElement(
                          "p",
                          {
                            className:
                              "" +
                              (darkMode
                                ? textSystem_1["default"].dark.secondary
                                : textSystem_1["default"].light.secondary),
                          },
                          exp.institution,
                        ),
                        react_1["default"].createElement(
                          "p",
                          {
                            className:
                              "text-sm " +
                              (darkMode ? "text-blue-400" : "text-blue-600"),
                          },
                          exp.duration,
                        ),
                      ),
                      react_1["default"].createElement(
                        framer_motion_1.motion.div,
                        {
                          animate: { rotate: expandedExp === index ? 180 : 0 },
                          transition: { duration: 0.3 },
                        },
                        react_1["default"].createElement(
                          lucide_react_1.ChevronDown,
                          {
                            className: darkMode
                              ? "text-blue-400"
                              : "text-blue-600",
                          },
                        ),
                      ),
                    ),
                    react_1["default"].createElement(
                      framer_motion_1.AnimatePresence,
                      null,
                      expandedExp === index &&
                        react_1["default"].createElement(
                          framer_motion_1.motion.div,
                          {
                            initial: { height: 0, opacity: 0 },
                            animate: {
                              height: "auto",
                              opacity: 1,
                              transition: {
                                duration: 0.5,
                                ease: [0.04, 0.62, 0.23, 0.98],
                              },
                            },
                            exit: {
                              height: 0,
                              opacity: 0,
                              transition: {
                                duration: 0.3,
                                ease: [0.04, 0.62, 0.23, 0.98],
                              },
                            },
                          },
                          react_1["default"].createElement(
                            "div",
                            { className: "mt-6 space-y-6" },
                            react_1["default"].createElement(
                              "p",
                              {
                                className:
                                  "" +
                                  (darkMode
                                    ? textSystem_1["default"].dark.tertiary
                                    : textSystem_1["default"].light.tertiary),
                              },
                              exp.details,
                            ),
                            react_1["default"].createElement(
                              "div",
                              { className: "space-y-4" },
                              react_1["default"].createElement(
                                "h5",
                                {
                                  className:
                                    "font-semibold " +
                                    (darkMode
                                      ? textSystem_1["default"].dark.primary
                                      : textSystem_1["default"].light.primary),
                                },
                                "Key Projects",
                              ),
                              react_1["default"].createElement(
                                "div",
                                {
                                  className:
                                    "grid grid-cols-1 md:grid-cols-3 gap-4",
                                },
                                exp.projects.map(function (project, i) {
                                  return react_1["default"].createElement(
                                    framer_motion_1.motion.div,
                                    {
                                      key: "project-" + index + "-" + i,
                                      initial: { opacity: 0, y: 20 },
                                      animate: { opacity: 1, y: 0 },
                                      transition: { delay: 0.1 * i },
                                      className:
                                        "p-4 rounded-lg " +
                                        (darkMode
                                          ? "bg-gray-700/50"
                                          : "bg-white/60"),
                                    },
                                    project,
                                  );
                                }),
                              ),
                            ),
                            react_1["default"].createElement(
                              "div",
                              { className: "space-y-4" },
                              react_1["default"].createElement(
                                "h5",
                                {
                                  className:
                                    "font-semibold " +
                                    (darkMode
                                      ? textSystem_1["default"].dark.primary
                                      : textSystem_1["default"].light.primary),
                                },
                                "Achievements",
                              ),
                              react_1["default"].createElement(
                                "div",
                                { className: "space-y-2" },
                                exp.achievements.map(function (achievement, i) {
                                  return react_1["default"].createElement(
                                    framer_motion_1.motion.div,
                                    {
                                      key: i,
                                      initial: { opacity: 0, x: -20 },
                                      animate: { opacity: 1, x: 0 },
                                      transition: { delay: 0.1 * i },
                                      className: "flex items-center gap-2",
                                    },
                                    react_1["default"].createElement(
                                      lucide_react_1.ChevronRight,
                                      {
                                        className: darkMode
                                          ? "text-blue-400"
                                          : "text-blue-600",
                                      },
                                    ),
                                    react_1["default"].createElement(
                                      "span",
                                      null,
                                      achievement,
                                    ),
                                  );
                                }),
                              ),
                            ),
                          ),
                        ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
        react_1["default"].createElement(
          ScrollReveal,
          null,
          react_1["default"].createElement(
            "div",
            null,
            react_1["default"].createElement(
              framer_motion_1.motion.div,
              {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                className: "flex items-center justify-center gap-3 mb-12",
              },
              react_1["default"].createElement(lucide_react_1.Award, {
                className: darkMode ? "text-blue-400" : "text-blue-600",
                size: 32,
              }),
              react_1["default"].createElement(
                "h3",
                {
                  className:
                    "text-3xl font-bold " +
                    (darkMode
                      ? textSystem_1["default"].dark.primary
                      : textSystem_1["default"].light.primary),
                },
                "Awards and Recognition",
              ),
            ),
            react_1["default"].createElement(
              "div",
              { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
              awards.map(function (award, index) {
                return react_1["default"].createElement(
                  framer_motion_1.motion.div,
                  {
                    key: index,
                    initial: { opacity: 0, scale: 0.9 },
                    animate: { opacity: 1, scale: 1 },
                    transition: { delay: 0.2 * index },
                    onMouseEnter: function () {
                      return setHoveredAward(index);
                    },
                    onMouseLeave: function () {
                      return setHoveredAward(null);
                    },
                    className: "relative group",
                  },
                  react_1["default"].createElement(framer_motion_1.motion.div, {
                    className:
                      "absolute inset-0 rounded-xl bg-gradient-to-r " +
                      award.color +
                      " opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                  }),
                  react_1["default"].createElement(
                    "div",
                    {
                      className:
                        "relative p-8 rounded-xl backdrop-blur-sm " +
                        (darkMode ? "bg-gray-800/40" : "bg-white/40") +
                        " transition-all duration-300 transform hover:scale-105",
                    },
                    react_1["default"].createElement(
                      "div",
                      { className: "flex items-start gap-4" },
                      react_1["default"].createElement(
                        "div",
                        { className: "flex-1" },
                        react_1["default"].createElement(lucide_react_1.Star, {
                          className:
                            "w-8 h-8 mb-4 " +
                            (hoveredAward === index
                              ? "text-yellow-400"
                              : darkMode
                                ? "text-blue-400"
                                : "text-blue-600") +
                            " transition-colors duration-300",
                        }),
                        react_1["default"].createElement(
                          "h4",
                          {
                            className:
                              "text-xl font-bold mb-2 " +
                              (darkMode
                                ? textSystem_1["default"].dark.primary
                                : textSystem_1["default"].light.primary),
                          },
                          award.award,
                        ),
                        react_1["default"].createElement(
                          "p",
                          {
                            className:
                              "mb-2 " +
                              (darkMode
                                ? textSystem_1["default"].dark.secondary
                                : textSystem_1["default"].light.secondary),
                          },
                          award.organization,
                        ),
                        react_1["default"].createElement(
                          "p",
                          {
                            className:
                              "text-sm " +
                              (darkMode ? "text-blue-400" : "text-blue-600"),
                          },
                          award.year,
                        ),
                      ),
                    ),
                    react_1["default"].createElement(
                      framer_motion_1.AnimatePresence,
                      null,
                      hoveredAward === index &&
                        react_1["default"].createElement(
                          framer_motion_1.motion.div,
                          {
                            initial: { opacity: 0, y: 20 },
                            animate: {
                              opacity: 1,
                              y: 0,
                              transition: {
                                duration: 0.3,
                                ease: "easeOut",
                              },
                            },
                            exit: {
                              opacity: 0,
                              y: 10,
                              transition: {
                                duration: 0.2,
                                ease: "easeIn",
                              },
                            },
                            className: "mt-4 pt-4 border-t border-gray-600/20",
                          },
                          react_1["default"].createElement(
                            "p",
                            {
                              className:
                                "mb-3 " +
                                (darkMode
                                  ? textSystem_1["default"].dark.tertiary
                                  : textSystem_1["default"].light.tertiary),
                            },
                            award.details,
                          ),
                          react_1["default"].createElement(
                            "div",
                            {
                              className:
                                "inline-block px-4 py-2 rounded-full text-sm " +
                                (darkMode
                                  ? "bg-blue-500/20 text-blue-300"
                                  : "bg-blue-100 text-blue-800"),
                            },
                            award.impact,
                          ),
                        ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
      "); }; export default About;",
    ),
  );
};
