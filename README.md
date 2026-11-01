# Transcript Dock for n8n

Submit video transcription jobs and retrieve timed transcripts with your own Transcript Dock API key.

## Status

In development. Not published to npm or verified by n8n yet. No live transcription request has been executed as part of these local checks.

## Credentials

Create a key at https://www.transcriptdock.com/dashboard/developer and save it in an n8n **Transcript Dock API** credential. The credential test only lists one job. It does not submit work or spend transcription credits. Keep keys out of workflow JSON, screenshots and source control.

## Actions

* **Submit Job** queues a URL and returns the actual job status and ID. It does not wait for a transcript.
* **Get Job** checks status. Only `succeeded` has a usable `result_id`. Handle `failed` and `cancelled` separately.
* **Get Transcript** retrieves text and timed segments using a successful job's `result_id`.
* **Get Capabilities** checks the platforms and modes available to your account.

Captions Only is the default and costs 1 credit for YouTube or TikTok captions. Auto allows AI fallback. Transcribe requests AI directly. AI transcription requires a paid Transcript Dock plan and costs 2 credits per started minute. Instagram Reels use AI transcription on paid plans in beta. The maximum credits field caps AI spend; its default of 1 deliberately cannot pay for one AI minute. Increase it explicitly before choosing AI.

Set an idempotency key of 8 to 128 printable ASCII characters for each logical submission. Keep that key and the input unchanged on retries. A key derived only from a video URL will reuse the existing submission even on a later workflow run. A key derived from an execution ID is new on a new execution. For recovery across executions, use a persistent business event ID instead. Do not enable automatic retries with a changing key.

## Example flow

Start with a Manual Trigger and a video URL. Add Submit Job in Captions Only mode. Set a stable idempotency key such as `video-event-12345678`. Save the returned job ID. Use a Wait node followed by Get Job and an IF or Switch node:

* `succeeded`: fetch Get Transcript with `result_id`.
* `failed` or `cancelled`: stop and inspect the error. Do not treat it as an empty transcript.
* `queued`, `processing` or `awaiting_provider`: wait and poll again, with a bounded number of attempts and a deadline.

Requests use the fixed production origin and refuse redirects. API validation and HTTP errors propagate through n8n. This node does not automatically retry a failed job or upload files. You can use n8n's HTTP Request node for the rest of the [public API](https://www.transcriptdock.com/docs).

## Development

Use Node 24 and npm. From this directory:

```sh
npm ci --ignore-scripts
npm run build
npm run lint
npm test
npm pack --dry-run
```

Start a local n8n instance with `npm run dev` for editor testing. Follow the [official n8n development instructions](https://docs.n8n.io/connect/create-nodes/build-your-node/using-the-n8n-node-tool). Use a real account key only in n8n's credential store. Any live test that submits a job needs a separate credit budget authorization.

Publish only from the dedicated public TranscriptDock source repository using GitHub Actions with npm provenance. Configure npm's trusted publisher for that repository and workflow before running the release. Do not copy personal account credentials into this package. Submit to the n8n Creator Portal only after the package is published and editor testing is complete.

Support: transcriptdock@volods.com

[Website](https://www.transcriptdock.com/?utm_source=n8n&utm_medium=directory&utm_campaign=launch) · [API documentation](https://www.transcriptdock.com/docs)
