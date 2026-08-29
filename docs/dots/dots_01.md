---
title: 총알 10만 개 충돌시켜보기
description: ECS를 사용해보고 충돌 방법에 따른 최적화 정도 비교하기
---
# 총알 10만 개 충돌시켜보기
Unity의 Entity Component System을 사용해 씬에 100,000 개의 발사체(Bullet)와 2,000개의 피격체가 존재할 때, 충돌 방식에 따른 최적화 정도를 측정한 프로젝트이다.

## 문제
10만 개 총알의 충돌 검사를 진행할 때 피격체와 단순 반복문(brute force)으로 비교하는 것은 성능이 매우 나쁘다.

해결책으로 공간 분할이 대표적이며 이를 사용하여 계산량을 줄이는 것으로 성능 상승을 기대할 수 있었다.

위 시뮬레이션을 Unity의 Data-Oriented Technology Stack 중 Entity Component System을 사용해 실험해 보았다.

더 나아가 비트 필터링을 통한 추가적인 성능 향상도 시도했다.

::: info 공간 분할
공간 분할 패턴은 게임 세계를 여러 영역으로 나누고 가까운 객체만 검사하도록 합니다. 균일 격자, 쿼드트리, 공간 해싱의 특징을 비교하여 게임 공간에 알맞은 구조를 선택합니다.

