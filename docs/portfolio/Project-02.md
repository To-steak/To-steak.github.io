---
title: Project 02 포트폴리오
description: Unity 6와 Netcode for GameObjects로 만든 4인 협동 PvE TPS, Project 02 포트폴리오
outline: [2, 3]
---

# Project 02 포트폴리오

![Project 02 썸네일](/images/project-02/thumbnail.jpg)

::: tip 프로젝트 정보
4인 협동 PvE TPS를 목표로 혼자 설계하고 구현한 멀티플레이 게임입니다.

- **GitHub 저장소**: <https://github.com/To-steak/project_02>
- **인원**: 1인
- **개발 기간**: 2026. 08. 15 ~ 2026. 10. 22 (현재 개발 중단)
- **목적**: Unity 멀티플레이 게임을 만들며 필요한 구조를 배우고 개발
- **기술**: Unity 6, Netcode for GameObjects
:::

## 개요

::: info 바로 가기
궁금한 내용만 읽으실 수 있게 각 항목에 대해 소개합니다.

- [**ECS 철학을 이용한 프로젝트 구조 설계**](#ecs-철학을-이용한-프로젝트-구조-설계)<br>
  판정과 연출이 뒤섞인 구조를 Component와 System으로 나누고, 실행 순서를 한 곳에 모은 내용입니다.
- [**입력 지연을 해결하기 위한 클라이언트 예측과 재조정**](#입력-지연을-해결하기-위한-클라이언트-예측과-재조정)<br>
  서버 판정 구조에서도 입력이 바로 반영되도록 예측하고, 어긋나면 되돌려 다시 계산하는 내용입니다.
- [**캐릭터를 부드럽게 보이기 위한 시각 보간**](#캐릭터를-부드럽게-보이기-위한-시각-보간)<br>
  50Hz 틱과 렌더 프레임의 차이로 생긴 머리카락 떨림을 없앤 내용입니다.
- [**지터 흡수를 위한 서버 입력 큐와 클라이언트 시계 속도 조절**](#지터-흡수를-위한-서버-입력-큐와-클라이언트-시계-속도-조절)<br>
  불규칙하게 도착하는 입력을 버퍼로 받고, 클라이언트 시계 속도로 버퍼 크기를 맞춘 내용입니다.
- [**클라이언트 화면과 서버 상태의 어긋남을 해결하는 지연 보상**](#클라이언트-화면과-서버-상태의-어긋남을-해결하는-지연-보상)<br>
  쏜 사람이 보던 시점으로 적을 되감아 판정하는 내용입니다.
- [**손실 환경에서 몰려 보이는 원격 사격 연출**](#손실-환경에서-몰려-보이는-원격-사격-연출)<br>
  패킷 손실 때 사격 연출이 몰려 재생되던 원인을 찾아 선언 한 곳으로 고친 내용입니다.

전부 읽는 데 **약 10분**이 소요될 수 있습니다.
:::

### 시연 영상

<iframe style="width: 100%; aspect-ratio: 16 / 9;" src="https://www.youtube-nocookie.com/embed/sxfijKmCGuE" title="Project 02 시연 영상" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## ECS 철학을 이용한 프로젝트 구조 설계

### 상황: 값을 누가 바꾸는지 알 수 없었다

판정과 연출 코드가 한 클래스에 섞여, 기능을 추가할 때마다 복잡도가 커졌습니다. 소유자·원격 클래스로 나눠 `IsOwner` 분기는 걷어 냈지만, 나뉜 클래스들이 서로 참조해 값을 누가 바꾸는지 알려면 여러 클래스를 읽어야 했습니다.

게다가 플레이어·적·투사체의 5개 클래스가 각자 매 틱 실행되어 처리 순서를 보장할 수 없었습니다.

![전환 전: 총알 한 발이 이벤트 연쇄로 퍼짐](/images/project-02/before_summary.svg)

> 전환 전: 총알 한 발이 이벤트 연쇄로 여러 클래스에 퍼집니다.

### 과제: 처리 순서를 한 곳에서 읽히게 만들기

값을 바꾸는 곳과 실행 순서를 코드 한 곳에서 확인할 수 있는 구조가 목표였습니다.

### 행동: 패키지 없이 ECS 철학만 도입

#### 참고한 사례와 패키지 검토

오버워치 GDC 2017 강연에서 ECS로 게임플레이와 넷코드를 정리한 사례를 참고했습니다.

Netcode for Entities도 검토했지만, 적이 수백 마리를 넘지 않는 규모이고 목적이 성능이 아닌 구조였기에 패키지 없이 철학만 도입했습니다.

#### 역할을 네 가지로 나누기

상태는 Component(데이터), 동작은 필드 없는 정적 System, NGO 생명주기는 Authoring, 엔진 출력은 View로 역할을 나눴습니다.

#### 규칙 문서로 AI가 작성하는 코드 통제

코드 위치를 정하는 9단계 판단 순서를 규칙 문서([`ECS_RULES.md`](https://github.com/To-steak/project_02/blob/main/ECS_RULES.md))로 정리해 Claude가 구현할 때 따르게 했습니다. 생성된 코드는 직접 검토하고 실행해 기존 동작을 확인했습니다.

### 결과: 서버 루프 함수 하나로 읽히는 순서

서버 루프 한 곳에 실행 순서가 그대로 드러나고, 시스템 안에는 역할 분기(`IsOwner`, `IsServer`)가 없습니다. 역할 판단은 등록 시점에만 합니다.

- 판정에 관여하던 이벤트 구독: **모두 제거**
- 피해에서 보상까지 거치던 5개 클래스와 이벤트 2개 → **서버 루프 함수 하나의 순서**

![전환 후: 서버 루프 한 곳에 순서대로](/images/project-02/after_summary.svg)

> 전환 후: 서버 루프 한 곳에서 순서대로 처리합니다.

::: details 자세히 보기 - 코드
```csharp
// ServerLoop.cs: 피해에서 보상까지가 한 곳에서 순서대로 읽힘
EquipSystem.Process(world);
ServerPlayerSystem.Tick(world, deltaTime);
ProjectileSystem.Tick(world, projectileHitLayer, deltaTime);
DamageSystem.Process(world.Hits);
EnemySystem.Tick(world, deltaTime);
DeathSystem.Process(world);
SessionSystem.Process(world, SessionService.Instance);
StatSystem.Process(world);
RewindSystem.Record(world);
SnapshotSystem.Send(world, network);
NetSendSystem.Flush(world);
DespawnSystem.Process(world);
```
:::

## 입력 지연을 해결하기 위한 클라이언트 예측과 재조정

### 상황: 입력 지연이 왕복 지연을 그대로 따라갔다

서버가 판정하는 구조라, 입력을 보낸 뒤 서버 결과가 돌아올 때까지 캐릭터가 반응하지 않았습니다. 입력 지연이 왕복 지연(RTT)을 그대로 따라갔습니다.

### 과제: 네트워크 상태와 무관하게 입력을 바로 반영하기

서버 판정 구조는 유지하면서, 내 캐릭터는 입력 즉시 움직이고 서버와 어긋나면 바로잡는 것이 목표였습니다.

### 행동: 예측하고, 어긋나면 되돌려 다시 계산

#### NGO에 없는 기능을 직접 구현

NGO는 되감아 다시 계산하는 예측(재조정)을 제공하지 않습니다. 그래서 Claude와 구현한 뒤, 새 프로젝트에서 직접 다시 작성해 검증했습니다.

`NetworkManager.LocalTime.Tick`은 시뮬레이션 주기(50Hz)와 위상이 어긋나 틱 번호에 공백이 생겨서, 클라이언트 자체 틱 시계를 관리했습니다.

#### 예측: 입력 확정 → 먼저 움직이기 → 기록

클라이언트는 매 틱 입력을 확정해 기록하고, 서버와 같은 시뮬레이션 함수(`PlayerStepUtil.Step`)로 먼저 움직인 뒤 결과를 틱 번호와 함께 저장합니다(`InputHistory`, `StateHistory`, 1024틱).

::: details 자세히 보기 - 예측 코드
```csharp
// PredictSystem.cs: 입력 확정 → 예측 → 기록
owner.InputHistory.SetValue(tick, input);
owner.SendTimes.SetValue(tick, now);   // RTT 측정용 전송 시각
PlayerStepUtil.Step(sim, input, owner.OwnerClientId, deltaTime, out ShotInfo shot);
owner.StateHistory.SetValue(tick, sim.State);

// InputSendSystem.cs: 서버가 확인(ack)한 다음 틱부터 최대 16틱을 프레임당 한 번 묶어 전송
int last = world.Clock.Tick - 1;
int first = System.Math.Max(world.AckTick + 1, last - InputBundle.CAPACITY + 1);

InputBundle bundle = default;
for (int t = first; t <= last; t++)
{
    if (!owner.InputHistory.TryGetValue(t, out InputPayload input)) continue;
    bundle.Add(input);
}
owner.Network.InputRPC(bundle);
```
:::

#### 재조정: 어긋나면 서버 상태에서 다시 계산

서버 상태가 도착하면 같은 틱의 예측 상태와 비교합니다. 위치, 기력, 무기 상태(다음 발사 틱, 탄 퍼짐) 중 하나라도 임계값을 넘으면 서버 상태로 되돌리고, 그다음 틱부터 현재 틱까지 저장된 입력으로 다시 시뮬레이션합니다.

::: details 자세히 보기 - 재조정 코드
```csharp
// ReconcileSystem.cs: 같은 틱의 예측과 서버 상태를 비교해, 어긋났으면 서버 상태에서 다시 시뮬레이션
if (!owner.StateHistory.TryGetValue(server.Tick, out PlayerSimulationState predicted)) return;
if (!IsMispredicted(predicted, server)) return;

PlayerStepUtil.Restore(sim, server);
for (int tick = server.Tick + 1; tick < clock.Tick; tick++)
{
    if (!owner.InputHistory.TryGetValue(tick, out InputPayload input)) break;
    PlayerStepUtil.Step(sim, input, owner.OwnerClientId, SimulationClock.DeltaTime, out _);
    owner.StateHistory.SetValue(tick, sim.State);
}

// 현재 기준: 위치 1mm, 기력·탄 퍼짐 0.001 이상 차이나거나 무기·다음 발사 틱이 다르면 오예측
// (아래 표는 위치 1m·기력 0.5·탄 퍼짐 0.1 기준에서 측정)
private const float POSITION_THRESHOLD = 0.001f;

private static bool IsMispredicted(in PlayerSimulationState predicted, in PlayerSimulationState server)
{
    bool position = Vector3.Distance(predicted.Movement.Position, server.Movement.Position) >= POSITION_THRESHOLD;
    bool energy = Mathf.Abs(predicted.Stamina.Energy - server.Stamina.Energy) >= ENERGY_THRESHOLD
                  || predicted.Stamina.IsExhausted != server.Stamina.IsExhausted;
    bool weapon = predicted.Weapon.EquippedId != server.Weapon.EquippedId
                  || predicted.Weapon.NextFireTick != server.Weapon.NextFireTick
                  || Mathf.Abs(predicted.Weapon.Bloom - server.Weapon.Bloom) >= BLOOM_THRESHOLD;
    return position || energy || weapon;
}
```
:::

#### 되돌릴 수 있는 이동 물리

Unity의 `CharacterController`는 재조정 때 접지 상태를 되돌릴 수 없어, 경사, 턱, 벽 처리를 포함한 이동 물리를 Claude와 구현했습니다.

### 결과: 모든 조건에서 입력 지연 1틱 이내, 재조정 0회

- 예측을 켜면 입력이 그 틱에 바로 반영되므로, 입력 지연은 네트워크와 무관하게 다음 틱·프레임 대기(**1틱, 20ms 이내**)뿐입니다.
- 예측을 켜면 모든 조건에서 측정 당시 기준(위치 1m)을 넘는 어긋남이 없었습니다(**재조정 0회**).
- 예측을 끄면 입력 지연이 RTT + 약 65~72ms를 따라갑니다. 그중 60ms는 지터를 흡수하려고 일부러 둔 서버 입력 버퍼 3틱이고, 나머지는 다음 틱과 프레임을 기다리는 시간입니다.

| 네트워크 조건 | 측정 RTT | 예측 OFF 입력 지연(중앙값) | 예측 ON 재조정 |
| --- | --- | --- | --- |
| 지연 0 | 약 21ms* | 89.7ms | 0회 |
| 지연 100ms | 약 227ms | 291.5ms | 0회 |
| 지연 200ms, 지터 50ms | 약 400ms | 464.8ms | 0회 |
| 지연 200ms, 지터 50ms, 손실 10% | 약 400ms | 472.0ms | 0회 |

\*지연 0은 호스트 모드입니다. 서버 결과를 다음 프레임에 처리하는 시간(144fps 기준 약 7ms)과 정수 틱으로 잘린 버퍼 대기(0~20ms)가 RTT에 포함됩니다.

::: details 자세히 보기 - 측정 방법
- 예측을 켠 상태에서 이동하며 재조정 횟수를 세고, 비교용으로 예측을 끈 상태의 입력 지연을 측정했습니다.
- 재조정 기준은 측정 당시 값(위치 1m, 기력 0.5, 탄 퍼짐 0.1)이며, 이후 1mm·0.001로 낮췄으나 아직 다시 측정하지 않았습니다.
- 입력 지연은 이동 키를 누른 프레임부터 캐릭터 위치가 1cm 이상 움직인 프레임까지의 시간입니다.
- 앞선 움직임이 섞이지 않도록 1초 이상 정지한 상태에서만 시작했습니다.
- 클라이언트 144fps(약 7ms 간격), 50Hz 틱, 조건마다 25회 이동했습니다(조건당 약 1분, 3,000틱).
:::

## 캐릭터를 부드럽게 보이기 위한 시각 보간

### 상황: 예측을 넣자 캐릭터가 끊겨 보였다

예측을 적용하며 소유자의 `NetworkTransform`을 비활성화하자 자동 보간도 함께 없어졌습니다. 50Hz의 시뮬레이션 움직임이 그대로 드러나 끊겨 보였습니다.

50Hz 틱을 60fps로 그리면 6프레임마다 몸이 한 번 멈춥니다. 몸에서는 거의 안 보이지만, 관성을 가진 머리카락(Spring Bone)에는 초당 10번의 급정거로 전달돼 흔들림으로 드러났습니다.

### 과제: 시뮬레이션은 50Hz로 두고 화면만 매끄럽게

판정에 쓰는 시뮬레이션 주기는 바꾸지 않고, 화면에 그리는 위치만 매 프레임 고르게 움직이게 하는 것이 목표였습니다.

### 행동: 틱 사이를 프레임마다 보간

- 50Hz마다 이전, 현재 좌표를 기록해 매 프레임 보간합니다.
- 재조정으로 위치가 크게 바뀌어 임계값을 넘으면 보간하지 않고 즉시 이동합니다.

::: details 자세히 보기 - 보간 코드
```csharp
// PlayerBodyView.cs: PredictSystem이 틱마다 호출
public void Record(Vector3 position)
{
    bool snap = Vector3.Distance(_current, position) > SNAP_DISTANCE;
    _previous = snap ? position : _current;
    _current = position;
}

// LateUpdate
public void Interpolate(float alpha)
{
    _presentation.position = Vector3.Lerp(_previous, _current, alpha);
}

// ViewSystem.cs: 이번 틱에서 얼마나 지났는지 (0~1)
float alpha = Mathf.Clamp01(world.Clock.Accumulator / world.Clock.Interval);
```
:::

### 결과: 머리카락 떨림이 사라졌다

몸이 매 프레임 고르게 움직이면서 머리카락의 흔들림이 사라졌습니다.

![보간 전후 비교](/images/project-02/interpolate_compare.gif)

> 왼쪽: 보간 전 · 오른쪽: 보간 후. 머리카락을 보면 차이가 잘 보입니다(60fps 녹화, 50fps GIF).

## 지터 흡수를 위한 서버 입력 큐와 클라이언트 시계 속도 조절

### 상황: 입력이 불규칙하게 도착했다

입력이 지터로 불규칙하게 도착하거나 유실되면, 서버 틱에 그 틱의 입력이 없어 예측이 어긋납니다. 반대로 입력이 너무 일찍 쌓이면 그만큼 지연이 늘어납니다.

### 과제: 입력 버퍼를 너무 적지도 많지도 않게 유지하기

입력이 빠지지 않을 만큼 버퍼를 두되, 지연이 늘지 않도록 버퍼 크기를 일정하게(3틱, 60ms) 유지하는 것이 목표였습니다.

### 행동: 서버는 버퍼로 받고, 클라이언트는 시계 속도로 맞추기

#### 서버 입력 큐

- 서버는 도착한 입력을 틱 번호별 버퍼(`InputQueue`)에 쌓고 매 틱 하나씩 소비합니다.
- 입력이 없으면 직전 입력을 복제하되, 점프와 발사 같은 "누른 순간" 입력은 복제하지 않습니다. 그 틱의 진짜 입력이 늦게 도착하면 `CarryJump`, `CarryAttack`으로 다음 틱에 눌림을 살립니다.

#### 입력 중복 전송

서버가 받았다고 확인(ack)한 다음 틱부터 최대 16틱의 입력을 프레임당 한 번 묶어 보냅니다(`InputBundle`, `CAPACITY = 16`). 패킷 하나가 유실돼도 다음 패킷의 사본이 서버 버퍼 안에 도착합니다.

#### 클라이언트 시계 속도 조절

- 서버는 상태 패킷에 남은 버퍼 양(`LatestTick - ConsumedTick`)을 실어 보내고, 클라이언트는 틱 간격을 최대 ±5% 조절해 버퍼를 3틱으로 유지합니다.
- 일시정지처럼 ±5%로 못 따라잡는 어긋남은 서버 틱 + RTT + 목표 버퍼만큼 시계를 한 번에 옮겨 재동기화합니다.

::: details 자세히 보기 - 코드
```csharp
// ClockSystem.cs: 버퍼가 모자라면 짧게(빨리), 남으면 길게(느리게)
float error = TARGET_BUFFER - clock.SmoothedBuffer;
float scale = 1.0f - Mathf.Clamp(error * DILATION_GAIN, -MAX_DILATION, MAX_DILATION);
clock.Interval = SimulationClock.DeltaTime * scale;

// ServerPlayerSystem.cs: 입력이 없으면 복제 (눌림은 복제하지 않음)
if (queue.Buffer.TryGetValue(tick, out InputPayload slot))
{
    input = slot;
    queue.LastInput = slot;
}
else
{
    input = queue.LastInput;
    input.Tick = tick;
    input.JumpInput = false;
    input.AttackPressed = false;
}

input.JumpInput |= queue.CarryJump;
input.AttackPressed |= queue.CarryAttack;
```
:::

### 결과: 지연이 바뀌어도 버퍼가 3틱으로 돌아온다

![클라이언트 시계 속도 조절](/images/project-02/clock_dilation.svg)

> 지연을 켜면 입력이 늦게 도착해 버퍼가 줄고, 클라이언트가 틱 간격을 줄여(빠르게) 3틱으로 되돌립니다. 지연을 끄면 버퍼가 쌓이고, 틱 간격을 늘려(느리게) 되돌립니다.

## 클라이언트 화면과 서버 상태의 어긋남을 해결하는 지연 보상

### 상황: 정확히 겨눠도 서버에서는 빗나갔다

원격 캐릭터와 적은 스냅샷을 5틱(100ms) 뒤에서 보간해 그리므로, 화면 속 적은 서버의 현재 위치보다 과거입니다. 적을 정확히 겨누고 쏴도 서버에서는 빗나갔습니다.

### 과제: 쏜 사람의 화면 기준으로 판정하기

서버가 판정하되, 쏜 사람이 실제로 보던 화면을 기준으로 명중을 판단하는 것이 목표였습니다.

### 행동: 쏜 사람이 보던 시점으로 적을 되감기

- 클라이언트는 입력에 자신이 보던 시점(`ViewTick` = 보간 중인 렌더 틱)을 실어 보냅니다.
- 서버는 적의 발밑 위치를 매 틱 `RewindTarget.History`에 기록합니다(64틱, 1.28초).
- 발사 시 `serverTick - ViewTick`만큼 되감은 위치로 판정하고, 되감기는 최대 25틱(500ms)으로 제한합니다. `ViewTick`이 소수라서 두 틱 사이 위치를 보간해 씁니다.
- 지형은 현재 상태로 먼저 레이캐스트하고, 그보다 가까운 적만 선분과 캡슐의 최근접점 거리로 판정합니다.
- PvE라 되감는 대상은 적(AI)뿐이라서, 대전 게임의 "엄폐했는데 맞는" 억울함이 생기지 않습니다.

::: details 자세히 보기 - 코드
```csharp
// ServerPlayerSystem.cs: 쏜 사람이 보던 시점까지의 거리(틱)
float lag = input.ViewTick < 0.0f ? 1.0f : Mathf.Clamp(serverTick - input.ViewTick, 1.0f, MAX_LAG_TICKS);

// RewindUtil.cs: 두 틱 사이 위치를 보간
position = Vector3.Lerp(a, b, tick - from);
```
:::

### 결과: 화면에 보인 위치로 명중 판정

<div class="image-row">
<div>

![지연 보상 01](/images/project-02/lag_compensator_01.jpg)

</div>
<div>

![지연 보상 02](/images/project-02/lag_compensator_02.jpg)

</div>
</div>

> 플레이어를 향해 다가가는 적에게 3회 사격해 피해를 입히는 모습입니다. 노란색 선이 녹색 십자선 범위 안에 있으면 맞았다고 판단합니다.
>
> - 녹색 십자선: 쏜 사람의 화면에 보이던 적의 위치(판정에 쓴 위치)
> - 적색 십자선: 같은 순간 서버에서의 적의 위치
> - 노란색 선: 명중한 틱에 탄이 날아간 구간
> - 흰색 선: 되감은 거리(두 십자선을 이은 선)

## 손실 환경에서 몰려 보이는 원격 사격 연출

### 상황: 동료의 연사가 몰려서 보였다

지연 200ms·손실 10% 환경에서 동료의 연사가 끊겼다가 한꺼번에 몰려 보였습니다.

### 과제: 원인을 찾고 수정 범위를 최소로

원인을 정확히 찾아, 판정에는 영향을 주지 않으면서 가장 좁은 범위로 고치는 것이 목표였습니다.

### 행동: 원인은 신뢰 전송의 순서 대기

발사 연출 RPC가 신뢰 전송(Reliable)이라, 패킷 하나가 유실되면 재전송이 올 때까지 뒤따르는 발사 RPC도 함께 대기했습니다(순서 보장). 재전송이 도착하는 순간 밀린 연출이 몰아서 재생된 것입니다.

피해는 서버가 판정하고, 발사 연출은 판정 결과에 영향을 주지 않습니다. 그래서 발사 연출 RPC만 Unreliable로 전환했습니다.

::: details 자세히 보기 - 코드
```csharp
// PlayerNetwork.cs: 서버 → 다른 클라이언트 (발사 연출)
[Rpc(SendTo.ClientsAndHost, Delivery = RpcDelivery.Unreliable)]
public void FireRPC(int tick, Vector3 aimPoint, Vector2 spread)
{
    if (IsOwner) return;   // 소유자는 예측으로 이미 재생함

    if (Fires.Count >= MAX_FIRES) Fires.RemoveAt(0);   // 가장 오래된 것 버림
    Fires.Add(new RemoteFire(tick, aimPoint, spread));
}
```
:::

### 결과: 파일 11개 대신 선언 한 곳 수정

- 처음 검토한 안은 파일 11개를 고치는 구조 변경이었지만, 원인이 전송 방식 하나라 수정 범위를 RPC 선언 한 곳으로 좁혔습니다.
- 한계: 유실된 발사는 연출만 빠지고 피해는 정상 적용됩니다. 알려진 한계로 남겨 두었습니다.
