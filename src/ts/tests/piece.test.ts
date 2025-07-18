import { expect, test } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import {
  Piece,
  Phrase,
  Trajectory,
  Pitch,
  Raga,
  Group,
  Articulation,
  Chikari,
  Assemblage,
  initSecCategorization,
  durationsOfFixedPitches,
} from '@model';              // ← adjust if your alias is different
import { Meter } from '@/js/meter'; // or '../meter'
import { Instrument } from '@shared/enums';

/* -------------------------------------------------------
   Helpers for the “codex/add-test-cases-for-new-functions”
   branch (returns just a Piece)
------------------------------------------------------- */
function buildSimplePiece(): Piece {
  const raga = new Raga();
  const t1 = new Trajectory({ id: 0, pitches: [new Pitch()], durTot: 1 });
  const t2 = new Trajectory({ id: 12, pitches: [new Pitch()], durTot: 1 });
  const p1 = new Phrase({ trajectories: [t1], durTot: 1, raga });
  const p2 = new Phrase({ trajectories: [t2], durTot: 1, raga });
  const m1 = new Meter({ hierarchy: [1], tempo: 60, startTime: 0 });
  const m2 = new Meter({ hierarchy: [1], tempo: 60, startTime: 1 });
  return new Piece({
    phrases: [p1, p2],
    raga,
    meters: [m1, m2],
    instrumentation: [Instrument.Sitar],
  });
}

/* -------------------------------------------------------
   Helpers for the “porting-project” branch
   (returns an object with many handles)
------------------------------------------------------- */
function buildSimplePieceFull() {
  const raga = new Raga({ fundamental: 240 });
  const art = { '0.00': new Articulation({ strokeNickname: 'da' }) };
  const t1 = new Trajectory({ num: 0, pitches: [new Pitch()], durTot: 0.5, articulations: art });
  const t2 = new Trajectory({
    num: 1,
    pitches: [new Pitch({ swara: 'r', raised: false })],
    durTot: 0.5,
    articulations: art,
  });
  const group = new Group({ trajectories: [t1, t2] });
  const p1 = new Phrase({ trajectories: [t1, t2], raga });
  p1.groupsGrid[0].push(group);

  const t3 = new Trajectory({ num: 0, pitches: [new Pitch()], durTot: 1 });
  const p2 = new Phrase({ trajectories: [t3], raga });

  const piece = new Piece({ phrases: [p1, p2], raga, instrumentation: [Instrument.Sitar] });
  const meter = new Meter({ startTime: 0, tempo: 60 });
  return { piece, p1, p2, t1, t2, t3, group, meter };
}

/* -------------------------------------------------------
   Extra helper for the vocal-piece tests
------------------------------------------------------- */
function buildVocalPiece() {
  const raga = new Raga({ fundamental: 240 });
  const art = { '0.00': new Articulation({ strokeNickname: 'da' }) };
  const t1 = new Trajectory({ num: 0, pitches: [new Pitch()], durTot: 0.5, articulations: art });
  t1.addConsonant('ka');
  t1.updateVowel('a');
  t1.addConsonant('ga', false);

  const t2 = new Trajectory({
    num: 1,
    pitches: [new Pitch({ swara: 'r', raised: false })],
    durTot: 0.5,
    articulations: art,
  });
  t2.updateVowel('i');

  const p1 = new Phrase({ trajectories: [t1, t2], raga });
  p1.chikaris['0.25'] = new Chikari({});

  const p2 = new Phrase({ trajectories: [new Trajectory({ num: 0, pitches: [new Pitch()], durTot: 1 })], raga });

  const piece = new Piece({
    phrases: [p1, p2],
    raga,
    instrumentation: [Instrument.Vocal_M],
    sectionStarts: [0, 1],
  });

  const meter = new Meter({ startTime: 0, tempo: 60 });
  piece.addMeter(meter);

  return { piece, meter };
}

/* =======================================================
   TESTS FROM “codex/add-test-cases-for-new-functions”
======================================================= */

test('realignPitches and setDurTot', () => {
  const piece = buildSimplePiece();
  // mangle pitch ratios
  piece.phrases[0].trajectories[0].pitches[0].ratios = [1];
  piece.realignPitches();
  expect(piece.phrases[0].trajectories[0].pitches[0].ratios[0]).toBe(piece.raga.stratifiedRatios[0]);

  // extend piece duration using silent trajectory
  piece.setDurTot(3);
  expect(piece.durTot).toBe(3);
  expect(piece.durArrayGrid[0][0]).toBeCloseTo(1 / 3);
  expect(piece.phrases[1].trajectories[0].durTot).toBe(2);
  expect(piece.phrases[1].startTime).toBeCloseTo(1);
});

