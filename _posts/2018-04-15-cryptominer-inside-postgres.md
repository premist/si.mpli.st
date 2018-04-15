---
layout: post
title: 내 DB에 암호화폐 마이너가?!
date: 2018-04-15 21:50:00 +0900
category: dev
excerpt: 무슨 바람이 불었는지는 모르겠지만 서버에서 구동중이던 데몬의 로그를 하나씩 살펴보기 시작했는데, 데이터베이스에 바이너리 데이터를 로드하는 것 처럼 보이는 SQL 선언문이 로그에 찍혀 있었다. 불안감이 몰려왔다.
---

아이패드 프로를 사면서 원격 서버에서 작업을 하는 일이 많이 늘었다. 메인 컴퓨터인 맥북 프로 15인치는 최신 모델로 바꾸면서 가벼워졌다고는 하지만 그래도 1.8kg 정도 나가는데, 477g 정도 나가는 아이패드 프로로도 대부분의 작업을 수행할 수 있기 때문에 여행 같이 먼 곳을 갈 때는 아이패드 프로를 챙기게 되었다. LTE를 지원해서 와이파이를 찾아 헤맬 필요도 없고, 지리적으로 가까운 서버를 이용하면 지연 시간도 거의 체감하지 못하기 때문에 간단한 개발 업무에도 꽤 쓸만하다.

작년 [RubyKaigi 2017][1]에 참가하기 위해 일본 히로시마에 다녀왔을 때에도, 짐을 줄이고 최대한 가볍게  아이패드 프로만 가지고 갔다. 보통 작업을 위해 접속하는 서버는 한국에 있기 때문에, 일본에서 사용하기 위해 VM 서버를 하나 생성하고 PostgreSQL을 비롯한 개발 환경을 구축해 두었다.

![][image-1]
<span style="text-align: center;display:block;"> 10.5인치의 작은 화면을 제외하면 이보다 편리할 수 없다. </span>


한국으로 돌아오기 전, DB 스키마는 정리를 했지만 서버를 삭제하는 것을 깜박 잊고 종료하지 않았다. 그리고 몇 주 전, 켜 둔 서버를 발견했고 커밋하지 않은 자료가 있는지 확인하기 위해 서버에 접속하게 되었다.


## 로그에 찍힌 수상한 흔적들

지인의 서버를 점검해주던 도중, 약한 루트 비밀번호를 가진 서버가 해킹이 되어 모네로(Monero) 암호화폐 마이닝에 사용된 것을 발견한 이후로 서버 해킹에 조금 더 경각심이 생겼다. 그 이후로는 원격 접속을 하자마자 [w][2] 커맨드를 입력하여 현재 접속된 다른 사용자가 있는지를 확인하는 버릇이 생겼다.

이 서버에 접속했을 때도 습관적으로 w를 입력했고, 현재 세션을 제외한 다른 사용자는 로그인이 되어 있지 않은 것으로 나와 크게 수상한 점은 없었다.

```shell
∙ w
12:00:00 up xxx days, xx:xx,  1 user,  load average: 0.03, 0.01, 0.00
USER     TTY        LOGIN@   IDLE   JCPU   PCPU WHAT
premist  pts/0     12:00    0.00s  0.05s  0.00s w
```

무슨 바람이 불었는지는 모르겠지만, 서버에서 구동중이던 데몬의 로그를 하나씩 살펴보기 시작했다. 그러던 중 PostgreSQL 데몬의 로그를 열어보게 되었다. [less][3]로 로그 파일을 파이프하고 스크롤을 하던 중...

![][image-2]

**가슴이 철렁 하는 로그를 발견했다.**

PostgreSQL에서 제공하는 [pg\_largeobject][4] 기능을 이용하여 데이터베이스에 바이너리 데이터를 로드하는 것 처럼 보이는 SQL 선언문이 로그에 찍혀 있었다. 내가 직접 바이너리 데이터를 Postgres에 넣으려고 시도한 적은 없으니 위 로그는 공격의 흔적으로밖에 설명이 되지 않았다. 불안감이 몰려왔다.

황급히 로그에서 수상한 다른 부분을 찾기 시작하자, 바이너리 데이터를 넣는 선언문 외에도 다른 수상한 선언문을 여러 개 찾을 수 있었다.

![][image-3]

공격자는 원격 코드 실행을 위한 프로시저 함수를 만든 다음, 이 함수를 이용해 바이너리를 생성하고 실행하려는 것 처럼 보였다. 불행 중에 다행으로, 공격자가 시도한 대부분의 명령어는 권한의 문제로 성공하지 않는 것으로 보였다.

![][image-4]

