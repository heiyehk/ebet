<template>main</template>

<script setup lang="ts">
import '@/shortcut';

import { listen } from '@tauri-apps/api/event';
import { WebviewWindow } from '@tauri-apps/api/window';

// 获取屏幕宽高
const screenWidth = window.screen.width;

const EBET_SEARCH = new WebviewWindow('EBET_SEARCH', {
  url: '#/ebet',
  fullscreen: false,
  height: 70,
  resizable: false,
  title: 'Embrace Everything Search',
  width: 550,
  decorations: false,
  alwaysOnTop: true,
  hiddenTitle: true,
  transparent: true,
  focus: true,
  x: screenWidth / 2 - 275,
  y: 200,
  visible: false
});

listen('Alt_Space', () => {
  EBET_SEARCH.show();
});
</script>

<style lang="less" scoped></style>
