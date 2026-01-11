export interface profileDetailsInterface {
  _id: string;
  full_name: string;
  country_code: string;
  phone: string;
  email: string;
  profile_image: string;
  social_security_number: string;
  dob: string;
  username: string;
  isEmailOtpVerified: boolean;
  isPhoneOtpVerified: boolean;
  isSignupCompleted: boolean;
  isTermsConditionsAggreed: boolean;
  isAvailabilityAdded: boolean;
  isPaymentDone: boolean;
  isApprove: string;
  gender: string;
  isProfileCompleted: boolean;
  user_role: {
    _id: string;
    role: string;
    roleDisplayName: string;
  };
  user_business_info: {
    _id: string;
    business_logo: string;
    business_name: string;
    business_email: string;
    business_phone: string;
    business_sector: {
      _id: string;
      title: string;
    };
    business_website: string;
    representative_name: string;
    representative_title: string;
    street: string;
    city: string;
    state: string;
    zipcode: string;
    isDeleted: boolean;
  };
  createdAt: string;
}
