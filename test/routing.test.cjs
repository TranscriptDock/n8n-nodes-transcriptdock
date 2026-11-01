const assert = require('node:assert/strict');
const { test } = require('node:test');
const { Expression } = require('n8n-workflow');
const { TranscriptDock } = require('../dist/nodes/TranscriptDock/TranscriptDock.node');
const { TranscriptDockApi } = require('../dist/credentials/TranscriptDockApi.credentials');

// Use n8n's expression evaluator against the compiled package. No API calls.
const expression = new Expression('UTC');
const node = new TranscriptDock().description;
const operations = node.properties.find((field) => field.name === 'operation').options;
const defaults = Object.fromEntries(node.properties.map((field) => [field.name, field.default]));
function resolve(value, parameters, credentials = {}) {
	if (typeof value === 'string') {
		return expression.resolveSimpleParameterValue(value, {
			$parameter: { ...defaults, ...parameters }, $credentials: credentials,
		});
	}
	if (Array.isArray(value)) return value.map((item) => resolve(item, parameters, credentials));
	if (value && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolve(item, parameters, credentials)]));
	}
	return value;
}
function request(operation, parameters) {
	return resolve({ ...node.requestDefaults, ...operations.find((op) => op.value === operation).routing.request }, parameters);
}

test('submission defaults and AI cap preserve the contract and retry receipt', () => {
	const input = { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', idempotencyKey: 'event-12345678' };
	const first = request('submitJob', input);
	assert.deepEqual(first.body, { source: { url: input.url }, mode: 'captions_only', max_credits: 1 });
	assert.equal(first.headers['Idempotency-Key'], input.idempotencyKey);
	assert.deepEqual(request('submitJob', input), first);
	for (const mode of ['auto', 'transcribe']) {
		assert.deepEqual(request('submitJob', { ...input, mode, maxCredits: 4 }).body,
			{ source: { url: input.url }, mode, max_credits: 4 });
	}
	assert.equal(first.method, 'POST');
	assert.equal(first.url, '/v1/jobs');
});

test('IDs cannot replace the API origin or inject query parameters', () => {
	for (const id of ['https://example.org/secret', '../other?key=secret#part', 'a/b', 'é']) {
		for (const [op, field, prefix] of [['getJob', 'jobId', '/v1/jobs/'], ['getTranscript', 'transcriptId', '/v1/transcripts/']]) {
			const req = request(op, { [field]: id });
			assert.equal(req.url, prefix + encodeURIComponent(id));
			const target = new URL(req.url, req.baseURL);
			assert.equal(target.origin, 'https://www.transcriptdock.com');
			assert.equal(target.search, '');
			assert.equal(target.hash, '');
			assert.equal(req.disableFollowRedirect, true);
			assert.equal(req.method, 'GET');
		}
	}
});

test('credential test is read only and auth stays in headers', () => {
	const credential = new TranscriptDockApi();
	const secret = 'td_live_local_fixture_only';
	assert.equal(credential.properties.find((field) => field.name === 'apiKey').typeOptions.password, true);
	assert.deepEqual(resolve(credential.authenticate.properties, {}, { apiKey: secret }),
		{ headers: { Authorization: `Bearer ${secret}` } });
	assert.equal(credential.test.request.baseURL, 'https://www.transcriptdock.com');
	assert.equal(credential.test.request.url, '/v1/jobs');
	assert.deepEqual(credential.test.request.qs, { limit: 1 });
	assert.equal(credential.test.request.method ?? 'GET', 'GET');
	assert.equal(JSON.stringify(node).includes(secret), false);
	assert.equal(request('capabilities', {}).url, '/v1/capabilities');
});