test('dur calculations and cleanUpSectionCategorization', () => {
  const piece = buildSimplePiece();

  // change first phrase duration
  piece.phrases[0].trajectories[0].durTot = 2;
  piece.phrases[0].durTotFromTrajectories();
  piece.durTotFromPhrases();
  expect(piece.durTot).toBe(3);

  piece.durArrayFromPhrases();
  expect(piece.durArrayGrid[0]).toEqual([2 / 3, 1 / 3]);

  // error when durTot undefined
  piece.phrases[0].durTot = undefined as unknown as number;
  expect(() => piece.durArrayFromPhrases()).toThrow();

  // cleanUpSectionCategorization
  const c = initSecCategorization();
  // remove fields to force defaults
  // @ts-ignore
  delete c['Improvisation'];
  // @ts-ignore
  delete c['Other'];
  // @ts-ignore
  delete c['Top Level'];
  c['Composition Type']['Bandish'] = true;
  piece.cleanUpSectionCategorization(c);
  expect(c['Improvisation']).toBeDefined();
  expect(c['Other']).toBeDefined();
  expect(c['Top Level']).toBe('Composition');
});

test('display helpers and meters', () => {
  const piece = buildSimplePiece();

  const divs = piece.allPhraseDivs();
  expect(divs.length).toBe(1);
  expect(divs[0].time).toBeCloseTo(1);

  const divChunks = piece.chunkedPhraseDivs(0, 1);
  expect(divChunks.length).toBe(2);
  expect(divChunks[0].length).toBe(0);
  expect(divChunks[1].length).toBe(1);

  const sargam = piece.allDisplaySargam();
  expect(sargam[0].sargam).toBeDefined();
  const sargamChunks = piece.chunkedDisplaySargam(0, 1);
  expect(sargamChunks.length).toBe(2);
  expect(sargamChunks.map(c => c.length).reduce((a, b) => a + b, 0)).toBe(sargam.length);

  const meterChunks = piece.chunkedMeters(1);
  expect(meterChunks.length).toBe(2);
  expect(meterChunks[0][0].startTime).toBe(0);
  expect(meterChunks[1][0].startTime).toBe(1);

  const badMeter = new Meter({ hierarchy: [1], tempo: 60, startTime: 0.5 });
  expect(() => piece.addMeter(badMeter)).toThrow();
});

/* =======================================================
   TESTS FROM “porting-project”
======================================================= */

const __dirname = dirname(fileURLToPath(import.meta.url));
const pieceData = JSON.parse(readFileSync(join(__dirname, 'fixtures/serialization_test.json'), 'utf-8'));

test('Piece serialization from fixture', () => {
  const piece = Piece.fromJSON(pieceData);
  const json = piece.toJSON();
  const copy = Piece.fromJSON(json);
  expect(copy.toJSON()).toEqual(json);
});

test('Piece method coverage', () => {
  const { piece, p1, p2, t1, t2, t3, group, meter } = buildSimplePieceFull();

  expect(piece.phrases.length).toBe(2);
  expect(piece.durArray).toEqual([0.5, 0.5]);
  expect(piece.sectionStarts).toEqual([0]);
  expect(piece.trajIdxs.length).toBeGreaterThan(0);
  expect(piece.trajIdxsGrid[0]).toEqual(piece.trajIdxs);

  expect(piece.chikariFreqs(0)).toEqual([piece.raga.fundamental * 2, piece.raga.fundamental * 4]);
  piece.updateFundamental(300);
  expect(piece.raga.fundamental).toBe(300);
  expect(p1.trajectories[0].pitches[0].fundamental).toBe(300);
  piece.putRagaInPhrase();
  expect(p1.raga).toBe(piece.raga);

  piece.addMeter(meter);
  expect(piece.meters.length).toBe(1);
  piece.removeMeter(meter);
  expect(piece.meters.length).toBe(0);

  expect(piece.durStarts()).toEqual([0, 1]);
  expect(piece.trajStartTimes()).toEqual([0, 0.5, 1]);
  expect(piece.trackFromTraj(t2)).toBe(0);
  expect(piece.trackFromTrajUId(t2.uniqueId!)).toBe(0);
  expect(piece.phraseFromUId(p1.uniqueId)).toBe(p1);
  expect(piece.trackFromPhraseUId(p2.uniqueId)).toBe(0);

  expect(piece.allGroups().length).toBe(1);
  expect(piece.pIdxFromGroup(group)).toBe(0);

  const allPitches = piece.allPitches();
  expect(allPitches.length).toBe(3);
  const pitchNums = allPitches.map(p => (typeof p === 'number' ? p : p.numberedPitch));
  expect(piece.highestPitchNumber).toBe(Math.max(...pitchNums));
  expect(piece.lowestPitchNumber).toBe(Math.min(...pitchNums));

  expect(piece.allTrajectories().length).toBe(3);
  expect(piece.trajFromTime(0.25, 0)).toBe(t1);
  expect(piece.trajFromTime(0.75, 0)).toBe(t2);
  expect(piece.trajFromTime(1.2, 0)).toBe(t3);
  expect(piece.trajFromUId(t1.uniqueId!, 0)).toBe(t1);
  expect(piece.phraseFromTime(1.1, 0)).toBe(p2);
  expect(piece.phraseIdxFromTime(1.1, 0)).toBe(1);

  const chunks = piece.chunkedTrajs(0, 1);
  expect(chunks[0].length).toBe(2);
  expect(chunks[1].length).toBe(1);

  const chunksSmall = piece.chunkedTrajs(0, 0.75);
  expect(chunksSmall.length).toBe(3);
  expect(chunksSmall[0].length).toBe(2);
  expect(chunksSmall[1].length).toBe(2);
  expect(chunksSmall[2].length).toBe(1);

  const bols = piece.allDisplayBols();
  expect(bols.length).toBeGreaterThan(0);
  expect(piece.chunkedDisplayBols(0, 1)[0].length).toBe(bols.filter(b => b.time < 1).length);

  const dur = piece.durationsOfFixedPitches();
  expect(Object.keys(dur).length).toBeGreaterThan(0);
  const prop = piece.proportionsOfFixedPitches();
  expect(Object.keys(prop)).toEqual(Object.keys(dur));

  const chromaDur = piece.durationsOfFixedPitches({ outputType: 'chroma' });
  expect(Object.keys(chromaDur).length).toBeGreaterThan(0);
  const chromaProp = piece.proportionsOfFixedPitches({ outputType: 'chroma' });
  expect(Object.keys(chromaProp)).toEqual(Object.keys(chromaDur));

  const degreeDur = piece.durationsOfFixedPitches({ outputType: 'scaleDegree' });
  expect(Object.keys(degreeDur).length).toBeGreaterThan(0);
  const degreeProp = piece.proportionsOfFixedPitches({ outputType: 'scaleDegree' });
  expect(Object.keys(degreeProp)).toEqual(Object.keys(degreeDur));

  const sargamDur = piece.durationsOfFixedPitches({ outputType: 'sargamLetter' });
  expect(Object.keys(sargamDur).length).toBeGreaterThan(0);
  const sargamProp = piece.proportionsOfFixedPitches({ outputType: 'sargamLetter' });
  expect(Object.keys(sargamProp)).toEqual(Object.keys(sargamDur));

  expect(piece.mostRecentTraj(0.6, 0)).toBeInstanceOf(Trajectory);
  expect(piece.sIdxFromPIdx(1)).toBe(0);
});

