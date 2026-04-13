---
title: "Unity ECS로 최적화 해보기"
date: 2026-04-13
outline: deep
excerpt: ECS System과 Profiler를 통해 최적화를 해봅니다.
categories: Unity
---

### 소개

10만 개의 총알이 빗발치는 환경에서 기존 공간 분할(Spatial Partitioning) 알고리즘에 비트 배열(NativeBitArray)를 추가한 실험 기록이다.

::: info
- **Unity Version**: 6000.3.11 f1
- **ECS Version**: Entities(1.4.5), Entities Graphics(1.4.18), Unity Physics(1.4.5)
- **CPU**: 12th Gen Intel(R) Core(TM) i5-12600KF
- **GPU**: NVIDIA GeForce RTX 3060 Ti
- **RAM**: 16225MB
:::

### 코드
ECS에 대해 간단히 소개하자면 이렇다.

조작하려는 데이터(IComponentData)를 Unity 게임 오브젝트에 부착(Authoring)할 수 있도록 하고(Baker) 동작을 수행(ISystem)하도록 지시한다.

설계할 환경은 10만 개의 총알과 적 개체이다.

##### 총알(Bullet)
```csharp
public struct Bullet : IComponentData
{
    public float3 Position;
    public float3 Direction;
    public float Speed;
    public float Radius;
    public float Power;
}
```
- 총알은 위치, 방향, 속도, 피격 반지름, 피해량을 갖는다.

```csharp
partial struct BulletSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        float deltaTime = SystemAPI.Time.DeltaTime;
        float maxDistance = 1000f * 1000f;

        var endSimulationEntityCommandBuffer = SystemAPI.GetSingleton<EndSimulationEntityCommandBufferSystem.Singleton>();
        var endSimulationEntity = endSimulationEntityCommandBuffer.CreateCommandBuffer(state.WorldUnmanaged);
        foreach (var (transform, bullet, entity) in SystemAPI.Query<RefRW<LocalTransform>, RefRO<Bullet>>().WithEntityAccess())
        {
            transform.ValueRW.Position += bullet.ValueRO.Direction * bullet.ValueRO.Speed * deltaTime;
            if (math.distancesq(transform.ValueRO.Position, float3.zero) > maxDistance)
            {
                endSimulationEntity.DestroyEntity(entity);
            }
        }
    }
}
```
- 매 프레임 총알의 좌표를 `Position += Direction * Speed * deltaTime`만큼 변경한다.
- `maxDistance`를 벗어난 적을 `DestroyEntity()`하기 위해 커맨드 버퍼를 가져온다.
- `maxDistance`를 제곱한 이유는 제곱근 계산을 하지 않기 위해 제곱한 결과 그대로 비교하기 위함이다.

::: warning
현재 `foreach`로 `Bullet`을 순회하는 도중에 `DestroyEntity()`를 호출하면 구조적 변경이 발생하여 에러가 발생합니다.  
따라서 ECB(Entity Command Buffer)를 사용하여 파괴 명령을 예약하고,  
해당 시스템 루프가 끝난 뒤 `EndSimulationEntityCommandBufferSystem`에서 안전하게 일괄 삭제합니다.
:::

##### 적(Enemy)
```csharp
public struct Enemy : IComponentData
{
    public float MoveSpeed;
}

partial struct EnemySystem : ISystem
{
    private Random _random;

    public void OnCreate(ref SystemState state)
    {
        _random = new Random((uint)System.DateTime.Now.Ticks);
    }

    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        float deltaTime = SystemAPI.Time.DeltaTime;
        float range = 1000f * 1000f;

        foreach (var (transform, enemy) in SystemAPI.Query<RefRW<LocalTransform>, RefRO<Enemy>>())
        {
            float2 random2D = _random.NextFloat2Direction();
            float3 moveDirection = new float3(random2D.x, 0, random2D.y);

            transform.ValueRW.Position += moveDirection * enemy.ValueRO.MoveSpeed * deltaTime;
            if(math.lengthsq(transform.ValueRO.Position) > range)
            {
                transform.ValueRW.Position = float3.zero;
            }
        }
    }
}
```
- 적도 총알과 같은 원리로 움직인다.
- 매 프레임 무작위 방향을 정하고 움직인다.
- `range`를 벗어나면 원점으로 돌아온다.

