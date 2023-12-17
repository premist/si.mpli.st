---
layout: post
title: "Elixir 정적 코드 분석, Credo와 Dialyzer"
date: 2017-08-27 21:10:00 +0900
category: dev
aliases:
  - /dev/elixir-credo-and-dialyzer.html
  - /dev/2017-08-27-elixir-credo-and-dialyzer.html
description: 코드의 품질을 분석하여 개선이 필요한 코드를 알려주고, 같이 협업을 할 때 코딩 컨벤션을 프로젝트 전반에 걸쳐 강제하기 위해 정적 코드 분석기를 사용한다. Elixir 프로그래밍 언어에 사용 가능한 정적 코드 분석기, Credo와 Dialyzer를 소개한다.
---

코드의 품질을 분석하여 개선이 필요한 코드를 알려주고, 같이 협업을 할 때 코딩 컨벤션을 프로젝트 전반에 걸쳐 강제하기 위해 정적 코드 분석기를 사용한다. 유닛 테스트와 더불어 이러한 정적 코드 분석기를 지속 통합(Continuous Integration) 과정에 추가해 두면, 기능 브랜치가 머지되지 전에 코딩 컨벤션 위반이나 지나치게 복잡한 코드가 머지되는 것을 사전에 방지할 수 있다.

[Shakr](https://www.shakr.com/)에서는 Ruby를 주력 언어로 사용하고 있기 때문에 코딩 컨벤션 검사와 복잡한 코드를 찾아주는 [Rubocop](https://github.com/bbatsov/rubocop)과 Rails 기반 애플리케이션에서 취약점을 노출할 수 있는 코딩 패턴을 검출해주는 [Brakeman](https://github.com/presidentbeef/brakeman) 정적 코드 분석기를 사용하고 있다. 이러한 정적 코드 분석기들은 [Code Climate](https://codeclimate.com/)을 이용해 CI 파이프라인에 연동해 두고, GitHub 저장소에서 [필수 상태 검사](https://help.github.com/articles/about-required-status-checks/)로 지정해 두어 하나라도 실패하면 머지가 되지 않도록 구성하였다. 이러한 정적 코드 분석기들을 사용하면서 배포 이전에 많은 오류를 발견하고 수정할 수 있었는데, 이러한 경험은 나를 포함한 모든 사람은 언제나 실수를 한다는 생각에 더해져 새로운 언어를 접할 때는 믿을만한 정적 코드 분석기가 있는지의 여부를 먼저 확인하게 되었다.

[Elixir](http://elixir-lang.org/) 프로그래밍 언어에 사용 가능한 대표적인 정적 코드 분석기로는 두 가지가 있는데, 바로 [**Credo**](https://github.com/rrrene/credo)와 [**Dlaiyzer**](http://erlang.org/doc/man/dialyzer.html)이다.


### Credo

Credo는 Elixir 언어를 위한 정적 코드 분석기이다. 공식 저장소의 설명에 따르면 다음과 같은 항목에 대한 검사를 수행한다.

- **일관성:** [Tab과 Spaces를 한 코드베이스에서 섞어서 사용하는 것](https://www.emacswiki.org/emacs/TabsSpacesBoth) 등의 실수를 범하지는 않았는지, 코드 전반적으로 일관성 있는 코딩 스타일을 사용하고 있는지 확인한다.
- **가독성:** 줄 당 문자열 수, 메소드 당 문자열 수 등을 통해 코드가 읽기 좋도록 구성이 되어 있는지 확인한다.
- **리팩토링 필요:** Cyclomatic Complexity나 Assignment Branch Condition Size와 같은 코드의 복잡도를 측정하는 지표들을 통해 리팩토링이 필요한 코드가 있는지 확인한다.
- **코드 디자인:** 중복된 코드를 발견하거나 TODO/FIXME와 같은 주석이 존재하는지 확인한다.
- **기타 경고:** IEx.pry와 같은 디버그 엔트리포인트를 방치해 두었는지, 변수의 이름을 동일 모듈에 존재하는 메소드와 같게 지정해주었는지 등의 오류를 확인한다.

Credo를 프로젝트에서 사용하려면 mix.exs의 의존성 목록에 다음과 같이 추가하자.

```elixir
defp deps do
  [{:credo, "~> 0.8", only: [:dev, :test], runtime: false}]
end
```

추가 후 `mix deps.get`으로 의존성 패키지를 모두 받은 다음, `mix credo`를 실행하면 Credo가 정적 코드 분석을 수행한다.

{{< fig path="si.mpli.st/2017/08-27-elixir-credo-and-dialyzer/credo" alt="Credo의 실행 결과" >}}


### Dialyzer

Dialyzer는 Erlang 프로그램을 위한 정적 코드 분석기이다. 왜 Elixir 프로그램을 분석하는데 Erlang용 분석기를 사용하는지 의문을 가질 수 있지만, Elixir는 Erlang 기반으로 제작되어 Erlang이 사용하는 BEAM bytecode로 컴파일이 되기 때문에 Dialyzer를 사용하는 것이 가능하다.

Elixir는 언어 자체적으로 [typespecs](http://elixir-lang.org/getting-started/typespecs-and-behaviours.html)라는 타입 어노테이션(annotation)을 지원하는데, Dialyzer를 이용하면 이렇게 추가한 타입 어노테이션을 통해 정적 분석을 할 수 있다.

Dialyzer를 직접 실행해도 되지만, Elixir 프로젝트를 사용할때 항상 다르게 되는 Mix를 통해 Dialyzer를 실행하는 것이 아무래도 편리하기 때문에, Dialyzer를 위한 Mix task를 제공해주는 Dialyxir를 사용하였다. 다음과 같이 의존성 목록에 추가할 수 있다.

```elixir
defp deps do
  [{:dialyxir, "~> 0.5", only: [:dev, :test], runtime: false}]
end
```

Credo와 마찬가지로 추가 후 `mix deps.get`을 통해 의존성 패키지를 모두 받은 다음, `mix dialyzer`를 실행하면 된다. 다만 dialyzer의 경우에는 PLT(Persistent Lookup Table)이라는  파일에 분석 결과를 담아두는데, 기본 라이브러리와 OTP 모듈 또한 함께 분석하므로 초기 실행 시에는 상당히 오랜 시간이 걸릴 수 있다.

또한, Dlaiyxir는 기본적으로 `:erts, :kernel, :stdlib, :crypto` 이 네 가지의 Erlang 모듈을 위한 PLT를 생성하는데, 다른 Erlang 모듈을 사용한다면 아래와 같이 `mix.exs`에 추가해 주어야 한다.

```elixir
def project do
  ...
  dialyzer: [plt_add_apps: [:public_key]]
end
```

이렇게 필요한 설정을 모두 마치고 Dialyzer를 실행하면, 타입 어노테이션이 잘못 지정된 오류를 찾아서 출력해준다.

{{< fig path="si.mpli.st/2017/08-27-elixir-credo-and-dialyzer/dialyzer" alt="Dialyzer의 실행 결과" >}}
