import { emit } from '@tauri-apps/api/event';
import { isRegistered, register } from '@tauri-apps/api/globalShortcut';

const initGlobalShortcut = async () => {
  const isRegister = await isRegistered('Alt+Space');

  if (!isRegister) {
    await register('Alt+Space', () => {
      console.log('Alt+Space');
      emit('Alt_Space');
    });
  }
}

initGlobalShortcut();
