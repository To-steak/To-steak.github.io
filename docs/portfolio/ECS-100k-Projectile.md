---
title: ECS 100k Projectile 포트폴리오
description: 발사체 10만 개 충돌 조회를 비트 필터로 최적화한 Unity ECS 실험
outline: [2, 3]
---

# ECS 100k Projectile 포트폴리오

![ECS 100k Projectile 썸네일](/images/ecs-100k/thumbnail.jpg)

::: tip 프로젝트 정보
발사체 100,000개와 피격체 2,000개의 충돌을 시뮬레이션할 때, 해시맵 조회 전에 비트 필터를 두면 조회 비용을 아낄 수 있는지 검증한 실험입니다.

- **GitHub 저장소**: <https://github.com/To-steak/ECS-100k-Projectile>
- **인원**: 1인
- **개발 기간**: 2026. 08. 27 ~ 2026. 09. 07
- **기술**: Unity 6, Entities(ECS), Burst
:::

## Abstract

이 실험은 "충돌 조회 전에 비트 하나로 빈 격자를 걸러내면, 해시맵 조회 비용을 줄일 수 있는가"라는 질문에서 출발했습니다. Unity ECS로 발사체 100,000개와 피격체 2,000개가 움직이는 세계를 만들고, 공간 분할 충돌 검사에 비트 필터를 켜고 끈 두 조건만 비교했습니다.

그 결과 충돌 시스템(CollisionSystem)의 처리 시간이 **10.27ms에서 5.53ms로 46% 줄었습니다.** 감소분의 대부분은 발사체가 주변 격자를 조회하는 구간(7.26ms → 2.88ms, -60%)에서 나왔고, 비트 배열을 유지하는 비용은 0.004ms로 거의 없었습니다.

결론적으로 빈 격자가 대부분인 데이터 분포에서는, 자료구조를 바꾸지 않고 저렴한 사전 필터 하나만 더해도 조회 비용을 크게 줄일 수 있었습니다.

### 시연 영상

<iframe style="width: 100%; aspect-ratio: 16 / 9;" src="https://www.youtube-nocookie.com/embed/jNqiS6__Kqw" title="ECS 100k Projectile 시연 영상" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## Preliminary

코딩 테스트를 준비하며 방문 여부를 비트 배열로 기록해 탐색을 줄이는 방식을 자주 썼습니다. 이 방식이 실제 게임의 충돌 처리에서도 통하는지 궁금해져 실험을 설계했습니다.

대량의 발사체 충돌은 보통 공간 분할로 처리합니다. 피격체를 격자 셀에 등록해 두고, 발사체는 자기 셀과 인접 셀만 조회하는 방식입니다. 그런데 피격체 수보다 격자가 훨씬 넓으면, 발사체가 조회하는 셀 대부분은 비어 있습니다. 빈 셀이라도 해시맵을 조회하려면 해시 계산과 탐색 비용을 그대로 내야 합니다.

그래서 다음 가설을 세웠습니다.

> 셀이 비어 있는지만 기록하는 비트 배열을 두고 조회 전에 비트 하나를 먼저 확인하면, 빈 셀의 해시맵 조회를 건너뛰어 전체 비용이 줄어든다. 비트 배열을 유지하는 비용은 줄어드는 조회 비용보다 훨씬 작을 것이다.

## Method

### 1. 실험 세계

| 항목 | 값 |
| --- | --- |
| 발사체 | 100,000개, 중앙 부근에서 무작위 방향으로 발사 (속도 30 ~ 80) |
| 피격체 | 2,000개, 무작위로 이동 |
| 격자 | 셀 크기 10, 범위 2,000 × 2,000 → 200 × 200 = 40,000셀 |
| 충돌 반경 | 발사체 0.5 + 피격체 0.5 |

피격체가 2,000개뿐이라 40,000셀 중 피격체가 있는 셀은 많아야 2,000개(5%)입니다. 나머지 95% 이상은 빈 셀입니다.

### 2. 비교한 두 방법

#### 비트 필터 OFF: 공간 분할만 사용

- 매 프레임 피격체를 셀 좌표 기준으로 해시맵(`NativeParallelMultiHashMap`)에 등록합니다.
- 발사체마다 자기 셀과 주변 8개 셀, 모두 9개 셀을 해시맵에서 조회합니다.
- 조회 대상 셀이 비어 있어도 해시 계산과 탐색 비용은 같습니다.

#### 비트 필터 ON: 조회 전에 비트 하나 확인

- 해시맵과 별도로, 셀 점유 여부만 기록하는 비트 배열(`NativeBitArray`, 40,000비트)을 둡니다.
- 피격체를 해시맵에 등록할 때 해당 셀의 비트도 함께 켭니다.
- 발사체가 셀을 조회하기 전에 비트를 확인해, 꺼져 있으면 해시맵 조회 자체를 건너뜁니다.

