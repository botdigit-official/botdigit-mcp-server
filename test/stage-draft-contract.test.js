/**
 * Drives the real bin/index.js process over JSON-RPC stdio against an
 * ephemeral 127.0.0.1 HTTP server. Set BOTDIGIT_MCP_ENTRY to point the same
 * assertions at another executable, such as the pre-patch server.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const TOKEN = 'bdt_pat_synthetic_test';
const PROJECT_ID = '11111111-1111-4111-8111-111111111111';
const MILESTONE_ID = '22222222-2222-4222-8222-222222222222';
const CONTRACT_ID = '33333333-3333-4333-8333-333333333333';
const THREAD_ID = '44444444-4444-4444-8444-444444444444';
const DRAFT_ID = '55555555-5555-4555-8555-555555555555';

const TOOL_NAMES = [
  'botdigit_list_projects',
  'botdigit_get_project',
  'botdigit_stage_proposal_draft',
  'botdigit_list_my_bids',
  'botdigit_list_proposal_drafts',
  'botdigit_approve_proposal_draft',
  'botdigit_list_messages',
  'botdigit_get_thread',
  'botdigit_stage_message_draft',
  'botdigit_list_contracts',
  'botdigit_get_contract',
  'botdigit_list_contract_milestones',
  'botdigit_stage_delivery_draft'
];

const fixture = JSON.parse(readFileSync(new URL('./fixtures/stage-draft-contract.json', import.meta.url), 'utf8'));
const entry = process.env.BOTDIGIT_MCP_ENTRY
  ? path.resolve(process.env.BOTDIGIT_MCP_ENTRY)
  : fileURLToPath(new URL('../bin/index.js', import.meta.url));

function draftPath(kind, id) {
  const spec = fixture[kind];
  const token = kind === 'proposal_draft' ? '{project_id}' : '{milestone_id}';
  return fixture.api_prefix + spec.openapi_path.replace(token, id);
}

function explain(result) {
  return result?.content?.map((item) => item.text).join('\n') || JSON.stringify(result);
}

function assertBodyFitsContract(kind, body) {
  const schema = fixture[kind].schema;
  const allowed = new Set(Object.keys(schema.properties));
  for (const key of Object.keys(body)) {
    assert.ok(allowed.has(key), `${key} is not in the published ${kind} schema`);
  }
  for (const key of schema.required) {
    assert.ok(Object.hasOwn(body, key), `missing published field ${key}`);
  }
  if (kind === 'proposal_draft') {
    assert.equal(typeof body.bid_amount, 'string');
    assert.match(body.bid_amount, /^(0|[1-9]\d*)(\.\d+)?$/);
    assert.equal(Number.isInteger(body.delivery_days), true);
    assert.ok(body.delivery_days >= schema.properties.delivery_days.minimum);
    assert.equal(typeof body.proposal_text, 'string');
    assert.ok(body.proposal_text.length > 0);
    if (body.proposed_milestones !== undefined) {
      assert.ok(Array.isArray(body.proposed_milestones));
      const itemSchema = schema.properties.proposed_milestones.items;
      for (const item of body.proposed_milestones) {
        for (const key of itemSchema.required) {
          assert.ok(Object.hasOwn(item, key), `milestone missing ${key}`);
        }
        assert.equal(typeof item.title, 'string');
        assert.equal(typeof item.amount, 'string');
        assert.match(item.amount, /^(0|[1-9]\d*)(\.\d+)?$/);
        if (item.description !== undefined) assert.equal(typeof item.description, 'string');
        if (item.duration_days !== undefined) assert.equal(Number.isInteger(item.duration_days), true);
        for (const key of Object.keys(item)) {
          assert.ok(Object.hasOwn(itemSchema.properties, key), `milestone field ${key}`);
        }
      }
    }
    return;
  }
  assert.equal(typeof body.work_summary, 'string');
  assert.ok(body.work_summary.length > 0);
  assert.equal(Object.hasOwn(body, 'notes'), false);
  if (body.attachment_urls !== undefined) {
    assert.ok(Array.isArray(body.attachment_urls));
    for (const url of body.attachment_urls) assert.equal(typeof url, 'string');
  }
}

function createLoopback() {
  const seen = [];
  let responder = () => ({ status: 201, json: { ok: true } });
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      const record = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        raw,
        body: raw ? JSON.parse(raw) : null
      };
      seen.push(record);
      const result = responder(record) || { status: 201, json: { ok: true } };
      res.writeHead(result.status ?? 201, { 'content-type': 'application/json' });
      res.end(JSON.stringify(result.json ?? { ok: true }));
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        seen,
        port,
        setResponder(fn) { responder = fn; },
        close() {
          return new Promise((done) => {
            server.close(() => done());
            if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
          });
        }
      });
    });
  });
}

class McpSession {
  constructor(child) {
    this.child = child;
    this.buffer = '';
    this.pending = new Map();
    this.stderr = '';
    this.nextId = 1;
    this.exited = false;
    this.exitPromise = new Promise((resolve) => {
      child.on('exit', () => {
        this.exited = true;
        resolve();
      });
    });
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => this.#onStdout(chunk));
    child.stderr.on('data', (chunk) => { this.stderr += chunk; });
    child.stdin.on('error', () => {});
    child.stdout.on('error', () => {});
    child.stderr.on('error', () => {});
  }

  #onStdout(chunk) {
    this.buffer += chunk;
    let index;
    while ((index = this.buffer.indexOf('\n')) >= 0) {
      const line = this.buffer.slice(0, index).trim();
      this.buffer = this.buffer.slice(index + 1);
      if (!line) continue;
      const message = JSON.parse(line);
      const waiter = this.pending.get(message.id);
      if (waiter) {
        this.pending.delete(message.id);
        waiter.resolve(message);
      }
    }
  }

  request(method, params, timeoutMs = 4000) {
    const id = this.nextId++;
    const line = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`timeout waiting for ${method}#${id}; stderr=${this.stderr}`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (message) => {
          clearTimeout(timer);
          resolve(message);
        }
      });
      this.child.stdin.write(line);
    });
  }

  notify(method, params) {
    this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
  }

  async close() {
    if (this.exited) return;
    try { this.child.stdin.end(); } catch { /* process already closed */ }
    this.child.kill('SIGTERM');
    const timer = setTimeout(() => {
      if (!this.exited) this.child.kill('SIGKILL');
    }, 1000);
    await this.exitPromise;
    clearTimeout(timer);
  }
}

