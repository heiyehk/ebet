<template>
  <div class="ebet-container">
    <div class="ebet-search" :class="searchResultList.length ? 'ebet-search-result' : ''">
      <input
        class="ebet-search-input"
        ref="searchInputRef"
        type="text"
        autofocus
        v-model="searchValue"
        @input="onSearchInput"
      />
      <Loading :size="24" class="ebet-search-loading" :loading="searchLoading" />
    </div>
    <div class="ebet-result">
      <ul class="ebet-result-ul">
        <template v-for="(item, index) in searchResultList" :key="item.id">
          <li class="ebet-result-li" :class="currentActive === index ? 'ebet-li-active' : ''" @click="selectItem(item, index)">
            <div class="ebet-result-info" :class="!item.desc ? 'ebet-result-nodesc' : ''">
              <div class="ebet-result-text">{{ item.text }}</div>
              <div class="ebet-result-desc">{{ item.desc }}</div>
            </div>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { debounce } from '@hyjs/utils';
import { shell } from '@tauri-apps/api';
import { writeText } from '@tauri-apps/api/clipboard';
import { fetch } from '@tauri-apps/api/http';
import { getCurrent, LogicalSize } from '@tauri-apps/api/window';
import { computed, onMounted, ref, watch } from 'vue';

import Toast from '@/components/Toast';
import Loading from '@/components/Loading/Loading.vue'

export interface SearchResultItem {
  id: number;
  text: string;
  desc?: string;
  link?: string;
}

export interface SearchResultData {
  text: string;
  desc?: string;
  type?: string;
}

const searchInputRef = ref<HTMLInputElement | null>(null);
const lineHeight = 70;
const styleLineHeight = `${lineHeight}px`;
const searchValue = ref('');
const searchResultList = ref<SearchResultItem[]>([]);
const currentActive = ref(0);
const searchLoading = ref(false);
const ebetPlugins = localStorage.getItem('EBET_PLUGINS');
let ebetPluginsLabel: Record<string, any> = {};

const initPlugins = async () => {
  if (ebetPlugins) {
    try {
      const ebetPluginsList = JSON.parse(ebetPlugins);

      for (const plugin of ebetPluginsList) {
        const pluginModule = (await import(`https://asset.localhost/${plugin.mainScriptPath}`)).default;
        ebetPluginsLabel[plugin.key] = {
          module: pluginModule,
          ...plugin
        };
      }
    } catch (error) {
      
    }
  }
}
initPlugins();

const currentListHeight = ref(70);
const computedListMaxHeight = computed(() => {
  if (searchResultList.value.length >= 5) return 5;
  return searchResultList.value.length;
})
const computedListHeight = computed(() => {
  // 最多只会显示5条，超出滚动条
  return lineHeight + computedListMaxHeight.value * lineHeight;
});

const mathExpressionRegex = /^\-?\d+(\.\d+)?([\-+\*\/%()\s]+\s*\d+(\.\d+)?)*$/;
const otherInput = (text: string) => {
  if (mathExpressionRegex.test(text.replaceAll(' ', ''))) {
    try {
      searchResultList.value = [
        {
          id: 1,
          text: eval(text),
          desc: '数学计算'
        }
      ]
    } catch (error) {
      searchResultList.value = [
        {
          id: 1,
          text: '',
          desc: '数学计算 Error'
        }
      ]
    }
  } else {
    searchResultList.value = [
      {
        id: 1,
        text,
        desc: ''
      }
    ];
  }
}

// 输入框输入事件防抖
const onSearchInput = debounce(async () => {
  const searchInputValue = searchValue.value;
  if (!searchInputValue) {
    searchResultList.value = [];
    return;
  }

  if (searchInputValue) {
    const [key, ...text] = searchInputValue.split(' ');
    const capitalKey = key.toLocaleLowerCase();
    if (searchInputValue.includes(' ') && capitalKey in ebetPluginsLabel) {
      const pluginModule = ebetPluginsLabel[capitalKey].module;
      pluginModule(text.join(' '), {
        searchResultList,
        searchLoading,
        fetch
      }).catch((err: Error) => {
        searchLoading.value = false;
        Toast(err.message);
      });
    } else {
      otherInput(searchInputValue);
    }
  }
}, 400);

