---
layout: single
title:  "LLM NPC를 갖춘 환경 변화 시뮬레이션 게임"
date:   2025-05-29 22:48:12 +0900
categories: [Unity, Ollama, FastAPI]
---
한림대학교 25년도 캡스톤디자인으로 3인 1조가 되어 진행하였다.

게임의 주제: 인간으로부터 숲을 지키는 Elf

개발 배경: 최근 산불로 인해 우리나라는 극심한 피해를 입었다. 따라서 사회 문제 중 하나인 환경오염을 우리의 자연인 산을 지키는 것으로 하였다. 

해당 프로젝트는 게이미피케이션의 5가지를 참고하여 반영하였다.

1. 도전: 사용자로 하여금 게임에 참여하기 위해 목표를 제시하고 목표 달성에 도전할 수 있도록 기회를 제공하는 방안으로 미션 수행, 과제 해결 등이 포함
   - 사용자에게 미션을 부여하고 도전하게 함으로써 재미와 동시에 성취감을 제시한다.
   - 미션 내용을 분명하고 뚜렷하게 설정하고, 적당한 난이도 조절을 통해 사용자로 하여금 흥미를 유발할 수 있도록 설계하는 것이 중요
2. 경쟁: 사용자들 간의 경쟁 관계를 형성하고 랭킹, 리더보드 등을 제공하여 자신과 경쟁자와의 상태를 직관적으로 비교하고 경쟁심을 유발
   - 사용자들이 랭킹 또는 리더보드를 통해 자신의 위치를 파악하고, 동기부여 및 경쟁심을 유발하여 더 높은 레벨에 도달할 수 있도록 게임을 지속
3. 성취: 주어진 미션을 성공함으로써 성취감을 제공하고, 사용자에게 게임에 지속적으로 참여할 수 있는 동기를 부여
   - 성취감과 동기부여는 긴밀하게 연결되어 있기 때문에, 사용자가 미션을 성공할 경우 성취감을 얻을 수 있고 이는 곧 지속적으로 게임에 참여하기 위한 동기부여가 됨
   - 일정한 단계를 넘어서면 그에 합당한 지위를 부여하여 사용자의 동기를 부여하는 방식으로 실시간으로 진행 상황을 보여주는 Progress Bar, 레벨, 별 모으기 등이 해당
4. 보상: 미션을 달성하면 사용자에게 일정한 보상을 주는 기법으로 게이미피케이션 마케팅에서 가장 쉽고 널리 사용되는 기법
   - 주어진 미션을 해결 또는 달성할 경우 배지(Badge), 포인트, 아이템 등을 제공하여 사용자들에게 보상을 부여하는 방식
5. 관계: 주변 인물을 게임에 초대하여 함께 참여하도록 유도하고, 게임 내의 사용자들과 유대관계를 형성하여 소통하며 게임에 몰입

게임의 종류는 3가지로
무작위로 선택되어 진행되고 시간이 지날수록 난이도는 어려워진다.

![FlowChart](/images/CapstoneDesign/Capstone_Design_Flowchart.png)

위 사진은 프로젝트의 Flow Chart이다.

1. Fast API
- AI 서버 구축에 사용되는 백엔드 프레임워크이다.
- Unity 클라이언트로부터 요청을 받아 대규모 언어 모델(LLM)을 통해 텍스트 응답을 생성한다.
- 플레이어와 NPC 간 단방향 대화 기능을 처리한다.

2. Unity
- 클라이언트 역할
- 플레이어의 상호작용을 감지하고 FastAPI 서버로 요청 전송한다.
- 서버 응답으로 받은 내용을 기반으로 식물(NPC)와의 대화 연출한다.

3. Badge 시스템
- 게임 내 특정 성취 조건을 달성하면 플레이어에게 Badge 부여한다.
- Badge 획득 내역은 서버를 통해 MySQL에 저장된다.
- FastAPI의 앤드포인트를 통해 사용자의 모든 기록과 Badge를 확인할 수 있다.

4. Score 시스템
- 게임 플레이 중 점수를 획득한다.
- 점수는 서버를 통해 MySQL에 저장되어 다른 플레이어와의 경쟁이 가능하다.

5. MySQL
- Badge 및 Score 데이터를 저장하고 관리하는 데이터베이스
- 서버와 연동되어 플레이어의 게임 성과를 지속적으로 추적 가능하다.

![ClassDiagram](/images/CapstoneDesign/ClassDiagram.png)

위 사진은 프로젝트의 Class Diagram이다.
게임 진행에 핵심이 되는 코드만 작성하였다.