function spawnServer(port) {
  const baseUrl = `http://127.0.0.1:${port}`;
  assert.match(baseUrl, /^http:\/\/127\.0\.0\.1:\d+$/);
  const child = spawn(process.execPath, [entry, `--token=${TOKEN}`, `--base-url=${baseUrl}`], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      PATH: process.env.PATH || '',
      BOTDIGIT_API_BASE_URL: baseUrl,
      BOTDIGIT_API_TOKEN: TOKEN
    }
  });
  return new McpSession(child);
}

async function initializeSession(session) {
  const init = await session.request('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'stage-contract-test', version: '0' }
  });
  assert.equal(init.result?.serverInfo?.name, 'botdigit');
  session.notify('notifications/initialized');
}

async function callTool(session, name, args) {
  const message = await session.request('tools/call', { name, arguments: args });
  assert.ok(message.result, `missing tool result: ${JSON.stringify(message)} stderr=${session.stderr}`);
  return message.result;
}

async function openHarness(t, responder) {
  const loop = await createLoopback();
  t.after(() => loop.close());
  if (responder) loop.setResponder(responder);
  const session = spawnServer(loop.port);
  t.after(() => session.close());
  await initializeSession(session);
  return { loop, session };
}

function assertExchange(loop, record, { method, url, body }) {
  assert.equal(record.method, method);
  assert.equal(record.url, url);
  assert.equal(record.headers.authorization, `Bearer ${TOKEN}`);
  assert.equal(record.headers.host, `127.0.0.1:${loop.port}`);
  assert.equal(record.headers['user-agent'], 'BotDigit-MCP-Server/1.0.0');
  if (body === undefined) {
    assert.equal(record.raw, '');
    assert.equal(record.headers['content-type'], undefined);
    return;
  }
  assert.equal(record.headers['content-type'], 'application/json');
  assert.equal(record.raw, JSON.stringify(body));
  assert.deepEqual(record.body, body);
}

