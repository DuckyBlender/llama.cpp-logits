import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChatService } from '$lib/services/chat.service';
import { MessageRole } from '$lib/enums';

describe('ChatService logits mode', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('forces n_probs and disables post_sampling_probs when viewLogits is enabled', async () => {
		const fetchMock = vi.fn<
			(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
		>(async () => {
			return new Response(
				JSON.stringify({
					choices: [
						{
							message: {
								content: 'ok'
							}
						}
					]
				}),
				{ status: 200 }
			);
		});

		vi.stubGlobal('fetch', fetchMock);

		await ChatService.sendMessage(
			[{ role: MessageRole.USER, content: 'hello' }],
			{
				stream: false,
				viewLogits: true,
				custom: JSON.stringify({
					n_probs: 0,
					post_sampling_probs: true
				})
			}
		);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const requestInit = fetchMock.mock.calls[0]?.[1];
		const body = JSON.parse(String(requestInit?.body ?? '{}'));

		expect(body.n_probs).toBe(1);
		expect(body.post_sampling_probs).toBe(false);
	});

	it('extracts token probabilities from stream logprobs only for content chunks', async () => {
		const sseData = [
			'data: {"choices":[{"delta":{"content":"Hello"},"logprobs":{"content":[{"token":"Hello","logprob":-0.6931471805599453}]}}]}\n',
			'\n',
			'data: {"choices":[{"delta":{"reasoning_content":"Thinking..."},"logprobs":{"content":[{"token":"ShouldNotEmit","logprob":-0.1}]}}]}\n',
			'\n',
			'data: [DONE]\n',
			'\n'
		].join('');

		const fetchMock = vi.fn<
			(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
		>(async () => {
			return new Response(sseData, {
				status: 200,
				headers: { 'Content-Type': 'text/event-stream' }
			});
		});

		vi.stubGlobal('fetch', fetchMock);

		const emittedProbabilities: Array<{ token: string; probability: number }> = [];

		await ChatService.sendMessage(
			[{ role: MessageRole.USER, content: 'hello' }],
			{
				stream: true,
				onTokenProbability: (tokens: Array<{ token: string; probability: number }>) => {
					emittedProbabilities.push(...tokens);
				}
			}
		);

		expect(emittedProbabilities).toHaveLength(1);
		expect(emittedProbabilities[0].token).toBe('Hello');
		expect(emittedProbabilities[0].probability).toBeCloseTo(0.5, 6);
	});
});