1. FastAPI - Server 구조
MainRouter
- /response: Scene의 이름(role)과 피해 정도(damage)를 Json 형태로 LLM Text를 요청한다.
- /users: MySQL 데이터베이스에 접근하여 게임 종료시 받은 유저 데이터를 토대로 저장한다.
- /html: MySQL에 있는 모든 유저 데이터를 보여준다. Score에 따라 Badge를 부여하므로 Badge도 보여준다.

2. Unity – Client 구조 WebManager는 싱글톤으로 구현되어 서버와의 통신 역할을 맡으며 게임 시작시 씬이 전환되어도 사라지지 않는다. SystemManager는 게임의 전체 상태를 관리한다.(점수, 난이도, 게임 종료 처리 등) 전역 접근 가능한 싱글톤 Instance를 제공하여 각 Scene('화재 진압', '불법 벌목 및 산림 훼손', '폐수 방류')에 존재하는 GameManager가 호출한다.GameManager는 게임 맵을 관리하는 클래스로 각 Scene에서 UI 및 텍스트 출력을 담당한다. 모든 클래스는 점수를 SystemManager를 통해 갱신한다.

WebManager는 DontDestroyOnLoad에 상주하여 FastAPI와 요청을 주고 응답을 받는다.
```csharp
/// <summary>
/// FastAPI 서버에 role(역할)과 damaged(피해량)을 포함한 POST 요청을 보내고,
/// 응답으로 받은 텍스트를 Callback으로 반환하는 코루틴 메서드입니다.
/// </summary>
/// <param name="role">NPC의 역할을 의미합니다.(Water, Tree 등)(</param>
/// <param name="damaged">피해의 정도를 0 ~ 10으로 계산하여 심각성을 나타냅니다.</param>
/// <param name="callback">응답 내용을 처리할 콜백함수입니다.</param>
/// <returns>요청이 완료될 때까지 대기하는 IEnumerator</returns>
public IEnumerator GetResponse(string role, int damaged, Action<string> callback)
{
    string json = JsonUtility.ToJson(new RequestData { role = role, damaged = damaged });

    UnityWebRequest request = new UnityWebRequest(url + "response", "POST");
    byte[] jsonToSend = new System.Text.UTF8Encoding().GetBytes(json);
    request.uploadHandler = new UploadHandlerRaw(jsonToSend);
    request.downloadHandler = new DownloadHandlerBuffer();
    request.SetRequestHeader("Content-Type", "application/json");

    yield return request.SendWebRequest();

    if (request.result == UnityWebRequest.Result.ConnectionError || request.result == UnityWebRequest.Result.ProtocolError)
    {
        Debug.LogError($"Error {request.responseCode}: {request.downloadHandler.text}");
        callback?.Invoke(null);
    }
    else
    {
        string responseText = request.downloadHandler.text;
        callback?.Invoke(responseText);
    }
}
```

WebManager는 FastAPI에 유저 정보를 저장하도록 요청을 보낸다:
```csharp
/// <summary>
/// FastAPI 서버의 /users 엔드포인트로 유저 정보를 전송하는 POST 요청 코루틴입니다.
/// 게임 종료 시 플레이어의 이름, 점수, 뱃지 정보를 서버에 저장합니다.
/// </summary>
/// <param name="name">플레이어의 이름 또는 사용자 ID</param>
/// <param name="score">게임에서 획득한 최종 점수</param>
/// <param name="badge">획득한 Badge 번호 (성취도에 따라 0~n 범위)</param>
/// <param name="callback">요청 성공 시 응답 텍스트를 처리하는 콜백 함수</param>
/// <returns>UnityWebRequest의 완료를 기다리는 IEnumerator</returns>
public IEnumerator PostUserIn(string name, int score, int badge, Action<string> callback)
{
    UserData payload = new UserData
    {
        name = name,
        score = score,
        badge = badge
    };

    string json = JsonUtility.ToJson(payload);

    UnityWebRequest request = new UnityWebRequest(url + "users", "POST");
    byte[] jsonToSend = new System.Text.UTF8Encoding().GetBytes(json);
    request.uploadHandler = new UploadHandlerRaw(jsonToSend);
    request.downloadHandler = new DownloadHandlerBuffer();
    request.SetRequestHeader("Content-Type", "application/json");

    yield return request.SendWebRequest();

    if (request.result == UnityWebRequest.Result.ConnectionError || request.result == UnityWebRequest.Result.ProtocolError)
    {
        Debug.LogError($"Error {request.responseCode}: {request.downloadHandler.text}");
        callback?.Invoke(null);
    }
    else
    {
        string responseText = request.downloadHandler.text;

        callback?.Invoke(responseText);
    }
}

/// <summary>
/// FastAPI 서버에 사용자 정보를 전송할 때 사용되는 데이터 구조입니다.
/// 게임 종료 시 플레이어의 이름, 점수, 그리고 획득한 뱃지 정보를 포함합니다.
/// </summary>
[Serializable]
private class UserData
{
    /// <summary>
    /// 플레이어의 이름입니다.
    /// user@{무작위 네자리 난수}로 지정됩니다.
    /// </summary>
    public string name;

    /// <summary>
    /// 플레이어가 게임을 통해 획득한 누적 점수입니다.
    /// </summary>
    public int score;

    /// <summary>
    /// 플레이어가 달성한 성취도에 따라 부여된 뱃지 번호입니다.
    /// MySQL 내부에서 0, 1, 2, 4의 3bit 정보로 Badge를 부여합니다.
    /// </summary>
    public int badge;
}
```


