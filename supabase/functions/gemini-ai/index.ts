import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting store (in-memory for simplicity)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 12; // requests per minute (720 per hour, under Gemini's 15 RPM limit)
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// Request queue for managing API calls
const requestQueue = new Map<string, Array<{ resolve: Function; reject: Function; request: Function }>>();
const processingQueue = new Map<string, boolean>();

interface GeminiRequest {
  prompt: string;
  type:
    | "text-analysis"
    | "code-generation"
    | "technical-consulting"
    | "blueprint-analysis"
    | "3d-generation"
    | "architectural-modeling";
  context?: string;
  maxTokens?: number;
  imageData?: string; // Base64 encoded image for vision tasks
}

interface GeminiResponse {
  result: string;
  type: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (now > userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Exponential backoff retry logic
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error | undefined = undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Check if it's a rate limit error (429)
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRateLimitError =
        errorMessage.includes("429") ||
        errorMessage.toLowerCase().includes("rate limit") ||
        errorMessage.toLowerCase().includes("quota exceeded");

      // If not a rate limit error or final attempt, throw immediately
      if (!isRateLimitError || attempt === maxRetries) {
        throw error;
      }

      // Wait with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Max retries reached");
}

// Request queuing to manage API calls
async function queueRequest<T>(userId: string, operation: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!requestQueue.has(userId)) {
      requestQueue.set(userId, []);
    }

    requestQueue.get(userId)!.push({
      resolve,
      reject,
      request: operation,
    });

    processQueue(userId);
  });
}

async function processQueue(userId: string) {
  if (processingQueue.get(userId)) {
    return; // Already processing
  }

  processingQueue.set(userId, true);

  const queue = requestQueue.get(userId);
  if (!queue || queue.length === 0) {
    processingQueue.set(userId, false);
    return;
  }

  const { resolve, reject, request } = queue.shift()!;

  try {
    const result = await retryWithBackoff(() => request());
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    // Small delay between requests to avoid hitting rate limits
    await new Promise((resolve) => setTimeout(resolve, 100));
    processingQueue.set(userId, false);

    // Process next item in queue
    if (queue.length > 0) {
      setTimeout(() => processQueue(userId), 0);
    }
  }
}

