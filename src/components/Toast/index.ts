import { ComponentPublicInstance, createApp, ExtractPropTypes } from 'vue';

import ToastVue, { ToastExpose, ToastState } from './Toast.vue';

export type ToastProps = ExtractPropTypes<ToastState>;
let instance: ComponentPublicInstance<ExtractPropTypes<{ state: ToastState & Record<string, any> }>, ToastExpose>;

const initInstance = () => {
  const app = createApp(ToastVue);
  const container = document.createElement('div');
  instance = app.mount(container) as ComponentPublicInstance<
    ExtractPropTypes<{ state: ToastState & Record<string, any> }>,
    ToastExpose
  >;

  document.body.appendChild(container);
};

function Toast(props: ToastProps & Record<string, any>): void;
function Toast(
  props: string,
  type?: ToastProps['type'],
  delay?: ToastProps['delay'],
  position?: ToastProps['position']
): void;
function Toast(arg1: any, arg2?: any, arg3?: any, arg4?: any) {
  if (!instance) initInstance();

  if (!arg1) throw new Error('Toast content is required');

  if (typeof arg1 === 'string') {
    instance.state!.content = arg1;
    instance.state!.delay = arg3 || 1500;
    instance.state!.type = arg2 || 'info';
    instance.state!.position = arg4 || 'top';
  } else {
    instance.state!.content = arg1.content;
    instance.state!.delay = arg1.delay || 1500;
    instance.state!.type = arg1.type || 'info';
    instance.state!.position = arg1.position || 'top';
  }

  return instance.open();
}

export default Toast;
