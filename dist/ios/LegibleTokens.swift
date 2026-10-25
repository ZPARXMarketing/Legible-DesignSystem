// Legible — generated. Do not edit.
import UIKit

extension UIColor {
    convenience init(legibleHex hex: UInt32) {
        self.init(red: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255, blue: CGFloat(hex & 0xFF) / 255, alpha: 1)
    }
}

enum LegibleTheme {
    enum Light {
        static let bg = UIColor(legibleHex: 0xFAFAF9)
        static let surface = UIColor(legibleHex: 0xFFFFFF)
        static let ink = UIColor(legibleHex: 0x1A1A1A)
        static let ink2 = UIColor(legibleHex: 0x4A4A4A)
        static let line = UIColor(legibleHex: 0x6B6B6B)
        static let accent = UIColor(legibleHex: 0x0B57D0)
        static let onAccent = UIColor(legibleHex: 0xFFFFFF)
        static let focus = UIColor(legibleHex: 0x0B57D0)
        static let success = UIColor(legibleHex: 0x0B6B50)
        static let warning = UIColor(legibleHex: 0x8A4B00)
        static let danger = UIColor(legibleHex: 0xB42318)
        static let successCvd = UIColor(legibleHex: 0x00598C)
        static let warningCvd = UIColor(legibleHex: 0x8A5A00)
        static let dangerCvd = UIColor(legibleHex: 0xA84300)
    }
    enum Sepia {
        static let bg = UIColor(legibleHex: 0xF4ECD8)
        static let surface = UIColor(legibleHex: 0xFBF5E6)
        static let ink = UIColor(legibleHex: 0x332819)
        static let ink2 = UIColor(legibleHex: 0x5C4A35)
        static let line = UIColor(legibleHex: 0x7A6A52)
        static let accent = UIColor(legibleHex: 0x064CB5)
        static let onAccent = UIColor(legibleHex: 0xFFFFFF)
        static let focus = UIColor(legibleHex: 0x0B4FB8)
        static let success = UIColor(legibleHex: 0x035F46)
        static let warning = UIColor(legibleHex: 0x7A4300)
        static let danger = UIColor(legibleHex: 0x9E1101)
        static let successCvd = UIColor(legibleHex: 0x005688)
        static let warningCvd = UIColor(legibleHex: 0x734A00)
        static let dangerCvd = UIColor(legibleHex: 0x8D3600)
    }
    enum Dark {
        static let bg = UIColor(legibleHex: 0x121212)
        static let surface = UIColor(legibleHex: 0x1E1E1E)
        static let ink = UIColor(legibleHex: 0xE9E9E9)
        static let ink2 = UIColor(legibleHex: 0xCECECE)
        static let line = UIColor(legibleHex: 0x7D7D7D)
        static let accent = UIColor(legibleHex: 0xB5D1FF)
        static let onAccent = UIColor(legibleHex: 0x0B1F3F)
        static let focus = UIColor(legibleHex: 0x8AB4F8)
        static let success = UIColor(legibleHex: 0x70E4B0)
        static let warning = UIColor(legibleHex: 0xFFC55C)
        static let danger = UIColor(legibleHex: 0xFFC3BC)
        static let successCvd = UIColor(legibleHex: 0xA2D7FF)
        static let warningCvd = UIColor(legibleHex: 0xFEC661)
        static let dangerCvd = UIColor(legibleHex: 0xFEC29F)
    }
    enum Dim {
        static let bg = UIColor(legibleHex: 0x1F2328)
        static let surface = UIColor(legibleHex: 0x2A2F36)
        static let ink = UIColor(legibleHex: 0xD1D5DB)
        static let ink2 = UIColor(legibleHex: 0xCDD4DF)
        static let line = UIColor(legibleHex: 0x7C8591)
        static let accent = UIColor(legibleHex: 0xBFD7FE)
        static let onAccent = UIColor(legibleHex: 0x0B1F3F)
        static let focus = UIColor(legibleHex: 0x8AB4F8)
        static let success = UIColor(legibleHex: 0x77ECB6)
        static let warning = UIColor(legibleHex: 0xFECE7B)
        static let danger = UIColor(legibleHex: 0xFFC8C1)
        static let successCvd = UIColor(legibleHex: 0xA9D9FF)
        static let warningCvd = UIColor(legibleHex: 0xFFCE7B)
        static let dangerCvd = UIColor(legibleHex: 0xFECBAE)
    }
    enum HcLight {
        static let bg = UIColor(legibleHex: 0xFFFFFF)
        static let surface = UIColor(legibleHex: 0xFFFFFF)
        static let ink = UIColor(legibleHex: 0x000000)
        static let ink2 = UIColor(legibleHex: 0x262626)
        static let line = UIColor(legibleHex: 0x000000)
        static let accent = UIColor(legibleHex: 0x0033A0)
        static let onAccent = UIColor(legibleHex: 0xFFFFFF)
        static let focus = UIColor(legibleHex: 0x0033A0)
        static let success = UIColor(legibleHex: 0x00522F)
        static let warning = UIColor(legibleHex: 0x5C3300)
        static let danger = UIColor(legibleHex: 0x8A0F0F)
        static let successCvd = UIColor(legibleHex: 0x003E66)
        static let warningCvd = UIColor(legibleHex: 0x5C3C00)
        static let dangerCvd = UIColor(legibleHex: 0x7A2E00)
    }
    enum HcDark {
        static let bg = UIColor(legibleHex: 0x000000)
        static let surface = UIColor(legibleHex: 0x0A0A0A)
        static let ink = UIColor(legibleHex: 0xFFFFFF)
        static let ink2 = UIColor(legibleHex: 0xE7E7E7)
        static let line = UIColor(legibleHex: 0xFFFFFF)
        static let accent = UIColor(legibleHex: 0xD9E8FE)
        static let onAccent = UIColor(legibleHex: 0x000000)
        static let focus = UIColor(legibleHex: 0xFFD60A)
        static let success = UIColor(legibleHex: 0x8DF9C8)
        static let warning = UIColor(legibleHex: 0xFFE1A2)
        static let danger = UIColor(legibleHex: 0xFFDEDD)
        static let successCvd = UIColor(legibleHex: 0xCDE7FF)
        static let warningCvd = UIColor(legibleHex: 0xFFE1A9)
        static let dangerCvd = UIColor(legibleHex: 0xFEDEC9)
    }
}

enum LegibleSpacing {
    static let space1: CGFloat = 4
    static let space2: CGFloat = 8
    static let space3: CGFloat = 12
    static let space4: CGFloat = 16
    static let space5: CGFloat = 24
    static let space6: CGFloat = 32
    static let space7: CGFloat = 48
    static let space8: CGFloat = 64
    static let targetMin: CGFloat = 44
    static let gapItem: CGFloat = 8
    static let gapGroup: CGFloat = 24
    static let gapSection: CGFloat = 48
}