##### 총알 생성기
```csharp
public struct BulletSpawner : IComponentData
{
    public Entity BulletPrefab;
    public int SpawnCount;
}
```
- 생성할 개체와 생성 숫자를 갖는 생성기를 만든다.

```csharp
class BulletSpawnerAuthoring : MonoBehaviour
{
    public GameObject bulletPrefab;
    public int spawnCount;
}

class BulletSpawnerAuthoringBaker : Baker<BulletSpawnerAuthoring>
{
    public override void Bake(BulletSpawnerAuthoring authoring)
    {
        var entity = GetEntity(TransformUsageFlags.None);

        AddComponent(entity, new BulletSpawner
        {
           BulletPrefab = GetEntity(authoring.bulletPrefab, TransformUsageFlags.Dynamic),
           SpawnCount = authoring.spawnCount
        });
    }
}
```
- 생성기는 움직이지 않으니 `TransformUsageFlags.None`
- `BulletPrefab`은 움직이니 `TransformUsageFlags.Dynamic`
##### 적 생성기
```csharp
public struct EnemySpawner : IComponentData
{
    public Entity EnemyPrefab;
    public int SpawnCount;
}
```
- 생성할 개체와 생성할 숫자를 정한다.
```csharp
partial struct EnemySpawnerSystem : ISystem
{
    private Random _random;
    private EntityQuery _enemyQuery;

    public void OnCreate(ref SystemState state)
    {
        state.RequireForUpdate<EnemySpawner>();

        _random = new Random((uint)System.DateTime.Now.Ticks);
        _enemyQuery = state.GetEntityQuery(ComponentType.ReadOnly<Enemy>());
    }

    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        int currentEnemyCount = _enemyQuery.CalculateEntityCount();
        var spawner = SystemAPI.GetSingleton<EnemySpawner>();
        int targetCount = spawner.SpawnCount;

        if (currentEnemyCount < targetCount)
        {
            int size = targetCount - currentEnemyCount;
            NativeArray<Entity> enemies = new NativeArray<Entity>(size, Allocator.Temp);
            state.EntityManager.Instantiate(spawner.EnemyPrefab, enemies);
            foreach (var enemy in enemies)
            {
                float2 randomPos2D = _random.NextFloat2Direction() * _random.NextFloat(0f, 990f);
                float3 spawnPosition = new float3(randomPos2D.x, 0, randomPos2D.y);

                state.EntityManager.SetComponentData(enemy, LocalTransform.FromPositionRotationScale(spawnPosition, quaternion.identity, 15.0f));
            }

            enemies.Dispose();
        }
    }
}
```
- 생성기에서 설정한 적의 개체 수를 유지하기 위해 매 프레임 Enemy를 `Instantiate()`한다.
- 모든 적의 좌표를 무작위로 설정한다.
- `foreach`가 끝나면 반드시 Enemy 배열을 `Dispose()`한다.
### 중간 점검
Profiler를 통해 중간 점검을 해본다.
![01](/images/Unity_ECS%20Test/01.png)
- 작성한 각각의 생성기 시스템이 Main Thread에서 작동함을 확인할 수 있다.
- 하단의 Job에서 `RigidBodies`가 점유하는 것을 볼 수 있다.
- 우리는 거리 기반 충돌처리를 할 것이기 때문에 `Collider`는 필요하지 않다.
![03](/images/Unity_ECS%20Test/03.png)
- `RigidBodies`는 사라졌는데, `WaitForGPU`가 13ms나 차지하고 있다.
- 처음 총알 프리팹의 Mesh를 기본 Sphere로 했는데, 이 삼각형의 수가 768개이다.
- 적 프리팹은 2,000마리의 Capsule 이지만 총알에 비해 상대적으로 숫자가 적어 미미했다.
- 사진에서 한 프레임의 삼각형의 수가 153.17M(1억 5,000만 개) 임을 확인할 수 있다.
- CPU의 작업은 끝났지만 GPU의 작업이 많아 CPU가 기다리는 것이다.
- Mesh를 Sphere에서 Cube로 바꾸고, 머티리얼의 `Shadow Receive`를 끄고, `GPU Instancing` 을 활성화 했다.
![04](/images/Unity_ECS%20Test/04.png)
- 이제 한 프레임에 12.47ms 로 약 80fps의 출력을 확인할 수 있다.
- 삼각형의 숫자가 2.4M (240만 개)

### 충돌 시스템