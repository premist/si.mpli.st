---
layout: post
title: "오픈소스 시스템 모니터링 에이전트, Telegraf"
date: 2017-09-10 22:41:00 +0900
category: dev
aliases:
  - /dev/introduction-to-telegraf.html
  - /dev/2017-09-10-introduction-to-telegraf.html
description: 서버의 댓수와 상관 없이 프로덕션 환경에서 구동하고 있는 서버가 있다면 모니터링은 반드시 필요하다. 시스템 리소스 사용량과 여러 가지 구성 요소의 지표를 수집할 수 있는 에이전트 Telegraf를 소개한다.
---

서버의 댓수와 상관 없이 프로덕션 환경에서 구동하고 있는 서버가 있다면 모니터링은 반드시 필요하다. 호스팅 업체를 비롯해 여러 기업들에서도 이러한 이유로 [RRDTool][1]이나 [Nagios][2]를 이용하여 서버의 리소스 사용량 지표를 수집하고 그래프를 출력하여 시스템의 사용량을 모니터링한다.

최근에는 애플리케이션을 구성하는 여러 구성 요소(웹 서버, 데이터베이스, 로드 밸런서)에서 유의미한 정보를 수집하기 위해서 시계열 지표(Time series metric)을 [StatsD][3]와 같은 데몬을 통해 수집하거나, 아니면 애플리케이션에서 출력하는 로그에서 [Logstash][4]와 같은 로그 정제 도구를 통해 시계열 지표를 생성한다. 이렇게 만들어진 시계열 지표 자료는 [Elasticsearch][5]나 [InfluxDB][6]와 같은 데이터베이스에 저장하고, [Grafana][7]나 [Kibana][8] 와 같은 도구로 시각화한다.

[Shakr][9]에서도 시스템 모니터링과 시계열 지표 수집을 하고 있는데, 시스템의 규모에 비해 운영을 할 수 있는 팀원의 수가 매우 적어서 여러 솔루션을 직접 이어 시스템을 구축하는 것이 아니라 SaaS 솔루션인 [Datadog][10]을 이용해 서버를 관리하고 시계열 지표를 수집하고 있다.

![][image-1]
<span style="text-align: center;display:block;">수집, 저장, 시각화 소프트웨어</span>

이 글에서는 조금 생소할 수도 있는 에이전트, [Telegraf][11]를 소개하고자 한다.


### Telegraf

Telegraf는 InfluxDB의 제작사, InfluxDB에서 제작한 시스템 모니터링 및 지표 수집 에이전트이다. 플러그인 시스템을 기반으로 제작되어 여러 소프트웨어 혹은 서비스를 위한 지원을 간단하게 추가할 수 있고, InfluxDB나 ElasticSearch와 같은 다양한 백엔드로 수집한 데이터를 전송할 수 있다.

에이전트                | StatsD  | collectd | dd-agent (Datadog) | Telegraf
------------------------|---------|----------|--------------------|---------
**언어**                | Node.js | C        | Python             | Go
**플러그인 시스템**     | ◯       | ◯        | ◯                  | ◯
**시스템 모니터링**     | [△][12] | ◯        | ◯                  | ◯
**StatD 프로토콜 지원** | ◯       | ◯        | ◯                  | ◯
**지표 태그 지원**      | ╳       | ╳        | ◯                  | ◯
**여러 백엔드 지원**    | ◯       | ◯        | ╳                  | ◯

개인적으로 보유하고 있는 여러 시스템을 관리할 수 있는 에이전트를 찾고 있었는데, 여러 에이전트 중에서도 Telegraf가 마음에 들었던 점들은 다음과 같다.

- **단일 바이너리로 배포 가능:** Go 언어로 제작되었기 때문에 별도의 의존성 설치 없이 단일 바이너리만으로 모든 시스템에 배포 및 실행이 가능하다.
- **표준 StatsD 프로토콜 지원:** Telegraf의 지원 여부와 상관 없이 지표를 직접 생성할 수 있기 때문에 직접 제작한 애플리케이션에서도 지표를 수집할 수 있다.
- **다양한 연동 기능 내장:** 별도의 플러그인을 설치할 필요 없이 HAProxy, Kubernetes, NGINX, PostgreSQL와 같은 애플리케이션과의 연동을 지원한다.
- **시스템 모니터링 지원:** StatsD를 사용하여 시스템 모니터링을 하려면 [StatsD System][13]과 같은 플러그인을 설치해야 하는데, Telegraf를 사용하면 별도의 플러그인 없이 CPU나 메모리 사용량과 같은 시스템 지표를 수집할 수 있다.


