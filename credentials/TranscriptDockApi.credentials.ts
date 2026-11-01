import type { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

export class TranscriptDockApi implements ICredentialType {
	name = 'transcriptDockApi';
	displayName = 'Transcript Dock API';
	icon: Icon = { light: 'file:transcriptdock.svg', dark: 'file:transcriptdock.svg' };
	documentationUrl = 'https://www.transcriptdock.com/docs';
	properties: INodeProperties[] = [{
		displayName: 'API Key',
		name: 'apiKey',
		type: 'string',
		typeOptions: { password: true },
		default: '',
		required: true,
	}];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: { headers: { Authorization: '=Bearer {{$credentials.apiKey}}' } },
	};
	test: ICredentialTestRequest = {
		request: { baseURL: 'https://www.transcriptdock.com', url: '/v1/jobs', qs: { limit: 1 } },
	};
}
