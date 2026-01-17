import { Alert, Linking, Platform } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import ReactNativeBlobUtil from "react-native-blob-util";

import { show } from '../../components/Toast';

export const downloadFile = async (url: string, type: "image" | "video") => {
  try {
    const { fs, config } = ReactNativeBlobUtil;

    const ext = type === "image" ? "jpg" : "mp4";
    const mime = type === "image" ? "image/jpeg" : "video/mp4";
    const fileName = `${type}_${Date.now()}.${ext}`;

    const path = `${fs.dirs.DownloadDir}/${fileName}`;

    await config({
      fileCache: true,
      addAndroidDownloads: {
        useDownloadManager: true,
        notification: true,
        path,
        mime,
        description: `Downloading ${type}`,
      },
    }).fetch("GET", url);

    show(`${type} downloaded successfully`);
  } catch (e) {
    console.log(e);
    show(`Failed to download ${type}`);
  }
};




// Define the callback type for image responses
type ImageCallback = {
  uri: string;
  path: {
    name: string;
    type: string;
    uri: string;
  } | null;
};

// Define the input props type for the camera function
type ImagePickerProps = {
  isCrop?: boolean;
  callback: (res: ImageCallback) => void;
  size?: {
    width?: number;
    height?: number;
  };
  cropperCircleOverlay?: boolean;
};

type PickerImage = {
  path: string;
  mime: string;
};

// Utility function to format the image object
const formatImage = (image: PickerImage): ImageCallback['path'] => {
  const { path, mime } = image;
  const fileName = path.split('/').pop() || 'unknown';
  return {
    name: fileName,
    type: mime,
    uri: Platform.OS === 'android' ? path : path.replace('file://', ''),
  };
};

// Function to pick an image from the gallery
export const getImageFromGallery = async ({
  isCrop = false,
  callback,
  size = { width: 400, height: 400 },
  cropperCircleOverlay = false,
}: ImagePickerProps): Promise<void> => {
  try {
    const image = await ImagePicker.openPicker({
      width: size.width,
      height: size.height,
      cropping: isCrop,
      mediaType: 'photo',
      cropperCircleOverlay: cropperCircleOverlay,
    });

    callback({
      uri: image.path,
      path: formatImage(image),
    });
  } catch (error) {
    console.error('Gallery Error:', error);
    callback({
      uri: '',
      path: null,
    });
  }
};

// Function to capture an image using the camera
export const getImageFromCamera = async ({
  isCrop = false,
  callback,
  size = { width: 400, height: 400 },
  cropperCircleOverlay = false,
}: ImagePickerProps): Promise<void> => {
  try {
    const image = await ImagePicker.openCamera({
      width: size.width,
      height: size.height,
      cropping: isCrop,
      mediaType: 'photo',
      cropperCircleOverlay: cropperCircleOverlay,
    });

    callback({
      uri: image.path,
      path: formatImage(image),
    });
  } catch (error) {
    console.error('Camera Error:', error);
    callback({
      uri: '',
      path: null,
    });
  }
};

