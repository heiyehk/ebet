<template>
  <div class="ebet-container">
    <div class="ebet-search" :class="searchResultList.length ? 'ebet-search-result' : ''">
      <input ref="searchInputRef" type="text" autofocus v-model="searchValue" @input="onSearchInput" />
    </div>
    <template v-if="searchResultList">
      <div class="ebet-result">
        <ul class="ebet-result-ul">
          <template v-for="(item, index) in searchResultList" :key="item.id">
            <li class="ebet-result-li" :class="currentActive === index ? 'ebet-li-active' : ''">
              <div class="ebet-result-text">{{ item.text }}</div>
              <div class="ebet-result-desc">{{ item.desc }}</div>
            </li>
          </template>
        </ul>
      </div>
    </template>
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
const fanyiApi = (msg: string) => `https://v.api.aa1.cn/api/api-fanyi-yd/index.php?msg=${msg}&type=3`;
const searchValue = ref('');
const searchResultList = ref<SearchResultItem[]>([]);
const currentActive = ref(0);

const currentListHeight = ref(70);
const computedListHeight = computed(() => {
  if (searchResultList.value.length >= 3) return lineHeight + lineHeight * 3;
  return lineHeight + searchResultList.value.length * lineHeight;
});

// 输入框输入事件防抖
const onSearchInput = debounce(async () => {
  if (!searchValue.value) {
    searchResultList.value = [];
    return;
  }
  const result = await fetch<SearchResultData>(fanyiApi(searchValue.value), {
    method: 'GET',
    responseType: 1
  }).catch(() => {
    Toast('翻译接口请求失败');
    return null;
  });

  if (!result) return;
  const resultData = result.data;

  searchResultList.value = [
    {
      id: 1,
      text: resultData.text,
      desc: resultData.desc
    }
  ];
}, 400);

const watchListHeight = () => {
  getCurrent().setSize(new LogicalSize(550, currentListHeight.value));
  if (searchResultList.value && currentListHeight.value < computedListHeight.value) {
    currentListHeight.value += 7;
    requestAnimationFrame(watchListHeight);
  } else if (searchResultList.value && currentListHeight.value > computedListHeight.value) {
    currentListHeight.value -= 7;
    requestAnimationFrame(watchListHeight);
  }
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
      if (!currentActiveItem) return;

      if (currentActiveItem.link) {
        shell.open(currentActiveItem.link);
      } else if (currentActiveItem.text) {
        await writeText(currentActiveItem.text);
        restState();
      } else {
        Toast('无法复制');
      }
    } else if (e.key === 'Escape') {
      restState();
    }
  });
};

const restState = () => {
  currentListHeight.value = 70;
  currentActive.value = 0;
  searchValue.value = '';
  searchResultList.value = [];
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

  .ebet-search {
    width: 100%;
    height: v-bind(styleLineHeight);

    input {
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
  }

  .ebet-search-result {
    border-bottom: 1px solid #eee;
  }
}

.ebet-result {
  max-height: 210px;
  overflow-y: auto;

  &-ui {
    width: 100%;
    height: 100%;
    list-style: none;
  }

  &-li {
    width: 100%;
    height: v-bind(styleLineHeight);
    padding: 12px 10px 0;
    box-sizing: border-box;
    border-bottom: 1px solid #eee;
    cursor: pointer;

    &:last-child {
      border-bottom: none;
    }
  }

  &-text {
    font-size: 24px;
    letter-spacing: 2px;
    color: #333;
    line-height: 1;
    margin-bottom: 7px;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &-desc {
    font-size: 12px;
    letter-spacing: 2px;
    color: #999;
    line-height: 1;
  }
}

.ebet-li-active {
  background-color: #eee;
}
</style>
