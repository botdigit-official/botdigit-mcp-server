#!/usr/bin/env node

/**
 * @botdigit/mcp-server
 * Official Model Context Protocol (MCP) Server for BotDigit Work OS
 * 
 * Bridges stdin/stdout JSON-RPC 2.0 protocol to the BotDigit MCP Gateway.
 * Supports Cursor, Claude Desktop, Windsurf, and custom autonomous agents.
 */

const readline = require('readline');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const VERSION = '1.0.0';

// Configuration from environment variables
const API_URL = process.env.BOTDIGIT_API_URL || 'https://api.botdigit.com/api/v1/mcp';
const PAT = process.env.BOTDIGIT_PAT || process.env.BOTDIGIT_API_TOKEN || process.env.BOTDIGIT_TOKEN || '';
const WORKSPACE_ID = process.env.BOTDIGIT_WORKSPACE_ID || '';

// Handle CLI flags
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
BotDigit MCP Server (v${VERSION})
Model Context Protocol Gateway Bridge for Cursor, Claude Desktop & Agents

Usage:
  npx @botdigit/mcp-server [options]

Environment Variables:
  BOTDIGIT_PAT           Personal Access Token (bd_pat_...) or App Token (bd_app_...)
  BOTDIGIT_API_URL       MCP Gateway URL (default: https://api.botdigit.com/api/v1/mcp)
  BOTDIGIT_WORKSPACE_ID  Default workspace UUID (optional)

Options:
  --test-connection      Test connectivity and authentication with BotDigit MCP Gateway
  --version, -v          Display server version
  --help, -h             Show this help message

Configuration Examples:

Cursor (~/.cursor/mcp.json):
{
  "mcpServers": {
    "botdigit": {
      "command": "npx",
      "args": ["-y", "@botdigit/mcp-server"],
      "env": {
        "BOTDIGIT_PAT": "bdt_pat_your_token_here"
      }
    }
  }
}

Claude Desktop (~/Library/Application Support/Claude/claude_desktop_config.json):
{
  "mcpServers": {
    "botdigit": {
      "command": "npx",
      "args": ["-y", "@botdigit/mcp-server"],
      "env": {
        "BOTDIGIT_PAT": "bdt_pat_your_token_here"
      }
    }
  }
}
  `);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  console.log(`@botdigit/mcp-server v${VERSION}`);
  process.exit(0);
}

// Test connection mode
if (args.includes('--test-connection')) {
  console.error(`Testing connection to BotDigit MCP Gateway: ${API_URL}`);
  forwardToGateway({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  })
    .then((res) => {
      if (res && res.result && res.result.tools) {
        console.error(` Connection successful! Discovered ${res.result.tools.length} BotDigit MCP tools.`);
        console.error('Available Tools:');
        res.result.tools.forEach((t) => console.error(` - ${t.name}: ${t.description.slice(0, 70)}...`));
        process.exit(0);
      } else {
        console.error(' Received unexpected response:', JSON.stringify(res));
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error(` Connection failed: ${err.message}`);
      process.exit(1);
    });
} else {
  // Stdio JSON-RPC Line-by-Line Handler
  startStdioTransport();
}

function startStdioTransport() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  process.stderr.write(`BotDigit MCP Server v${VERSION} started on stdio. Forwarding to ${API_URL}\n`);

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let rpcReq;
    try {
      rpcReq = JSON.parse(trimmed);
    } catch (e) {
      writeResponse({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error: invalid JSON received'
        }
      });
      return;
    }

    try {
      const response = await forwardToGateway(rpcReq);
      writeResponse(response);
    } catch (err) {
      writeResponse({
        jsonrpc: '2.0',
        id: rpcReq.id || null,
        error: {
          code: -32603,
          message: `Internal MCP Gateway Bridge error: ${err.message}`
        }
      });
    }
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

function writeResponse(resp) {
  process.stdout.write(JSON.stringify(resp) + '\n');
}

function forwardToGateway(payload) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(API_URL);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const data = JSON.stringify(payload);

    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      'User-Agent': `botdigit-mcp-server-cli/${VERSION}`,
    };

    if (PAT) {
      headers['Authorization'] = `Bearer ${PAT}`;
    }
    if (WORKSPACE_ID) {
      headers['x-workspace-id'] = WORKSPACE_ID;
    }

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: headers,
      timeout: 30000,
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (e) {
          resolve({
            jsonrpc: '2.0',
            id: payload.id || null,
            error: {
              code: -32603,
              message: `Invalid JSON response from gateway (HTTP ${res.statusCode}): ${body.slice(0, 200)}`
            }
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Gateway request timed out after 30 seconds'));
    });

    req.write(data);
    req.end();
  });
}
