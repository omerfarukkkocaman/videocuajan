// Apple Vision OCR: swift pipeline/ocr.swift <img>... -> JSON satırları {"f": dosya, "l": [[metin, x, y, w, h], ...]} (koordinat 0-1, üst-sol)
// Ders videolarında ekran metni okumak için (sahne eşleştirme, gizlilik taraması).
import Foundation
import Vision
import AppKit

let fast = ProcessInfo.processInfo.environment["OCR_FAST"] == "1"
for path in CommandLine.arguments.dropFirst() {
    guard let img = NSImage(contentsOfFile: path),
          let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
    let req = VNRecognizeTextRequest()
    req.recognitionLevel = fast ? .fast : .accurate
    req.recognitionLanguages = ["tr-TR", "en-US"]
    req.usesLanguageCorrection = false
    try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
    var lines: [[Any]] = []
    for o in req.results ?? [] {
        guard let t = o.topCandidates(1).first else { continue }
        let b = o.boundingBox
        lines.append([t.string, round(b.minX * 1000) / 1000, round((1 - b.maxY) * 1000) / 1000, round(b.width * 1000) / 1000, round(b.height * 1000) / 1000])
    }
    let d = try! JSONSerialization.data(withJSONObject: ["f": path, "l": lines])
    print(String(data: d, encoding: .utf8)!)
}
