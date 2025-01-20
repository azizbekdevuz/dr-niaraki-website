// data/publicationsData.ts
export type PublicationType = 
  | 'journal' 
  | 'book' 
  | 'book_chapter' 
  | 'conference' 
  | 'referred';

export interface Publication {
  id: number;
  type: PublicationType;
  title: string;
  authors: string[];
  year: number;
  venue: string;
  impact?: string;
  doi?: string;
  category?: string;
}

// Full Publication Data
const publicationsData: Publication[] = [
    {
        "id": 1,
        "type": "journal",
        "title": "Enhancing spatial prediction of groundwater-prone areas through optimization of a boosting algorithm with bio-inspired metaheuristic algorithms",
        "authors": [
            "Razavi-Termeh, S. V.", "Sadeghi-Niaraki, A.", "Abba, S. I.", "Ali, F.", "Choi, S. M."
        ],
        "year": 2024,
        "venue": "International Journal of Environmental Research and Public Health, 14(11)",
        "impact": "SCIE-Q1-IF: 5.7, TOP7%"
    },
    {
        "id": 2,
        "type": "journal",
        "title": "Razavi-Termeh, S. V., Sadeghi-Niaraki, A., Naqvi, R. A., Farman, A., & Choi, S. M.",
        "authors": [
            "Cutting-Edge Strategies for Absence Data Identification in Natural Hazards: Leveraging Voronoi-Entropy in Flood Susceptibility Mapping with Advanced AI Techniques"
        ],
        "year": 2024,
        "venue": "Journal of Hydrology.",
        "impact": "SCIE-Q1-IF: 5.9, TOP10%"
    },
    {
        "id": 3,
        "type": "journal",
        "title": "Razavi-Termeh, S. V., Sadeghi-Niaraki, A., Naqvi, R. A., Farman, A., & Choi, S. M.",
        "authors": [
            "Spatio-Temporal Modeling of Asthma-Prone Areas: Exploring the Influence of Urban Climate Factors with Explainable Artificial Intelligence (XAI)"
        ],
        "year": 2024,
        "venue": "Sustainable Cities and Society.",
        "impact": "SCIE-Q1-IF: 10.5, TOP2%"
    },
    {
        "id": 4,
        "type": "journal",
        "title": "Razavi-Termeh, S. V., Sadeghi-Niaraki, A., Yao, X. A., Naqvi, R. A. & Choi, S. M.",
        "authors": [
            "Assessment of Noise Pollution-Prone Areas using an Explainable Geospatial artificial intelligence Approach"
        ],
        "year": 2024,
        "venue": "Journal of Environmental Management.",
        "impact": "SCIE-Q1-IF: 8.0, TOP9%"
    },
    {
        "id": 5,
        "type": "journal",
        "title": "Rashidian, M., Malek, M. R., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "Epidemic exposure risk assessment in digital contact tracing: A fuzzy logic approach"
        ],
        "year": 2024,
        "venue": "Digital Health, 10, 20552076241261929.",
        "impact": "SSCI-Q2-IF: 2.9"
    },
    {
        "id": 6,
        "type": "journal",
        "title": "Razavi-Termeh, S. V., Sadeghi-Niaraki, A., Farhangi, F., Khiadani, M., Pirasteh, S., & Choi, S. M.",
        "authors": [
            "Solving Water Scarcity Challenges in Arid Regions: A Novel Approach Employing Human-Based Meta-Heuristics and Machine Learning Algorithm for Groundwater Potential Mapping"
        ],
        "year": 2024,
        "venue": "Chemosphere, 142859.",
        "impact": "SCIE-Q1-IF: 8.1, TOP8%"
    },
    {
        "id": 7,
        "type": "journal",
        "title": "Bazargani, J. S., Rahim, N., Sadeghi-Niaraki, A., Abuhmed, T., Song, H., & Choi, S. M.",
        "authors": [
            "Alzheimer's Disease Diagnosis in the Metaverse"
        ],
        "year": 2024,
        "venue": "Computer Methods and Programs in Biomedicine, 108348.",
        "impact": "SCIE-Q1-IF: 4.9, TOP13%"
    },
    {
        "id": 8,
        "type": "journal",
        "title": "Exploring multi-pollution variability in the urban environment: geospatial AI-driven modeling of air and noise",
        "authors": [
            "Razavi-Termeh, S. V.", "Sadeghi-Niaraki, A.", "Jelokhani-Niaraki, M.", "Choi, S. M."
        ],
        "year": 2024,
        "venue": "International Journal of Digital Earth, 17(1)",
        "impact": "SCIE-Q1-IF: 3.7, TOP19%"
    },
    {
        "id": 9,
        "type": "journal",
        "title": "Hussain, D., Al-Masni, M. A., Aslam, M., Sadeghi-Niaraki, A., Hussain, J., Gu, Y. H., & Naqvi, R. A.",
        "authors": [
            "Revolutionizing tumor detection and classification in multimodality imaging based on deep learning approaches: methods",
            "applications and limitations"
        ],
        "year": 2024,
        "venue": "Journal of X-Ray Science and Technology, 1-55.",
        "impact": "SCIE-Q2-IF: 3.0"
    },
    {
        "id": 10,
        "type": "journal",
        "title": "Razavi-Termeh, S. V., Sadeghi-Niaraki, A., Sorooshian, A., Abuhmed, T., & Choi, S. M.",
        "authors": [
            "Spatial mapping of land susceptibility to dust emissions using optimization of attentive Interpretable Tabular Learning (TabNet) model"
        ],
        "year": 2024,
        "venue": "Journal of Environmental Management, accepted.",
        "impact": "SCIE-Q1-IF: 8.7, TOP12%"
    },
    {
        "id": 11,
        "type": "journal",
        "title": "Temporal dynamics of urban gas pipeline risks",
        "authors": [
            "Rahimi, F.", "Sadeghi-Niaraki, A.", "Ghodousi, M.", "Abuhmed, T.", "Choi, S. M."
        ],
        "year": 2024,
        "venue": "Scientific Reports, 14(1)",
        "impact": "SCIE-Q2-IF: 4.6"
    },
    {
        "id": 12,
        "type": "journal",
        "title": "Jafar, A., Bibi, N., Naqvi, R. A., Sadeghi-Niaraki, A., & Jeong, D.",
        "authors": [
            "Revolutionizing agriculture with artificial intelligence: plant disease detection methods",
            "applications",
            "and their limitations"
        ],
        "year": 2024,
        "venue": "Frontiers in Plant Science, 15, 1356260.",
        "impact": "SCIE-Q1-IF: 5.6, TOP11%"
    },
    {
        "id": 13,
        "type": "journal",
        "title": "Enhancing flood-prone area mapping: fine-tuning the K-nearest neighbors (KNN) algorithm for spatial modelling",
        "authors": [
            "Razavi-Termeh, S. V.", "Sadeghi-Niaraki, A.", "Razavi, S.", "Choi, S. M."
        ],
        "year": 2024,
        "venue": "International Journal of Digital Earth, 17(1)",
        "impact": "SCIE-Q1-IF: 5.1, TOP17%"
    },
    {
        "id": 14,
        "type": "journal",
        "title": "Ranjgar, B., Sadeghi-Niaraki, A., Shakeri, M., Rahimi, F., & Choi, S. M.",
        "authors": [
            "Cultural Heritage Information Retrieval: Past",
            "Present and Future Trends"
        ],
        "year": 2024,
        "venue": "IEEE Access.",
        "impact": "SCIE-Q2-IF: 3.9"
    },
    {
        "id": 15,
        "type": "journal",
        "title": "Shakeri, M., Park, H., Jeon, I., Sadeghi-Niaraki, A., & Woo, W.",
        "authors": [
            "User behavior modeling for AR personalized recommendations in spatial transitions"
        ],
        "year": 2023,
        "venue": "Virtual Reality, 1-18.",
        "impact": "SCIE-Q2-IF: 4.2"
    },
    {
        "id": 16,
        "type": "journal",
        "title": "Razavi-Termeh, S. V., Hatamiafkoueieh, J., Sadeghi-Niaraki, A., Choi, S. M., & Al-Kindi, K. M.",
        "authors": [
            "A GIS-based multi-objective evolutionary algorithm for landslide susceptibility mapping"
        ],
        "year": 2023,
        "venue": "Stochastic Environmental Research and Risk Assessment, 1-26.",
        "impact": "SCIE-Q2-IF: 4.2"
    },
    {
        "id": 17,
        "type": "journal",
        "title": "Hosseini, F. S., Seo, M. B., Razavi-Termeh, S. V., Sadeghi-Niaraki, A., Jamshidi, M., & Choi, S. M.",
        "authors": [
            "Geospatial Artificial Intelligence (GeoAI) and Satellite Imagery Fusion for Soil Physical Property Predicting"
        ],
        "year": 2023,
        "venue": "Sustainability, 15 (19), 14125.",
        "impact": "SSCI-Q2-IF: 3.9"
    },
    {
        "id": 18,
        "type": "journal",
        "title": "Rokhsaritalemi, S., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "Exploring Emotion Analysis using Artificial Intelligence",
            "Geospatial Information Systems",
            "and Extended Reality for Urban Services"
        ],
        "year": 2023,
        "venue": "IEEE Access.",
        "impact": "SCIE-Q2-IF: 3.9"
    },
    {
        "id": 19,
        "type": "journal",
        "title": "Razavi-Termeh, S. V., Seo, M., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "Flash flood detection and susceptibility mapping in the Monsoon period by integration of optical and radar satellite imagery using an improvement of a sequential ensemble algorithm"
        ],
        "year": 2023,
        "venue": "Weather and Climate Extremes, 41, 100595.",
        "impact": "SCIE-Q1-IF: 8.0, TOP8%"
    },
    {
        "id": 20,
        "type": "journal",
        "title": "Razavi-Termeh, S. V., Sadeghi-Niaraki, A., Naqvi, R. A., & Choi, S. M.",
        "authors": [
            "Dust detection and susceptibility mapping by aiding satellite imagery time series and integration of ensemble machine learning with evolutionary algorithms"
        ],
        "year": 2023,
        "venue": "Environmental Pollution, 335, 122241.",
        "impact": "SCIE-Q1-IF: 8.9, TOP10%"
    },
    {
        "id": 21,
        "type": "journal",
        "title": "Razavi-Termeh, S. V., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "A new approach based on biology-inspired metaheuristic algorithms in combination with random forest to enhance the flood susceptibility mapping"
        ],
        "year": 2023,
        "venue": "Journal of Environmental Management, 345, 118790.",
        "impact": "SCIE-Q1-IF: 8.7, TOP11%"
    },
    {
        "id": 22,
        "type": "journal",
        "title": "Farhangi, F., Sadeghi-Niaraki, A., Safari Bazargani, J., Razavi-Termeh, S. V., Hussain, D., & Choi, S. M.",
        "authors": [
            "Time-Series Hourly Sea Surface Temperature Prediction Using Deep Neural Network Models"
        ],
        "year": 2023,
        "venue": "Journal of Marine Science and Engineering, 11 (6), 1136.",
        "impact": "SCIE-Q1-IF: 2.9"
    },
    {
        "id": 23,
        "type": "journal",
        "title": "Bahadori, N., Razavi-Termeh, S. V., Sadeghi-Niaraki, A., Al-Kindi, K. M., Abuhmed, T., Nazeri, B., & Choi, S. M.",
        "authors": [
            "Wildfire Susceptibility Mapping Using Deep Learning Algorithms in Two Satellite Imagery Dataset"
        ],
        "year": 2023,
        "venue": "Forests, 14 (7), 1325.",
        "impact": "SCIE-Q1-IF: 2.9"
    },
    {
        "id": 24,
        "type": "journal",
        "title": "Farahani, M., Razavi-Termeh, S. V., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "A Hybridization of Spatial Modeling and Deep Learning for People's Visual Perception of Urban Landscapes"
        ],
        "year": 2023,
        "venue": "Sustainability, 15 (13), 10403.",
        "impact": "SSCI-Q2-IF: 3.9"
    },
    {
        "id": 25,
        "type": "journal",
        "title": "Razavi-Termeh, S. V., Sadeghi-Niaraki, A., Seo, M., & Choi, S. M.",
        "authors": [
            "Application of genetic algorithm in optimization parallel ensemble-based machine learning algorithms to flood susceptibility mapping using radar satellite imagery"
        ],
        "year": 2023,
        "venue": "Science of The Total Environment, 873, 162285.",
        "impact": "SCIE-Q1-IF: 9.8, TOP6%"
    },
    {
        "id": 26,
        "type": "journal",
        "title": "Sadeghi-Niaraki, A.",
        "authors": [
            "Internet of Thing (IoT) review of review: Bibliometric overview since its foundation"
        ],
        "year": 2023,
        "venue": "Future Generation Computer Systems.",
        "impact": "SCIE-Q1-IF: 7.307, TOP8%"
    },
    {
        "id": 27,
        "type": "journal",
        "title": "People's olfactory perception potential mapping using a machine learning algorithm: A Spatio-temporal approach",
        "authors": [
            "Farahani, M.", "Razavi-Termeh, S. V.", "Sadeghi-Niaraki, A.", "Choi, S. M."
        ],
        "year": 2023,
        "venue": "Sustainable Cities and Society, 104472",
        "impact": "SCIE-Q1-IF: 11.7, TOP0.7%"
    },
    {
        "id": 28,
        "type": "journal",
        "title": "Bazargani, J. S., Sadeghi-Niaraki, A., Rahimi, F., Abuhmed, T., & Choi, S. M.",
        "authors": [
            "An IoT-Based Approach for Learning Geometric Shapes in Early Childhood"
        ],
        "year": 2022,
        "venue": "IEEE Access, 10, 130632-130641.",
        "impact": "SCIE-Q1-IF: 3.476"
    },
    {
        "id": 29,
        "type": "journal",
        "title": "Ranjgar, B., Razavi-Termeh, S. V., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "Natural Hazard Susceptibility Mapping Using Ubiquitous Geospatail Artificial Intelligence (Ubiquitous GeoAI) Concept: A Case Study on Forest Fire Susceptibility Mapping"
        ],
        "year": 2022,
        "venue": "Current Overview on Science and Technology Research Vol. 7, 100-119.",
        "impact": "Chapter Book"
    },
    {
        "id": 30,
        "type": "journal",
        "title": "Shakeri, M., Sadeghi-Niaraki, A., Choi, S. M., & AbuHmed, T.",
        "authors": [
            "AR Search Engine: Semantic Information Retrieval for Augmented Reality Domain"
        ],
        "year": 2022,
        "venue": "Sustainability, 14 (23), 15681.",
        "impact": "SSCI-Q2-IF: 3.889"
    },
    {
        "id": 31,
        "type": "journal",
        "title": "Shabanpour, N., Razavi-Termeh, S. V., Sadeghi-Niaraki, A., Choi, S. M., & Abuhmed, T.",
        "authors": [
            "Integration of machine learning algorithms and GIS-based approaches to cutaneous leishmaniasis prevalence risk mapping"
        ],
        "year": 2022,
        "venue": "International Journal of Applied Earth Observation and Geoinformation, 112, 102854.",
        "impact": "SCIE-Q1-IF: 7.672, TOP13%"
    },
    {
        "id": 32,
        "type": "journal",
        "title": "Kaffash Charandabi, N., Sadeghi-Niaraki, A., Choi, S. M., & Abuhmed, T.",
        "authors": [
            "An approach for measuring spatial similarity among COVID-19 epicenters"
        ],
        "year": 2022,
        "venue": "Geo-spatial Information Science, 1-18.",
        "impact": "SCIE-Q2-IF: 4.288"
    },
    {
        "id": 33,
        "type": "journal",
        "title": "Ghafoori, H. R., Sadeghi-Niaraki, A., Alesheikh, A. A., & Choi, S. M.",
        "authors": [
            "Ubiquitous GIS based outdoor evacuation assistance: An effective response to earthquake disasters"
        ],
        "year": 2022,
        "venue": "International Journal of Disaster Risk Reduction, 103232.",
        "impact": "SCIE-Q1-IF: 4.842, TOP16%"
    },
    {
        "id": 34,
        "type": "journal",
        "title": "Zafari, M., Bazargani, J. S., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "Artificial Intelligence Applications in K-12 Education: A Systematic Literature Review"
        ],
        "year": 2022,
        "venue": "IEEE Access.",
        "impact": "SCIE-Q1-IF: 3.476"
    },
    {
        "id": 35,
        "type": "journal",
        "title": "Rokhsaritalemi, S., Sadeghi-Niaraki, A., Kang, H. S., Lee, J. W., & Choi, S. M.",
        "authors": [
            "Ubiquitous Tourist System Based on Multicriteria Decision Making and Augmented Reality"
        ],
        "year": 2022,
        "venue": "Applied Sciences, 12 (10), 5241.",
        "impact": "SCIE-Q2-IF: 2.838"
    },
    {
        "id": 36,
        "type": "journal",
        "title": "Safari Bazargani, J., Zafari, M., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "A Survey of GIS and AR Integration: Applications"
        ],
        "year": 2022,
        "venue": "Sustainability, 14 (16), 10134.",
        "impact": "SSCI-Q2-IF: 3.889"
    },
    {
        "id": 37,
        "type": "journal",
        "title": "Farahani, M., Razavi-Termeh, S. V., & Sadeghi-Niaraki, A.",
        "authors": [
            "A spatially based machine learning algorithm for potential mapping of the hearing senses in an urban environment"
        ],
        "year": 2022,
        "venue": "Sustainable Cities and Society, 103675.",
        "impact": "SCIE-Q1-IF: 10.696, TOP0.7%"
    },
    {
        "id": 38,
        "type": "journal",
        "title": "Shakeri, M., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "Augmented reality-based border management"
        ],
        "year": 2022,
        "venue": "Virtual Reality, 1-21.",
        "impact": "SCIE-Q1-IF: 5.095"
    },
    {
        "id": 39,
        "type": "journal",
        "title": "Park, H., Shakeri, M., Jeon, I., Kim, J., Sadeghi-Niaraki, A., & Woo, W.",
        "authors": [
            "Spatial transition management for improving outdoor cinematic augmented reality experience of the TV show"
        ],
        "year": 2022,
        "venue": "Virtual Reality, 1-19.",
        "impact": "SCIE-Q1-IF: 5.095"
    },
    {
        "id": 40,
        "type": "journal",
        "title": "Razavi-Termeh, S. V., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "Spatio-temporal modeling of asthma-prone areas using a machine learning optimized with metaheuristic algorithms"
        ],
        "year": 2022,
        "venue": "Geocarto International, 1-22.",
        "impact": "SCIE-Q1-IF: 4.889"
    },
    {
        "id": 41,
        "type": "journal",
        "title": "Karimi, M., Zakariyaeinejad, Z., Sadeghi-Niaraki, A., & Ahmadabadian, A. H",
        "authors": [
            "A new method for automatic and accurate coded target recognition in oblique images to improve augmented reality precision"
        ],
        "year": 2022,
        "venue": "Transactions in GIS.",
        "impact": "SSCI-Q2-IF: 2.406"
    },
    {
        "id": 42,
        "type": "journal",
        "title": "Adnan, R. M., Yaseen, Z. M., Heddam, S., Shahid, S., Sadeghi-Niaraki, A., & Kisi, O.",
        "authors": [
            "Predictability performance enhancement for suspended sediment in rivers: Inspection of newly developed hybrid adaptive neuro-fuzzy system model"
        ],
        "year": 2022,
        "venue": "International Journal of Sediment Research, 37 (3), 383-398.",
        "impact": "SCIE-Q2-IF: 2.902"
    },
    {
        "id": 43,
        "type": "journal",
        "title": "Ranjgar, B., Sadeghi-Niaraki, A., Shakeri, M., & Choi, S. M.",
        "authors": [
            "An ontological data model for points of interest (POI) in a cultural heritage site"
        ],
        "year": 2022,
        "venue": "Heritage Science, 10 (1), 1-22.",
        "impact": "SCIE-Q3-IF: 2.517"
    },
    {
        "id": 44,
        "type": "journal",
        "title": "Razavi-Termeh, S. V., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "Coronavirus disease vulnerability map using a geographic information system (GIS) from 16 April to 16 May 2020"
        ],
        "year": 2022,
        "venue": "Physics and Chemistry of the Earth, Parts A/B/C, 103043.",
        "impact": "SCIE-Q2-IF: 2.712"
    },
    {
        "id": 45,
        "type": "journal",
        "title": "Razavi-Termeh, S. V., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "Effects of air pollution in Spatio-temporal modeling of asthma-prone areas using a machine learning model"
        ],
        "year": 2021,
        "venue": "Environmental Research, 200, 111344.",
        "impact": "SCIE-Q1-IF: 6.498, TOP12%"
    },
    {
        "id": 46,
        "type": "journal",
        "title": "Razavi-Termeh, S. V., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "Asthma-prone areas modeling using a machine learning model"
        ],
        "year": 2021,
        "venue": "Scientific Reports (Nature), 11(1), 1-16.",
        "impact": "SCIE-Q1-IF: 4.380"
    },
    {
        "id": 47,
        "type": "journal",
        "title": "Safari Bazargani, J., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "Design",
            "Implementation",
            "and Evaluation of an Immersive Virtual Reality-Based Educational Game for Learning Topology Relations at Schools: A Case Study"
        ],
        "year": 2021,
        "venue": "Sustainability, 13 (23), 13066.",
        "impact": "SSCI-Q2-IF: 3.251"
    },
    {
        "id": 48,
        "type": "journal",
        "title": "Zafari, M., Sadeghi-Niaraki, A., Choi, S. M., & Esmaeily, A.",
        "authors": [
            "A Practical Model for the Evaluation of High School Student Performance Based on Machine Learning"
        ],
        "year": 2021,
        "venue": "Applied Sciences, 11 (23), 11534.",
        "impact": "SCIE-Q2-IF: 2.679"
    },
    {
        "id": 49,
        "type": "journal",
        "title": "Safari Bazargani, J., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "A Survey of GIS and IoT Integration: Applications and Architecture"
        ],
        "year": 2021,
        "venue": "Applied Sciences, 11 (21), 10365.",
        "impact": "SCIE-Q2-IF: 2.679"
    },
    {
        "id": 50,
        "type": "journal",
        "title": "Razavi-Termeh, S. V., Sadeghi-Niaraki, A., Farhangi, F., & Choi, S. M.",
        "authors": [
            "COVID-19 Risk Mapping with Considering Socio-Economic Criteria Using Machine Learning Algorithms"
        ],
        "year": 2021,
        "venue": "International Journal of Environmental Research and Public Health, 18 (18), 9657.",
        "impact": "SSCI-Q1-IF: 3.390"
    },
    {
        "id": 51,
        "type": "journal",
        "title": "Farhangi, F., Sadeghi-Niaraki, A., Razavi-Termeh, S. V., & Choi, S. M.",
        "authors": [
            "Evaluation of Tree-Based Machine Learning Algorithms for Accident Risk Mapping Caused by Driver Lack of Alertness at a National Scale"
        ],
        "year": 2021,
        "venue": "Sustainability, 13 (18), 10239.",
        "impact": "SSCI-Q2-IF: 3.251"
    },
    {
        "id": 52,
        "type": "journal",
        "title": "Razavi-Termeh, S. V., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "Spatial modeling of asthma-prone areas using remote sensing and ensemble machine learning algorithms"
        ],
        "year": 2021,
        "venue": "Remote Sensing, 13 (16), 3222.",
        "impact": "SCIE-Q1-IF: 4.848"
    },
    {
        "id": 53,
        "type": "journal",
        "title": "Rezaee, S., Sadeghi-Niaraki, A., Shakeri, M., & Choi, S. M.",
        "authors": [
            "Personalized Augmented Reality Based Tourism System: Big Data and User Demographic Contexts"
        ],
        "year": 2021,
        "venue": "Applied Sciences, 11 (13), 6047.",
        "impact": "SCIE-Q2-IF: 2.679"
    },
    {
        "id": 54,
        "type": "journal",
        "title": "Rahimi, F., Sadeghi-Niaraki, A., Ghodousi, M., & Choi, S. M.",
        "authors": [
            "Discovering Intra-Urban Population Movement Pattern Using Taxis' Origin and Destination Data and Modeling the Parameters Affecting Population Distribution"
        ],
        "year": 2021,
        "venue": "Applied Sciences, 11 (13), 5987.",
        "impact": "SCIE-Q2-IF: 2.679"
    },
    {
        "id": 55,
        "type": "journal",
        "title": "Vakilipour, S., Sadeghi-Niaraki, A., Ghodousi, M., & Choi, S. M.",
        "authors": [
            "Comparison between Multi-Criteria Decision-Making Methods and Evaluating the Quality of Life at Different Spatial Levels"
        ],
        "year": 2021,
        "venue": "Sustainability, 13 (7), 4067.",
        "impact": "SSCI-Q2-IF: 3.251"
    },
    {
        "id": 56,
        "type": "journal",
        "title": "Rahimi, F., Sadeghi-Niaraki, A., Ghodousi, M., & Choi, S. M.",
        "authors": [
            "Modeling Population Spatial-Temporal Distribution Using Taxis Origin and Destination Data"
        ],
        "year": 2021,
        "venue": "Sustainability, 13 (7), 3727.",
        "impact": "SSCI-Q2-IF: 3.251"
    },
    {
        "id": 57,
        "type": "journal",
        "title": "Farhangi, F., Sadeghi-Niaraki, A., Nahvi, A., & Razavi-Termeh, S. V.",
        "authors": [
            "Spatial modeling of accidents risk caused by driver drowsiness with data mining algorithms"
        ],
        "year": 2021,
        "venue": "Geocarto International, 1-19.",
        "impact": "SCIE-Q1-IF: 4.889"
    },
    {
        "id": 58,
        "type": "journal",
        "title": "Sadeghi-Niaraki, A., Mirshafiei, P., Shakeri, M., & Choi, S. M.",
        "authors": [
            "Short-Term Traffic Flow Prediction Using the Modified Elman Recurrent Neural Network Optimized Through a Genetic Algorithm"
        ],
        "year": 2020,
        "venue": "IEEE Access, 8, 217526-217540.",
        "impact": "SCIE-Q1-IF: 3.745"
    },
    {
        "id": 59,
        "type": "journal",
        "title": "Razavi-Termeh, S. V., Khosravi, K., Sadeghi-Niaraki, A., Choi, S. M., & Singh, V. P.",
        "authors": [
            "Improving groundwater potential mapping using metaheuristic approaches"
        ],
        "year": 2020,
        "venue": "Hydrological Sciences Journal, 65",
        "impact": "16), 2729-2749. (SCIE-Q1-IF: 2.186"
    },
    {
        "id": 60,
        "type": "journal",
        "title": "Sadeghi-Niaraki, A., Jelokhani-Niaraki, M., & Choi, S. M.",
        "authors": [
            "A Volunteered Geographic Information-Based Environmental Decision Support System for Waste Management and Decision Making"
        ],
        "year": 2020,
        "venue": "Sustainability, 12 (15), 6012.",
        "impact": "SSCI-Q2-IF: 3.251"
    },
    {
        "id": 61,
        "type": "journal",
        "title": "Sadeghi-Niaraki, A., Kisi, O., & Choi, S. M.",
        "authors": [
            "Spatial modeling of long-term air temperatures for sustainability: evolutionary fuzzy approach and neuro-fuzzy methods"
        ],
        "year": 2020,
        "venue": "PeerJ, 8, e8882.",
        "impact": "SCIE-Q1-IF: 2.379"
    },
    {
        "id": 62,
        "type": "journal",
        "title": "Ghodousi, M., Sadeghi-Niaraki, A., Rabiee, F., & Choi, S. M.",
        "authors": [
            "Spatial-Temporal Analysis of Point Distribution Pattern of Schools Using Spatial Autocorrelation Indices in Bojnourd City"
        ],
        "year": 2020,
        "venue": "Sustainability, 12 (18), 7755.",
        "impact": "SSCI-Q2-IF: 3.251"
    },
    {
        "id": 63,
        "type": "journal",
        "title": "Shakeri, M., Sadeghi-Niaraki, A., Choi, S. M., & Islam, S. M.",
        "authors": [
            "Performance Analysis of IoT-Based Health and Environment WSN Deployment"
        ],
        "year": 2020,
        "venue": "Sensors, 20 (20), 5923.",
        "impact": "SCIE-Q1-IF: 3.275"
    },
    {
        "id": 64,
        "type": "journal",
        "title": "Razavi-Termeh, S. V., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "Gully erosion susceptibility mapping using artificial intelligence and statistical models"
        ],
        "year": 2020,
        "venue": "Geomatics, Natural Hazards and Risk, 11 (1), 821-844.",
        "impact": "SCIE-Q1-IF: 3.333"
    },
    {
        "id": 65,
        "type": "journal",
        "title": "Razavi-Termeh, S. V., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "Ubiquitous GIS-Based Forest Fire Susceptibility Mapping Using Artificial Intelligence Methods"
        ],
        "year": 2020,
        "venue": "Remote Sensing, 12 (10), 1689.",
        "impact": "SCIE-Q1-IF: 4.509"
    },
    {
        "id": 66,
        "type": "journal",
        "title": "Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "A Survey of Marker-Less Tracking and Registration Techniques for Health & Environmental Applications to Augmented Reality and Ubiquitous Geospatial Information Systems"
        ],
        "year": 2020,
        "venue": "Sensors, 20 (10), 2997.",
        "impact": "SCIE-Q1-IF: 3.275"
    },
    {
        "id": 67,
        "type": "journal",
        "title": "Rokhsaritalemi, S., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "A Review on Mixed Reality: Current Trends",
            "Challenges and Prospects"
        ],
        "year": 2020,
        "venue": "Applied Sciences, 10 (2), 636.",
        "impact": "SCIE-Q2-IF: 2.679"
    },
    {
        "id": 68,
        "type": "journal",
        "title": "Li, Y., Wang, H., Dang, L. M., Sadeghi-Niaraki, A., & Moon, H.",
        "authors": [
            "Crop pest recognition in natural scenes using convolutional neural networks"
        ],
        "year": 2020,
        "venue": "Computers and Electronics in Agriculture, 169, 105174.",
        "impact": "SCIE-Q1-IF: 5.565"
    },
    {
        "id": 69,
        "type": "journal",
        "title": "Sadeghi-Niaraki, A.",
        "authors": [
            "Industry 4"
        ],
        "year": 2020,
        "venue": "0 development multi-criteria assessment: An integrated fuzzy DEMATEL, ANP and VIKOR methodology. IEEE Access, 8, 23689-23704.",
        "impact": "SCIE-Q1-IF: 4.098"
    },
    {
        "id": 70,
        "type": "journal",
        "title": "Barzegar, M., Sadeghi-Niaraki, A., Shakeri, M., & Choi, S. M.",
        "authors": [
            "An Improved Route Finding Algorithm using Ubiquitous Ontology Based Experiences Modeling"
        ],
        "year": 2019,
        "venue": "Complexity, 2019.",
        "impact": "SCIE-Q1-IF: 2.591"
    },
    {
        "id": 71,
        "type": "journal",
        "title": "Ranjgar, B., Azar, M. K., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "A Novel Method for Emotion Extraction from Paintings Based on Luscher's Psychological Color Test: Case Study Iranian-Islamic Paintings"
        ],
        "year": 2019,
        "venue": "IEEE Access, 7, 120857-120871.",
        "impact": "SCIE-Q1-IF: 4.098"
    },
    {
        "id": 72,
        "type": "journal",
        "title": "Omidipoor, M., Jelokhani-Niaraki, M., Moeinmehr, A., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "A GIS-based decision support system for facilitating participatory urban renewal process"
        ],
        "year": 2019,
        "venue": "Land Use Policy, 88, 104150.",
        "impact": "SCIE-Q1-IF: 3.573"
    },
    {
        "id": 73,
        "type": "journal",
        "title": "Mirshafiei, P., Sadeghi-Niaraki, A., Shakeri, M., & Choi, S. M.",
        "authors": [
            "Geospatial Information System-Based Modeling Approach for Leakage Management in Urban Water Distribution Networks"
        ],
        "year": 2019,
        "venue": "Water, 11 (8), 1736.",
        "impact": "SCIE-Q2-IF: 2.524"
    },
    {
        "id": 74,
        "type": "journal",
        "title": "Razavi-Termeh, S. V., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "Groundwater Potential Mapping Using an Integrated Ensemble of Three Bivariate Statistical Models with Random Forest and Logistic Model Tree Models"
        ],
        "year": 2019,
        "venue": "Water, 11 (8), 1596.",
        "impact": "SCIE-Q2-IF: 2.524"
    },
    {
        "id": 75,
        "type": "journal",
        "title": "Barzegar, M., Sadeghi-Niaraki, A., Shakeri, M., & Choi, S. M.",
        "authors": [
            "A Context-Aware Route Finding Algorithm for Self-Driving Tourists Using Ontology"
        ],
        "year": 2019,
        "venue": "Electronics, 8 (7), 808.",
        "impact": "SCIE-Q2-IF: 2.11"
    },
    {
        "id": 76,
        "type": "journal",
        "title": "Lahoorpoor, B., Faroqi, H., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "Spatial Cluster-Based Model for Static Rebalancing Bike Sharing Problem"
        ],
        "year": 2019,
        "venue": "Sustainability, 11 (11), 3205.",
        "impact": "SSCI-Q2-IF: 2.576"
    },
    {
        "id": 77,
        "type": "journal",
        "title": "Masoumi, Z., Genderen, J. V., & Sadeghi-Niaraki, A.,",
        "authors": [
            "An improved Ant Colony Optimization based algorithm for User-Centric Multi-Objective Path Planning for Ubiquitous environments"
        ],
        "year": 2019,
        "venue": "Geocarto International, 1-14.",
        "impact": "SCIE-Q1-IF: 3.789"
    },
    {
        "id": 78,
        "type": "journal",
        "title": "HormozzadehGhalati, H., Abbasi, A., & Sadeghi-Niaraki, A.",
        "authors": [
            "Optimal multi-product supplier selection under stochastic demand with service level and budget constraints using learning vector quantization neural network"
        ],
        "year": 2019,
        "venue": "RAIRO-Operations Research, 53 (5), 1709-1720.",
        "impact": "SCIE-Q4-IF: 1.025"
    },
    {
        "id": 79,
        "type": "journal",
        "title": "Barzegar, M., Sadeghi-Niaraki, A., Shakeri, M.",
        "authors": [
            "Spatial experience based route finding using ontologies"
        ],
        "year": 2019,
        "venue": "ETRI Journal.",
        "impact": "SCI, Q3-IF: 1.094"
    },
    {
        "id": 80,
        "type": "journal",
        "title": "Minh, D. L., Sadeghi-Niaraki, A., Huy, H. D., Min, K., & Moon, H.",
        "authors": [
            "Deep learning approach for short-term stock trends prediction based on two-stream gated recurrent unit network"
        ],
        "year": 2018,
        "venue": "IEEE Access, 6, 55392-55404.",
        "impact": "SCIE-Q1-IF: 3.557"
    },
    {
        "id": 81,
        "type": "journal",
        "title": "Jelokhani-Niaraki, M., Sadeghi-Niaraki, A., & Choi, S. M.",
        "authors": [
            "Semantic interoperability of GIS and MCDA tools for environmental assessment and decision making"
        ],
        "year": 2018,
        "venue": "Environmental Modelling & Software, 100, 104-122.",
        "impact": "SCIE-Q1-IF: 4.552"
    },
    {
        "id": 82,
        "type": "journal",
        "title": "Rad, T. G., Sadeghi-Niaraki, A., Abbasi, A., & Choi, S. M.",
        "authors": [
            "A methodological framework for assessment of ubiquitous cities using ANP and DEMATEL methods"
        ],
        "year": 2018,
        "venue": "Sustainable cities and society, 37, 608-618.",
        "impact": "SCIE-Q2-IF: 4.624"
    },
    {
        "id": 83,
        "type": "journal",
        "title": "Abbasi, A., Sadeghi-Niaraki, A., Jalili, M., & Choi, S. M.",
        "authors": [
            "Enhancing response coordination through the assessment of response network structural dynamics"
        ],
        "year": 2018,
        "venue": "PloS one, 13 (2), e0191130.",
        "impact": "SCIE-Q1-IF: 2.766"
    },
    {
        "id": 84,
        "type": "journal",
        "title": "Abbasi, A., Jalili, M., & Sadeghi-Niaraki, A.",
        "authors": [
            "Influence of network-based structural and power diversity on research performance"
        ],
        "year": 2018,
        "venue": "Scientometrics, 117 (1), 579-590.",
        "impact": "SCIE-Q1-IF: 2.173"
    },
    {
        "id": 85,
        "type": "journal",
        "title": "Sharif, M., & Sadeghi-Niaraki, A.",
        "authors": [
            "Ubiquitous sensor network simulation and emulation environments: A survey"
        ],
        "year": 2017,
        "venue": "Journal of Network and Computer Applications, 93, 150-181.",
        "impact": "SCIE-Q1-IF: 3.991"
    },
    {
        "id": 86,
        "type": "journal",
        "title": "Faroqi, H., & Sadeghi-Niaraki, A.",
        "authors": [
            "GIS-based ride-sharing and DRT in Tehran city"
        ],
        "year": 2016,
        "venue": "Public Transport: Planning and Operations, 8 (2), 243-260, DOI: 10.1007/s12469-016-0130-2",
        "impact": "Q1-SJR"
    },
    {
        "id": 87,
        "type": "journal",
        "title": "Kaffash-Charandabi, N., Sadeghi-Niaraki, A., & Dong-Kyun, P. A. R. K.",
        "authors": [
            "Using a Combined Platform of Swarm Intelligence Algorithms and GIS to Provide Land Suitability Maps for Locating Cardiac Rehabilitation Defibrillators"
        ],
        "year": 2015,
        "venue": "Iranian journal of public health, 44 (8), 1072.",
        "impact": "SSCI-Q4"
    },
    {
        "id": 88,
        "type": "journal",
        "title": "Effati M., A. Sadeghi-Niaraki",
        "authors": [
            "\"A semantic-based classification and regression tree approach for modelling complex spatial rules in motor vehicle crashes domain\"",
            "WIREs Data Mining Knowl Discov 2015",
            "5:181-194"
        ],
        "year": 2015,
        "venue": "doi: 10.1002/widm.1152",
        "impact": "SCIE-Q2-IF: 2.714"
    },
    {
        "id": 89,
        "type": "journal",
        "title": "Pham X.H., N.-H. Lee, J. J. Jung, A. Sadeghi-Niaraki",
        "authors": [
            "\"Collaborative Spam Filtering Based on Incremental Ontology Learning\" Telecommunication Systems",
            "Vol"
        ],
        "year": 2013,
        "venue": "52, No. 2, pp 693-700",
        "impact": "SCIE Q2-IF: 1.163"
    },
    {
        "id": 90,
        "type": "journal",
        "title": "Jelokhani-Niaraki, M., A. Sadeghi-Niaraki and K.Kim",
        "authors": [
            "\"An ontology-based approach for managing spatio-temporal linearly referenced road event data\"",
            "ROAD & TRANSPORT RESEARCH",
            "Vol"
        ],
        "year": 2012,
        "venue": "21 No.4, pp38-49",
        "impact": "SSCI-Q4"
    },
    {
        "id": 91,
        "type": "journal",
        "title": "Sadeghi-Niaraki, A., Varshosaz, M., Kim, K., & Jung, J. J.",
        "authors": [
            "Real world representation of a road network for route planning in GIS"
        ],
        "year": 2011,
        "venue": "Expert Systems with Applications, 38 (10), 11999-12008. dx.doi.org/10.1016/j.eswa.2010.12.123",
        "impact": "SCIE-Q1-IF: 2.203"
    },
    {
        "id": 92,
        "type": "journal",
        "title": "Jelokhani-Niaraki, M.R., A.A. Alesheikh, A. Alimohammadi, A. Sadeghi-Niaraki, K. Kim",
        "authors": [
            "\"An approach for automatic updating of GIS road segments for a pavement management system (PMS)\""
        ],
        "year": 2011,
        "venue": "Journal of Spatial Science, Vol. 56, No. 2, pp. 253-256.",
        "impact": "SCIE-Q4"
    },
    {
        "id": 93,
        "type": "journal",
        "title": "Jelokhani-Niaraki, M.R., A.A. Alesheikh, A. Alimohammadi, A. Sadeghi-Niaraki,",
        "authors": [
            "\"Towards a Rule Driven Approach for Updating Dynamic Road Segments\""
        ],
        "year": 2010,
        "venue": "Promet – Traffic & Transportation Journal, Volume. 22, Issue 6, 405-411",
        "impact": "SCIE-Q4"
    },
    {
        "id": 94,
        "type": "journal",
        "title": "Jelokhani-Niaraki, M.R., A.A. Alesheikh, A. Sadeghi-Niaraki,",
        "authors": [
            "\"An efficient approach for historical storage and retrieval of segmented road data in Geographic Information System for Transportation\""
        ],
        "year": 2010,
        "venue": "Chinese geographical science Journal, Volume 20, Issue 3, pp. 236-242, DOI 10.1007/s11769-010-0236-4",
        "impact": "SCIE-Q4"
    },
    {
        "id": 95,
        "type": "journal",
        "title": "Hwang D., N-T. Nguyen, J. J. Jung, A. Sadeghi-Niaraki, K-H. Baek,Y-Sh Han",
        "authors": [
            "\"A Semantic Wiki Framework for Reconciling Conflict Collaborations Based on Selecting Consensus Choices\" Journal of Universal Computer Science",
            "Vol"
        ],
        "year": 2010,
        "venue": "16, No. 7, pp. 1024-1035",
        "impact": "SCIE-Q3"
    },
    {
        "id": 96,
        "type": "journal",
        "title": "Sadeghi-Niaraki, A., K. Kim, M. Varshosaz",
        "authors": [
            "\"Multi-Criteria Decision-based Model for Road Network Process\"",
            "International Journal of Environmental Research",
            "Vol"
        ],
        "year": 2010,
        "venue": "4, No. 4, pp. 573-582",
        "impact": "SCIE Q2-IF: 1.626"
    },
    {
        "id": 97,
        "type": "journal",
        "title": "Sadeghi-Niaraki, A., K. Kim",
        "authors": [
            "\"Ontology based personalized route planning system using a multi-criteria decision making approach\"",
            "Journal of Expert Systems with Applications",
            "USA",
            "Volume 36",
            "Issue 2",
            "Part 1",
            "pp"
        ],
        "year": 2009,
        "venue": "2250-2259, doi:10.1016/j.eswa.2007.12.053",
        "impact": "SCIE Q1-IF: 2.908"
    },
    {
        "id": 100,
        "type": "book",
        "title": "Ontology-based and User-centric Spatial Modeling in GIS: Basics, Concepts, Methods, Applications",
        "authors": ["Sadeghi-Niaraki, A."],
        "year": 2009,
        "venue": "VDM - The Publisher, Saarbrücken, Germany"
    },
    {
        "id": 101,
        "type": "book",
        "title": "Python Programming for Engineering especially for GIS Engineering",
        "authors": ["Sadeghi-Niaraki, A.", "Shakeri, M."],
        "year": 2015,
        "venue": "K.N.Toosi University Publication (in Persian)"
    },
    {
        "id": 102,
        "type": "book",
        "title": "Spatial Analysis Programming using Python",
        "authors": ["Sadeghi-Niaraki, A.", "Shakeri, M."],
        "year": 2016,
        "venue": "K.N.Toosi University Publication (in Persian)"
    },
    {
        "id": 103,
        "type": "book",
        "title": "Decentralized Spatial Computing (Translation of Author Matt Duckham's work)",
        "authors": ["Sadeghi-Niaraki, A.", "Ghafuri, H."],
        "year": 2018,
        "venue": "K.N.Toosi University Publication"
    },
    {
        "id": 104,
        "type": "book",
        "title": "Simulation of Complex Systems in GIS (Translation of Author Patrice Langlois's work)",
        "authors": ["Sadeghi-Niaraki, A.", "Shakeri, M."],
        "year": 2019,
        "venue": "K.N.Toosi University Publication"
    },
    {
        "id": 105,
        "type": "book_chapter",
        "title": "Natural Hazard Susceptibility Mapping Using Ubiquitous Geospatial Artificial Intelligence (Ubiquitous GeoAI) Concept: A Case Study on Forest Fire Susceptibility Mapping",
        "authors": ["Ranjgar, B.", "Razavi-Termeh, S. V.", "Sadeghi-Niaraki, A.", "Choi, S. M."],
        "year": 2022,
        "venue": "In Current Overview on Science and Technology Research (pp. 100-119), B P International Publisher, UK",
        "category": "ISBN 978-93-5547-901-3"
    },
    {
        "id": 106,
        "type": "book_chapter",
        "title": "Soft Computing as Transdisciplinary Science and Technology",
        "authors": ["Sadeghi-Niaraki, A.", "Kim, K.", "Lee, Ch."],
        "year": 2008,
        "venue": "In R. Chbeir, Y. Badr, A. Abraham, D. Laurent & F. Ferri (Eds.), IEEE/ACM Press, Paris, France",
        "category": "ISBN 978-1-60558-046-3"
    },
    {
        "id": 107,
        "type": "referred",
        "title": "Evaluating accessibility to key land uses based on travel mode",
        "authors": ["Sadeghi-Niaraki, A.", "Rabipour, A.", "Ghodousi, M."],
        "year": 2023,
        "venue": "The Journal of Spatial Planning, 26(4), 113-138"
    },
    {
        "id": 108,
        "type": "referred",
        "title": "Site Selection of the Public Libraries of Bojnourd City in Iran Using FAHP",
        "authors": ["Ghodosi, M.", "Sadeghi-Niaraki, A."],
        "year": 2019,
        "venue": "Research on Information Science and Public Libraries, Vol. 25, No.2, pp. 257-290 (ISC)"
    },
    {
        "id": 109,
        "type": "referred",
        "title": "Comparison of Different Targets Used in Augmented Reality Applications in Ubiquitous GIS",
        "authors": ["Karimi Mina", "Sadeghi-Niaraki, A.", "Hosseini-Naveh A."],
        "year": 2019,
        "venue": "Engineering Journal of Geospatial Information Technology, Vol. 7, No.2, pp. 43-62 (ISC)"
    },
    {
        "id": 110,
        "type": "referred",
        "title": "Relief routing after an earthquake (case study: part of the district of Tehran city)",
        "authors": ["AliAsl-Khiabani E.", "Sadeghi-Niaraki, A.", "Ghodosi, M."],
        "year": 2018,
        "venue": "Journal of Rescue & Relief, Vol. 9, No.4, pp.1-17 (ISC)"
    },
    {
        "id": 111,
        "type": "referred",
        "title": "Improving Geo-labeling in Ubiquitous Environment Based on Augmented Reality",
        "authors": ["Jamali, B.", "Sadeghi-Niaraki, A."],
        "year": 2016,
        "venue": "Journal of Geomatics Science and Technology, Per.5(3), 99-110"
    },
    {
        "id": 112,
        "type": "referred",
        "title": "Multi-Objective Optimization Based Collision Avoidance Algorithm for an Intelligence Marine Navigation",
        "authors": ["Faroqi, H.", "Sadeghi-Niaraki, A."],
        "year": 2015,
        "venue": "Journal of Applied Sciences, 15(6), 911",
        "doi": "10.3923/jas.2015."
    },
    {
        "id": 113,
        "type": "referred",
        "title": "Ubi-Asthma: Design and Implementation of Asthmatic Patient Monitoring System in Ubiquitous Geospatial Information System",
        "authors": ["Keshtgar, E.", "Sadeghi-Niaraki, A."],
        "year": 2015,
        "venue": "Journal of Geomatics Science and Technology, Per.5(2), 55-66 (Persian)"
    },
    {
        "id": 114,
        "type": "referred",
        "title": "Route Selection Using Group Decision Making Techniques and Spatial Analysis in Early Stage Design",
        "authors": ["Shakeri, M.", "Sadeghi-Niaraki, A.", "Alimohammadi, A.", "Alesheikh, A. A."],
        "year": 2015,
        "venue": "Journal of Geomatics Science and Technology, Per.4(4), 285-396 (Persian)"
    },
    {
        "id": 115,
        "type": "referred",
        "title": "Overview of Microsoft Kinect applications in Ubiquitous GIS",
        "authors": ["Abolhoseini, S.", "Sadeghi-Niaraki, A.", "Abbasi, O."],
        "year": 2015,
        "venue": "The 3rd International Conference on Sensors and Models in Photogrammetry and Remote Sensing"
    },
    {
        "id": 116,
        "type": "referred",
        "title": "Proposing a Multi-Criteria Path Optimization Method in Order to Provide a Ubiquitous Pedestrian Wayfinding Service",
        "authors": ["Sahelgozin, M.", "Sadeghi-Niaraki, A.", "Dareshiri, S."],
        "year": 2015,
        "venue": "The International Archives of Photogrammetry, Remote Sensing and Spatial Information Sciences, 40(1), 639"
    },
    {
        "id": 117,
        "type": "referred",
        "title": "Developing GIS-based Demand-Responsive Transit system in Tehran city",
        "authors": ["Faroqi, H.", "Sadeghi-Niaraki, A."],
        "year": 2015,
        "venue": "The International Archives of Photogrammetry, Remote Sensing and Spatial Information Sciences, 40(1), 189"
    },
    {
        "id": 118,
        "type": "referred",
        "title": "A Survey of Smart Electrical Boards in Ubiquitous Sensor Networks for Geomatics Applications",
        "authors": ["Moosavi, S. M. R.", "Sadeghi-Niaraki, A."],
        "year": 2015,
        "venue": "The International Archives of Photogrammetry, Remote Sensing and Spatial Information Sciences, 40(1), 503"
    },
    {
        "id": 119,
        "type": "referred",
        "title": "Spatial Data Integration using Ontology-Based Approach",
        "authors": ["Hasani, S.", "Sadeghi-Niaraki, A.", "Jelokhani-Niaraki, M."],
        "year": 2015,
        "venue": "The International Archives of Photogrammetry, Remote Sensing and Spatial Information Sciences, 40(1), 293"
    },
    {
        "id": 120,
        "type": "referred",
        "title": "Ubiquitous Indoor Geolocation: a Case Study of Jewellery Management System",
        "authors": ["Nikparvar, B.", "Sadeghi-Niaraki, A.", "Azari, P."],
        "year": 2014,
        "venue": "The International Archives of Photogrammetry, Remote Sensing and Spatial Information Sciences, 40(2), 215"
    },
    {
        "id": 121,
        "type": "referred",
        "title": "GIS-Based Air Pollution Monitoring using Static Stations and Mobile Sensor in Tehran/Iran",
        "authors": ["Hamraz, H.", "Sadeghi-Niaraki, A.", "Omati, M.", "Noori, N."],
        "year": 2014,
        "venue": "International Journal of Scientific Research in Environmental Sciences, 2(12), 435"
    },
    {
        "id": 122,
        "type": "referred",
        "title": "GIS Based System for Post-Earthquake Crisis Management Using Cellular Network",
        "authors": ["Raeesi, M.", "Sadeghi-Niaraki, A."],
        "year": 2013,
        "venue": "ISPRS-International Archives of the Photogrammetry, Remote Sensing and Spatial Information Sciences, 1(3), 321-325"
    },
    {
        "id": 123,
        "type": "referred",
        "title": "Use of Ubiquitous Technologies in Logistic System in Iran",
        "authors": ["Jafari, P.", "Sadeghi-Niaraki, A."],
        "year": 2013,
        "venue": "ISPRS-International Archives of the Photogrammetry, Remote Sensing and Spatial Information Sciences, 1(3), 215-220"
    },
    {
        "id": 124,
        "type": "referred",
        "title": "Designing and using Multi-Objective Route Planning Algorithm in Intelligent Transportation System",
        "authors": ["Masoomi, Z.", "Sadeghi-Niaraki, A.", "Mesgari, M.S."],
        "year": 2011,
        "venue": "Journal of Transportation Research, 8(1), 47–62"
    },
    {
        "id": 125,
        "type": "referred",
        "title": "Designing Road Maintenance data Model Using Dynamic Segmentation Technique",
        "authors": ["Jelokhani-Niaraki, M.R.", "Alesheikh, A. A.", "Alimohammadi, A.", "Sadeghi-Niaraki, A."],
        "year": 2009,
        "venue": "Springer-Verlag Lecture Notes in Computer Science (LNCS), Volume 5592/2009, 442-452",
        "doi": "10.1007/978-3-642-02454-2_31"
    },
    {
        "id": 126,
        "type": "referred",
        "title": "Design and Development of Impedance Function for Optimum Path Finding using Multi Criteria Decision Making Technique",
        "authors": ["Sadeghi-Niaraki, A.", "Kim, K.", "Varshosaz, M."],
        "year": 2008,
        "venue": "Journal of National Cartography Center, Vol. 18, No. 91, pp. 10-18 (Persian)"
    },
    {
        "id": 127,
        "type": "conference",
        "title": "Avatar Emotion Recognition using Non-verbal Communication",
        "authors": ["Bazargani, J. S.", "Sadeghi-Niaraki, A.", "Choi, S. M."],
        "year": 2023,
        "venue": "Pacific Graphics (2023)"
    },
    {
        "id": 128,
        "type": "conference",
        "title": "Emot Act AR: Tailoring Content through User Emotion and Activity Analysis",
        "authors": ["Rokhsaritalemi, S.", "Sadeghi-Niaraki, A.", "Soo-Mi Choi*"],
        "year": 2024,
        "venue": "IEEE VR 2024 Posters, Orlando, FL, USA, 2024.3.16-21"
    },
    {
        "id": 129,
        "type": "conference",
        "title": "Avatar Emotion Recognition using Non-verbal Communication",
        "authors": ["Bazargani, J.S.", "Sadeghi-Niaraki, A.", "Soo-Mi Choi*"],
        "year": 2023,
        "venue": "Pacific Graphics 2023 Posters, Daejon, Korea, 2023.10.10-13"
    },
    {
        "id": 130,
        "type": "conference",
        "title": "Geospatial Augmented Reality Tourist System",
        "authors": ["Rokhsaritalemi, S.", "Ko, B. S.", "Sadeghi-Niaraki, A.", "Choi, S. M."],
        "year": 2023,
        "venue": "2023 IEEE Conference on Virtual Reality and 3D User Interfaces Abstracts and Workshops (VRW), IEEE VR 2023 (pp. 611-612)"
    },
    {
        "id": 131,
        "type": "conference",
        "title": "Drone trajectory planning based on geographic information system for 3D urban modeling",
        "authors": ["Rokhsaritalemi, S.", "Sadeghi-Niaraki, A.", "Choi, S. M."],
        "year": 2018,
        "venue": "2018 International Conference on Information and Communication Technology Convergence (ICTC) (pp. 1080-1083), IEEE"
    },
    {
        "id": 132,
        "type": "conference",
        "title": "A GIS-based framework of a robotic path planning for smart cities applications",
        "authors": ["Rokhsaritalemi, S.", "Sadeghi-Niaraki, A.", "Choi, S. M."],
        "year": 2018,
        "venue": "International Conference on Information Society and Smart Cities (ISC 2018)"
    },
    {
        "id": 133,
        "type": "conference",
        "title": "DSTU: A Deep Learning approach for Smart Traffic Updating System in GIS",
        "authors": ["Bashar, M.R.", "Sadeghi-Niaraki, A.", "Choi, S. M.", "M. U. Ahmed"],
        "year": 2017,
        "venue": "1st International Conference on Machine Learning and Data Engineering (iCMLDE), 2nd GCSTMR CONGRESS"
    },
    {
        "id": 134,
        "type": "conference",
        "title": "UGNS: A ubiquitous GIS-based navigation system using augmented reality technology and map matching algorithm",
        "authors": ["Shakeri, M.", "Sadeghi-Niaraki, A."],
        "year": 2017,
        "venue": "The ISPRS International Joint Conference 2017"
    },
    {
        "id": 135,
        "type": "conference",
        "title": "Rescue recommender ubiquitous GIS system for disaster management",
        "authors": ["Rokhsaritalemi, S.", "Sadeghi-Niaraki, A.", "Shakeri, M."],
        "year": 2017,
        "venue": "The ISPRS International Joint Conference 2017"
    },
    {
        "id": 136,
        "type": "conference",
        "title": "Ubiquitous City",
        "authors": ["Sadeghi-Niaraki, A.", "K. Kim", "J. Seo"],
        "year": 2011,
        "venue": "United Nations Regional Workshop on the Use of Space Technology for Human Health Improvement, 23-26 Oct., Tehran, Iran"
    },
    {
        "id": 137,
        "type": "conference",
        "title": "Ontology Based SDI to Facilitate Spatially Enabled Society",
        "authors": ["Sadeghi-Niaraki, A.", "A. Rajabifard", "K. Kim", "J. Seo"],
        "year": 2010,
        "venue": "GSDI-12 Conference Proceedings, 19-12 October, Singapore"
    },
    {
        "id": 138,
        "type": "conference",
        "title": "Realizing Spatially Enabled Society using Ubiquitous-City",
        "authors": ["Sadeghi-Niaraki, A.", "K. Kim", "M. Shabani", "H. Song"],
        "year": 2010,
        "venue": "RFID/USN Incheon International Conference, Songdo Convensia, Incheon, Korea"
    },
    {
        "id": 139,
        "type": "conference",
        "title": "AHP - PROMETHEE Based Model for Decision Making in Road Construction Projects",
        "authors": ["Rezaee-Arjroody, A.", "A. Sadeghi-Niaraki", "K. Kim", "Ch. Lee"],
        "year": 2010,
        "venue": "Proceedings of 17th ITS World Congress, Busan, Korea"
    },
    {
        "id": 140,
        "type": "conference",
        "title": "Ontology Driven Road Network Analysis based on Analytical Network Process Technique",
        "authors": ["Sadeghi-Niaraki, A.", "K. Kim", "Ch. Lee"],
        "year": 2008,
        "venue": "IEEE CSTST2008, IEEE International Conference on Soft Computing as Transdisciplinary Science and Technology, Paris, France, pp. 613-619"
    },
    {
        "id": 141,
        "type": "conference",
        "title": "GIS-based Web-Service Architecture",
        "authors": ["Sadeghi-Niaraki, A.", "K. Kim", "Ch. Lee"],
        "year": 2008,
        "venue": "National Spatial Data Infrastructure Conference 2008, Seoul, South Korea, pp. 113-118"
    },
    {
        "id": 142,
        "type": "conference",
        "title": "GIS based Non-Point Source Pollution Assessment",
        "authors": ["Sadeghi-Niaraki, A.", "K. Kim"],
        "year": 2008,
        "venue": "International Symposium on Remote Sensing 2008 (ISRS 2008), Daejeon, South Korea"
    },
    {
        "id": 143,
        "type": "conference",
        "title": "Development of geospatially based personalized route finding architecture",
        "authors": ["Sadeghi-Niaraki, A.", "K. Kim"],
        "year": 2008,
        "venue": "MapAsia2008 Conference, Kuala Lumpur, Malaysia"
    },
    {
        "id": 144,
        "type": "conference",
        "title": "A Ontology ANP based Multi-Criteria Decision Making Approach",
        "authors": ["Sadeghi-Niaraki, A.", "K. Kim"],
        "year": 2008,
        "venue": "The 2008 International Conference on Information and Knowledge Engineering (IKE'08), WORLDCOMP'08, Las Vegas, USA (Acceptance rate= 28%)"
    },
    {
        "id": 145,
        "type": "conference",
        "title": "Driving Toward Ontology Web Services Driven Application",
        "authors": ["Sadeghi-Niaraki, A.", "K. Kim"],
        "year": 2008,
        "venue": "The 2008 International Conference on Semantic Web and Web Services (SWWS'08), WORLDCOMP'08, Las Vegas, USA (Acceptance rate= 27%)"
    },
    {
        "id": 146,
        "type": "conference",
        "title": "The Developing GIS Web Services for Locating Facilities",
        "authors": ["Sadeghi-Niaraki, A.", "K. Kim"],
        "year": 2007,
        "venue": "InterGeo East 2007 Conference, 28 February-2 March, Bulgaria, Sofia"
    },
    {
        "id": 147,
        "type": "conference",
        "title": "A Study Based on Moving from Spatial Data Infrastructure (SDI) toward Spatial Service Infrastructure (SSI)",
        "authors": ["Sadeghi-Niaraki, A."],
        "year": 2006,
        "venue": "GSDI-9 Conference Proceedings, 6-10 November, Santiago, Chile"
    },
    {
        "id": 148,
        "type": "conference",
        "title": "Design and implementation of a prototype based on GIS web services",
        "authors": ["Sadeghi-Niaraki, A.", "K. Kim", "Sangbong Yoo", "Tao Song"],
        "year": 2006,
        "venue": "International conference of SMF/UPIMap2006, Seoul, South Korea"
    },
    {
        "id": 149,
        "type": "conference",
        "title": "Implementation of the resulting Cost Model of Roads Network in the Geographic Information System (GIS)",
        "authors": ["Sadeghi-Niaraki, A.", "M. Varshosaz", "H. Behrooz"],
        "year": 2004,
        "venue": "Proceedings of ISPRS 2004 Conference, Istanbul, Turkey"
    },
    {
        "id": 150,
        "type": "conference",
        "title": "Offline Passenger Fleet Control in Iran interurban Road Network",
        "authors": ["Torfehnejad, H.", "A. Sadeghi-Niaraki", "H. Behrooz"],
        "year": 2004,
        "venue": "Proceedings of 8th International Conference on Application of Advanced Technologies in Transportation Engineering (AATT2004), Beijing, China"
    },
    {
        "id": 151,
        "type": "conference",
        "title": "Defining the Cost Model for optimum path analysis in Iran Roads Transit Network with GIS software and EMME/2 transportation software",
        "authors": ["Sadeghi-Niaraki, A.", "J. Jamili"],
        "year": 2004,
        "venue": "Proceedings of 8th International Conference on Application of Advanced Technologies in Transportation Engineering (AATT2004), China"
    },
    {
        "id": 152,
        "type": "conference",
        "title": "The Advantages and Challenges of Ubiquitous Healthcare in South Korea",
        "authors": ["Sadeghi-Niaraki, A."],
        "year": 2011,
        "venue": "The 5th International Congress on Pulmonary Disease, Intensive Care and Tuberculosis, European Respiratory Society (ERS) and National Research Institute of Tuberculosis and Lung Disease (NRITLD), Tehran, Iran"
    },
    {
        "id": 153,
        "type": "conference",
        "title": "Grid Based Nonpoint Source Pollution Load Modelling",
        "authors": ["Sadeghi-Niaraki, A.", "Jae-Min Park", "K. Kim", "Ch. Lee"],
        "year": 2007,
        "venue": "2007 GISKorea Conference, 15 June, Seoul, Korea, pp. 246-251"
    },
    {
        "id": 154,
        "type": "conference",
        "title": "The developing emergency route finding model in the road network",
        "authors": ["Sadeghi-Niaraki, A.", "K. Kim"],
        "year": 2006,
        "venue": "Conference of ubiquitous disaster, GIS 2006, Korean Spatial Information System Society, Seoul, South Korea"
    },
    {
        "id": 155,
        "type": "conference",
        "title": "Defining the Cost Model of Iran Roads Network in GIS",
        "authors": ["Varshosaz, M.", "A. Sadeghi-Niaraki"],
        "year": 2003,
        "venue": "Proceedings of MapAsia 2003 Conference, Kuala Lumpur, Malaysia, Oct. 13-15"
    },
    {
        "id": 156,
        "type": "conference",
        "title": "Determination of a cost model for optimum Path route in Iran Roads network",
        "authors": ["Sadeghi-Niaraki, A.", "M. Varshosaz"],
        "year": 2003,
        "venue": "Proceedings of Geoinformatics 2003 Conference, Toronto, Canada, Jun 25-27"
    },
    {
        "id": 157,
        "type": "conference",
        "title": "Obtaining the Cost Model of Iran Roads Network in GIS",
        "authors": ["Varshosaz, M.", "A. Sadeghi-Niaraki"],
        "year": 2003,
        "venue": "Proceedings of Geomatics 82 Conference, Tehran, Iran, May 11-15"
    }
];

export default publicationsData;
