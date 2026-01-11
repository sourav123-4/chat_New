import { Platform } from 'react-native';

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validMinLength = /.{8,}/;

const validateName = (name: string) => {
  const nameRegex = /^[A-Za-z]+$/;
  return nameRegex.test(name);
};

const validateFullName = (name: string) => {
  const nameRegex = /^[A-Za-z\s]+$/;
  return nameRegex.test(name?.trim());
};

const validateUserName = (name: string) => {
  // Updated regex to allow letters and numbers only
  const nameRegex = /^[A-Za-z0-9]+$/;
  return nameRegex.test(name);
};

const validatePassword = (password: string) => {
  const isValid = /(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])/;
  return isValid.test(password);
};

const validPhoneNumber = (phone: string) => {
  const validPhoneNum = /^[0-9]{10}$/;
  return validPhoneNum.test(phone);
};

const validZipcode = (zip: string) => {
  const validZip = /^\d{5,6}$/;
  return validZip.test(zip);
};

const validWebUrl = (zip: string) => {
  const validUrl =
    /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})(:[0-9]{1,5})?(\/[^\s]*)?$/;
  return validUrl.test(zip);
};

const capitalizeString = (str: string) => {
  return str
    .toLowerCase() // Convert the entire string to lowercase
    .replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()); // Capitalize the first letter of each word
};

const formatString = (str: string) => {
  if (!str) return str;

  const lowerCaseStr = str.toLowerCase(); // Convert entire string to lowercase
  return lowerCaseStr.charAt(0).toUpperCase() + lowerCaseStr.slice(1); // Capitalize the first letter
};

function isValidPhoneNumber(phoneNumber: string) {
  // This regex checks that the number is 10 digits long and not all zeros.
  const regex = /^(?!0{10})\d{10}$/;
  return regex.test(phoneNumber);
}

const countUppercase = (text: string) => {
  return (text?.match(/[A-Z]/g) || []).length;
};

const getFirstName = (fullName: string) => {
  if (!fullName) return '';
  const nameParts = fullName.trim().split(' ');
  return nameParts[0];
};

const createFrom = (payload: object) => {
  let formData: any = new FormData();

  (Object.keys(payload) as Array<keyof typeof payload>).forEach(key => {
    const value: any = payload[key];

    if (value && typeof value === 'object' && !(value instanceof Blob)) {
      if (value.uri && value.name && value.type) {
        formData.append(key, {
          uri: value.uri,
          name: value.name,
          type: value.type,
        });
      } else {
        formData.append(key, JSON.stringify(value));
      }
    } else {
      formData.append(key, value);
    }
  });

  return formData;
};

const decodeHTMLEntities = (text: string) => {
  return text.replace(/&lt;/g, '<');
};

const isArray = (variable: []) => Array.isArray(variable);

function isObjectEmpty(obj: object) {
  return obj && typeof obj === 'object' && Object.keys(obj).length === 0;
}

function isArrayEmpty(arr: any[]) {
  return Array.isArray(arr) && arr.length === 0;
}

function isIos() {
  return Platform.OS === 'ios';
}

export {
  isIos,
  validateName,
  validateEmail,
  validWebUrl,
  countUppercase,
  validMinLength,
  validZipcode,
  validPhoneNumber,
  validatePassword,
  createFrom,
  decodeHTMLEntities,
  isArray,
  isValidPhoneNumber,
  formatString,
  capitalizeString,
  isObjectEmpty,
  isArrayEmpty,
  getFirstName,
  validateUserName,
  validateFullName,
};
