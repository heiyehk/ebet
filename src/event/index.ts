import { emit } from '@tauri-apps/api/event';
import { getCurrent } from '@tauri-apps/api/window';

const currentWindow = getCurrent();

currentWindow.once('tauri://close-requested', () => {
  emit('close-requested');
});
