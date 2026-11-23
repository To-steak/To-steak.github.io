---
title: TopView Game 포트폴리오
description: Claude Code로 완성한 탑-다운 액션 게임 TopView Game 포트폴리오
outline: [2, 3]
---

# TopView Game 포트폴리오

![TopView Game 썸네일](/images/topview-game/Thumbnail-01.png)

::: tip 프로젝트 정보
탑-다운 액션 게임을 Claude Code로 개발해 완성한 개인 프로젝트입니다.

- **GitHub 저장소**: <https://github.com/To-steak/TopView-Game>
- **다운로드**: <https://github.com/To-steak/TopView-Game/releases>
- **개발 기간**: 2026. 10. 30 ~ 2026. 11. 18 (**약 20일**)
:::

## 개요

::: info 바로 가기
궁금한 내용만 읽으실 수 있게 각 항목에 대해 소개합니다.

- [**지금 있는 기능에서 재미 요소 넣기**](#지금-있는-기능에서-재미-요소-넣기)<br>
  게임의 핵심 재미를 찾아 개발하는 내용입니다.
- [**AI가 코드와 이슈를 작성하고 사람이 검토한다**](#ai가-코드와-이슈를-작성하고-사람이-검토한다)<br>
  Claude Code를 사용해 버그를 찾아내는 워크플로와 Roslyn 정적 검사기를 설명합니다.
- [**ECS에서 영감을 받은 프로젝트 구조**](#ecs에서-영감을-받은-프로젝트-구조)<br>
  로직과 화면을 분리하고, 엔티티-컴포넌트-시스템 구조로 재설계하는 내용입니다.

전부 읽는 데 **약 10분**이 소요될 수 있습니다.
:::

### TopView Game 트레일러 영상

<iframe style="width: 100%; aspect-ratio: 16 / 9;" src="https://www.youtube-nocookie.com/embed/7fyoxN1xmZw?si=uiPp1JxMsiYSzTix" title="TopView Game 트레일러 영상" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

> Unity Timeline, Recorder와 ArtCraft - FilmCraft를 사용하여 제작한 트레일러 영상입니다(1m 19s).<br>
> Claude Code를 사용해 FilmCraft에 MCP로 연결하여 편집했습니다.

### TopView Game 플레이 영상

<iframe style="width: 100%; aspect-ratio: 16 / 9;" src="https://www.youtube-nocookie.com/embed/7VS9hrIHz_A?si=2dMeUdnuJbLGwmqZ" title="TopView Game 플레이 영상" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

> 실제 플레이 영상입니다. 게임 시작부터 끝까지 한 판을 담았습니다(8m 20s).

### 게임 소개

![게임 플레이 장면](/images/topview-game/videoframe_227168.png)

시간이 지날수록 강해지는 적을 물리쳐 모은 골드로 캐릭터를 강화하며, 제한 시간 안에 보스를 쓰러뜨리는 탑-다운 액션 게임입니다.

### 대학 과제에서 시작한 프로젝트

TopView Game은 2023년 대학교 과제로 유튜브 골드메탈님 강좌를 따라 만든 제 첫 게임입니다.

<LinkCard
  url="https://www.youtube.com/playlist?list=PLO-mt5Iu5TeYkrBzWKuTCl6IUm_bA6BKy"
  title="골드메탈 [유니티 게임개발] 쿼터뷰☄️액션슈터.U19C5"
  description="쿼터뷰 시점에서 액션 슈팅을 펼치는 유니티 3D 게임개발 강의"
  image="/images/topview-game/goldmetal_playlist_thumbnail.jpg"
/>

![2023년 버전 TopView Game](/images/topview-game/videoframe_128847.png)

> 2023년도 대학교 과제로 제작한 TopView Game입니다.

이번 프로젝트는 이 2023년 버전을 바탕으로 구조를 다시 짜고 기획을 다듬어 완성한 버전입니다.

2026년 3월에 이 게임을 한 번 다시 만들기 시작했고, 그 뒤로 Project 01~06이라는 이름으로 다른 게임도 만들어 봤습니다. 이번에는 Claude Code와 함께 작업해 완성했습니다.

## 지금 있는 기능에서 재미 요소 넣기

### 상황: 게임이 재미가 없다

처음에는 적 몇 마리와 오래 싸우는 게임으로 기획했습니다. 개발을 진행하면서, 기능을 계속 더하기보다 지금 있는 전투를 더 재밌게 다듬는 것이 게임을 완성하는 데 더 낫다고 판단했습니다. 그래서 새 기능을 더하기보다, 지금 있는 것을 어떻게 더 재밌게 만들 수 있는지 고민했습니다.

### 과제: 현재 범위 안에서 재미 키우기

이미 만든 기능 안에서 재미를 키울 부분을 찾아 다듬는 것이 목표였습니다.

### 행동: 이미 있는 기능을 직접 플레이하며 다듬기

#### 적은 많이 소환하고, 싸움은 짧게 가져간다

적의 수를 늘리고, 적의 체력을 대폭 낮췄습니다. 여기에 무기 강화를 기획했습니다.

강화한 무기가 피해량만 오르면 재미가 없다고 생각해, 망치는 근접 범위, 권총은 폭발 반경, 소총은 공격 간격으로 강화 효과를 나눴습니다.

![무기 강화 창](/images/topview-game/Upgrade_Panel_crop.png)

> 적을 처치하고 골드를 획득해 무기를 강화합니다.

#### 직관적인 강화 아이콘 만들기

캐릭터의 마나 소모량 강화에 어떤 아이콘을 사용해야 할지 고민했습니다. 캐릭터의 점프, 구르기, 달리기 강화에 사용할 아이콘을 제작하기 위해 캐릭터의 총구 위치를 바로잡기 위해 사용했던 [도구](#결과-화면에-기대지-않는-로직)를 응용해 애니메이션의 한순간을 이미지로 촬영하는 도구를 만들었습니다.

<div class="image-row">
<div>

![포즈 아이콘 촬영 도구](/images/topview-game/Pose_Icon_Baker.png)

</div>
<div>

![강화 창에 들어간 아이콘](/images/topview-game/Icon_In_Panel_crop.png)

</div>
</div>

> 왼쪽 도구로 클립의 한순간을 찍고, 그 이미지를 오른쪽 강화 창의 아이콘으로 썼습니다.

#### 셰이더 코드(HLSL) 대신 셰이더 그래프(Shader Graph)

망치를 휘둘러도 밋밋해서 AI를 활용하여 충격파 효과를 넣었습니다.

충격파 효과처럼 게임의 설계에 따라 변화하여 지속적인 관리가 필요하면 셰이더 그래프를 구성하였습니다. 반면에 월드 UI가 땅에 묻히지 않게 하는 단순한 기능은 HLSL 셰이더 코드를 생성했습니다.

![망치 충격파 셰이더 그래프](/images/topview-game/Hammer_VFX_Graph.png)

> 망치 충격파의 셰이더 그래프입니다.

#### 땅에 묻힌 망치 색 바꾸기

에셋 팩에 기본으로 들어 있던 주황색 망치와 충격파는 땅의 색과 겹쳐 잘 보이지 않았습니다. 그래서 망치와 충격파 색을 파란색으로 바꿨습니다. 텍스처는 이미지 편집 도구를 MCP로 연결해 수정했습니다.

<div class="image-row">
<div>

![주황색 망치](/images/topview-game/Hammer_Color_Orange.gif)

> 에셋에 기본 제공된 주황 망치입니다.<br>
> 충격파의 색이 잘 보이지 않습니다.

</div>
<div>

![파란색 망치](/images/topview-game/Hammer_Color_Blue.gif)

> 파랑으로 바꾼 망치입니다.<br>
> 땅 위에서도 충격파가 눈에 띕니다.

</div>
</div>

### 결과: 최소한의 수정으로 재미를 추가했다

게임의 재미 요소를 시각 효과(VFX)와 게임 구조(업그레이드 기능)로 추가했습니다. 밋밋했던 망치의 시각 효과를 넣어 타격감을 추가했고, 답답했던 소총의 연사는 업그레이드를 통해 시원하게 발사할 수 있습니다.

<div class="image-row">
<div>

![강화 전 소총](/images/topview-game/Rifle_Upgrade_Before.gif)

> 강화 전 소총입니다.<br>
> 답답한 연사를 보여줍니다.

</div>
<div>

![최대 강화 소총](/images/topview-game/Rifle_Upgrade_After.gif)

> 최대로 강화한 소총입니다.<br>
> 시원한 연사를 보여줍니다.

</div>
<div>

![강화 전 망치](/images/topview-game/Hammer_Upgrade_Before.gif)

> 강화 전 망치입니다.<br>
> 충격파가 캐릭터 주변에만 퍼집니다.

</div>
<div>

![최대 강화 망치](/images/topview-game/Hammer_Upgrade_After.gif)

> 최대로 강화한 망치입니다.<br>
> 충격파가 크게 퍼집니다.

</div>
</div>

망치의 충격파는 셰이더 그래프를 사용해 직접 연결했기 때문에 새 기능을 추가하더라도 수정 범위를 쉽게 좁힐 수 있습니다.

![충격파 머티리얼 Inspector](/images/topview-game/Ring_Color.png)

> 충격파 머티리얼의 Inspector입니다.<br>
> `Ring Color` 색을 변경해 충격파 고리 색을 변경할 수 있습니다.

## AI가 코드와 이슈를 작성하고 사람이 검토한다

### 상황: AI가 작성한 코드를 검사해야 한다

코드 작성 규칙은 규칙 문서(**`architecture.md`**)와 코드끼리 서로 부를 수 있는 범위를 나눈 **어셈블리 구분** 정도로만 두었습니다.

저는 AI가 작성한 코드를 게임의 상태를 바꾸는 System 코드 위주로 읽고 Play 하여 확인 후 커밋했습니다. System 코드의 크기가 커지고 이 과정이 반복될 때마다 번거로움을 느꼈습니다.

### 과제: 코드를 읽지 않고 버그를 확인하기

코드를 눈으로 읽는 것만으로는 프로젝트 전체에 숨겨진 버그를 찾고 검토하기에는 양이 너무 많고 시간이 부족했습니다.

![C# 파일 수와 코드 줄 수](/images/topview-game/cs_n_line.png)

> Release 1.0.0 당시 C# 파일은 300개, 코드는 18,820 줄이었습니다.

### 행동: AI 리뷰를 도입하고 테스트로 판정하기

#### 리뷰의 결과는 추측이다

AI가 코드 리뷰를 하도록 했습니다. 하지만 AI 리뷰는 그럴듯한 지적을 많이 합니다.

새로 만든 AI 코드 리뷰 도구는 Claude Code의 `/code-review` 스킬을 써 본 경험에서 시작되었습니다. 이를 참고해 제 상황에 맞는 리뷰 도구를 만들었습니다. 프로젝트 전반에 걸쳐 쌓인 버그를 찾아내도록 하였고 리뷰 결과를 모두 깃허브 이슈에 등록하는 절차를 추가했습니다.

각 리뷰마다 아래 판정 중 하나를 붙였습니다.

- **재현됨(reproduced)**: 실패하는 테스트로 버그를 확인함
- **재현 안 됨(not-reproduced)**: 테스트가 통과함
- **의도(intended)**: 기획한 동작이라 고치지 않음
- **테스트 없이 고침(fixed-without-test)**: 테스트할 동작이 없는 지적을 고침
- **버그가 아니라 기록만 남김(not-checked)**: 동작과 상관없는 지적(규칙 위반, 주석 및 이름 정리)이라 테스트할 것이 없음

![리뷰 결과로 등록된 GitHub 이슈](/images/topview-game/Review_Issues.png)

> AI의 리뷰 결과를 AI가 Issue로 등록한 모습입니다.

#### 프로젝트 전체 리뷰 대신 작업 내용에 대한 diff 리뷰

그렇게 만든 전체 리뷰는 한 번 실행하는 데 무려 100만 토큰 이상 사용되었습니다.

그래서 바뀐 코드만 읽는 diff 리뷰를 따로 만들었습니다. 의도적인 버그 6개를 심은 시험에서 세 번 모두 버그를 찾았고, 토큰은 8만 정도 사용되었습니다.

![리뷰 토큰 사용량 표](/images/topview-game/claude_chat_05_table.png)

> 전체 리뷰 세 번 만에 사용량 한도에 걸렸습니다.

#### 코드 규칙은 기계가 검사

코딩 컨벤션은 규칙 문서만으로는 AI가 놓칠 수 있기 때문에 제가 확인해야 했습니다. 그래서 Roslyn으로 분석기를 만들었습니다. 규칙 25개를 정했고 이를 어기면 컴파일 이후 Console에서 경고를 합니다.

![Roslyn 분석기 경고](/images/topview-game/Analyzer_Warning.png)

> 규칙을 어긴 코드가 컴파일될 때 바로 Console에서 경고합니다.

### 결과: 새로 발견한 버그 23개를 고침

리뷰 결과 49개(전체 리뷰 3회에서 48개, diff 리뷰 1회에서 1개)를 아래와 같이 판단했습니다.

- **재현됨 23개**: 모두 전체 리뷰에서 나왔고, 테스트에서 재현된 버그 23개를 수정했습니다
- **재현 안 됨 2개**: 전체 리뷰에서 1개, diff 리뷰에서 1개
- **의도 8개**
- **테스트 없이 고침 12개**: 규칙 위반, 정리, 주석과 실제 동작이 어긋난 지적이라 테스트를 쓰지 않고 고쳤습니다
- **버그가 아니라 기록만 남김 4개**: 동작과 상관없는 지적이라 테스트하지 않았습니다

## ECS에서 영감을 받은 프로젝트 구조

### 상황: 로직과 화면이 서로를 부르던 3월 구조

3월 구조에는 로직(Logic)과 화면(View)이 서로에게 기대도록 만들었습니다.

로직이 공격을 시작하면 애니메이션이 재생되고, 애니메이션에 붙인 스크립트가 진행 상태를 보다가 로직에 일정 시점에 알렸습니다.

화면에 보이는 공격과 실제 판정이 어긋나지 않게 하려고 고른 구조였습니다.

![StateMachineBehaviour 설정](/images/topview-game/smb.png)

> 사격 상태에 붙인 스크립트 두 개가 클립 14%에서 판정을, 95%에서 동작 종료를 로직에 알렸습니다.

게다가 모든 무기가 컴포넌트 하나를 함께 사용해 망치에도 쓰지 않는 탄약 기능이 있었습니다.

::: details 자세히 보기 - 코드
```csharp
// TopView.Components.WeaponComponent.cs (v1.0.0)
public struct WeaponComponent
{
    public WeaponKind kind;
    public float damage;

    // 원거리 무기(권총, 소총)만 쓴다
    public int maxAmmo;
    public int startingCurrentAmmo;
    // 원거리 무기와 투척 무기(수류탄)가 쓴다
    public int startingReserveAmmo;
    ...

    // 망치만 쓴다
    public float meleeRadius;
    ...
}
```
:::

### 과제: 판정 시점을 화면에서 떼어 내기

로직과 화면이 서로 기대다 보니 한쪽이 없으면 동작하지 않고, 망치는 사용하지 않는 탄약 기능을 들고 있는 구조였습니다.

### 행동: 멀티플레이 게임에서 찾은 답

#### 멀티플레이 게임을 만들며 바뀐 생각

Project 02에서 권위 서버를 쓰는 멀티플레이 게임을 만들며, 로직과 화면 사이에 권위 서버가 있어야 한다는 것을 배웠습니다.

둘이 서로 의존하는 구조에는 권위 서버를 추가하는 게 불가능했었습니다. 이러한 문제를 해결하기 위해서는 로직과 화면이 단방향이어야 한다고 생각했습니다.

![Project 02 썸네일](/images/topview-game/project_02_thumbnail.jpg)

> 현재는 개발을 멈춘 Project 02입니다.<br>
> Netcode for GameObjects로 멀티플레이 게임을 만들고 있었습니다.

#### 다른 멀티플레이 게임에서 답을 찾다

메이플스토리 테스트 서버에는 스킬마다 시전 시간(예: 660ms)이 ms 단위로 적혀 있습니다. 리그 오브 레전드에도 바로 나가는 스킬과 시전 시간이 지나야 나가는 스킬이 따로 있습니다.

처음에는 이 숫자가 왜 있는지 몰랐는데, 판정 시점을 애니메이션이 아니라 숫자로 정해 두면 화면 없이도 언제 맞는지 정할 수 있다는 것을 알게 됐습니다.

![메이플스토리 스킬 딜레이 툴팁](/images/topview-game/maple_delay.png)

> <span class="maple-text">[딜레이] 6thRageExplosion: 660ms</span>으로 시전 시간이 적혀있습니다.<br>
> 이미지 출처: [[메이플스토리 테스트서버, KMST v1.2.203] 변경점 툴팁 - 섣버](https://m.blog.naver.com/seotbeo/224341556041)

#### 공격 하나의 동작을 세 단계로 나눠서 구현

공격을 시전, 판정, 마무리의 세 단계로 나눴습니다. 단계가 바뀌는 시점은 공격을 시작한 뒤 몇 번째 틱인가로 공격 데이터에 적습니다. 클립은 보여 주기만 하고, 로직은 틱을 세어 판정합니다.

![망치 공격 틱 구간](/images/topview-game/Attack_Ticks.svg)

> 망치 공격은 시작 후 18~24틱에 판정하고, 40틱에 끝납니다.

### 결과: 화면에 기대지 않는 로직

이제 화면 없어도 로직이 돌아갑니다.

로직은 틱을 세어 공격을 판정하고 그 상태를 데이터로 남기며, 화면은 그 데이터를 읽어 맞는 애니메이션을 재생하게 바꾸기로 했습니다.

![로직과 화면의 흐름](/images/topview-game/Logic_View_Flow_re.svg)

> 로직이 틱을 세어 판정하고, 화면은 그 상태를 읽어 애니메이션만 재생합니다.

공격 애니메이션 클립(`Clip`)을 넣고 버튼(“Convert From Clip”)으로 시전, 판정, 마무리 세 단계를 계산하는 도구를 만들었습니다. 애니메이션 클립은 이 계산에만 쓰이고, 게임 도중에는 공격 데이터만 읽습니다.

![공격 틱 변환 도구](/images/topview-game/attack_tick_converter.png)

> 클립을 넣고 공격 판정 구간(`Start %`, `End %`)을 적은 뒤 “Convert From Clip”을 누르면<br>
`Melee Attack`의 `Start Ticks`와 `End Ticks`가 채워집니다.

화면 코드는 게임 상태를 바꾸는 코드(`Systems` 어셈블리)를 아예 부를 수 없게 어셈블리를 나눴습니다. 상태를 읽기만 하고 바꾸지 않는 것은 규칙 문서로 정했습니다.

![어셈블리 참조 방향](/images/topview-game/Assemblies.svg)

> 어셈블리 사이의 참조 방향입니다. 화면에 해당하는 `Presentation`과 `UserInterface`는 데이터만 읽고, 상태를 바꾸는 `Systems`는 부를 수 없습니다.

시간을 정수 틱으로 다루기 때문에, 한 틱 차이로 생기는 버그를 테스트로 확인할 수 있습니다. 플레이로 잡기 어려웠던 한 틱 차이 버그도 테스트로 확인합니다.

::: details 자세히 보기 - 코드
```csharp
// TopView.Tests.EditMode.PlayerStateSystemTests.cs
[Test]
public void WaitsUntilDieTicks()
{
    PlaceDeadPlayer(5, 4);
    ...
}

[Test]
public void RequestsDefeatAtDieTicks()
{
    PlaceDeadPlayer(5, 5);
    ...
}

private void PlaceDeadPlayer(int dieTicks, int elapsedTicks) { ... }
```

> 사망 연출이 5틱일 때, 4틱째에는 패배하지 않고 5틱째에 패배하는지 확인하는 테스트입니다.<br>
> 공격 판정처럼 시점을 정수 틱으로 정하니, 한 틱 차이를 그대로 비교할 수 있습니다.
:::

무기 쪽에서는 근접 무기에 탄약 컴포넌트가 아예 없고, 게임이 도는 동안 무기를 쓰는 코드는 무기 종류를 묻지 않습니다.

::: details 자세히 보기 - 코드
```csharp
// TopView.Entities.EntityArchetype.cs (일부 생략)
// 근접 무기. 탄약을 쓰지 않는다
public const ComponentMask MELEE_WEAPON = WEAPON | ComponentMask.MeleeAttack | ...;

// 원거리 무기. 탄창과 예비 탄약을 쓴다
public const ComponentMask RANGED_WEAPON = WEAPON | ComponentMask.StraightAttack | ComponentMask.Magazine | ComponentMask.ReserveAmmo | ...;

// 투척 무기. 예비 탄약만 쓴다
public const ComponentMask THROW_WEAPON = WEAPON | ComponentMask.ArcAttack | ComponentMask.ReserveAmmo | ...;

// 모든 무기가 가진 컴포넌트
private const ComponentMask WEAPON = ComponentMask.Owner | ComponentMask.Weapon | ...;
```

> 무기는 공통 부분(`WEAPON`)에 필요한 컴포넌트만 더해 만듭니다.<br>
> 근접 무기에는 탄창(`Magazine`)도 예비 탄약(`ReserveAmmo`)도 없어서, 상속 때처럼 쓰지 않는 재장전 기능을 물려받지 않습니다.
:::

## 마무리

### 회고

Claude Code와 함께 개발을 하며 든 생각은 일련의 작업 과정을 자동화할 수 있다고 생각했습니다. 앞으로 개발을 진행할 때는 다음 과정을 따라갈 것입니다.

1. 테스트 가능한 수준으로 기능을 기획합니다. (예: 공격에 치명타 확률이 생겨 피해량이 2배가 된다.)
2. AI가 기능 추가 코드를 작성합니다.
3. 작성한 코드를 테스트를 통해 구현을 확인합니다.
4. 테스트를 통과하지 못한 경우 2번으로 돌아갑니다.
5. 만들어둔 diff 리뷰 도구를 통해 버그를 검사합니다.
6. 버그가 검출되면 2번으로 돌아갑니다.
7. 원격 저장소에 저장하고 PR을 생성합니다.

이 과정에서도 개선할 점은 명확합니다. 3-4 번 테스트를 통과하지 못했을 때 어떻게 2번으로 돌아가게 할 것인지, 6번에서 버그가 검출되면 어떻게 해결할 것인지 아직 과제로 남아있습니다.

현재의 diff 리뷰 도구는 Claude가 문자열 검색으로 프로젝트 코드를 탐색하기 때문에 수정한 코드를 호출하던 코드는 검사하지 않습니다. 그래서 Roslyn의 AST(추상 구문 트리)를 사용해 수정한 코드를 참조하고 있던 기존 코드까지 검사 범위를 넓히도록 보완할 예정입니다.
