import EbetPlugins from './plugins';
import { shell } from '@tauri-apps/api';
import Toast from '@/components/Toast';
import { writeText } from '@tauri-apps/api/clipboard';
import { debounce } from '@hyjs/utils';
import { emit } from '@tauri-apps/api/event';
import { SearchResultItem } from './variable';

const mathExpressionRegex = /^\-?\d+(\.\d+)?([\-+\*\/%()\s]+\s*\d+(\.\d+)?)*$/;

export default class EbetSearch extends EbetPlugins {
  /**
   * 其他输入，如数学计算，匹配不上插件和未阻塞的输入
   * @param text 输入框的值
   */
  static otherInput(text: string) {
    if (mathExpressionRegex.test(text.replaceAll(' ', ''))) {
      try {
        this.searchResultList.value = [
          {
            id: 1,
            text: eval(text),
            desc: '数学计算'
          }
        ]
      } catch (error) {
        this.searchResultList.value = [
          {
            id: 1,
            text: '',
            desc: '数学计算 Error'
          }
        ]
      }
    } else {
      this.searchResultList.value = [
        {
          id: 1,
          text,
          desc: ''
        }
      ];
    }
  };

  /**
   * 搜索阻塞操作，这里主要是一些特殊的操作，如重启插件，查看历史记录等
   * @param searchInputValue 
   * @returns 
   */
  static searchBlockingOperations(searchInputValue: string) {
    if ('restart plugin'.includes(searchInputValue.toLocaleLowerCase())) {
      this.searchResultList.value = [{
        id: 'restart plugin',
        text: 'Restart plugin',
        desc: '重启插件',
        enter: () => {
          emit('ebet://restart');
        }
      }];

      return true;
    }

    if ('history'.includes(searchInputValue.toLocaleLowerCase())) {
      const historyList = this.historyList;

      if (!historyList.length) {
        this.searchResultList.value = [{
          id: 'history',
          text: 'No history',
          desc: '没有历史记录',
          enter: () => { }
        }];
        return true;
      }

      this.searchResultList.value = this.historyList;

      return true;
    }

    return false
  };

  /**
   * 搜索事件
   */
  static onSearchInput = debounce(async () => {
    const searchInputValue = this.searchValue.value;

    if (!searchInputValue) {
      this.searchResultList.value = [];
      return;
    }

    const isBlocking = this.searchBlockingOperations(searchInputValue);

    if (isBlocking) return;

    // 获取输入框的值
    const matchFirstSpaceIndex = searchInputValue.indexOf(' ');
    const pluginKey = searchInputValue.slice(0, matchFirstSpaceIndex);
    const capitalKey = pluginKey.toLocaleLowerCase();

    // 匹配插件
    if (capitalKey in this.ebetPluginsLabel) {
      this.matchPluginInject(capitalKey, matchFirstSpaceIndex);
    } else {
      this.otherInput(searchInputValue);
    }
  }, 400);

  static async addKeydownListener(searchInputRef: HTMLInputElement) {
    document.addEventListener('keydown', async (e) => {
      if (e.key === 'ArrowUp') {
        // 设置最后光标位置
        searchInputRef.focus();
        searchInputRef.setSelectionRange(this.searchValue.value.length, this.searchValue.value.length);
        if (this.currentActive.value === 0) return;
        this.currentActive.value--;

        if (e.target) {
          this.jumpView(e.target, 'ArrowUp');
        }
      } else if (e.key === 'ArrowDown') {
        if (this.currentActive.value === this.searchResultList.value.length - 1) return;
        this.currentActive.value++;

        if (e.target) {
          this.jumpView(e.target, 'ArrowDown');
        }
      } else if (e.key === 'Enter') {
        const currentActiveItem = this.searchResultList.value[this.currentActive.value];
        this.selectItem(currentActiveItem)
      } else if (e.key === 'Escape') {
        if (this.searchValue.value) {
          this.searchValue.value = '';
          this.searchResultList.value = [];
        } else {
          this.restState();
        }
      }
    });
  };

  // 给ebetResultRef.value设置滚动条
  static jumpView(target: EventTarget, direction: 'ArrowUp' | 'ArrowDown') {
    const ebetResultRef = document.querySelector('.ebet-result') as HTMLDivElement;
    const ebetResultScrollTop = ebetResultRef.scrollTop;
    const currentActiveHeight = this.currentActive.value * this.lineHeight;

    if (direction === 'ArrowUp') {
      if (currentActiveHeight < ebetResultScrollTop) {
        ebetResultRef.scrollTo({
          top: currentActiveHeight,
          behavior: 'smooth'
        });
      }
    }

    if (direction === 'ArrowDown') {
      if (currentActiveHeight > ebetResultScrollTop + this.lineHeight * 4) {
        ebetResultRef.scrollTo({
          top: currentActiveHeight - this.lineHeight * 4,
          behavior: 'smooth'
        });
      }
    }
  };

  /**
   * 选择item
   * @param item 
   * @param index 
   * @returns 
   */
  static async selectItem(item: SearchResultItem, index?: number) {
    if (!item) return;

    if (index !== undefined) {
      this.currentActive.value = index;
    }

    if (item.link) {
      shell.open(item.link);
      this.setHistory(item);
      return;
    }

    if (item.enter) {
      this.setHistory(item);
      item.enter();
      this.restState(true);
      return;
    }

    if (item.text) {
      this.setHistory(item);
      await writeText(item.text);
      this.restState();
      return;
    }
  };

  static get historyList() {
    const localHistory = localStorage.getItem('EBET_HISTORY');

    try {
      let historyList = [];

      if (localHistory) {
        const localHistoryJson = JSON.parse(localHistory);
        historyList = localHistoryJson;
      }

      return historyList;
    } catch (error: any) {
      Toast('getHistory:' + error.message, 'warning', 3000);
    }
  };

  static setHistory(item: SearchResultItem) {
    const localHistory = localStorage.getItem('EBET_HISTORY');

    try {
      let historyList = [];

      if (localHistory) {
        const localHistoryJson = JSON.parse(localHistory);
        historyList = localHistoryJson;
      }
      historyList.push(item);

      localStorage.setItem('EBET_HISTORY', JSON.stringify(historyList));
    } catch (error: any) {
      Toast('setHistory:' + error.message, 'warning', 3000);
    }
  }
};
