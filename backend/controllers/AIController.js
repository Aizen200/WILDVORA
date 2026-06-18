const Experience = require('../models/Experience');

// Helper to generate a mock conversational reply when Groq API key is missing
const generateMockReply = (messages, experiences) => {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  const inputLower = lastUserMsg.toLowerCase();

  let category = 'Trekking';
  if (inputLower.includes('camp')) category = 'Camping';
  else if (inputLower.includes('jungle') || inputLower.includes('rainforest')) category = 'Jungle';
  else if (inputLower.includes('water') || inputLower.includes('kayak') || inputLower.includes('raft')) category = 'Water Sports';

  // Find matching experiences
  const matchingExps = experiences.filter(
    (e) => e.category.toLowerCase() === category.toLowerCase()
  );
  
  const recommendedExpIds = matchingExps.map(e => e._id.toString());
  const destName = matchingExps[0] ? `${matchingExps[0].location.city}, ${matchingExps[0].location.country}` : 'Cascades, USA';

  let replyText = `I would love to help you plan your adventure! Based on your interest in **${category}**, I recommend visiting **${destName}**. 

Here is a recommended 3-day itinerary:
* **Day 1:** Arrive at basecamp, acclimatize to the environment, and check your gear.
* **Day 2:** Head out for a main guided ${category.toLowerCase()} expedition.
* **Day 3:** Wrap up with local food exploration and pack up.

I have found some active listings on Wildvora that match your interests perfectly! You can view and book them below:`;

  if (inputLower.includes('hi') || inputLower.includes('hello')) {
    replyText = `Hello! I am your Wildvora AI travel planner. I can help you find hikes, water sports, camping sites, and jungle tours. 

What kind of adventure are you looking for? (e.g., "I want a trekking trip" or "Do you have any camping sites?")`;
  }

  return {
    text: replyText,
    recommendedExperienceIds: recommendedExpIds.slice(0, 3)
  };
};

const generateTripPlan = async (req, res) => {
  try {
    const { messages = [] } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'Messages list is required and must be an array' });
    }

    // 1. Fetch available experiences from database
    const experiences = await Experience.find({ status: 'live' });

    // 2. Check for Groq API key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.log('Groq API key missing. Generating conversational fallback mock reply.');
      const mockReply = generateMockReply(messages, experiences);
      return res.json({ 
        success: true, 
        tripPlan: mockReply, 
        warning: 'Running in mock mode: GROQ_API_KEY is not set in backend .env' 
      });
    }

    // 3. Prepare experiences context for LLM
    const contextListings = experiences.map(exp => ({
      id: exp._id.toString(),
      title: exp.title,
      category: exp.category,
      location: `${exp.location.city}, ${exp.location.country}`,
      price: exp.price,
      duration: exp.duration
    }));

    // 4. Format messages for Groq Chat API
    const systemInstruction = {
      role: 'system',
      content: `You are an AI travel planning assistant on Wildvora, an outdoor travel and adventure booking platform.
Your task is to chat with the user and recommend itineraries, experiences, and travel tips.

You MUST respond ONLY with a strict, valid JSON object following this exact schema:
{
  "text": "Your conversational markdown message text replying to the user. Describe the plan or ask questions.",
  "recommendedExperienceIds": ["Array of experience IDs from the database list matching your recommendation, empty if none match"]
}

Here are the real, active experiences available in our database:
${JSON.stringify(contextListings, null, 2)}

Instructions:
1. Provide helpful travel advice and draft custom day-by-day itineraries.
2. In your response, if any of the available database experiences fit the user's inquiry, recommend them and include their exact database ID strings in the "recommendedExperienceIds" array.
3. If no experiences fit or you are just answering a general question, return an empty array [] for "recommendedExperienceIds".
4. Do NOT output any text other than the raw JSON object. No markdown wrappers (like \`\`\`json). Just the clean JSON string.`
    };

    // Prepare message history, removing any client-side extra fields and keeping role/content
    const apiMessages = [
      systemInstruction,
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.text || m.content || ''
      }))
    ];

    // 5. Invoke Groq Chat Completions
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: apiMessages,
          temperature: 0.7,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      let content = data.choices[0].message.content.trim();

      const tripPlan = JSON.parse(content);
      res.json({ success: true, tripPlan });

    } catch (apiErr) {
      console.warn('Groq API call failed, falling back to mock reply:', apiErr.message);
      const mockReply = generateMockReply(messages, experiences);
      res.json({
        success: true,
        tripPlan: mockReply,
        warning: `Fallback used due to API error: ${apiErr.message}`
      });
    }

  } catch (err) {
    console.error('AI Trip Planner Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to generate AI trip recommendation' });
  }
};