일부 명령어에서는 현재 접속된 시스템에 그래픽 카드가 장착되어 있는지를 확인하고(`lshw -c video`), CPU 모델명을 확인하려는 시도(`cat /proc/cpuinfo`)도 보였다. 이 쯤에서 암호화폐를 마이닝 하기 위한 공격일 것이라는 예상을 하기 시작했다.

---

공격이 이루어지고 있다는 사실을 발견하고, 추가적인 공격을 방지하기 위해 Docker Compose를 통해 실행하고 있던 PostgreSQL를 종료했다. 그 다음, 혹여나 공격자가 공격에 성공하여 어떤 작업이 일어나고 있지 않을까 하는 생각에 Telegraf로 수집하고 있던 CPU 점유율을 확인하였다.

```sql
-- InfluxQL
SELECT
  mean("usage_user") AS "mean_usage_user", mean("usage_system") AS "mean_usage_system", mean("usage_idle") AS "mean_usage_idle"
FROM "telegraf"."autogen"."cpu"
WHERE time > now() - 180d
AND "cpu" = 'cpu-total'
AND "host" = 'hostname'
GROUP BY time(4d)
```

![][image-5]


다행히도 CPU 점유율이 비정상적으로 치솟는 현상은 발견하지 않았다. 누군가가 공격을 시도한 건 맞지만 공격이 성공하지 않아 바이너리가 실행되지는 않은 듯 보였다.

공격의 흔적이 조금이라도 발견되면 미처 인식하지 못한 백도어가 있을 가능성이 있으므로 서버를 다시 설정하는 것이 현명하겠지만 나의 경우 그럴 필요가 없다고 생각되었다. 이유를 몇 가지 들어보자면:

- PostgreSQL 프로세스는 Unprivileged Docker 컨테이너에서 실행이 되고 있었다.
- 호스트 시스템에서 `/var/lib/postgresql/data` 디렉터리만 별도의 폴더를 마운트하여 사용하고, 호스트의 다른 디렉터리는 마운트하지 않았다.
- [Arch Linux][5]를 사용하고 있었기에 취약점이 보고되지 않은 최신 버전의 Linux 커널과 Docker CE를 사용하고 있었다.

PostgreSQL 컨테이너를 `docker kill ID && docker rm ID` 로 제거하고, PostgreSQL 데이터베이스 파일을 모두 삭제하는 것으로 정리를 일단락지었다.


## 실수에 겹친 실수

일단 급한 불을 끄고, 도대체 왜 이런 공격이 일어났는지를 조사하기 시작했다. 분명히 필요한 포트만 열고, PostgreSQL이 사용하는 포트인 5432는 로컬에서만 접근할 수 있게 방화벽을 설정했을 텐데, 공격자는 어떻게 데이터베이스에 접속할 수 있었던 것일까?

답은 허무할 정도로 간단했다. 바로 방화벽이 커져있지 않았던 것. 며칠동안 쓰고 삭제할 VM이여서 이왕 새로 설치하는 김에, 평소 사용하는 [iptables][6] 대신 보다 간단(다고 주장)한 [ufw][7]를 설치했는데, 사용하는 방법을 충분히 숙지하지 않아서 방화벽이 제대로 설정되지 않았던 것.

엎친데 덮친 격으로 PostgreSQL 데이터베이스도 암호가 설정되어 있지 않았다. [Docker Inc.가 제공하는 공식 PostgreSQL 이미지][8]의 경우 `POSTGRES_PASSWORD` 환경 변수를 지정해주지 않으면 **postgres 계정의 비밀번호가 없는 상태로 데이터베이스 서버가 실행된다**. 비밀번호를 설정한 줄 알았지만, `systemctl daemon-reload`를 해 주지 않아 로컬에서 임의로 생성한 비밀번호가 적용된 채로 서비스가 실행되지 않았다.

이런 저런 실수가 겹쳐서 결국 공개 인터넷에 인증 없이 아무나 접근할 수 있는 데이터베이스를 공개한 격이 되어 버렸다. 정말 부끄러웠다.


## 모네로 깎는 DB

어느 정도 수습을 한 상태로 곰곰히 생각해보니, 내가 겪은 상황과 비슷한 이야기를 어디선가 들은 적이 있었다. Instapaper에 저장한 글을 찾아보다보니 역시나, 내가 겪은 것과 비슷한 공격을 분석한 글이 있었다.

**[IMPERVA - A Deep Dive into Database Attacks Part III: Why Scarlett Johansson’s Picture Got My Postgres Database to Start Mining Monero][9]**

이 글의 저자는 인터넷에 공개적으로 노출되어 있는 데이터베이스에 어떠한 형태의 공격이 가해지는지를 분석하기 위해 일부러 허니팟을 구축해 두었는데, 내가 당한 것과 같은 공격을 당하였다.

