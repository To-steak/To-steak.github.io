# Netcode for GameObjects 멀티플레이 구조

이전 project_01에 이어서 [project_02](https://github.com/To-steak/project_02) 개발을 시작했다.

project_01은 싱글플레이 게임이지만 이번 프로젝트인 project_02는 Unity Relay 서비스를 사용하지 않고 headless Dedicated Server를 통한 멀티플레이 게임을 목적으로 개발한다.

그 과정에서 일어난 일들을 다룬다.

## 문제

project_01의 상태 패턴을 그대로 가져왔다.

::: info 상태 패턴이란?
상태 패턴(state pattern)은 객체 지향 방식으로 상태 기계를 구현하는 행위 소프트웨어 디자인 패턴이다.

상태 패턴을 이용하면 상태 패턴 인터페이스의 파생 클래스로서 각각의 상태를 구현함으로써, 또 패턴의 슈퍼클래스에 의해 정의되는 메소드를 호출하여 상태 변화를 구현함으로써 상태 기계를 구현한다.

(출처: [위키백과](https://ko.wikipedia.org/wiki/%EC%83%81%ED%83%9C_%ED%8C%A8%ED%84%B4))
:::

캐릭터의 여러 상태들(IDLE, MOVE 등)을 `if-else` 분기 없이 객체로 표현해서 편하게 관리하기 위함이다.

멀티플레이 게임을 만드는 데에 여러 프레임워크들이 있는데, Unity에서는 대표적으로 Mirror와 Photon이 있다.

Project_02는 Netcode for GameObjects(이하 NGO)를 사용해서 멀티플레이 게임을 구축하려고 한다.

::: info Netcode for GameObjects란?
Netcode for GameObjects is a high-level networking library built for Unity for you to abstract networking logic.

You can send GameObjects and world data across a networking session to many players at once.

With Netcode for GameObjects, you can focus on building your game instead of low-level protocols and networking frameworks.

(출처: [Unity DOCS](https://docs.unity3d.com/Packages/com.unity.netcode.gameobjects@2.13/manual/index.html))
:::

한마디로 요약하면 <span style="color: #FF6666;">멀티플레이 게임 개발을 쉽게 하도록 도와주는 고수준 API 패키지이다.</span>

이미 완성된 project_01 아키텍처에 멀티플레이 API만 얹으면 되는 간단한 작업일 것이라 예상했다.

하지만...

## 난이도

개발하기 앞서 <span style="color: #66FF66">권한(Authority)</span>에 대해 이해할 필요가 있었다.

Unity DOCS에서 설명하는 개념은 다음과 같다.

::: info 권한이란?
Multiplayer games are games that are played between many different game instances.

Each game instance has their own copy of the game world and behaviors within that game world.

To have a shared game experience, each part of the game simulation is required to have an authority. 

The authority runs the game simulation, takes actions on the game world, and synchronizes the simulation to all other connected clients. 

When clients who are not the authority (non-authority clients) want to interact or change the world, they must communicate with the authority and request the authority to make changes on their behalf.

(출처: [Unity DOCS](https://docs.unity3d.com/Packages/com.unity.netcode.gameobjects@2.13/manual/terms-concepts/authority.html))
:::

게임 세계에는 클라이언트의 행위에 대한 결과를 반영하는 <span style="color: #66FF66">권한</span>을 가진 인스턴스가 있다.

예를 들어 <span style="color: #FFFF66">플레이어 A</span>가 어떤 행동을 했을 때, 

싱글플레이 게임이라면 그 결과(애니메이션 등)를 바로 반영하면 됐지만

멀티플레이 게임은 <span style="color: #66FF66">권한</span>을 가진 <span style="color: #FFB266">플레이어 B</span>에게 요청 후 결과를 받아 반영한다.

기존의 project_01의 플레이어 상태 코드는 행동(Logic) 후 바로 결과(View)를 반영한다.

::: details 코드를 보려면 클릭하세요
```C#
public class PlayerIdleState : PlayerState
{
    public PlayerIdleState(PlayerController playerController) : base(playerController) { }

    // IDLE 상태 진입 후 즉시 이동 및 애니메이션 재생
    public override void Enter()
    {
        Movements.SetDirection(Vector3.zero);
        Animations.PlayIdle();
    }

    // 이하 생략
}
```
:::

그래서 행동(Logic)과 결과(View)를 분리하고 그 사이에 <span style="color: #66FF66">권한</span>있는 서버가 개입해야 했다.

Unity 공식의 [Boss Room](https://github.com/Unity-Technologies/com.unity.multiplayer.samples.coop)을 참고하여 구조 설계를 했다.

## 해결

먼저 클라이언트에서 하는 일과 서버에서 하는 일로 분리하였다.

클라이언트는 '입력을 받고 요청을 보내는 일', 서버는 '현재 상태의 행동을 수행하는 일'로 나누었다.

`PlayerController` 혼자 도맡아 하던 일을 `PlayerClient`와 `PlayerServer`로 나누었다.

플레이어 상태에 따른 행동(Logic)은 `PlayerServer`에서 진행하고, 사용자 입력에 따른 <span style="color: #66FF66">권한</span>서버에 요청은 `PlayerClient`가 맡았다.

::: details 코드를 보려면 클릭하세요.
```C#
using Unity.Netcode;
using UnityEngine;

public class PlayerController : NetworkBehaviour
{
    // 중략

    public override void OnNetworkSpawn()
    {
        Inputs.Initialize();
        Animations.Initialize();
        Locomotions.Initialize();
    }

    // OnNetworkSpawn() 이후에 실행됨을 보장
    protected override void OnNetworkPostSpawn()
    {
        Server.enabled = IsServer;
        Client.enabled = IsClient;
    }
}
```
:::

::: details 코드를 보려면 클릭하세요.
```C#
using Unity.Netcode;
using UnityEngine;

public class PlayerServer : NetworkBehaviour
{
    PlayerController _controller;
    PlayerState _state;

    void Awake()
    {
        _controller = GetComponent<PlayerController>();
    }

    public override void OnNetworkSpawn()
    {
        if (IsServer)
        {
            _state = _controller.Idle;
        }
    }

    void FixedUpdate()
    {
        // 상태 Tick 연산
        _state?.Tick();
        // 물리 연산
        _controller.Locomotions.CheckGrounded(_controller.SettingSO.GroundCheckRadius, _controller.SettingSO.GroundLayer);
        _controller.Locomotions.ApplyGravity(_controller.SettingSO.GravityValue);
        _controller.Locomotions.Move(_controller.Inputs.Move, _state.MoveSpeed);
    }

    public void ChangeState(PlayerState state)
    {
        _state.Exit();
        _state = state;
        _state.Enter();
        _state.PlayAnimation();
    }
}
```
:::

::: details 코드를 보려면 클릭하세요.
```C#
using Unity.Netcode;
using UnityEngine;

public class PlayerClient : NetworkBehaviour
{
    PlayerController _controller;

    void Awake()
    {
        _controller = GetComponent<PlayerController>();
    }

    public override void OnNetworkSpawn()
    {
        if (IsOwner)
        {
            // 오브젝트 활성화시 입력 활성화
            _controller.Inputs.ActiveInputs();
        }
    }

    public override void OnNetworkDespawn()
    {
        if (IsOwner)
        {
            // 오브젝트 비활성화시 입력 비활성화
            _controller.Inputs.InactiveInputs();
        }
    }

    void FixedUpdate()
    {
        if (IsOwner)
        {
            // 권한 서버에 매 번 요청을 보냄
            MoveRpc(_controller.Inputs.Move);
        }
    }

    [Rpc(SendTo.Server)]
    void MoveRpc(Vector3 move)
    {
        // 최신 입력값 갱신을 위해 서버에 RPC 요청을 보냄
        _controller.Inputs.SetMove(move);
    }
}
```
:::

`PlayerController`는 `PlayerServer`와 `PlayerClient`가 사용할 컴포넌트의 참조들을 갖는다.

`PlayerServer`는 `PlayerState`에서 이뤄지는 시뮬레이션을 `FixedUpdate()`에서 진행한다.

::: info 왜 `FixedUpdate()`에서 하나요?
The game is server-authoritative, with latency-masking animations.

Position updates are done through NetworkedVars that sync position, rotation and movement speed.

NetworkedVars and Remote Procedure Calls (RPC) endpoints are isolated in a class that is shared between the server and client specialized logic components.

All game logic runs in FixedUpdate at 30 Hz, matching our network update rate.

Code is organized into three separate assemblies: Client, Shared and Server which reference each other when appropriate.

(출처: [Boss Room](https://github.com/Unity-Technologies/ucb-boss-room-tests#exploring-the-project))
:::

Project Settings - Time - Fixed Timestep 값을 `0.0333`으로 설정하여 `Network Manager`의 Tick Rate 30 Hz 값과 통일시켰다.

::: danger `Update()`에서 진행했을때
Tick Rate 주기와 FPS가 맞지 않은 탓인지 서버에 클라이언트 혼자 있을 때 캐릭터 움직임이 버벅거리는 현상이 발생한다.

두 번째 클라이언트가 접속하면 해결되었다가도 둘 중 한 클라이언트가 접속 종료하면 다시 버벅거리는 현상이 발생했다.

`FixedUpdate()`로 옮긴 후 정상화되었다.
:::

`Network Transform` 및 `Network Animator` 컴포넌트를 플레이어 프리펩에 부착하였다.

처음에는 `NetworkVariable<>`로 진행했었는데, 직렬화 불가능한 상태 객체들 대신 열거형을 사용해서 각 객체마다 네트워크로 보낼 고유한 값을 정해두었다.

두 컴포넌트의 존재를 알고나서 `NetworkVariable<>`를 사용하지 않고 해당 컴포넌트들이 Transform 값과 Animator 파라미터를 대신 조절함을 알게 되었다.([#e6ac23a](https://github.com/To-steak/project_02/commit/e6ac23a80d30e8fd63795df50e17037f2fb68570))

::: info Network 컴포넌트
Network Animator: 서버 권한에서는 Animator의 상태와 파라미터를 결정한다.

Network Transform: 권한 있는 인스턴스에 의해 모든 비권한 인스턴스와 자동으로 동기화된다.

(출처: [Unity DOCS: Network Transform](https://docs.unity3d.com/Packages/com.unity.netcode.gameobjects@2.13/manual/components/helper/networktransform.html))

(출처: [Unity DOCS: Network Animator](https://docs.unity3d.com/Packages/com.unity.netcode.gameobjects@2.13/manual/components/helper/networkanimator.html))
:::

## 결과

전용 서버 빌드 후 2개의 클라이언트 빌드로 접속한 결과이다.

<iframe width="100%" height="400" src="https://www.youtube.com/embed/5y8YZ3YwcL4" title="project 02 멀티플레이 시연" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## 회고

단순히 API 를 얹는 것이 아니라 설계 구조를 바꿔야 한다는 점을 배울 수 있었다.

플레이어 API(Inputs, Locomotions 등)의 기능을 잘 분리한 덕분에 멀티플레이 이식에 쉬웠던 것 같다.