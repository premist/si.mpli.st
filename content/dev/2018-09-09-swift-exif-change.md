---
layout: post
title: Swift에서 이미지 손실없이 EXIF 정보 변경하기
date: 2018-09-09 17:50:00 +0900
category: dev
aliases:
  - /dev/swift-exif-change.html
  - /dev/2018-09-09-swift-exif-change.html
excerpt: Core Graphics와 Core Image에서 여러 가지의 이미지 처리 기능을 제공해주고 있어서, 이를 이용하여 저작권 메타데이터를 사진에 추가해보기로 했다.
---

<blockquote class="twitter-tweet" data-lang="en"><p lang="ko" dir="ltr">제가 찍은 사진을 올려두는 갤러리를 만들었습니다. 놀러오세요 😊 <a href="https://t.co/Oju48BKcKG">https://t.co/Oju48BKcKG</a></p>&mdash; Premist (@premist) <a href="https://twitter.com/premist/status/1033708178398109699?ref_src=twsrc%5Etfw">August 26, 2018</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

개인 사진 갤러리 사이트인 [35](https://35.premi.st/)를 최근 트위터를 통해 공개했다. 기존에 존재하는 CMS를 이용하지 않고 웹 인터페이스부터 업로드 기능까지 직접 만들게 되어, 간단한 웹사이트이지만 생각했던 것보다 해결해야 하는 점이 많았다.

그 중 여러 번 고치고 개선해야 했던 것은 사진을 올리기 위해 사용하는 업로더. 사진을 축소하고, 워터마크를 추가하고, 메타데이터를 바꾸는 등의 작업을 사진을 올릴 때 매번 직접 할 수는 없으니 업로드를 처리해주는 애플리케이션을 만들고 싶었다. 처음에는 Ruby 스크립트를 대강 만들어 사용하였지만, 사진을 업로드하기 위해서 iTerm을 켜고 `ruby upload.rb /Users/premist/Photo\ Exports/DSC00001.JPG "Sunset"` 을 입력하는 건, 아무리 내가 혼자 쓴다고 하더라도 좋지 않은 사용자 경험이었다.

35의 프론트엔드를 이미 [Angular](https://angular.io/)로 만들었으니 관리자 인터페이스를 만들어서 사용할까 하는 생각도 들었지만, 웹사이트를 통해 사진을 업로드 하게 되면 서버에서 사진을 처리해야 하고, Cloud Functions for Firebase의 [무료 티어](https://firebase.google.com/pricing/)에서는 사용할 수 있는 CPU와 메모리의 한계가 명확하여 관리자 인터페이스를 만드는 건 다음으로 미루기로 했다.

저작권을 무시하고 사진을 사용하는 것을 방지하려고 워터마크를 추가하긴 했지만, 이미지 자체의 메타데이터에 저작권 정보를 추가하면 더 좋을 것 같아서 추가하는 방법을 연구해보기 시작했다. EXIF 내 TIFF 헤더의 Copyright 태그를 주로 쓰지만, Lightroom CC Classic에서는 사진을 내보낼 때 [IPTC 메타데이터](https://iptc.org/standards/photo-metadata/iptc-standard/)를 추가할 수 있는 옵션을 제공하고 있어 이것도 추가하면 좋겠다는 생각이 들었다.

하지만 IPTC 메타데이터 표준에 따라 저작권 정보를 쓸 수 있는 방법이 많지 않다는 것을 알게 되고 난감해졌다. Node.js로 이미지 처리를 할 때 많이 쓰이는 라이브러리인 [sharp](http://sharp.pixelplumbing.com/)의 문서를 찾아보아도 [메타데이터를 읽을 수는 있지만](http://sharp.pixelplumbing.com/en/stable/api-output/#withmetadata) 쓸 수 있는 방법은 없어보였다. Perl로 만들어진 [ExifTool](https://www.sno.phy.queensu.ca/~phil/exiftool/)을 사용하면 [IPTC 태그를 추가할 수는 있지만](https://unix.stackexchange.com/a/125880), Perl로 업로더를 만들지는 않을 것 같아 고려 대상에서는 제외했다.

그렇게 여러 방법을 찾던 중 macOS와 iOS의 미디어 처리 프레임워크가 다양한 기능을 지원한다는 사실이 기억났다. [Core Graphics](https://developer.apple.com/documentation/coregraphics)와 [Core Image](https://developer.apple.com/documentation/coreimage)에서 여러 가지의 이미지 처리 기능을 제공해주고 있어서, 이를 이용하여 저작권 메타데이터를 사진에 추가해보기로 했다.

### CGImageDestinationAddImageFromSource

가장 먼저 시도한 방법은 [CGImageDestinationAddImageFromSource](https://developer.apple.com/documentation/imageio/1465143-cgimagedestinationaddimagefromso)를 이용한 방법이다. CGImageDestinationAddImageFromSource는 이미지의 프로퍼티를 네 번째 인자로 받는데, CGImageProperties에 기술된 아무 파라메터나 CFDictionary 형태로 전달해주면 된다.

```swift
// Run this code in macOS Playground

import AppKit
import ImageIO

let data = Data(contentsOf: Bundle.main.urlForImageResource("image.jpg")!)

let cgImgSource = CGImageSourceCreateWithData(data as CFData, nil)!

let imageProperties = CGImageSourceCopyPropertiesAtIndex(cgImgSource, 0, nil)! as NSDictionary
let mutable = imageProperties.mutableCopy() as! NSMutableDictionary

mutable.setValue("Sample Copyright Text", forKeyPath: "{TIFF}.Copyright")
mutable.setValue("Sample Copyright Text", forKeyPath: "{IPTC}.CopyrightNotice")

let destData = NSMutableData()
let dest = CGImageDestinationCreateWithData(destData as CFMutableData, CGImageSourceGetType(cgImgSource)!, 1, nil)!

CGImageDestinationAddImageFromSource(dest, cgImgSource, 0, (mutable as CFDictionary))
CGImageDestinationFinalize(dest)

let output = URL(fileURLWithPath: "/Users/Shared/Documents/testoutput.jpg")
destData.write(to: output, atomically: true)
```

비교적 간단하게 TIFF 및 IPTC 메타데이터를 변경하는 코드를 작성할 수 있었고, macOS의 Preview로 열었을 때도 변경된 메타데이터를 확인할 수 있었다.


{{< figure
  src="https://cdn.si.mpli.st/2018-09-09-swift-exif-change/first-attempt-info.png"
  class="halfsize"
  alt="제대로 바뀐 저작권 정보" >}}

하지만 이 방식은 문제가 있는데, 이미지의 데이터를 새로 저장하면서 압축을 다시 한다는 것이다. 새로 만들어진 사진 파일을 보면, JPEGRepresentation과 같은 메소드를 사용하지 않았는데도 용량이 줄어있는 것을 확인할 수 있다.

{{< figure
  src="https://cdn.si.mpli.st/2018-09-09-swift-exif-change/first-attempt-output.png"
  alt="용량이 2MB 이상 줄었다"
  attr="용량이 2MB 이상 줄었다" >}}

원본 이미지 데이터를 유지한 채로 메타데이터만 바꾸려면 어떻게 해야 할까?

### CGImageDestinationCopyImageSource

Apple도 이러한 문제를 의식했는지 이에 대한 [Technical Q&A 문서](https://developer.apple.com/library/archive/qa/qa1895/_index.html)를 만들어 두었다. Objective-C 기반이긴 하지만 메서드 이름은 같아서 예제 코드를 무리없이 읽을 수 있었는데, [CGImageDestinationCopyImageSource](https://developer.apple.com/documentation/imageio/1465189-cgimagedestinationcopyimagesourc)라는 메서드를 이용하여 CGImageSource 인스턴스에서 이미지 데이터를 복사해 오는 메서드처럼 보였다.

이 메서드에 대한 자세한 정보를 보기 위해서 레퍼런스 사이트를 들어갔지만, 문서가 하나도 없었다..


{{< figure
  src="https://cdn.si.mpli.st/2018-09-09-swift-exif-change/reference-with-no-doc.png"
  alt="텅 비어있는 문서"
  attr="ㅠㅠ" >}}

어쩔 수 없이 Technical Q&A 문서와 다른 인터넷의 사용 예제를 알음알음 참고해 가며 코드를 작성하기 시작했다.

```swift
// Run this code in macOS Playground

import AppKit
import ImageIO

let data = Data(contentsOf: Bundle.main.urlForImageResource("image.jpg")!)

let cgImgSource = CGImageSourceCreateWithData(data as CFData, nil)!

let metadata = CGImageMetadataCreateMutable()

let copyrightTIFF = CGImageMetadataTagCreate(
    kCGImageMetadataNamespaceTIFF,
    kCGImageMetadataPrefixTIFF,
    kCGImagePropertyTIFFCopyright,
    .string, "Sample Copyright Text" as CFString)!
CGImageMetadataSetTagWithPath(metadata, nil, "tiff:Copyright" as CFString, copyrightTIFF)

let destOptions: [String: AnyObject] = [
    kCGImageDestinationMergeMetadata as String: kCFBooleanFalse,
    kCGImageDestinationMetadata as String: metadata
]

let destData = NSMutableData()
let dest = CGImageDestinationCreateWithData(destData as CFMutableData, CGImageSourceGetType(cgImgSource)!, 1, nil)!

var unmanagedError: Unmanaged<CFError>?
_ = withUnsafeMutablePointer(to: &unmanagedError, { (ptr) in
    CGImageDestinationCopyImageSource(dest, cgImgSource, destOptions as CFDictionary, ptr)
})

let error = unmanagedError?.takeRetainedValue()
if error != nil {
    print("Something horrible happened")
} else {
    let output = URL(fileURLWithPath: "/Users/Shared/Documents/testoutput.jpg")
    destData.write(to: output, atomically: true)
}
```

CGImageDestinationAddImageFromSource를 사용한 코드와 다른 점이 몇 가지가 있다.

- NSMutableDictionary와 `setValue:forKeyPath`를 사용할 수 없고, CGImageMetadataCreateMutable과 CGImageMetadataTagCreate, CGImageMetadataSetTagWithPath을 사용해야 한다.
- 에러를 포인터로 처리하기 때문에, 먼저 CFError 인스턴스의 [Unmanaged 레퍼런스](https://developer.apple.com/documentation/swift/unmanaged)를 만들고, `withUnsafeMutablePointer`를 사용하여 블럭 내에서 CGImageDestinationCopyImageSource를 실행해 주어야 했다. 위에서 링크한 Technical Q&A의 코드는 Objective-C 기반이라 특이하지 않은 신택스로 구현을 해 두었지만, Swift에서는 대부분의 메서드가 안전성을 보장하다 보니 포인터를 직접 다룰 일이 많이 없어 생소한 방식을 사용해야 했다.
- CGImageDestinationCopyImageSource를 실행한 후에는 CGImageDestinationFinalize를 실행하면 안 된다. 위 예시 코드에서도 바로 NSMutableData 인스턴스를 바로 파일로 저장하였다.

이렇게 만들어진 이미지도 첫 번째 시도에서 만든 것처럼 메타데이터가 정상적으로 들어간 것을 확인할 수 있었다. 특이했던 점은, TIFF 메타데이터의 Copyright 태그만 추가를 해 주었는데도 IPTC의 Copyright Notice 태그가 추가되었다는 것이다. 어차피 두 개를 모두 설정하려고 했던 터라 수고를 덜 수 있어서 좋았다.

{{< figure
  src="https://cdn.si.mpli.st/2018-09-09-swift-exif-change/second-attempt-info.png"
  class="halfsize"
  alt="이번에도 제대로 바뀐 저작권 정보" >}}

첫 번째 시도와는 다르게, 원본과 거의 같은 용량의 파일이 생성되었다.

![정보 손실이 없는 사진 파일이 생성되었다](https://cdn.si.mpli.st/2018-09-09-swift-exif-change/second-attempt-output.png)

### 같이 보기

- [35 - Time, Captured in Pixels](https://35.premi.st/)
- [GitHub Gist - Modifying EXIF Data with Swift 3](https://gist.github.com/kwylez/a4b6ec261e52970e1fa5dd4ccfe8898f)
