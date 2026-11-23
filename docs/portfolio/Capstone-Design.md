---
title: Capstone Design 포트폴리오
description: 로컬 LLM으로 상황 반응형 NPC 대사를 만드는 환경 변화 시뮬레이션 게임
outline: [2, 3]
---

# Capstone Design 포트폴리오

![Capstone Design 썸네일](/images/capstone/thumbnail.jpg)

::: tip 프로젝트 정보
환경 파괴를 체감하게 하는 액션 게임입니다. 플레이어는 숲의 수호자 엘프가 되어 인간의 환경 파괴를 막고, 숲의 정령 NPC들은 피해 정도에 따라 매번 다른 대사를 건넵니다.

- **GitHub 저장소**: <https://github.com/To-steak/Capstone-Design>
- **출품명**: LLM NPC를 갖춘 환경 변화 시뮬레이션 게임 (2025 한림대학교 SW캡스톤디자인, 팀 ABLE)
- **수상**: 2025. 06 경진대회 동상
- **인원**: 3인, 팀장 (본인: 기획·일정 관리, GitHub 저장소 운영, 공통 시스템, 폐수 방류 스테이지, 서버·LLM·DB 연동, 성능 측정)
- **개발 기간**: 2025. 03 ~ 2025. 05 (약 3개월)
- **기술**: Unity 6, C#, FastAPI, LangChain, Ollama(DeepSeek R1), MySQL
:::

## 개요

::: info 바로 가기
궁금한 내용만 읽으실 수 있게 각 항목에 대해 소개합니다.

