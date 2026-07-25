# Object Pool & Animator Parameter

## 문제

Enemy 를 `Instantiate()` / `Destroy()` 로 반복 생성하면 GC 부하가 누적된다.

프로젝트에 Pool 을 도입해 Enemy와 Bullet 을 재사용하도록 했다.

Pool 은 Scene 시작 시 `Instantiate()` 로 생성 후 비활성화하여 Queue에 넣어둔다.

::: details code
```C#
public class PoolManager : MonoBehaviour, IObjectPool
{
    void Awake()
    {
        ObjectPool.Manager = this;

        foreach (var pool in bulletPools)
        {
            var queue = new Queue<GameObject>();
            for (int i = 0; i < pool.Count; i++)
            {
                GameObject prefab = Instantiate(pool.Prefab, transform);
                prefab.SetActive(false);
                queue.Enqueue(prefab);
            }

            _pools[pool.Prefab] = queue;
        }
    }
}
```
:::

이후 Pool을 통해 Enemy를 생성했을 때, 다음과 같은 문제가 발생했다.

정상적으로 움직이던 Enemy가 사거리에 Player를 감지 후 Attack 상태로 진입한 뒤 그대로 멈춘다.

![Enemy_From_Pool](/images/Enemy_From_Pool.png)

(Player에게 다가간 후 멈춰버린 Enemy)



## 난이도

위에서 발생한 문제는 `Instantiate()`로 직접 만들면 문제가 재현되지 않았다.

평소에는 문제가 없다가 공격 사거리 내 Player가 들어오면, 멈춰버리는 문제였기에 원인을 찾기 힘들었다.

멈춰있더라도 피격 및 사망은 잘 동작했기 때문이다.

여기서 CLAUDE에게 원인을 물었고, 다음과 같은 답변을 받았다.

::: info
```
Pool에서 생성 직후 `EnemyController.Awake()`가 실행되는데,

이는 `PoolManager.Awake()`가 `Instantiate()`를 호출하는 도중 중첩 호출되는 것이다.

이 Awake가 다 끝나기도 전에 `prefab.SetActive(false)`가 곧바로 뒤따르기 때문에,

`Initialize()`에서 실행한 `SetFloat()`가 무시될 수 있다.
```
:::

## 해결

위 설명이 확실한지 확인하기 위해 검증이 필요했다.

값을 주입하는 초기화 시점을 뒤로 옮겨보기로 했다.

Pool은 `IPoolable`을 구현해야 Pool에 등록할 수 있다.

::: details code
```C#
public interface IPoolable
{
    void SetSource(GameObject source);
}
```
:::

Pool의 `Awake()`에서는 오브젝트 생성 후 비활성화를 한다

이때, 함께 Enemy의 `Awake()`도 실행된다.

이후 `Get()`으로 Enemy를 꺼낼 때, `SetSource()`로 오브젝트 자신을 Key로 등록해둔다.

::: details code
```C#
public class PoolManager : MonoBehaviour, IObjectPool
{
    // ...
    public GameObject Get(GameObject prefab, Vector3 position, Quaternion rotation)
    {
        if (!_pools.TryGetValue(prefab, out var queue))
        {
            queue = new Queue<GameObject>();
            _pools[prefab] = queue;
        }

        GameObject instance = queue.Count > 0 ? queue.Dequeue() : Instantiate(prefab, transform);

        instance.transform.SetPositionAndRotation(position, rotation);
        instance.SetActive(true);

        if (instance.TryGetComponent<IPoolable>(out var poolable))
        {
            poolable.SetSource(prefab);
        }
        return instance;
    }
}
```
:::

`Animations.Initialize()`가 오브젝트 비활성화로 인해 무시되지 않기 위해서 `SetSource()` 시점으로 옮겼다.

