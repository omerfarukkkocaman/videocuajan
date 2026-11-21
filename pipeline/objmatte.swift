// Ön plan maskesi (Apple Vision): stok kliplerde kişi ya da herhangi bir nesne (ekran, telefon, fincan…).
// Kullanım: objmatte <kare klasörü> <çıktı klasörü> [genişlik=720] [mod=nesne|kisi]
//   nesne: VNGenerateForegroundInstanceMaskRequest (macOS 14+), kadrajdaki belirgin ön plan öğelerinin hepsi
//   kisi : VNGeneratePersonSegmentationRequest (accurate)
// Her .jpg kare için aynı adla gri tonlu .png maske yazar (beyaz = ön plan). Bulunamazsa siyah maske.
import Foundation
import Vision
import ImageIO
import CoreImage
import UniformTypeIdentifiers

let args = CommandLine.arguments
let inDir = URL(fileURLWithPath: args[1])
let outDir = URL(fileURLWithPath: args[2])
let width = args.count > 3 ? Int(args[3]) ?? 720 : 720
let mode = args.count > 4 ? args[4] : "nesne"
try? FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)
let files = try FileManager.default.contentsOfDirectory(atPath: inDir.path).filter { $0.hasSuffix(".jpg") }.sorted()
let ctx = CIContext(options: [.workingColorSpace: NSNull()])
let gray = CGColorSpaceCreateDeviceGray()

func mask(_ img: CGImage) -> CIImage? {
    let handler = VNImageRequestHandler(cgImage: img, options: [:])
    if mode == "kisi" {
        let req = VNGeneratePersonSegmentationRequest()
        req.qualityLevel = .accurate
        req.outputPixelFormat = kCVPixelFormatType_OneComponent8
        guard (try? handler.perform([req])) != nil, let buf = req.results?.first?.pixelBuffer else { return nil }
        return CIImage(cvPixelBuffer: buf)
    }
    let req = VNGenerateForegroundInstanceMaskRequest()
    guard (try? handler.perform([req])) != nil, let obs = req.results?.first,
          let buf = try? obs.generateScaledMaskForImage(forInstances: obs.allInstances, from: handler) else { return nil }
    return CIImage(cvPixelBuffer: buf)
}

for (n, name) in files.enumerated() {
    let dst = outDir.appendingPathComponent((name as NSString).deletingPathExtension + ".png")
    guard let src = CGImageSourceCreateWithURL(inDir.appendingPathComponent(name) as CFURL, nil),
          let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { continue }
    let h = Int(Double(width) * Double(img.height) / Double(img.width))
    var outImg = CIImage(color: .black).cropped(to: CGRect(x: 0, y: 0, width: width, height: h))
    if let m = mask(img) {
        outImg = m.transformed(by: CGAffineTransform(scaleX: CGFloat(width) / m.extent.width, y: CGFloat(h) / m.extent.height))
    }
    guard let cg = ctx.createCGImage(outImg, from: CGRect(x: 0, y: 0, width: width, height: h), format: .L8, colorSpace: gray),
          let dest = CGImageDestinationCreateWithURL(dst as CFURL, UTType.png.identifier as CFString, 1, nil) else { continue }
    CGImageDestinationAddImage(dest, cg, nil)
    CGImageDestinationFinalize(dest)
    if n % 100 == 0 { FileHandle.standardError.write("maske \(n)/\(files.count)\n".data(using: .utf8)!) }
}
