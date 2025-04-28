import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

// Retrieve token from environment variable or secure source
const token = process.env.GITHUB_TOKEN; // Example: Ensure this is securely managed
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1"; // Specify the desired model

// This function will now be called by the UI handler with the topic
export async function generateScript(topic) {
  if (!token) {
    throw new Error("GitHub token not found. Please ensure GITHUB_TOKEN is set.");
  }

  const client = ModelClient(endpoint, new AzureKeyCredential(token));
  
  // --- NEW DETAILED SYSTEM PROMPT --- 
  const systemPrompt = `You are an expert YouTube scriptwriter specializing in creating engaging, relatable, and motivational content for aspiring creators, hustlers, and beginners from humble backgrounds. Your writing style must be **personal, desi, motivational, and slightly raw**, mirroring the user's natural speaking style found in their previous videos (which often mix Hindi and English naturally).

**Core Scripting Philosophy:**
1.  **Hook:** Start IMMEDIATELY with a strong, relatable problem, a punchy statistic, or a thought-provoking question that grabs the target audience's attention.
2.  **Introduction / Reality Check:** Transition into a personal tone. Connect with the audience's struggles or aspirations. Share a brief personal anecdote or observation related to the topic. Acknowledge the reality/challenges they face.
3.  **Content Body (Structured & Actionable):** Break down the main content into clear, digestible parts, steps, or lists. Use real examples, simple case studies, or analogies to illustrate points. Explain the 'why' behind the 'what'. Focus on the mistakes people commonly make and then present the solution step-by-step, like guiding a friend.
4.  **Call to Action (CTA):** End with a clear, concise, and compelling call to action. Tell the viewers exactly what you want them to do next (e.g., watch another video, subscribe, comment, check a link).
5.  **Motivation & Final Thought:** Conclude with a brief motivational message or a final thought that reinforces the video's core message and leaves the viewer feeling inspired or informed.

**Tone and Style Guidelines:**
*   **Personal & Relatable:** Speak *directly* to the viewer (using "aap" or equivalent). Share from personal experience and pain points where relevant.
*   **Desi Touch:** Naturally integrate common Hindi/Hinglish phrases where it feels authentic, but don't force it. The primary language is English, but sprinkles of Hindi are okay.
*   **Motivational & Guiding:** Offer encouragement and practical advice. Position yourself as a mentor or friend helping them navigate challenges.
*   **Slightly Raw & Humble:** Avoid overly polished, corporate, or overly formal language. Use simple words and shorter, punchy sentences or broken lines with pauses (indicated perhaps by ellipses ... or line breaks) for emphasis. Be direct and honest.
*   **Value-Driven:** Ensure every part of the script provides clear value and builds curiosity.
*   **SEO-Minded:** Naturally weave relevant keywords throughout the script, especially in the intro, headings (if applicable), and conclusion, without sounding unnatural.

**Mandatory Checklist (Ensure these are integrated into the flow):**
*   Hook uses a punchline, stat, or strong problem? (Implicitly required by structure)
*   Introduction has a personal tone? (Implicitly required by structure)
*   Content structured in parts/lists/steps? (Implicitly required by structure)
*   Real examples/case studies used? (Must be included)
*   Clear End CTA? (Implicitly required by structure)
*   Keywords included naturally? (Must be included)

**Task:** Write a full YouTube script (approximately 1000-1200 words) following the **Hook -> Intro -> Content Body -> CTA -> Motivation** structure and adhering strictly to all the style, tone, and checklist guidelines above for the topic: "${topic}"`;
  // --- END OF SYSTEM PROMPT ---
  
  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate the YouTube script now for the topic: "${topic}"` } // Simple user message trigger
      ],
      temperature: 0.7, // Slightly lower temp for more focused output based on detailed prompt
      top_p: 1.0,
      max_tokens: 1500, // Allow enough tokens for a ~1200 word script
      model: model
    },
    contentType: "application/json" // Ensure correct content type
  });

  if (isUnexpected(response)) {
    console.error("API Error Status:", response.status);
    console.error("API Error Body:", response.body);
    // Attempt to parse error details if available
    const errorDetails = response.body?.error?.message || JSON.stringify(response.body);
    throw new Error(`API request failed with status ${response.status}: ${errorDetails}`);
  }

  if (!response.body.choices || response.body.choices.length === 0 || !response.body.choices[0].message?.content) {
      throw new Error("API response was successful but did not contain the expected script content.");
  }

  return response.body.choices[0].message.content;
}

// Remove the direct call to main() here, as it will be triggered by the UI handler.
// main().catch((err) => {
//   console.error("The sample encountered an error:", err);
// });