export function hexToRGB(
  hex: string,
  opacity: number = 1,
  defaultColor: string = 'red',
): string {
  let c: string[] | number;

  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = parseInt(c.join(''), 16);

    return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(
      ',',
    )},${opacity})`;
  }

  return defaultColor;
}

export const getDaysInMonth = (
  monthIndex: number,
  year = new Date().getFullYear(),
) => new Date(year, monthIndex + 1, 0).getDate();

// export const getDateOptions = (
//   monthValue?: string,
//   year = new Date().getFullYear(),
// ) => {
//   if (!monthValue) return [];
//   const monthIndex = MONTH_OPTIONS.findIndex(m => m.value === monthValue);
//   if (monthIndex === -1) return [];
//   return Array.from({ length: getDaysInMonth(monthIndex, year) }, (_, i) => ({
//     label: `${i + 1}`,
//     value: `${i + 1}`,
//   }));
// };

// export const getHumanReadableDate = (dateString: string): string => {
//   if (!dateString) return '';

//   // Parse as literal time — ignore 'Z' / timezone
//   const base = moment(dateString.replace('Z', ''));

//   const now = moment();

//   let label: string;

//   if (base.isSame(now, 'day')) label = 'Today';
//   else if (base.isSame(now.clone().add(1, 'day'), 'day')) label = 'Tomorrow';
//   else if (base.isSame(now.clone().subtract(1, 'day'), 'day'))
//     label = 'Yesterday';
//   else if (base.isSame(now, 'year')) label = base.format('MMM D');
//   else label = base.format('MMM D, YYYY');

//   return `${label} ${base.format('h:mm A')}`;
// };

// Utility: Convert local date & time string to UTC ISO string
export function toUTCISOString(dateStr: string, timeStr: string): string {
  if (!dateStr || !timeStr) return '';

  // Remove non-breaking spaces and trim
  timeStr = timeStr.replace(/\u202F/g, '').trim();

  // Split time and AM/PM
  const [time, modifier] = timeStr.split(/(AM|PM)/i);
  let [hours, minutes] = time.trim().split(':').map(Number);

  if (modifier?.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (modifier?.toUpperCase() === 'AM' && hours === 12) hours = 0;

  // Combine into local datetime string
  const isoLocal = `${dateStr}T${String(hours).padStart(2, '0')}:${String(
    minutes,
  ).padStart(2, '0')}`;

  // Convert to UTC ISO
  const utcISO = new Date(isoLocal).toISOString();

  return utcISO;
}

// Convert UTC ISO string to local date and time
export function fromUTCToLocal(utcISOString: string): {
  date: string;
  time: string;
} {
  if (!utcISOString) return { date: '', time: '' };

  const localDate = new Date(utcISOString);

  // Format local date (YYYY-MM-DD)
  const date = localDate.toISOString().slice(0, 10); // base ISO slice

  // But to ensure correct *local* date (not UTC), use toLocaleDateString:
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;

  // Format local time (e.g., "5:31 AM")
  const formattedTime = localDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return { date: formattedDate, time: formattedTime };
}

export const handleCall = (phoneNumber: string) => {
  if (!phoneNumber) {
    Alert.alert('Error', 'Phone number not available');
    return;
  }

  let phoneUrl = `tel:${phoneNumber}`;
  Linking.canOpenURL(phoneUrl)
    .then(supported => {
      // if (!supported) {
      //   Alert.alert('Error', 'Phone call not supported on this device');
      // } else {
      return Linking.openURL(phoneUrl);
      // }
    })
    .catch(err => console.error('Error opening dialer:', err));
};

export const handleEmail = (email: string, subject?: string, body?: string) => {
  if (!email) {
    Alert.alert('Error', 'Email address not available');
    return;
  }

  let emailUrl = `mailto:${email}`;
  const query = [];

  if (subject) query.push(`subject=${encodeURIComponent(subject)}`);
  if (body) query.push(`body=${encodeURIComponent(body)}`);

  if (query.length) emailUrl += `?${query.join('&')}`;

  Linking.canOpenURL(emailUrl)
    .then(supported => {
      // if (!supported) {
      //   Alert.alert('Error', 'Email app not available on this device');
      // } else {
      return Linking.openURL(emailUrl);
      // }
    })
    .catch(err => console.error('Error opening email app:', err));
};

export const formatDateTime = (isoString: string) => {
  const date = new Date(isoString);

  // Format date like "20 Dec, 2025"
  const formattedDate = date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Format time like "11:15 AM"
  const formattedTime = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return { formattedDate, formattedTime };
};

// export const addDateSeparators = (messages: any[]) => {
//   const finalList: any[] = [];
//   let lastDate = '';

//   messages.forEach((msg) => {
//     const date = moment(msg.createdAt).format('YYYY-MM-DD');

//     if (date !== lastDate) {
//       finalList.push({
//         id: `date-${date}`,
//         type: 'date',
//         dateLabel: moment(date).calendar(null, {
//           sameDay: '[Today]',
//           lastDay: '[Yesterday]',
//           lastWeek: 'dddd',
//           sameElse: 'DD MMM YYYY',
//         }),
//       });
//       lastDate = date;
//     }

//     finalList.push(msg);
//   });

//   return finalList;
// };
