<template>
  main
</template>

<script setup lang="ts">
import '@/shortcut';

import { listen } from '@tauri-apps/api/event';
import { WebviewWindow } from '@tauri-apps/api/window';
import { nextTick } from 'vue';
import { join, resolveResource } from '@tauri-apps/api/path';
import { createDir, exists, readDir, readTextFile } from '@tauri-apps/api/fs';

// 获取屏幕宽高
const screenWidth = window.screen.width;

const EBET_SEARCH = new WebviewWindow('EBET_SEARCH', {
  url: '#/ebet',
  fullscreen: false,
  height: 70,
  resizable: false,
  title: 'Embrace Everything Search',
  width: 200,
  decorations: false,
  alwaysOnTop: true,
  hiddenTitle: true,
  transparent: true,
  focus: true,
  x: 900,
  // x: screenWidth / 2 - 275,
  y: 700,
  visible: false
});

listen('Alt_Space', () => {
  EBET_SEARCH.show();
});


const getImportPlugins = async () => {
  /** app address */
  const appDir = (await resolveResource('')).substring(4);
  const pluginsPath = await join(appDir, 'plugins');
  const hasPluginsPath = await exists(pluginsPath);

  if (!hasPluginsPath) {
    await createDir(pluginsPath);
  }

  // 查找插件
  const pluginsFolderPath = await readDir(pluginsPath);

  // 如果有插件文件夹
  if (pluginsFolderPath && pluginsFolderPath.length) {
    let cachePlugins = [];
    // 遍历插件文件夹
    for (const plugin of pluginsFolderPath) {
      // 获取到插件地址
      const pluginFolderPath = await readDir(plugin.path);
      
      // 如果有插件
      if (pluginFolderPath && pluginFolderPath.length) {
        // 查找ebet.json
        const findEbetJson = pluginFolderPath.find(item => item.name === 'ebet.json');

        // 如果没有ebet.json
        if (!findEbetJson || !findEbetJson.path) {
          throw new Error('ebet.json not found');
        }

        // 读取ebet.json
        const ebetJsonText = await readTextFile(findEbetJson.path || '');

        try {
          // 解析ebet.json
          const ebetJson = JSON.parse(ebetJsonText);
          if (!ebetJson.main) {
            throw new Error('ebet.json main not found');
          }
          if (!ebetJson.main.endsWith('.js')) {
            throw new Error('ebet.json main not js');
          }
          const mainScriptPath = await join(plugin.path, ebetJson.main);
          ebetJson.mainScriptPath = mainScriptPath;
          cachePlugins.push(ebetJson);
        } catch (error) {

        }
      }
    }

    localStorage.setItem('EBET_PLUGINS', JSON.stringify(cachePlugins));
  }
}

nextTick(() => {
  getImportPlugins();
})
</script>

<style lang="less" scoped></style>