test('Piece allPitches removes sequential duplicates when repetition=false', () => {
  const raga = new Raga();
  const p1 = new Pitch({ swara: 'sa' });
  const t1 = new Trajectory({ num: 0, phraseIdx: 0, pitches: [p1] });
  const t2 = new Trajectory({ num: 1, phraseIdx: 0, pitches: [new Pitch({ swara: 'sa' })] });
  const t3 = new Trajectory({ num: 2, phraseIdx: 0, pitches: [new Pitch({ swara: 're' })] });
  const phrase = new Phrase({ trajectories: [t1, t2, t3], raga });
  const piece = new Piece({ phrases: [phrase], raga, instrumentation: [Instrument.Sitar] });

  expect(piece.allPitches().length).toBe(3);
  expect(piece.allPitches({ repetition: false })).toEqual([p1, t3.pitches[0]]);
});

test('Piece display and sections', () => {
  const { piece, meter } = buildVocalPiece();

  expect(piece.sections.length).toBe(2);
  expect(piece.sectionsGrid[0].length).toBe(2);

  const vowels = piece.allDisplayVowels();
  expect(vowels.length).toBeGreaterThan(0);
  expect(piece.chunkedDisplayVowels(0, 1)[0].length).toBe(vowels.filter(v => v.time < 1).length);

  const cons = piece.allDisplayEndingConsonants();
  expect(cons.length).toBeGreaterThan(0);
  expect(piece.chunkedDisplayConsonants(0, 1)[0].length).toBe(cons.filter(c => c.time < 1).length);

  const chiks = piece.allDisplayChikaris();
  expect(chiks.length).toBeGreaterThan(0);
  expect(piece.chunkedDisplayChikaris(0, 1)[0].length).toBe(chiks.filter(c => c.time < 1).length);

  const pid = meter.allPulses[0].uniqueId;
  expect(piece.pulseFromId(pid)).toBe(meter.allPulses[0]);
});

// -------------------------------------------------------
//  Additional tests for multi-track functionality and
//  serialization of optional Piece properties
// -------------------------------------------------------

function buildMultiTrackPiece() {
  const raga = new Raga({ fundamental: 200 });
  const tA1 = new Trajectory({ num: 0, pitches: [new Pitch()], durTot: 0.5 });
  const tA2 = new Trajectory({ num: 1, pitches: [new Pitch()], durTot: 0.5 });
  const group = new Group({ trajectories: [tA1, tA2] });
  const pA = new Phrase({ trajectories: [tA1, tA2], raga });
  pA.groupsGrid[0].push(group);

  const tB1 = new Trajectory({ num: 0, pitches: [new Pitch()], durTot: 1 });
  const pB = new Phrase({ trajectories: [tB1], raga });

  const piece = new Piece({
    phraseGrid: [[pA], [pB]],
    instrumentation: [Instrument.Sitar, Instrument.Vocal_M],
    raga,
  });

  return { piece, group, tA1, tA2, tB1 };
}

test('track and group helpers on multiple tracks', () => {
  const { piece, group, tA1, tA2, tB1 } = buildMultiTrackPiece();

  expect(piece.trackFromTraj(tA1)).toBe(0);
  expect(piece.trackFromTraj(tB1)).toBe(1);
  expect(piece.trackFromTrajUId(tA2.uniqueId!)).toBe(0);
  expect(piece.pIdxFromGroup(group)).toBe(0);
  expect(piece.mostRecentTraj(0.75, 0)).toBe(tA1);

  // add a chikari so frequencies come from it
  const chikari = new Chikari({ fundamental: piece.raga.fundamental });
  piece.phraseGrid[0][0].chikaris['0.00'] = chikari;
  expect(piece.chikariFreqs(0)).toEqual(chikari.pitches.slice(0, 2).map(p => p.frequency));
});

