import React, { createContext, useContext, useState } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, options?: any) => string;
}

const translations = {
  en: {
    common: {
      continue: 'Continue',
      cancel: 'Cancel',
      confirm: 'Confirm',
      back: 'Back',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      loading: 'Loading...',
    },
    auth: {
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      welcome: 'Welcome to DeliveryApp',
      loginPrompt: 'Sign in to your account',
      registerPrompt: 'Create a new account',
    },
    home: {
      title: 'Delivery App',
      subtitle: 'Fast and reliable delivery service',
      quickOrder: 'Quick Order',
      trackPackage: 'Track Package',
    },
    order: {
      step1Title: 'Sender & Recipient Info',
      step2Title: 'Choose Delivery Method',
      senderInfo: 'Sender Information',
      recipientInfo: 'Recipient Information',
      parcelInfo: 'Parcel Information',
      weight: 'Weight (kg)',
      dimensions: 'Dimensions (cm)',
      value: 'Value ($)',
      description: 'Description',
      fragile: 'Fragile',
      robot: 'Ground Robot',
      drone: 'Drone',
      recommendations: 'Recommended Options',
    }
  },
  zh: {
    common: {
      continue: '继续',
      cancel: '取消',
      confirm: '确认',
      back: '返回',
      save: '保存',
      edit: '编辑',
      delete: '删除',
      loading: '加载中...',
    },
    auth: {
      login: '登录',
      register: '注册',
      email: '邮箱',
      password: '密码',
      name: '姓名',
      welcome: '欢迎使用配送应用',
      loginPrompt: '登录您的账户',
      registerPrompt: '创建新账户',
    },
    home: {
      title: '配送应用',
      subtitle: '快速可靠的配送服务',
      quickOrder: '快速下单',
      trackPackage: '追踪包裹',
    },
    order: {
      step1Title: '寄件人和收件人信息',
      step2Title: '选择配送方式',
      senderInfo: '寄件人信息',
      recipientInfo: '收件人信息',
      parcelInfo: '包裹信息',
      weight: '重量 (公斤)',
      dimensions: '尺寸 (厘米)',
      value: '价值 (美元)',
      description: '描述',
      fragile: '易碎品',
      robot: '地面机器人',
      drone: '无人机',
      recommendations: '推荐选项',
    }
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState('en');

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
  };

  const t = (key: string, options?: any) => {
    const keys = key.split('.');
    let result: any = translations[language as keyof typeof translations];
    
    for (const k of keys) {
      result = result?.[k];
    }
    
    return result || key;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};