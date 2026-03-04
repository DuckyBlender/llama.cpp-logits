import { describe, expect, it } from 'vitest';
import { ParameterSyncService } from '$lib/services/parameter-sync.service';

describe('ParameterSyncService viewLogits sync', () => {
	it('extracts viewLogits from webui_settings', () => {
		const result = ParameterSyncService.extractServerDefaults(null, {
			viewLogits: true
		});

		expect(result.viewLogits).toBe(true);
	});
});
