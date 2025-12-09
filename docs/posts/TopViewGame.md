---
title:  "TopView Game"
description: 골드메탈 형님
outline: deep
excerpt: "탑뷰 요약"
category: Unity
---

- 프로젝트 명: Monster Hunter
- 개발 기간: 2023 학년도 2학기 기말 프로젝트 (약 3주)

# 게임 조작
- WASD로 캐릭터를 이동한다.
- 마우스 커서로 조준 및 사격한다.
- 왼쪽 Shift로 구르기
- Space Bar로 점프할 수 있다.

# 목표
- 필드에는 일정 주기마다 몬스터가 등장하고, 이를 처치하여 전리품을 얻는다.
- 각 구간에 배치된 임무를 달성하며 진행하다가, 마지막에 등장하는 보스 몬스터를 격파하면 게임 클리어
- 플레이어 체력이 모두 소진되면 패배

# UI

![UI](/images/TopView/UI.PNG)

- 좌측 상단에는 몬스터 Kill Counter가 표시된다.
- 중앙 하단에는 캐릭터 관련 정보를 담고있다.
- 우측 상단에는 임무(Mission)와 나가기 버튼을 위치했다.

# 무기 시스템

![Hammer](/images/TopView/Hammer.PNG)

- 장탄 수에 영향을 받지 않는 근접무기이다.

![Gun](/images/TopView/Gun.PNG)

- 원거리 공격이 가능한 무기이다. 총알을 소모하므로 적을 해치우고 전리품을 통해 보급해야 한다.

# 원거리 무기 코드

```csharp
/// <summary>
/// 남은 총알(_remainedAmmo)을 기반으로 현재 총알(_curAmmo)을 보충하고,
/// 보충 후 남은 총알 수를 플레이어 객체에 설정합니다.
/// </summary>
private void ReloadOut()
{
    int insertAmmo = MaxAmmo - _curAmmo; // 장전할 수 있는 최대 총알 수

    if (_remainedAmmo <= insertAmmo)
    {
        // 남은 총알이 장전 가능한 수량 이하인 경우
        _curAmmo += _remainedAmmo;
        _remainedAmmo = 0;
        _player.SetRemainedBullet(0);
    }
    else
    {
        // 남은 총알이 장전 가능한 수량보다 많은 경우
        _curAmmo += insertAmmo;
        _player.SetRemainedBullet(_remainedAmmo - insertAmmo);
    }

    // 재장전이 완료되었음을 플레이어에게 알립니다.
    _player.SetIsReload(false);
}
```

- 최대 총알 수는 30발이다.

```csharp
/// <summary>
/// 현재 남은 총알(_curAmmo)이 있을 경우 발사 이펙트(사운드 및 탄환/탄피 오브젝트)를 재생하고,
/// 탄환을 풀링하여 앞으로 발사하며, 탄피를 풀링하여 랜덤 힘을 가해 튕겨내게 합니다.
/// 남은 총알이 없을 경우 빈 사운드(emptySource)를 재생하고 리턴합니다.
/// </summary>
private void Shot()
{
    if (_curAmmo > 0)
    {
        // 총알이 남아 있을 때 발사 소리를 재생하고 탄환 수를 감소시킵니다.
        audioSource.PlayOneShot(fireSource);
        _curAmmo--;
    }
    else
    {
        // 총알이 없을 때 빈 소리를 재생하고 발사 함수를 종료합니다.
        audioSource.PlayOneShot(emptySource);
        return;
    }

    // 풀에서 탄환 오브젝트를 가져와서 위치와 속도를 설정한 뒤 활성화합니다.
    _instantBullet = GetBulletPoolObject();
    _bulletRigidbody = _instantBullet.GetComponent<Rigidbody>();
    _instantBullet.transform.position = bulletPivot.position;
    _bulletRigidbody.velocity = bulletPivot.forward * 50f;
    _instantBullet.SetActive(true);

    // 풀에서 탄피 오브젝트를 가져와서 위치를 설정한 뒤 활성화합니다.
    _instantBulletCase = GetBulletCasePooledObject();
    _bulletCaseRigid = _instantBulletCase.GetComponent<Rigidbody>();
    Vector3 caseVector = bulletCasePivot.forward * Random.Range(-3f, -1f) + Vector3.up * Random.Range(2f, 3f);
    _instantBulletCase.transform.position = bulletCasePivot.position;
    _instantBulletCase.SetActive(true);

    // 탄피에 랜덤한 힘과 회전을 적용하여 자연스럽게 튕기게 만듭니다.
    _bulletCaseRigid.AddForce(caseVector, ForceMode.Impulse);
    _bulletCaseRigid.AddTorque(Vector3.up * 10, ForceMode.Impulse);
}
```
- 총알을 생성하고 Rigidbody를 통해 앞으로 발사한다.

# 근거리 무기 코드

```csharp
/// <summary>
/// 플레이어의 공격 입력이 들어왔을 때 호출됩니다.
/// 지상 공격, 공중 공격, 구르기 공격 우선순위에 따라 해당 공격 코루틴을 시작합니다.
/// </summary>
public override void Use()
{
    // 공격 애니메이션 트리거 발동
    _player.GetComponentInChildren<Animator>().SetTrigger("doSwing");

    // 공중에 있을 때 공중 공격이 가능하다면 AirAttack 시작
    if (!_player.GetIsGrounded() && !_isAirAttack)
    {
        StartCoroutine("AirAttack");
        return;
    }
    // 구르기 중일 때 구르기 공격이 가능하다면 RollingAttack 시작
    if (_player.GetIsRolling() && !_isRollingAttack)
    {
        StartCoroutine("RollingAttack");
        return;
    }
    // 그 외에는 기본 지상 공격 시작
    StartCoroutine("Attack");
}
```