describe('stage draft contract', { concurrency: 1, timeout: 30000 }, () => {
  test('fixture pins the published draft request schemas', () => {
    assert.equal(fixture.provenance.openapi_url, 'https://botdigit.com/docs/api/openapi.json');
    assert.equal(fixture.provenance.retrieved_utc, '2026-10-08');
    assert.equal(fixture.provenance.upstream_mcp_commit, '7128d68c917c7d318f3d187a9734679e404c4fc8');
    assert.deepEqual(fixture.proposal_draft.schema.required, ['bid_amount', 'delivery_days', 'proposal_text']);
    assert.equal(fixture.proposal_draft.schema.properties.bid_amount.type, 'string');
    assert.equal(fixture.proposal_draft.schema.properties.delivery_days.type, 'integer');
    assert.equal(fixture.proposal_draft.schema.properties.delivery_days.minimum, 1);
    assert.equal(fixture.proposal_draft.schema.properties.proposed_milestones.items.properties.amount.type, 'string');
    assert.equal(fixture.proposal_draft.schema.properties.proposed_milestones.items.properties.duration_days.type, 'integer');
    assert.deepEqual(fixture.delivery_draft.schema.required, ['work_summary']);
    assert.equal(fixture.delivery_draft.schema.properties.notes, undefined);
    assert.equal(fixture.proposal_draft.openapi_path, '/projects/{project_id}/proposals/drafts');
    assert.equal(fixture.delivery_draft.openapi_path, '/contracts/milestones/{milestone_id}/delivery-drafts');
  });

  test('tools/list advertises canonical draft inputs and the same tool set', async (t) => {
    const { session } = await openHarness(t);
    const listed = await session.request('tools/list', {});
    const tools = listed.result.tools;
    assert.deepEqual(tools.map((tool) => tool.name), TOOL_NAMES);

    const proposal = tools.find((tool) => tool.name === 'botdigit_stage_proposal_draft');
    const delivery = tools.find((tool) => tool.name === 'botdigit_stage_delivery_draft');
    for (const key of fixture.proposal_draft.schema.required) {
      assert.ok(proposal.inputSchema.required.includes(key), key);
    }
    assert.ok(proposal.inputSchema.required.includes('project_id'));
    assert.deepEqual(
      proposal.inputSchema.properties.bid_amount.anyOf.map((item) => item.type).sort(),
      ['integer', 'string']
    );
    assert.equal(proposal.inputSchema.properties.delivery_days.type, 'integer');
    assert.equal(proposal.inputSchema.properties.delivery_days.minimum, 1);
    assert.equal(proposal.inputSchema.properties.proposal_text.type, 'string');
    assert.equal(
      proposal.inputSchema.properties.proposed_milestones.items.properties.amount.type,
      'string'
    );
    assert.ok(proposal.inputSchema.properties.estimated_duration);
    assert.ok(proposal.inputSchema.properties.cover_letter);
    assert.ok(proposal.inputSchema.properties.milestones);
    assert.equal(proposal.inputSchema.required.includes('estimated_duration'), false);
    assert.equal(proposal.inputSchema.required.includes('cover_letter'), false);
    assert.equal(proposal.inputSchema.required.includes('milestones'), false);

    for (const key of fixture.delivery_draft.schema.required) {
      assert.ok(delivery.inputSchema.required.includes(key), key);
    }
    assert.ok(delivery.inputSchema.required.includes('milestone_id'));
    assert.equal(delivery.inputSchema.required.includes('notes'), false);
    assert.equal(delivery.inputSchema.properties.work_summary.type, 'string');
    assert.ok(delivery.inputSchema.properties.notes);
    assert.equal(delivery.inputSchema.properties.attachment_urls.type, 'array');
  });

  test('canonical proposal posts the published body with exact decimals', async (t) => {
    const body = {
      bid_amount: '1500.50',
      delivery_days: 12,
      proposal_text: 'Ship the integration.',
      proposed_milestones: [
        { title: 'Design', description: 'Wireframes', amount: '250.25', duration_days: 2 },
        { title: 'Build', amount: '0.10' }
      ],
      ai_agent_id: 'agent-test',
      ai_agent_notes: 'draft only'
    };
    const response = {
      id: 'draft_canonical',
      status: 'pending_approval',
      bid_amount: '1500.50',
      delivery_days: 12
    };
    const { loop, session } = await openHarness(t, () => ({ status: 201, json: response }));
    const result = await callTool(session, 'botdigit_stage_proposal_draft', {
      project_id: PROJECT_ID,
      ...body
    });
    assert.equal(result.isError, false, explain(result));
    assert.deepEqual(JSON.parse(result.content[0].text), response);
    assert.equal(loop.seen.length, 1);
    assertExchange(loop, loop.seen[0], {
      method: 'POST',
      url: draftPath('proposal_draft', PROJECT_ID),
      body
    });
    assertBodyFitsContract('proposal_draft', loop.seen[0].body);
    assert.equal(loop.seen[0].body.bid_amount, '1500.50');
    assert.equal(loop.seen[0].body.proposed_milestones[0].amount, '250.25');
    assert.equal(loop.seen[0].body.proposed_milestones[1].amount, '0.10');
  });

  test('legacy proposal arguments convert to the published body', async (t) => {
    const cases = [
      {
        args: {
          project_id: PROJECT_ID,
          bid_amount: 1500,
          estimated_duration: '7 Days',
          cover_letter: 'Detailed proposal cover letter',
          milestones: [{ title: 'Phase 1', amount: 500, duration_days: 4 }]
        },
        body: {
          bid_amount: '1500',
          delivery_days: 7,
          proposal_text: 'Detailed proposal cover letter',
          proposed_milestones: [{ title: 'Phase 1', amount: '500', duration_days: 4 }]
        }
      },
      {
        args: {
          project_id: PROJECT_ID,
          bid_amount: 42,
          delivery_days: '14',
          estimated_duration: 14,
          proposal_text: 'Fourteen exact days',
          milestones: []
        },
        body: {
          bid_amount: '42',
          delivery_days: 14,
          proposal_text: 'Fourteen exact days',
          proposed_milestones: []
        }
      },
      {
        args: {
          project_id: PROJECT_ID,
          bid_amount: '42.00',
          delivery_days: 7,
          estimated_duration: '7 day',
          proposal_text: 'Same text',
          cover_letter: 'Same text'
        },
        body: {
          bid_amount: '42.00',
          delivery_days: 7,
          proposal_text: 'Same text'
        }
      }
    ];
    const { loop, session } = await openHarness(t, () => ({ status: 201, json: { id: 'draft_legacy', status: 'pending_approval' } }));
    for (const sample of cases) {
      const before = loop.seen.length;
      const result = await callTool(session, 'botdigit_stage_proposal_draft', sample.args);
      assert.equal(result.isError, false, explain(result));
      assert.equal(loop.seen.length, before + 1);
      assertExchange(loop, loop.seen[before], {
        method: 'POST',
        url: draftPath('proposal_draft', PROJECT_ID),
        body: sample.body
      });
      assertBodyFitsContract('proposal_draft', loop.seen[before].body);
    }
  });

  test('canonical delivery posts work_summary', async (t) => {
    const body = {
      work_summary: 'Tests passed. PR is ready for review.',
      attachment_urls: ['https://example.com/diff?pr=1&x=y'],
      ai_agent_id: 'agent-test',
      ai_agent_notes: 'draft only'
    };
    const response = { id: 'delivery_canonical', status: 'pending_approval' };
    const { loop, session } = await openHarness(t, () => ({ status: 201, json: response }));
    const result = await callTool(session, 'botdigit_stage_delivery_draft', {
      milestone_id: MILESTONE_ID,
      ...body
    });
    assert.equal(result.isError, false, explain(result));
    assert.deepEqual(JSON.parse(result.content[0].text), response);
    assert.equal(loop.seen.length, 1);
    assertExchange(loop, loop.seen[0], {
      method: 'POST',
      url: draftPath('delivery_draft', MILESTONE_ID),
      body
    });
    assertBodyFitsContract('delivery_draft', loop.seen[0].body);
  });

  test('legacy delivery notes convert to work_summary', async (t) => {
    const cases = [
      {
        args: {
          milestone_id: MILESTONE_ID,
          notes: 'Tests passed. PR is ready for review.'
        },
        body: {
          work_summary: 'Tests passed. PR is ready for review.'
        }
      },
      {
        args: {
          milestone_id: MILESTONE_ID,
          work_summary: 'Shipped',
          notes: 'Shipped',
          attachment_urls: []
        },
        body: {
          work_summary: 'Shipped',
          attachment_urls: []
        }
      }
    ];
    const { loop, session } = await openHarness(t, () => ({ status: 201, json: { id: 'delivery_legacy', status: 'pending_approval' } }));
    for (const sample of cases) {
      const before = loop.seen.length;
      const result = await callTool(session, 'botdigit_stage_delivery_draft', sample.args);
      assert.equal(result.isError, false, explain(result));
      assert.equal(loop.seen.length, before + 1);
      assertExchange(loop, loop.seen[before], {
        method: 'POST',
        url: draftPath('delivery_draft', MILESTONE_ID),
        body: sample.body
      });
      assertBodyFitsContract('delivery_draft', loop.seen[before].body);
    }
  });

  test('ordinary API error returns the provider message and the published body', async (t) => {
    const body = {
      bid_amount: '1500.50',
      delivery_days: 12,
      proposal_text: 'Ship the integration.'
    };
    const { loop, session } = await openHarness(t, () => ({
      status: 422,
      json: { error: { code: 'closed', message: 'Project is closed' } }
    }));
    const result = await callTool(session, 'botdigit_stage_proposal_draft', {
      project_id: PROJECT_ID,
      ...body
    });
    assert.equal(result.isError, true);
    assert.match(explain(result), /Project is closed/);
    assert.equal(loop.seen.length, 1);
    assertExchange(loop, loop.seen[0], {
      method: 'POST',
      url: draftPath('proposal_draft', PROJECT_ID),
      body
    });
    assertBodyFitsContract('proposal_draft', loop.seen[0].body);
  });

  test('incomplete, invalid, and conflicting arguments send zero requests', async (t) => {
    const proposal = {
      project_id: PROJECT_ID,
      bid_amount: '1500.50',
      delivery_days: 7,
      proposal_text: 'Complete proposal'
    };
    const samples = [
      { name: 'missing proposal text', tool: 'botdigit_stage_proposal_draft', args: { project_id: PROJECT_ID, bid_amount: '10', delivery_days: 3 }, message: /proposal_text/ },
      { name: 'missing bid', tool: 'botdigit_stage_proposal_draft', args: { project_id: PROJECT_ID, delivery_days: 3, proposal_text: 'x' }, message: /bid_amount/ },
      { name: 'missing duration', tool: 'botdigit_stage_proposal_draft', args: { project_id: PROJECT_ID, bid_amount: '10', proposal_text: 'x' }, message: /delivery_days/ },
      { name: 'empty proposal text', tool: 'botdigit_stage_proposal_draft', args: { ...proposal, proposal_text: '' }, message: /proposal_text/ },
      { name: 'malformed decimal', tool: 'botdigit_stage_proposal_draft', args: { ...proposal, bid_amount: '1,500.00' }, message: /bid_amount/ },
      { name: 'trailing space on money', tool: 'botdigit_stage_proposal_draft', args: { ...proposal, bid_amount: '1500.50 ' }, message: /bid_amount/ },
      { name: 'non-integer bid number', tool: 'botdigit_stage_proposal_draft', args: { ...proposal, bid_amount: 1500.5 }, message: /bid_amount/ },
      { name: 'zero delivery days', tool: 'botdigit_stage_proposal_draft', args: { ...proposal, delivery_days: 0 }, message: /delivery_days/ },
      { name: 'fractional delivery days', tool: 'botdigit_stage_proposal_draft', args: { ...proposal, delivery_days: 1.5 }, message: /delivery_days/ },
      { name: 'inexact delivery day string', tool: 'botdigit_stage_proposal_draft', args: { ...proposal, delivery_days: '9007199254740993' }, message: /delivery_days/ },
      { name: 'prose in delivery_days', tool: 'botdigit_stage_proposal_draft', args: { ...proposal, delivery_days: '7 days' }, message: /delivery_days/ },
      { name: '2 Weeks', tool: 'botdigit_stage_proposal_draft', args: { project_id: PROJECT_ID, bid_amount: 100, estimated_duration: '2 Weeks', cover_letter: 'x' }, message: /estimated_duration/ },
      { name: 'about 7 days', tool: 'botdigit_stage_proposal_draft', args: { project_id: PROJECT_ID, bid_amount: '100', estimated_duration: 'about 7 days', proposal_text: 'x' }, message: /estimated_duration/ },
      { name: 'day range', tool: 'botdigit_stage_proposal_draft', args: { project_id: PROJECT_ID, bid_amount: '100', estimated_duration: '7-10 days', proposal_text: 'x' }, message: /estimated_duration/ },
      { name: 'one week', tool: 'botdigit_stage_proposal_draft', args: { project_id: PROJECT_ID, bid_amount: '100', estimated_duration: '1 week', proposal_text: 'x' }, message: /estimated_duration/ },
      { name: 'conflicting duration', tool: 'botdigit_stage_proposal_draft', args: { ...proposal, estimated_duration: '8 days' }, message: /conflict/ },
      { name: 'conflicting proposal text', tool: 'botdigit_stage_proposal_draft', args: { ...proposal, cover_letter: 'Other letter' }, message: /conflict/ },
      { name: 'conflicting milestone lists', tool: 'botdigit_stage_proposal_draft', args: { ...proposal, proposed_milestones: [{ title: 'A', amount: '1' }], milestones: [{ title: 'A', amount: '1' }] }, message: /conflict/ },
      { name: 'milestone missing amount', tool: 'botdigit_stage_proposal_draft', args: { ...proposal, proposed_milestones: [{ title: 'A' }] }, message: /amount/ },
      { name: 'milestone non-integer amount', tool: 'botdigit_stage_proposal_draft', args: { ...proposal, proposed_milestones: [{ title: 'A', amount: 10.25 }] }, message: /amount/ },
      { name: 'unknown proposal argument', tool: 'botdigit_stage_proposal_draft', args: { ...proposal, choose_bid: true }, message: /does not accept/ },
      { name: 'project id path breakout', tool: 'botdigit_stage_proposal_draft', args: { ...proposal, project_id: 'abc/def' }, message: /path segment/ },
      { name: 'missing delivery summary', tool: 'botdigit_stage_delivery_draft', args: { milestone_id: MILESTONE_ID }, message: /work_summary/ },
      { name: 'empty work summary', tool: 'botdigit_stage_delivery_draft', args: { milestone_id: MILESTONE_ID, work_summary: '' }, message: /work_summary/ },
      { name: 'conflicting delivery text', tool: 'botdigit_stage_delivery_draft', args: { milestone_id: MILESTONE_ID, work_summary: 'Done', notes: 'Not done' }, message: /conflict/ },
      { name: 'bad attachment list', tool: 'botdigit_stage_delivery_draft', args: { milestone_id: MILESTONE_ID, work_summary: 'Done', attachment_urls: ['ok', 2] }, message: /attachment_urls/ },
      { name: 'empty milestone id', tool: 'botdigit_stage_delivery_draft', args: { milestone_id: '', work_summary: 'Done' }, message: /path segment/ }
    ];

    const { loop, session } = await openHarness(t, () => ({ status: 201, json: { ok: true } }));
    const problems = [];
    for (const sample of samples) {
      const before = loop.seen.length;
      let result;
      try {
        result = await callTool(session, sample.tool, sample.args);
      } catch (err) {
        problems.push(`${sample.name}: threw ${err.message}`);
        continue;
      }
      const requests = loop.seen.length - before;
      const text = explain(result);
      if (!result.isError || requests !== 0 || !sample.message.test(text)) {
        problems.push(`${sample.name}: isError=${result.isError} requests=${requests} text=${text}`);
      }
    }
    assert.deepEqual(problems, []);
    assert.equal(loop.seen.length, 0);
  });

  test('unrelated tools keep their existing routes', async (t) => {
    const { loop, session } = await openHarness(t, (record) => {
      if (record.method === 'POST') return { status: 201, json: { id: 'staged', status: 'pending_approval' } };
      return { status: 200, json: { ok: true, url: record.url } };
    });
    const routes = [
      {
        tool: 'botdigit_list_projects',
        args: { limit: 2, search: 'widgets' },
        method: 'GET',
        url: '/api/developer/v1/projects?limit=2&search=widgets'
      },
      {
        tool: 'botdigit_get_project',
        args: { project_id: PROJECT_ID },
        method: 'GET',
        url: `/api/developer/v1/projects/${PROJECT_ID}`
      },
      {
        tool: 'botdigit_list_my_bids',
        args: { limit: 1, page: 2 },
        method: 'GET',
        url: '/api/developer/v1/proposals/bids?limit=1&page=2'
      },
      {
        tool: 'botdigit_approve_proposal_draft',
        args: { draft_id: DRAFT_ID },
        method: 'POST',
        url: `/api/developer/v1/proposals/drafts/${DRAFT_ID}/approve`
      },
      {
        tool: 'botdigit_get_thread',
        args: { thread_id: THREAD_ID },
        method: 'GET',
        url: `/api/developer/v1/messages/threads/${THREAD_ID}`
      },
      {
        tool: 'botdigit_stage_message_draft',
        args: { thread_id: THREAD_ID, content: 'hello' },
        method: 'POST',
        url: `/api/developer/v1/messages/threads/${THREAD_ID}/drafts`,
        body: { content: 'hello' }
      },
      {
        tool: 'botdigit_list_contracts',
        args: { status: 'active' },
        method: 'GET',
        url: '/api/developer/v1/contracts?status=active'
      },
      {
        tool: 'botdigit_list_contract_milestones',
        args: { contract_id: CONTRACT_ID },
        method: 'GET',
        url: `/api/developer/v1/contracts/${CONTRACT_ID}/milestones`
      }
    ];
    for (const route of routes) {
      const before = loop.seen.length;
      const result = await callTool(session, route.tool, route.args);
      assert.equal(result.isError, false, `${route.tool}: ${explain(result)}`);
      assert.equal(loop.seen.length, before + 1);
      assertExchange(loop, loop.seen[before], route);
    }
  });
});