test('meters and instrumentation update duration arrays', () => {
  const piece = buildSimplePiece();
  const original = JSON.stringify(piece.durArrayGrid);

  const m = new Meter({ startTime: 2.1, tempo: 60, hierarchy: [1] });
  piece.addMeter(m);
  piece.removeMeter(m);
  expect(JSON.stringify(piece.durArrayGrid)).toBe(original);

  // add a second track
  piece.instrumentation.push(Instrument.Vocal_M);
  const newPhrase = new Phrase({ trajectories: [new Trajectory({ num: 0, pitches: [new Pitch()], durTot: 2 })], raga: piece.raga });
  piece.phraseGrid.push([newPhrase]);
  piece.durArrayGrid.push([]);
  piece.sectionStartsGrid.push([0]);
  piece.sectionCatGrid.push(piece.sectionCatGrid[0].map(() => initSecCategorization()));
  piece.adHocSectionCatGrid.push(piece.adHocSectionCatGrid[0].map(() => []));
  piece.durArrayFromPhrases();
  expect(piece.durArrayGrid.length).toBe(2);

  // remove the track
  piece.instrumentation.pop();
  piece.phraseGrid.pop();
  piece.durArrayGrid.pop();
  piece.sectionStartsGrid.pop();
  piece.sectionCatGrid.pop();
  piece.adHocSectionCatGrid.pop();
  piece.durArrayFromPhrases();
  expect(JSON.stringify(piece.durArrayGrid)).toBe(original);
});

test('excerptRange and assemblageDescriptors serialization', () => {
  const p = new Phrase({ trajectories: [new Trajectory()] });
  const piece = new Piece({ phrases: [p], raga: new Raga() });
  piece.excerptRange = { start: 1, end: 2 };

  const assemblage = new Assemblage(Instrument.Sitar, 'a');
  assemblage.addPhrase(p);
  piece.assemblageDescriptors = [assemblage.descriptor];

  const json = piece.toJSON();
  const copy = Piece.fromJSON(json);
  expect(copy.excerptRange).toEqual(piece.excerptRange);
  expect(copy.assemblageDescriptors).toEqual(piece.assemblageDescriptors);
});

test('Piece serialization reconnects groups and fixes slide articulation', () => {
  const raga = new Raga();
  const artics = { '0.00': new Articulation({ name: 'slide' }) };
  const t1 = new Trajectory({ num: 0, pitches: [new Pitch()], durTot: 0.5, articulations: artics });
  const t2 = new Trajectory({ num: 1, pitches: [new Pitch()], durTot: 0.5 });
  const phrase = new Phrase({ trajectories: [t1, t2], raga });
  const group = new Group({ trajectories: [t1, t2] });
  phrase.groupsGrid[0].push(group);

  const piece = new Piece({ phrases: [phrase], raga, instrumentation: [Instrument.Sitar] });

  const clone = Piece.fromJSON(piece.toJSON());

  const reconstructed = clone.phrases[0].groupsGrid[0][0];
  expect(reconstructed).toBeInstanceOf(Group);
  expect(reconstructed.trajectories[0]).toBe(clone.phrases[0].trajectoryGrid[0][0]);
  expect(reconstructed.trajectories[1]).toBe(clone.phrases[0].trajectoryGrid[0][1]);
  expect(clone.phrases[0].trajectoryGrid[0][0].articulations['0.00'].name).toBe('pluck');
});
  
test('durations and proportions for each output type', () => {
  const raga = new Raga();
  const t1 = new Trajectory({ id: 0, pitches: [new Pitch({ swara: 0 })], durTot: 1 });
  const t2 = new Trajectory({ id: 0, pitches: [new Pitch({ swara: 1 })], durTot: 2 });
  const phrase = new Phrase({ trajectories: [t1, t2], raga });
  const piece = new Piece({ phrases: [phrase], raga, instrumentation: [Instrument.Sitar] });

  const np1 = t1.pitches[0].numberedPitch;
  const np2 = t2.pitches[0].numberedPitch;

  const durPN = piece.durationsOfFixedPitches();
  expect(durPN).toEqual({ [np1]: 1, [np2]: 2 });

  const propPN = piece.proportionsOfFixedPitches();
  expect(propPN[np1]).toBeCloseTo(1 / 3);
  expect(propPN[np2]).toBeCloseTo(2 / 3);

  const c1 = Pitch.pitchNumberToChroma(np1);
  const c2 = Pitch.pitchNumberToChroma(np2);
  expect(piece.durationsOfFixedPitches({ outputType: 'chroma' })).toEqual({ [c1]: 1, [c2]: 2 });
  expect(piece.proportionsOfFixedPitches({ outputType: 'chroma' })).toEqual({ [c1]: 1 / 3, [c2]: 2 / 3 });

  const sd1 = Pitch.chromaToScaleDegree(c1)[0];
  const sd2 = Pitch.chromaToScaleDegree(c2)[0];
  expect(piece.durationsOfFixedPitches({ outputType: 'scaleDegree' })).toEqual({ [sd1]: 1, [sd2]: 2 });
  expect(piece.proportionsOfFixedPitches({ outputType: 'scaleDegree' })).toEqual({ [sd1]: 1 / 3, [sd2]: 2 / 3 });

  const sarg1 = Pitch.fromPitchNumber(np1).sargamLetter;
  const sarg2 = Pitch.fromPitchNumber(np2).sargamLetter;
  expect(piece.durationsOfFixedPitches({ outputType: 'sargamLetter' })).toEqual({ [sarg1]: 1, [sarg2]: 2 });
  expect(piece.proportionsOfFixedPitches({ outputType: 'sargamLetter' })).toEqual({ [sarg1]: 1 / 3, [sarg2]: 2 / 3 });
});

