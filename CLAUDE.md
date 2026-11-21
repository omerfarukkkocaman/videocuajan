# Video Stüdyosu (videocuajan)

Bu klasör, ham videoyu ya da seslendirmeyi Claude Code ile kurgulanmış, animasyonlu, altyazılı, müzikli videoya çeviren bir stüdyodur. Kullanıcı büyük ihtimalle yeni başlayan bir öğrencidir.

- **Giriş noktası `/basla`** (`.claude/skills/basla/SKILL.md`). Kullanıcı ne yapacağını bilmiyorsa, ilk kez geldiyse ya da "video yapmak istiyorum" diyorsa onu çalıştır. Diğer akışlar: `/reels` (dikey/kare kurgu), `/youtube` (yatay), `/hikaye` (dikey hikâye/animasyon), `/senaryo` (metin).
- Kullanıcıyla Türkçe, samimi ve sade konuş. Teknik terimi ilk geçtiğinde tek cümleyle açıkla. Uzun sürecek işten önce yaklaşık süreyi söyle.
- Komutlar **`./studyo`** ile çalışır (Mac Terminal ve Windows Git Bash'te aynı). `python`/`python3` yerine hep `./studyo` kullan; doğru Python ortamını kendisi bulur. Kurulum durumu: `./studyo doktor`.
- Remotion kullanma. Animasyonlar `comp/` motoruyla HTML/JS olarak yazılır ve Playwright ile kare kare render edilir.
- Müzik ve efektler koddan sentezlenir (telif riski olmasın); internetten müzik indirme. Kullanıcı kendi lisanslı müziğini verirse kullanılabilir.
- Yapay ses (TTS) üretme; seslendirmeyi kullanıcı kendi kaydeder (`/basla` yönlendirir).
- Ekrana videoda söylenmeyen ya da kullanıcının onaylamadığı iddia yazma. Gerçek bir kişiyi/markayı taklit eden içerik üretme.
- Yeni videolar stil 2 ile yapılır (`.claude/skills/reels/kurallar.md`): güvenli alan denetimi (`./studyo safe <slug> all`) geçmeden teslim yok.
- Kullanıcı klasörü `input/<proje>/` (video/ ses/ broll/ gorsel/ konu.txt); iş alanı `projects/<slug>/`; çıktılar `output/<slug>/<slug>_<format>.mp4`. Bunlar ve `brands/` (örnek marka hariç) git'e girmez.
- Kullanıcının `input/` dosyalarını silme, taşıma, değiştirme.
- Platform: Mac'te Apple araçları (avconvert, Vision), Windows'ta ffmpeg/OpenCV/MediaPipe karşılıkları otomatik kullanılır (`pipeline/arac.py`). Platforma özgü kod yazacaksan oraya ekle.
- `comp/engine.js`, `comp/library.js`, `pipeline/04_audio.py`'de değişiklik yaparsan mevcut bileşenlerin varsayılan davranışını değiştirme; yeni seçenekleri isteğe bağlı ekle.
