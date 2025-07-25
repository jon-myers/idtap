import { expect, test, vi } from 'vitest';
import {
  Phrase,
  Trajectory,
  Pitch,
  Articulation,
  Group,    // <-- if Group lives in a different module, change this path
  Raga,
  Chikari,
} from '@model'; // adjust path(s) as needed

/* ------------------------------------------------------------------
   Helpers
------------------------------------------------------------------ */
const makePhrase = (trajectories: Trajectory[], startTime?: number) =>
  new Phrase({ trajectories, startTime });

/* ------------------------------------------------------------------
   Tests from branch “codex/create-tests-for-getgroups-and-others”
------------------------------------------------------------------ */

// getGroups and getGroupFromId
test('groups retrieval', () => {
  const t1 = new Trajectory();
  const t2 = new Trajectory();
  const phrase = makePhrase([t1, t2]);
  phrase.pieceIdx = 0;
  phrase.assignPhraseIdx();
  const g = new Group({ trajectories: [phrase.trajectories[0], phrase.trajectories[1]] });
  phrase.getGroups(0).push(g);
  expect(phrase.getGroups(0)).toEqual([g]);
  expect(phrase.getGroupFromId(g.id)).toEqual(g);
  expect(phrase.getGroupFromId('missing')).toEqual(undefined);
  expect(() => phrase.getGroups(1)).toThrow('No groups for this index');
});

// assignPhraseIdx
test('assignPhraseIdx sets trajectory indices', () => {
  const ts = [new Trajectory(), new Trajectory()];
  const phrase = makePhrase(ts);
  phrase.pieceIdx = 3;
  phrase.assignPhraseIdx();
  ts.forEach(t => expect(t.phraseIdx).toEqual(3));
  phrase.pieceIdx = undefined;
  phrase.assignPhraseIdx();
  ts.forEach(t => expect(t.phraseIdx).toEqual(undefined));
});

// assignTrajNums
test('assignTrajNums assigns sequential numbers', () => {
  const ts = [new Trajectory(), new Trajectory(), new Trajectory()];
  const phrase = makePhrase(ts);
  ts.forEach(t => (t.num = 99));
  phrase.assignTrajNums();
  ts.forEach((t, i) => expect(t.num).toEqual(i));
  const emptyPhrase = new Phrase();
  expect(() => emptyPhrase.assignTrajNums()).not.toThrow();
});

// assignStartTimes
test('assignStartTimes computes times and handles errors', () => {
  const ts = [new Trajectory(), new Trajectory(), new Trajectory()];
  const phrase = makePhrase(ts);
  phrase.assignStartTimes();
  const expected = [0, 1, 2];
  ts.forEach((t, i) => expect(t.startTime).toBeCloseTo(expected[i]));

  const p2 = new Phrase();
  // remove durArray
  // @ts-ignore
  p2.durArray = undefined;
  expect(() => p2.assignStartTimes()).toThrow('durArray is undefined');
  const p3 = new Phrase();
  p3.durTot = undefined as any;
  p3.durArray = [0.5, 0.5];
  expect(() => p3.assignStartTimes()).toThrow('durTot is undefined');
});

// updateFundamental
test('updateFundamental propagates to trajectories', () => {
  const t1 = new Trajectory({ pitches: [new Pitch()] });
  const t2 = new Trajectory({ pitches: [new Pitch()] });
  const phrase = makePhrase([t1, t2]);
  phrase.updateFundamental(440);
  t1.pitches.concat(t2.pitches).forEach(p => {
    expect(p.fundamental).toBeCloseTo(440);
  });
});

// allPitches
test('allPitches handles repetition and silence', () => {
  const p1 = new Pitch({ swara: 'sa' });
  const p2 = new Pitch({ swara: 're' });
  const t1 = new Trajectory({ pitches: [p1] });
  const t2 = new Trajectory({ pitches: [p2] });
  const t3 = new Trajectory({ pitches: [new Pitch({ swara: 're' })] });
  const silent = new Trajectory({ id: 12, pitches: [new Pitch()] });
  const phrase = makePhrase([t1, t2, t3, silent]);
  expect(phrase.allPitches()).toEqual([p1, p2, t3.pitches[0]]);
  expect(phrase.allPitches(false)).toEqual([p1, p2]);
});

