const Experience = require('../models/Experience');

// ─── Intent helpers (shared by the live-AI safety net and the offline mock) ──

const STOP_WORDS = new Set([
  'for', 'the', 'and', 'near', 'from', 'with', 'this', 'that', 'are',
  'find', 'show', 'me', 'some', 'any', 'a', 'an', 'in', 'on', 'at',
  'to', 'of', 'its', 'my', 'plan', 'get', 'what', 'how', 'where',
  'when', 'which', 'travel', 'want', 'looking', 'trips', 'under',
  'above', 'below', 'pick', 'picks', 'rated', 'rating', 'is',
]);

const OFFTOPIC_PATTERNS = [
  /\b(write|generate)\s+(a\s+|an\s+)?(poem|code|essay|story|song|joke)\b/i,
  /\b(solve|calculate|derivative|integral|equation)\b/i,
  /\b(who is|what is the capital of|president|prime minister)\b/i,
  /\b(stock price|cryptocurrency|bitcoin|share market)\b/i,
  /\b(javascript|python|react native|sql|programming|debug)\b/i,
];

const TRAVEL_HINT_WORDS = [
  'trek', 'hike', 'hiking', 'camp', 'camping', 'adventure', 'trip', 'travel',
  'tour', 'destination', 'weather', 'monsoon', 'season', 'visit', 'beach',
  'mountain', 'jungle', 'safari', 'raft', 'rafting', 'kayak', 'dive',
  'diving', 'climb', 'climbing', 'paraglid', 'ski', 'cycle', 'cycling',
  'itinerary', 'budget', 'weekend', 'holiday', 'vacation', 'explore',
  'wildlife', 'nature', 'outdoor', 'book', 'guide', 'experience',
];

const OFFTOPIC_REPLY = "I'm Wildvora AI, your travel and adventure companion — I can only help with trips, treks, and outdoor experiences. Ask me about a destination, itinerary, or adventure and I'll be happy to help!";

// Heuristic-only check used by the offline mock fallback (the live model does
// its own, more accurate, classification per the system prompt).
function looksTravelRelated(query) {
  const q = (query || '').toLowerCase();
  if (OFFTOPIC_PATTERNS.some(p => p.test(q))) return false;
  if (TRAVEL_HINT_WORDS.some(w => q.includes(w))) return true;
  // This is a travel app — ambiguous short queries (place names, etc.) default to travel-related.
  return true;
}