/* -------------------------------------------------------
   Additional tests requested by Codex task
------------------------------------------------------- */

function buildGroupedPiece() {
  const raga = new Raga();
  const t1 = new Trajectory({ num: 0, pitches: [new Pitch()], durTot: 0.5 });
  const t2 = new Trajectory({ num: 1, pitches: [new Pitch()], durTot: 0.5 });
  const g1 = new Group({ trajectories: [t1, t2] });
  const p1 = new Phrase({ trajectories: [t1, t2], raga });
  p1.groupsGrid[0].push(g1);

  const t3 = new Trajectory({ num: 0, pitches: [new Pitch()], durTot: 0.5 });
  const t4 = new Trajectory({ num: 1, pitches: [new Pitch()], durTot: 0.5 });
  const g2 = new Group({ trajectories: [t3, t4] });
  const p2 = new Phrase({ trajectories: [t3, t4], raga });
  p2.groupsGrid[0].push(g2);

  const piece = new Piece({ phrases: [p1, p2], raga, instrumentation: [Instrument.Sitar] });
  return { piece, g1, g2 };
}

test('trackFromTrajUId throws when id not found', () => {
  const { piece } = buildSimplePieceFull();
  expect(() => piece.trackFromTrajUId('missing')).toThrow('Trajectory not found');
});

test('pIdxFromGroup works across phrases', () => {
  const { piece, g1, g2 } = buildGroupedPiece();
  expect(piece.pIdxFromGroup(g1)).toBe(0);
  expect(piece.pIdxFromGroup(g2)).toBe(1);
});

test('mostRecentTraj and chikariFreqs with chikaris', () => {
  const { piece } = buildVocalPiece();
  const firstTraj = piece.phraseGrid[0][0].trajectories[0];
  const chikari = piece.phraseGrid[0][0].chikaris['0.25'];
  expect(piece.mostRecentTraj(0.6, 0)).toBe(firstTraj);
  expect(piece.chikariFreqs(0)).toEqual(chikari.pitches.slice(0, 2).map(p => p.frequency));
});

test('addMeter overlap detection and removeMeter correctness', () => {
  const raga = new Raga();
  const traj = new Trajectory({ num: 0, pitches: [new Pitch()], durTot: 1 });
  const phrase = new Phrase({ trajectories: [traj], raga });
  const piece = new Piece({ phrases: [phrase], raga, instrumentation: [Instrument.Sitar] });

  const m1 = new Meter({ startTime: 0, tempo: 60 });
  const m2 = new Meter({ startTime: 5, tempo: 60 });
  piece.addMeter(m1);
  piece.addMeter(m2);
  const overlap = new Meter({ startTime: 3, tempo: 60 });
  expect(() => piece.addMeter(overlap)).toThrow('meters overlap');

  piece.removeMeter(m1);
  expect(piece.meters.length).toBe(1);
  expect(piece.meters[0]).toBe(m2);
});


// -------------------------------------------------------
//  Tests for cleanUpSectionCategorization paths
// -------------------------------------------------------

test('cleanUpSectionCategorization populates defaults when fields missing', () => {
  const piece = buildSimplePiece();
  const c = initSecCategorization();
  // remove several fields
  // @ts-ignore
  delete c['Improvisation'];
  // @ts-ignore
  delete c['Other'];
  // @ts-ignore
  delete c['Top Level'];
  piece.cleanUpSectionCategorization(c as any);
  expect(c['Improvisation']).toBeDefined();
  expect(c['Other']).toBeDefined();
  expect(c['Top Level']).toBe('None');
});

test('Comp.-section/Tempo fallback replaces old field', () => {
  const piece = buildSimplePiece();
  const c = initSecCategorization();
  // simulate old field
  // @ts-ignore
  delete c['Comp.-section/Tempo'];
  // @ts-ignore
  c['Composition-section/Tempo'] = { 'Madhya': true };
  // @ts-ignore
  delete c['Top Level'];
  piece.cleanUpSectionCategorization(c as any);
  expect(c['Comp.-section/Tempo']['Madhya']).toBe(true);
  // @ts-ignore
  expect(c['Composition-section/Tempo']).toBeUndefined();
  expect(c['Top Level']).toBe('Composition');
});

