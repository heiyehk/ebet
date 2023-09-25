<template>
  <template v-if="loading">
    <div class="x-loading" :style="computedStyle">
      <svg
        version="1.1"
        id="loader-1"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        x="0px"
        y="0px"
        :width="`${props.size}px`"
        :height="`${props.size}px`"
        viewBox="0 0 50 50"
        style="enable-background: new 0 0 50 50"
        xml:space="preserve"
      >
        <path
          :fill="props.color"
          d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z"
        >
          <animateTransform
            attributeType="xml"
            attributeName="transform"
            type="rotate"
            from="0 25 25"
            to="360 25 25"
            :dur="`${props.dur}s`"
            repeatCount="indefinite"
          ></animateTransform>
        </path>
      </svg>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue';

defineOptions({
  name: 'Loading'
});

interface LoadingProps {
  loading?: boolean;
  size?: number;
  color?: string;
  dur?: number;
}

const props = withDefaults(defineProps<LoadingProps>(), {
  loading: false,
  size: 16,
  color: '#000',
  dur: 0.8
});

const computedStyle = computed(() => {
  if (props.loading) {
    return `width: ${props.size}px; height: ${props.size}px;transition: width 0.3s, height 0.3s;`;
  }

  return 'width: 0; height: 0;transition: width 0.3s, height 0.3s;';
});
</script>

<style scoped>
.x-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
</style>