- [**고정 대사 대신 피해에 반응하는 LLM 대사**](#고정-대사-대신-피해에-반응하는-llm-대사)<br>
  FastAPI와 로컬 LLM을 연결해, 피해 정도에 따라 NPC가 매번 다른 대사를 하게 만든 내용입니다.
- [**스테이지를 쉽게 추가하는 클라이언트 구조**](#스테이지를-쉽게-추가하는-클라이언트-구조)<br>
  규칙이 다른 세 스테이지가 점수와 서버 통신을 함께 쓰도록 나눈 구조와, 직접 만든 폐수 방류 스테이지입니다.
- [**LLM 응답 지연 측정과 원인 분석**](#llm-응답-지연-측정과-원인-분석)<br>
  자동 테스트와 부하 테스트로 응답 지연을 측정하고 원인을 분석한 내용입니다.
- [**문제가 되기 전에 적용한 렌더링 최적화**](#문제가-되기-전에-적용한-렌더링-최적화)<br>
  오브젝트가 늘어날 것에 대비해 LOD 컬링과 오브젝트 풀링을 미리 적용한 내용입니다.

전부 읽는 데 **약 5분**이 소요될 수 있습니다.
:::

### 시연 영상

<iframe style="width: 100%; aspect-ratio: 16 / 9;" src="https://www.youtube-nocookie.com/embed/s1SLKenSphE" title="Capstone Design 시연 영상" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

### 게임 소개

플레이어는 무작위로 정해지는 세 스테이지(화재 진압, 불법 벌목, 폐수 방류)에서 1분 동안 환경 파괴를 막고 점수를 모읍니다. 게임이 끝나면 점수가 서버에 저장되고, 점수 구간에 따라 3단계 배지가 붙어 웹 랭킹에 표시됩니다.

<div class="image-row">
<div>

![화재 진압 스테이지](/images/capstone/map_tree.png)

> 화재 진압

</div>
<div>

![불법 벌목 스테이지](/images/capstone/map_forest.png)

> 불법 벌목

</div>
<div>

![폐수 방류 스테이지](/images/capstone/map_waste.png)

> 폐수 방류 (본인 제작)

</div>
</div>

## 고정 대사 대신 피해에 반응하는 LLM 대사

### 상황: 같은 상황에서 같은 말만 반복됐다

기존 게임형 환경 교육 콘텐츠는 고정된 스크립트로 구성되어 있어, 같은 상황에서는 같은 말만 반복됩니다. 이 때문에 몰입감이 낮다고 판단했습니다.

### 과제: 피해 정도에 따라 감정이 달라지는 NPC

숲이 입은 피해 정도에 따라 정령 NPC가 감정적으로 반응하고, 그 대사를 게임 UI에 바로 띄우는 것이 목표였습니다.

### 행동: FastAPI 서버에서 로컬 LLM으로 대사 생성

#### 서버: 역할과 피해 단계를 받아 프롬프트 구성

클라이언트가 `/response`로 NPC 역할(role)과 피해 단계(0~10)를 보내면, 서버가 LangChain으로 프롬프트를 구성해 Ollama로 구동한 로컬 LLM(DeepSeek R1)에 요청합니다.

#### 프롬프트: UI에 바로 띄울 수 있는 형태로 제한

시스템 프롬프트에 1인칭 말투, 길이 제한(64자), 금지 사항(설명 및 질문 금지), 예시 대사를 명시했습니다. 대사를 다듬는 후처리 없이 그대로 UI에 띄우기 위해서였습니다.

::: details 자세히 보기 - 시스템 프롬프트
```python
# FastAPI/main.py
system_prompt = (
    "You are a mystical forest spirit (e.g., World Tree, Earth, Tree, Water). "
    "You speak in first-person, in under 100 characters, with a poetic, emotional tone. "
    "You are speaking to an Elf, the guardian of the forest, as you feel damage caused by humans. "
    "Speak with sorrow, hope, or quiet warning. Never explain. Never ask questions. "
    "Never speak in generalities—speak to the Elf, as if they can hear you.\n\n"
    "Response must be less than 64 characters."
    "Examples:\n"
    "• 'Elf... my roots ache where they spilled their fire.'\n"
    "• 'You hear it too, don't you? The trees cry beneath your feet.'\n"
    ...
)
```
:::

#### 클라이언트: 게임을 멈추지 않는 비동기 요청

`UnityWebRequest` 코루틴으로 요청해, 응답을 기다리는 동안에도 게임이 멈추지 않게 했습니다. DeepSeek R1은 추론 모델이라 응답에 `<think>` 블록이 섞여 나오기 때문에, 정규식으로 제거한 뒤 대사만 표시합니다.

::: details 자세히 보기 - 코드
```csharp
// SystemManager.cs: 추론 과정(<think> 블록)을 지우고 대사만 남김
string pattern = @"<think>[\s\S]*?</think>";
text = Regex.Replace(text, pattern, string.Empty);
```
:::

### 결과: 피해 정도에 따라 매번 다른 대사

같은 스테이지에서도 피해 단계에 따라 NPC가 매번 다른 대사를 건넵니다. 게임 흐름은 아래와 같습니다.

1. 게임을 시작하면 `user@{무작위 숫자 4자리}` 이름을 만들고, 세 스테이지 중 하나로 이동합니다.
2. 플레이 중 특정 조건에서 자연의 입장에서 쓴 LLM 대사가 출력됩니다.
3. 게임이 끝나면 이름과 점수를 `/users`로 보내 MySQL에 저장하고, 계속할지 묻습니다.
4. `/html` 랭킹 페이지에서 모든 플레이어의 점수와 배지(1,000 / 2,000 / 3,000점 구간의 3단계)를 확인할 수 있습니다.

## 스테이지를 쉽게 추가하는 클라이언트 구조

### 상황: 규칙이 다른 스테이지 세 개

스테이지마다 게임 목표와 규칙이 달랐습니다. 그러면서도 점수는 스테이지를 넘어 누적되어야 하고, 서버 통신은 모든 스테이지가 함께 써야 했습니다.

### 과제: 스테이지는 독립적으로, 점수와 통신은 한 곳에서

팀원이 각자 스테이지를 만들어도 서로 충돌하지 않고, 새 스테이지를 쉽게 붙일 수 있는 구조가 목표였습니다.

### 행동: 공통 관리자와 스테이지별 관리자로 나누기

#### 공통 시스템

- **SystemManager**: 점수, 난이도, 게임 종료를 관리하는 싱글톤입니다. 스테이지를 무작위로 불러오고, 계속하기를 고르면 난이도를 올려 점수를 누적합니다. 게임이 끝나면 점수 구간으로 배지를 정해 서버에 보냅니다.
- **3인칭 캐릭터 조작**: Input System 기반으로 구현해 모든 스테이지에서 함께 씁니다.
- **WebManager**: 서버 통신을 맡는 싱글톤으로, 씬이 바뀌어도 사라지지 않습니다.
- **스테이지별 GameManager**: 각 씬의 UI와 대사 출력을 맡고, 점수는 항상 SystemManager를 통해 갱신합니다.

![클래스 다이어그램](/images/capstone/class_diagram.png)

> FastAPI 서버와 Unity 클라이언트의 클래스 다이어그램입니다. 스테이지마다 다른 관리자(GameManager, Trash_GameManager, ForestManager, WorldTreeManager)가 모두 SystemManager를 통해 점수를 갱신합니다.

#### 폐수 방류 스테이지

- 인간 NPC는 NavMeshAgent와 상태 기계(배회 / 추격)로 움직입니다.
- 적은 Queue 기반 오브젝트 풀로 재사용해, 반복 생성·파괴로 생기는 GC 부하를 줄였습니다.
- 처치할 때마다 난이도에 비례한 점수를 SystemManager에 더하고, 물(Water) 정령의 대사를 요청합니다.

### 결과: 스테이지를 추가해도 공통 코드는 그대로

스테이지는 자기 규칙만 구현하고, 점수와 서버 통신은 공통 관리자에 맡기면 됩니다. 새 주제의 스테이지(예: 해양 오염)를 추가해도 공통 코드를 고칠 필요가 없는 구조가 되었습니다.

## LLM 응답 지연 측정과 원인 분석

### 상황: 대사가 너무 늦게 나왔다

플레이 중 LLM 대사가 화면에 나오기까지 오래 걸렸습니다. 대사가 상황보다 늦게 도착하면 피해에 반응한다는 의미가 약해집니다.

### 과제: 얼마나 느린지, 왜 느린지 수치로 확인하기

체감에 기대지 않고, 응답 시간과 게임 프레임에 미치는 영향을 측정해 원인을 찾는 것이 목표였습니다.

### 행동: 자동 테스트와 부하 테스트로 측정

#### 게임 안 자동 테스트

LLM 응답 시간과 요청 전후 FPS를 자동으로 측정하는 테스트 스크립트를 만들었습니다. 응답 기준은 0.5초, FPS 기준은 55로 두었습니다.

![LLM 성능 테스트 로그](/images/capstone/llm_test.png)

> 4회 측정에서 응답 시간은 7.6 ~ 11.8초로 모두 기준을 넘었고, FPS는 요청 전후 약 60을 유지했습니다.

#### 서버 부하 테스트

Locust로 `/response`에 150건을 요청했습니다.

| 지표 | 값 |
| --- | --- |
| 평균 | 66.8초 |
| 95 백분위 | 170초 |
| 99 백분위 | 189초 |
| 최소 / 최대 | 6.9초 / 194.8초 |

#### 원인 분석과 개선 방안

지연은 서버 통신이 아니라 LangChain/Ollama가 텍스트를 생성하는 단계에서 발생했습니다. 응답에 `<think>` 블록이 포함되는 것을 확인했고, 추론 모델이 대사 전에 사고 과정을 먼저 생성하는 시간이 주요 원인이라고 추정했습니다.

이를 바탕으로 결과보고서에 다음 개선 방안을 정리했습니다.

- `num_predict`로 생성 토큰 수를 제한하고, `temperature`를 낮춰 결정론적으로 응답하게 한다.
- 같은 역할과 피해 단계의 요청은 최대 5분간 캐시된 응답을 바로 돌려준다.

### 결과: 프레임은 지켰지만 지연은 남았다

- 비동기 처리 덕분에 LLM 요청 중에도 FPS는 약 60을 유지했습니다.
- 하지만 대사가 상황보다 늦게 도착하는 문제는 프로젝트 기간 안에 해결하지 못했습니다. 위 개선 방안도 적용하지 못한 채 마무리했습니다.

## 문제가 되기 전에 적용한 렌더링 최적화

### 상황: 오브젝트가 늘면 렌더링 부담이 커진다

당시에는 문제가 되지 않았지만, 씬에 배치하는 오브젝트가 늘어날수록 렌더링 부담이 커질 것으로 예상했습니다.

### 과제: 문제가 생기기 전에 여유를 확보하기

오브젝트가 늘어나도 프레임이 떨어지지 않도록, 성능 여유를 미리 만들어 두는 것이 목표였습니다.

### 행동: LOD 컬링, 오브젝트 풀링, 코루틴

- LOD Group을 적용해, 화면에서 차지하는 비율이 6% 이하가 되면 풀과 꽃처럼 디테일을 담당하는 오브젝트를 컬링했습니다.
- 런타임 생성·파괴로 생기는 GC를 줄이려고 오브젝트 풀링을 적용했습니다.
- `Update()`에서 매 프레임 하던 일을 코루틴으로 옮겨 가볍게 했습니다.

### 결과: 평균 FPS 98 → 104 (약 6% 향상)

<div class="image-row">
<div>

![LOD 적용 전](/images/capstone/lod_before.png)

> LOD 적용 전

</div>
<div>

![LOD 적용 후](/images/capstone/lod_after.png)

> LOD 적용 후

</div>
</div>

LOD 적용 전후 FPS를 5초 간격으로 기록해 비교했습니다. 오브젝트가 많아질수록 효과는 더 커집니다.
