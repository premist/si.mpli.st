---
layout: post
title:  "여행 준비, 그리고..."
date:   2012-06-22 13:16:55 +0900
category: travel
aliases:
  - /travel/preparing-google-io.html
  - /travel/2012-06-22-preparing-google-io.html
description: Google I/O 참여를 위해 미국으로 떠날 준비를 하는데, 이전에 쓰던 여행 저널인 followmyfootprint을 이번에도 운영해야겠다는 생각을 했다.
---

Google I/O 참여를 위해 미국으로 떠날 준비를 하는데, 이전에 쓰던 여행 저널인 [followmyfootprint](http://followmyfootprint.tumblr.com/)을 이번에도 운영해야겠다는 생각을 했다. 다만 최근에는 Google Latitude를 사용하지 않고 있고, [Tumblr](http://tumblr.com/) iPhone 앱의 이미지 업로드는 너무 느렸다. 사진이 압축되더라도 빠르게 업로드가 가능하고, 사진마다 지오태깅이 가능하도록 구축하고 싶었다.

결국 새로운 사이트를 개발하여 사용하기에 이르렀다.

웹에서 모든 기능을 사용하도록 구현하기 위하여, iOS6에 추가된 브라우저 내 업로드 덕분에 사진 업로드도 가능해졌고, HTML5 Geolocation API를 사용하여 지오태깅도 가능하게 하였다.

하지만 사진 압축이나 안정성 등의 문제는 해결하지 못했고, 결국 [@sin0ru](http://twitter.com/sin0ru/) 아저씨에게 부탁하여 아이폰 어플리케이션을 제작하고 있다. 사진 촬영과 지오태깅 기능이 들어간 간단한 업로더도 구비된 셈이다.

..뭐 그건 그거고, 다음주에 Google I/O 2012에 참가할 예정이다. 사진과 이야기를 공유할 **followmyfootprint**는 완성이 되는 대로 링크를 공개할 예정이다.

>**사족**

>사실 플랫폼화를 진행하려고 한 프로젝트인데 급작스럽게 시작하게 되었다. 여행 가기 전에 완성을 해야 해서 데드라인도 있는 상황이다. 끝낼 수 있을까...