// swara
test('swara returns pitch/time pairs and handles errors', () => {
  const ts = [new Trajectory(), new Trajectory(), new Trajectory()];
  const phrase = makePhrase(ts, 10);
  const times = phrase.swara.map(o => (o as any).time);
  expect(times).toEqual([10, 11, 12]);

  const p2 = new Phrase({ trajectories: [new Trajectory()] });
  expect(() => p2.swara).toThrow('startTime is undefined');

  const p3 = makePhrase([new Trajectory()], 0);
  p3.trajectories[0].startTime = undefined;
  expect(() => p3.swara).toThrow('traj.startTime is undefined');

  const p4 = makePhrase([new Trajectory()], 0);
  // @ts-ignore
  p4.trajectories[0].durArray = undefined;
  expect(() => p4.swara).toThrow('traj.durArray is undefined');
});

/* ------------------------------------------------------------------
   Tests from branch “porting-project”
------------------------------------------------------------------ */

test('Phrase methods and serialization', () => {
  const t1 = new Trajectory({ num: 0, durTot: 0.5, pitches: [new Pitch()] });
  const t2 = new Trajectory({ num: 1, durTot: 0.5, pitches: [new Pitch({ swara: 'r' })] });
  const p = new Phrase({ trajectories: [t1, t2], raga: new Raga() });
  expect(p.durTot).toBeCloseTo(1);
  expect(p.compute(0.25)).toBeCloseTo(t1.compute(0.5));
  expect(p.getRange().min.numberedPitch).toBe(t1.pitches[0].numberedPitch);
  const nv = p.toNoteViewPhrase();
  expect(nv.pitches.length).toBe(2);
  const json = p.toJSON();
  const copy = Phrase.fromJSON(json);
  expect(copy.durTot).toBeCloseTo(1);
  expect(copy.trajectories.length).toBe(2);
});

test('Phrase utility functions', () => {
  const r = new Raga();
  const t1 = new Trajectory({ num: 0, durTot: 0.5, pitches: [new Pitch()] });
  t1.addConsonant('ka');
  t1.updateVowel('a');
  const silent1 = new Trajectory({ num: 1, id: 12, durTot: 0.25, pitches: [new Pitch()] });
  const silent2 = new Trajectory({ num: 2, id: 12, durTot: 0.25, pitches: [new Pitch()] });
  const t2 = new Trajectory({ num: 3, durTot: 0.5, pitches: [new Pitch({ swara: 'r' })] });
  t2.updateVowel('i');
  const p = new Phrase({ trajectories: [t1, silent1, silent2, t2], raga: r, startTime: 0 });
  p.reset();
  p.chikaris['0.3'] = new Chikari({});

  const idxs = p.firstTrajIdxs();
  expect(idxs).toContain(0);
  expect(idxs).toContain(3);
  expect(p.trajIdxFromTime(0.1)).toBe(0);

  const chiks = p.chikarisDuringTraj(t1, 0);
  expect(chiks.length).toBe(1);
  p.consolidateSilentTrajs();
  expect(p.trajectories.length).toBe(3);
});

/* ------------------------------------------------------------------
   toNoteViewPhrase with id 0 trajectory
------------------------------------------------------------------ */

test('toNoteViewPhrase includes pitches from id 0 trajectory with articulations', () => {
  const pitch = new Pitch({ swara: 'ga' });
  const traj = new Trajectory({
    id: 0,
    pitches: [pitch],
    articulations: { '0.00': new Articulation({ name: 'pluck' }) },
  });
  const phrase = new Phrase({ trajectories: [traj] });
  const nv = phrase.toNoteViewPhrase();
  expect(nv.pitches.length).toBe(1);
  expect(nv.pitches[0]).toBe(pitch);
});

test('toNoteViewPhrase includes pitches from nonzero id trajectory with no articulations', () => {
  const pitch = new Pitch({ swara: 'ma' });
  const traj = new Trajectory({
    id: 2,
    pitches: [pitch],
    articulations: {},
  });
  const phrase = new Phrase({ trajectories: [traj] });
  const nv = phrase.toNoteViewPhrase();
  expect(nv.pitches).toContain(pitch);
});


test('fromJSON reconstructs trajectory and chikari grids', () => {
  const t1 = new Trajectory({ num: 0, pitches: [new Pitch()] });
  const t2 = new Trajectory({ num: 1, pitches: [new Pitch({ swara: 'r' })] });
  const c1 = new Chikari({});
  const obj = {
    trajectoryGrid: [[t1.toJSON(), t2.toJSON()]],
    chikariGrid: [{ '0.5': c1.toJSON() }],
    instrumentation: ['Sitar', 'Violin'],
    startTime: 0,
  };
  const phrase = Phrase.fromJSON(obj);
  expect(phrase.trajectoryGrid[0][0]).toBeInstanceOf(Trajectory);
  expect(phrase.trajectoryGrid[0][1]).toBeInstanceOf(Trajectory);
  expect(phrase.trajectoryGrid.length).toBe(2);
  expect(Array.isArray(phrase.trajectoryGrid[1])).toBe(true);
  expect(phrase.trajectoryGrid[1].length).toBe(0);
  expect(phrase.chikariGrid[0]['0.5']).toBeInstanceOf(Chikari);
  expect(phrase.chikariGrid.length).toBe(2);
  expect(Object.keys(phrase.chikariGrid[1]).length).toBe(0);
});


