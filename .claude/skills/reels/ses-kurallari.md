# Ses kuralları (müzik + SFX + ses temizliği + miks)

Ses ajanı bu dosyayı izler. Ses ajanı dinleyemez, her şeyi ölçerek doğrular.
Komut: `./studyo audio <slug>` (sırayla `01_timeline.py` ve `04_audio.py` çalışır; tek tek gerekirse `./studyo py <slug> pipeline/01_timeline.py` ve `./studyo py <slug> pipeline/04_audio.py`).

## Veri akışı
- Yönetmen `projects/<slug>/plan.json` içine `audio.sections`, `audio.events` ve (isteğe bağlı) `audio.music` yazar.
- `work/events.json` **türetilir**: `01_timeline.py` cue'ları saniyeye çevirir ve `audio.music` bloğunu olduğu gibi kopyalar. Bu dosyayı elle düzenleme, bir sonraki üretimde ezilir.
- Olay ya da bölüm zamanı şu biçimlerde verilebilir: `{"t": 9.9}`, `{"cue": "zorunlu", "off": 0}`, `{"word": 22, "at": "s", "off": -0.2}`. Bölüm sınırlarında `"start"`, `"end"`, `"total"` cue adları da kullanılabilir.
- `04_audio.py` girdileri: `$WORK/voice_cut.wav`, `$WORK/timeline.json` (duration, words[s,e]) ve `$WORK/events.json`.
- `04_audio.py` çıktıları: `music.wav`, `sfx.wav`, `voice_proc.wav`, `mix.wav` ve `audio_report.json`.

## Kullanıcının kendi lisanslı müziği (`music.file`)
- Varsayılan: müzik ve efektler koddan sentezlenir (telif riski olmasın); internetten müzik indirilmez. Kullanıcı kendi lisanslı müziğini verirse (ör. reklamda hazır parça isterse) parça `music.file` ile gövde müziği yapılır. Lisansı kullanıcı sağlar; kaynağı ve lisansı `input/<proje>/muzik/kaynaklar.json`'a yazılır. Birden fazla aday verdiyse **seçimi kullanıcı yapar**.
- Motor: `music.file` (aşağıda). Sentez müzik kapalıdır; efektler 2–3 tane, zevkli ve az olmalı, parçayı ezmemeli.
- Kesiti seçince vuruş başına RMS'e bak. Örnek: 35.4 s'lik bir kesit parçanın bir ölçülük **stop**'unun son 2 vuruşuna düştü (-42/-34 dB, gövde -13 dB). Giriş, 0'da vuruş ve stop içinde drop'a yükselen süpürmeyle tasarlandı. Kesiti tam ölçü kadar kaydırırsan kesimler aynı vuruşlarda kalır.
- Parçanın kendi tepe/loudness oranı (PLR) büyükse (ör. -13.8 LUFS / +0.4 dBTP, PLR 14.2 dB) -14 LUFS ve TP ≤ -1.5 için limiter atak tepelerinde ~4 dB çalışır; bu SFX kaynaklı değildir. Alt bası kısmak GR'yi artırır (HPF 40/50 Hz ya da 80 Hz rafı: 4.2 → 4.7–5.5 dB); parçanın tınısına dokunma.

## Efekt bütçesi ve müzik-yapı uyumu (ÖNCELİKLİ)
- **30 sn'de en fazla 8–10 efekt.** Efekt yalnızca baskın anlarda olur:
  - `impact_intro`
  - kanca vuruşu
  - hidden'a giriş whoosh'u
  - büyük damga(lar)
  - aciliyet `riser`→`impact`
  - marka anında `typing`/`click_load`
  - `whoosh_final_hit`
- Küçük elemanlara (çip, etiket, liste satırı, tik, takvim) **ses konmaz**. İstisna olarak bir videoda en fazla 1–2 tane, -6 dB ve altında kullanılabilir.
- **Cümle sonuna yapışık efekt yok:** bir cümle bittikten sonraki 0.4 s içinde nokta efekt çalmaz; efekt kelimenin üstüne ya da geçişe düşer. Yalnızca mod geçişlerindeki yumuşak whoosh'lar (≤ -8 dB) istisnadır.
- **Kart küçülme/genişleme geçişlerinde whoosh kullanılmaz.** Yalnızca hidden'a giriş ve çıkışta yumuşak bir whoosh olur.
- **Müzik** bölümleri izler:
  - kanca: enerji
  - bilgi: sakin, seyrek
  - uyarı ve aciliyet: gerilim ve tek bir kırılma
  - çözüm: ferah
  - final: çözülme

  Konuşma altında hat/stab yoğunluğu düşük tutulur, drop en fazla 1–2 tane olur.

