---
layout: post
title:  "NS1와 NGINX를 이용한 홈메이드 CDN"
date:   2018-04-08 17:10:00 +0900
category: dev
aliases:
  - /dev/2018-04-08-homemade-cdn-with-ns1-and-nginx.html
excerpt: 최근 매우 느려진 해외 인터넷 접속 때문에 직접 CDN을 구축해 보기로 했다.
---

Disclaimer: 리퍼러 링크가 있는 글입니다. 리퍼러 링크를 통해 서비스에 가입하시면 할인 혜택을 제공하기도 하고, 저도 리퍼럴에 대한 작은 보상을 받음으로써 더 많은 글을 쓸 수 있도록 동기 부여가 됩니다.

---


꽤 오래 전부터 [Linode][1]에 VPS를 만들어서 사용하고 있다. 원격 작업 용도나 다른 용도도 많지만, 주된 용도는 지금 여러분이 보고 있는 사이트인 [si.mpli.st][2]부터 [Xenosium][3], [KudoBlog][4]와 같이 여러 사이트를 호스팅 하는 것이다.

일본 데이터센터를 사용하는만큼 한국에서 접속할 때 [DigitalOcean][5]이나 다른 VPS 업체보다 반응 속도가 빠르다는 것이 장점이었는데, 최근 한국에서 해외로 접속하는 속도가 느려지면서 덩달아 속도가 느려져서 어떤 날은 이미지를 모두 불러오는 데에 1분이 넘어갈 때도 생겼다. 최근에 자주 속도가 느려져서 예전에 쓴 글을 보기 위해 오랜 시간 동안 기다리는 경우가 점점 잦아지자, 사이트의 속도를 향상시키기 위한 여러 가지 방법을 고민하기 시작하였다.


### CDN

웹 사이트를 접속하는 속도와 웹 사이트가 호스팅된 위치와는 필연적인 상관 관계가 있다. 아무리 효율적으로 최적화를 한다고 해도, 한국에서 한국 서버에 접속하는 것이랑 미국 서버에 접속하는 것과는 속도의 차이가 날 수밖에 없다.

이를 극복하기 위한 가장 확실한 방법은 서버의 위치를 사용자에 가깝게 옮기는 것이지만, 여러 지역에서 접속하는 사이트의 경우에는 사용자의 위치가 한 곳으로 정해진 것이 아니기 때문에 한 곳을 정하는 것은 불가능하다. 이럴 때는 여러 개의 서버를 통해 각각의 사용자가 자신의 위치와 가장 가까운 서버에 접속하도록 설정할 수 있다. 만약 전 세계의 사용자를 대상으로 사이트를 운영하고 싶다면, 전 세계 구석 구석 서버를 두어 서버와 사용자 간의 거리를 최대한 줄이면 되는 것이다.

하지만 각 나라의 안정적인 데이터센터를 알아보고, 서버를 설정하고, 전 세계 어디에서든 일관적인 컨텐츠를 보여지게 하기 위해서는 꽤 많은 시간과 노력이 들어가기 마련. 이러한 서버 네트워크를 Akamai나 CloudFlare, Fastly와 같은 CDN 업체들이 제공한다. 상업 사이트를 운영한다면 이러한 CDN 업체는 사이트의 퍼포먼스를 위해 필수적인데, Akamai나 Fastly와 같은 곳은 개인 사이트가 사용하기에는 가격이 비싸서 접근성이 떨어지고, CloudFlare는 무료 플랜이 있지만 한국 POP이 불안정하고 무료 플랜은 아예 라우팅이 되지 않아 CDN을 끼면 오히려 느려지는 기현상도 발생한다.

[Shakr.com][6]은 한국에서도 비교적으로 반응 속도가 균일한 [Google Cloud CDN][7]을 사용중인데, 개인적으로 호스팅하는 사이트에 쓰기에는 가격 부담도 있고 Google Cloud에 서버가 호스팅되어 있지도 않다보니 직접 CDN의 역할을 하는 캐시 서버를 만들어서 사용해 보기로 했다.


### 지역 기반 라우팅

가장 먼저 지역 기반 라우팅을 어떻게 할 지 고민하기 시작하였다. 개인적으로 관리하고 있는 서버는 한국과 일본에 위치한 총 두 개의 서버에서, 지역에 따라 어떤 서버를 사용해야 할 지를 정할 수 있어야 했다.

![][image-1]

