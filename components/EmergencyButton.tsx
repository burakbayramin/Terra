import React, { useState, useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { supabase } from '@/lib/supabase'; // Supabase client'ınızın yolu

const EmergencyButton = () => {
  const [loading, setLoading] = useState(false);

  // Supabase'den mevcut kullanıcının bilgilerini al
  const getUserData = async () => {
    try {
      // Mevcut authenticate olmuş kullanıcıyı al
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('emergency_phone, name, surname, city, district')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Kullanıcı bilgileri alınamadı:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Veritabanı hatası:', error);
      return null;
    }
  };



  // SMS gönderme fonksiyonu
  const sendEmergencySMS = async () => {
    try {
      setLoading(true);

      // Kullanıcı bilgilerini al
      const userData = await getUserData();
      if (!userData) {
        Alert.alert('Hata', 'Kullanıcı bilgileri bulunamadı.');
        return;
      }

      const { emergency_phone, name, surname, city, district } = userData;

      if (!emergency_phone) {
        Alert.alert('Hata', 'Acil durum numarası bulunamadı. Lütfen profil ayarlarınızdan acil durum kişisini ekleyin.');
        return;
      }

      // SMS mesajını oluştur
      const message = `ACİL DURUM! Ben ${name} ${surname}. Tehlikedeyim! Kayıtlı adresim: ${city} / ${district}.`;

      // Telefon numarasını formatla (başında + yoksa ekle)
      let phoneNumber = emergency_phone;
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+90' + phoneNumber; // Türkiye kodu ekle
      }

      // SMS URL'ini oluştur
      let smsUrl;
      if (Platform.OS === 'ios') {
        smsUrl = `sms:${phoneNumber}&body=${encodeURIComponent(message)}`;
      } else {
        smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
      }

      // SMS uygulamasını aç
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) {
        await Linking.openURL(smsUrl);
      } else {
        Alert.alert('Hata', 'SMS uygulaması açılamadı');
      }

    } catch (error) {
      console.error('SMS gönderme hatası:', error);
      Alert.alert('Hata', 'SMS gönderilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return {
    sendEmergencySMS,
    loading
  };
};

export default EmergencyButton;