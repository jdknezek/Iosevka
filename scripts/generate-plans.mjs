#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import TOML from '@iarna/toml';

// Original input
const bp = TOML.parse(await readFile('build-plans.toml'));

// Custom output
const pbp = {};
pbp.buildOptions = { optimizeWithTtx: false };
pbp.buildPlans = {};
pbp.collectPlans = {};

// Create TXTR versions of Iosevka [Aile/Etoile]
// Monospace
const txtrPlans = [];
pbp.collectPlans['IosevkaTxtr'] = {
	release: true,
	from: txtrPlans,
};

for (const base of ['', 'Term', 'Fixed']) {
	const oldKey = `Iosevka${base}`;
	const plan = structuredClone(bp.buildPlans[oldKey]);

	const newKey = oldKey + 'Txtr';
	pbp.buildPlans[newKey] = plan;

	txtrPlans.push(newKey);
}

// Aile & Etoile
for (const family of ['Aile', 'Etoile']) {
	const oldKey = `Iosevka${family}`;
	const plan = structuredClone(bp.buildPlans[oldKey]);

	const newKey = oldKey + 'Txtr';
	pbp.buildPlans[newKey] = plan;
	pbp.collectPlans[newKey] = {
		release: true,
		from: [newKey],
	};
}

async function importPlans (file_name, families) {
	if (families.length < 1) {
		throw new Error('Base family name required');
	}
	if (families.length < 2) {
		families.push(`${families[0]} Term`);
	}
	if (families.length < 3) {
		families.push(`${families[0]} Fixed`);
	}

	const base = Object.values(TOML.parse(await readFile(`scripts/plans/${file_name}.toml`)).buildPlans)[0];

	const mono_collect_plans = [];

	const spacings = ['', 'term', 'fixed', 'quasi-proportional'];
	for (let i = 0; i < families.length; i++) {
		const plan = structuredClone(base);
		const family = families[i];
		const key = family.replace(/ /g, '');
		const spacing = spacings[i];

		if (i === 0) {
			pbp.collectPlans[key] = {
				release: true,
				from: mono_collect_plans
			};
		}

		plan.family = family;
		if (spacing) plan.spacing = spacing;

		pbp.buildPlans[key] = plan;

		if (spacing !== 'quasi-porportional') {
			mono_collect_plans.push(key);
		} else {
			// Quasi-proportional get their own collect plan
			pbp.collectPlans[key] = {
				release: true,
				from: [key],
			};
		}
	}
}

await Promise.all([
	importPlans('hypersevka', ['Hypersevka', /*'Hypersevka Term', 'Hypersevka Fixed' , 'Hypersevka Prop'*/]),
	importPlans('iosefka-mono', ['Iosefka Mono', 'Iosefka Term', 'Iosefka Fixed']),
	importPlans('jdk', ['Iosevka JDK']),
	importPlans('sans', ['Iosevka Sans']),
]);

// Set standard options for all plans
for (const [key, plan] of Object.entries(pbp.buildPlans)) {
	plan.buildTextureFeature = true;

	// Use the same widths for all spacings
	plan.widths = {
		Normal: {
			shape: 500,
			menu: 5,
			css: 'normal',
		},
		Extended: {
			shape: 600,
			menu: 7,
			css: 'expanded',
		},
	};

	if (!key.endsWith('Txtr')) {
		plan.noCvSs = true;
		plan.exportGlyphNames = false;
		(plan.snapshotFeature ??= {}).NWID = plan.spacing === 'term' || plan.spacing === 'fixed' ? 1 : 0;
	}
}

await writeFile('private-build-plans.toml', TOML.stringify(pbp));
