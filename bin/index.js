#!/usr/bin/env node

/**
 * Official BotDigit MCP (Model Context Protocol) Server
 * Connects AI Coding Agents & IDEs (Claude Desktop, Antigravity, Cursor)
 * to the BotDigit Marketplace & Developer API.
 */

import http from 'node:http';
import https from 'node:https';
import readline from 'node:readline';

// Configuration
const DEFAULT_BASE_URL = process.env.BOTDIGIT_API_BASE_URL || 'https://api.botdigit.com';
const API_TOKEN = process.env.BOTDIGIT_API_TOKEN || process.env.BOTDIGIT_TOKEN || process.env.API_KEY || '';

// Parse optional CLI flags
const args = process.argv.slice(2);
let token = API_TOKEN;
let baseUrl = DEFAULT_BASE_URL;

for (const arg of args) {
  if (arg.startsWith('--token=')) {
    token = arg.slice(8);
  } else if (arg.startsWith('--base-url=')) {
    baseUrl = arg.slice(11);
  }
}

// HTTP request helper
async function callBotDigitApi(endpoint, options = {}) {
  const url = new URL(endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`);
  const authToken = token || API_TOKEN;

  if (!authToken) {
    throw new Error('Missing BotDigit API Token. Set BOTDIGIT_API_TOKEN environment variable or pass --token=bdt_pat_...');
  }

  const method = options.method || 'GET';
  const headers = {
    'Authorization': `Bearer ${authToken.trim()}`,
    'Accept': 'application/json',
    'User-Agent': 'BotDigit-MCP-Server/1.0.0',
    ...(options.headers || {})
  };

  let body = null;
  if (options.body) {
    headers['Content-Type'] = 'application/json';
    body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  return new Promise((resolve, reject) => {
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const req = client.request(url, {
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            const errMsg = parsed.error?.message || parsed.error || `HTTP ${res.statusCode}: ${data}`;
            reject(new Error(errMsg));
          }
        } catch (err) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ raw: data });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data || err.message}`));
          }
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

