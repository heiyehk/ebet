<template>
  <div class="ebet-container">
    <div class="ebet-search" :class="searchResultList.length ? 'ebet-search-result' : ''">
      <input
        class="ebet-search-input"
        ref="searchInputRef"
        type="text"
        autofocus
        v-model="searchValue"
        @input="EbetSearch.onSearchInput"
      />
      <Loading :size="24" class="ebet-search-loading" :loading="searchLoading" />
    </div>
    <div class="ebet-result" ref="ebetResultRef">
      <ul class="ebet-result-ul">
        <template v-for="(item, index) in searchResultList" :key="item.id">
          <li class="ebet-result-li" :class="currentActive === index ? 'ebet-li-active' : ''" @click="EbetSearch.selectItem(item, index)">
            <div class="ebet-result-info" :class="!item.desc ? 'ebet-result-nodesc' : ''">
              <template v-if="!item.text && item.placeholder">
                <div class="ebet-result-text ebet-result-placeholder">{{ item.placeholder }}</div>
              </template>
              <template v-else>
                <div
                  class="ebet-result-text"
                  :class="item.link ? 'ebet-result-link' : ''"
                  :style="item.text && String(item.text).length >= 36 ? 'font-size: 16px' : ''"
                >
                  {{ item.text }}
                </div>
              </template>
              <div class="ebet-result-desc">{{ item.desc }}</div>
            </div>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCurrent, LogicalSize } from '@tauri-apps/api/window';
import { onMounted, ref, watch } from 'vue';

import Loading from '@/components/Loading/Loading.vue'
import { listen } from '@tauri-apps/api/event';
import EbetSearch from './index';

const {
  currentActive,
  searchValue,
  searchLoading,
  searchResultList,
  currentListHeight,
  styleLineHeight
} = EbetSearch;
const searchInputRef = ref<HTMLInputElement | null>(null);
const ebetResultRef = ref();

EbetSearch.initPlugins();

listen('ebet://restartCallback', () => {
  EbetSearch.initPlugins();
});

const watchListHeight = () => {
  if (EbetSearch.searchResultList.value && currentListHeight.value < EbetSearch.computedListHeight) {
    currentListHeight.value += 35;
    requestAnimationFrame(watchListHeight);
  } else if (EbetSearch.searchResultList.value && currentListHeight.value > EbetSearch.computedListHeight) {
    currentListHeight.value -= 35;
    requestAnimationFrame(watchListHeight);
  }

  getCurrent().setSize(new LogicalSize(550, currentListHeight.value + 5));
};

watch(
  () => EbetSearch.searchResultList.value,
  () => {
    watchListHeight();
  }
);

onMounted(() => {
  if (searchInputRef.value) {
    EbetSearch.addKeydownListener(searchInputRef.value);
  }
});

getCurrent().listen('tauri://blur', () => {
  EbetSearch.restState();
});
getCurrent().listen('tauri://close-requested', () => {
  EbetSearch.restState();
});

getCurrent().listen('ebet://Alt_Space', () => {
  EbetSearch.restState();
  getCurrent().show();
});

listen('ebet://Show_Search', () => {
  EbetSearch.restState();
  getCurrent().show();
});

getCurrent().listen('ebet://close-requested', () => {
  EbetSearch.restState();
});

getCurrent().listen('tauri://focus', () => {
  searchInputRef.value?.focus();
});
</script>

<style lang="less" scoped>
@import url('../../less/color.less');
.ebet-container {
  width: 100%;
  height: 100%;
  background-color: #fff;
  overflow: hidden;
  box-sizing: border-box;

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
      font-size: 24px;
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
  height: calc(100% - v-bind(styleLineHeight));
  overflow: auto;
  border-bottom-left-radius: @border-radius-base;
  border-bottom-right-radius: @border-radius-base;

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

  &-placeholder {
    color: #999;
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

  &-link {
    color: #1890ff;
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