function buildSystemPrompt(type: string): string {
  switch (type) {
    case "text-analysis":
      return `You are an expert technical analyst for CitadelTwin, a civil engineering digital twin platform. 
      Analyze the provided text for engineering insights, compliance issues, structural concerns, and provide actionable recommendations.
      Focus on civil engineering best practices, building codes, and safety considerations.`;

    case "code-generation":
      return `You are a senior software engineer specializing in civil engineering applications and digital twins.
      Generate clean, efficient, and well-documented code that follows best practices.
      Consider performance, maintainability, and integration with existing systems.
      Use TypeScript, React, and modern web development patterns.`;

    case "technical-consulting":
      return `You are a senior civil engineering consultant with expertise in digital twins, BIM, CAD, and structural analysis.
      Provide expert technical advice, problem-solving guidance, and industry best practices.
      Consider regulatory compliance, safety standards, and practical implementation challenges.`;

    case "blueprint-analysis":
      return `You are an expert architect and structural engineer specializing in blueprint analysis.
      Analyze architectural drawings and floor plans to identify:
      1. Structural elements (walls, beams, columns, foundations)
      2. Architectural features (doors, windows, stairs, fixtures)
      3. Room types and layouts (bedrooms, kitchens, bathrooms, etc.)
      4. Dimensions and spatial relationships
      5. Building codes and compliance considerations
      
      Return your analysis as structured JSON with the following format:
      {
        "elements": [
          {
            "type": "wall|door|window|room|fixture",
            "name": "element name",
            "dimensions": {"width": number, "height": number, "depth": number},
            "position": {"x": number, "y": number, "z": number},
            "properties": {"key": "value"}
          }
        ],
        "rooms": [
          {
            "name": "room name",
            "type": "room type",
            "area": number,
            "bounds": {"x": number, "y": number, "width": number, "height": number}
          }
        ],
        "scale": number,
        "totalArea": number,
        "buildingType": "residential|commercial|industrial"
      }
      
      Focus on accuracy and detail for 3D model generation purposes.`;

    case "3d-generation":
      return `You are an expert 3D modeling specialist for architectural visualization.
      Generate detailed 3D model specifications from 2D blueprints including:
      1. Precise 3D coordinates for all architectural elements
      2. Proper scaling and proportions
      3. Material assignments based on building type and function
      4. Geometric relationships and constraints
      5. Three.js/glTF compatible geometry definitions
      
      Output structured JSON data suitable for programmatic 3D model generation with this format:
      {
        "geometry": {
          "vertices": [array of vertex coordinates],
          "faces": [array of face indices],
          "normals": [array of normal vectors],
          "uvs": [array of UV coordinates]
        },
        "materials": [
          {
            "name": "material name",
            "type": "material type",
            "properties": {"key": "value"}
          }
        ],
        "scene": {
          "objects": [array of 3D objects with transforms],
          "lights": [array of light definitions]
        }
      }
      
      Ensure architectural accuracy and proper spatial relationships.`;

    case "architectural-modeling":
      return `You are a master architect with expertise in both traditional design and 3D modeling.
      Create comprehensive architectural models from blueprints including:
      1. Detailed room layouts with proper circulation
      2. Structural element placement and sizing
      3. Building systems integration (HVAC, electrical, plumbing)
      4. Code compliance and accessibility features
      5. Intelligent furniture and fixture placement
      
      Focus on creating livable, functional spaces that meet modern building standards.
      Return structured JSON with detailed architectural specifications.`;

    default:
      return `You are an AI assistant specialized in civil engineering and digital twin platforms.
      Provide helpful, accurate, and professional responses.`;
  }
}

function cleanBase64ImageData(imageData: string): string {
  // Remove data URL prefix if present
  let cleanData = imageData.replace(/^data:image\/[^;]+;base64,/, "");

  // Remove any whitespace or newlines
  cleanData = cleanData.replace(/\s/g, "");

  // Validate base64 format
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(cleanData)) {
    throw new Error("Invalid base64 image data format");
  }

  return cleanData;
}