### Telegraf 설치하기

Telegraf의 장점을 알아보았으니 사용을 위해 설치해보도록 하자. [InfluxData 사이트][14]에서 각 운영체제를 위한 설치 방법을 자세하게 설명하고 있고, 원한다면 패키지나 바이너리를 [릴리즈 페이지][15]에서 직접 다운로드할 수도 있다. 내가 Telegraf를 설치하고자 하는 시스템은 Arch Linux를 구동하고 있어, AUR에 등록되어 있는 [telegraf-bin][16] 패키지를 설치하였다.

<script type="text/javascript" src="https://asciinema.org/a/Dr9ilYbYuNTEfwlwE42KlFyiW.js" id="asciicast-Dr9ilYbYuNTEfwlwE42KlFyiW" async data-speed="2"></script>


### Telegraf 설정

Telegraf를 설치하였다면 이제 설정 파일을 살펴볼 차례이다.

```toml
[global_tags]
  datacenter = "linode-tyo2"
  type = "vm"

[agent]
  interval = "10s"
  round_interval = true
  metric_batch_size = 1000
  metric_buffer_limit = 10000
  connection_jitter = "1s"
  flush_interval = "10s"
  flush_jitter = "1s"

[[outputs.influxdb]]
  urls = ["http://localhost:8086"]
  database = "telegraf"
  retention_policy = ""
  write_consistency = "any"
  timeout = "5s"

[[inputs.cpu]]
  percpu = true
  totalcpu = true
  collect_cpu_time = false

[[inputs.disk]]
  ignore_fs = ["tmpfs", "devtmpfs", "devfs"]

[[inputs.diskio]]

[[inputs.kernel]]

[[inputs.mem]]

[[inputs.processes]]

[[inputs.swap]]

[[inputs.system]]

[[inputs.postgresql]]
  address = "postgres://test:pass@localhost/db?sslmode=disable"
  databases = ["db"]
```


**global\_tags** 항목에서는 모든 지표에 추가될 태그를 정의한다. 예제에서는 `datacenter`와 `type` 태그를 추가해주어 해당 인스턴스의 위치와 종류를 알 수 있도록 설정했다.

**agent** 항목에서는 에이전트의 기본 동작 방식을 정의한다. 지표를 얼마나 자주 지정된 output으로 전송할지, [jitter][17]는 얼마나 줄 지를 설정한다.

**outputs** 항목을 이용하여 수집된 지표를 어디로 보낼지를 정의한다. 예제에서는 로컬에 존재하는 InfluxDB로 전송하도록 설정하였는데, `outputs.datadog`이나 `outputs.kafka` 등 다양한 출력을 정의할 수 있다.

**inputs** 항목을 사용하여 어떤 지표를 수집할지 정의한다. 예제에서는 기본적인 시스템 리소스 사용량과 PostgreSQL 데이터베이스 통계를 수집하도록 설정했다.

예제에서는 사용하지 않았지만, **aggregator**와 **processor**를 이용하여 수집한 지표를 변환할 수 있다. 자세한 정보는 [관련 문서][18]를 참고하자.


### Telegraf로 수집한 지표 시각화 - Grafana

앞서 살펴본 것처럼 지표를 시각화할 때 여러 가지 소프트웨어를 사용할 수 있는데, InfluxDB에 저장된 지표를 시각화할 수 있는 대표적인 도구로는 [Grafana][19]와 [Chronograf][20]가 있다. Grafana의 경우 초기에는 Elasticsearch와 함께 사용이 가능한 Kibana처럼 Graphite와 같이 사용하도록 제작되었지만, 현재는 InfluxDB 뿐만 아니라 매우 다양한 데이터 소스를 지원한다. Chronograf의 경우 Telegraf와 마찬가지로 InfluxData가 제작하였으며, 커뮤니티는 Grafana에 비해 작지만 간단하게 사용하기에는 큰 문제가 없다.

