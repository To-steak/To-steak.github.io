<script setup>
import { ref } from 'vue'

defineProps({
  before: { type: String, required: true },
  after: { type: String, required: true },
  labelBefore: { type: String, default: 'Before' },
  labelAfter: { type: String, default: 'After' }
})

const sliderValue = ref(50)
</script>

<template>
  <div class="compare-container">
    <div class="img-wrapper">
      <img :src="after" alt="After" class="img-base" />
      <span class="label label-after">{{ labelAfter }}</span>

      <div class="img-overlay" :style="{ width: sliderValue + '%' }">
        <img :src="before" alt="Before" />
        <span class="label label-before">{{ labelBefore }}</span>
      </div>
    </div>

    <input
      type="range"
      min="0"
      max="100"
      v-model="sliderValue"
      class="slider"
    />
    
    <div class="handle-line" :style="{ left: sliderValue + '%' }">
      <div class="handle-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
.compare-container {
  position: relative;
  width: 100%;
  max-width: 800px; /* 원하는 최대 너비 */
  margin: 2rem auto;
  overflow: hidden;
  border-radius: 8px;
  user-select: none;
}

.img-wrapper {
  position: relative;
  width: 100%;
  line-height: 0; /* 이미지 하단 공백 제거 */
}

.img-base {
  display: block;
  width: 100%;
  height: auto;
}

.img-overlay {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  overflow: hidden;
  border-right: 2px solid white; /* 경계선 */
}

.img-overlay img {
  height: 100%; /* 높이를 부모에 맞춤 */
  max-width: none; /* 너비 제한 해제 */
  /* 중요: 오버레이 이미지 너비를 컨테이너 너비와 똑같이 맞춰야 비율이 유지됨 */
  width: 100vw; 
  /* 100vw 대신 부모 컨테이너 크기를 JS로 계산하는게 정확하지만, 
     간단한 구현을 위해 CSS로 처리. 
     정확히 하려면 object-fit이나 JS width 계산 필요. 
     아래 방식이 반응형에서 가장 무난함 */
  width: 100%; 
}

/* 실제 overlay 이미지 사이즈 보정 (트릭) */
/* .img-overlay 안의 이미지는 원본 비율을 유지하며 잘려야 하므로,
   JS 없이 CSS만으로 완벽하게 하려면 width를 고정해야 할 수 있습니다. 
   여기서는 간단히 width: auto / height: 100% 로 설정합니다. */
.img-overlay img {
    width: auto;
    max-width: unset;
    height: 100%;
}
/* 하지만 위 방식은 반응형에서 이미지가 찌그러질 수 있으므로, 
   가장 쉬운 방법은 두 이미지가 '같은 사이즈'라고 가정하고 
   부모 div의 width를 상속받게 하는 것입니다. */


.slider {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: col-resize;
  z-index: 20;
  margin: 0;
}

.handle-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: white;
  pointer-events: none; /* 클릭 통과 */
  z-index: 10;
  box-shadow: 0 0 5px rgba(0,0,0,0.5);
}

.handle-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 5px rgba(0,0,0,0.5);
  color: #333;
}

.label {
  position: absolute;
  top: 10px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 4px;
  font-size: 0.8rem;
  z-index: 5;
}
.label-before { left: 10px; }
.label-after { right: 10px; }
</style>