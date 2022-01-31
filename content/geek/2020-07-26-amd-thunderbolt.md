---
layout: post
title: AMD PC에서 썬더볼트 3 모니터 사용하기
date: 2020-07-26 19:13:00 +0900
category: geek
description: 새로운 컴퓨터를 새로 맞추고 싶어서 벼르다가 드디어 맞추게 되었습니다. AMD 컴퓨터에서 썬더볼트 모니터를 사용하기 위한 시행착오와 필요한 부품을 소개합니다.
---

{{< figurelazy class="oversize" src="/images/2020/07/26-amd-thunderbolt/L1000813.jpg" alt="새로 맞춘 PC의 내부" >}}

새 PC를 맞추고 싶어서 벼르다가 드디어 맞추게 되었습니다. 맥북 프로를 제외하면 원래 쓰던 PC가 없었으니 게임을 할 때도 무언가 아쉬웠고, 애플이 ARM 아키텍처로 전환한다는 이야기를 듣고 PC를 따로 두긴 두어야겠구나 하는 생각도 들었죠. 사실 1년 넘게 각을 재고 있다가 명분 한두 개가 필요했는지도 모릅니다.

그렇지만 무턱대고 PC를 맞추지 못하고 미루고 있던 중요한 이유가 하나 있습니다. 바로 제가 쓰는 모니터가 [LG의 울트라파인 5K](https://www.lge.co.kr/lgekor/product/pc/monitor/productDetail.do?cateId=2410&prdId=EPRD.335395)이기 때문인데요, 현재 판매되는 신형(27MD5KL)가 아닌 구형(27MD5KA)를 사용하고 있어서 썬더볼트 3만 사용할 수 있습니다. 최근 AMD가 멋진 CPU를 계속 만들어서 이왕 새 PC를 만들거면 AMD CPU를 사고 싶었는데, 썬더볼트 3는 인텔의 기술이어서 쉽게 사용하기는 힘들었죠.

하지만 작년 인텔이 [썬더볼트 표준을 공개하기로 결정](https://newsroom.intel.com/news/intel-takes-steps-enable-thunderbolt-3-everywhere-releases-protocol/)하고, [썬더볼트 3를 지원하는 첫 AMD 메인보드](https://www.techradar.com/news/this-bizarre-amd-motherboard-supports-thunderbolt-3-and-intel-coolers)가 출시되었습니다. 이후 더 많은 제조사에서 썬더볼트 3를 지원하는 메인보드를 출시하고 있어서, AMD CPU를 선택하고 썬더볼트 3 모니터를 사용하는게 충분히 가능하지 않을까 하는 희망이 생겼습니다.


### 메인보드 고르기

메인보드를 고를 때 두 가지 부분을 고려했습니다. 앞으로 나올 AMD CPU(Zen 3 이상)를 지원할 수 있는지, 그리고 LG UltraFine 5K를 지원할 수 있는지. 후자의 경우 보다 자세한 요구 사항이 있는데요, UltraFine은 최대 해상도인 5K(5120x2880)을 지원하기 위해 화면을 절반(2560x2880)으로 나누고, [두 개의 DisplayPort 1.2 스트림으로 나누어](https://www.anandtech.com/show/10798/lg-introduces-new-4k-and-5k-ultrafine-monitors) 신호를 전송합니다. 따라서 썬더볼트 컨트롤러에 들어가는 DisplayPort 스트림이 두 개가 되어야 하죠. 여기서 위에서 언급한 썬더볼트 3 지원 최초 AMD 메인보드인 [ASRock X570 Phantom Gaming-ITX](https://www.asrock.com/mb/AMD/X570%20Phantom%20Gaming-ITXTB3/index.asp)가 탈락하는데요, DisplayPort 입력이 하나밖에 없기 때문입니다. 인텔의 인증도 받은 모델이지만 아쉽게도 사용할 수 없었습니다. 같은 제조사에서 나온 메인보드인 [ASRock X570 AQUA](https://www.asrock.com/mb/AMD/X570%20AQUA/index.html)는 DisplayPort 입력을 두 개 지원하지만, 100만원에 육박하는 가격과 수냉식 쿨링을 무조건 사용하는 제약이 너무 커서 선택하긴 무리가 있었죠.

{{< figurelazy src="/images/2020/07/26-amd-thunderbolt/asrock-x570-aqua.png" title="이 가격은 좀..." alt="ASRock X570 AQUA 메인보드의 가격" >}}

이와 다르게, 썬더볼트 3 AIC 입력이 있는 메인보드와 썬더볼트 3 AIC(Add-in Card)를 사용하는 방법도 있습니다. 이 쪽으로 고개를 돌리면 더 많은 선택지가 있는데, [Gigabyte](https://www.gigabyte.com/Motherboard/X570-AORUS-MASTER-rev-11-12#kf) 이나 [ASRock](https://www.asrock.com/mb/AMD/X570%20Taichi/index.asp) 에서 다양한 메인보드를 출시하고 있습니다. 저는 이 중에 가장 가격이 저렴하고 게이밍 디자인이 최대한 덜 들어간, [ASRock X570 Pro4](https://www.asrock.com/MB/AMD/X570%20Pro4/index.asp)를 구입하였습니다.


### 썬더볼트 AIC 장착하기

썬더볼트 3를 지원한다고 해도 AIC를 설치하기 전 까지는 사용할 수 없습니다. 이를 위해 ASRock의 AIC를 구입하였는데, 결론적으로 이야기하면 문제가 있어서 Gigabyte의 AIC를 추가적으로 사게 되었습니다.

{{< figurelazy src="/images/2020/07/26-amd-thunderbolt/L1000851.jpg" title="ASRock의 Thunderbolt 3 AIC R2.0, 그리고 Gigabyte의 GC-TITAN-RIDGE 1.0" alt="ASRock과 Gigabyte의 AIC" >}}

ASRock의 AIC는 인텔의 구형 썬더볼트 칩셋인 Alpine Ridge를 사용하고, 보드의 차폐가 제대로 되어있지 않아서인지 울트라파인 5K 모니터를 연결했을 때 간헐적으로 끊김 현상이 발생하였습니다. 해외 포럼을 여럿 찾아보니 비슷한 문제를 겪는 사람이 있었고, Gigabyte의 AIC를 사용하고 해결되었다는 글을 보게 되었습니다. 조금 더 일찍 알았다면 바로 해당 AIC를 구입했겠지만, 워낙 이상한 조합으로 시스템을 맞췄으니까 문제를 찾기도 힘들었던 것 같습니다.

{{< figurelazy src="/images/2020/07/26-amd-thunderbolt/L1000847.jpg" title="안 쓰게 된 ASRock의 썬더볼트 3 카드" alt="안 쓰게 된 ASRock의 썬더볼트 3 카드" >}}

Gigabyte의 GC-TITAN-RIDGE도 ASRock의 그것과 거의 동일한 대신, 보드의 전면이 덮개로 가려져 있어 차폐가 잘 되어 있습니다. 그리고 이름에서 알 수 있듯이 신형 썬더볼트 칩셋인 [Titan Ridge](https://www.anandtech.com/show/12228/intel-titan-ridge-thunderbolt-3)를 사용합니다. 사용하진 않겠지만 전원 포트가 따로 달려 있어 100W의 Power Delivery도 지원합니다.

{{< figurelazy class="oversize" src="/images/2020/07/26-amd-thunderbolt/L1000817.jpg" title="PCIe x4를 사용하는 GC-TITAN-RIDGE AIC" alt="PCIe x4를 사용하는 GC-TITAN-RIDGE AIC" >}}

썬더볼트 AIC를 장착한 이후에는, DisplayPort 케이블을 그래픽카드와 연결해 주어야 합니다. 이를 위해 AIC 후면 패널에 DisplayPort 입력 포트가 두 개 자리잡고 있습니다. 사실 외부에 상시 케이블을 연결해 두어야 하는게 거추장스러울 수 밖에 없는데, 인텔이 이렇게밖에 표준을 만들 수 없던 이유가 있을지 궁금하네요. 여담이지만 애플이 [MPX 모듈](https://support.apple.com/guide/mac-pro/install-mpx-modules-apd8e22bab6b/mac)을 만든 이유도 이런 케이블 연결의 문제를 없애고 싶어서인 것 같습니다.

{{< figurelazy class="oversize" src="/images/2020/07/26-amd-thunderbolt/L1000840.jpg" title="썬더볼트 3 AIC와 그래픽카드를 두 개의 케이블로 이어주었다. 그나마 AIC에 동봉된 DisplayPort 케이블이 짧아서 다행." alt="썬더볼트 3 AIC와 그래픽카드를 두 개의 케이블로 이어주었다." >}}

이렇게 썬더볼트 AIC 장착은 완료되고, 부팅을 하여 BIOS와 윈도에서 설정을 할 시간입니다.


### 설정하기

설정에 앞서 먼저 메인보드의 BIOS를 최신 버전으로 업데이트합니다. 업데이트를 하지 않고 이리저리 설정하다가, NVMe 드라이브가 인식이 되지 않아 부팅이 실패하는 문제를 겪으면서 어리둥절했습니다. ASRock 홈페이지의 [펌웨어 페이지](https://www.asrock.com/MB/AMD/X570%20Pro4/index.asp#BIOS)에 들어가서 전혀 상관없을 것 같은 BIOS 업데이트를 적용하니 거짓말처럼 잘 되더군요...

다음으로는 BIOS에서 썬더볼트 지원을 켜고, 보안 설정을 낮췄습니다. 일반적인 경우라면 썬더볼트 3의 취약점을 해결하기 위해 보안 설정을 그대로 두는 것이 좋지만, 모니터를 사용할 때는 인식이 되어야 시스템을 사용할 수 있어서 불가피하게 이렇게 두었습니다.

{{< figurelazy src="/images/2020/07/26-amd-thunderbolt/L1000853.jpg" title="썬더볼트 지원을 켜고, 보안 등급을 조정하였다." alt="썬더볼트 지원을 켜고, 보안 등급을 조정하였다." >}}

준비가 모두 완료되었으니, AIC의 드라이버를 잡아줄 차례입니다. Gigabyte의 [GC-TITAN-RIDGE 지원페이지](https://www.gigabyte.com/Motherboard/GC-TITAN-RIDGE-rev-10/support#support-dl-driver)에서 다운로드를 받고 실행합니다. 이 때 모니터가 연결되어 있다면 여러 번 깜박일 수 있습니다.

여기까지 모두 완료한 후 재부팅을 해주면, 울트라파인 5K를 최대 해상도와 색영역으로 사용할 수 있습니다!

{{< figurelazy class="oversize" src="/images/2020/07/26-amd-thunderbolt/win.jpg" title="AMD 시스템에서 UltraFine 5K 모니터와, 벨킨의 썬더볼트 프로 독을 사용하고 있는 모습" alt="AMD 시스템에서 UltraFine 5K 모니터와, 벨킨의 썬더볼트 프로 독을 사용하고 있는 모습" >}}


### 마치며

이렇게 세팅 후에도 이따금씩 부팅시 모니터가 인식이 되지 않는 경우가 있는데, 이럴 때는 썬더볼트 3 케이블을 다시 꽂아주면 해결이 되었습니다. 어차피 평소에는 맥북을 연결해서 사용하니, 컴퓨터가 켜지고 케이블을 바꾸게 되어 크게 거슬리진 않습니다. 다만 울트라파인 5K를 메인 디스플레이로 PC에서 사용하신다면, 썬더볼트 3 단자가 내장되어 있는 위의 조금 더 고급형 보드를 보시는 것이 안정성에 도움이 될 것 같습니다.

이렇게 여러 시행착오를 거치고 어렵사리 울트라파인을 사용하면서, 일반적인 모니터를 사용한다면 이런 고생은 안해도 되었을텐데.. 라는 생각이 여러 번 들었습니다. 참 아쉬운건 5K 모니터에서는 대안이 없다는 점인데, DELL이나 HP에서 나온 5K 모델도 단종된지 오래고, 검증된 품질로 이용할 수 있는 레티나급 디스플레이가 울트라파인 5K와 무지막지한 가격의 [애플 프로 디스플레이 XDR](https://www.apple.com/kr/pro-display-xdr/)밖에 없는게 현실입니다. 더 많은 제조사가 27인치급에서 5K 모니터를 만들어주면 좋을 것 같네요.

다행인 건, 칩셋을 밥 먹듯이 바꾸는 인텔과 다르게 AMD는 칩셋 호환성을 꽤 오래 유지해준다는 점입니다. 최신 칩셋인 X570 기반으로 시스템을 맞춘 만큼, 지금 메인보드 그대로 1~3세대 후의 AMD CPU와, 추후 더 많아질 PCIe 4.0 GPU를 추가로 업그레이드할 수 있을 것 같습니다. 미래에는 [썬더볼트 3 표준이 USB 4 표준에 통합](https://www.anandtech.com/show/14048/usb4-specification-40-gbps-type-c-tb3)될 것으로 보이는데, 이러한 복잡한 절차 없이 프로 장비를 쉽게 사용하는 날이 오면 좋겠습니다. 아니면 게이밍을 포기하고 편안하게 맥 컴퓨터를 사도 되겠죠.


### 관련 문서

- [Levelonetechs 포럼 - ASRock X570 Taichi/Gigabyte GC-Titan Ridge AIC](https://forum.level1techs.com/t/solved-asrock-x570-taichi-gigabyte-gc-titan-ridge-aic-thunderbolt-3-devices-ok-but-usb-3-displayport-device-hotplug-causes-bsod/145888) Gigabyte 보드를 사용하여 해결을 하는데 큰 도움이 된 스레드입니다. 같이 고통받고 있는 AMD + 썬더볼트 사용자의 사례를 볼 수 있습니다.