Unity에서 요청을 받으면 FastAPI 내부에서 MySQL에 접근하여 DB에 저장한다:
```python
@app.post("/users", status_code=201)  # HTTP POST 요청으로 "/users" 경로에 접근할 경우 실행되며, 성공 시 201 Created 반환
async def create_user(user_in: UserCreate):
    db: Session = SessionLocal()  # 데이터베이스 세션을 생성
    try:
        # 전달받은 user_in 객체의 정보를 바탕으로 새로운 User 객체 생성
        user = User(
            name = user_in.name,
            score = user_in.score,
            badge = user_in.badge
        )
        db.add(user)          # User 객체를 DB 세션에 추가
        db.commit()           # 트랜잭션 커밋 (DB에 실제로 반영)
        db.refresh(user)      # 새로 추가된 user 객체를 최신 상태로 동기화 (id 등 자동 생성 필드 포함)
    except Exception as e:
        db.rollback()         # 에러 발생 시 트랜잭션 롤백
        raise HTTPException(status_code=500, detail=str(e))  # 500 에러 반환
    finally:
        db.close()            # 세션 종료

    # 클라이언트에게 저장된 사용자 정보를 JSON 형태로 반환
    return JSONResponse({
        "id": user.id,
        "name": user.name,
        "score": user.score,
        "badge": user.badge
    })
```


MySQL에서는 해당 Table을 갖고 있다:
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,         -- 고유 사용자 ID, 자동 증가
    name VARCHAR(20) NOT NULL,                 -- 사용자 이름 (최대 20자, NULL 불가)
    score INT DEFAULT 0,                       -- 게임을 통해 획득한 점수 (기본값: 0)
    badge BIT(3) NOT NULL DEFAULT b'000'       -- 뱃지 정보 (3비트로 최대 8개 유형 표현, 기본값: 없음)
);
```


FastAPI는 Local에 설치된 Ollama를 통해 응답을 생성한다.
```python
@app.post("/response")  # 클라이언트가 POST 요청을 "/response"로 보낼 때 실행되는 엔드포인트
async def response(request: Request):  # 비동기 방식으로 Request 객체를 인자로 받음
    data = await request.json()  # 요청 본문(JSON)을 비동기로 파싱하여 Python 딕셔너리로 변환

    role = data.get("role")  # JSON에서 'role' 값을 추출한다.
    damaged = int(data.get("damaged", 0))  # 'damaged' 값을 정수로 변환, 없을 경우 기본값 0

    # LLM에게 전달할 질문 구성: 역할과 피해 정도를 반영한 메시지 생성
    question = (
        f"I am {role}, and I feel damage at level {damaged} out of 10. "
        f"Speak to the forest guardian Elf as I react."
    )

    result = chain.invoke({"question": question})  # Ollama의 LangChain LLM 인터페이스에 질문을 보내고 응답을 받음

    # 결과 메시지를 JSON 형태로 클라이언트에 반환
    return JSONResponse(content={"message": result})
```

화재 진압 Scene

![Map_Tree](/images/CapstoneDesign/Map_Tree.PNG)

불법 벌목 Scene

![Map_Forest](/images/CapstoneDesign/Map_Forest.PNG)

폐수 방류 Scene

![Map_Waste](/images/CapstoneDesign/Map_Waste.PNG)

LLM 응답을 받으면 UI에 표시한다.

![LLM_Response](/images/CapstoneDesign/LLM_Response.png)

<iframe width="1378" height="775" src="https://www.youtube.com/embed/s1SLKenSphE" title="25년 1학기 SW 캡스톤 디자인 시연 동영상" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

유니티 프로젝트는 [여기][Capstone-gh]에서 확인할 수 있습니다.

[Capstone-gh]: https://github.com/To-steak/Capstone-Design