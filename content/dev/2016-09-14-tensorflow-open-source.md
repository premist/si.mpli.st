---
layout: post
title: "\"왜 Tensorflow처럼 가치 있는 것을 오픈 소스로 공개하나요?\""
date: 2016-09-14 22:30:00 +0900
category: dev
aliases:
  - /dev/tensorflow-open-source.html
  - /dev/2016-09-14-tensorflow-open-source.html
link: https://changelog.com/219/
description: 어제 밤에 The Changelog을 들으면서 인상 깊었던 Tensorflow 구글 엔지니어와의 질답을 짧게 번역했다.
---

어제 밤에 [The Changelog](https://changelog.com/219/)을 들으면서 인상 깊었던 Tensorflow 구글 엔지니어와의 질답.

**Adam Stacoviak (The Changelog)**

> 왜 Tensorflow처럼 가치 있는 것을 오픈 소스로 공개하나요?


**Eli Bixby (Developer Programs Engineer, Google)**

> 아시겠지만 구글은 매주 금요일에 전체 사내 미팅을 하는데, 미팅을 할 때마다 종종 나왔던 질문입니다. 그럴 때마다 Jeff Dean이 만든 ‘왜 Tensorflow를 오픈 소스로 공개하는가’ 문서가 돌곤 했는데, 이것이 다음 내용입니다.

> 구글은 종종 자체적으로 개발한 기술에 대한 whitepaper를 만들곤 하는데, MapReduce나 BigTable과 같은 whitepaper가 그것들이죠. 이렇게 whitepaper를 만들어 공개하고 나면 구글 밖에 있는 똑똑한 사람들이 이를 읽고, API를 만들고, 그렇게 만들어진 API가 산업 표준이 되곤 했습니다. 저희가 공개했던 MapReduce 관련 whitepaper는 Hadoop의 초석이 되었고, BigTable 관련 whitepaper는 HDFS와 여러 분산형 데이터 저장 시스템의 초석이 되었죠. 그러면 Jeff Dean이 (문서에서) 말한 것처럼 굉장히 우스꽝스러운 상황이 발생하게 되는데요, BigTable whitepaper를 공개하고, HBase가 만들어졌고, HBase가 산업 표준이 되었습니다. 이제 구글이 BigTable을 서비스의 형태로 공개하려고 하는데, 이미 HBase가 산업 표준이 되었으니 BigTable과는 복잡미묘하게 다른 HBase API에 맞춰야 한다는거죠.


**Adam Stacoviak**

> 저도 구글에 인턴 등으로 근무하다 떠나신 분들에게 구글 내부에서 쓰던 정말 편리한 도구를 구글을 퇴사하고 나서도 쓰고 싶어 그리워한다는 이야기를 종종 듣곤 합니다. 가령 구글 내의 전체 레포지토리를 간편하게 검색할 수 있는 도구인 Google Code Search가 있는데, 이렇게 간단한 코드 검색 기능이 필요해서 Sourcegraph가 나온 것처럼요.


**Eli Bixby**

> 맞아요. 비슷하게 구글 내부에서 쓰이던 Borg가 Docker의 초석이 되었는데, 이런 일이 여러 번 반복되었습니다. 그래서 내부적으로 쓰이던 도구들이 외부에서 새로 작성되어 오픈 소스로 공개되는 것을 보면서, 저희는 지금보다 더 나은 방법이 있을 것이라고 생각했습니다. 그 방법이란 저희가 오픈 소스 커뮤니티에 참여하고, 이러한 오픈 소스 프로젝트를 저희가 가지고 있는 인프라스트럭쳐에서 돌릴 수 있게 하는 것이죠… (중략) …머신 러닝 전문가를 고용하는 일은 어렵습니다. 그런데 Tensorflow가 업계 표준으로 사용되면, 당신이 고용하는 머신 러닝 전문가가 3개월의 시간을 벌 수 있습니다. 이미 업계 표준으로 사용되는 기술이니 전문가들은 숙지하고 있을 것이고, 따라서 교육에 시간을 쓰지 않아도 되는 것이지요.


**Adam Stacoviak**

> 그렇군요. 그러면 지금까지 오픈 소스에 대한 장점을 계속 이야기했으니 조금 다르게 생각해 봅시다. 구글에서 공개하는 whitepaper를 외부 전문가가 보고 구글 외부에서 새로운 도구를 만들어 업계 표준이 되기 때문에, 처음부터 오픈 소스를 하고 경쟁에 처음부터 참여를 한다고 하셨습니다. 그러면 애초에 whitepaper를 공개하지 않고 독점하면, 그런 문제에 대해 고민할 필요가 없지 않을까요?


**Eli Bixby**

> …사람들이 구글에서 절대 퇴사를 안 한다면 당연히 문제가 없겠죠. (Adam: 으음.) 그 뿐만 아니라, 구글은 경쟁을 떠나서 컴퓨팅을 비롯한 기술을 진보시키려 노력합니다. 저희가 속해 있는 이 기술 업계는 서로에게서 파이 한 조각을 차지하려 경쟁하고 있는게 아니라, 무언가를 어떻게 하는지 연구하고 그 무언가를 해낼 수 있도록 다같이 노력하니까요.
