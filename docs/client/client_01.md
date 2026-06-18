# project_01: 확장 가능한 무기 아키텍처

GitHub Repository [![GitHub](https://img.shields.io/badge/GitHub-project__01-black?logo=github)](https://github.com/To-steak/project_01)

project_01을 제작하면서 캐릭터의 무기를 구현했다.

- Melee (근접 무기)
- Ranged (원거리 무기)
- Throw (투척 무기)

현재는 세 개의 무기 종류만 갖고 있지만 앞으로 다른 형태의 무기(예: Magic Staff)가 기획되어도 쉽게 추가할 수 있다.

더 나아가 플레이어 캐릭터뿐만 아니라 적 몬스터들도 해당 코드를 재사용할 수 있도록 하려고 한다.

현재는 무기 코드에 플레이어 전용 관심사가 섞여있어 재사용하기 힘들다.

## 문제

현재 플레이어 코드는 `PlayerController`가 여러 상태(Move, Idle, Shot 등)와 기반 컴포넌트(Health, Movements, Weapon 등)을 갖고 있다.

![playerController](/images/playerController.svg)

`PlayerWeapon` 클래스는 무기와 공격에 관한 기능을 맡고 있다.

그 중 각 공격 상태(Shot, Swing, Throw)로 넘어가기 위해 현재 무기가 어떤 상태인지 반환하는 함수가 있다.

`PlayerController`가 가진 `PlayerState`를 반환하는 함수이다.

::: details code
```C#
public class PlayerWeapons : MonoBehaviour
{
    private WeaponInstance[] instances;
    // ...
    public PlayerState GetAttackState(PlayerController controller)
    {
        return instances[_currentWeaponIndex].GetAttackState(controller);
    }
}
```
:::


덕분에 각 상태에서는 반환받은 상태로 전환만 하면된다.

::: details code
```C#
public class PlayerIdleState : PlayerState
{
    // ...
    public override void Tick()
    {
        // ...
        bool attack = Inputs.Attack;
        if (attack)
        {
            var state = Weapons.GetAttackState(_controller);
            _controller.ChangeState(state);
            return;
        }
    }
}
```
:::

하지만 이 `PlayerWeapons`를 Enemy에게 이식하려면 `PlayerState`, `PlayerController`의 강한 결합을 끊어야 한다.

## 난이도

먼저 현재 구조를 설명하면 다음과 같다.

`WeaponInstance`는 Scriptable Object에서 정해진 초기 값(예: Prefab, 총알 수)을 Instantiate 하여 런타임에서 사용하기 위한 객체이다.

::: details code
```C#
public abstract class WeaponInstance
{
    public GameObject WeaponPrefab { get; private set; }
    public abstract float AttackSpeed { get; }

    protected WeaponInstance(GameObject weaponPrefab)
    {
        WeaponPrefab = weaponPrefab;
    }

    public abstract bool Attack(Vector3 targetPosition);
    public virtual bool TryReload() => false;
    public virtual void Reload() { }
}
```
:::

`WeaponSO`는 게임에서 사용할 초기 정보를 담아둔 Scriptable Object이다.

::: details code
```C#
public abstract class WeaponSO : ScriptableObject
{
    public GameObject WeaponPrefab;
    public float AttackSpeed;

    public abstract WeaponInstance Initialize(Transform hand);
}

public abstract class WeaponSO<T> : WeaponSO where T : WeaponInstance
{
    public override WeaponInstance Initialize(Transform hand) => DerivedInitialize(hand);
    public abstract T DerivedInitialize(Transform hand);
}
```
:::

비-제네릭 `WeaponSO`는 `PlayerWeapons`에서 사용하며 인스펙터 할당으로 초기화가 이루어진다.

제네릭 `WeaponSO`는 `WeaponInstance`를 런타임에서 `new` 하고 사용할 정보를 주입한다.

::: info
Unity의 Inspector는 직렬화 가능한(Serializable) 데이터만 보여준다.  
Unity 입장에서는 Generic은 컴파일 시점에 `<T>`가 확정되지 않아서 인스펙터 할당이 불가능하다.  
따라서 Generic 추상 클래스는 중간 계층으로만 쓰고,   
실제 인스펙터 노출은 `<T>`가 확정된 구체 클래스(FirearmsSO 등)에서 한다.
:::

아래처럼 무기를 만들 수 있다.

다른 형태의 무기가 추가되더라도 `WeaponInstance` 구현 클래스와 `WeaponSO<T>` 구현 클래스만 있다면

수 십개의 무기 확장도 어렵지 않으며 `PlayerWeapons`에서 수정없이 무기 공격 호출이 가능하다.

::: details code
```C#
public class FirearmsSO : WeaponSO<FirearmsInstance>
{
    public GameObject BulletPrefab;
    public int MaxAmmo;
    public int ReserveAmmo;

    public override FirearmsInstance DerivedInitialize(Transform hand)
    {
        GameObject weapon = null;
        Muzzle muzzle = null;

        if (WeaponPrefab != null)
        {
            weapon = Instantiate(WeaponPrefab, hand);
            weapon.transform.localPosition = Vector3.zero;
            weapon.transform.localRotation = Quaternion.identity;
            weapon.SetActive(false);

            muzzle = weapon.GetComponentInChildren<Muzzle>();
        }

        FirearmsInstance.Config config = new FirearmsInstance.Config()
        {
            WeaponPrefab = weapon,
            BulletPrefab = BulletPrefab,
            Muzzle = muzzle,
            MaxAmmo = MaxAmmo,
            ReserveAmmo = ReserveAmmo,
            AttackSpeed = AttackSpeed
        };
        
        FirearmsInstance instance = new FirearmsInstance(config);
        return instance;
    }
}
```
:::

이제 문제를 정의해보자

- `Enemy`와 `Player`는 가진 상태가 서로 다르다.
- `Enemy`는 고유한 공격(무기)를 갖지만 `Player`는 3개의 무기를 모두 사용한다.
- 무작정 결합을 끊기 위해 `Controller` 시그니처를 삭제하면 반환 타입을 따로 정의해야 한다.
- 따라서 `Enemy`와 `Player`가 공통으로 갖는 상태를 정의해야 한다.
- 패턴 매칭을 쓰지 않기 위해 만든 함수의 목적을 지켜야 한다.
- `WeaponInstance`와 SO는 서로가 공유해야 한다. (같은 무기 종류를 양쪽이 쓰기 때문에)

위 조건들을 만족하며 구조를 개선해야 한다.

## 해결

문제를 해결하기 위한 해답은 여러 가지가 있었다.

#### 1. controller 시그니처 제거

제일 첫 번째로 생각한 건 역시 가장 문제가 되는 시그니처 제거였다.

`GetAttackState()`는 런타임 참조 반환 메서드이다.

`PlayerController`가 가진 `PlayerState`를 반환하는 것이 목적인데, 시그니처가 사라지면, 반환할 `PlayerState` 참조도 불가능하다.

그렇게 되면 `enum`을 만들어 행위를 반환하고 호출자가 패턴 매칭을 통해 다음 상태로 넘겨야 한다.

::: details code
```C#
public abstract class WeaponInstance
{
    public enum WeaponType
    {
        Melee,
        Ranged,
        Throw
    }
    // ...
    public abstract WeaponType GetAttackState();
}
```
:::

::: details code
```C#
public class MeleeInstance : WeaponInstance
{
    // ...
    public override WeaponType GetAttackState()
    {
        return WeaponType.Melee;
    }
}
```
:::

::: details code
```C#
public class PlayerIdleState : PlayerState
{
    // ...
    public override void Tick()
    {
        // ...
        bool attack = Inputs.Attack;
        if (attack)
        {
            WeaponType type = Weapons.GetAttackState();
            PlayerState state = type switch
            {
                WeaponType.Melee  => _controller.Swing,
                WeaponType.Ranged => _controller.Shot,
                WeaponType.Throw  => _controller.Throw,
                _ => throw new System.NotImplementedException()
            };
            _controller.ChangeState(state);
            return;
        }
    }
}
```
:::

장점
- `PlayerController`의 강한 결합을 끊어낼 수 있다.   

단점
- 패턴 매칭을 통해 상태를 전환해야 하므로 무기 종류가 많아지거나 상태가 많아지면 관리하기 힘들어진다.

#### 2. Controller 추상화 하기

시그니처의 완전한 제거는 포기하고 추상화하는 쪽으로 시선을 돌렸다.

`IController`와 `IState`를 만들어서 `Enemy`와 `Player`가 공통으로 갖는 상태를 담아두고, `IState`를 반환하는 것으로 했다.

::: details code
```C#
public interface IController
{
    IState GetAttackState();
}
```
:::

::: details code
```C#
public abstract class WeaponInstance
{
    // ...
    public abstract IState GetAttackState(IController controller);
}
```
:::

::: details code
```C#
public class MeleeInstance : WeaponInstance
{
    // ...
    public override IState GetAttackState(IController controller)
    {
        return (controller as PlayerController)?.Swing;
    }
}
```
:::

::: details code
```C#
public class PlayerController : MonoBehaviour, IController
{
    public PlayerSwingState Swing { get; private set; }
    public PlayerShotState Shot { get; private set; }
    // ...
    public IState GetAttackState() => Weapons.GetAttackState(this);
}
```
:::

장점
- `Enemy` 이식이라는 최초 목표를 달성한다.

단점
- 각 무기 구현체에서 `Controller` 캐스팅이 발생한다.
- 인터페이스로 추상화 한 의미가 없어져 버린다.

#### 3. 상속 계층을 확장

서로가 다른 `Instance`를 사용하도록 계층을 세분화하는 방법을 떠올렸다.

현재 상속 구조는 다음과 같다.

`WeaponSO : ScriptableObject` > `WeaponSO<T> : WeaponSO where T : WeaponInstance` > `FirearmsSO : WeaponSO<FirearmsInstance>`

여기에 `Player`와 `Enemy`의 `Instance` 계층을 추가하는 것이다.

::: details code
```C#
public abstract class WeaponInstance
{
    public abstract bool Attack(Vector3 targetPosition);
    public virtual bool TryReload() => false;
    public virtual void Reload() { }
}
```
:::

::: details code
```C#
public abstract class PlayerWeaponInstance : WeaponInstance
{
    public abstract PlayerState GetAttackState(PlayerController controller);
}
```
:::

::: details code
```C#
public class FirearmsInstance : PlayerWeaponInstance
{
    public override bool Attack(Vector3 targetPosition) { /* 발사 */ }
    public override PlayerState GetAttackState(PlayerController controller)
        => controller.Shot;
}
```
:::

장점
- 캐스팅 없이 타입이 명확하다. 단일 책임이 계층에 드러난다.

단점
- Player/Enemy가 같은 무기 종류를 공유할 때 SO 계층도 분리해야 한다.
- SO 계층에서 상속의 깊이가 깊어진다.
- `PlayerWeaponInstance`의 코드 컨벤션을 맞추려면 `EnemyWeaponInstance`도 있어야 한다.

#### 4. 인터페이스 합성

이때부터는 구조가 잘못되었다고 생각했다.

`GetAttackState()`는 무기에 따른 상태 반환 메서드이다.

`WeaponInstance`에 위치한 것이 단일 책임 원칙을 위배했다고 생각했다.

`PlayerWeapons`로 옮기면서 각 무기가 상태를 알아야 했기 때문에 `IPlayerWeapon`을 만들었다.

::: details code
```C#
public interface IPlayerWeapon
{
    PlayerState GetAttackState(PlayerController controller);
}
```
:::

::: details code
```C#
public class MeleeInstance : WeaponInstance, IPlayerWeapon
{
    // ...
    public PlayerState GetAttackState(PlayerController controller)
    {
        return controller.Swing;
    }
}
```
:::

::: details code
```C#
public class PlayerWeapons : MonoBehaviour, IPlayerWeapon
{
    // ...
    public PlayerState GetAttackState(PlayerController controller)
    {
        return (instances[_currentWeaponIndex] as IPlayerWeapon).GetAttackState(controller);
    }
}
```
:::

장점
- 거의 수정하지 않고 `Enemy`에게 이식할 수 있게 되었다.

단점
- `WeaponInstance` 구현체가 `IPlayerWeapon`을 구현하기 때문에, `Enemy`는 호출하지 않는 `GetAttackState()`를 갖고 있다.
- `PlayerWeapons` 내부에서 캐스팅이 발생한다.
- `Enemy`가 무기를 여럿 갖게 된다면 별도의 `GetAttackState()` 체계가 필요하다.

## 결과

네 번째 방법인 인터페이스 합성을 선택했다. 이유는 다음과 같다.

SO와 Instance의 코드를 거의 수정하지 않고 `Enemy`에 이식할 수 있게 되었다.

캐스팅이 `WeaponInstance`에서 `PlayerWeapons`로 올라와 외부에서 한 번만 진행한다.

`WeaponInstance`는 캐스팅을 피하기 위해 `virtual` 함수로 근접 무기는 쓰지 않는 장전 매서드를 갖고 있다.

같은 이유로 `Enemy`는 한 개의 무기를 갖지만 `Player`를 위해 `GetAttackState()`를 갖는 것이 현재 구조의 코드 컨벤션에 알맞는 형태라고 생각했다.

이로써 패턴 매칭 없이 무기가 자신의 공격 상태를 결정하며 `Player`와 `Enemy` 모두 사용 가능한 목적도 달성하게 된다.

::: details code
```C#
public class EnemyWeapon : MonoBehaviour
{
    [SerializeField] private WeaponSO weapon;

    private WeaponInstance instance;

    public void Initialize()
    {
        instance = weapon.Initialize(hand: null);

    }

    public bool TryAttack(Vector3 targetPosition = default)
    {
        return instance.Attack(targetPosition);
    }
}
```
:::

::: details code
```C#
public class EnemyAttackState : EnemyState
{
    // ...
    public override void Enter()
    {
        Animations.PlayAttack();
        Weapon.TryAttack();
    }
}
```
:::

## 회고

선택한 방법이 현재의 프로젝트에는 최선의 방법이라고 생각한다.

공격 상태를 반환하는 런타임 메서드가 `WeaponInstance`에 있어서 문제를 해결하는데 까다로웠다.

게다가 Scriptable Object와 결합되어 있어 세 번째 방법을 생각했을 때는 내가 처음부터 구조를 잘못 설계했나 싶었다.

Scriptable Object에서는 캐스팅을 하고 싶지 않아서 제네릭으로 구현했다.

하지만 캐스팅을 완전히 피하는 것보다 위치와 횟수를 최소화하는 것이 현실적인 해답임을 배웠다.

처음 설계 단계에서 확장 대상을 미리 고려했다면 `WeaponInstance`에 `Player` 전용 관심사가 섞이지 않았을 것이다.

현재는 `Player` 관심사가 `WeaponInstance`에서 구현체로 옮겨갔을 뿐, 무기가 상태를 알아야 하는 한계가 있다.

`Player`를 기준에 두고 작성한 탓에 무기 프리팹을 손에 부착할 필요가 없는 `Enemy`의 경우 `null`을 전달해야 한다.

이 2가지 부분은 향후 개선이 필요하다.
1. 무기가 `Player`의 관심사를 알고 있다.
2. 무기가 필요 없는 `Enemy`의 경우 `null`을 전달한다.

GitHub Repository [![GitHub](https://img.shields.io/badge/GitHub-project__01-black?logo=github)](https://github.com/To-steak/project_01)