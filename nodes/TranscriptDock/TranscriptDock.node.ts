import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

export class TranscriptDock implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Transcript Dock',
		name: 'transcriptDock',
		icon: { light: 'file:transcriptdock.svg', dark: 'file:transcriptdock.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		usableAsTool: true,
		description: 'Submit video transcription jobs and retrieve transcripts',
		defaults: { name: 'Transcript Dock' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'transcriptDockApi', required: true }],
		requestDefaults: {
			baseURL: 'https://www.transcriptdock.com',
			url: '',
			headers: { Accept: 'application/json' },
			timeout: 30000,
			disableFollowRedirect: true,
		},
		properties: [
			{
				displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true,
				options: [
					{ name: 'Get Capabilities', value: 'capabilities', action: 'Get supported capabilities', description: 'Check available platforms and modes', routing: { request: { method: 'GET', url: '/v1/capabilities' } } },
					{ name: 'Get Job', value: 'getJob', action: 'Get a job', description: 'Check job status and its transcript ID', routing: { request: { method: 'GET', url: '=/v1/jobs/{{encodeURIComponent($parameter.jobId)}}' } } },
					{ name: 'Get Transcript', value: 'getTranscript', action: 'Get a transcript', description: 'Retrieve transcript text and timed segments', routing: { request: { method: 'GET', url: '=/v1/transcripts/{{encodeURIComponent($parameter.transcriptId)}}' } } },
					{ name: 'Submit Job', value: 'submitJob', action: 'Submit a transcription job', description: 'Queue a video URL with a credit limit', routing: { request: {
						method: 'POST', url: '/v1/jobs',
						headers: { 'Idempotency-Key': '={{$parameter.idempotencyKey}}' },
						body: { source: { url: '={{$parameter.url}}' }, mode: '={{$parameter.mode}}', max_credits: '={{$parameter.maxCredits}}' },
					} } },
				],
				default: 'submitJob',
			},
			{
				displayName: 'Video URL', name: 'url', type: 'string', default: '', required: true,
				placeholder: 'https://www.youtube.com/watch?v=...',
				description: 'YouTube or TikTok link for captions. Instagram Reels require AI transcription on a paid plan (beta).',
				displayOptions: { show: { operation: ['submitJob'] } },
			},
			{
				displayName: 'Mode', name: 'mode', type: 'options', default: 'captions_only',
				options: [
					{ name: 'Captions Only', value: 'captions_only', description: 'Use existing captions for 1 credit' },
					{ name: 'Auto', value: 'auto', description: 'Use captions first, then allow paid AI transcription' },
					{ name: 'Transcribe', value: 'transcribe', description: 'Use paid AI transcription' },
				],
				displayOptions: { show: { operation: ['submitJob'] } },
			},
			{
				displayName: 'Maximum Credits', name: 'maxCredits', type: 'number', default: 1,
				typeOptions: { minValue: 1, numberPrecision: 0 }, required: true,
				description: 'AI transcription costs 2 credits per started minute. This ceiling prevents a larger AI charge. Captions cost 1 credit.',
				displayOptions: { show: { operation: ['submitJob'] } },
			},
			{
				displayName: 'Idempotency Key', name: 'idempotencyKey', type: 'string', default: '', required: true,
				description: 'Use 8 to 128 printable ASCII characters per logical submission. Reuse the same key and input when retrying to avoid duplicate charges.',
				displayOptions: { show: { operation: ['submitJob'] } },
			},
			{
				displayName: 'Job ID', name: 'jobId', type: 'string', default: '', required: true,
				displayOptions: { show: { operation: ['getJob'] } },
			},
			{
				displayName: 'Transcript ID', name: 'transcriptId', type: 'string', default: '', required: true,
				displayOptions: { show: { operation: ['getTranscript'] } },
			},
		],
	};
}