// Tool definitions
const TOOLS = [
  {
    name: 'botdigit_list_projects',
    description: 'Search and browse live marketplace projects on BotDigit. Supports category filters, text search, and pagination.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of projects to return (1-100, default: 20)' },
        page: { type: 'number', description: 'Page number (default: 1)' },
        category: { type: 'string', description: 'Category filter (e.g. "Web Development", "AI & Machine Learning", "Design & Creative")' },
        search: { type: 'string', description: 'Keywords to search in project titles and descriptions' }
      }
    }
  },
  {
    name: 'botdigit_get_project',
    description: 'Fetch complete details and specifications for a single BotDigit project by UUID.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'The UUID of the project' }
      },
      required: ['project_id']
    }
  },
  {
    name: 'botdigit_stage_proposal_draft',
    description: 'Stage a proposal draft for a client project on BotDigit. Safe autonomous workflow: creates a draft in your dashboard for your review before live submission.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'The UUID of the target project' },
        bid_amount: { type: 'number', description: 'Proposed bid amount in USD/project currency' },
        estimated_duration: { type: 'string', description: 'Estimated delivery time (e.g. "7 Days", "2 Weeks")' },
        cover_letter: { type: 'string', description: 'Detailed proposal cover letter explaining your solution' },
        milestones: {
          type: 'array',
          description: 'Optional breakdown of milestones',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              amount: { type: 'number' },
              duration_days: { type: 'number' }
            }
          }
        }
      },
      required: ['project_id', 'bid_amount', 'estimated_duration', 'cover_letter']
    }
  },
  {
    name: 'botdigit_list_my_bids',
    description: 'Retrieve your active and historical bids across BotDigit marketplace projects.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of bids to return' },
        page: { type: 'number', description: 'Page number' }
      }
    }
  },
  {
    name: 'botdigit_list_proposal_drafts',
    description: 'List all staged proposal drafts currently waiting for human approval or rejection in your workspace.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'botdigit_approve_proposal_draft',
    description: 'Approve and dispatch a staged proposal draft, officially submitting it to the client.',
    inputSchema: {
      type: 'object',
      properties: {
        draft_id: { type: 'string', description: 'UUID of the proposal draft to approve' }
      },
      required: ['draft_id']
    }
  },
  {
    name: 'botdigit_list_messages',
    description: 'List active client/freelancer messaging threads.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number' },
        page: { type: 'number' }
      }
    }
  },
  {
    name: 'botdigit_get_thread',
    description: 'Get full message history for a specific conversation thread.',
    inputSchema: {
      type: 'object',
      properties: {
        thread_id: { type: 'string', description: 'UUID of the thread' }
      },
      required: ['thread_id']
    }
  },
  {
    name: 'botdigit_stage_message_draft',
    description: 'Stage a message draft reply to a client thread for human review.',
    inputSchema: {
      type: 'object',
      properties: {
        thread_id: { type: 'string', description: 'UUID of the conversation thread' },
        content: { type: 'string', description: 'Message body' }
      },
      required: ['thread_id', 'content']
    }
  },
  {
    name: 'botdigit_list_contracts',
    description: 'List your active and completed contracts, escrows, and project orders.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by contract status (e.g. active, completed, dispute)' }
      }
    }
  },
  {
    name: 'botdigit_get_contract',
    description: 'Get detailed contract data including escrow status, terms, and parties.',
    inputSchema: {
      type: 'object',
      properties: {
        contract_id: { type: 'string', description: 'UUID of the contract' }
      },
      required: ['contract_id']
    }
  },
  {
    name: 'botdigit_list_contract_milestones',
    description: 'List milestones and escrow funding for a specific contract.',
    inputSchema: {
      type: 'object',
      properties: {
        contract_id: { type: 'string', description: 'UUID of the contract' }
      },
      required: ['contract_id']
    }
  },
  {
    name: 'botdigit_stage_delivery_draft',
    description: 'Stage a milestone deliverable submission for client review and escrow release.',
    inputSchema: {
      type: 'object',
      properties: {
        milestone_id: { type: 'string', description: 'UUID of the milestone' },
        notes: { type: 'string', description: 'Description of deliverables and instructions for testing' },
        attachment_urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of deliverable URLs, pull requests, or artifact links'
        }
      },
      required: ['milestone_id', 'notes']
    }
  }
];