const generateGuidedTripPlan = async (req, res) => {
  try {
    const { budget, groupSize, duration, adventureLevel } = req.body;

    // 1. Fetch available experiences from database
    const experiences = await Experience.find({ status: 'live' });

    // 2. Check for Groq API key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn('Groq API key missing. Using database lookup fallback.');
      // Find a matching fallback experience from DB
      const fallbackExps = experiences.filter(e => 
        e.price <= (budget || 100000) &&
        (adventureLevel === 'All' || !adventureLevel || e.difficulty.toLowerCase() === adventureLevel.toLowerCase())
      );
      const chosen = fallbackExps[0] || experiences[0];
      const tripPlan = {
        recommendedTrip: chosen ? chosen.title : 'Camping + Rafting',
        cost: `₹${chosen ? chosen.price : 3200}/person`,
        distance: '230 km',
        difficulty: chosen ? chosen.difficulty : 'Easy',
        explanation: 'Based on your preferences, this is the best matching adventure from our catalogue.',
        recommendedExperienceIds: chosen ? [chosen._id.toString()] : []
      };
      return res.json({ success: true, tripPlan, warning: 'Running in fallback mode: GROQ_API_KEY is not set in backend .env' });
    }

    // 3. Prepare experiences context for Groq LLM
    const contextListings = experiences.map(exp => ({
      _id: exp._id.toString(),
      title: exp.title,
      category: exp.category,
      location: `${exp.location.city}, ${exp.location.country}`,
      price: exp.price,
      duration: exp.duration,
      difficulty: exp.difficulty
    }));

    // 4. Format messages for Groq Chat Completions
    const systemInstruction = `You are the AI Trip Planner for Wildvora, an outdoor adventure booking platform.
Based on the user's input parameters (Budget, Group Size, Duration, Adventure Level), you will recommend the best experience(s) from our active database listings.

You MUST select only from the following active approved experiences in our database:
${JSON.stringify(contextListings, null, 2)}

You MUST respond ONLY with a strict, valid JSON object following this exact schema:
{
  "recommendedTrip": "Title of the recommended trip (e.g. 'Camping + Rafting' or the name of the experience)",
  "cost": "₹[Price]/person (based on the price of the selected experiences from the database, or sum of them)",
  "distance": "[Estimated distance in km, e.g., '230 km' or '85 km']",
  "difficulty": "[Difficulty level of the trip, e.g., 'Easy', 'Moderate', 'Hard', 'Expert']",
  "explanation": "A short, engaging 1-2 sentence description explaining why this is the perfect recommendation based on their budget of ₹[budget], group size of [groupSize], duration of [duration], and adventure level of [adventureLevel].",
  "recommendedExperienceIds": ["Array of the _id string(s) of the chosen experience(s) from the list"]
}

Rules:
1. Ensure the chosen experiences actually exist in the provided database list.
2. The difficulty should align with the user's preferred adventure level (Easy, Moderate, Hard, Expert) and match the experience difficulty.
3. The cost should match the experience price in the database.
4. Do NOT output any text other than the raw JSON object. No markdown wrappers (like \`\`\`json). Just the clean JSON string.`;

    const userPrompt = `Please recommend a trip with the following preferences:
- Budget: ₹${budget}
- Group Size: ${groupSize}
- Duration: ${duration}
- Adventure Level: ${adventureLevel}`;

    // 5. Invoke Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    const tripPlan = JSON.parse(content);

    res.json({ success: true, tripPlan });
  } catch (err) {
    console.error('AI Guided Trip Planner Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to generate guided trip plan' });
  }
};

module.exports = { generateTripPlan, generateGuidedTripPlan };