- `pg_largeobject`로 바이너리를 저장하고, [Server-side Functions][10]인 `lo_export`를 통해 디스크에 저장한다. 이 때 데이터베이스를 감시하고 있는 보안 솔루션이 있을 것을 대비하여, `pg_proc` 카탈로그에 간접적으로 `lo_export`를 실행하는 함수를 저장하고 이를 실행한다.
- [C UDF][11]를 이용하여 로컬에 저장된 바이너리를 호출하는 함수를 만든다.
- `lshw`와 `/proc/cpuinfo`로 GPU와 CPU 정보를 파악한다.
- 바이너리가 숨겨진 사진 파일을 다운받고, 바이너리를 추출한다.
- 마이닝 풀 정보와 함께 마이너 바이너리를 실행한다.
- 사진 파일을 비롯한 흔적을 지운다.

암호화폐의 가치가 상승함에 따라 랜섬웨어와 같은 기법으로 암호화폐를 채굴하거나, 브라우저에서 광고 대신 암호화폐를 채굴하는 경우는 보았지만, 취약한 데이터베이스를 이용하여 암호화폐를 채굴하려는 공격이 이루어지고 있다니 정말 상상 초월이었다.


## 교훈

공격 시도를 당한 것을 알고 스스로에게 부끄러웠기 때문에 이 에피소드를 글로 옮길까 말까 고민했지만, 허를 찔릴 만큼 흥미로운 공격이었고, 값진 교훈을 얻었기에 블로그에 글로 옮기게 되었다.

- 방화벽을 적용하면 실제로 접속이 되지 않는지 꼭 확인해보자
- 데이터베이스 비밀번호를 설정했다면 비밀번호 없이 접속이 되는지 한번 더 확인하자
- 올바른 권한을 사용하거나 컨테이너 등으로 다른 프로세스와 격리하여 추가적인 피해를 막자
- 시스템의 구성 요소는 최신 버전으로 유지하도록 노력하자

[Google Cloud SQL][12]이나 [AWS RDS][13]를 사용한다면 [SUPERUSER 권한을 사용자가 취득할 수 없고][14], 기본적으로 IP 대역을 설정하거나 Security Group을 설정해야 하므로 비교적 안전한 초기 설정으로 데이터베이스를 운영할 수 있다. 프로덕션 서비스를 운영한다면 이러한 매니지드 서비스를 이용하는 것도 좋은 방법이다.


## 더 읽어보기
- [Black Hat Europe - Advanced SQL Injection to operating system full control (2009)][15]
- [Command execution with a PostgreSQL UDF (2009)][16]

[1]:	http://rubykaigi.org/2017
[2]:	https://en.wikipedia.org/wiki/W_(Unix)
[3]:	https://en.wikipedia.org/wiki/Less_(Unix)
[4]:	https://www.postgresql.org/docs/10/static/catalog-pg-largeobject.html
[5]:	https://www.archlinux.org/
[6]:	https://wiki.archlinux.org/index.php/iptables
[7]:	https://wiki.archlinux.org/index.php/Uncomplicated_Firewall
[8]:	https://hub.docker.com/_/postgres/
[9]:	https://www.imperva.com/blog/2018/03/deep-dive-database-attacks-scarlett-johanssons-picture-used-for-crypto-mining-on-postgre-database/
[10]:	https://www.postgresql.org/docs/10/static/lo-funcs.html
[11]:	https://www.postgresql.org/docs/current/static/xfunc-c.html
[12]:	https://cloud.google.com/sql/
[13]:	https://aws.amazon.com/rds/
[14]:	https://cloud.google.com/sql/docs/postgres/users#default-users
[15]:	https://www.slideshare.net/inquis/advanced-sql-injection-to-operating-system-full-control-slides
[16]:	http://bernardodamele.blogspot.kr/2009/01/command-execution-with-postgresql-udf.html

[image-1]:	https://simplist.cdn.sapbox.me/2018-04-cryptominer-inside-postgres/ipad-workstation.jpg
[image-2]:	https://simplist.cdn.sapbox.me/2018-04-cryptominer-inside-postgres/log-pg-largeobject.jpg "로그의 일부 발췌 (1)"
[image-3]:	https://simplist.cdn.sapbox.me/2018-04-cryptominer-inside-postgres/log-lo-export.jpg "로그의 일부 발췌 (2)"
[image-4]:	https://simplist.cdn.sapbox.me/2018-04-cryptominer-inside-postgres/log-subprocessing.jpg "로그의 일부 발췌 (3)"
[image-5]:	https://simplist.cdn.sapbox.me/2018-04-cryptominer-inside-postgres/chronograf-telegraf-graph.png
