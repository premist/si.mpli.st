---
layout: post
title: Google Cloud Run 겉핥기
date: 2019-04-20 17:50:00 +0900
category: dev
aliases:
  - /dev/cloud-run-at-a-glance.html
  - /dev/2019-04-20-cloud-run-at-a-glance.html
excerpt: Cloud Next '19에서 발표된 Cloud Run에 개인적으로 만들고 있던 사진 갤러리 사이트를 옮겨보았습니다.
---

2019년 4월, 샌프란시스코에서 [Cloud Next ‘19](https://cloud.withgoogle.com/next/sf/)가 열렸습니다. Shakr DevOps 팀에서 정말 기다리고 있던 [PostgreSQL 11 버전 지원](https://cloud.google.com/sql/docs/release-notes#april_9_2019)을 비롯해 정말 많은 제품 발표가 있었지만, 그 중 Cloud Run이라는 제품이 가장 인상적이었습니다.


### Lambda, Cloud Functions, 그리고 Cloud Run

2014년 아마존이 [Lambda](https://aws.amazon.com/ko/lambda/)를 발표한 이후로 서버리스는 클라우드 인프라 구축의 트렌드가 되었습니다.  구글도 Lambda와 유사한 서버리스 제품인 [Cloud Functions](https://cloud.google.com/functions/)를 출시했지만, Lambda보다 적은 언어를 지원하고 작년 8월 베타 딱지를 떼어서 비교적 성숙하지 않은 제품이란 느낌이 강합니다.

이번에 출시한 Cloud Run은 Google이 따라잡기 게임을 하고 있다는 인상을 없애줄, 강력한 한 방입니다. 코드의 형식을 강제하던 기존 서버리스 서비스와는 다르게 Docker 컨테이너로 배포가 가능하고, `$PORT` 환경 변수에 따라 HTTP 포트를 바꿀 수 있기만 하면 무엇이든 돌릴 수 있습니다. (전체 요구 사항은 [여기](https://cloud.google.com/run/docs/developing)에)

서버리스 플랫폼의 벤더 락인(vendor lock-in)도 해결했습니다. 구글 내에서 사용할때는 운영 걱정 없이 사용할 수도 있고, 이미 존재하는 GKE 클라스터의 자원을 사용하는 것도 가능합니다. 구글이 작년에 발표한 [Knative](https://knative.dev/docs/) 기반이기 때문에, EKS와 같은 다른 제공자의 Kubernetes 클러스터에서도 컨테이너를 같은 방식으로 구동할 수 있습니다.

발표 이후 운영 없이 컨테이너를 구동할 수 있다는 점 때문에 [AWS Fargate](https://aws.amazon.com/ko/fargate/)나 [Azure Container Instances](https://azure.microsoft.com/ko-kr/services/container-instances/)와 비교되기도 했지만, 실행 방식과 과금 방식에서 큰 차이가 있습니다. Fargate 및 ACI는 컨테이너가 상주하는 방식이기 때문에 한 달 내내 웹 서버 컨테이너 한개를 켜두면 30일분의 요금을 지불해야 합니다. Cloud Run은 컨테이너를 사용하지만 Cloud Functions처럼 **요청이 있을 때만 실행**되고, **요청을 처리하는 시간만큼만 과금**이 됩니다.

{{< figure
  src="https://cdn.si.mpli.st/2019-04-20-cloud-run-at-a-glance/billing.png"
  alt="과금 방식 다이어그램"
  attr="과금 방식 다이어그램"
  attrlink="https://cloud.google.com/run/pricing" >}}

또한 요청이 들어오는 정도에 따라 유연하게 컨테이너의 수를 조정하니, 따로 Autoscaler를 관리할 필요도 없습니다. 콘솔에서 최대 동시 실행 갯수를 지정해주기만 하면 됩니다.


### 간단하게 써 보았습니다

이렇게 기존에 나와 있던 다른 솔루션에 대비해서 좋은 점이 무척이나 많았기에, 바로 써 보고 싶다는 생각이 들었습니다. 하지만 베타 상태의 서비스에 무턱대고 운영 중인 서비스를 올릴 순 없죠. 비교적 트래픽이 적고, 개인적으로 만들고 있던 사진 갤러리 사이트인 [35](https://35.premi.st/)를 Cloud Run으로 옮겨보기로 하였습니다.

Angular로 만들어진 단일 페이지 애플리케이션(SPA) 형태의 사이트이기 때문에 간단하게 NGINX를 사용했는데, 앞서 소개한 것처럼 `$PORT` 환경 변수에 따라 열어야 하는 포트를 바꿔야 하기 때문에 간단하게 포트 번호를 치환해주는 스크립트를 만들었습니다.

```bash
# .entrypoint.sh

#!/bin/sh
set -ex
sed "s/80;/${PORT:-80};/g" -i /etc/nginx/conf.d/default.conf
nginx -g "daemon off;"
```

다음으로는 Dockerfile을 만듭니다. NGINX 공식 이미지에 빌드된 디렉터리를 복사하고, 위의 스크립트를 복사한 후 실행하도록 지정하였습니다.

```dockerfile
FROM nginx:1.15-alpine

COPY dist /usr/share/nginx/html
COPY .entrypoint.sh /opt/entrypoint.sh

CMD ["/opt/entrypoint.sh"]
```

이미지를 빌드하고 Container Registry에 푸시를 합니다.

```bash
# Build
docker build -t gcr.io/my-project/my-image:20180420 .

# Push
gcloud auth configure-docker
docker push gcr.io/my-project/my-image:20180420
```

이미지가 모두 푸시되었으면, 콘솔에서 Cloud Run 서비스를 만들 수 있습니다. 이름을 입력하고, GCR에 올린 이미지를 지정해주면 준비 끝! 기본적으로는 요청을 할 때 IAM을 통해 인증을 하도록 요구하지만, ‘Allow unauthenticated invocations’ 를 체크하여 제한을 없애고 공개 웹 사이트를 호스팅할 수 있습니다.

![서비스 만들기](https://cdn.si.mpli.st/2019-04-20-cloud-run-at-a-glance/create-service.png)

수 초 이내에 바로 접근 가능한 URL이 생성됩니다. 시험삼아 프로젝트를 몇 번 만들어 보았는데, 컨테이너 이미지에 문제가 있지 않는 한 URL이 준비되는데 5초 정도 밖에 걸리지 않아서 꽤나 인상깊었습니다.

![배포가 완료된 화면](https://cdn.si.mpli.st/2019-04-20-cloud-run-at-a-glance/after-deploy.png)

컨테이너가 출력하는 로그도 Cloud Run 콘솔에서 쉽게 확인이 가능합니다. 물론 자세한 정보를 원한다면 [Stackdriver Logging](https://cloud.google.com/logging/) 콘솔에서도 확인이 가능합니다.

![요청에 대한 로그 확인](https://cdn.si.mpli.st/2019-04-20-cloud-run-at-a-glance/logs.png)


내부 서비스에 사용하기 위해서는 Cloud Run에서 제공해주는 URL로도 충분하지만, 웹 사이트를 운영하려면 도메인 연결은 필수죠. 도메인 소유권을 인증하고 DNS 레코드를 변경해주면 [Let’s Encrypt](https://letsencrypt.org/) 인증서로 보안 연결까지 자동으로 설정합니다.


{{< figure
  src="https://cdn.si.mpli.st/2019-04-20-cloud-run-at-a-glance/add-domain-mapping.png"
  alt="도메인 연결"
  attr="도메인 연결을 하면..." >}}


{{< figure
  src="https://cdn.si.mpli.st/2019-04-20-cloud-run-at-a-glance/auto-letsencrypt.jpg"
  alt="Let's Encrypt 인증서"
  attr="Let's Encrypt 인증서도 자동으로 설정된다" >}}

워밍업이 된 상태에서 [WebPageTest](http://webpagetest.org)로 로드 테스트를 해 보니, 꽤 괜찮은 반응 속도가 나오는 것을 확인할 수 있습니다.

![도메인 연결](https://cdn.si.mpli.st/2019-04-20-cloud-run-at-a-glance/waterfall.png)

Cloud Run 상에서 실행되는 저의 갤러리 사이트를 [방문](https://35.premi.st/)해서 확인해보세요!


### 마치며

처음 Heroku를 접했을 때, 배포가 이렇게 간단할 수 있구나 라는 생각에 감탄했던 기억이 납니다. 컨테이너를 점점 더 많은 사람들이 사용하게 되고 Kubernetes와 같은 복잡한 도구가 보편화되면서 이따금씩 Heroku가 그리운 적이 있는데, Cloud Run은 이러한 향수를 말끔하게 없애주고, 오히려 Heroku보다도 더욱 쉽게 애플리케이션을 배포할 수 있는 서비스입니다. GA가 되면 충분히 프로덕션 환경에도 도입해볼 가치가 있지 않을까 생각합니다.

다음 포스트에서는 Cloud Run에서 구동되는 서비스를 어떻게 모니터링하는지, GCP의 다른 제품과는 어떻게 연동되는지를 살펴보겠습니다.
