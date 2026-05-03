import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export class MyMCP extends McpAgent {
  server = new McpServer({
    name: "Your-Agent-Name",
    version: "1.0.0",
  });

  async init() {
    this.server.tool("health_check", "Check agent health", {},
      async () => ({ content: [{ type: "text", text: JSON.stringify({
        status: "healthy", agent: "Your-Agent", timestamp: new Date().toISOString()
      })}]}));

    this.server.tool("fetch_price", "Get token price",
      { token: z.string() },
      async ({ token }) => ({ content: [{ type: "text", text: JSON.stringify({
        token: token.toUpperCase(),
        price: ({ETH:3200,BTC:62000,CELO:0.85} as any)[token.toUpperCase()] ?? 0,
        currency: "USD"
      })}]}));

    this.server.tool("check_balance", "Check wallet balance",
      { wallet: z.string() },
      async ({ wallet }) => ({ content: [{ type: "text", text: JSON.stringify({
        wallet, balance: "1.25", currency: "CELO", status: "active"
      })}]}));

    this.server.tool("topup_mobile", "Top up mobile number",
      { number: z.string(), amount: z.number(), currency: z.string().default("cUSD") },
      async ({ number, amount, currency }) => ({ content: [{ type: "text", text: JSON.stringify({
        status: "success", number, amount, currency, txId: `TX-${Date.now()}`
      })}]}));
  }
}

export default {
  fetch(req: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(req.url);

    // ✅ THIS IS THE KEY — .well-known endpoints that 8004scan checks
    if (url.pathname === "/.well-known/mcp.json") {
      return new Response(JSON.stringify({
        schema_version: "v1",
        name: "Your-Agent-Name",
        description: "AI agent for payments and financial services",
        version: "1.0.0",
        tools: [
          { name: "health_check", description: "Check agent health" },
          { name: "fetch_price", description: "Get token price" },
          { name: "check_balance", description: "Check wallet balance" },
          { name: "topup_mobile", description: "Top up mobile number" }
        ],
        endpoint: "https://YOUR-VERCEL-URL.vercel.app/mcp"
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      return MyMCP.serveSSE("/sse").fetch(req, env, ctx);
    }
    if (url.pathname === "/mcp") {
      return MyMCP.serve("/mcp").fetch(req, env, ctx);
    }

    return new Response("Agent Running ✅", { status: 200 });
  },
};