const topLevelCases = [
  {
    label: 'Pre-Chiz Alap',
    modify: (c: any) => { c['Pre-Chiz Alap']['Pre-Chiz Alap'] = true; },
    expected: 'Pre-Chiz Alap',
  },
  {
    label: 'Alap section',
    modify: (c: any) => { c['Alap']['Alap'] = true; },
    expected: 'Alap',
  },
  {
    label: 'Composition type',
    modify: (c: any) => { c['Composition Type']['Bandish'] = true; },
    expected: 'Composition',
  },
  {
    label: 'Comp.-section/Tempo',
    modify: (c: any) => { c['Comp.-section/Tempo']['Vilambit'] = true; },
    expected: 'Composition',
  },
  {
    label: 'Improvisation',
    modify: (c: any) => { c['Improvisation']['Improvisation'] = true; },
    expected: 'Improvisation',
  },
  {
    label: 'Other',
    modify: (c: any) => { c['Other']['Other'] = true; },
    expected: 'Other',
  },
  {
    label: 'None',
    modify: (_c: any) => {},
    expected: 'None',
  },
];

test.each(topLevelCases)('Top Level classification %s', ({ modify, expected }) => {
  const piece = buildSimplePiece();
  const c = initSecCategorization();
  // remove top level so the function computes it
  // @ts-ignore
  delete c['Top Level'];
  modify(c);
  piece.cleanUpSectionCategorization(c as any);
  expect(c['Top Level']).toBe(expected);
});

test('allDisplayVowels throws for non-vocal instrumentation', () => {
  const raga = new Raga();
  const traj = new Trajectory({ num: 0, pitches: [new Pitch()], durTot: 1 });
  const phrase = new Phrase({ trajectories: [traj], raga });
  const piece = new Piece({ phrases: [phrase], raga, instrumentation: [Instrument.Sitar] });

  expect(() => piece.allDisplayVowels()).toThrow('instrumentation is not vocal');
});

test('allPitches throws when a pitch array contains a number', () => {
  const raga = new Raga();
  const traj = new Trajectory({ num: 0, pitches: [new Pitch()], durTot: 1 });
  (traj.pitches as any).push(0);
  const phrase = new Phrase({ trajectories: [traj], raga });
  const piece = new Piece({ phrases: [phrase], raga, instrumentation: [Instrument.Sitar] });
  expect(() => piece.allPitches({ repetition: false })).toThrow('pitch is a number');
});

test('allPitches returns numbers with pitchNumber option', () => {
  const piece = buildSimplePiece();
  const nums = piece.allPitches({ pitchNumber: true }) as number[];
  expect(nums.every(n => typeof n === 'number')).toBe(true);
  expect(nums.length).toBeGreaterThan(0);
});

test('trajFromTime after last trajectory returns undefined', () => {
  const piece = buildSimplePiece();
  const after = (piece.durTot ?? 0) + 1;
  expect(piece.trajFromTime(after, 0)).toBeUndefined();
});

test('trajFromUId throws when not found', () => {
  const piece = buildSimplePiece();
  expect(() => piece.trajFromUId('missing', 0)).toThrow('Trajectory not found');
})


test('trackFromTraj throws when trajectory not found', () => {
  const { piece } = buildSimplePieceFull();
  const missing = new Trajectory({ num: 99, pitches: [new Pitch()], durTot: 1 });
  expect(() => piece.trackFromTraj(missing)).toThrow('Trajectory not found');
});

test('phraseFromUId and trackFromPhraseUId throw when id not found', () => {
  const { piece } = buildSimplePieceFull();
  expect(() => piece.phraseFromUId('missing')).toThrow('Phrase not found');
  expect(() => piece.trackFromPhraseUId('missing')).toThrow('Phrase not found');
});


test('durStarts throws when durArray is missing', () => {
  const piece = buildSimplePiece();
  // @ts-ignore - simulate deleted property
  piece.durArray = undefined;
  expect(() => piece.durStarts()).toThrow('durArray is undefined');
});

test('durStarts throws when durTot is missing', () => {
  const piece = buildSimplePiece();
  // Ensure durArray exists
  piece.durArray = [0.5, 0.5];
  // @ts-ignore - remove durTot
  piece.durTot = undefined;
  expect(() => piece.durStarts()).toThrow('durTot is undefined');
});


test('addMeter rejects meter that encloses an existing meter', () => {
  const raga = new Raga();
  const traj = new Trajectory({ num: 0, pitches: [new Pitch()], durTot: 1 });
  const phrase = new Phrase({ trajectories: [traj], raga });
  const piece = new Piece({ phrases: [phrase], raga, instrumentation: [Instrument.Sitar] });

  const base = new Meter({ startTime: 0, tempo: 60 });
  piece.addMeter(base);

  const enclosing = new Meter({ startTime: -1, hierarchy: [8], tempo: 60 });
  expect(() => piece.addMeter(enclosing)).toThrow('meters overlap');

  const later = new Meter({ startTime: 5, tempo: 60 });
  piece.addMeter(later);
  expect(piece.meters).toEqual([base, later]);
});
// -------------------------------------------------------
//  Extra constructor coverage for Codex task
// -------------------------------------------------------

test('durArray branch and empty sectionCatGrid', () => {
  const raga = new Raga();
  const traj = new Trajectory({ num: 0, pitches: [new Pitch()], durTot: 1 });
  const phrase = new Phrase({ trajectories: [traj], raga });

  const piece = new Piece({
    phrases: [phrase],
    durTot: 1,
    durArray: [1],
    instrumentation: [Instrument.Sitar],
    raga,
    sectionStarts: [0],
    sectionCatGrid: [],
  });

  expect(piece.durArrayGrid).toEqual([[1]]);
  expect(piece.sectionCatGrid.length).toBe(1);
  expect(piece.sectionCatGrid[0].length).toBe(piece.sectionStartsGrid[0].length);
});

