// montaj testi: klipler + mikro elemanlar + son kart
defineVideo(F => ({
  style: 2, captions: 'vurgulu',
  layout: [{ t: 0, mode: 'full' }],
  flashes: [],
  scenes: [
    L.scene({ id: 'micro', parts: [
      L.keyword({ text: 'Önemli!', t: word(6).s, out: word(6).s + 1.2, color: 'var(--red)', ink: '#fff' }),
      L.counter({ from: 2025, to: 2026, grouping: false, t: word(28).s, out: word(28).s + 1.5, label: '1 Ocak' }),
    ] }),
    L.endCard({ t: C.end }),
  ],
}));