직접 Anycast 라우팅을 구축할 수도 있겠지만, [절차도 복잡하고 비용도 요구 사항도 까다로워서][8] 어느 정도 찾아보다 포기를 하고 서비스 형태로 제공해 주는 곳을 찾아보게 되었다.

AWS Route 53의 [지연 속도 기반 라우팅(Latency Based Routing)][9]이나 [지리적 라우팅(Geolocation Routing)][10]을 사용하는 방법도 있지만, 두 라우팅 방식 모두 추가적인 비용을 지불해야 하기 때문에 되도록 지양하고 싶었다.

내가 소유하고 있는 모든 도메인은 [DNSimple][11]을 통해 관리하고 있는데, 찾아보니 DNSimple에도 [Regional Records][12]라는 이름으로 특정 요금제에서는 사용자의 접속 지역에 따라 다른 DNS 레코드를 반환해주는 기능이 들어가 있었다. 다만 지역 설정이 아시아의 경우 일본 하나밖에 없어서, 한국의 유저를 구별해낼 수 있는 방법이 없었다.

![][image-2]
<span style="text-align: center;display:block;"> DNSimple의 Regional Records 기능</span>

여러 방법을 찾아보던 중 최근 유명세를 타기 시작한 DNS 제공자인 [NS1][13]에 무료 플랜이 있다는 사실을 발견하고, 한번 설정을 해 보았다.


### NS1의 Filter Chain

NS1의 킬러 기능은 Filter Chain인데, 서버의 다운타임이나 사용자의 위치 등 다양한 종류의 지표를 이용하여 DNS 요청에 어떤 레코드를 반환해 줄 지를 설정할 수 있다.

![][image-3]
<span style="text-align: center;display:block;"> NS1에서 지원하는 다양한 필터</span>

무료 사용자의 경우 Filter Chain을 한 개의 레코드에 사용할 수 있는데, 여러 사이트에 각각 도메인을 배정하기 위해 와일드카드 레코드를 생성하였다. 그런 다음 Filter Chain으로 한국과 한국 외의 레코드 반환값을 다르게 지정하였다.

![][image-4]
<span style="text-align: center;display:block;"> 와일드카드 레코드를 만들고, KR과 Non-KR 그룹을 각각 설정했다</span>

설정을 마치고 DNS 레코드를 쿼리해보니, 서울 엣지 서버의 IP가 정상적으로 반환된다!

```shell
❯ dig simplist.cdn.sapbox.me @8.8.8.8

; <<>> DiG 9.10.6 <<>> simplist.cdn.sapbox.me @8.8.8.8
;; global options: +cmd
;; Got answer:

(중략)

;; ANSWER SECTION:
simplist.cdn.sapbox.me. 21599   IN  A   <SEOUL EDGE IP>

;; Query time: 680 msec
;; SERVER: 8.8.8.8#53(8.8.8.8)
;; WHEN: Sun Apr 08 16:15:49 KST 2018
;; MSG SIZE  rcvd: 67
```

같은 명령어를 일본에 위치한 다른 서버에 접속하여 실행해 보니, 정상적으로 도쿄 오리진 서버의 IP가 반환된다.
```shell
❯ dig simplist.cdn.sapbox.me @8.8.8.8

; <<>> DiG 9.12.1 <<>> simplist.cdn.sapbox.me @8.8.8.8
;; global options: +cmd
;; Got answer:

(중략)

;; ANSWER SECTION:
simplist.cdn.sapbox.me. 21599   IN  A   <TOKYO ORIGIN IP>

;; Query time: 133 msec
;; SERVER: 8.8.8.8#53(8.8.8.8)
;; WHEN: Sun Apr 08 07:18:40 UTC 2018
;; MSG SIZE  rcvd: 67
```


### 캐시 프록시 설정

이제 어떤 서버를 찾아가야 할 지는 설정했으니, 각 서버에서 올바른 리소스를 주도록 설정할 차례였다. 도쿄 오리진 서버의 경우 모든 리소스를 가지고 있으니까 도메인을 추가하고 SSL 인증서를 추가하는 것으로 간단하게 설정을 마칠 수 있지만, 서울 엣지 서버의 경우 도쿄 오리진 서버와 디스크를 공유하지 않으니 파일 호스팅을 설정하는 대신 캐시 프록시를 설정해야 한다. [Varnish][14]와 같은 전용 캐시 서버를 이용할 수도 있지만, 이미 사용하고 있던 웹 서버인 NGINX에도 간단한 캐시 기능이 있어서 그것을 사용하기로 했다.