Grafana를 시스템에서 간단하게 구동하려면, Docker 이미지를 사용하는 것이 가장 간편하다. 다음과 같은 명령어로 Grafana를 실행하자.

```shell
docker run -p 3000:3000 -d grafana/grafana
```

실행이 완료되었으면 브라우저로 `localhost:3000`에 방문하여 Grafana를 사용할 수 있다. 위 Docker 이미지로 생성된 Grafana의 기본 사용자 정보인 `admin/admin`로 접속하여, InfluxDB 데이터 소스를 추가해준다.

![][image-2]
<span style="text-align: center;display:block;"> Grafana에 InfluxDB를 데이터 소스로 추가하기</span>

InfluxDB 지표로 직접 대시보드를 제작해도 되지만, Grafana.com에서 [다른 사용자가 미리 제작해둔 대시보드][21]를 받아서 사용할 수도 있다.

![][image-3]
<span style="text-align: center;display:block;"> Grafana로 Telegraf 지표 확인하기</span>


### Telegraf로 수집한 지표 시각화 - Chronograf

Chronograf도 Grafana와 사용 방법이 비슷하지만, Telegraf와 마찬가지로 [릴리즈 페이지][22]에서 단일 바이너리를 다운로드 받아서 설치가 가능하다는 이점이 있다. Docker 이미지로 Chronograf를 실행하려면, 다음 명령어를 사용하자.

```shell
docker run -p 8888:8888 -d quay.io/influxdb/chronograf:1.3.7.0
```

실행이 완료되었으면 브라우저로 `localhost:3000`에 방문하여 Chronograf를 사용할 수 있다.

![][image-4]
<span style="text-align: center;display:block;"> Chronograf에 InfluxDB를 데이터 소스로 추가하기</span>

데이터 소스를 추가하면 Telegraf가 전송한 리소스 사용 현황을 확인할 수 있다.

![][image-5]
<span style="text-align: center;display:block;"> Chronograf로 Telegraf 지표 확인하기</span>

[1]:	https://oss.oetiker.ch/rrdtool/
[2]:	https://www.nagios.org/
[3]:	https://github.com/etsy/statsd
[4]:	https://www.elastic.co/products/logstash
[5]:	https://www.elastic.co/products/elasticsearch
[6]:	https://www.influxdata.com/time-series-platform/influxdb/
[7]:	https://grafana.com/
[8]:	https://www.elastic.co/products/kibana
[9]:	https://www.shakr.com/
[10]:	http://datadoghq.com/
[11]:	https://www.influxdata.com/time-series-platform/telegraf/
[12]:	https://github.com/statsd/system
[13]:	https://github.com/statsd/system
[14]:	https://docs.influxdata.com/telegraf/v1.4/introduction/installation/
[15]:	https://github.com/influxdata/telegraf/releases
[16]:	https://aur.archlinux.org/packages/telegraf-bin/
[17]:	https://www.awsarchitectureblog.com/2015/03/backoff.html
[18]:	https://docs.influxdata.com/telegraf/v1.4/concepts/aggregator_processor_plugins/
[19]:	https://grafana.com/
[20]:	https://www.influxdata.com/time-series-platform/chronograf/
[21]:	https://grafana.com/dashboards?search=telegraf
[22]:	https://github.com/influxdata/chronograf/releases

[image-1]:	https://cdn.si.mpli.st/2017-09-10-introduction-to-telegraf/ingest-store-visualize.svg "수집, 저장, 시각화 소프트웨어"
[image-2]:	https://cdn.si.mpli.st/2017-09-10-introduction-to-telegraf/grafana-setup.jpg "Grafana에 InfluxDB를 데이터 소스로 추가하기"
[image-3]:	https://cdn.si.mpli.st/2017-09-10-introduction-to-telegraf/grafana-in-action.jpg "Grafana에 InfluxDB를 데이터 소스로 추가하기"
[image-4]:	https://cdn.si.mpli.st/2017-09-10-introduction-to-telegraf/chronograf-setup.jpg "Grafana에 InfluxDB를 데이터 소스로 추가하기"
[image-5]:	https://cdn.si.mpli.st/2017-09-10-introduction-to-telegraf/chronograf-in-action.jpg "Grafana에 InfluxDB를 데이터 소스로 추가하기"
