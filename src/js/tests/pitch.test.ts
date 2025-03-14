import { expect, test } from 'vitest';
import { Pitch } from '../classes';

test('defaultPitch', () => {
  const p = new Pitch();
  expect(p).toBeInstanceOf(Pitch);
  expect(p.swara).toEqual(0);
  expect(p.oct).toEqual(0);
  expect(p.raised).toEqual(true);
  expect(p.fundamental).toEqual(261.63);
  const ratios = [
    1, 
    [2 ** (1 / 12), 2 ** (2 / 12)],
    [2 ** (3 / 12), 2 ** (4 / 12)],
    [2 ** (5 / 12), 2 ** (6 / 12)],
    2 ** (7 / 12),
    [2 ** (8 / 12), 2 ** (9 / 12)],
    [2 ** (10 / 12), 2 ** (11 / 12)]
  ]
  expect(p.ratios).toEqual(ratios);
  expect(p.logOffset).toEqual(0);
  expect(p.frequency).toEqual(261.63);
  expect(p.nonOffsetFrequency).toEqual(261.63);
  const logFreq = Math.log2(261.63);
  expect(p.nonOffsetLogFreq).toEqual(logFreq);
  expect(p.logFreq).toEqual(logFreq);
  expect(p.sargamLetter).toEqual('S');
  expect(p.octavedSargamLetter).toEqual('S');
  expect(p.numberedPitch).toEqual(0);
  expect(p.chroma).toEqual(0);
  expect(p.toJSON()).toEqual({
    swara: 0,
    raised: true,
    oct: 0,
    ratios: ratios,
    fundamental: 261.63,
    logOffset: 0,
  })
});

test('swaraInput', () => {
  const saTest = (p: Pitch) => {
    const saFreq = 261.63;
    const saLogFreq = Math.log2(saFreq);
    expect(p.swara).toEqual(0);
    expect(p.frequency).toEqual(saFreq);
    expect(p.logFreq).toEqual(saLogFreq);
    expect(p.sargamLetter).toEqual('S');
    expect(p.raised).toEqual(true);
    expect(p.chroma).toEqual(0);
  };
  const reLoweredTest = (p: Pitch) => {
    const reFreq = 277.19;
    const reLogFreq = Math.log2(reFreq);
    expect (p.swara).toEqual(1);
    expect(p.frequency).toBeCloseTo(reFreq);
    expect(p.logFreq).toBeCloseTo(reLogFreq);
    expect(p.sargamLetter).toEqual('r');
    expect(p.raised).toEqual(false);
    expect(p.chroma).toEqual(1);
  }
  const reRaisedTest = (p: Pitch) => {
    const reFreq = 293.67;
    const reLogFreq = Math.log2(reFreq);
    expect (p.swara).toEqual(1);
    expect(p.frequency).toBeCloseTo(reFreq);
    expect(p.logFreq).toBeCloseTo(reLogFreq);
    expect(p.sargamLetter).toEqual('R');
    expect(p.raised).toEqual(true);
    expect(p.chroma).toEqual(2);
  }
  const gaLoweredTest = (p: Pitch) => {
    const gaFreq = 311.13;
    const gaLogFreq = Math.log2(gaFreq);
    expect (p.swara).toEqual(2);
    expect(p.frequency).toBeCloseTo(gaFreq);
    expect(p.logFreq).toBeCloseTo(gaLogFreq);
    expect(p.sargamLetter).toEqual('g');
    expect(p.raised).toEqual(false);
    expect(p.chroma).toEqual(3);
  }
  const gaRaisedTest = (p: Pitch) => {
    const gaFreq = 329.63;
    const gaLogFreq = Math.log2(gaFreq);
    expect (p.swara).toEqual(2);
    expect(p.frequency).toBeCloseTo(gaFreq);
    expect(p.logFreq).toBeCloseTo(gaLogFreq);
    expect(p.sargamLetter).toEqual('G');
    expect(p.raised).toEqual(true);
    expect(p.chroma).toEqual(4);
  }
  const maLoweredTest = (p: Pitch) => {
    const maFreq = 349.23;
    const maLogFreq = Math.log2(maFreq);
    expect (p.swara).toEqual(3);
    expect(p.frequency).toBeCloseTo(maFreq);
    expect(p.logFreq).toBeCloseTo(maLogFreq);
    expect(p.sargamLetter).toEqual('m');
    expect(p.raised).toEqual(false);
    expect(p.chroma).toEqual(5);
  }
  const maRaisedTest = (p: Pitch) => {
    const maFreq = 370;
    const maLogFreq = Math.log2(maFreq);
    expect (p.swara).toEqual(3);
    expect(p.frequency).toBeCloseTo(maFreq);
    expect(p.logFreq).toBeCloseTo(maLogFreq);
    expect(p.sargamLetter).toEqual('M');
    expect(p.raised).toEqual(true);
    expect(p.chroma).toEqual(6);
  }
  const paTest = (p: Pitch) => {
    const paFreq = 392;
    const paLogFreq = Math.log2(paFreq);
    expect (p.swara).toEqual(4);
    expect(p.frequency).toBeCloseTo(paFreq);
    expect(p.logFreq).toBeCloseTo(paLogFreq);
    expect(p.sargamLetter).toEqual('P');
    expect(p.raised).toEqual(true);
    expect(p.chroma).toEqual(7);

  }
  const dhaLoweredTest = (p: Pitch) => {
    const dhaFreq = 415.31;
    const dhaLogFreq = Math.log2(dhaFreq);
    expect (p.swara).toEqual(5);
    expect(p.frequency).toBeCloseTo(dhaFreq);
    expect(p.logFreq).toBeCloseTo(dhaLogFreq);
    expect(p.sargamLetter).toEqual('d');
    expect(p.raised).toEqual(false);
    expect(p.chroma).toEqual(8);
  }
  const dhaRaisedTest = (p: Pitch) => {
    const dhaFreq = 440.01;
    const dhaLogFreq = Math.log2(dhaFreq);
    expect (p.swara).toEqual(5);
    expect(p.frequency).toBeCloseTo(dhaFreq);
    expect(p.logFreq).toBeCloseTo(dhaLogFreq);
    expect(p.sargamLetter).toEqual('D');
    expect(p.raised).toEqual(true);
    expect(p.chroma).toEqual(9);
  }
  const niLoweredTest = (p: Pitch) => {
    const niFreq = 466.17;
    const niLogFreq = Math.log2(niFreq);
    expect (p.swara).toEqual(6);
    expect(p.frequency).toBeCloseTo(niFreq);
    expect(p.logFreq).toBeCloseTo(niLogFreq);
    expect(p.sargamLetter).toEqual('n');
    expect(p.raised).toEqual(false);
    expect(p.chroma).toEqual(10);
  }
  const niRaisedTest = (p: Pitch) => {
    const niFreq = 493.89;
    const niLogFreq = Math.log2(niFreq);
    expect (p.swara).toEqual(6);
    expect(p.frequency).toBeCloseTo(niFreq);
    expect(p.logFreq).toBeCloseTo(niLogFreq);
    expect(p.sargamLetter).toEqual('N');
    expect(p.raised).toEqual(true);
    expect(p.chroma).toEqual(11);
  }

  const saVars = ['Sa', 'sa', 's', 'S', 0]
  saVars.forEach((swara) => {
    let p = new Pitch({ swara: swara })
    saTest(p);
    p = new Pitch({ swara: swara, raised: false })
    saTest(p); // shouldn't matter if you pass it raised = false, will revert
    // to raised = true
  })

  const reVars = ['Re', 're', 'r', 'R', 1]
  reVars.forEach((swara) => {
    let p = new Pitch({ swara: swara })
    reRaisedTest(p);
    p = new Pitch({ swara: swara, raised: false })
    reLoweredTest(p);
  })

  const gaVars = ['Ga', 'ga', 'g', 'G', 2]
  gaVars.forEach((swara) => {
    let p = new Pitch({ swara: swara })
    gaRaisedTest(p);
    p = new Pitch({ swara: swara, raised: false })
    gaLoweredTest(p);
  })

  const maVars = ['Ma', 'ma', 'm', 'M', 3]
  maVars.forEach((swara) => {
    let p = new Pitch({ swara: swara })
    maRaisedTest(p);
    p = new Pitch({ swara: swara, raised: false })
    maLoweredTest(p);
  })

  const paVars = ['Pa', 'pa', 'p', 'P', 4]
  paVars.forEach((swara) => {
    let p = new Pitch({ swara: swara })
    paTest(p);
    p = new Pitch({ swara: swara, raised: false })
    paTest(p); // shouldn't matter if you pass it raised = false, will still be the same
  })

  const dhaVars = ['Dha', 'dha', 'd', 'D', 5]
  dhaVars.forEach((swara) => {
    let p = new Pitch({ swara: swara })
    dhaRaisedTest(p);
    p = new Pitch({ swara: swara, raised: false })
    dhaLoweredTest(p);
  })

  const niVars = ['Ni', 'ni', 'n', 'N', 6]
  niVars.forEach((swara) => {
    let p = new Pitch({ swara: swara })
    niRaisedTest(p);
    p = new Pitch({ swara: swara, raised: false })
    niLoweredTest(p);
  })
})

