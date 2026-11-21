// ÖRNEK (mikro yoğunluk, sahne-3format cue adlarıyla): yüz hep ekranda, yanında küçük dikkat elemanları
// Not: 1x1 karede yüzün yanı dardır; uzun etiket/bildirim yerine kısa çip kullan (safe "MİKRO YER YOK" der).
defineVideo(F => ({
  style: 2, captions: 'vurgulu',
  layout: [{ t: 0, mode: 'full' }],
  punches: [{ t: C.dikkat, amt: .05, z: .5, f: 3, until: 3.2 }],
  flashes: [],
  scenes: [
    L.scene({ id: 'micro', parts: [
      L.keyword({ text: 'DİKKAT!', t: C.dikkat, out: C.dikkat + 1.3, color: 'var(--red)', ink: '#fff' }),
      L.sticker({ icon: 'doc', text: 'Örnek Hizmet', t: C.doc1, out: C.doc1 + 1.5 }),
      L.sticker({ icon: 'doc', text: 'Örnek Bilgilendirme', t: C.doc2, out: C.doc2 + 1.5 }),
      L.counter({ from: 0, to: 2, suffix: ' belge', t: C.guncel, out: C.guncel + 1.4, label: 'güncel olmalı' }),
      L.notif({ app: 'Örnek Marka', title: 'Belgeleriniz güncel mi?', body: 'Örnek uyarı metni', t: C.ceza, out: C.ceza + 2.0 }),
      L.sticker({ icon: 'check', text: 'ornekmarka.com', color: 'var(--green)', ink: '#fff', t: C.typeAt, out: C.typeAt + 1.8 }),
      L.progress({}),
    ] }),
    L.endCard({ t: C.end }),
  ],
}));
