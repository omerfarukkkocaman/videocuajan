// İnsan maskesi (Apple Vision, VNGeneratePersonSegmentationRequest).
// Kullanım: personmatte <kare klasörü> <çıktı klasörü> [genişlik=720] [kalite=accurate|balanced|fast]
// Her .jpg kare için aynı adla gri tonlu .png maske yazar (beyaz = kişi). Kişi yoksa siyah maske.
import Foundation
import Vision
import ImageIO
import CoreImage
import UniformTypeIdentifiers

let args = CommandLine.arguments
let inDir = URL(fileURLWithPath: args[1])
let outDir = URL(fileURLWithPath: args[2])
let width = args.count > 3 ? Int(args[3]) ?? 720 : 720
let quality: VNGeneratePersonSegmentationRequest.QualityLevel = {
    switch args.count > 4 ? args[4] : "accurate" {
    case "fast": return .fast
    case "balanced": return .balanced
    default: return .accurate
    }
}()
try? FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)
let files = try FileManager.default.contentsOfDirectory(atPath: inDir.path).filter { $0.hasSuffix(".jpg") }.sorted()
let ctx = CIContext(options: [.workingColorSpace: NSNull()])
let gray = CGColorSpaceCreateDeviceGray()
let req = VNGeneratePersonSegmentationRequest()
req.qualityLevel = quality
req.outputPixelFormat = kCVPixelFormatType_OneComponent8

for (n, name) in files.enumerated() {
    let dst = outDir.appendingPathComponent((name as NSString).deletingPathExtension + ".png")
    guard let src = CGImageSourceCreateWithURL(inDir.appendingPathComponent(name) as CFURL, nil),
          let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { continue }
    let h = Int(Double(width) * Double(img.height) / Double(img.width))
    var outImg: CIImage
    if (try? VNImageRequestHandler(cgImage: img, options: [:]).perform([req])) != nil,
       let buf = req.results?.first?.pixelBuffer {
        let m = CIImage(cvPixelBuffer: buf)
        outImg = m.transformed(by: CGAffineTransform(scaleX: CGFloat(width) / m.extent.width, y: CGFloat(h) / m.extent.height))
    } else {
        outImg = CIImage(color: .black).cropped(to: CGRect(x: 0, y: 0, width: width, height: h))
    }
    guard let cg = ctx.createCGImage(outImg, from: CGRect(x: 0, y: 0, width: width, height: h), format: .L8, colorSpace: gray),
          let dest = CGImageDestinationCreateWithURL(dst as CFURL, UTType.png.identifier as CFString, 1, nil) else { continue }
    CGImageDestinationAddImage(dest, cg, nil)
    CGImageDestinationFinalize(dest)
    if n % 200 == 0 { FileHandle.standardError.write("maske \(n)/\(files.count)\n".data(using: .utf8)!) }
}
