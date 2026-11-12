import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const defaultNS = 'common';

export const resources = {
  en: {
    common: {
      appName: 'IndustriaLink',
      findJobs: 'Find Industrial Jobs',
      applications: 'My Applications',
      savedJobs: 'Saved Jobs',
      profile: 'Worker Profile',
      applyNow: '1-Tap Apply Now',
      applied: 'Applied',
      shortlisted: 'Shortlisted',
      interview: 'Interview Scheduled',
      hired: 'Hired',
      rejected: 'Rejected',
      dayShift: 'Day Shift',
      nightShift: 'Night Shift',
      rotationalShift: 'Rotational Shift',
      verifiedEmployer: 'Verified Employer',
      perMonth: '/ month',
      openings: 'Openings',
      postJob: 'Post a New Industrial Job',
      activeJobs: 'Active Jobs',
      totalApplicants: 'Total Applicants',
      pendingReview: 'Pending Review',
      callCandidate: 'Call Candidate',
      scheduleInterview: 'Schedule Factory Interview',
      verificationsQueue: 'Verifications Queue',
      approve: 'Approve',
      reject: 'Reject',
      offlineNotice: 'Offline Mode — Showing cached jobs. Reconnect to sync.',
    },
  },
  hi: {
    common: {
      appName: 'इंडस्ट्रियालिंक',
      findJobs: 'कारखाना नौकरियां खोजें',
      applications: 'मेरे आवेदन',
      savedJobs: 'सहेजी गई नौकरियां',
      profile: 'कामगार प्रोफ़ाइल',
      applyNow: '1-टैप अभी आवेदन करें',
      applied: 'आवेदन किया',
      shortlisted: 'शॉर्टलिस्ट हुआ',
      interview: 'इंटरव्यू तय हुआ',
      hired: 'नौकरी मिली (Hired)',
      rejected: 'अस्वीकृत',
      dayShift: 'दिन की शिफ्ट',
      nightShift: 'रात की शिफ्ट',
      rotationalShift: 'रोटेशनल शिफ्ट',
      verifiedEmployer: 'सत्यापित कारखाना',
      perMonth: '/ महीना',
      openings: 'पद खाली हैं',
      postJob: 'नई औद्योगिक नौकरी पोस्ट करें',
      activeJobs: 'सक्रिय नौकरियां',
      totalApplicants: 'कुल आवेदक',
      pendingReview: 'समीक्षा बाकी',
      callCandidate: 'उम्मीदवार को कॉल करें',
      scheduleInterview: 'प्लांट इंटरव्यू तय करें',
      verificationsQueue: 'प्रमाणपत्र सत्यापन',
      approve: 'मंजूर करें',
      reject: 'अस्वीकार करें',
      offlineNotice: 'ऑफ़लाइन मोड — सहेजी गई नौकरियां दिख रही हैं।',
    },
  },
  or: {
    common: {
      appName: 'ଇଣ୍ଡଷ୍ଟ୍ରିଆଲିଙ୍କ୍',
      findJobs: 'କାରଖାନା ଚାକିରି ଖୋଜନ୍ତୁ',
      applications: 'ମୋର ଆବେଦନ',
      savedJobs: 'ସାଇତା ଚାକିରି',
      profile: 'କାରିଗର ପ୍ରୋଫାଇଲ୍',
      applyNow: '୧-ଟ୍ୟାପ୍ ଏବେ ଆବେଦନ କରନ୍ତୁ',
      applied: 'ଆବେଦନ କରାଗଲା',
      shortlisted: 'ଚୟନ କରାଗଲା (Shortlisted)',
      interview: 'ଇଣ୍ଟରଭ୍ୟୁ ସ୍ଥିର ହେଲା',
      hired: 'ଚାକିରି ମିଳିଲା (Hired)',
      rejected: 'ଖାରଜ',
      dayShift: 'ଦିନ ସିଫ୍ଟ',
      nightShift: 'ରାତି ସିଫ୍ଟ',
      rotationalShift: 'ପର୍ଯ୍ୟାୟକ୍ରମିକ ସିଫ୍ଟ',
      verifiedEmployer: 'ଯାଞ୍ଚିତ କମ୍ପାନୀ',
      perMonth: '/ ମାସିକ',
      openings: 'ଖାଲି ପଦବୀ',
      postJob: 'ନୂଆ ନିଯୁକ୍ତି ପୋଷ୍ଟ କରନ୍ତୁ',
      activeJobs: 'ଚାଲୁ ଥିବା ଚାକିରି',
      totalApplicants: 'ମୋଟ ଆବେଦନକାରୀ',
      pendingReview: 'ଯାଞ୍ଚ ବାକି ଅଛି',
      callCandidate: 'ପ୍ରାର୍ଥୀଙ୍କୁ ଫୋନ୍ କରନ୍ତୁ',
      scheduleInterview: 'କାରଖାନା ଇଣ୍ଟରଭ୍ୟୁ ସମୟ ସ୍ଥିର କରନ୍ତୁ',
      verificationsQueue: 'ସାର୍ଟିଫିକେଟ୍ ଯାଞ୍ଚ ତାଲିକା',
      approve: 'ଅନୁମୋଦନ କରନ୍ତୁ',
      reject: 'ଅଗ୍ରାହ୍ୟ କରନ୍ତୁ',
      offlineNotice: 'ଅଫଲାଇନ୍ ମୋଡ୍ — ଡାଟା ଲୋକାଲ୍ ଡିଭାଇସରେ ଉପଲବ୍ଧ।',
    },
  },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  defaultNS,
  interpolation: {
    escapeValue: false,
  },
});

export function getLang(): string {
  return i18n.language || 'en';
}

/**
 * Universal translation function matching the web dashboard convention:
 * `t("Welcome back, {name}", { name: "Ramesh" })`
 */
export function t(key: string, params?: Record<string, string | number>): string {
  let text = i18n.t(key, { defaultValue: key });
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}

export default i18n;
