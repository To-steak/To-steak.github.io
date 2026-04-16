---
title: 베지어 곡선과 곡면 시각화
date: 2025-12-11
outline: deep
excerpt: DirectX11의 베지어 커브를 Unity에서 수식과 눈으로 이해할 수 있도록 시각화합니다.
category: Unity
---

## 소개
3차 베지어 곡선(Bezier Curve)과 곡면(Bezier Surface)을 Unity에서 수식 기반으로 구현하고,  
Inspector와 Scene View에서 실시간으로 확인할 수 있도록 시각화한 프로젝트입니다.

학부연구생 시절 DirectX11 발표에서 베지어 커브를 청중에게 직관적으로 설명하기 위해 제작했습니다.

## 핵심 수식: Bernstein Basis

베지어 곡선의 핵심은 **Bernstein 기저 함수**입니다.  
3차 베지어 곡선은 4개의 제어점을 가지며, 각 제어점에 대한 가중치를 다음과 같이 계산합니다.

$$
B(t) = \begin{pmatrix} (1-t)^3 \\ 3t(1-t)^2 \\ 3t^2(1-t) \\ t^3 \end{pmatrix}
$$

t가 0이면 첫 번째 제어점, 1이면 마지막 제어점에 수렴합니다.   
점의 개수를 늘려서 4차, 5차 곡선으로도 사용할 수 있지만, 4개의 제어점으로 충분히 다양한 곡선을 표현할 수 있기 때문입니다.

![3_bezier](/images/BezierCurve/Bezier_3_big.gif)
*(이미지 출처: WIKIPEDIA)*
## 코드
필요한 스크립트는 4개입니다.
1. Bernstein 가중치 및 곡선 계산: `BezierCurve.cs`
2. 곡면 계산: `BezierSurface.cs`
3. 씬 진입점 및 Vertex 이동: `Evaluation.cs`
4. Scene View 시각화: `EvaluationEditor.cs`

### BezierCurve.cs
t값에 따른 Bernstein 가중치를 계산하고, 4개의 제어점으로 곡선 위의 좌표를 반환합니다.
```cs
using UnityEngine;

public class BezierCurve
{
    /// <summary>
    /// 3차 베지에 곡선에서, 주어진 t 값에 따른 Bernstein 가중치 벡터를 계산합니다.
    /// 총 4개의 제어점을 사용하므로, 4차원 Vector로 반환합니다.
    /// </summary>
    public static Vector4 BernsteinBasis(float t)
    {
        float invT = 1.0f - t;
        return new Vector4(
            invT * invT * invT,
            3 * t * invT * invT,
            3 * t * t * invT,
            t * t * t);
    }

    /// <summary>
    /// 제어점 4개를 기반으로 주어진 t 값에 해당하는 베지에 곡선상의 좌표를 계산합니다.
    /// </summary>
    public static Vector3 Evaluate(Vector3[] controlPoints, float t)
    {
        Vector4 basis = BernsteinBasis(t);
        return basis.x * controlPoints[0] +
               basis.y * controlPoints[1] +
               basis.z * controlPoints[2] +
               basis.w * controlPoints[3];
    }
}
```

### BezierSurface.cs
곡선의 단일 파라미터 t를 u, v 2차원으로 확장하여 곡면을 표현합니다.  
16개의 제어점(4×4)에 대해 u, v 방향의 Bernstein 가중치를 각각 적용합니다.

::: info
곡면은 곡선을 두 방향으로 텐서곱한 것입니다.  
u 방향으로 4개의 곡선을 만들고, 그 결과를 다시 v 방향으로 보간합니다.
:::

```cs
using UnityEngine;

public class BezierSurface
{
    /// <summary>
    /// 3차 Bezier 곡면에서 주어진 u, v 좌표에 해당하는 점을 계산합니다.
    /// </summary>
    public static Vector3 Evaluate(Vector3[] patch, float u, float v)
    {
        Vector4 Bu = BezierCurve.BernsteinBasis(u);
        Vector4 Bv = BezierCurve.BernsteinBasis(v);
        return Sum(patch, Bu, Bv);
    }

    /// <summary>
    /// 4×4 제어점에 u, v 가중치를 적용해 곡면 위의 점을 보간합니다.
    /// </summary>
    private static Vector3 Sum(Vector3[] patch, Vector4 u, Vector4 v)
    {
        Vector3 sum = Vector3.zero;
        for (int i = 0; i < 4; i++)
        {
            Vector3 temp = Vector3.zero;
            for (int j = 0; j < 4; j++)
            {
                temp += u[j] * patch[i * 4 + j];
            }
            sum += v[i] * temp;
        }
        return sum;
    }
}
```

### Evaluation.cs
Inspector에서 u, v 슬라이더를 조작하면 Vertex가 곡선(곡면) 위를 실시간으로 이동합니다.  
Mode를 Curve / Surface로 전환하여 두 가지 모두 확인할 수 있습니다.

