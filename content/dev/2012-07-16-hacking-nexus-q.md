---
layout: post
title:  "Hacking Nexus Q"
date:   2012-07-16 15:07:39 +0900
category: geek
aliases:
  - /dev/hacking-nexus-q.html
  - /dev/2012-07-16-hacking-nexus-q.html
description: Nexus Q를 발표할 때, 사람들의 환호가 터져나온 순간은 바로 'Full Hackability' 를 발표했을 때였다..
---

Nexus Q를 발표할 때, 사람들의 환호가 터져나온 순간은 바로 'Full Hackability' 를 발표했을 때였다. 과연 어떤 식으로 개발자 친화적인 사치품을 제작했을까 궁금했는데, [24시간만에 앱을 구동할 수 있도록 해킹되었다](http://www.theverge.com/2012/6/28/3123155/google-nexus-q-games-hack).

그 후 [부트로더 언락과 루팅, 런쳐 구동](http://forum.xda-developers.com/showthread.php?p=28484300)이 되더니, [Bluetooth HID 입력 장치를 페어링](http://droidcloudshare.blogspot.kr/) 할 수 있게 해킹되었다. 최근에는 넥서스 Q의 상단부를 이용한 Pong 게임까지 등장했다.

TV도 없고 마냥 넥서스 Q를 방치하기에는 너무 아까운 하드웨어라고 생각하여, 해킹을 해보기로 마음먹었다. 하지만 안드로이드에 대한 지식이 없어서 혼자 막연히 시작할 수 없기에,  [@devunt](http://twitter.com/devunt) 님의 도움을 받았다.

![Nexus Q About Page](https://cdn.si.mpli.st/2012-07-16-nexus-q-about-page.jpg)

몇 분 안에 Nexus Q의 부트로더를 언락하고 슈퍼유저 권한을 취득할 수 있었고, ADB 쉘로 키입력을 하나하나 보내서(...) 정보 페이지를 열 수 있었다. 이후에는 Bluetooth HID 마우스를 연결하여 작업하였고, 오늘 드디어 이런 결과가 나왔다.

![Ubuntu + NGINX on Nexus Q](https://cdn.si.mpli.st/2012-07-16-ubuntu-on-q.jpg)

내가 집에 간 사이에 [@devunt](http://twitter.com/devunt)님이 Ubuntu를 Nexus Q에 올리고, 그것도 모자라 [NGINX 웹 서버](http://nginx.org/)까지 컴파일하여 설치 해 놓았다. 이제 서버로 쓰기만 하면..
