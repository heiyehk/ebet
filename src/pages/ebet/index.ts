import EbetPlugins from './plugins';
import { shell } from '@tauri-apps/api';
import Toast from '@/components/Toast';
import { writeText } from '@tauri-apps/api/clipboard';
import { debounce } from '@hyjs/utils';
import { emit } from '@tauri-apps/api/event';

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
      this.searchResultList.value = [{
        id: 'history1',
        text: 'test',
        desc: '历史记录'
      }];

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
          // jumpView(e.target);
        }
      } else if (e.key === 'ArrowDown') {
        if (this.currentActive.value === this.searchResultList.value.length - 1) return;
        this.currentActive.value++;

        if (e.target) {
          // jumpView(e.target);
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
  static jumpView(target: EventTarget) {
    // const targetElement = target as HTMLElement;
    // const targetElementOffsetTop = targetElement.offsetTop;
    // const targetElementOffsetHeight = targetElement.offsetHeight;
    // const targetElementScrollTop = ebetResultRef.value.scrollTop;
    // console.log(ebetResultRef.value.children);
    // const targetElementScrollHeight = ebetResultRef.value.scrollHeight;

    // if (targetElementOffsetTop + targetElementOffsetHeight > targetElementScrollTop + targetElementScrollHeight) {
    //   // document.querySelector('.scroll-content').style.transform = `translate3d(0px, ${targetElementOffsetTop + targetElementOffsetHeight - targetElementScrollHeight}px, 0px)`;
    // } else if (targetElementOffsetTop < targetElementScrollTop) {
    //   // ebetResultRef.value.scrollTop = targetElementOffsetTop;
    //   // document.querySelector('.scroll-content').style.transform = `translate3d(0px, ${targetElementOffsetTop}px, 0px)`;
    // }
  };

  /**
   * 选择item
   * @param item 
   * @param index 
   * @returns 
   */
  static async selectItem(item: any, index?: number) {
    if (!item) return;

    if (index !== undefined) {
      this.currentActive.value = index;
    }

    if (item.link) {
      shell.open(item.link);
      return;
    }

    if (item.enter) {
      item.enter();
      this.restState(true);
      return;
    }

    if (item.text) {
      await writeText(item.text);
      this.restState();
      return;
    }

    Toast('操作失败');
  };
};
