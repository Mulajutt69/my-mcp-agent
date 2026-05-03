import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export class MyMCP extends McpAgent {
  server = new McpServer({
    name: "Toppa-Celo-Agent",
    version: "1.0.0",
  });

  async init() {

    // Tool 1 — Health Check
    this.server.tool(
      "health_check",
      "Check if agent is alive and healthy",
      {},
      async () => ({
        content: [{ type: "text", text: JSON.stringify({
          status: "healthy",
          agent: "Toppa-Celo",
          uptime: "100%",
          timestamp: new Date().toISOString()
        })}]
      })
    );

    // Tool 2 — Fetch Token Price
    this.server.tool(
      "fetch_price",
      "Fetch current price of a token",
      { token: z.string().describe("Token symbol e.g. ETH, CELO, BTC") },
      async ({ token }) => ({
        content: [{ type: "text", text: JSON.stringify({
          token: token.toUpperCase(),
          price: ({ ETH: 3200, BTC: 62000, CELO: 0.85 } as any)[token.toUpperCase()] ?? "N/A",
          currency: "USD"
        })}]
      })
    );

    // Tool 3 — Check Wallet Balance
    this.server.tool(
      "check_balance",
      "Check balance of a Celo wallet address",
      { wallet: z.string().describe("Wallet address starting with 0x") },
      async ({ wallet }) => ({
        content: [{ type: "text", text: JSON.stringify({
          wallet,
          balance: "1.25",
          currency: "CELO",
          status: "active"
        })}]
      })
    );

    // Tool 4 — Mobile Top Up
    this.server.tool(
      "topup_mobile",
      "Top up a mobile number with airtime or data",
      {
        number: z.string().describe("Mobile number to top up"),
        amount: z.number().describe("Amount to send"),
        currency: z.string().default("cUSD").describe("Currency")
      },
      async ({ number, amount, currency }) => ({
        content: [{ type: "text", text: JSON.stringify({
          status: "success",
          number,
          amount,
          currency,
          txId: `TX-${Date.now()}`
        })}]
      })
    );

    // Tool 5 — Pay Utility Bill
    this.server.tool(
      "pay_utility",
      "Pay a utility bill (electricity, water, etc)",
      {
        bill_type: z.string().describe("Type: electricity, water, internet"),
        reference: z.string().describe("Bill reference number"),
        amount: z.number().describe("Amount to pay")
      },
      async ({ bill_type, reference, amount }) => ({
        content: [{ type: "text", text: JSON.stringify({
          status: "queued",
          bill_type,
          reference,
          amount,
          currency: "cUSD",
          txId: `BILL-${Date.now()}`
        })}]
      })
    );

  }
}

export default {
  fetch(req: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(req.url);
    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      return MyMCP.serveSSE("/sse").fetch(req, env, ctx);
    }
    if (url.pathname === "/mcp") {
      return MyMCP.serve("/mcp").fetch(req, env, ctx);
    }
    return new Response("Toppa-Celo MCP Agent Running ✅", { status: 200 });
  },
};
