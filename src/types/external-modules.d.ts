declare module 'react-native-fs';
declare module 'react-native-share';
declare module 'react-native-file-viewer';
declare module 'moment';

declare module '@react-native-documents/picker' {
  export type DocumentPickerResponse = {
    uri: string;
    name?: string | null;
    type?: string | null;
    nativeType?: string | null;
  };

  export function pick(options?: {
    allowMultiSelection?: boolean;
  }): Promise<DocumentPickerResponse[]>;
}
