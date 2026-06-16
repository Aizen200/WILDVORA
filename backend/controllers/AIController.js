const Experience = require('../models/Experience');

// Helper to generate a mock plan when OpenAI key is missing
const generateMockPlan = (category, duration, experiences) => {
  // Find matching experiences
  const matchingExps = experiences.filter(
    (e) => e.category.toLowerCase() === category.toLowerCase()
  );
  
  const recommendedExp = matchingExps[0] || experiences[0];
  const destName = recommendedExp ? `${recommendedExp.location.city}, ${recommendedExp.location.country}` : 'Cascades, USA';

  const daysCount = duration.includes('3') || duration.includes('2') ? 3 : duration.includes('7') ? 7 : 1;
  const days = [];

  for (let i = 1; i <= daysCount; i++) {
    days.push({
      dayNumber: i,
      title: `Day ${i}: Exploring ${destName}`,
      description: `Immerse yourself in the local ${category.toLowerCase()} activities and scenic views.`,
      activities: [
        { time: 'Morning', text: `Start the day with a guided outdoor exploration around ${destName}.` },
        { time: 'Afternoon', text: `Enjoy local cuisine and gear check for the afternoon ${category.toLowerCase()} session.` },
        { time: 'Evening', text: 'Relax at the campsite or lodge and share stories by the bonfire.' }
      ],
      recommendedExperienceId: recommendedExp ? recommendedExp._id : null
    });
  }

  return {
    title: `Custom ${category} Adventure in ${destName}`,
    description: `A personalized ${duration} plan optimized for outdoor enthusiasts seeking ${category.toLowerCase()} thrills.`,
    days,
    isMock: true
  };
};

const generateTripPlan = async (req, res) => {
  try {
    const { category = 'Trekking', duration = '3 days' } = req.body;

    // 1. Fetch available experiences from database
    const experiences = await Experience.find({ status: 'live' });

    // 2. Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.log('OpenAI API key missing. Generating fallback mock plan.');
      const mockPlan = generateMockPlan(category, duration, experiences);
      return res.json({ success: true, tripPlan: mockPlan, warning: 'Running in mock mode: OpenAI API key is not set in backend .env' });
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

    // 4. Invoke OpenAI Chat Completions API
    const systemPrompt = `You are an expert AI travel planner for Wildvora, an adventure booking platform.
Your task is to plan a custom itinerary based on the user's category preference: "${category}" and duration: "${duration}".
You MUST respond with a strict, valid JSON object following this exact schema:
{
  "title": "Name of the customized trip",
  "description": "Brief summary of the trip concept",
  "days": [
    {
      "dayNumber": 1,
      "title": "Theme for day 1",
      "description": "Brief description of the day's goals",
      "activities": [
        { "time": "Morning", "text": "Activity description" },
        { "time": "Afternoon", "text": "Activity description" },
        { "time": "Evening", "text": "Activity description" }
      ],
      "recommendedExperienceId": "ID of a matching experience from the list, or null if none match"
    }
  ]
}

Here are the real, available experiences currently in our database:
${JSON.stringify(contextListings, null, 2)}

Instructions:
1. Design a day-by-day itinerary matching the requested duration (${duration}).
2. Try to map activities on one or more days to the corresponding real experiences from our database listed above, and put its exact ID in the "recommendedExperienceId" field.
3. If no listed experience fits that day's theme, use null for "recommendedExperienceId".
4. Ensure the JSON is properly formatted and contains no extra text or markdown code blocks (like \`\`\`json). Just return the raw JSON string.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: systemPrompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    // Clean markdown code blocks if the model returned them
    if (content.startsWith('```')) {
      content = content.replace(/^```json\s*/, '').replace(/```$/, '');
    }

    const tripPlan = JSON.parse(content);
    res.json({ success: true, tripPlan });

  } catch (err) {
    console.error('AI Trip Planner Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to generate AI trip plan' });
  }
};

module.exports = { generateTripPlan };