test('trajIdxFromTime throws when time not in any trajectory', () => {
  const t1 = new Trajectory({ num: 0, durTot: 0.5, pitches: [new Pitch()] });
  const t2 = new Trajectory({ num: 1, durTot: 0.5, pitches: [new Pitch()] });
  const phrase = new Phrase({ trajectories: [t1, t2], startTime: 0 });
  expect(() => phrase.trajIdxFromTime(1.1)).toThrow('No trajectory found');
});

// Additional swara edge cases
test('swara handles durArray shorter than pitches', () => {
  const t = new Trajectory({
    id: 1,
    pitches: [new Pitch(), new Pitch({ swara: 1 })],
    durArray: [1],
    durTot: 1,
  });
  const phrase = makePhrase([t], 0);
  const sw = phrase.swara as any[];
  expect(sw.length).toBe(1);
  expect(sw[0].pitch).toBe(t.pitches[0]);
  expect(sw[0].time).toBeCloseTo(0);
});

test('swara handles durArray equal to pitches', () => {
  const t = new Trajectory({
    id: 7,
    pitches: [new Pitch(), new Pitch({ swara: 1 })],
    durArray: [0.4, 0.6],
    durTot: 1,
  });
  const phrase = makePhrase([t], 0);
  const sw = phrase.swara as any[];
  expect(sw.length).toBe(2);
  expect(sw[0].time).toBeCloseTo(0);
  expect(sw[1].time).toBeCloseTo(0.4);
});


test('consolidateSilentTrajs collapses middle and trailing silences', () => {
  const t1 = new Trajectory({ num: 0, durTot: 0.5, pitches: [new Pitch()] });
  const s1 = new Trajectory({ num: 1, id: 12, durTot: 0.1, pitches: [new Pitch()] });
  const s2 = new Trajectory({ num: 2, id: 12, durTot: 0.2, pitches: [new Pitch()] });
  const t2 = new Trajectory({ num: 3, durTot: 0.5, pitches: [new Pitch({ swara: 'r' })] });
  const s3 = new Trajectory({ num: 4, id: 12, durTot: 0.1, pitches: [new Pitch()] });
  const s4 = new Trajectory({ num: 5, id: 12, durTot: 0.2, pitches: [new Pitch()] });
  const t3 = new Trajectory({ num: 6, durTot: 0.5, pitches: [new Pitch({ swara: 'g' })] });
  const s5 = new Trajectory({ num: 7, id: 12, durTot: 0.1, pitches: [new Pitch()] });
  const s6 = new Trajectory({ num: 8, id: 12, durTot: 0.2, pitches: [new Pitch()] });

  const p = new Phrase({
    trajectories: [t1, s1, s2, t2, s3, s4, t3, s5, s6],
    raga: new Raga(),
    startTime: 0,
  });
  p.consolidateSilentTrajs();
  expect(p.trajectories.length).toBe(6);
  expect(p.trajectories[1].durTot).toBeCloseTo(0.3);
  expect(p.trajectories[3].durTot).toBeCloseTo(0.3);
  expect(p.trajectories[5].durTot).toBeCloseTo(0.3);
});

test('consolidateSilentTrajs throws when traj num missing', () => {
  const good = new Trajectory({ num: 0, durTot: 0.5, pitches: [new Pitch()] });
  const badSilent = new Trajectory({ id: 12, durTot: 0.5, pitches: [new Pitch()] });
  const p = new Phrase({ trajectories: [good, badSilent], raga: new Raga() });
  p.trajectories[1].num = undefined;
  expect(() => p.consolidateSilentTrajs()).toThrow('traj.num is undefined');
});


test('realignPitches replaces pitch objects with raga ratios', () => {
  const t1 = new Trajectory({ pitches: [new Pitch(), new Pitch({ swara: 'r' })] });
  const t2 = new Trajectory({ pitches: [new Pitch({ swara: 'g' })] });
  const r = new Raga();
  const phrase = new Phrase({ trajectories: [t1, t2], raga: r });
  const originals = phrase.trajectories.map(t => t.pitches.slice());

  phrase.realignPitches();

  phrase.trajectories.forEach((traj, ti) => {
    traj.pitches.forEach((p, pi) => {
      expect(p).not.toBe(originals[ti][pi]);
      expect(p.ratios).toStrictEqual(r.stratifiedRatios);
    });
  });
});