// Tool Execution Dispatcher
async function executeTool(name, params = {}) {
  switch (name) {
    case 'botdigit_list_projects': {
      const q = new URLSearchParams();
      if (params.limit) q.set('limit', String(params.limit));
      if (params.page) q.set('page', String(params.page));
      if (params.category) q.set('category', params.category);
      if (params.search) q.set('search', params.search);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      return await callBotDigitApi(`/api/developer/v1/projects${queryStr}`);
    }

    case 'botdigit_get_project': {
      return await callBotDigitApi(`/api/developer/v1/projects/${params.project_id}`);
    }

    case 'botdigit_stage_proposal_draft': {
      return await callBotDigitApi(`/api/developer/v1/projects/${params.project_id}/proposals/drafts`, {
        method: 'POST',
        body: {
          bid_amount: params.bid_amount,
          estimated_duration: params.estimated_duration,
          cover_letter: params.cover_letter,
          milestones: params.milestones || []
        }
      });
    }

    case 'botdigit_list_my_bids': {
      const q = new URLSearchParams();
      if (params.limit) q.set('limit', String(params.limit));
      if (params.page) q.set('page', String(params.page));
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      return await callBotDigitApi(`/api/developer/v1/proposals/bids${queryStr}`);
    }

    case 'botdigit_list_proposal_drafts': {
      return await callBotDigitApi(`/api/developer/v1/proposals/drafts`);
    }

    case 'botdigit_approve_proposal_draft': {
      return await callBotDigitApi(`/api/developer/v1/proposals/drafts/${params.draft_id}/approve`, {
        method: 'POST'
      });
    }

    case 'botdigit_list_messages': {
      const q = new URLSearchParams();
      if (params.limit) q.set('limit', String(params.limit));
      if (params.page) q.set('page', String(params.page));
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      return await callBotDigitApi(`/api/developer/v1/messages/threads${queryStr}`);
    }

    case 'botdigit_get_thread': {
      return await callBotDigitApi(`/api/developer/v1/messages/threads/${params.thread_id}`);
    }

    case 'botdigit_stage_message_draft': {
      return await callBotDigitApi(`/api/developer/v1/messages/threads/${params.thread_id}/drafts`, {
        method: 'POST',
        body: { content: params.content }
      });
    }

    case 'botdigit_list_contracts': {
      const q = new URLSearchParams();
      if (params.status) q.set('status', params.status);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      return await callBotDigitApi(`/api/developer/v1/contracts${queryStr}`);
    }

    case 'botdigit_get_contract': {
      return await callBotDigitApi(`/api/developer/v1/contracts/${params.contract_id}`);
    }

    case 'botdigit_list_contract_milestones': {
      return await callBotDigitApi(`/api/developer/v1/contracts/${params.contract_id}/milestones`);
    }

    case 'botdigit_stage_delivery_draft': {
      return await callBotDigitApi(`/api/developer/v1/contracts/milestones/${params.milestone_id}/delivery-drafts`, {
        method: 'POST',
        body: {
          notes: params.notes,
          attachment_urls: params.attachment_urls || []
        }
      });
    }

    default:
      throw new Error(`Unknown BotDigit tool: ${name}`);
  }
}

// JSON-RPC 2.0 stdio engine for MCP protocol
function sendRpcResponse(id, result, error = null) {
  const payload = { jsonrpc: '2.0', id };
  if (error) {
    payload.error = {
      code: error.code || -32603,
      message: error.message || 'Internal error',
      data: error.data
    };
  } else {
    payload.result = result;
  }
  process.stdout.write(JSON.stringify(payload) + '\n');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  if (!line || !line.trim()) return;

  let request;
  try {
    request = JSON.parse(line.trim());
  } catch (err) {
    sendRpcResponse(null, null, { code: -32700, message: 'Parse error' });
    return;
  }

  const { id, method, params } = request;

  // Handle MCP handshake & notifications
  switch (method) {
    case 'initialize': {
      sendRpcResponse(id, {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {
            listChanged: false
          }
        },
        serverInfo: {
          name: 'botdigit',
          version: '1.0.0'
        }
      });
      break;
    }

    case 'notifications/initialized':
    case 'initialized': {
      // Client confirmed initialization; no reply needed for notifications
      break;
    }

    case 'ping': {
      sendRpcResponse(id, {});
      break;
    }

    case 'tools/list': {
      sendRpcResponse(id, { tools: TOOLS });
      break;
    }

    case 'tools/call': {
      if (!params || !params.name) {
        sendRpcResponse(id, null, { code: -32602, message: 'Invalid params: name required' });
        return;
      }

      try {
        const result = await executeTool(params.name, params.arguments || {});
        sendRpcResponse(id, {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
            }
          ],
          isError: false
        });
      } catch (err) {
        sendRpcResponse(id, {
          content: [
            {
              type: 'text',
              text: `Error executing ${params.name}: ${err.message}`
            }
          ],
          isError: true
        });
      }
      break;
    }

    default: {
      if (id !== undefined && id !== null) {
        sendRpcResponse(id, null, { code: -32601, message: `Method not found: ${method}` });
      }
      break;
    }
  }
});

process.on('uncaughtException', (err) => {
  process.stderr.write(`[BotDigit MCP Error] ${err.stack || err.message}\n`);
});
