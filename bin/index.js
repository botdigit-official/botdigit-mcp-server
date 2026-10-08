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

// Published draft contracts (Developer Platform OpenAPI):
// proposal body is string bid_amount, integer delivery_days, proposal_text,
// and optional proposed_milestones; delivery body requires work_summary.
// Legacy aliases are copied only when the conversion is exact.
// Amounts are not rounded. Day counts are not inferred from prose.
const DECIMAL_STRING = /^(0|[1-9]\d*)(\.\d+)?$/;
const PROPOSAL_ARGUMENTS = new Set([
  'project_id',
  'bid_amount',
  'delivery_days',
  'estimated_duration',
  'proposal_text',
  'cover_letter',
  'proposed_milestones',
  'milestones',
  'ai_agent_id',
  'ai_agent_notes'
]);
const DELIVERY_ARGUMENTS = new Set([
  'milestone_id',
  'work_summary',
  'notes',
  'attachment_urls',
  'ai_agent_id',
  'ai_agent_notes'
]);
const MILESTONE_FIELDS = new Set(['title', 'description', 'amount', 'duration_days']);

function assertPlainObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
}

function rejectUnknownArguments(params, allowed, toolName) {
  for (const key of Object.keys(params)) {
    if (!allowed.has(key)) {
      throw new Error(`${toolName} does not accept argument ${key}`);
    }
  }
}

