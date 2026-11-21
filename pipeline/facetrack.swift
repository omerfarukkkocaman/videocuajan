// Yüz takibi (Apple Vision). Kullanım: facetrack <kare klasörü> <adım> > face_track.json
// Çıktı: [{"f": kare, "x0","y0","x1","y1": yüz kutusu (0-1, sol-üst orijin), "c": güven}] — yüz yoksa kare atlanır.
import Foundation
import Vision
import ImageIO

let args = CommandLine.arguments
let dir = URL(fileURLWithPath: args[1])
let step = args.count > 2 ? Int(args[2]) ?? 2 : 2
let files = try FileManager.default.contentsOfDirectory(atPath: dir.path).filter { $0.hasSuffix(".jpg") }.sorted()
var out: [[String: Double]] = []
for (i, name) in files.enumerated() where i % step == 0 {
    guard let src = CGImageSourceCreateWithURL(dir.appendingPathComponent(name) as CFURL, nil),
          let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { continue }
    let req = VNDetectFaceRectanglesRequest()
    try? VNImageRequestHandler(cgImage: img, options: [:]).perform([req])
    // en büyük yüz = konuşan kişi
    guard let face = (req.results ?? []).max(by: { $0.boundingBox.width < $1.boundingBox.width }) else { continue }
    let b = face.boundingBox  // Vision: sol-alt orijin
    out.append(["f": Double(i), "x0": b.minX, "y0": 1 - b.maxY, "x1": b.maxX, "y1": 1 - b.minY, "c": Double(face.confidence)])
}
let data = try JSONSerialization.data(withJSONObject: out, options: [])
FileHandle.standardOutput.write(data)