serve(async (req) => {
  console.log("🚀 Gemini AI function called - Method:", req.method);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("✅ Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔑 Checking GEMINI_API_KEY configuration...");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY is not configured in edge function secrets");
      return new Response(JSON.stringify({ error: "Gemini API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log('✅ GEMINI_API_KEY found and configured');

    // Get user ID from authorization header for rate limiting
    const authHeader = req.headers.get("authorization");
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");

    let userId = "anonymous";
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }

    // Check rate limit
    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please try again later.",
          rateLimitReset: rateLimitStore.get(userId)?.resetTime,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("📦 Parsing request body...");
    const requestBody: GeminiRequest = await req.json();
    const { prompt, type, context, maxTokens = 3000, imageData } = requestBody;

    console.log("📝 Request details:", {
      type,
      promptLength: prompt?.length || 0,
      hasContext: !!context,
      hasImageData: !!imageData,
      maxTokens,
    });

    if (!prompt || !type) {
      console.error("❌ Missing required fields:", { hasPrompt: !!prompt, hasType: !!type });
      return new Response(JSON.stringify({ error: "Missing required fields: prompt and type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = buildSystemPrompt(type);
    const fullPrompt = context
      ? `${systemPrompt}\n\nContext: ${context}\n\nUser Request: ${prompt}`
      : `${systemPrompt}\n\nUser Request: ${prompt}`;

    console.log(`Gemini AI request - Type: ${type}, HasImage: ${!!imageData}`);

    // gemini-1.5-flash is deprecated, using gemini-2.5-flash
    const model = "gemini-2.5-flash";

    // Build request body for Gemini API
    const requestContent: any = {
      contents: [
        {
          parts: [],
        },
      ],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: type === "3d-generation" || type === "blueprint-analysis" ? 0.2 : 0.7,
        topP: 0.8,
        topK: 40,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    };

    // Add text content
    requestContent.contents[0].parts.push({
      text: fullPrompt,
    });

    // Add image content if provided
    if (imageData) {
      try {
        const cleanedImageData = cleanBase64ImageData(imageData);
        console.log(`Processed image data: ${cleanedImageData.length} characters`);

        // Determine MIME type from image data
        let mimeType = "image/jpeg"; // default
        if (imageData.includes("data:image/")) {
          const mimeMatch = imageData.match(/data:image\/([^;]+);/);
          if (mimeMatch) {
            mimeType = `image/${mimeMatch[1]}`;
          }
        }

        requestContent.contents[0].parts.push({
          inline_data: {
            mime_type: mimeType,
            data: cleanedImageData,
          },
        });

        console.log(`Added image data with MIME type: ${mimeType}`);
      } catch (imageError) {
        console.error("Error processing image data:", imageError);
        return new Response(
          JSON.stringify({
            error: "Invalid image data format",
            details: imageError instanceof Error ? imageError.message : String(imageError),
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Call Gemini API with retry logic and queuing
    console.log("🤖 Calling Gemini API with model:", model);
    console.log("📊 Request payload size:", JSON.stringify(requestContent).length, "characters");

    const callGeminiAPI = async () => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestContent),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        error.message = errorText;
        throw error;
      }

      return response;
    };

    let geminiResponse;
    try {
      geminiResponse = await queueRequest(userId, callGeminiAPI);
      console.log("📡 Gemini API response status:", geminiResponse.status, geminiResponse.statusText);
    } catch (fetchError) {
      console.error("💥 Fetch error calling Gemini API:", fetchError);
      throw fetchError;
    }

    if (!geminiResponse.ok) {
      console.error("❌ Gemini API returned non-OK status:", geminiResponse.status);
      const errorText = await geminiResponse.text();
      console.error("📜 Gemini API error details:", errorText);

      // Parse error details if possible
      let errorDetails = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson;
        console.error("🔍 Parsed error JSON:", errorJson);
      } catch (parseError) {
        console.error("🔧 Could not parse error as JSON, using raw text");
      }

      return new Response(
        JSON.stringify({
          error: "Failed to get response from Gemini AI",
          status: geminiResponse.status,
          statusText: geminiResponse.statusText,
          details: errorDetails,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const geminiData = await geminiResponse.json();

    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      console.error("No candidates in Gemini response:", geminiData);
      return new Response(
        JSON.stringify({
          error: "No response generated by Gemini AI",
          details: geminiData,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const candidate = geminiData.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      console.error("Invalid candidate structure:", candidate);
      return new Response(
        JSON.stringify({
          error: "Invalid response structure from Gemini AI",
          details: candidate,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = candidate.content.parts[0].text;
    const usage = geminiData.usageMetadata;

    const response: GeminiResponse = {
      result,
      type,
      usage: usage
        ? {
            promptTokens: usage.promptTokenCount || 0,
            completionTokens: usage.candidatesTokenCount || 0,
            totalTokens: usage.totalTokenCount || 0,
          }
        : undefined,
    };

    console.log(
      `Gemini AI response generated successfully - Type: ${type}, Model: ${model}, Tokens: ${usage?.totalTokenCount || "unknown"}`,
    );

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorObj = error as Error;
    console.error("💥 Critical error in gemini-ai function:", error);
    console.error("🔍 Error name:", errorObj.name);
    console.error("📜 Error message:", errorObj.message);
    console.error("📋 Error stack:", errorObj.stack);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        errorType: errorObj.name,
        details: errorObj.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