const watchListHeight = () => {
  if (searchResultList.value && currentListHeight.value < computedListHeight.value) {
    currentListHeight.value += 7;
    requestAnimationFrame(watchListHeight);
  } else if (searchResultList.value && currentListHeight.value > computedListHeight.value) {
    currentListHeight.value -= 7;
    requestAnimationFrame(watchListHeight);
  }

  console.log(1);
  getCurrent().setSize(new LogicalSize(550, currentListHeight.value));
};

watch(
  () => searchResultList.value,
  () => {
    watchListHeight();
  }
);

const addKeydownListener = async () => {
  document.addEventListener('keydown', async (e) => {
    if (e.key === 'ArrowUp') {
      if (currentActive.value === 0) return;
      currentActive.value--;
    } else if (e.key === 'ArrowDown') {
      if (currentActive.value === searchResultList.value.length - 1) return;
      currentActive.value++;
    } else if (e.key === 'Enter') {
      const currentActiveItem = searchResultList.value[currentActive.value];
      selectItem(currentActiveItem)
    } else if (e.key === 'Escape') {
      restState();
    }
  });
};

const selectItem = async (item: any, index?: number) => {
  if (!item) return;

  if (index !== undefined) {
    currentActive.value = index;
  }

  if (item.link) {
    shell.open(item.link);
  } else if (item.text) {
    await writeText(item.text);
    restState();
  } else {
    Toast('无法复制');
  }
}

const restState = () => {
  searchLoading.value = false;
  // currentListHeight.value = 70;
  // currentActive.value = 0;
  // searchValue.value = '';
  // searchResultList.value = [];
  getCurrent().hide();
};

onMounted(() => {
  addKeydownListener();
});

getCurrent().listen('tauri://blur', () => {
  restState();
});
getCurrent().listen('tauri://close-requested', () => {
  restState();
});

getCurrent().listen('Alt_Space', () => {
  restState();
  getCurrent().show();
});

getCurrent().listen('close-requested', () => {
  restState();
});

getCurrent().listen('tauri://focus', () => {
  searchInputRef.value?.focus();
});
</script>

<style lang="less" scoped>
.ebet-container {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background-color: #fff;

  .ebet-search {
    width: 100%;
    height: v-bind(styleLineHeight);
    position: relative;

    &-input {
      display: block;
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
      padding: 0 10px;
      font-size: 28px;
      letter-spacing: 2px;
      box-sizing: border-box;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &-loading {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
    }
  }

  .ebet-search-result {
    border-bottom: 1px solid #eee;
  }
}

.ebet-result {
  overflow-y: auto;

  &-ui {
    width: 100%;
    height: 100%;
    list-style: none;
  }

  &-li {
    width: 100%;
    height: v-bind(styleLineHeight);
    padding: 0 12px;
    box-sizing: border-box;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    list-style: none;
    display: flex;
    align-items: center;

    &:last-child {
      border-bottom: none;
    }
  }

  &-text {
    font-size: 24px;
    letter-spacing: 2px;
    height: 26px;
    line-height: 26px;
    margin-bottom: 8px;
    color: #333;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &-desc {
    font-size: 12px;
    letter-spacing: 2px;
    color: #999;
    line-height: 12px;
    overflow: hidden;
    opacity: 1;
    height: 14px;
    transition: height 0.3s;
  }

  .ebet-result-nodesc {
    .ebet-result-text {
      margin-bottom: 0;
      transition: margin-bottom 0.3s;
    }
    .ebet-result-desc {
      height: 0;
      transition: height 0.3s;
    }
  }
}

.ebet-li-active {
  background-color: #eee;
}
</style>
