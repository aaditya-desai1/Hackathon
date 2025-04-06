import React from 'react';
import { Container, Typography, Grid, Card, CardContent, CardMedia, Box, Divider, Chip, Paper, Button } from '@mui/material';
import { GitHub, LinkedIn } from '@mui/icons-material';

const AboutUs = () => {
  const teamMembers = [
    {
      name: "Aaditya Desai",
      role: "Backend Developer",
      contributions: "APIs, file upload, JWT auth",
      image: "/images/team/aaditya-desai.jpg", // Replace with actual image path
      github: "https://github.com/aaditya-desai1",
      linkedin: "http://www.linkedin.com/in/aaditya-desai1",
      funFact: "Optimized the file upload system to handle files 10x larger than initially planned."
    },
    {
      name: "Jenis Savani",
      role: "Chart Analysis and Recommendation",
      contributions: "Chart recommendation engine",
      image: "/images/team/jenis-savani.jpg", // Replace with actual image path
      github: "https://github.com/JenisSavani25",
      linkedin: "http://www.linkedin.com/in/jenissavani25",
      funFact: "Trained the recommendation model on over 10,000 chart examples."
    },
    {
      name: "Nishidh Jasani",
      role: "Frontend Developer",
      contributions: "UI design, React components, dashboard",
      image: "/images/team/nishidh-jasani.jpg", // Replace with actual image path
      github: "https://github.com/NishidhJasani1605",
      linkedin: "http://www.linkedin.com/in/nishidh-jasani-n1605",
      funFact: "Built the entire dashboard UI in a 24-hour coding sprint!"
    },
    {
      name: "Yash Jariwala",
      role: "Database Engineer",
      contributions: "MongoDB schema, integration, bug fixing",
      image: "/images/team/yash-jariwala.jpg", // Replace with actual image path
      github: "https://github.com/neel3103",
      linkedin: "http://www.linkedin.com/in/yashjariwala1303",
      funFact: "Squashed 42 bugs in the final 48 hours before submission!"
    }
  ];

  const techStack = [
    { category: "Frontend", technologies: ["React.js", "Material UI"] },
    { category: "Backend", technologies: ["Node.js", "Express"] },
    { category: "Database", technologies: ["MongoDB", "Mongoose"] },
    { category: "AI", technologies: ["Custom recommendation logic"] },
    { category: "Charts", technologies: ["Chart.js"] }
  ];

  const features = [
    "CSV/JSON data upload and parsing",
    "AI-powered chart recommendation",
    "Interactive data visualization dashboard",
    "Custom chart configuration options",
    "Export and sharing capabilities",
    "Responsive design for all devices"
  ];

  const challenges = [
    "Developing an accurate chart recommendation algorithm based on data patterns",
    "Optimizing performance for large datasets",
    "Creating an intuitive UI that works for both beginners and data experts",
    "Implementing secure file handling and validation"
  ];

  const futureScope = [
    "Excel and Google Sheets integration",
    "Real-time collaboration features",
    "Cloud storage for datasets and visualizations",
    "Advanced analytics and statistical tools",
    "Custom visualization templates"
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      {/* Hero Section */}
      <Box textAlign="center" mb={8}>
        <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
          About DataViz Pro
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Transforming complex data into beautiful, insightful visualizations with AI
        </Typography>
      </Box>

      {/* Team Members */}
      <Box mb={8}>
        <Typography variant="h4" component="h2" gutterBottom>
          Meet the Team
        </Typography>
        <Grid container spacing={4}>
          {teamMembers.map((member, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card elevation={3} sx={{ height: '100%' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={member.image}
                  alt={member.name}
                  sx={{ 
                    objectFit: 'cover',
                    backgroundColor: '#f5f5f5' // Fallback background if image doesn't load
                  }}
                />
                <CardContent>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {member.name}
                  </Typography>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    {member.role}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {member.contributions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph fontStyle="italic">
                    "{member.funFact}"
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button 
                      variant="contained" 
                      startIcon={<GitHub />}
                      color="primary"
                      size="medium"
                      sx={{ 
                        flex: 1,
                        py: 1,
                        textTransform: 'none'
                      }}
                      onClick={() => window.open(member.github)}
                    >
                      GitHub
                    </Button>
                    <Button 
                      variant="contained" 
                      startIcon={<LinkedIn />}
                      color="info"
                      size="medium"
                      sx={{ 
                        flex: 1,
                        py: 1,
                        textTransform: 'none'
                      }}
                      onClick={() => window.open(member.linkedin)}
                    >
                      LinkedIn
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Project Summary */}
      <Paper elevation={3} sx={{ p: 4, mb: 6, borderRadius: 2 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Project Summary
        </Typography>
        <Typography variant="body1" paragraph>
          DataViz Pro solves the challenge of creating meaningful data visualizations without requiring 
          deep expertise in data science or visualization techniques. Our platform empowers users to 
          upload their data and receive AI-powered recommendations for the most effective charts and graphs 
          to represent their information.
        </Typography>
        <Typography variant="body1">
          Whether you're a business analyst preparing a presentation, a researcher visualizing findings, 
          or a student working on a project, DataViz Pro streamlines the process of transforming raw data 
          into compelling visual stories.
        </Typography>
      </Paper>

      {/* Features */}
      <Box mb={8}>
        <Typography variant="h4" component="h2" gutterBottom>
          Key Features
        </Typography>
        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card elevation={2} sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" component="h3">
                    {feature}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Tech Stack */}
      <Box mb={8}>
        <Typography variant="h4" component="h2" gutterBottom>
          Tech Stack
        </Typography>
        <Grid container spacing={3}>
          {techStack.map((tech, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card elevation={2} sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {tech.category}
                  </Typography>
                  <Box>
                    {tech.technologies.map((item, i) => (
                      <Chip 
                        key={i} 
                        label={item} 
                        sx={{ m: 0.5 }} 
                        color="primary" 
                        variant="outlined" 
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Innovation & Challenges */}
      <Box mb={8}>
        <Typography variant="h4" component="h2" gutterBottom>
          Innovation & Challenges
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" component="h3" gutterBottom>
                  Our Innovation
                </Typography>
                <Typography variant="body1" paragraph>
                  DataViz Pro's innovation lies in its AI-powered recommendation engine that analyzes 
                  data patterns, relationships, and structures to suggest the most effective visualization 
                  methods. Unlike traditional tools that require users to know which chart to use, 
                  our platform makes intelligent decisions based on the data itself.
                </Typography>
                <Typography variant="body1">
                  We've combined machine learning algorithms with visualization best practices to create 
                  a system that learns and improves with each use, making data visualization accessible 
                  to everyone regardless of their technical expertise.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" component="h3" gutterBottom>
                  Challenges We Overcame
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  {challenges.map((challenge, index) => (
                    <Typography component="li" variant="body1" key={index} paragraph>
                      {challenge}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Future Scope */}
      <Box mb={8}>
        <Typography variant="h4" component="h2" gutterBottom>
          Future Scope
        </Typography>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="body1" paragraph>
            We're just getting started with DataViz Pro. Here's what's on our roadmap:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            {futureScope.map((item, index) => (
              <Typography component="li" variant="body1" key={index} paragraph>
                {item}
              </Typography>
            ))}
          </Box>
        </Paper>
      </Box>

      {/* License & Credits */}
      <Box>
        <Typography variant="h4" component="h2" gutterBottom>
          License & Credits
        </Typography>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="body1" paragraph>
            DataViz Pro is released under the MIT License.
          </Typography>
          <Typography variant="body1">
            We would like to acknowledge the following open-source libraries and tools that made this project possible:
            React.js, Material UI, Chart.js, Node.js, Express, MongoDB, and many others.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default AboutUs; 