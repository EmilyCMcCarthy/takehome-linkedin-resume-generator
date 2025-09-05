export interface ProfileDataRes {
    user: string;
    data: ProfileData;
}

export interface ProfileData {
    general:    GeneralProfile;
    education:  Array<Array<string[]>>;
    experience: Array<Array<string[]>>;
    rawContent: RawContent;
}

export interface GeneralProfile {
    name:                  string;
    mainSectionMediumText: string[];
    mainSectionSmallText:  string[];
    profilePicture:        string;
}

export interface RawContent {
    main:       string;
    education:  string;
    experience: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  loginUrl: string;
  usernameSelector?: string;
  passwordSelector?: string;
  rememberMeSelector?: string;
  submitSelector?: string;
  successIndicator?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface LoginOptions {
  forceRelogin?: boolean;
  validateSession?: boolean;
}
