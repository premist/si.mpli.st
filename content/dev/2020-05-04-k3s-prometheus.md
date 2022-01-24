---
layout: post
title: "k3s 시리즈 - Prometheus로 하는 Kubernetes 지표 수집과 모니터링"
date: 2020-05-04 21:08:00 +0900
category: dev
description: "이번 글에서는 대표적 시계열 지표 관련 소프트웨어 중 하나인 Prometheus를 이용해, Kubernetes 클러스터의 각종 지표를 수집하는 방법에 대해 알아보려고 합니다."
---


### 지표 수집?

서비스를 운영하다 보면 많은 질문을 하게 됩니다. 인프라 운영을 맡고 있는 사람이라면 “우리 서버가 잘 버티고 있나?” 와 같은 궁금증을 가질 것이고, 물류팀에 속한 사람이라면 “지난달에 우리가 제때 배송을 진행했을까?” 같은 질문도 하게 되겠죠. 이러한 질문에 관련된 데이터를 수집하면, 수치를 이용해 답변해줄 수 있게 됩니다. 사업 분야에 따라 다르겠지만, 이런 정보들을 수집할 수 있겠죠.

- 인프라 기술 정보: 웹 서버 replica 갯수, CPU 사용률, 네트워크 트래픽 등
- 웹 서비스 기술 정보: 웹 서버의 리퀘스트 수, 리퀘스트 용량, 요청 처리에 걸리는 시간 등
- 비즈니스 정보: 신규 사용자의 수, 결제를 한 고객의 수, 평균 배송까지 걸리는 시간 등

이같은 정보를 수집하는 대표적인 방법은 로그를 이용하는 것일텐데요, 이렇게 로그를 이용하면  ETL(Extract-Transform-Load)로 불리우는 파이프라인을 구축해서 로그의 내용을 정제하고, 이에 맞춰 로그 형식도 JSON등 구조화된 형식으로 바꿔야 하는 경우가 많습니다. 이런 ETL 파이프라인이 없다면 데이터의 양이 많아질수록 분석을 하는데 시간이 오래 걸리겠죠.