test('compute throws when durArray undefined', () => {
  const p = new Phrase();
  // @ts-ignore - intentionally unset durArray
  p.durArray = undefined;
  expect(() => p.compute(0.5)).toThrow('durArray is undefined');
});

test('compute returns null for empty durArray', () => {
  const p = new Phrase();
  expect(p.durArray).toEqual([]);
  expect(p.compute(0.5)).toBeNull();
});

test('durTot and durArray preserved with empty trajectories', () => {
  const spy = vi.spyOn(Phrase.prototype as any, 'durArrayFromTrajectories');
  const p = new Phrase({ durTot: 2, durArray: [1] });
  expect(p.durTot).toBe(2);
  expect(p.durArray).toEqual([1]);
  expect(spy).not.toHaveBeenCalled();
  spy.mockRestore();
});

test('constructor pads grids to instrumentation length', () => {
  const t1 = new Trajectory();
  const trajectoryGrid = [[t1]];
  const chikariGrid = [{}];
  const instrumentation = ['Sitar', 'Violin'];
  const phrase = new Phrase({
    trajectoryGrid,
    chikariGrid,
    instrumentation,
  });
  expect(phrase.trajectoryGrid).toBe(trajectoryGrid);
  expect(phrase.chikariGrid).toBe(chikariGrid);
  expect(phrase.trajectoryGrid.length).toBe(instrumentation.length);
  expect(phrase.chikariGrid.length).toBe(instrumentation.length);
  expect(phrase.trajectoryGrid[1]).toEqual([]);
  expect(phrase.chikariGrid[1]).toEqual({});
});


test('fromJSON uses fallbacks for missing grids', () => {
  const obj = {
    trajectories: [],
    instrumentation: ['Sitar', 'Violin'],
    startTime: 0,
  };
  const phrase = Phrase.fromJSON(obj);
  expect(phrase.trajectoryGrid.length).toBe(obj.instrumentation.length);
  expect(phrase.chikariGrid.length).toBe(obj.instrumentation.length);
  phrase.trajectoryGrid.forEach(row => expect(row).toEqual([]));
  phrase.chikariGrid.forEach(col => expect(col).toEqual({}));
});

test('chikaris setter updates grid', () => {
  const phrase = new Phrase();
  const c = new Chikari({});
  phrase.chikaris = { '0.1': c };
  expect(phrase.chikariGrid[0]['0.1']).toBe(c);
});

test('constructor scales trajectories when durTot and durArray passed', () => {
  const t1 = new Trajectory({ durTot: 1, pitches: [new Pitch()] });
  const t2 = new Trajectory({ durTot: 1, pitches: [new Pitch({ swara: 'r' })] });
  const durArray = [0.2, 0.8];
  const phrase = new Phrase({
    trajectories: [t1, t2],
    durTot: 4,
    durArray,
  });
  expect(phrase.durTot).toBeCloseTo(4);
  expect(phrase.durArray).toEqual(durArray);
  expect(t1.durTot).toBeCloseTo(0.8);
  expect(t2.durTot).toBeCloseTo(3.2);
});

test('constructor fills missing trajectory/chikari grids when undefined', () => {
  const traj = new Trajectory();
  const instrumentation = ['Sitar', 'Violin', 'Sarod'];
  const phrase = new Phrase({ trajectories: [traj], instrumentation });

  expect(phrase.trajectoryGrid.length).toBe(instrumentation.length);
  expect(phrase.chikariGrid.length).toBe(instrumentation.length);

  expect(phrase.trajectoryGrid[0]).toEqual([traj]);
  expect(phrase.chikariGrid[0]).toEqual({});
  expect(phrase.trajectoryGrid[1]).toEqual([]);
  expect(phrase.trajectoryGrid[2]).toEqual([]);
  expect(phrase.chikariGrid[1]).toEqual({});
  expect(phrase.chikariGrid[2]).toEqual({});
});
import { expect, test } from 'vitest';
import { Phrase, initPhraseCategorization } from '../model';

// Ensure missing "Bol Alap" property gets initialized to false

test('constructor fills missing Bol Alap categorization', () => {
  const custom = initPhraseCategorization();
  // Remove the property so constructor must add it
  delete custom.Elaboration['Bol Alap'];

  const phrase = new Phrase({ categorizationGrid: [custom] });

  expect(phrase.categorizationGrid[0].Elaboration['Bol Alap']).toBe(false);
});

