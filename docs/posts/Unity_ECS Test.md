---
title: "Unity ECS: 10만 개 총알 충돌 최적화"
date: 2026-04-13
outline: deep
excerpt: ECS System과 Profiler를 통해 최적화를 해봅니다.
categories: Unity
---

# 공간 분할(Spatial Partitioning)과 비트 배열(NativeBitArray)

10만 개의 총알이 빗발치는 환경에서 $O(m \times n)$의 시간 복잡도를 해결하고, 기존 공간 분할(Spatial Partitioning) 기법에 **BitArray Cache**를 추가한 실험 기록입니다.

## 1. 실험 환경
- **Unity Version**: 6000.3.11 f1
- **Target**: 100,000 Bullets vs Enemies
- **Tech Stack**: Entities (ECS), Burst Compiler, Unity Mathematics
- **CPU**: 12th Gen Intel(R) Core(TM) i5-12600KF
- **GPU**: NVIDIA GeForce RTX 3060 Ti
- **RAM**: 16225MB