::: details 자세히 보기 - 코드
```csharp
// CollisionSystem.cs: 발사체 주변 9개 셀 조회
for (int i = -1; i <= 1; i++)
{
    for (int j = -1; j <= 1; j++)
    {
        int2 checkCell = cellCoord + new int2(i, j);

        // 비트가 0이면 빈 격자이므로 해시 조회 자체를 건너뛴다
        if (UseBitFilter)
        {
            int linearIndex = GridManager.ToLinearIndex(checkCell);
            if (linearIndex == -1 || !occupancyBits.IsSet(linearIndex)) continue;
        }

        if (enemyGrid.TryGetFirstValue(checkCell, out var enemyData, out var iterator))
        {
            // 셀 안의 피격체와 거리 비교
            ...
        }
    }
}
```
:::

### 3. 측정 방법

- **단일 변수 비교**: 두 조건은 `UseBitFilter` 값 하나만 다릅니다.
- **충돌 처리는 단일 스레드**: 병렬 처리로 차이가 가려지지 않도록, 충돌 시스템은 Job 없이 메인 스레드에서 실행했습니다. 발사체와 피격체의 이동은 병렬 Job으로 처리합니다.
- **구간 계측**: `ProfilerMarker`로 충돌 시스템을 네 구간(Sync / Alloc / BuildGrid / Query)으로 나눠 계측했습니다.
- **측정 시점**: 발사체가 완전히 퍼진 뒤, 개발 빌드에 Profiler를 연결해 스냅샷을 확인했습니다.

::: info 측정 환경
- CPU: 12th Gen Intel(R) Core(TM) i5-12600KF (3.70 GHz)
- GPU: NVIDIA GeForce RTX 3060 Ti
- RAM: 16GB
:::

## Result

### 1. 구간별 처리 시간

| 구간 | 비트 OFF | 비트 ON | 차이 |
| --- | --- | --- | --- |
| CPU 총합 | 14.84ms | 9.73ms | -5.11ms (-34%) |
| SimulationSystemGroup (ECS 전체) | 11.94ms | 6.96ms | -4.98ms (-42%) |
| **CollisionSystem (충돌 시스템)** | **10.27ms** | **5.53ms** | **-4.74ms (-46%)** |
| Collision.Sync (다른 Job을 기다린 시간) | 2.99ms | 2.63ms | -0.36ms |
| Collision.Alloc (해시맵·비트 배열 할당) | 0.003ms | 0.003ms | 0ms |
| Collision.BuildGrid (격자에 피격체 등록) | 0.017ms | 0.021ms | +0.004ms |
| **Collision.Query (발사체 주변 9개 셀 조회)** | **7.26ms** | **2.88ms** | **-4.38ms (-60%)** |
| EndSimulationECB (충돌한 개체 파괴) | 0.829ms | 0.489ms | -0.34ms |

### 2. Profiler 스냅샷

![비트 필터 OFF 프로파일](/images/ecs-100k/bit_off.png)

> 비트 필터 OFF

![비트 필터 ON 프로파일](/images/ecs-100k/bit_on.png)

> 비트 필터 ON

## Discussion

### 1. 줄어든 시간은 거의 전부 조회 구간에서 나왔다

충돌 시스템에서 줄어든 4.74ms 중 4.38ms가 Query 구간입니다. 가설대로, 빈 셀의 해시맵 조회를 건너뛴 효과가 감소분의 대부분을 차지했습니다.

### 2. 유지 비용은 거의 없었다

비트 배열을 켜는 BuildGrid 구간은 0.017ms에서 0.021ms로 0.004ms 늘었습니다. 줄어든 조회 비용(4.38ms)에 비하면 무시할 수 있는 수준입니다. 피격체를 등록할 때 비트 하나를 켜는 일이 전부이기 때문입니다.

### 3. 효과는 데이터 분포에 달려 있다

이 실험에서는 격자의 95% 이상이 빈 셀이었습니다. 빈 셀 비율이 높을수록 건너뛰는 조회가 많아지므로, 피격체가 격자를 촘촘히 채우는 상황에서는 효과가 줄어들 것입니다. 비트 필터는 넓은 공간에 대상이 드문드문 있는 경우에 맞는 방법입니다.

### 4. 결론

빈 공간이 많은 데이터 분포에서는 자료구조를 복잡하게 바꾸는 것보다, 저렴한 사전 필터 하나를 더하는 것이 효과적이었습니다. 또한 가설을 세우고, 변수 하나만 바꾸는 실험으로 설계하고, 프로파일링 수치로 검증하는 과정을 직접 해 볼 수 있었습니다.
