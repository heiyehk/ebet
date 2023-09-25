<template>
  <template v-if="props.spinning">
    <TransitionFade>
      <div class="x-spin">
        <div class="frosted-glass">
          <Loading :size="24" :loading="true" />
        </div>
      </div>
    </TransitionFade>
  </template>
</template>

<script setup lang="ts">
import TransitionFade from '../Transition/TransitionFade.vue';
import Loading from './Loading.vue';

export interface XSpinProps {
  spinning?: boolean;
  size?: number;
  color?: string;
}

const props = withDefaults(defineProps<XSpinProps>(), {
  spinning: false,
  size: 16,
  color: '#000'
});
</script>

<style lang="less" scoped>
.x-spin {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;

  .frosted-glass {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    backdrop-filter: blur(10px);
    background-color: rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
