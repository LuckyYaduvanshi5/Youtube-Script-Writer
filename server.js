import express from "express";
// Remove direct Azure SDK imports, they are now in generate_youtube_script.js
// import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
// import { AzureKeyCredential } from "@azure/core-auth";

// Import the generateScript function from your updated file
import { generateScript } from './generate_youtube_script.js';

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.static('.')); // Serve static files like index.html, css, js from the root

// Define the correct endpoint that the frontend calls
app.post("/api/generate", async (req, res) => {
  // Get only the topic from the request body
  const { topic } = req.body;
  
  // Check if topic exists
  if (!topic) {
    // Send a 400 Bad Request status code for missing data
    return res.status(400).json({ error: "Missing script topic." });
  }

  // Check if the environment variable is set (important security check)
  if (!process.env.GITHUB_TOKEN) {
      console.error("FATAL ERROR: GITHUB_TOKEN environment variable is not set.");
      // Send a 500 Internal Server Error status code
      return res.status(500).json({ error: "Server configuration error: API token is missing." });
  }

  try {
    // Call the imported generateScript function, passing only the topic
    // The function will handle the token internally using process.env.GITHUB_TOKEN
    const script = await generateScript(topic);
    
    // Send the generated script back on success
    res.json({ script: script });

  } catch (err) {
    // Log the detailed error on the server for debugging
    console.error("Error during script generation:", err);
    
    // Send a generic error message to the client
    // Use a 500 Internal Server Error status code
    res.status(500).json({ error: err.message || "Failed to generate script due to an internal server error." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  // Add a reminder about the token
  if (!process.env.GITHUB_TOKEN) {
      console.warn("WARNING: GITHUB_TOKEN environment variable is not set. API calls will fail.");
  }
});