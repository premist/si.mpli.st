---
layout: post
title: "k3s 시리즈 - 간단하게 Kubernetes 환경 구축하기"
date: 2020-01-01 22:30:00 +0900
category: dev
excerpt: "k3s를 이용하여 조금 더 쉽게 Kubernetes를 설치하고, 첫 서비스를 띄워봅니다."
---


Google Cloud Summit 등에서 여러 번 했던 발표[(관련 슬라이드 보기)](https://speakerdeck.com/premist/google-cloud-summit-seoul-gke-at-shakr)를 들으신 분이라면 아시겠지만, [Shakr](https://www.shakr.com/)에서는 2016년부터 Kubernetes를 프로덕션 서비스에 도입하여 사용중입니다. Kubernetes는 도입하고 어느 정도 정착을 시킨 후에는 강력한 리소스 추상화와 다양한 관리 및 모니터링 기능의 덕을 톡톡히 볼 수 있지만, [GKE](https://cloud.google.com/kubernetes-engine)와 같은 매니지드 서비스를 사용하지 않는 한 초기 설정의 까다로움과 첫 웹 서버 트래픽을 처리할 때 까지의 이해의 복잡함이 어려움으로 다가오는 경우가 많죠. 이러한 설정의 번거로움을 해결하기 위해 [kubespray](https://github.com/kubernetes-sigs/kubespray), [kubeadm](https://kubernetes.io/docs/reference/setup-tools/kubeadm/kubeadm/)과 같은 도구를 사용할 수도 있는데요, 그러기엔 이런 도구들이 Kubernetes 생태계의 변화를 따라잡지 못해서 설정 매뉴얼대로만 따라하면 오류를 맞닥뜨리게 되는 경우가 종종 있습니다. 미국의 치킨 패스트푸드 전문점인 Chick-fil-A는 [식당 안에서도 Kubernetes를 돌린다는데](https://medium.com/@cfatechblog/bare-metal-k8s-clustering-at-chick-fil-a-scale-7b0607bd3541), 우리는 컴퓨터 몇 개에서 Kubernetes를 돌리는 것도 버겁습니다. 조금 더 쉽게 Kubernetes를 운영하는 방법은 없을까요?


### k3s

이러한 문제에서 비교적 자유로운 해결책으로 [k3s](https://k3s.io)가 있습니다. 컨테이너 관련 기술을 주로 개발하는 Rancher Labs에서 만든 Kubernetes의 또 다른 버전인데요, Kubernetes와 비교해서는 크게 두 가지 차이점이 있습니다.

먼저, 경량화입니다. 외부 클라우드 서비스와의 연동 기능을 최소한도로 줄이고, 고가용성(HA) 배포를 위해 기본으로 사용하던 etcd 의존성을 없애고 sqlite를 기본값으로 사용합니다. 또한 Docker와 같은 의존성을 모두 삭제하고 containerd와 같은 가벼운 대체재를 사용합니다. 기존 Kubernetes에서 지원하는 과거 버전의 API 또한 과감히 지원하지 않습니다.

두 번째는, 설치가 무척 간단합니다. 경량화를 통해 시스템 요구 사항을 극단적으로 줄인 결실이 설치 과정에서 드러나는데, 쉘 스크립트 하나로 대부분의 배포판에서 설치할 수 있습니다. 설치 후 자동으로 systemd 서비스 또한 만들기 때문에, 사용자가 신경 써 주어야 할 것이 거의 없습니다. Kubernetes를 처음부터 설치해보려고 시도해 보셨던 분이라면 믿기 힘든 사실이죠.

프로덕션 사용에는 여전히 [GKE](https://cloud.google.com/kubernetes-engine/) 같은 매니지드 서비스를 쓰는 것이 바람직하겠지만, 테스트 환경이나 개인 활용에는 이만한 것이 없어 보입니다. 그럼, 리눅스 서버에 k3s를 설치하고 첫 서비스를 띄워볼까요?


###  환경 준비

[k3s 문서](https://rancher.com/docs/k3s/latest/en/installation/node-requirements/)를 보면 Ubuntu LTS와 Raspbian을 공식 지원한다고 나와 있지만, 제가 시도를 해 보았을 때는 Arch Linux와 Debian 등의 다른 배포판에서도 큰 문제 없이 설치 및 실행을 할 수 있었습니다. 이번 글에서는 AWS의 가상 서버 서비스인 [Lightsail](https://aws.amazon.com/ko/lightsail/)에서 Debian 기반 서버를 만들고 k3s를 설치해보겠습니다. 다른 리눅스 서버의 경우에도 대부분의 과정은 동일합니다.

Lightsail 대시보드에서 Debian을 고르고 인스턴스를 생성합니다. 메모리 최소 사양이 512MB로 낮은 편이지만, 추후 애플리케이션을 올릴 것을 생각하여 2GB 플랜을 선택하였습니다.
{{< figure src="https://simplist.cdn.sapbox.me/2020-01-01-easy-k8s-with-k3s/1.png" title="Lightsail 대시보드" >}}

인스턴스가 만들어지고 나면 [고정 IP를 할당](https://lightsail.aws.amazon.com/ls/docs/ko_kr/articles/lightsail-create-static-ip)하고, 방화벽 설정을 조절합니다. Kubernetes API 서버에 접근하고 추후 HTTPS 웹 사이트를 호스팅하기 위해, 각각 필요한 포트인 6443과 443을 열어줍니다.
{{< figure src="https://simplist.cdn.sapbox.me/2020-01-01-easy-k8s-with-k3s/2.png" title="Lightsail 방화벽 설정" >}}

방화벽 설정이 완료되면 SSH 클라이언트를 사용하여 인스턴스에 접속합니다.

```bash
#!/bin/bash
ssh [-i ~/Downloads/aws_private_key] admin@your-k3s-instance-ip
```

![](https://simplist.cdn.sapbox.me/2020-01-01-easy-k8s-with-k3s/3.png)


### k3s 설치

처음 접속한 이후, 업데이트 가능한 패키지를 모두 업데이트 해 줍니다. k3s 설치를 위해 필요한 과정은 아니지만 인스턴스를 막 생성한만큼 업데이트 가능한 패키지가 있을 가능성이 높습니다.

```bash
#!/bin/bash
sudo apt update
sudo apt upgrade
```

{{< figure src="https://simplist.cdn.sapbox.me/2020-01-01-easy-k8s-with-k3s/4.png" title="apt upgrade로 데비안 패키지 업데이트" >}}

시스템 패키지 업데이트가 끝났으면, k3s 설치 스크립트를 다운받아 설치합니다. 신뢰할 만한 회사의 스크립트라도 [curl의 결과값을 파이프하면 위험할 수 있으니까](https://www.idontplaydarts.com/2016/04/detecting-curl-pipe-bash-server-side/), 다운받아 내용을 확인하고 실행해도 됩니다.

```bash
 #!/bin/bash
curl -sfL https://get.k3s.io | sh -
```

![](https://simplist.cdn.sapbox.me/2020-01-01-easy-k8s-with-k3s/5.png)

몇 초 지나지 않아 설치가 완료됩니다. systemd 서비스의 상태를 확인해보면, k3s.service가 시작되어 있고 시스템 시작 시 자동으로 실행되도록 enable 또한 되어있는 것을 확인할 수 있습니다.

```bash
#!/bin/bash
sudo systemctl status k3s
```

{{< figure src="https://simplist.cdn.sapbox.me/2020-01-01-easy-k8s-with-k3s/6.png" title="systemd 서비스가 제대로 돌아가는 걸 확인할 수 있다" >}}

Kubernetes를 제어할 수 있는 CLI인 **kubectl**을 이용해, 클러스터가 정상적으로 생성된 것도 확인할 수 있죠.

```bash
#!/bin/bash

# Node 상태 확인
sudo kubectl get node

# Kubernetes 시스템 Pod 상태 확인
sudo kubectl get pod --namespace=kube-system
```

{{< figure src="https://simplist.cdn.sapbox.me/2020-01-01-easy-k8s-with-k3s/7.png" title="Kubernetes 구동에 사용하는 Pod들은 kube-system 네임스페이스에 생성된다" >}}

허무할 정도로 k3s 설치가 끝났습니다.


### 로컬 컴퓨터에서 원격지 Kubernetes 클러스터 접속하기

이렇게 설치가 완료되면 서버 안에서 kubectl을 이용하여 Kubernetes를 제어할 수 있지만, 주로 개발을 하는 로컬 컴퓨터에서 사용할 수 있으면 더욱 좋겠죠. k3s에서 제공해주는 설정 파일로 로컬 컴퓨터에서 kubectl을 사용해 접속해봅시다.

k3s를 설치하면, 클러스터의 인증서와 사용자 비밀번호 등 인증하는데 필요한 정보가 `/etc/rancher/k3s/k3s.yaml`에 저장됩니다. 이 파일을 클립보드 복사 혹은 scp 등을 통해 로컬 컴퓨터에 복사해오면 되는데요, Kubernetes 설정을 보통 `~/.kube`에 저장하기 때문에, 이 곳에 새로운 파일을 만들어 저장하는 것도 좋은 방법입니다.

{{< figure src="https://simplist.cdn.sapbox.me/2020-01-01-easy-k8s-with-k3s/8.png" title="설정 파일을 가장 간단하게 가져오는 방법은 복붙!" >}}

{{< figure src="https://simplist.cdn.sapbox.me/2020-01-01-easy-k8s-with-k3s/9.png" title="클러스터의 이름 등을 따서 파일 이름을 붙여주자" >}}

로컬에 설정 파일을 저장했다면, 설정 파일의 일부 내용을 변경해 줄 차례입니다. 파일을 복사해오면서 눈치채셨겠지만 서버 주소가 127.0.0.1로 되어있거나, 이름의 대부분이 default로 되어 있습니다. 하나의 Kubernetes 클러스터만 관리한다면 이름은 문제가 되지 않겠지만, 여러 개의 클러스터에 하나의 컴퓨터에서 접속한다면 이름을 반드시 바꿔주어야 합니다.

```bash
# vim command
:%s/127.0.0.1/your-k3s-instance-ip/g
:%s/default/your-k3s-name/g
```

설정 파일 변경이 끝났다면 KUBECONFIG 환경 변수를 바꿔줄 차례입니다. KUBECONFIG 환경 변수는 [PATH 형태의 체인 문법을 이용하여 여러 값을 넣어주는 것을 지원합니다](https://kubernetes.io/docs/tasks/access-application-cluster/configure-access-multiple-clusters/#set-the-kubeconfig-environment-variable). 이를 이용해, 기본 설정 파일 위치와 함께 새로 만든 설정 파일을 추가해줍시다. 테스트를 위해서는 쉘에서 아래 명령어를 바로 실행해도 되지만, 추후 사용을 위해서는 `~/.zshrc` 나 `~/.bash_profile`등에 추가해주면 좋습니다.

```bash
#!/bin/bash
export KUBECONFIG=$HOME/.kube/config-k3stest:$HOME/.kube/config:$KUBECONFIG
```


마지막으로 현재 context를 위에서 설정한 이름으로 바꿔주면 됩니다.
```bash
#!/bin/bash
kubectl config use-context your-k3s-name
```

이제 kubectl로 클러스터 정보를 가져오려 하면, 오류가 뜨면서 접속이 되지 않습니다. 인증서 관련 오류가 왜 발생하는걸까요?

{{< figure src="https://simplist.cdn.sapbox.me/2020-01-01-easy-k8s-with-k3s/10.png" title="제대로 한 것 같은데... 왜죠?" >}}


AWS Lightsail 인스턴스에서는 할당받은 공인 IP 정보를 확인할 수 없습니다. 따라서 k3s가 시작될 때 공인 IP를 모르고, 그렇기 때문에 Kubernetes API 서버의 인증서가 내부 IP로만 발행이 되는 것입니다.

{{< figure src="https://simplist.cdn.sapbox.me/2020-01-01-easy-k8s-with-k3s/11.png" title="eth0 인터페이스를 확인해보면 내부 IP만 나온다" >}}

이러한 문제를 해결하기 위해 k3s를 설치한 서버의 systemd 설정을 바꿔줍시다. `/etc/systemd/system/k3s.service`를 열고, ExecStart 부분에 `--tls-san` 설정을 추가해줍니다. 만약 공인 IP에 도메인을 연결하여 접속하고 싶다면, 공인 IP 대신에 도메인을 입력하면 됩니다.

```bash
# /etc/systemd/system/k3s.service

# 원본
ExecStart=/usr/local/bin/k3s \
    server \

# 이렇게 변경해 줍시다
ExecStart=/usr/local/bin/k3s \
    server --tls-san YOUR-K3S-IP-ADDRESS-OR-DOMAIN \
```

{{< figure src="https://simplist.cdn.sapbox.me/2020-01-01-easy-k8s-with-k3s/12.png" title="tls-san 명령어를 추가해주면 k3s가 인증서를 알아서 갱신해준다" >}}

변경이 완료되었다면 systemd 서비스를 다시 시작해주고, 로컬 환경으로 돌아와 kubectl 명령어를 실행해줍니다. 문제 없이 실행이 됩니다. 야호!

```bash
#!/bin/bash
# 원격 서버에서 실행
sudo systemctl daemon-reload
sudo systemctl restart k3s

# 로컬 환경에서 실행
kubectl get node
```

{{< figure src="https://simplist.cdn.sapbox.me/2020-01-01-easy-k8s-with-k3s/13.png" title="이제부터는 로컬에서도 클러스터를 제어할 수 있다" >}}

### 마치며

이렇게 일반 Kubernetes 환경을 설치하는 것보다 훨씬 짧은 시간 안에, 간단하지만 100% 작동하는 클러스터를 k3s를 이용해 만들어 보았습니다. 하지만 클러스터를 만드는 것은 그저 시작일 뿐, 웹 서버 등 여러 서비스를 운영해야 의미가 있겠죠. 다음 번 글에서는 설치된 k3s 클러스터에서 웹 서버를 구동하는 방법에 대해 소개해 드리도록 하겠습니다.
