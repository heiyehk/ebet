import EbetVariable, { SearchPluginAllPermissionsKey, SearchPluginDefaultPermissionsKey, SearchPluginPermissionsKey, SearchPluginType } from './variable';
import Toast from '@/components/Toast';
import { fetch } from '@tauri-apps/api/http';
import { writeText } from '@tauri-apps/api/clipboard';

/**
 * 插件权限属性和函数映射
 */
const permissionsMap: Record<SearchPluginPermissionsKey, any> = {
  fetch,
  open,
  writeText,
};

/**
 * 处理插件权限属性和函数
 */
export default class EbetPlugins extends EbetVariable {
  // 默认的插件权限属性和函数
  static defaultPermissionsPlugins = {
    loading: this.searchLoading,
    result: this.searchResultList,
    toast: Toast,
    cache: this.searchResultListCache,
  } as Record<SearchPluginDefaultPermissionsKey, any>;

  /**
   * 初始化插件
   * 
   * `ebet://restartCallback` 重启插件回调
   */
  static initPlugins = async () => {
    const ebetPlugins = localStorage.getItem('EBET_PLUGINS')
    if (ebetPlugins) {
      try {
        const ebetPluginsList = JSON.parse(ebetPlugins);

        for (const plugin of ebetPluginsList) {
          /* @vite-ignore */
          const pluginModule = (await import(`https://asset.localhost/${plugin.mainScriptPath}`)).default;
          this.ebetPluginsLabel[plugin.key] = {
            module: pluginModule,
            ...plugin
          };
        }
      } catch (error: any) {
        Toast('initPlugins:' + error.message, 'warning', 3000);
      }
    }
  };

  /**
   * 获取插件权限
   * @param pluginInfo 插件json信息
   * @returns 
   */
  static getPluginPermissions = (pluginInfo: SearchPluginType) => {
    const permissions = pluginInfo.permissions || [];
    let pluginModulePermissions = {
      ...this.defaultPermissionsPlugins
    } as Record<SearchPluginAllPermissionsKey, any>;

    if (permissions && permissions.length) {
      for (const permission of permissions) {
        if (permission in permissionsMap) {
          pluginModulePermissions[permission] = permissionsMap[permission];
        }
      }
    }

    return pluginModulePermissions;
  };

  /**
   * 匹配插件注入
   * @param capitalKey 
   * @param matchFirstSpaceIndex 
   * @returns 
   */
  static matchPluginInject(capitalKey: string, matchFirstSpaceIndex: number) {
    const pluginInfo = this.ebetPluginsLabel[capitalKey];
    // 插件module
    const pluginModule = pluginInfo.module;

    // 过滤之后的搜索值
    const searchSliceValue = this.searchValue.value.slice(matchFirstSpaceIndex + 1);

    if (!searchSliceValue || !pluginModule) {
      this.searchResultList.value = [
        {
          id: 1,
          placeholder: pluginInfo.name,
          desc: `${pluginInfo.description} ${pluginInfo.version}`
        }
      ];
      this.searchLoading.value = false;
      return;
    }

    // 插件权限
    const permissions = this.getPluginPermissions(pluginInfo);

    // 执行插件
    pluginModule(searchSliceValue, permissions).catch((err: Error) => {
      this.searchLoading.value = false;
      Toast('matchPluginInject:' + err.message, 'warning', 3000);
    });
  };
};