test('octaveInput', () => {
  // Only really expecting -2 - 2 to work
  let p = new Pitch({ swara: 'Sa', oct: -2 })
  const saDown2 = 'S' + '\u0324';
  const saDown1 = 'S' + '\u0323';
  const saPlus1 = 'S' + '\u0307';
  const saPlus2 = 'S' + '\u0308';
  expect(p.oct).toEqual(-2);
  expect(p.octavedSargamLetter).toEqual(saDown2);
  p.setOct(-1)
  expect(p.oct).toEqual(-1);
  expect(p.octavedSargamLetter).toEqual(saDown1);
  p.setOct(0)
  expect(p.oct).toEqual(0);
  expect(p.octavedSargamLetter).toEqual('S');
  p.setOct(1)
  expect(p.oct).toEqual(1);
  expect(p.octavedSargamLetter).toEqual(saPlus1);
  p.setOct(2)
  expect(p.oct).toEqual(2);
  expect(p.octavedSargamLetter).toEqual(saPlus2);

})

test('logOffset', () => {
  const offset = 0.1
  let p = new Pitch({ swara: 'Sa', logOffset: offset })
  expect(p.logOffset).toEqual(offset);
  const saFreq = 261.63;
  const saLogFreq = Math.log2(saFreq);
  const offsetSaLogFreq = saLogFreq + offset;
  const offsetSaFreq = Math.pow(2, offsetSaLogFreq);
  expect(p.frequency).toBeCloseTo(offsetSaFreq);
  expect(p.logFreq).toBeCloseTo(offsetSaLogFreq);
  expect(p.nonOffsetFrequency).toBeCloseTo(saFreq);
})

test('numberedPitch', () => {
  let p = new Pitch({ swara: 5, oct: -2})
  expect(p.numberedPitch).toEqual(-15);
  p = new Pitch({ swara: 2, oct: 0})
  expect(p.numberedPitch).toEqual(4);
  p = new Pitch({ swara: 3, raised: false, oct: 1 })
  expect(p.numberedPitch).toEqual(17);
})
