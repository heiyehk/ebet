import { getCurrent } from '@tauri-apps/api/window';
import { ref } from 'vue';

/**
 * 搜索结果item
 */
export interface SearchResultItem {
  id: number | string;
  text?: string;
  placeholder?: string;
  desc?: string;
  link?: string;
  enter?: () => void;
}

/**
 * 权限key
 * 
 * - `fetch`: 请求
 * - `shell`: shell
 * - `writeText`: 写入剪切板
 */
export type SearchPluginPermissionsKey =
  | 'fetch'
  | 'open'
  | 'writeText';

/**
 * 默认权限key
 * 
 * - `loading`: loading
 * - `result`: 搜索结果
 * - `toast`: toast
 * - `cache`: 缓存
 */
export type SearchPluginDefaultPermissionsKey =
  | 'loading'
  | 'result'
  | 'toast'
  | 'cache';

export type SearchPluginAllPermissionsKey = SearchPluginPermissionsKey | SearchPluginDefaultPermissionsKey;

/**
 * 权限函数
 */
export type SearchPluginPermissionsFunctions = Record<SearchPluginPermissionsKey, SearchPluginType>;

/**
 * 插件json信息
 */
export interface SearchPluginType {
  /**
   * 插件名称
   */
  name: string;
  /**
   * 插件描述
   */
  description: string;
  /**
   * 插件key，根据该key来匹配插件进行触发
   */
  key: string;
  /**
   * 权限集合
   */
  permissions?: SearchPluginPermissionsKey[];
  /**
   * 当前插件版本
   */
  version: string;
  /**
   * 插件主函数
   */
  main: string;
  /**
   * 插件模块，在app中注册的插件模块才有该属性
   * @param searchValue 
   * @param fn 
   * @returns 
   */
  module?: (searchValue: string, fn: SearchPluginPermissionsFunctions) => Promise<void>;
}

/**
 * 插件变量
 */
export default class EbetVariable {
  /** 高度 */
  static readonly lineHeight = 70;
  static readonly styleLineHeight = `${this.lineHeight}px`;
  static searchValue = ref('');
  /** 搜索资源 */
  static searchResultList = ref<SearchResultItem[]>([]);
  /** 搜索资源缓存 */
  static searchResultListCache = ref([]);
  /** 当前选中item */
  static currentActive = ref(0);
  /** 搜索loading */
  static searchLoading = ref(false);
  /** list所渲染的高度 */
  static currentListHeight = ref(70);
  /** 插件序列化label，根据key值操作 */
  static ebetPluginsLabel: Record<string, SearchPluginType> = {};

  static get computedListMaxHeight() {
    if (this.searchResultList.value.length >= 5) return 5;
    return this.searchResultList.value.length;
  }

  static get computedListHeight() {
    // 最多只会显示5条，超出滚动条
    return this.lineHeight + this.computedListMaxHeight * this.lineHeight;
  };

  /**
   * 隐藏搜索框
   * @param clear 如果为true则还原所有状态
   */
  static restState = (clear = false) => {
    this.searchLoading.value = false;
  
    if (clear) {
      this.searchValue.value = '';
      this.searchResultList.value = [];
      this.searchResultListCache.value = [];
      this.currentActive.value = 0;
      this.currentListHeight.value = 70;
    }
  
    getCurrent().hide();
  };
};