```nginx
# http block
proxy_cache_path /mnt/superfast-ssd/nginx-cache levels=1:2 keys_zone=default:500m max_size=5g inactive=30d;

# server block
server {
  listen 80;
  listen 443 ssl http2;

  ssl_certificate /opt/certs/fullchain.pem;
  ssl_certificate_key /opt/certs/privkey.key;

  server_name simplist.cdn.sapbox.me;

  proxy_http_version 1.1;
  proxy_cache default;
  proxy_cache_revalidate on;
  proxy_cache_min_uses 3;
  proxy_cache_use_stale error timeout updating http_500 http_502
                        http_503 http_504;
  proxy_cache_valid 200 60d;
  proxy_cache_background_update on;
  proxy_ssl_server_name on;
  proxy_ssl_verify on;
  proxy_ssl_session_reuse on;
  proxy_ssl_trusted_certificate /opt/certs/cacert.pem;

  location / {
    proxy_set_header Host UPSTREAM_HOST;
    proxy_hide_header X-Powered-By;
    add_header X-Powered-By "Sapbox-CDN-EDGENAME";
    add_header X-Sapbox-Cache $upstream_cache_status;
    proxy_pass https://UPSTREAM_HOST;
  }
}
```


SSL을 설정할 때는 [Let's Encrypt][15]의 인증서를 활용했는데, 지역에 따라 반환값이 달라질 수 있으므로 [acme.sh][16]를 이용하여 http-01 챌린지 대신 dns-01 챌린지로 인증서를 발급받았다.


### 결과

이미지가 꽤 많이 포함된 글인 [WeWork, 1년 후][17]를 브라우저 캐시를 해제한 상태로 로드해 본 결과, 간섭이 심한 Wi-Fi 환경에서 12초 정도 로드가 되던 페이지가 1초대에 로드되었다!

![][image-5]

이렇게 구축한 홈메이드 CDN의 장점은, 자신이 원하는 서버 제공자를 선택한 다음 NGINX를 이용해 원하는 대로 세팅을 할 수 있다는 것이다. 통상적인 CDN에 비해 성능이 조금 떨어질 수 있고 관리의 귀찮음도 있겠지만, 개인적인 용도로 사용할 때, 혹은 일반적인 CDN으로는 해결하기가 힘든 특수한 설정을 하고 싶을 때는 충분히 써볼 만 한 것 같다.

[1]:	https://www.linode.com/?r=9cc0e9cc373c8c9accddf7fc5ecef153e40f5a56
[2]:	https://si.mpli.st
[3]:	https://xenosium.com/
[4]:	https://blog.kudokun.me/
[5]:	https://m.do.co/c/6aa0891d593f
[6]:	https://www.shakr.com/
[7]:	https://cloud.google.com/cdn/
[8]:	https://labs.ripe.net/Members/samir_jafferali/build-your-own-anycast-network-in-nine-steps
[9]:	https://aws.amazon.com/ko/blogs/korea/route53-latency-based-routing/
[10]:	https://docs.aws.amazon.com/ko_kr/Route53/latest/DeveloperGuide/routing-policy.html#routing-policy-geo
[11]:	https://dnsimple.com/r/a1ed6fe742efea
[12]:	https://support.dnsimple.com/articles/regional-records/
[13]:	https://ns1.com/
[14]:	https://varnish-cache.org/
[15]:	https://letsencrypt.org/
[16]:	https://github.com/Neilpang/acme.sh
[17]:	https://si.mpli.st/review/wework-a-year-later.html

[image-1]:	https://simplist.cdn.sapbox.me/2018-04-homemade-cdn-with-ns1-and-nginx/cdn-plan.svg "홈메이드 CDN 구조"
[image-2]:	https://simplist.cdn.sapbox.me/2018-04-homemade-cdn-with-ns1-and-nginx/dnsimple.png "DNSimple의 Regional Records 기능"
[image-3]:	https://simplist.cdn.sapbox.me/2018-04-homemade-cdn-with-ns1-and-nginx/ns1-filter-chain.png "NS1의 Filter Chain"
[image-4]:	https://simplist.cdn.sapbox.me/2018-04-homemade-cdn-with-ns1-and-nginx/ns1-filter-chain-config.png "NS1의 Filter Chain"
[image-5]:	https://simplist.cdn.sapbox.me/2018-04-homemade-cdn-with-ns1-and-nginx/inspector-comparison.png "전후 Web Inspector 비교"