function requirePathSegment(value, field) {
  if (typeof value !== 'string' || value.length === 0 || value === '.' || value === '..' || /[\/\\?#\s%]/.test(value)) {
    throw new Error(`${field} must be a single non-empty path segment`);
  }
  return value;
}

function canonicalDecimalString(value, field) {
  if (typeof value === 'string') {
    if (!DECIMAL_STRING.test(value)) {
      throw new Error(`${field} must be an exact non-negative decimal string`);
    }
    return value;
  }
  if (typeof value === 'number') {
    if (Number.isSafeInteger(value) && value >= 0) return String(value);
    throw new Error(`${field} must be an exact decimal string; non-integer numbers are rejected`);
  }
  throw new Error(`${field} must be an exact non-negative decimal string`);
}

function parseExactInteger(value, field, minimum) {
  let parsed;
  if (typeof value === 'number' && Number.isSafeInteger(value)) {
    parsed = value;
  } else if (typeof value === 'string' && /^(0|[1-9]\d*)$/.test(value)) {
    parsed = Number(value);
    // Digit strings that do not round-trip through Number are not exact.
    if (!Number.isSafeInteger(parsed) || String(parsed) !== value) {
      throw new Error(`${field} must be an integer`);
    }
  } else {
    throw new Error(`${field} must be an integer`);
  }
  if (parsed < minimum) {
    throw new Error(`${field} must be >= ${minimum}`);
  }
  return parsed;
}

function exactText(value, field) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function resolveAliasedText(primary, alias, primaryName, aliasName) {
  const hasPrimary = primary !== undefined;
  const hasAlias = alias !== undefined;
  if (!hasPrimary && !hasAlias) {
    throw new Error(`${primaryName} is required`);
  }
  if (hasPrimary && hasAlias && primary !== alias) {
    throw new Error(`${primaryName} and ${aliasName} conflict`);
  }
  return exactText(hasPrimary ? primary : alias, primaryName);
}

function resolveDeliveryDays(params) {
  const hasDays = params.delivery_days !== undefined;
  const hasEstimate = params.estimated_duration !== undefined;
  if (!hasDays && !hasEstimate) {
    throw new Error('delivery_days is required');
  }

  let fromEstimate;
  if (hasEstimate) {
    const raw = params.estimated_duration;
    if (typeof raw === 'number') {
      fromEstimate = parseExactInteger(raw, 'estimated_duration', 1);
    } else if (typeof raw === 'string') {
      const text = raw.trim();
      const match = text.match(/^(0|[1-9]\d*)$/) || text.match(/^(0|[1-9]\d*)\s*days?$/i);
      if (!match) {
        throw new Error('estimated_duration must be a whole number of days such as 7 or "7 days"');
      }
      fromEstimate = parseExactInteger(match[1], 'estimated_duration', 1);
    } else {
      throw new Error('estimated_duration must be a whole number of days such as 7 or "7 days"');
    }
  }

  const fromDays = hasDays ? parseExactInteger(params.delivery_days, 'delivery_days', 1) : undefined;
  if (hasDays && hasEstimate && fromDays !== fromEstimate) {
    throw new Error('delivery_days and estimated_duration conflict');
  }
  return hasDays ? fromDays : fromEstimate;
}

function canonicalMilestones(params) {
  const hasProposed = Object.prototype.hasOwnProperty.call(params, 'proposed_milestones');
  const hasLegacy = Object.prototype.hasOwnProperty.call(params, 'milestones');
  if (hasProposed && hasLegacy) {
    throw new Error('proposed_milestones and milestones conflict');
  }
  if (!hasProposed && !hasLegacy) return undefined;

  const source = hasProposed ? params.proposed_milestones : params.milestones;
  if (!Array.isArray(source)) {
    throw new Error('proposed_milestones must be an array');
  }

  return source.map((item, index) => {
    const label = `proposed_milestones[${index}]`;
    assertPlainObject(item, label);
    for (const key of Object.keys(item)) {
      if (!MILESTONE_FIELDS.has(key)) {
        throw new Error(`${label} does not accept field ${key}`);
      }
    }
    const milestone = {
      title: exactText(item.title, `${label}.title`)
    };
    if (item.description !== undefined) {
      if (typeof item.description !== 'string') {
        throw new Error(`${label}.description must be a string`);
      }
      milestone.description = item.description;
    }
    milestone.amount = canonicalDecimalString(item.amount, `${label}.amount`);
    if (item.duration_days !== undefined) {
      milestone.duration_days = parseExactInteger(item.duration_days, `${label}.duration_days`, 0);
    }
    return milestone;
  });
}

function optionalString(value, field) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string`);
  }
  return value;
}

function assignOptionalStrings(body, params) {
  const agentId = optionalString(params.ai_agent_id, 'ai_agent_id');
  const agentNotes = optionalString(params.ai_agent_notes, 'ai_agent_notes');
  if (agentId !== undefined) body.ai_agent_id = agentId;
  if (agentNotes !== undefined) body.ai_agent_notes = agentNotes;
}

function buildProposalDraft(params) {
  assertPlainObject(params, 'arguments');
  rejectUnknownArguments(params, PROPOSAL_ARGUMENTS, 'botdigit_stage_proposal_draft');
  const projectId = requirePathSegment(params.project_id, 'project_id');
  const body = {
    bid_amount: canonicalDecimalString(params.bid_amount, 'bid_amount'),
    delivery_days: resolveDeliveryDays(params),
    proposal_text: resolveAliasedText(params.proposal_text, params.cover_letter, 'proposal_text', 'cover_letter')
  };
  const milestones = canonicalMilestones(params);
  if (milestones !== undefined) body.proposed_milestones = milestones;
  assignOptionalStrings(body, params);
  return { projectId, body };
}

function buildDeliveryDraft(params) {
  assertPlainObject(params, 'arguments');
  rejectUnknownArguments(params, DELIVERY_ARGUMENTS, 'botdigit_stage_delivery_draft');
  const milestoneId = requirePathSegment(params.milestone_id, 'milestone_id');
  const body = {
    work_summary: resolveAliasedText(params.work_summary, params.notes, 'work_summary', 'notes')
  };
  if (params.attachment_urls !== undefined) {
    if (!Array.isArray(params.attachment_urls) || params.attachment_urls.some((item) => typeof item !== 'string')) {
      throw new Error('attachment_urls must be an array of strings');
    }
    body.attachment_urls = params.attachment_urls.slice();
  }
  assignOptionalStrings(body, params);
  return { milestoneId, body };
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
    description: 'Stage a proposal draft for human review. Does not approve or submit the proposal. Send the published draft fields: string bid_amount, integer delivery_days, and proposal_text.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        project_id: { type: 'string', description: 'The UUID of the target project' },
        bid_amount: {
          description: 'Exact bid as a decimal string such as "1500.00". A safe integer is accepted and sent as its exact decimal string. Non-integer numbers are rejected.',
          anyOf: [
            { type: 'string' },
            { type: 'integer', minimum: 0 }
          ]
        },
        delivery_days: { type: 'integer', minimum: 1, description: 'Whole delivery days, minimum 1.' },
        proposal_text: { type: 'string', description: 'Proposal text sent as proposal_text.' },
        proposed_milestones: {
          type: 'array',
          description: 'Optional milestones. Each amount is an exact decimal string.',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              amount: { type: 'string' },
              duration_days: { type: 'integer', minimum: 0 }
            },
            required: ['title', 'amount']
          }
        },
        ai_agent_id: { type: 'string', description: 'Optional agent identifier forwarded unchanged.' },
        ai_agent_notes: { type: 'string', description: 'Optional agent notes forwarded unchanged.' },
        estimated_duration: {
          type: 'string',
          description: 'Legacy alias for delivery_days. Accepted only as a whole day count such as "7" or "7 days". Prose such as "2 Weeks" is rejected. A different delivery_days conflicts.'
        },
        cover_letter: {
          type: 'string',
          description: 'Legacy alias for proposal_text. The exact string is copied. A different proposal_text conflicts.'
        },
        milestones: {
          type: 'array',
          description: 'Legacy alias for proposed_milestones. Rejected when proposed_milestones is also set. Integer amounts are sent as exact decimal strings.',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              amount: {
                anyOf: [
                  { type: 'string' },
                  { type: 'integer', minimum: 0 }
                ]
              },
              duration_days: { type: 'integer', minimum: 0 }
            },
            required: ['title', 'amount']
          }
        }
      },
      required: ['project_id', 'bid_amount', 'delivery_days', 'proposal_text']
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
    description: 'Stage a milestone delivery draft for human review. Does not submit the milestone or release escrow. The published body field is work_summary.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        milestone_id: { type: 'string', description: 'UUID of the milestone' },
        work_summary: { type: 'string', description: 'Work summary sent as work_summary.' },
        attachment_urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'Deliverable URLs, pull requests, or artifact links'
        },
        ai_agent_id: { type: 'string', description: 'Optional agent identifier forwarded unchanged.' },
        ai_agent_notes: { type: 'string', description: 'Optional agent notes forwarded unchanged.' },
        notes: {
          type: 'string',
          description: 'Legacy alias for work_summary. The exact string is copied. A different work_summary conflicts.'
        }
      },
      required: ['milestone_id', 'work_summary']
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
      const draft = buildProposalDraft(params);
      return await callBotDigitApi(`/api/developer/v1/projects/${draft.projectId}/proposals/drafts`, {
        method: 'POST',
        body: draft.body
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
      const draft = buildDeliveryDraft(params);
      return await callBotDigitApi(`/api/developer/v1/contracts/milestones/${draft.milestoneId}/delivery-drafts`, {
        method: 'POST',
        body: draft.body
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