(출처: [Wikidocs](https://wikidocs.net/394685))
:::

## 난이도
정보가 많이 없는 만큼 [Documents](https://docs.unity3d.com/Packages/com.unity.entities@1.4/manual/index.html)의 [API](https://docs.unity3d.com/Packages/com.unity.entities@1.4/api/index.html)를 보며 Claude를 통해 개발하였다.

프로젝트 시작 전 [ECS workflow examples](https://docs.unity3d.com/Packages/com.unity.entities@1.4/manual/ecs-workflow-tutorial.html)로 ECS가 어떤 구조를 갖는지 파악했다.

기존 OOP 방식(MonoBehaviour)은 수 천개의 오브젝트를 순회 할 때마다 캐시 미스가 발생하는데 ECS는 연속된 주소에 나란히 저장해 캐시 지역성(Cache Locality)를 활용한다.

캐시 히트가 높아져 성능 향상을 도모할 수 있다. 그렇기에 대부분 `IComponentData`를 구현하는 값(Value) 타입으로 선언해야 한다.

Authoring은 `MonoBehaviour`로 인스펙터로 다루기 위한 오브젝트를 선언한다.

Baking은 Authoring한 데이터를 런타임에 쓰일 `IComponentData`로 변환해 Entity에 부착하는 과정이다.

프로젝트에 사용한 피격체(Enemy)를 선언하려면 다음의 코드를 작성해야 한다.

::: details 코드를 보려면 클릭하세요.
```C#
using Unity.Entities;
using UnityEngine;

// 사용할 데이터를 선언한다.
public struct Enemy : IComponentData
{
    public float MoveSpeed;
}

// Prefab에 부착하기 위한 컴포넌트를 Authoring 한다.
class EnemyAuthoring : MonoBehaviour
{
    public float moveSpeed;
}

// Authoring 한 것을 Baker<T>를 통해 Baking 한다.
class EnemyAuthoringBaker : Baker<EnemyAuthoring>
{
    public override void Bake(EnemyAuthoring authoring)
    {
        // 피격체(Enemy)는 움직이는 물체이다.
        var entity = GetEntity(TransformUsageFlags.Dynamic);

        // IComponentData를 Entity에 부착한다.
        AddComponent(entity, new Enemy
        {
           MoveSpeed = authoring.moveSpeed 
        });
    }
}
```
:::

## 해결
씬(Scene) 환경은 다음과 같다.

1. XZ 평면(Y = 0 고정) 위 2000 * 2000 유닛 크기의 정사각형 공간에서 진행된다.
2. 피격체(Enemy)는 원점을 중심으로 반경 990 유닛 원형 범위에 랜덤 스폰되며, 이는 공간 해싱 그리드가 커버하는 범위(-1000 ~ 1000)에 맞춰 설정되었다.
3. 피격체(Enemy)는 생성 후 매 프레임 무작위 방향으로 움직이며, 파괴 시 목표 개체 수(2,000개)에 맞춰 다시 생성하는 방식이다.
4. 발사체(Bullet)는 원점 근처(반경 1 이내)에서 스폰되어 랜덤 방향으로 속도 30 ~ 80 사이 값을 가지고 발사되며, 충돌 판정 반경은 0.5 유닛이다.
5. 발사체(Bullet)는 원점 기준 거리가 1000 유닛을 초과하면 파괴되며, 매 프레임 목표 개체 수(100,000개)에 맞춰 다시 생성하는 방식이다.
6. 발사체(Bullet)는 하나의 피격체(Enemy)와의 충돌만 가능하며 충돌 시 파괴된다.

첫 번째 방법은 씬(Scene) 내 발사체(Bullet)와 피격체를 모두 비교하는 Brute Force 방식인 <span style="color: #FF6666">WORST</span> 시스템이다.

::: details 코드를 보려면 클릭하세요.
```C#
using Unity.Burst;
using Unity.Entities;
using Unity.Mathematics;
using Unity.Transforms;

partial struct WorstCollisionSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        var ecbSingleton = SystemAPI.GetSingleton<EndSimulationEntityCommandBufferSystem.Singleton>();
        var ecb = ecbSingleton.CreateCommandBuffer(state.WorldUnmanaged);

        foreach (var (bulletTransform, bullet, bulletEntity) in SystemAPI.Query<RefRO<LocalTransform>, RefRO<Bullet>>().WithEntityAccess())
        {
            foreach (var (enemyTransform, enemy, enemyEntity) in SystemAPI.Query<RefRO<LocalTransform>, RefRO<Enemy>>().WithEntityAccess())
            {
                float3 bulletPos = bulletTransform.ValueRO.Position;
                float3 enemyPos = enemyTransform.ValueRO.Position;

                float distance = math.distance(bulletPos, enemyPos);
                float collisionRadius = bullet.ValueRO.Radius;

                if (distance <= collisionRadius)
                {
                    ecb.DestroyEntity(enemyEntity);
                    ecb.DestroyEntity(bulletEntity);
                    break;
                }
            }
        }
    }
}

```
:::

두 번째 방법은 세계를 격자로 나누고 매 프레임마다 피격체 Entity의 좌표를 가진 `HashMap`을 선언한다.

아래 구조체는 <span style="color: #66FF66">BEST</span> 및 <span style="color: #6666FF">BIT</span> 시스템의 `HashMap`에 사용된다.

::: details 코드를 보려면 클릭하세요.
```C#
using Unity.Entities;
using Unity.Mathematics;

struct EnemyGridData : System.IComparable<EnemyGridData>
{
    public int CellIndex;
    public Entity Entity;
    public float3 Position;

    public int CompareTo(EnemyGridData other)
    {
        return CellIndex.CompareTo(other.CellIndex);
    }
}
```
:::

총알 좌표 근처 9개(3 * 3) 격자에 대해서만 충돌 검사를 진행하는 <span style="color: #66FF66">BEST</span> 시스템이다.

::: details 코드를 보려면 클릭하세요.
```C#
using Unity.Burst;
using Unity.Collections;
using Unity.Entities;
using Unity.Mathematics;
using Unity.Transforms;

partial struct BestCollisionSystem : ISystem
{
    private const float CELL_SIZE = 10f;

    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        var ecbSingleton = SystemAPI.GetSingleton<EndSimulationEntityCommandBufferSystem.Singleton>();
        var ecb = ecbSingleton.CreateCommandBuffer(state.WorldUnmanaged);

        var enemyGrid = new NativeParallelMultiHashMap<int2, EnemyGridData>(2048, Allocator.Temp);

        foreach (var (enemyTransform, enemy, enemyEntity) in SystemAPI.Query<RefRO<LocalTransform>, RefRO<Enemy>>().WithEntityAccess())
        {
            float3 position = enemyTransform.ValueRO.Position;
            int2 cellCoord = new int2((int)math.floor(position.x / CELL_SIZE), (int)math.floor(position.z / CELL_SIZE));

            enemyGrid.Add(cellCoord, new EnemyGridData
            {
                Entity = enemyEntity,
                Position = position
            });
        }

        foreach (var (bulletTransform, bullet, bulletEntity) in SystemAPI.Query<RefRO<LocalTransform>, RefRO<Bullet>>().WithEntityAccess())
        {
            float3 position = bulletTransform.ValueRO.Position;
            float radius = bullet.ValueRO.Radius;
            int2 cellCoord = new int2((int)math.floor(position.x / CELL_SIZE), (int)math.floor(position.z / CELL_SIZE));

            bool hit = false;

            for (int i = -1; i <= 1; i++)
            {
                for (int j = -1; j <= 1; j++)
                {
                    int2 checkCell = cellCoord + new int2(i, j);

                    if (enemyGrid.TryGetFirstValue(checkCell, out var enemyData, out var iterator))
                    {
                        do
                        {
                            float distance = math.distance(position, enemyData.Position);

                            if (distance <= radius)
                            {
                                ecb.DestroyEntity(enemyData.Entity);
                                ecb.DestroyEntity(bulletEntity);
                                hit = true;
                                break;
                            }
                        }
                        while (enemyGrid.TryGetNextValue(out enemyData, ref iterator));
                    }
                    if (hit) break;
                }
                if (hit) break;
            }
        }

        enemyGrid.Dispose();
    }
}
```
:::

마지막인 세 번째 방법은 <span style="color: #66FF66">BEST</span> 시스템에서 `NativeBitArray`를 추가하여 적의 유무를 기록하고 `HashMap`조회 이전에 적이 없는 격자라면 Hash 조회를 건너뛰는 <span style="color: #6666FF">BIT</span> 시스템이다.

::: details 코드를 보려면 클릭하세요.
```C#
using Unity.Burst;
using Unity.Collections;
using Unity.Entities;
using Unity.Mathematics;
using Unity.Transforms;

partial struct BitCollisionSystem : ISystem
{
    private const float CELL_SIZE = 10f;
    private const int GRID_SIZE = 200;
    private const int GRID_OFFSET = 100;
    private const int TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

    private EntityQuery _enemyQuery;

    public void OnCreate(ref SystemState state)
    {
        _enemyQuery = state.GetEntityQuery(ComponentType.ReadOnly<Enemy>(), ComponentType.ReadOnly<LocalTransform>());
    }

    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        int enemyCount = _enemyQuery.CalculateEntityCount();
        if (enemyCount == 0) return;

        var ecbSingleton = SystemAPI.GetSingleton<EndSimulationEntityCommandBufferSystem.Singleton>();
        var ecb = ecbSingleton.CreateCommandBuffer(state.WorldUnmanaged);

        var occupancyBits = new NativeBitArray(TOTAL_CELLS, Allocator.Temp, NativeArrayOptions.ClearMemory);
        var enemyDataArray = new NativeArray<EnemyGridData>(enemyCount, Allocator.Temp);
        var gridOffsets = new NativeArray<int>(TOTAL_CELLS, Allocator.Temp);
        var gridCounts = new NativeArray<int>(TOTAL_CELLS, Allocator.Temp);

        for (int i = 0; i < TOTAL_CELLS; i++)
        {
            gridOffsets[i] = -1;
            gridCounts[i] = 0;
        }

        int index = 0;
        foreach (var (enemyTransform, enemy, enemyEntity) in SystemAPI.Query<RefRO<LocalTransform>, RefRO<Enemy>>().WithEntityAccess())
        {
            float3 position = enemyTransform.ValueRO.Position;
            int2 cellCoord = new int2((int)math.floor(position.x / CELL_SIZE), (int)math.floor(position.z / CELL_SIZE));

            int x = cellCoord.x + GRID_OFFSET;
            int z = cellCoord.y + GRID_OFFSET;

            int linearIndex = -1;
            if (x >= 0 && x < GRID_SIZE && z >= 0 && z < GRID_SIZE)
            {
                linearIndex = z * GRID_SIZE + x;
                occupancyBits.Set(linearIndex, true); // 해당 셀에 적이 있음을 비트로 표시
            }

            enemyDataArray[index++] = new EnemyGridData
            {
                CellIndex = linearIndex,
                Entity = enemyEntity,
                Position = position
            };
        }

        enemyDataArray.Sort();

        for (int i = 0; i < enemyDataArray.Length; i++)
        {
            int cellIndex = enemyDataArray[i].CellIndex;
            if (cellIndex == -1) continue;

            if (gridOffsets[cellIndex] == -1)
            {
                gridOffsets[cellIndex] = i;
            }
            gridCounts[cellIndex]++;
        }

        foreach (var (bulletTransform, bullet, bulletEntity) in SystemAPI.Query<RefRO<LocalTransform>, RefRO<Bullet>>().WithEntityAccess())
        {
            float3 position = bulletTransform.ValueRO.Position;
            float radius = bullet.ValueRO.Radius;
            int2 cellCoord = new int2((int)math.floor(position.x / CELL_SIZE), (int)math.floor(position.z / CELL_SIZE));
            bool hit = false;

            for (int i = -1; i <= 1; i++)
            {
                for (int j = -1; j <= 1; j++)
                {
                    int checkX = cellCoord.x + i + GRID_OFFSET;
                    int checkZ = cellCoord.y + j + GRID_OFFSET;

                    if (checkX < 0 || checkX >= GRID_SIZE || checkZ < 0 || checkZ >= GRID_SIZE)
                    {
                        continue;
                    }

                    int linearIndex = checkZ * GRID_SIZE + checkX;

                    // 1차 검문: 비트가 0이면 빈 공간이므로 즉시 스킵 (해시맵 때와 동일한 Fast-fail)
                    if (!occupancyBits.IsSet(linearIndex))
                    {
                        continue;
                    }

                    // 2차 탐색: 비트가 1일 때만 배열 오프셋 접근
                    int offset = gridOffsets[linearIndex];
                    if (offset != -1) // 안전 장치
                    {
                        int count = gridCounts[linearIndex];
                        int endIdx = offset + count;

                        for (int k = offset; k < endIdx; k++)
                        {
                            var enemyData = enemyDataArray[k];
                            float distance = math.distance(position, enemyData.Position);

                            if (distance <= radius)
                            {
                                ecb.DestroyEntity(enemyData.Entity);
                                ecb.DestroyEntity(bulletEntity);
                                hit = true;
                                break;
                            }
                        }
                    }
                    if (hit) break;
                }
                if (hit) break;
            }
        }

        occupancyBits.Dispose();
        enemyDataArray.Dispose();
        gridOffsets.Dispose();
        gridCounts.Dispose();
    }
}
```
:::

## 결과
측정은 빌드 후의 FPS 기준으로 측정했다.

UI의 FPS는 현재 프레임 수, AVG는 최근 5초간 평균 프레임 수를 의미한다.

측정에 사용한 컴퓨터 사양은 다음과 같다.

::: info PC 정보
- CPU: 12th Gen Intel(R) Core(TM) i5-12600KF(3.70 GHz)
- GPU: NVIDIA GeForce RTX 3060 Ti
- RAM: 16.0GB
:::

총알이 균일하게 퍼지기까지 기다린 후 세 시스템(WORST, BEST, BIT)을 선택 후 5초 간 기다려 평균 프레임을 확인해 측정했다.

결과는 다음과 같았다.

|방법|5초 평균 프레임|
|:-------|:-------|
|WORST|4.4 ~ 4.5 fps|
|BEST|76.6 ~ 76.8 fps|
|BIT|125.2 ~ 126.4 fps|

<iframe width="100%" height="400" src="https://www.youtube.com/embed/8JQztp0wtAY" title="ECS 100k Projectile" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## 회고
보다 <span style="color: #6666FF">BIT</span>가 더 좋은 성능을 보이는 이유는 해시 계산 비용과 그로 인한 캐시 미스 비용 때문이다.

우리가 배웠던 해시 조회의 시간 복잡도는 O(1)이다.

두 시스템의 시간복잡도는 <span style="color: #6666FF">BIT</span>가 더 크게 나타난다. 하지만 성능은 그렇지 않았다.

::: info 시간복잡도
- <span style="color: #66FF66">BEST</span> : O(n + m * k)
- <span style="color: #6666FF">BIT</span> : O(n log n + m * k)

n: 피격체의 총 개수, m: 발사체의 총 개수, k: 탐색 범위(3 * 3 격자) 내의 피격체 개수 (k << n)
:::

해시 조회를 하게될 때 내부에선 해시 함수에 넣어 해시값을 계산하고, 그 해시값으로 위치를 계산한다.

그 위치의 메모리 주소에 접근을 하는데 이전에 접근한 주소와 이웃해있지 않을 수 있다. 즉 캐시 미스가 일어나게 된다.

<span style="color: #6666FF">BIT</span> 방식은 이 과정을 대체할 작은 비트 배열(약 5KB)을 사용한다. 이 크기는 CPU 캐시에 통째로 올라갈 수 있어, 대부분의 빈 격자 확인이 캐시 히트로 처리되며 해시 계산과 캐시 미스 비용을 크게 줄인다.

하지만 피격체의 수를 20,000으로 10배 늘리게 된다면 <span style="color: #66FF66">BEST</span> 시스템이 더 좋은 성능을 보였다.

이는 한 격자에 여러 피격체(Enemy)가 몰릴 확률이 높아져 `enemyDataArray.Sort()`(O(n log n)) 배열 정렬 비용이 커지며 결과가 역전되는 것이라 추측한다.

더 자세한 이유를 찾으려면 Deep Profiler를 사용해서 확인해야 할 것이다.

Claude를 이용해 ECS의 workflow를 쉽게 배울 수 있었고 모르는 내용 또한 웹 검색을 기반으로 물어보며 쉽게 이해할 수 있었다.

나중에 ECS를 이용해 오픈 월드 게임을 만들 수 있다면 좋겠다.