test('sectionCategorization cleanup and defaults with multi instrumentation', () => {
  const raga = new Raga();
  const sc = [initSecCategorization()];
  // remove fields so cleanup runs
  // @ts-ignore
  delete sc[0]['Improvisation'];
  // @ts-ignore
  delete sc[0]['Other'];
  // @ts-ignore
  delete sc[0]['Top Level'];

  const piece = new Piece({
    sectionStarts: [0],
    sectionCategorization: sc,
    instrumentation: [Instrument.Sitar, Instrument.Vocal_M],
    raga,
    phrases: [],
  });

  expect(sc[0]['Improvisation']).toBeDefined();
  expect(sc[0]['Other']).toBeDefined();
  expect(sc[0]['Top Level']).toBeDefined();
  expect(piece.adHocSectionCatGrid.length).toBe(2);
  expect(piece.durTot).toBe(1);
  expect(piece.explicitPermissions).toEqual({ edit: [], view: [], publicView: true });
  expect(piece.assemblageDescriptors).toEqual([]);
});

test('durTot provided and explicitPermissions persist', () => {
  const raga = new Raga();
  const perms = { edit: ['a'], view: ['b'], publicView: false };

  const piece = new Piece({
    phrases: [],
    durTot: 5,
    instrumentation: [Instrument.Sitar],
    raga,
    explicitPermissions: perms,
  });

  expect(piece.durTot).toBe(5);
  expect(piece.durArray).toEqual([]);
  expect(piece.explicitPermissions).toEqual(perms);
  expect(piece.assemblageDescriptors).toEqual([]);
});

//  Tests for standalone durationsOfFixedPitches helper
// -------------------------------------------------------

test('durationsOfFixedPitches throws SyntaxError for invalid traj output', () => {
  const badTraj = {
    durationsOfFixedPitches: () => 5,
  } as unknown as Trajectory;

  expect(() => durationsOfFixedPitches([badTraj])).toThrow(SyntaxError);
});

test('durationsOfFixedPitches proportional count normalizes totals', () => {
  const t1 = new Trajectory({ id: 0, pitches: [new Pitch({ swara: 0 })], durTot: 1 });
  const t2 = new Trajectory({ id: 0, pitches: [new Pitch({ swara: 1 })], durTot: 2 });
  const np1 = t1.pitches[0].numberedPitch;
  const np2 = t2.pitches[0].numberedPitch;

  const result = durationsOfFixedPitches([t1, t2], { countType: 'proportional' });

  expect(result[np1]).toBeCloseTo(1 / 3);
  expect(result[np2]).toBeCloseTo(2 / 3);
  const total = Object.values(result).reduce((a, b) => a + (b as number), 0);
  expect(total).toBeCloseTo(1);

});
import { expect, test } from 'vitest';
import { Piece, Phrase, Trajectory, Raga } from '../model';
import { Instrument } from '@shared/enums';

// Helper to build a piece with two tracks, second empty
function buildPieceWithEmptyTrack() {
  const raga = new Raga();
  const t1 = new Trajectory({ durTot: 1 });
  const p1 = new Phrase({ trajectories: [t1], raga });
  return new Piece({
    phraseGrid: [[p1], []],
    instrumentation: [Instrument.Sitar, Instrument.Sitar],
    raga,
  });
}

test('durTotFromPhrases creates silent phrase for empty track', () => {
  const piece = buildPieceWithEmptyTrack();
  piece.durTotFromPhrases();
  expect(piece.phraseGrid[1].length).toBe(1);
  const silentTraj = piece.phraseGrid[1][0].trajectories[0];
  expect(silentTraj.id).toBe(12);
  expect(silentTraj.durTot).toBeCloseTo(1);
});

// Helper for NaN trajectory cleanup
function buildPieceWithNaNTraj() {
  const raga = new Raga();
  const piece = new Piece({ raga, instrumentation: [Instrument.Sitar] });
  const good = new Trajectory({ durTot: 1 });
  const bad = new Trajectory({ durTot: NaN });
  const phrase = new Phrase({ trajectories: [good, bad], raga });
  // force NaN durTot before cleaning
  phrase.durTotFromTrajectories();
  piece.phraseGrid[0].push(phrase);
  return { piece, phrase };
}

test('durArrayFromPhrases removes NaN trajectories', () => {
  const { piece, phrase } = buildPieceWithNaNTraj();
  expect(phrase.durTot).toBeNaN();
  piece.durArrayFromPhrases();
  expect(phrase.trajectories.length).toBe(1);
  expect(phrase.durTot).toBeCloseTo(1);
});

// -------------------------------------------------------
//  New tests for additional Piece features
// -------------------------------------------------------