function extractIntent(query) {
  const q = (query || '').toLowerCase().trim();
  const budgetMatch = q.match(/(?:under|below|within|upto?|less\s+than)\s*[₹₨rs.]?\s*([\d,]+)/i);
  const maxBudget = budgetMatch ? parseInt(budgetMatch[1].replace(/,/g, ''), 10) : null;
  const wantsTopRated = /\b(top|best|highest?[\s-]?rated?|popular)\b/i.test(q);
  const keywords = q
    .replace(/[₹₨,.\-!?'"]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  return { maxBudget, wantsTopRated, keywords };
}

function reasonFor(exp, intent) {
  const reasons = [];
  if (intent.maxBudget && (exp.price || 0) <= intent.maxBudget) {
    reasons.push(`Fits your ₹${intent.maxBudget.toLocaleString('en-IN')} budget`);
  }
  if (intent.wantsTopRated && parseFloat(exp.rating || 0) >= 4) {
    reasons.push(`Highly rated at ${parseFloat(exp.rating).toFixed(1)}★`);
  }
  if (exp.difficulty) reasons.push(`${exp.difficulty} difficulty`);
  if (exp.location?.city) reasons.push(`Located in ${exp.location.city}`);
  return reasons.slice(0, 2).join(' · ') || 'Popular pick on Wildvora';
}

// Keyword/budget/rating matcher used as a safety net so a travel question
// never dead-ends with zero recommendations when live listings exist.
function matchExperiences(experiences, query, max = 4) {
  const intent = extractIntent(query);

  const scored = experiences
    .map(exp => {
      const haystack = [
        exp.title, exp.location?.city, exp.location?.state,
        exp.location?.country, exp.description, exp.category, exp.difficulty,
      ].filter(Boolean).join(' ').toLowerCase();

      let score = intent.keywords.filter(k => haystack.includes(k)).length;
      if (intent.maxBudget && (exp.price || 0) <= intent.maxBudget) score += 1;
      if (intent.wantsTopRated && parseFloat(exp.rating || 0) >= 4) score += 1;
      return { exp, score };
    })
    .filter(({ exp }) => !intent.maxBudget || (exp.price || 0) <= intent.maxBudget)
    .sort((a, b) => b.score - a.score || parseFloat(b.exp.rating || 0) - parseFloat(a.exp.rating || 0));

  const withScore = scored.filter(s => s.score > 0);
  const pool = withScore.length > 0 ? withScore : scored; // fall back to closest/top-rated overall
  const usedFallback = withScore.length === 0;

  return {
    usedFallback,
    matches: pool.slice(0, max).map(({ exp }) => ({
      id: exp._id.toString(),
      reason: usedFallback
        ? `Similar pick you might enjoy · ${reasonFor(exp, intent)}`
        : reasonFor(exp, intent),
    })),
  };
}

// Helper to generate a mock conversational reply when the Groq API key is missing/failing
const generateMockReply = (messages, experiences) => {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';

  if (!looksTravelRelated(lastUserMsg)) {
    return { text: OFFTOPIC_REPLY, isTravelRelated: false, recommendations: [] };
  }

  if (/^\s*(hi|hello|hey)\b/i.test(lastUserMsg)) {
    return {
      text: "Hello! I'm your Wildvora AI travel planner. Tell me where you want to go, your budget, or the kind of adventure you're after — treks, camping, water sports, wildlife safaris — and I'll find the best matches for you.",
      isTravelRelated: true,
      recommendations: [],
    };
  }

  const { matches, usedFallback } = matchExperiences(experiences, lastUserMsg);

  let text;
  if (matches.length === 0) {
    text = `I don't have specifics on "${lastUserMsg}" in my live catalogue yet, but I'd be glad to help you plan around it — let me know your budget, preferred dates, or the type of adventure and I'll find the closest match on Wildvora.`;
  } else if (usedFallback) {
    text = `I don't have an exact match for "${lastUserMsg}" in our current catalogue, but here are similar adventures you might enjoy instead:`;
  } else {
    text = `Here's what I found for "${lastUserMsg}" on Wildvora:`;
  }

  return { text, isTravelRelated: true, recommendations: matches };
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
      location: `${exp.location.city}, ${exp.location.state || ''} ${exp.location.country}`.replace(/\s+/g, ' ').trim(),
      price: exp.price,
      duration: exp.duration,
      difficulty: exp.difficulty,
      rating: exp.rating,
      description: (exp.description || '').slice(0, 160),
    }));

    // 4. Format messages for Groq Chat API
    const systemInstruction = {
      role: 'system',
      content: `You are Wildvora AI, the friendly travel and adventure assistant for Wildvora — an outdoor adventure booking platform in India.

Step 1 — Decide if the user's latest message is travel/adventure/outdoor-trip related (destinations, weather or best season to visit, itineraries, activities, gear, budget, safety, bookings, etc). Greetings count as travel-related since you are a travel assistant. Coding, math, trivia, current events, or anything unrelated to travel does NOT count.

Step 2a — If NOT travel related: politely explain that Wildvora AI only helps with travel and adventure topics, and invite them to ask a travel question instead. Set "isTravelRelated" to false and "recommendations" to an empty array.

Step 2b — If travel related: first actually answer their question conversationally using your general travel knowledge (e.g. weather/best time to visit, what to pack, itinerary ideas, safety tips) — answer this BEFORE mentioning any listings. Then, from the catalogue below, recommend up to 4 live experiences that best fit. For EACH recommendation write a short, concrete, one-sentence reason citing what actually matched — budget, season/weather fit, difficulty, location, or rating. If nothing in the catalogue is a close match, still suggest the closest alternatives (same region, similar activity, or just well-rated picks) and say so honestly in the reason (e.g. "Closest match — we don't have listings in that exact city yet"). Only return an empty "recommendations" array if the catalogue truly has nothing relevant to suggest, or the user's question has no booking intent at all.

Live experiences catalogue:
${JSON.stringify(contextListings, null, 2)}

Respond ONLY with strict, valid JSON, no markdown, no code fences, in exactly this schema:
{
  "text": "Plain text conversational reply. No markdown formatting (no **bold**, no # headings, no - bullets — use the • character for lists).",
  "isTravelRelated": true or false,
  "recommendations": [ { "id": "exact id string copied from the catalogue", "reason": "short concrete one-sentence reason" } ]
}`
    };

    // Prepare message history, removing any client-side extra fields and keeping role/content.
    // Capped to the last 8 turns so context stays relevant without bloating the prompt.
    const apiMessages = [
      systemInstruction,
      ...messages.slice(-8).map(m => ({
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
          model: 'llama-3.1-8b-instant',
          messages: apiMessages,
          temperature: 0.6,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      const parsed = JSON.parse(content);

      // Drop any hallucinated ids that don't exist in the live catalogue.
      const validIds = new Set(contextListings.map(c => c.id));
      let recommendations = Array.isArray(parsed.recommendations)
        ? parsed.recommendations.filter(r => r && typeof r.id === 'string' && validIds.has(r.id)).slice(0, 4)
        : [];

      const isTravelRelated = parsed.isTravelRelated !== false;

      if (!isTravelRelated) {
        // Don't trust the model to actually decline off-topic requests in its
        // own words — enforce the redirect deterministically so Wildvora AI
        // never answers something unrelated to travel.
        recommendations = [];
      } else if (recommendations.length === 0 && experiences.length > 0) {
        // Safety net: never dead-end a travel-related question when live
        // listings exist, even if the model forgot to suggest anything.
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
        recommendations = matchExperiences(experiences, lastUserMsg, 3).matches;
      }

      const hasText = typeof parsed.text === 'string' && parsed.text.trim().length > 0;
      const text = !isTravelRelated
        ? OFFTOPIC_REPLY
        : hasText
          ? parsed.text
          : "Happy to help plan your next adventure — could you tell me a bit more about what you're looking for?";

      res.json({
        success: true,
        tripPlan: { text, isTravelRelated, recommendations },
      });

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
        (!adventureLevel || adventureLevel === 'All' || (e.difficulty || '').toLowerCase() === adventureLevel.toLowerCase())
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
4. Do NOT output any text other than the raw JSON object. No markdown wrappers (like \`\`\`json). Just the clean JSON string.
5. CRITICAL: In the "explanation" field, do NOT use any markdown formatting. Plain text only, no **bold** or *italic*.`;

    const userPrompt = `Please recommend a trip with the following preferences:
- Budget: ₹${budget}
- Group Size: ${groupSize}
- Duration: ${duration}
- Adventure Level: ${adventureLevel}`;

    // 5. Invoke Groq API with fallback on failure
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
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
      return res.json({ success: true, tripPlan });

    } catch (apiErr) {
      console.warn('Groq API call failed for guided planner, using DB fallback:', apiErr.message);
      const fallbackExps = experiences.filter(e =>
        e.price <= (budget || 100000) &&
        (!adventureLevel || adventureLevel === 'All' || (e.difficulty || '').toLowerCase() === adventureLevel.toLowerCase())
      );
      const chosen = fallbackExps[0] || experiences[0];
      const tripPlan = {
        recommendedTrip: chosen ? chosen.title : 'Custom Adventure',
        cost: `₹${chosen ? chosen.price : budget || 3000}/person`,
        distance: '150 km',
        difficulty: chosen ? chosen.difficulty : (adventureLevel || 'Moderate'),
        explanation: `Based on your budget of ₹${budget}, group of ${groupSize}, and ${duration} duration, here is our best-matched adventure from our catalogue.`,
        recommendedExperienceIds: chosen ? [chosen._id.toString()] : []
      };
      return res.json({ success: true, tripPlan, warning: `Fallback used: ${apiErr.message}` });
    }

  } catch (err) {
    console.error('AI Guided Trip Planner Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to generate guided trip plan' });
  }
};

module.exports = { generateTripPlan, generateGuidedTripPlan };
