# Assembly Definition

GitHub Repository [![GitHub](https://img.shields.io/badge/GitHub-project__01-black?logo=github)](https://github.com/To-steak/project_01)

project 01을 제작하면서 코드의 양이 많아졌다.

범주로 나타내면 다음과 같다.

- Animations: 애니메이션 이벤트 인터페이스 및 SMB
- Enemy: 적과 관련된 기능
- Player: 플레이어와 관련된 기능
- Interface: 범용적으로 사용하는 인터페이스 코드
- Scriptable Objects: 스크립터블 오브젝트 `.asset` 모음
- Weapon: 적과 플레이어가 사용하는 무기와 관련된 코드
- Manager: 게임의 진행을 맡는 관리자 코드

## 문제

어셈블리 정의 없이는 코드를 작성하면 Unity의 `Csharp-Assembly.dll`에 모두 보관된다.

그렇기 때문에 `Player`관련 코드를 수정해도 `Enemy`관련 코드도 함께 재컴파일된다.

그렇기 때문에 개발을 함에 따라 코드가 많아지면서 컴파일 시간도 함께 길어졌다.

`.dll`을 범주에 맞게 구분하여 개발하면 해당 범주의 코드만 컴파일 하기 때문에 컴파일 시간을 줄일 수 있다.

## 난이도

Scripts 폴더에 하위 폴더를 만들 때, 무작정 만들어두고 개발한 탓에 추가적인 정리 작업이 필요했다.

불행 중 다행히 하위 컴포넌트(`PlayerHealth`, `PlayerMovements` 등)을 `PlayerController`가 갖고 있는 형태로 개발한 덕분에 참조 방향을 구분하는 데는 큰 어려움이 없었다.

지난 글([확장 가능한 무기 아키텍처](/client/client_01))에서 남은 문제인 "무기가 `Player`의 관심사를 알고 있다."가 발목을 잡았다.

범용 코드인 `IPlayerWeapon`을 만들어서 무기의 상태를 반환하도록 하였다.

::: details code
```C#
public interface IPlayerWeapon
{
    PlayerState GetAttackState(PlayerController controller);
}
```
:::

이 코드의 문제점은 범용 코드가 `Player`를 알고 있어야 한다는 제약이 있다.

이때 문제가 발생하게 되는데,

1. Player -> Weapon: `IPlayerWeapon`을 사용해야 한다.
2. Weapon -> Player: `GetAttackState` 시그니처의 `PlayerController`, `PlayerState`를 알아야 한다.

이렇게 순환 참조에 빠져버리게 된다.

## 해결

`IPlayerWeapon` 문제를 해결하기 위해 프로젝트와 타협하기로 정했다.

과거 `switch-case`를 사용하면 다양한 무기 확장에 어려움을 줄 것이라 생각해 배제했었다.

이젠 게임에는 '근접', '원거리', '투척' 3종류만 존재한다고 정하고 `PlayerWeapon`에서 `switch-case`를 사용하고 멤버 변수에 `PlayerState`를 캐싱하도록 정했다.

결과적으로 `IPlayerWeapon`을 삭제할 수 있게 되었다.

이 순환 참조의 근본 원인을 없애고 나서야, 비로소 어셈블리를 계층 구조로 나눌 수 있는 조건이 만들어졌다.

그 후 사용하는 코드의 범주를 정해두고 어셈블리 정의를 생성했다.

수정 전

::: info
- Animations: 애니메이션 이벤트 인터페이스 및 SMB
- Enemy: 적과 관련된 기능
- Player: 플레이어와 관련된 기능
- Interface: 범용적으로 사용하는 인터페이스 코드
- Scriptable Objects: 스크립터블 오브젝트 `.asset` 모음
- Weapon: 적과 플레이어가 사용하는 무기와 관련된 코드
- Manager: 게임의 진행을 맡는 관리자 코드
:::

수정 후

::: info
- Enemy: 적과 관련된 기능을 하는 코드
- Player: 플레이어와 관련된 기능을 하는 코드
- Weapon: 적과 플레이어가 사용하는 무기와 관련된 코드
- Manager: 게임의 진행을 맡는 관리자 코드
- Interface: 범용적으로 사용하는 공용 코드
:::
Scriptable Objects 폴더는 Scripts 폴더 밖으로 빼버렸다.

Animations 폴더의 내용물을 모두 Interface로 옮겼다.

참조 방향을 그림으로 나타내면 다음과 같다.

![Assembly-Definition-Ref](/images/Assembly-Definition-Ref.svg)

## 결과

`Weapon`이 더 이상 `Player`의 관심사를 알지 않아도 된다.

설계 결함을 사람이 아닌 컴파일러가 잡아주는 안전장치를 얻었다.

컴파일 시간이 체감상 1초 정도 빨라진 것 같다.

## 회고

기획이 정말 중요하다는 사실을 다시 깨닫게 된다.

코드에 정답이 없다고 생각하고 또 그렇게 배워왔는데 "기획에 따라 코드의 정답이 정해져 있는게 아닐까?" 하는 의문이 들었다.

처음부터 게임 기획을 확실히 정하고 개발했다면 `IPlayerWeapon` 같은 문제가 발생하지 않았을 것 같다.

`switch-case`도 사용하지 않으면서 `Enemy`, `Player`가 함께 사용하고 다운 캐스팅을 하지 않는 꿈같은 코드는 없었다.

아마 오버 엔지니어링에 너무 집착한 게 아닐까 하는 부끄러움이 든다.

다음부터는 기획에서 확실하게 확정한 뒤 그에 맞는 구조로 개발하는 순서를 가져야겠다.