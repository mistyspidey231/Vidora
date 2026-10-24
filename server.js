
import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "Vidora AI",
    status: "running",
    message: "Vidora MCP server is online."
  });
});

app.post("/mcp", async (req, res) => {
  const server = new Server(
    { name: "vidora", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "vidora_status",
        description: "Check Vidora AI setup status.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "generate_video",
        description: "Prepare a video-generation request. A video provider must be configured before videos can be generated.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "Describe the video you want."
            },
            image_url: {
              type: "string",
              description: "Optional public image URL for image-to-video."
            }
          },
          required: ["prompt"]
        }
      }
    ]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;

    if (name === "vidora_status") {
      return {
        content: [{
          type: "text",
          text: "Vidora MCP server is running. Video generation provider setup is still required."
        }]
      };
    }

    if (name === "generate_video") {
      return {
        content: [{
          type: "text",
          text: "Request received for: " + args.prompt +
            ". No video was generated: a video-generation provider has not been connected yet."
        }]
      };
    }

    throw new Error("Unknown tool: " + name);
  });

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Vidora MCP request failed." });
    }
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Vidora listening on port " + PORT);
});
    