- **`music.gain_ramps`**: `[[t0, t1, dB, dönüş_s]]` ile bölgesel müzik seviyesi ayarlanır (ör. `[[0, 5, -6, 1.5]]` girişte müziği kısar, 5–6.5 s arasında yumuşakça geri getirir). Girişte kısık müzik onaylı tercihtir; varsayılan olarak ilk 5 s'ye -4…-6 dB uygula.
- **Genel müzik seviyesi (isteğe bağlı):** kullanıcı "müziği biraz kısalım" derse tüm süreye -3 dB ekle: `[[0, 5, -6, 1.5], [0, <total>, -3, 0]]`. İkinci rampanın bitişi tam `total` olmalı; daha uzun verilirse motor çöker. Böylece konuşmayla müzik arasındaki fark ~21 dB olur (aşağıdaki 16–20 dB bandının bilerek dışında). Varsayılan bu kısma olmadan başlamaktır (Miks hedefleri).

- **Yoğunluk/tür bütçesi:**
  - sahne: 8–10 efekt / 30 s
  - mikro/karma: 4–6 (mikro elemanlara ses yok, en fazla 1–2 yumuşak pop)
  - temiz: 2–4 (açılış + son kart)
  - **Montajda** konuşan yüz yoktur. Müzik görüntünün ritmini taşır, konuşmanın 14–17 dB altında kalabilir. Varsayılan 18.5 dB'den oraya inmek için tüm süreye `[0, total, +2, 0]` ekle (deneyimde pencereler 15.5–17.0 dB çıktı). Klip geçişleri (`timeline.cuts`) müzikte vuruşa yakın olur, ama her geçişe efekt konmaz.