::: warning
제어점 배열 크기에 주의하세요.  
Curve 모드는 `bezierCurve[4]`, Surface 모드는 `bezierPatch[16]` (4×4) 을 사용합니다.
:::

```cs
using UnityEngine;

public class Evaluation : MonoBehaviour
{
    public enum Mode { Curve, Surface }
    public Mode mode;

    public GameObject cube;
    public GameObject vertex;
    private GameObject vertexInstance;

    [Range(0, 1)] public float u;
    [Range(0, 1)] public float v;

    public Vector3[] bezierCurve = new Vector3[4];
    public Vector3[] bezierPatch = new Vector3[16];

    private void Start()
    {
        if (mode == Mode.Curve)
            Generate(cube, bezierCurve);
        else
            Generate(cube, bezierPatch);

        vertexInstance = Instantiate(vertex, GetPosition(), Quaternion.identity);
    }

    /// <summary>
    /// Inspector 창에서 u, v 값의 변화에 따라 Vertex가 변화합니다.
    /// </summary>
    private void Update()
    {
        if (vertexInstance != null)
            vertexInstance.transform.position = GetPosition();
    }

    private Vector3 GetPosition()
    {
        return mode == Mode.Curve
            ? BezierCurve.Evaluate(bezierCurve, u)
            : BezierSurface.Evaluate(bezierPatch, u, v);
    }

    private void Generate(GameObject prefab, params Vector3[] pos)
    {
        foreach (var p in pos)
            Instantiate(prefab, p, Quaternion.identity);
    }
}
```

### EvaluationEditor.cs
Unity Custom Editor를 활용해 Scene View에서 곡선과 곡면을 실시간으로 그립니다.

- **Curve 모드**: `Handles.DrawBezier`로 초록색 곡선을 그립니다.
- **Surface 모드**: u 방향(노란색)과 v 방향(하늘색) 선분을 격자로 그려 곡면을 표현합니다.

::: info
STEPS 값을 높일수록 곡면이 부드럽게 표현되지만, Scene View 부하가 증가합니다.  
기본값 20은 발표 시연 기준으로 설정된 값입니다.
:::

```cs
using UnityEditor;
using UnityEngine;

[CustomEditor(typeof(Evaluation))]
public class EvaluationEditor : Editor
{
    private const int STEPS = 20;

    private void OnSceneGUI()
    {
        Evaluation e = (Evaluation)target;

        if (e.mode == Evaluation.Mode.Curve)
        {
            Handles.DrawBezier(
                e.bezierCurve[0], e.bezierCurve[3],
                e.bezierCurve[1], e.bezierCurve[2],
                Color.green, null, 2f);
            return;
        }

        // u 방향 선분 (노란색)
        Handles.color = Color.yellow;
        for (int ui = 0; ui <= STEPS; ui++)
        {
            float u = ui / (float)STEPS;
            Vector3 prev = BezierSurface.Evaluate(e.bezierPatch, u, 0f);
            for (int vi = 1; vi <= STEPS; vi++)
            {
                float v = vi / (float)STEPS;
                Vector3 curr = BezierSurface.Evaluate(e.bezierPatch, u, v);
                Handles.DrawLine(prev, curr);
                prev = curr;
            }
        }

        // v 방향 선분 (하늘색)
        Handles.color = Color.cyan;
        for (int vi = 0; vi <= STEPS; vi++)
        {
            float v = vi / (float)STEPS;
            Vector3 prev = BezierSurface.Evaluate(e.bezierPatch, 0f, v);
            for (int ui = 1; ui <= STEPS; ui++)
            {
                float u = ui / (float)STEPS;
                Vector3 curr = BezierSurface.Evaluate(e.bezierPatch, u, v);
                Handles.DrawLine(prev, curr);
                prev = curr;
            }
        }
    }
}
```

## 동작 방식 요약

| 모드 | 제어점 수 | 파라미터 | Scene View 색상 |
|---|---|---|---|
| Curve | 4개 | u (0~1) | 초록 |
| Surface | 16개 (4×4) | u, v (0~1) | 노랑 + 하늘 |

Inspector에서 u, v 슬라이더를 드래그하면 흰 Vertex가 곡선(곡면) 위를 이동하며,  
수식이 실제 공간에서 어떻게 작동하는지 직관적으로 확인할 수 있습니다.
![BezierCurve](/images/BezierCurve/BezierCurve.png)
![BezierSurface](/images/BezierCurve/BezierSurface.png)

## 마무리
이 프로젝트는 DirectX11 발표에서 베지어 커브를 수식만으로 설명하는 한계를 극복하기 위해 제작했습니다.  
Bernstein 기저 함수 → 곡선 보간 → 곡면 확장으로 이어지는 수학적 구조를 Unity 환경에서 눈으로 확인할 수 있도록 구성했습니다.

<iframe width="560" height="315" src="https://www.youtube.com/embed/5-N0lg8vECk?si=h69pUkUGKSP97d_J" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
