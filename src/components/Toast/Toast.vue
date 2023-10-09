<template>
  <transition name="tagger" appear>
    <div v-show="visible" class="x-toast" :class="computedClass">
      <div class="x-toast-content">
        {{ state.content }}
      </div>
    </div>
  </transition>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref } from 'vue';

export interface ToastState {
  content: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  delay?: number;
  position?: 'top' | 'bottom' | 'middle';
}

export interface ToastExpose {
  open: () => void;
  close: () => void;
}

export default defineComponent({
  name: 'Toast',
  setup() {
    const state = reactive<ToastState>({
      content: '',
      type: 'info',
      delay: 2600,
      position: 'top'
    });

    const visible = ref(true);
    const computedClass = computed(() => {
      const classes: string[] = [];
      if (state.type) {
        classes.push(`x-toast-${state.type}`);
      }
      if (state.position) {
        classes.push(`x-toast-${state.position}`);
      }
      return classes.join(' ');
    });
    let timer: number | null;

    const close = () => {
      if (timer) {
        clearTimeout(timer);
        visible.value = false;
        timer = null;
      }
    };

    const open = () => {
      if (timer) clearTimeout(timer);

      visible.value = true;
      timer = setTimeout(close, state.delay);

      return close;
    };
    return {
      state,
      visible,
      open,
      close,
      computedClass
    };
  }
});
</script>

<style lang="less" scoped>
@import url('@/less/color.less');

.x-toast {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;

  .x-toast-content {
    padding: 10px 20px;
    color: #fff;
    word-break: break-all;
    border-radius: @border-radius-base;
    box-shadow: 0 0 20px @ccc;
  }
}

.x-toast-top {
  top: 20px;
  transform: translateX(-50%);
}

.x-toast-middle {
  top: 50%;
  transform: translate(-50%, -50%);
}

.x-toast-bottom {
  bottom: 20px;
  transform: translateX(-50%);
}

.x-toast-success {
  .x-toast-content {
    background-color: rgba(@green, 95%);
  }
}

.x-toast-warning {
  .x-toast-content {
    background-color: fade(@orange, 95%);
  }
}

.x-toast-error {
  .x-toast-content {
    background-color: fade(@red, 95%);
  }
}

.x-toast-info {
  .x-toast-content {
    background-color: fade(@black, 95%);
  }
}

.tagger-enter-active,
.tagger-leave-active {
  opacity: 1;
  transition: all 0.3s;
}

.tagger-enter-from,
.tagger-leave-to {
  opacity: 0;
}
</style>
