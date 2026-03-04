<script lang="ts">
	import type { ChatTokenProbability } from '$lib/types/chat';

	interface Props {
		class?: string;
		content: string;
		tokenProbabilities?: ChatTokenProbability[];
	}

	let { class: className = '', content, tokenProbabilities = [] }: Props = $props();

	const canRenderTokenColors = $derived.by(() => {
		if (!content || tokenProbabilities.length === 0) {
			return false;
		}

		const concatenatedTokens = tokenProbabilities.map((token) => token.token).join('');
		return concatenatedTokens === content;
	});

	function clampProbability(probability: number): number {
		if (!Number.isFinite(probability)) {
			return 0;
		}

		return Math.max(0, Math.min(1, probability));
	}

	function probabilityColor(probability: number): string {
		// Legacy WebUI mapping: low confidence => red, high confidence => green.
		const p = clampProbability(probability);
		const r = Math.floor(192 * (1 - p));
		const g = Math.floor(192 * p);
		return `rgba(${r}, ${g}, 0, 0.30)`;
	}
</script>

<div class="token-probability-content {className}">
	{#if canRenderTokenColors}
		{#each tokenProbabilities as token, idx (idx)}
			<span class="token-probability-chip" style:background-color={probabilityColor(token.probability)}
				>{token.token}</span
			>
		{/each}
	{:else}
		{content}
	{/if}
</div>

<style>
	.token-probability-content {
		width: 100%;
		max-width: 48rem;
		margin-top: 1.5rem;
		white-space: pre-wrap;
		word-break: break-word;
		line-height: 1.7;
	}

	.token-probability-chip {
		border-radius: 0.25rem;
		padding: 0 0.04rem;
		box-decoration-break: clone;
		-webkit-box-decoration-break: clone;
	}
</style>
