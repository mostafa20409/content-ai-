
export async function POST(req) {
  try {
    const body = await req.json();
    const Prompt = body.prompt;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const fakeResult = `Generating contet based on: ${prompt}`;

    return new Response(JSON.stringify({ result: fakeResult }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}