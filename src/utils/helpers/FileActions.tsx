import RNFS from 'react-native-fs';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import { showMessage } from './Toast';
import Share from 'react-native-share';
import moment from 'moment';
import { DocumentPickerResponse, pick } from '@react-native-documents/picker';

//--------------------------------------------------------------- upload file
export type FileCallback = {
  uri: string;
  path: {
    name: string;
    type: string;
    uri: string;
  };
};

type FilePickerProps = {
  isMultiple?: boolean;
  callback: (res: FileCallback[]) => void;
};

const formatFile = (file: DocumentPickerResponse) => {
  const fileName = file.name || file.uri.split('/').pop() || 'unknown';
  return {
    name: fileName,
    type: file.type || file.nativeType || 'application/octet-stream',
    uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
  };
};

export const getFileFromLocal = async ({
  isMultiple = false,
  callback,
}: FilePickerProps): Promise<void> => {
  try {
    const pickResults = await pick({ allowMultiSelection: isMultiple });
    const formattedFiles = pickResults?.map(item => {
      return {
        uri: item.uri,
        path: formatFile(item),
      };
    });

    callback(formattedFiles);
  } catch (error) {
    console.error('Gallery Error:', error);
    callback([]);
  }
};

//--------------------------------------------------------------- download file
export const downloadFile = async ({
  fileUrl,
  fileName,
}: {
  fileUrl: string;
  fileName: string;
}) => {
  try {
    if (Platform.OS === 'android') {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Storage permission is needed to download files',
        );
        return;
      }
    }

    let downloadDest;
    if (Platform.OS === 'android') {
      downloadDest = `${RNFS.DownloadDirectoryPath}/${moment().format(
        'HH_MM_SS_',
      )}${fileName}`;
    } else {
      downloadDest = `${RNFS.DocumentDirectoryPath}/${moment().format(
        'HH_MM_SS_',
      )}${fileName}`;
    }

    const options = {
      fromUrl: fileUrl,
      toFile: downloadDest,
      background: true,
      progress: () => {},
    };

    const result = await RNFS.downloadFile(options).promise;

    console.log('result in download file', result);

    if (result.statusCode === 200) {
      if (Platform.OS === 'ios') {
        await shareFileiOS(downloadDest, fileName);
      } else {
        showMessage('File downloaded successfully to Downloads folder');
      }
    } else {
      showMessage('Unable to download file');
    }
  } catch (error) {
    console.log('error is :-', error);
    showMessage('Unable to download file');
  }
};

const requestStoragePermission = async () => {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
      ];

      const results = await PermissionsAndroid.requestMultiple(permissions);
      return Object.values(results).every(
        result => result === PermissionsAndroid.RESULTS.GRANTED,
      );
    } else if (Platform.Version >= 29) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  }
  return true;
};

const shareFileiOS = async (filePath: string, fileName: string) => {
  try {
    const shareOptions = {
      url: `file://${filePath}`,
      type: getMimeType(fileName),
      filename: fileName,
      saveToFiles: true,
    };

    await Share.open(shareOptions);
    showMessage('File saved successfully');
  } catch (error: any) {
    if (error.message?.includes('User did not share')) {
      showMessage('File downloaded to app storage');
    } else {
      console.error('Share error:', error);
      showMessage('File downloaded - use Share button to save');
    }
  }
};

const getMimeType = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
};