이와 다른 방식은 시계열 지표(Time series metric)에 최적화된 방식을 사용하는 것입니다. 이전에 시계열 지표을 수집해주는 에이전트 중 하나인 [Telegraf를 소개](https://si.mpli.st/dev/2017-09-10-introduction-to-telegraf/)하면서 간단한 설명을 한 적이 있는데요, 시계열 지표 수집(StatsD, CollectD, Telegraf)부터 저장(Graphite, InfluxDB)까지 다양한 소프트웨어가 나와 있습니다.

이번에 소개할 소프트웨어는 Prometheus입니다. Prometheus는 SoundCloud에서 내부 사용을 위해 처음 개발되었는데, 지금은 Kubernetes와 같은 오픈 소스 소프트웨어와 함께 사용되고 있는 대표적 시계열 지표 관련 소프트웨어 중 하나입니다.


### Pull 방식을 사용하는 Prometheus

Telegraf를 소개하는 이전 글에서는 Prometheus가 수집한 지표를 저장하는 역할을 한다고 설명했는데요, 이에 더불어 다른 시계열 수집 방식과 차별화되는 Prometheus만의 특별한 점이 있습니다.

만약 StatsD를 이용해 웹 서버에서 처리하는 리퀘스트 수를 기록하고 싶다면, 웹 서버에서 UDP 패킷을 StatsD 서버에 보내야 하죠. 모니터링 되어야 하는 서버가 모니터링을 하는 서버로 정보를 보내기 떄문에, Push 방식이라고 부릅니다. StatsD와 CollectD와 같은 에이전트는 Push 방식을 사용하는 대표적인 예시입니다.

반면 Prometheus를 이용해 웹 서버에서 처리하는 리퀘스트 수를 기록하고 싶다면, 웹 서버는 `/metrics`라는 HTTP 엔드포인트에 정해진 형식으로 리퀘스트 수를 출력합니다. 이를 Prometheus에 등록하면, 주기적으로 데이터를 크롤링 해가는 방식입니다. 모니터링 되어야 하는 서버에서 모니터링을 하는 서버가 데이터를 가져가기 때문에, Pull 방식이라고 부릅니다.

이러한 Pull 방식을 사용하므로 인해 얻는 장점과 단점이 있습니다. 장점이라면 모니터링을 하는 서버가 데이터 수집 주기를 결정할 수 있고, `/metrics` 엔드포인트를 구현한 웹 서버라면 서비스 디스커버리(Service Discovery) 등을 이용해 자동으로 수집을 할 수 있다는 점이 있겠죠. 단점이라면 데이터 유실 위험이 높고, UDP 패킷을 보내는 StatsD에 비해 성능 면에서 분리하다는 점이 있겠습니다. 각각의 장·단점 모두 감안할 정도이다보니, 서비스의 성격 및 취향에 맞게 하나의 시스템을 결정하면 되겠습니다.


### Prometheus + Kubernetes

이번 글에서는 Kubernetes 클러스터에서 Prometheus를 이용해 클러스터의 각종 지표를 수집하는 방법에 대해 알아보려고 합니다.

Prometheus를 이용하여 모니터링하게 되는 영역은 크게 네 가지로 나눌 수 있습니다.

- **클러스터에 대한 정보:** Pod, Deployment, Ingress 정보 등 클러스터(Cluster)를 이루는 구성 요소의 정보입니다. Kubernetes의 [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics/)로 수집합니다.
- **노드에 대한 정보:** 클러스터를 이루는 각각의 서버, 노드(Node)의 실제 CPU, 메모리, 트래픽 등의 사용량입니다. Prometheus의 [node\_exporter](https://github.com/prometheus/node_exporter)로 수집합니다.
- **리소스 사용량에 대한 정보:** Node, Pod 등의 리소스 사용량을 수집합니다. [metrics-server](https://github.com/kubernetes-sigs/metrics-server)가 수집하여 [Metrics API](https://github.com/kubernetes/metrics) 형태로 제공하는 것을 [Prometheus용 어댑터](https://github.com/DirectXMan12/k8s-prometheus-adapter)로 수집합니다.
- **직접 만든 서비스에 대한 정보:** 직접 알고 싶은 지표를 정해서 수집할 수 있습니다. 웹 서버의 페이지뷰, 회원가입 양 등 수치로 표현할 수 있는 모든 것을 기록할 수 있습니다. 서비스가 만들어진 방식에 따라 수집하는 방법이 다릅니다.

직접 만든 서비스에 추가적인 작업을 하지 않아도, 첫 세 개(클러스터, 노드, 리소스)는 Kubernetes에 Prometheus를 제대로 설치하는 것 만으로 지표를 확인할 수 있습니다. 비교적 간단하게 설치를 하는 방법에 대해서 알아보죠.


### kube-prometheus 설치

이 글에서는 Kubernetes 위에 Prometheus를 설치하기 위해서 [kube-prometheus](https://github.com/coreos/kube-prometheus)를 사용합니다. Prometheus를 직접 설치하는 것을 포함하여 여러 가지 방법을 시도해 보았지만, kube-prometheus를 사용했을 때 최소한의 설정으로 빠르게 Prometheus를 설치할 수 있었습니다.

하지만 kube-prometheus의 기본 설정은 VPS 등의 작은 서버에 간단히 올리고자 하는 분들에게는 적합하지 않습니다. 제가 AWS Lightsail 가상서버에 설치를 했을 때 1GB 이상의 메모리를 기본으로 사용해서 배보다 배꼽이 큰 상황이 되었습니다. 장애를 견딜 수 있는 고가용성(HA) 설정이다보니 그대로 설치하면 메모리와 CPU 등의 리소스를 많이 소비하는 것이죠.

리소스가 충분하다면 위의 kube-prometheus 공식 저장소에서 설치를 하면 되지만, 리소스가 제한된 환경일 때는 특히 적은 리소스만 사용하도록 설치하고 싶은 경우가 대부분이죠. 이런 고민을 하시는 분들을 위해 [**kube-prometheus의 경량화된 버전**](https://github.com/premist/k3s-kube-prometheus)을 제작했습니다. 원본과의 주요 차이점이라면 replica가 하나이고 alertmanager를 배포하지 않는 것인데, 이 버전을 k3s에 설치해보도록 하겠습니다.

kubectl이 동작하는 환경에서, 아래의 명령어를 실행해줍니다.

```bash
#!/bin/bash

kubectl apply -k github.com/premist/k3s-kube-prometheus/setup
kubectl apply -k github.com/premist/k3s-kube-prometheus
```

첫 번째 명령어는 Prometheus와 관련 구성 요소의 [커스텀 리소스 명세(Custom Resource Definition; CRD)](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)를 생성합니다. Deployment나 Ingress를 만드는 것처럼, Prometheus를 마치 Kubernetes의 리소스와 같이 실행할 수 있게 해 주는 것이죠.
두 번째 명령어는 monitoring이라는 네임스페이스를 만들고, 새로 추가된 여러가지 CRD를 이용해 실제로 Prometheus 서버를 생성합니다.

![kubectl apply 명령어의 실행 결과](https://cdn.si.mpli.st/2020-05-04-k3s-prometheus/0002-apply.png)

 명령어 실행이 끝나면, `kubectl get pod -n monitoring`을 이용해 리소스가 생성되는 과정을 지켜볼 수 있습니다.

![pod이 생성되는것을 확인할 수 있다](https://cdn.si.mpli.st/2020-05-04-k3s-prometheus/0001-getpod.png)

리소스 생성이 모두 완료되면, Prometheus가 수집하는 지표를 확인해 볼 차례입니다! kube-prometheus 저장소에서 설명하는 것과 같이, 아래의 명령어로 웹 대시보드를 접근할 수 있습니다.

```bash
#!/bin/bash

# Prometheus 대시보드 접근하기
$ kubectl --namespace monitoring port-forward svc/prometheus-k8s 9090

# Grafana 대시보드 접근하기
$ kubectl --namespace monitoring port-forward svc/grafana 3000
```

먼저 Prometheus 대시보드를 살펴볼까요? 포트 포워딩을 하고 있는 상태에서 localhost:9090에 들어가면 웹 인터페이스가 나오는데, **Status > Targets** 메뉴에서 현재 수집중인 지표를 확인할 수 있습니다.

![Prometheus 대시보드의 Targets 메뉴](https://cdn.si.mpli.st/2020-05-04-k3s-prometheus/0003-prometheus-targets.png)

다음으로, Grafana 대시보드에 들어가보겠습니다. Grafana는 Elasticsearch, InfluxDB와 같은 다른 백엔드와도 같이 쓰일만큼 지표를 그래프 등으로 시각화하여 쉽게 확인할 때 널리 사용되고 있습니다. Prometheus의 대시보드는 확인 목적 외에는 들어갈 일이 자주 없고, 지표를 확인하고 싶다면 대부분의 경우에는 Grafana 대시보드를 이용하게 될 것입니다.

Grafana 포트 포워딩을 켠 후 localhost:3000에 들어갑니다. 기본 로그인 정보인 `admin/admin`으로 접속하고, 상단의 Home을 눌러 Default 폴더를 열어봅시다. Kubernetes의 여러 부분에 대한 지표를 모아둔 대시보드를 확인할 수 있습니다.

{{< figure src="https://cdn.si.mpli.st/2020-05-04-k3s-prometheus/0004-grafana-dashboard.png" title="Grafana에 미리 추가된 대시보드 목록" >}}

클러스터의 전체적인 리소스 사용량을 보여주는 “Kubernetes / Compute Resources / Cluster”에 들어가면, CPU 사용량을 비롯한 다양한 지표가 시각화되어 나오는 것을 확인할 수 있습니다.

![클러스터 리소스 사용량 대시보드](https://cdn.si.mpli.st/2020-05-04-k3s-prometheus/0005-grafana-cluster.png)

Explore 탭에 들어가면, Prometheus가 사용하는 지표 쿼리 언어인 [PromQL](https://prometheus.io/docs/prometheus/latest/querying/basics/)을 이용하여 수집중인 지표의 그래프를 그려볼 수 있습니다.

![원하는 PromQL 쿼리를 실행할 수 있다](https://cdn.si.mpli.st/2020-05-04-k3s-prometheus/0006-grafana-explore.png)

Prometheus가 지표를 수집하고, 이를 시각화할 수 있는 Grafana 대시보드도 잘 돌아갑니다! 다만 이와 같은 구성에서 몇 가지 알아두어야 할 점이 있는데요,

- **고가용성(HA) 셋업이 아닙니다.** 실제 서비스를 운영하는 등 시스템의 안정성이 중요한 환경이라면, 서버 하나가 다운되어도 복구가 가능한 원본 kube-prometheus 프로젝트를 이용하여 배포하는 것이 좋겠죠? 제 레포에서 [override.jsonnet](https://github.com/premist/k3s-kube-prometheus/blob/master/override.jsonnet)을 수정하여 replica 갯수를 변경할 수도 있습니다.
- **지표는 평생 저장되지 않습니다.** Prometheus는 기본적으로 [15일](https://prometheus.io/docs/prometheus/latest/storage/#operational-aspects)동안 지표를 저장합니다. 지표를 더 오랜 시간동안 저장하고 싶다면 명령줄에 희망하는 기간을 지정해주거나, [원격 데이터베이스에 저장](https://prometheus.io/docs/operating/integrations/#remote-endpoints-and-storage)할 수 있습니다.

### 마치며

Prometheus를 막 설치했다면, 이제는 자신의 환경에 맞도록 튜닝을 해 줘야 하겠죠. 라즈베리 파이나 작은 VPS에서 k3s 클러스터를 돌린다면 Prometheus를 이용한 지표 수집은 과한 선택일수도 있지만, 조금 더 클러스터를 꼼꼼하게 관리하고 싶다면 운영해보는 것도 좋은 선택이 될 것 같습니다.