콤보 공격을 위해 분기를 정하였다.
1. 공중에 있을 때, 공중 공격
2. 구르기 중일 때, 구르기 공격
3. 그 외 지상에서의 일반 공격

```csharp
/// <summary>
/// 기본 지상 공격을 수행하는 코루틴입니다.
/// 약간의 준비 시간 후 히트박스와 베기 이펙트를 활성화하고 일정 시간이 지나면 비활성화합니다.
/// </summary>
/// <returns>IEnumerator</returns>
IEnumerator Attack()
{
    // 이전 흔적 제거
    trailRenderer.Clear();

    // 공격 준비 지연 (0.2초)
    yield return new WaitForSeconds(0.2f);

    // 공격 소리 재생 및 히트박스, 베기 이펙트 활성화
    swingSource.Play();
    hitBox.enabled = true;
    trailRenderer.enabled = true;

    // 공격 애니메이션 지속 시간 (0.4초)
    yield return new WaitForSeconds(0.4f);

    // 히트박스와 이펙트 비활성화
    hitBox.enabled = false;
    trailRenderer.enabled = false;
}
```

- 기본 지상 공격 시 플레이어의 히트 박스를 활성화하여 타격한다.
- 애니메이션 종료 후 히트 박스를 비활성화 한다.

```csharp
/// <summary>
/// 공중에서 공격을 수행하는 코루틴입니다.
/// 준비 시간 후 베기 이펙트를 활성화하고 플레이어를 한 바퀴 회전시킨 뒤, 히트박스를 비활성화합니다.
/// </summary>
/// <returns>IEnumerator</returns>
IEnumerator AirAttack()
{
    _isAirAttack = true;
    trailRenderer.Clear();

    // 공격 준비 지연 (0.2초)
    yield return new WaitForSeconds(0.2f);

    // 공격 소리 재생 및 히트박스, 베기 이펙트 활성화
    swingSource.Play();
    hitBox.enabled = true;
    trailRenderer.enabled = true;

    // 공중 회전 중 애니메이션 구현
    float totalRotation = 0f;
    float rotationSpeed = 360 * 2f; // 초당 720도 회전
    while (totalRotation < 360f)
    {
        float rotationAmount = rotationSpeed * Time.deltaTime;
        _player.transform.Rotate(Vector3.right * rotationAmount);
        totalRotation += rotationAmount;
        yield return null;
    }
    // 회전 완료 후 원래 방향으로 복귀
    _player.transform.rotation = Quaternion.Euler(0, 0, 0);
    trailRenderer.Clear();

    // 공격 애니메이션 지속 시간 (0.4초)
    yield return new WaitForSeconds(0.4f);

    // 히트박스와 이펙트 비활성화
    hitBox.enabled = false;
    trailRenderer.enabled = false;
    _isAirAttack = false;
}
```

- 공중에서 Pitch 축으로 회전하는 공격 애니메이션을 구현했다.

```csharp
/// <summary>
/// 구르기 중 공격을 수행하는 코루틴입니다.
/// 즉시 회전을 시작해 구르는 동작을 연출하고, 히트박스를 활성화한 뒤 일정 시간이 지나면 비활성화합니다.
/// </summary>
/// <returns>IEnumerator</returns>
IEnumerator RollingAttack()
{
    _isRollingAttack = true;
    trailRenderer.Clear();

    // 바로 공격 소리 재생 및 히트박스, 베기 이펙트 활성화
    yield return null;
    swingSource.Play();
    hitBox.enabled = true;
    trailRenderer.enabled = true;

    // 플레이어를 90도 기울이고 약간 올려주어 회전 중 구르는 느낌을 줌
    _player.transform.Rotate(Vector3.forward * 90);
    _player.transform.position += Vector3.up * 0.1f;

    // 구르며 한 바퀴 회전
    float totalRotation = 0f;
    float rotationSpeed = 360f * 2; // 초당 720도 회전
    while (totalRotation < 360f)
    {
        float rotationAmount = rotationSpeed * Time.deltaTime;
        _player.transform.Rotate(Vector3.right * rotationAmount);
        totalRotation += rotationAmount;
        yield return null;
    }
    // 회전 완료 후 원래 방향으로 복귀
    _player.transform.rotation = Quaternion.Euler(0, 0, 0);
    trailRenderer.Clear();

    // 공격 애니메이션 지속 시간 (0.4초)
    yield return new WaitForSeconds(0.4f);

    // 히트박스와 이펙트 비활성화
    hitBox.enabled = false;
    trailRenderer.enabled = false;
    _isRollingAttack = false;
}
```

- 구르기 중 플레이어가 Yaw 축으로 회전하는 공격 애니메이션을 구현했다.

# 게임 매니저

```csharp
private void Update()
{
    UpdateAmmo();
    UpdateCoin();
    UpdateHp();
    UpdateBossHp();
    UpdateMonsterCount();
    if (isBossDied && !isEnd)
    {
        GameClear();
        isEnd = true;
    }
}
```

- GameManager는 매 프레임마다 UI 정보를 갱신한다.

# Class Diagram

![ClassDiagram](/images/TopView/TopviewClassDiagram.png)

<iframe width="1378" height="775" src="https://www.youtube.com/embed/M5NMd_ieZOM" title="Top View 게임 플레이 영상" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

프로젝트는 [여기][TopView-gh] 에서 확인할 수 있습니다.

[TopView-gh]: https://github.com/To-steak/MonsterHunter