::: details code
```C#
public class EnemyController : MonoBehaviour, IPoolable
{
    // ...
    void Awake()
    {
        Move = new EnemyMoveState(this);
        Chase = new EnemyChaseState(this);
        Attack = new EnemyAttackState(this);
        Die = new EnemyDieState(this);

        Agent = GetComponent<EnemyAgent>();
        Animations = GetComponent<EnemyAnimations>();
        Health = GetComponent<EnemyHealth>();
        Weapon = GetComponent<EnemyWeapon>();
        Collider = GetComponent<BoxCollider>();
        Events = new EnemyEvents();

        // 기존에는 여기서 함께 초기화를 진행했다.
        // Initialize();
    }

    public void SetSource(GameObject source)
    {
        _source = source;
        Initialize();
    }

    private void Initialize()
    {
        Agent.Initialize(config);
        Animations.Initialize(Events, config);
        Weapon.Initialize();
        Health.Initialize(Events, config);
        Collider.enabled = true;
    }
}
```
:::

## 결과

Enemy가 정상적으로 공격하는 것을 확인할 수 있었다.

![Fixed_Enemy_From_Pool](/images/Fixed_Enemy_From_Pool.png)

(Enemy가 Player를 향해 몸통 박치기를 하고 있다.)

이제 CLAUDE의 설명이 맞았는지 검증할 필요가 있다.

그래서 Attack 상태에 진입했을 때와 `Initialize()`에서 각각 애니메이터 파라미터인 `AttackSpeed` 값을 Log로 찍어보기로 했다.

::: info
```
[Init] Set AttackSpeed=2, Readback=2, activeInHierarchy=True
UnityEngine.Debug:Log (object)
EnemyAnimations:Initialize (EnemyEvents,EnemyConfig) (at Assets/Scripts/Enemy/EnemyAnimations.cs:21)
EnemyController:Initialize () (at Assets/Scripts/Enemy/EnemyController.cs:89)
EnemyController:Awake () (at Assets/Scripts/Enemy/EnemyController.cs:43)
UnityEngine.Object:Instantiate<UnityEngine.GameObject> (UnityEngine.GameObject,UnityEngine.Transform)
PoolManager:Awake () (at Assets/Scripts/Manager/PoolManager.cs:49)

[Attack.Enter] AttackSpeed readback=0
UnityEngine.Debug:Log (object)
EnemyAttackState:Enter () (at Assets/Scripts/Enemy/EnemyState/EnemyAttackState.cs:12)
EnemyController:ChangeState (EnemyState) (at Assets/Scripts/Enemy/EnemyController.cs:77)
EnemyChaseState:Tick () (at Assets/Scripts/Enemy/EnemyState/EnemyChaseState.cs:54)
EnemyController:Update () (at Assets/Scripts/Enemy/EnemyController.cs:70)
```
:::

Log를 보면 `[Init]`에서 `SetFloat()`가 실패해서 값이 초기화 된 것이 아니었다.

하지만 Attack 진입 시점에는 0이다.

즉 일어난 일은:
1. `Instantiate()` 도중 `Awake()` → `AttackSpeed` = 2 정상 설정됨 (이 순간엔 진짜로 2)
2. 곧바로 `prefab.SetActive(false)`
3. 이후 언젠가 `Get()`에서 `SetActive(true)`
4. 이 재활성화 과정에서 Animator의 파라미터가 기본값(0)으로 리셋됨

CLAUDE가 처음에 제시한 설명과 살짝 다른 이유였다.

문제의 해답은 2015년 글인 [Unity Discussions](https://discussions.unity.com/t/reset-animator-usage-with-pooled-object/563296) 중 Unity 관리자의 답변에서 찾을 수 있었다.

::: info
```
GameObject가 비활성화될 때마다 그 Animator가 소유한 리소스는 해제되며, 이를 복원할 API는 현재 존재하지 않는다.
```
:::

값 초기화를 `SetSource()`로 옮긴 것이 실제로는 비활성화로 날아간 값을, 재활성화 이후 다시 채워넣는 방식이었기에 문제가 해결된 것이었다.

## 회고

덕분에 Animator 파라미터는 게임 오브젝트가 비활성화될 때, 초기화 된다는 사실을 알게 되었다.

처음에 Pool을 만들고 나서 아무 생각없이 게임 오브젝트를 비활성화 하였다.

이제는 비활성화 시 상태를 유지하는가를 의심하면서 설계해야 한다는 것을 배웠다.