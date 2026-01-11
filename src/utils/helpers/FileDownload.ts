import { Alert, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';

export const downloadAndOpenFile = async (url: string, token?: string) => {
    try {
        const fileName = url.split('/').pop()?.split('?')[0] || 'invoice.pdf';

        // Use app cache directory (no permissions needed)
        const path =
            Platform.OS === 'android'
                ? `${RNFS.CachesDirectoryPath}/${fileName}`
                : `${RNFS.DocumentDirectoryPath}/${fileName}`;

        console.log('Downloading file to:', path);
        console.log('Download URL:', url);

        const downloadOptions: any = {
            fromUrl: url,
            toFile: path,
        };

        // Add authorization header if token provided
        if (token) {
            downloadOptions.headers = {
                Authorization: `Bearer ${token}`,
            };
        }

        const res = await RNFS.downloadFile(downloadOptions).promise;

        console.log('Download response:', res);

        if (res.statusCode === 200) {
            const stats = await RNFS.stat(path);
            console.log('File stats:', stats);

            if (Number(stats.size) < 1000) {
                Alert.alert('Error', 'Downloaded file seems empty. File size: ' + stats.size + ' bytes');
                await RNFS.unlink(path).catch(() => { });
                return;
            }

            Alert.alert('Success', 'Invoice downloaded successfully!');

            try {
                // Open with system viewer
                await FileViewer.open(path, {
                    showOpenWithDialog: true,
                });
            } catch (viewerError) {
                console.log('FileViewer error:', viewerError);
                Alert.alert('Info', `File downloaded to: ${path}`);
            }
        } else if (res.statusCode === 302 || res.statusCode === 301) {
            // Handle redirects
            Alert.alert('Error', `Server redirect (${res.statusCode}). URL may require authentication.`);
        } else {
            Alert.alert('Error', `Failed to download invoice. Status: ${res.statusCode}`);
        }
    } catch (error: any) {
        console.log('Download error:', error);
        Alert.alert('Error', error?.message || 'Something went wrong while downloading.');
    }
};