test('optional Piece fields persist through serialization', () => {
  const opts = {
    title: 'my title',
    dateCreated: new Date('2020-01-01'),
    dateModified: new Date('2020-01-02'),
    location: 'home',
    _id: 'id1',
    audioID: 'a1',
    audio_DB_ID: 'db1',
    userID: 'u1',
    name: 'name',
    family_name: 'fam',
    given_name: 'giv',
    permissions: 'perm',
    explicitPermissions: { edit: ['e'], view: ['v'], publicView: false },
    soloist: 'solo',
    soloInstrument: 'sitar',
    instrumentation: [Instrument.Sitar],
    phrases: [],
    raga: new Raga(),
  };
  const piece = new Piece(opts);
  const copy = Piece.fromJSON(piece.toJSON());
  expect(copy.title).toBe(opts.title);
  expect(copy.dateCreated.toISOString()).toBe(opts.dateCreated.toISOString());
  expect(copy.dateModified.toISOString()).toBe(opts.dateModified.toISOString());
  expect(copy.location).toBe(opts.location);
  expect(copy._id).toBe(opts._id);
  expect(copy.audioID).toBe(opts.audioID);
  // audio_DB_ID is not included in JSON output
  expect(copy.userID).toBe(opts.userID);
  expect(copy.name).toBe(opts.name);
  expect(copy.family_name).toBe(opts.family_name);
  expect(copy.given_name).toBe(opts.given_name);
  expect(copy.permissions).toBe(opts.permissions);
  expect(copy.explicitPermissions).toEqual(opts.explicitPermissions);
  expect(copy.soloist).toBe(opts.soloist);
  expect(copy.soloInstrument).toBe(opts.soloInstrument);
});

test('piece getters and setters modify internal grids', () => {
  const raga = new Raga();
  const t1 = new Trajectory({ num: 0, pitches: [new Pitch()], durTot: 1 });
  const p1 = new Phrase({ trajectories: [t1], raga });
  const piece = new Piece({ phrases: [p1], raga, instrumentation: [Instrument.Sitar] });

  const t2 = new Trajectory({ num: 0, pitches: [new Pitch()], durTot: 1 });
  const p2 = new Phrase({ trajectories: [t2], raga });
  piece.phrases = [p2];
  expect(piece.phraseGrid[0][0]).toBe(p2);

  piece.durArray = [1];
  expect(piece.durArrayGrid[0]).toEqual([1]);

  piece.sectionStarts = [0];
  expect(piece.sectionStartsGrid[0]).toEqual([0]);

  const sc = [initSecCategorization()];
  piece.sectionCategorization = sc;
  expect(piece.sectionCatGrid[0]).toBe(sc);
});

test('assemblages getter reconstructs Assemblage objects', () => {
  const raga = new Raga();
  const traj = new Trajectory({ num: 0, pitches: [new Pitch()], durTot: 1 });
  const phrase = new Phrase({ trajectories: [traj], raga });
  const asm = new Assemblage(Instrument.Sitar, 'a');
  asm.addPhrase(phrase);
  const piece = new Piece({ phrases: [phrase], raga, instrumentation: [Instrument.Sitar] });
  piece.assemblageDescriptors = [asm.descriptor];
  const aggs = piece.assemblages;
  expect(aggs.length).toBe(1);
  expect(aggs[0]).toBeInstanceOf(Assemblage);
  expect(aggs[0].phrases[0]).toBe(phrase);
});

test('updateStartTimes recalculates phrase positions', () => {
  const raga = new Raga();
  const p1 = new Phrase({ trajectories: [new Trajectory({ durTot: 1 })], raga });
  const p2 = new Phrase({ trajectories: [new Trajectory({ durTot: 1 })], raga });
  const piece = new Piece({ phrases: [p1, p2], raga, instrumentation: [Instrument.Sitar] });
  piece.durArrayGrid[0] = [0.25, 0.75];
  piece.durTot = 2;
  piece.updateStartTimes();
  expect(p2.startTime).toBeCloseTo(piece.durStarts()[1]);
  expect(p2.pieceIdx).toBe(1);
});

test('track specific helpers operate on second track', () => {
  const { piece } = buildMultiTrackPiece();
  expect(piece.durStarts(1)).toEqual([0]);
  expect(piece.trajStartTimes(1)).toEqual([0]);
  expect(piece.allPitches({}, 1).length).toBe(1);
  const traj = piece.phraseGrid[1][0].trajectories[0];
  expect(piece.mostRecentTraj(1.2, 1)).toBe(traj);
});

test('adHocSectionCatGrid expands to match instrumentation', () => {
  const raga = new Raga();
  const traj = new Trajectory({ durTot: 1 });
  const phrase = new Phrase({ trajectories: [traj], raga });
  const piece = new Piece({
    phraseGrid: [[phrase]],
    instrumentation: [Instrument.Sitar, Instrument.Vocal_M],
    raga,
    adHocSectionCatGrid: [[]],
  });
  expect(piece.adHocSectionCatGrid.length).toBe(2);
});

test('sectionCatGrid expands when fewer categories than section starts', () => {
  const raga = new Raga();
  const phrase = new Phrase({ trajectories: [new Trajectory({ durTot: 1 })], raga });
  const piece = new Piece({
    phrases: [phrase],
    raga,
    instrumentation: [Instrument.Sitar],
    sectionStarts: [0, 1],
    sectionCatGrid: [[initSecCategorization()]],
  });
  expect(piece.sectionCatGrid[0].length).toBe(2);
});
