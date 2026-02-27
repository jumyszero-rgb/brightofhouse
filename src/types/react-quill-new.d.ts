// @/src/types/react-quill-new.d.ts
declare module 'react-quill-new' {
  import { Component } from 'react';
  export interface ReactQuillProps {
    theme?: string;
    value?: string;
    onChange?: (content: string, delta: any, source: string, editor: any) => void;
    modules?: any;
    className?: string;
  }
  export default class ReactQuill extends Component<ReactQuillProps> {}
}
