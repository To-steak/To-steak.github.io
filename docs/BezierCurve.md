---
title: Bezier Curve
outline: deep
---

# Bezier Curve

> **베지에 곡선 (Wikipedia)**
> 
> 베지에 곡선은 컴퓨터 그래픽 및 관련 분야에서 사용되는 매개변수 곡선입니다.
> 일련의 '제어점'은 공식을 통해 부드럽고 연속적인 곡선을 정의합니다.

## 3차 Bezier 곡선 공식

3차 Bezier 곡선을 위해서는 네 개의 점이 필요합니다.

$$\mathbf{P}_0, \mathbf{P}_1, \mathbf{P}_2, \mathbf{P}_3$$

4개의 제어점을 이용해 다음과 같이 정의합니다 (**Bernstein 다항식**):

$$
\mathbf{B}(t) = (1 - t)^3 \mathbf{P}_0 + 3t(1 - t)^2 \mathbf{P}_1 + 3t^2(1 - t) \mathbf{P}_2 + t^3 \mathbf{P}_3, \quad t \in [0, 1]
$$

위 공식은 $t$값의 변화에 따라 점이 갖는 가중치를 반환합니다.
예를 들어 시작점에서 vertex가 시작된다고 하면, 이 때 시작점의 가중치는 1.0입니다.
그러나 vertex가 끝점으로 향하면 점차 시작점의 가중치는 0.0으로 줄어듭니다.

따라서 네 개의 점으로 다음과 같이 곡선을 표현할 수 있습니다.

![3_bezier](/images/BezierCurve/Bezier_3_big.gif)
*(이미지 출처: WIKIPEDIA)*

![/images/BezierCurve/BezierCurve.png](/images/BezierCurve/BezierCurve.png)

3차뿐만 아니라 점의 개수를 늘려서 4차, 5차 곡선으로도 사용할 수 있지만, 3차 베지어 곡선을 많이 쓰는 이유는 4개의 제어점으로 충분히 다양한 곡선을 표현할 수 있기 때문입니다.

## 코드 구현 C#

### 3차 Bezier 곡선을 위한 Bernstein 다항식

```csharp
public Vector4 BernsteinBasis(float t)
{
    float invT = 1.0f - t;
    
    return new Vector4(
        invT * invT * invT,
        3.0f * t * invT * invT,
        3.0f * t * t * invT,
        t * t * t);
}
```

## Image Compare

<CompareImage
    before="/images/PhotonTPS/game01.PNG"
    after="/images/PhotonTPS/lobby01.PNG"
/>


::: tip Unity Console
[Log] 빌드가 성공적으로 완료되었습니다! (Duration: 00:05:23)
:::