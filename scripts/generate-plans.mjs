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

// Use the same widths for all spacings
const widths = {
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

// Monospace TXTR
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

// Aile & Etoile TXTR
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

// Hypersevka
const hyper = TOML.parse(await readFile('scripts/hypersevka.toml')).buildPlans.Hypersevka;

const hyperPlans = [];
pbp.collectPlans['Hypersevka'] = {
	release: true,
	from: hyperPlans,
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
		hyperPlans.push(key);
	} else {
		pbp.collectPlans[key] = {
			release: true,
			from: [key],
		};
	}
}

// Iosefka Mono
const sf = TOML.parse(await readFile('scripts/iosefka-mono.toml')).buildPlans.IosefkaMono;

const sfPlans = [];
pbp.collectPlans['IosefkaMono'] = {
	release: true,
	from: sfPlans,
};

for (const [family, spacing] of [
	['Iosefka Mono', undefined],
	['Iosefka Term', 'term'],
	['Iosefka Fixed', 'fixed'],
]) {
	const plan = structuredClone(sf);

	plan.family = family;
	if (spacing) plan.spacing = spacing;

	const key = family.replace(/ /g, '');
	pbp.buildPlans[key] = plan;

	sfPlans.push(key);
}

// JDK
const jdk = TOML.parse(await readFile('scripts/jdk.toml')).buildPlans.IosevkaJDK;

const jdkPlans = [];
pbp.collectPlans['IosevkaJDK'] = {
	release: true,
	from: jdkPlans,
};

for (const [family, spacing] of [
	['Iosevka JDK', undefined],
	['Iosevka JDK Term', 'term'],
	['Iosevka JDK Fixed', 'fixed'],
]) {
	const plan = structuredClone(jdk);

	plan.family = family;
	if (spacing) plan.spacing = spacing;

	const key = family.replace(/ /g, '');
	pbp.buildPlans[key] = plan;

	jdkPlans.push(key);
}

// Set standard options for all plans
for (const [key, plan] of Object.entries(pbp.buildPlans)) {
	plan.buildTextureFeature = true;
	plan.widths = widths;

	if (!key.endsWith('Txtr')) {
		plan.noCvSs = true;
		plan.exportGlyphNames = false;
		(plan.snapshotFeature ??= {}).NWID = plan.spacing === 'term' || plan.spacing === 'fixed' ? 1 : 0;
	}
}

await writeFile('private-build-plans.toml', TOML.stringify(pbp));
