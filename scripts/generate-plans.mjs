#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import TOML from '@iarna/toml';

// Original input
const bp = TOML.parse(await readFile('build-plans.toml'));

// Custom output
const pbp = {};
pbp.buildPlans = {};
pbp.collectPlans = {};

const ss08Plans = [];
pbp.collectPlans['IosevkaCustom'] = {
	release: true,
	from: ss08Plans,
};

// Only include normal width
const widths = {
	normal: {
		shape: 500,
		menu: 5,
		css: 'normal',
	},
};

// Monospace SS08
for (const base of ['SS08', 'TermSS08', 'FixedSS08']) {
	const oldKey = `Iosevka${base}`;
	const plan = structuredClone(bp.buildPlans[oldKey]);

	plan.family = plan.family.replace('SS08', 'Custom');

	const newKey = oldKey.replace('SS08', 'Custom');
	pbp.buildPlans[newKey] = plan;
	ss08Plans.push(newKey);
}

// Proportional SS08
{
	const plan = structuredClone(pbp.buildPlans['IosevkaCustom']);

	plan.family = plan.family.replace('Custom', 'Prop Custom');
	plan.spacing = 'quasi-proportional';

	const newKey = 'IosevkaPropCustom';
	pbp.buildPlans[newKey] = plan;
	// ss08Plans.push(newKey);

	pbp.collectPlans[newKey] = {
		release: true,
		from: [newKey],
	};
}

// Aile & Etoile
for (const family of ['Aile', 'Etoile']) {
	const oldKey = `Iosevka${family}`;
	const plan = structuredClone(bp.buildPlans[oldKey]);

	plan.family += ' Custom';

	const newKey = oldKey + 'Custom';
	pbp.buildPlans[newKey] = plan;
	pbp.collectPlans[newKey] = {
		release: true,
		from: [newKey],
	};
}

// Hypersevka
const hyper = TOML.parse(await readFile('scripts/hypersevka.toml')).buildPlans.Hypersevka;

const hypersevkaPlans = [];
pbp.collectPlans['Hypersevka'] = {
	release: true,
	from: hypersevkaPlans,
};

for (const [family, spacing] of [
	['Hypersevka', undefined],
	['Hypersevka Term', 'term'],
	['Hypersevka Fixed', 'fixed'],
	['Hypersevka Prop', 'quasi-proportional'],
]) {
	const plan = structuredClone(hyper);

	plan.family = family;
	if (spacing) plan.spacing = spacing;

	const key = family.replace(/ /g, '');
	pbp.buildPlans[key] = plan;

	if (spacing !== 'quasi-proportional') {
		hypersevkaPlans.push(key);
	} else {
		pbp.collectPlans[key] = {
			release: true,
			from: [key],
		};
	}
}

// Set standard options for all plans
for (const [key, plan] of Object.entries(pbp.buildPlans)) {
	plan.buildTextureFeature = true;
	plan.noCvSs = true;
	(plan.snapshotFeature ??= {}).NWID = plan.spacing === 'term' || plan.spacing === 'fixed' ? 1 : 0;
	plan.widths = widths;
}

await writeFile('private-build-plans.toml', TOML.stringify(pbp));