## events.json alanları
| alan | anlamı |
|---|---|
| `total_duration` | miksin tam uzunluğu (s); örnek sayısı = round(total × 48000) |
| `video_end` | konuşmalı videonun sonu; ses buradan ~1 kare önce kapanır |
| `sections[]` | `{name, start, end, mood}`; ad veya mood'daki anahtar kelimeler müziği yönlendirir (aşağıya bak) |
| `events[]` | `{t, type, dur?, count?, gain_db?, desc?}`, zaman saniye cinsinden çıktı zaman çizelgesidir |
| `music` | isteğe bağlı; eksik alanlar otomatik türetilir |
| `voice` | isteğe bağlı override: `{"nf": -45, "nr": 10, "expander": false}`. Ek isteğe bağlı alanlar, plan.json `audio.voice`: |
| `voice.gain` | **klip kazancı** `[[t0, t1, dB], ...]` (çıktı zamanı). Farklı alımlar birleştirildiğinde seviye farkını eşitler. Kompresörden ÖNCE uygulanır; kompresör farkın ~1/3'ünü bıraktığı için kazanç ham farktan büyük seçilir (ör. ham +5.5 dB → -7). Sınırlar kesim/duraklama içinde olmalı (kelime içine düşerse UYARI). Hedef: işlem sonrası parçaların konuşma seviyesi medyanın ±1 dB'i içinde. Ortak gövdeli A/B videolarında gövde iki videoda aynı kazancı alır |
| `voice.eq` | **aralık EQ'su** `[[t0, t1, [[f_Hz, kazanç_dB, Q?], ...]], ...]` (çıktı zamanı). Farklı odada/mesafede çekilmiş alımların tonunu yaklaştırır: aralığa RBJ tepe filtreleri, sınırda 20 ms Hann geçişi; dfn ve `voice.gain`'den sonra, kompresörden önce. Sınırlar kesim/duraklama içinde olmalı (kelime içine düşerse UYARI). Hedefi bant **payıyla** değil mutlak bant değişimiyle kur (pay toplam seviyeye normalize, baskın bantta doymuş görünür; seviyeyi `voice.gain` ayrıca eşitler). Bant gücünü formantlar belirlediği için ±1–2 dB'lik bant değişimi ±5 dB tepe ister; kısa ve farklı kelimeli örnekte tam eşleme zorlama olur, kısmi uygula (örnekte en çok ±3.5 dB; 2-5 kHz farkı -4.0 → -2.0 dB). EQ seviyeyi de değiştirir: sonra `voice.gain`'i yeniden ölç. Verilmezse çıktı değişmez |
| `voice.head_fade_ms` | video cümle ortasından başlıyorsa (önceki kelimenin kuyruğu, /b/ ön sesi) kosinüs giriş fade'i (ör. 20). Yoksa eski 4 ms doğrusal fade |
| `voice.mute` | `[[t0, t1], ...]`: declick'in yakalamadığı kelime dışı dudak şaklaması / kesik nefes kırıntısını 3 ms kenarlarla susturur; kelimeyle çakışırsa UYARI |
| `voice.hpf` | ses zincirinin ilk HPF'si (Hz, 2 kutup; varsayılan 80). Dışarıda/rüzgârda çekimde 60–150 Hz uğultu için 100–120 (örnek, araç içi kayıt: 120 Hz, F0 medyanı 171 Hz; duraklarda uğultu konuşmaya göre ~-14 → ~-20 dB, konuşmanın 80–300 Hz bandı -0.6 dB). Önce konuşmacının F0'ını ölç: HPF, F0'ın p10'unun belirgin altında kalmalı. Verilmezse çıktı değişmez |
| `voice.denoise` | `{}` ya da ayar sözlüğü: konuşma-farkında spektral NR, **kompresörden sonra** (kompresör duraklardaki gürültüyü ~5 dB yükseltir). Değişen gürültü (geçen araç, motor) için: gürültü PSD'si ortalanmış minimum istatistiğiyle (`win_s` 1.0) izlenir, sapması kelime dışı karelerden ölçülür; karar-yönlendirmeli `sqrt`-Wiener (`dd` 0.98). Konuşmada frekansa bağlı taban `sp_floor` (vars. `[[1000,-10],[6000,-8],[24000,-10]]`), kelime dışında `ns_extra` (-16) ek kısma, toplam `ns_min` (-24) altına inmez. Konuşma = hizalama (`pre` 0.06 / `post` 0.08) VEYA 300-3000 Hz bandı gürültünün `vad_db` (8) üstünde (hizalama geç kalsa da kelime başı kısılmaz). Kullanırken `nr: 0` (afftdn yok) ve `expander: false` ver. Araç içi kayıtta (2-5 kHz SNR ~0 dB): duraklar B2 -9.9 → -18.7 dB, konuşma altı motor bandı -7 dB, 2-5 kHz eğimi -2.7 dB (afftdn nf -36: -6.6 dB), duraklarda kurtosis oranı 1.8 (afftdn+gate: 7.2) |
| `voice.dfn` | `{"atten_lim": 20, "pf": false}`: yapay zekâ gürültü ayırma (DeepFilterNet3; resmi `deep-filter` v0.5.6 programı `.cache/dfn/deep-filter`, git dışı, ücretsiz/açık kaynak — yoksa kullanıcının onayıyla github.com/Rikorose/DeepFilterNet/releases v0.5.6'dan işletim sistemine uygun sürüm kurulur). Declick'ten hemen sonra, **tüm zincirden önce** (mono, 48 kHz); `-D` + çapraz korelasyonla gecikme 0. `atten_lim`: gürültü en fazla bu kadar dB kısılır (20: ses doğal kalır; 100 sınırsız). Konuşmayla aynı bantta değişen gürültüde (geçen araç, trafik) spektral yöntemlerin yapamadığını yapar; durağan alçak uğultuya (120-300 Hz motor) az dokunur → ardından `voice.denoise` ile birlikte kullan. Araç içi örnek kayıtta (kelime dışı / konuşma): temizliksiz -10.6, `denoise` -20.6, `dfn` -26.7, `dfn`+`denoise` -32.6 dB; duraklardaki gürültü gücü çıkarılarak tahmin edilen gerçek ses eğimi (2-5k / 0.3-1k) -19.4, `dfn` sonrası -19.7 (ses korunur), `denoise` -16.2 (gürültü kalır). Ölçüm dinlemenin yerini tutmaz: gürültülü kayıtta (temiz ölçülse bile) önceki sesli sürümü de `output/<slug>/` içine koy, kullanıcı A/B dinleyip seçsin |
| `voice.nr: 0` | afftdn'i zincirden çıkarır (`voice.denoise` ile). Zincir gecikmesi negatif ölçülürse (afftdn yokken HPF/EQ fazı, ~-7 örnek) ses de geri hizalanır |
| `voice.none` | **konuşmasız video** (`{"none": true, "music_under": 12}`): ses zinciri, ducking (act = 0) ve konuşma ölçümleri atlanır, ses stem'i tam 0'dır. SFX tablosu ve `gain_db`, müzik gövdesinin (0..final RMS) `music_under` dB üstündeki **sanal konuşma referansına** göre kurulur; müzik kazancı 1'dir. Verilmezse ve ses kanalı sessizse motor durur (eskiden: konuşma RMS -240 dB → SFX/müzik -250 dB, loudness döngüsü +240 dB, limiter GR 6.7 dB, "GEÇTİ"). Rapor: `voice_vs_music_dB`/`duck_gain_dB`/senkron yerine `sections_LUFS` (bölüm başına momentary medyan/maks), `final_decay_M_LUFS`, `mix.limiter_gr_max_dB`, `voice_stem_peak` (0 olmalı, GEÇTİ şartı) ve satır başına `vs_music_dB` (SFX 50 ms tepe − ±0.5 s müzik RMS) |
| `tp_ceil` | isteğe bağlı limiter tavanı (dBTP, varsayılan -1.9); plan.json `audio.tp_ceil`'den aktarılır. AAC 256k kodlama tepeyi ~0.4–0.5 dB taşırabilir: final mp4'te TP > -1.5 çıkarsa -2.3 kullan (örnek: wav -2.3 → AAC -1.9). Taşırma düzensizse (örnek: ffmpeg aac keskin geçişte -1.9 → -1.0, tavan -2.8'de +0.3) tavanı indirmek yerine plan.json kökünde `"aac": "aac_at"` (`./studyo final`; Mac'te Apple AudioToolbox kodlayıcısı, Windows'ta ffmpeg karşılığı otomatik kullanılır, studyo.py seçer): Mac'te aynı miks -1.9 → -1.8, dudak senkronu 0 örnek |

## Olay tipleri (sesi ve ne zaman kullanılacağı)
| tip | ses | kullanım |
|---|---|---|
| `impact_intro` | sub boom + gürültü patlaması + hafif parıltı | videonun ilk karesi |
| `impact` | sub boom (100→50 Hz) + gürültü + çıtırtı | başlık çarpması, punch-in, riser sonu |
| `stamp_impact` | tok vuruş + şaplak + küçük boom | damga, ekran sarsıntısı (videonun ortasındaysa müzikte drop) |
| `ding_stamp` | damga + tonun 3. derecesinde çan | onay damgası |
| `ding` | çan (kısmiler < 7.6 kHz); her ding bir üst nota | onay işareti, tik |
| `pop` | kısa, yükselen "bubble" | çip, kart, pencere belirmesi |
| `swoosh_pop` | kısa swoosh → pop | uçarak gelen öğe |
| `whoosh` / `whoosh_up` / `whoosh_down` | filtreli gürültü süpürmesi + pan; `dur` (vars. 0.3) | sahne geçişi, yukarı/aşağı hareket |
| `riser` | gürültü + tonik 2 oktav yükselir; `dur` (vars. 0.7) | gerilim; hemen ardına `impact` koy |
| `flip_ticks` | 4 mekanik tık; `dur` (vars. 0.45) | sayaç, yıl dönmesi |
| `typing` | `count` tuş (vars. 12), `dur` (vars. 0.8), tohumlu rastgele değişim | yazı yazılırken |
| `click_load` | UI tıkı + kısa yükleme cıvıltısı | enter, sayfa açılması |
| `click_tap` | UI dokunuşu + onay blibi | butona dokunma |
| `whoosh_final_hit` | 0.3 s whoosh → büyük impact + parıltı | son kart (müzik finali de buraya oturur) |
| `file` | dosyadan kesit: `{"type":"file","path":"assets/sfx/x.wav","gain_db":-1.5}` | hazır ses (jenerik/imza kesiti; yalnızca kullanıcı seçtiyse, telif durumu bilinerek) |

**`file` olayı:** ffmpeg ile okunur (wav/mp3/m4a), 48 kHz stereoya çevrilir. Göreli `path` önce klasör kökünde, sonra proje klasöründe, sonra `work/` içinde aranır; bulunamazsa motor durur. Kenarlara tık güvenliği uygulanır (2 ms giriş, 10 ms çıkış). Dosya tepeye göre değil, başlangıcına göre yerleşir: **ilk örnek tam `t` anına** düşer (+1 kare kuralı uygulanmaz, öne/geri almak için `off` kullan). Seviye için tepe değil, etkin kısmın (50 ms zarfı tepeden en fazla 30 dB aşağıda olan örnekler) ortalama RMS'i kullanılır: `gain_db` = konuşma RMS'ine göre dB (0 = konuşmayla aynı). Reverb gönderimi yoktur. Dosya diğer efektler gibi HPF 40 Hz, sfx bus'ı, normalize ve limiter zincirinden geçer. Rapor satırında stem içindeki yer çapraz korelasyonla ölçülür; ayrıca `rms_vs_voice_dB`, `peak50_vs_voice_dB`, dosyaya uygulanan toplam kazanç (`file_gain_dB`) ve kesit süresince `limiter_gr_max_dB` yazılır. Bu türü kullanmayan projelerin çıktısı değişmez. Örnek: 1.77 s'lik bir jenerik kesiti `gain_db -1.5` ile momentary ortalama -16.1, maksimum -15.3 LUFS verdi (konuşma medyanı -14.1 LUFS, limiter GR 0 dB).

Bilinmeyen bir tip çökme yaratmaz: adına göre en yakın sese eşlenir (`*hit*`→impact, `*swoosh*`→swoosh_pop, `*tick*`→flip_ticks…), eşleşme yoksa pop çalar ve UYARI yazılır. Süre dışındaki olaylar UYARI ile atlanır. `gain_db` ile tek bir olayın seviyesi ayarlanabilir.

## Zamanlama kuralı
- Nokta olayların ana tepesi **t + 1 kare (33.3 ms)** anına düşer.
- Süpürmelerin (`whoosh*`, `riser`) tepesi **t + dur** anındadır, yani hareketin sonunda.
- Yerleştirme tepeye göre yapılır: önce tek başına render alınır, tepe örneği bulunur (2 ms RMS; süpürmede 15 ms, çanda ilk 25 ms içinde), sonra bu örnek hedefe kaydırılır.
- Müzik vuruşları (ara vuruşlar ve final) aynı ana, yani olay + 1 kareye hizalanır. Bir olayla çakışan crash da +1 kare kaydırılır.

## music bloğu (hepsi isteğe bağlı)
```json
{"bpm":120, "key":"F", "progression":["I","vi","IV","V"], "bars":["I","vi",...],
 "final_hit":27.27, "final_chord":"I", "skip_first_kick":true,
 "drops":[[a,b]], "builds":[[a,b]], "gaps":[[a,b]], "light":[[a,b]], "light_gain_db":2.0,
 "urgent":[[a,b]], "hits":[{"t":20.61,"chord":"V"}], "crashes":[[t,gain]],
 "layers":{"ghost_hats":[[a,b]], "open_hats":[[a,b]], "stabs":[[a,b]], "stabs_sparse":[[a,b]], "arps":[[a,b,gain?]]}}
```
- `key` majördür (C…B, # veya b). Akorlar `I ii iii IV V vi` romen rakamlarıyla yazılır. `bars` ölçü başına akordur (1 ölçü = 4 vuruş); kısa kalırsa `progression` döngüsüyle tamamlanır.
- **drops:** davul, bas ve stab'lar susar, rezonanslı LPF 500 Hz'e iner. Pad ve uzun bas kalır, son 0.5 s'de hat kreşendosu, `b` anında crash.
- **builds:** trampet rulosu çalar (önce 8'lik, son 1.5 vuruş 16'lık), HPF 25 Hz'den 1.1 kHz'e çıkar.
- **gaps:** yeni davul/bas/stab tetiklenmez, ama **pad ve kuyruklar sürer** (pratikte "davulsuz pad + arp" bölümü). Müziğin TAMAMEN susması gerekiyorsa (ör. dosyadan efekt çalarken) gaps'e ek olarak `t0=0`'dan başlayan, adımsız bir ±100 dB rampa çifti kullan: `[0, a, 100, 0.1], [0, b, -100, 0.025]`. Bu çift a anından sonraki 0.1 s içinde müziği -100 dB'ye indirir (pad ve reverb dahil), b anından sonraki 25 ms içinde geri açar (örnek: a = dosya başlangıcı - 0.026 s, b = geri giriş vuruş tepesi - 0.028 s).
- **light:** yarım tempoda yumuşak kick, uzun bas notaları, bir oktav yukarıda parlak çan-pluck'lar, açık pad, `light_gain_db` kadar yükseltme.
- **hits:** kick + crash + akor stab, olay + 1 kareye oturur. Finalde tonik maj9 yığını çalar ve reverb ile `total_duration`'a kadar söner.
- Kick, finalden önceki vuruşta durur ve yerine iki 16'lık trampet "pickup" gelir.
- **piyano (isteğe bağlı):** `layers.piano: [[t0, t1, kazanç, desen, vel_çarpanı?]]` sentez sıcak piyano çalar. Akorlar `bars`'ı izler: sol el kök ve beşli (~F2–E3), sağ el akor tonları (~Bb3–E5). Pedal ölçü başında ya da aralık sonunda değişir (damper ~90 ms). Desenler: `one` (tek el, sakin), `two` (iki el, 8'lik akış), `full` (doruk), `chords` (açık blok akorlar), `hold` (tek uzun akor), `thin` (nefes, tek nota). Tını: iki tel ±0.6 cent, inharmonik kısmiler, çekiç gürültüsü, velocity düşükse koyu (una corda), oda reverb'ü, 1.5 kHz üstüne raf (konuşma bandından çekilir; bus'ta 1–4 kHz payı ~%2). `music.piano: {"final": kazanç, "final_pluck": 0.25, "room": 0.25, "tone_db": -4, "hall": 0.12}`. `final` > 0 ise logoda tek, sönümlenen I maj9 çalar; `final_pluck` eski pluck yığınını kısar. Ek düğmeler: `light_pluck_gain` (light'taki 8'lik çan-pluck, varsayılan 0.24, 0 = yok) ve `final_crash_gain` (varsayılan 0.32), `kick: "felt"` (tüm müzik kick'leri kliksiz keçe/timpani vuruşu olur: perde 110→58 Hz, 4 ms atak, 1.2 kHz alçak geçiren; piyano/sinematik yatakta club kick'in 2.5 kHz üstü gürültü kliği tık gibi duyulur). Katman verilmezse çıktı değişmez.
- **kâğıt/foley perküsyon (isteğe bağlı):** `layers.foley: [[t0, t1, kazanç, desen?, swing?]]` kolaj/stop-motion sahnelerine el yapımı doku verir. İki ses vardır: kâğıt hışırtısı (seyrek mikro tıklar, 1.6–7 kHz, 2 ms atak, ~35 ms sönüm, 6 tohumlu doku) ve karton/parmak tıkı (210→150 Hz gövde + 0.6–2.4 kHz gürültü). Desenler: `paper` (16'lık hışırtı, 8'lik offbeat vurgulu, 2 ve 4'te tık), `light` (yalnız offbeat hışırtı + 2 ve 4'te tık). Tek 16'lıklar `swing` kadar gecikir (varsayılan 0.12 × 16'lık). İnsan dokunuşu tohumludur: ±3 ms, ±%12 velocity. Drop, gap ve build içinde çalmaz; pompasızdır, 0.15 hall gönderimi alır. Seviye: `paper` 0.6, kâğıdın 1.5 kHz üstü payını hi-hat düzeyine getirir (müziğin 1.5 kHz üstü toplamının ~2.7 dB altı). 0.3'te algılanmaz (-6.6 dB). Katman verilmezse çıktı değişmez.
- **`drive` (isteğe bağlı):** müzik veriyolu sonundaki `tanh` doygunluğunun sürüşü (varsayılan 1.4). Müzik önde olduğunda (konuşmasız) -14 LUFS'ta kick atakları limiter'ı her vuruşta 2–3 dB, vuruşlarda 4+ dB çalıştırır; alt bası kısmak işe yaramaz (K-ağırlıklı loudness düşer, kazanç artar, GR büyür). Sürüş atakları limiter'dan önce yumuşak kırpar: 1.4 → GR 4.3, 1.8 → 3.1, 2.0 → 2.5, 2.2 → 1.9 dB; bölüm loudness'ları ±0.3 LU içinde kalır.
- **`file` (isteğe bağlı; kullanıcının verdiği lisanslı parça):** `{"path", "start", "gain_db": 0, "fade_in": 0.005, "fade_out": 1.0}` hazır parçayı gövde müzik yapar; **sentez müzik üretilmez** (davul, pad, vuruşlar, final yok). Dosyanın tamamı ffmpeg ile 48 kHz stereo olarak çözülür ve örnek hassasiyetinde kesilir (`start` = parçada video 0; girişte `-ss` yok, mp3 kodlayıcı gecikmesi kaydırmasın). EQ ya da saturasyon uygulanmaz. Başta kosinüs fade_in, `total`'de biten kosinüs fade_out (son ~1 s: doğal bitiş, döngü yok). `final_hit` verilmezse final = fade_out başıdır (total uzamaz). `gain_ramps` ve `voice.none` ile birlikte çalışır; SFX referansı parçanın gövde RMS'i + `music_under`'dır.
- **`bed_end`, `bed_fade` (isteğe bağlı):** final vuruşundan sonra çağrı kartı okunurken müzik ölmesin. Final vuruşu `final_hit`'te kalır. Davul, 8'lik bas ve stab finalde yeni nota çalmaz (kick zaten finalden önceki vuruşta durur). Final sonrasında pad, arp, `light` çan-pluck'u ve light uzun bas `bed_end`'e kadar sürer, son `bed_fade` s'de (vars. 0.5) kosinüsle söner. `bars` yatağı da kapsamalı (ölçü sayısı = ceil(max(final, bed_end) / ölçü)). Yatağı `light` yapınca girişte kick çalmasın diye başlangıcı 0.1 ms sonraya al (`[final + 0.0001, bed_end]`). Seviye için basamaksız rampa kullan: `[0, total, -g, 0]` + `[0, final - 0.05, +g, 0.08]`; final vuruşu drop seviyesinde, yatak drop'un ~6 LU altında (örnek: drop -12.3, yatak -18.0…-18.5, 12.0'da -23.5 LUFS momentary). Verilmezse (bed_end ≤ final) davranış değişmez.

**Eksik alanlar için varsayılanlar (`derive_music`):**
- `final_hit`: tipinde "final" geçen ilk olay, yoksa `video_end`. Ölçü sayısı = ceil(final / ölçü).
- `builds`: her riser için, riser bitişinin 8'liğe aşağı yuvarlanmış hali biter; en az 3 vuruş sürer. `gaps`: build sonundan bir sonraki vuruşa kadar. `hits`: riser sonuna denk gelen her `impact`.
- `drops`: videonun %25–75 arasındaki `stamp_impact`/`impact` olayları; aralarında en az 8 s olur, uzunluk [16'lık aşağı, t+0.9 vuruş yukarı].
- Anahtar kelimeye göre: light = brand, marka, çözüm, ferah, solution, logo, ürün; CTA = cta, takip, follow, abone; urgent = urgent, acil, gerilim, hemen.
- `layers`: ilk bölüm (hook) ile urgent ve CTA'da tam stab ve hayalet hat çalar. Diğer bölümlerde seyrek stab ve arp çalar; light, drop, build ve gap bölümlerinde çalmaz. Açık hat urgent bölümde, build başlayana kadar çalar.
- `crashes`: açılış (t<0.1'de bir olay varsa), her drop sonu ve CTA girişi. `skip_first_kick`: 0'da bir impact varsa ilk kick atlanır.

## Miks hedefleri
- **mix.wav:** 48 kHz, 24 bit, stereo; tam olarak round(total×48000) örnek. Entegre loudness **-14.0 LUFS (±0.1)**, true peak **≤ -1.5 dBTP** (limiter tavanı -1.9). Son 0.15 s kosinüs fade ile biter, son örnek 0'dır.
- **Ses:** mono'ya toplanır ve ortalanır. Zincir: HPF 80 Hz → afftdn → 250 Hz'de -2 dB → 3.5 kHz'de +2.5 dB → 9 kHz üstü +1.5 dB raf → 3:1 kompresör. Ses -28 LUFS'tan (mono) 1 dB'den fazla saparsa önce kazançla oraya getirilir.
- **Gürültü:** gürültü tabanı > -50 dBFS ise nr=20, nf = taban + 8 dB ve kompresörden sonra yumuşak expander (en fazla ~-10 dB). Temiz kayıtta nr=10, nf=-45.
- **Müzik:** motor konuşurken müziği sesin **18.5 dB** altına koyar (2 s'lik pencerelerde 16–20 dB kabul). Giriş varsayılan olarak `gain_ramps` ile kısılır (ilk 5 s -6 dB). Tüm süreye -3 dB (~21 dB) bazı videolarda istendi, bazılarında müzik fazla kısık bulunup kaldırıldı; yeni projelerde tüm süre kısması olmadan başla (varsayılan 18.5 dB), kullanıcı isterse ekle. Ducking -6 dB'dir: 40 ms ileri bakış, 150 ms hold, 30 ms attack, 120 ms release. Kelime arası mikro boşluklarda pompalamaz; uzun boşlukta ve finalden sonra ~6 dB yükselir.
- **SFX seviyesi:** 50 ms tepe RMS'i, konuşma RMS'ine göre: impact -2/-3, whoosh -9, pop -9, ding -8, tık/tuş -11/-12 dB. Ölçülen değerler çevresindeki konuşmanın 3–13 dB altında kalmalı, ses hep önde olmalı.
- **Telefon dostu:** müziğe 60 Hz HPF, 120 Hz'de -4 dB alt raf ve 5 kHz'de +3 dB üst raf uygulanır. Miksin < 80 Hz enerjisi < %3 olmalı (tipik değer: %1.6).

## Ölçüm kontrol listesi (betik `audio_report.json`'a yazar ve SONUÇ: GEÇTİ/KALDI basar)
1. `ffmpeg -i mix.wav -af ebur128=peak=true:framelog=quiet -f null -` → I ve True peak değerlerine bak.
2. Örnek sayısı `expected_samples` ile eşit mi, son örnek 0 mı?
3. `voice_vs_music_dB`: konuşma pencerelerinde fark 16–20 dB mi? Drop içinde biraz fazla çıkması normaldir.
4. `duck_gain_dB`: konuşmada ≈ -6, finalden sonra ≈ 0 mı?
5. `sfx_peaks`: `isolated` hedefle tam aynı mı? Çakışmayan olaylarda `err_ms` ≤ 10 mu? `overlapped=true` olan satırlar (başka bir olay 60 ms içinde) yalnızca izole ölçüme göre değerlendirilir.
6. `voice_sync_lag_samples` ≈ 0 mı (dudak senkronu)? `voice_processing.noise_vs_speech_dB` işlem sonrası düşmüş mü?
7. Tekrar üretilebilirlik: aynı girdiyle iki çalıştırma bit-bit aynı olmalı (`md5`).

## Bilinen tuzaklar
- **iPhone L/R kayması:** iki mikrofon ~12 örnek (0.25 ms) kaymalı gelir. Doğrudan toplamak 2 kHz'de çentik açar, betik çapraz korelasyonla hizalayıp toplar.
- **afftdn gecikmesi:** ~1195 örnek (25 ms) ekler. Ölçülüp geri kaydırılmazsa ses bir karenin yarısı kadar geç kalır.
- **Kompresör gürültüyü yükseltir:** temiz kayıtta (oda tonu -56 dBFS) afftdn yalnız ~2 dB alır. Gürültülü kayıtta kompresör, afftdn'in kazandırdığını geri verir, bu yüzden ardından expander gerekir. Testte konuşmaya göre -16 dB'den -28 dB'ye indi.
- **Ağız/dudak tıkları:** yalnızca kelime maskesi dışında bastırılır. `adeclick` konuşmayı bozuyor, kullanma.
- **Dijital sessizliğe ani geçiş:** son kelimeden sonraki oda tonu, video sonundan ~1 kare önce kosinüsle kapatılır.
- **Limiter ve aynı anda gelen tepeler:** SFX impact'i ile müzik vuruşu aynı örneğe hizalı olduğu için tepeler toplanır. Limiter 4x aşırı örneklemeli ve ileri bakışlıdır (tavan -1.9). Gain reduction 2–3 dB'yi geçerse SFX seviyesini düşür, limiter'ı zorlama.
- **Bas ağırlığı:** sentez müzikte enerjinin yarısı 80 Hz altına kaçar ve telefonda duyulmaz. Kick'te 190 Hz "knock" ve bas harmonikleri gerekir.
- **Çan tepesi:** uzun sönümde kısmilerin vuruşu tepeyi geç bir ana kaydırabilir. Bu yüzden yerleştirmede ilk 25 ms içindeki tepe, ölçümde atak (yarı genlik) anı kullanılır.
- **Kayan nokta ızgarası:** türetilen zamanlar 6 basamağa yuvarlanır (`r6`). Aksi halde 10.06 gibi sınırlar 1 ulp kayar ve bit-bit tekrar üretim bozulur.
- **SFX reverb'i** sürekli seslerin (ding) tepe ölçümünü kaydırabilir. Ding'in reverb gönderimi 0.12'de tutulur.
- **Miksten müzik payını ölçerken** (`mix - ses×G - sfx.wav`), çıkarılan sese ve SFX'e de miksin 30 Hz HPF'sini uygula. Uygulanmazsa HPF'nin faz kayması sesten -10…-14 dB artık bırakır, müzik 3–4 dB yüksek ölçülür. Davulsuz giriş ölçüsü groove'dan ~12 dB kısık çıkar. Üstüne `gain_ramps` -6 eklenince müzik konuşmanın 34 dB altına iner, yani duyulmaz. Davulsuz ölçüyü içerikle (piyano `one`, arp) ya da daha az kısmayla doldur.

## Bilinen motor tuzağı (04_audio.py)
- Pickup ve drop bası zamanları `r6` ile yuvarlanıp ızgarayla `abs(t - x) < 1e-9` toleransla karşılaştırılıyor. 16'lık süresi 6 ondalığa tam sığmayan tempolarda bu eşleşme sessizce başarısız olur: pickup ya da drop bası çalmaz. Mevcut miksleri değiştirmemek için motorda düzeltilmedi.
- Çözüm: 16'lığı 6 ondalığa tam sığan bir BPM seç (ör. 120, 125, 100).
- `gain_ramps` rampasının bitişi `total`'ı geçerse motor çöker.
- `light` bölümü tam ızgara noktasında başlarsa iki kick üst üste çalar. Başlangıcı 0.1 ms öne al.
- Izgara `k × S16` kayan noktada ondalık sınırın 1 ulp **altına** düşebilir (133.33 bpm: 48 × 0.1125 = 5.3999999999999995). O zaman `[a, b)` aralıkları (gaps/drops/builds/light) ilk 16'lığı kaçırır: ör. drop vuruşundaki gap ızgara kick'ini susturamaz, hit kick'iyle 33 ms flam olur. Çözüm: bpm'i 1 ulp aşağı ver (`133.3333333333333`); 60/bpm ondalığın hemen üstünde kalır, tüm ızgara noktaları sınırın ≤1e-9 üstüne düşer, `abs(t - x) < 1e-9` eşleşmeleri ve finalden önceki kick durması doğru çalışır. Kontrol: `k*S16 >= round(k*S16_ondalık, 6)` her k için.
- Final vuruşu vuruş ızgarasında değilse (kick_stop + 2 × 16'lık > final + 0.03) pickup'lar çalmaz; o vuruşta normal backbeat clap kalır.

