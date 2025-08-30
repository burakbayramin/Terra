import React, { useState, useEffect } from "react";
import { colors } from "@/constants/colors";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Vibration,
  Dimensions,
} from "react-native";
import { Audio } from "expo-av";
import { CameraView, useCameraPermissions, type FlashMode } from "expo-camera";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

interface WhistlePageProps {}

const WhistlePage: React.FC<WhistlePageProps> = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [soundType, setSoundType] = useState<string>("whistle");
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isFlashlightOn, setIsFlashlightOn] = useState<boolean>(false);
  const [permission, requestPermission] = useCameraPermissions();

  const { width } = Dimensions.get("window");

  // Ses dosyaları
  const soundFiles = {
    whistle: require("@/assets/sounds/whistle.mp3"),
    mors: require("@/assets/sounds/mors.mp3"),
    siren: require("@/assets/sounds/siren.mp3"),
  };

  // Ses izinlerini ayarla
  useEffect(() => {
    setupAudio();
    return () => {
      if (sound) {
        sound.unloadAsync().catch(console.error);
      }
      Vibration.cancel();

      // Feneri kapat (opsiyonel)
      if (isFlashlightOn) {
        setIsFlashlightOn(false);
      }
    };
  }, [sound, isFlashlightOn]);

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error("Ses izni alınamadı:", error);
      Alert.alert("Hata", "Ses izni gerekli");
    }
  };

  const startSound = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        soundFiles[soundType as keyof typeof soundFiles],
        {
          volume: volume,
          isLooping: true,
          shouldPlay: true,
        }
      );

      setSound(newSound);
      setIsPlaying(true);

      // Titreşim ekle
      Vibration.vibrate([500, 500], true);
    } catch (error) {
      console.error("Ses başlatılamadı:", error);
      Alert.alert(
        "Hata",
        "Ses dosyası bulunamadı. Lütfen assets/sounds/ klasörüne ses dosyalarını ekleyin."
      );
      // Alternatif olarak sadece titreşim kullan
      Vibration.vibrate([500, 500], true);
      setIsPlaying(true);
    }
  };

  const stopSound = async () => {
    try {
      if (sound) {
        // Ses durdurma işlemi için timeout ekle
        const stopPromise = sound.stopAsync();
        const stopTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Stop timeout")), 2000)
        );

        await Promise.race([stopPromise, stopTimeout]);

        const unloadPromise = sound.unloadAsync();
        const unloadTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Unload timeout")), 2000)
        );

        await Promise.race([unloadPromise, unloadTimeout]);
        setSound(null);
      }

      Vibration.cancel();
      setIsPlaying(false);
    } catch (error) {
      console.error("Ses durdurulamadı:", error);
      // Hata durumunda state'i zorla temizle
      setSound(null);
      setIsPlaying(false);
      Vibration.cancel();
    }
  };

  const toggleSound = async () => {
    if (isPlaying) {
      await stopSound();
    } else {
      await startSound();
    }
  };

  // Zorla ses durdurma fonksiyonu
  const forceStop = async () => {
    try {
      if (sound) {
        // Zorla durdurma için timeout kullanma
        try {
          await sound.stopAsync();
        } catch (e) {}

        try {
          await sound.unloadAsync();
        } catch (e) {}
      }

      // State'i hemen temizle
      setSound(null);
      setIsPlaying(false);
      Vibration.cancel();
    } catch (error) {
      console.error("Force stop hatası:", error);
      // Hata durumunda da state'i temizle
      setSound(null);
      setIsPlaying(false);
      Vibration.cancel();
    }
  };

  // Fener açma/kapama fonksiyonu (kamera önizlemesi göstermeden)
  const toggleFlashlight = async () => {
    try {
      // İzin yoksa iste
      if (!permission?.granted) {
        const res = await requestPermission();
        if (!res.granted) {
          Alert.alert(
            "Kamera İzni Gerekli",
            "Feneri kullanmak için kamera donanımına erişim izni gerekir."
          );
          return;
        }
      }

      // Haptic feedback
      if (isFlashlightOn) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Hidden CameraView üzerinden torch'u değiştir
      setIsFlashlightOn((prev) => !prev);
    } catch (error) {
      console.error("Fener hatası:", error);
    }
  };

  const changeSoundType = async (newType: string) => {
    // Eğer ses çalıyorsa önce durdur
    if (isPlaying) {
      await stopSound();
    }

    // Ses tipini değiştir
    setSoundType(newType);

    // Yeni ses otomatik başlamayacak, kullanıcı manuel olarak başlatmalı
  };

  const changeVolume = (direction: "up" | "down") => {
    const step = 0.1;
    const newVolume =
      direction === "up"
        ? Math.min(1, volume + step)
        : Math.max(0, volume - step);

    setVolume(newVolume);

    if (sound && isPlaying) {
      sound.setVolumeAsync(newVolume);
    }
  };

  const soundOptions = [
    {
      value: "whistle",
      label: "Düdük",
      icon: "radio-outline",
      description: "Klasik acil durum düdüğü",
      color: "#dc2626",
    },
    {
      value: "mors",
      label: "Mors",
      icon: "flash-outline",
      description: "Mors kodu SOS sinyali",
      color: "#f59e0b",
    },
    {
      value: "siren",
      label: "Siren",
      icon: "warning-outline",
      description: "Acil durum siren sesi",
      color: "#7c3aed",
    },
  ];

  const currentSoundOption = soundOptions.find(
    (option) => option.value === soundType
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Gizli kamera görünümü: Sadece torch kontrolü için mount edilir */}
      {permission?.granted && (
        <CameraView
          facing="back"
          // "torch" sürekli açık ışık sağlar; kapalıyken "off"
          flash={(isFlashlightOn ? "torch" : "off") as FlashMode}
          // UI'da görünmemesi için tamamen gizli boyut ve saydamlık
          style={{ width: 1, height: 1, opacity: 0, position: "absolute" }}
        />
      )}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="warning" size={32} color="#dc2626" />
            <Text style={styles.title}>Deprem Düdüğü</Text>
          </View>
          {/* <Text style={styles.subtitle}>Acil durum uyarı sistemi</Text> */}
        </View>

        {/* Main Whistle Button */}
        <View style={styles.whistleContainer}>
          <TouchableOpacity
            style={[
              styles.whistleButton,
              {
                backgroundColor: currentSoundOption?.color || "#dc2626",
                // Aktif olduğunda daha parlak, pasif olduğunda daha soluk
                opacity: isPlaying ? 1 : 0.8,
                // Seçilen ses tipinin rengiyle uyumlu gölge
                shadowColor: currentSoundOption?.color || "#dc2626",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isPlaying ? 0.4 : 0.2,
                shadowRadius: isPlaying ? 12 : 8,
                elevation: isPlaying ? 12 : 8,
              },
            ]}
            onPress={toggleSound}
            onLongPress={forceStop}
            activeOpacity={0.8}
          >
            <View style={styles.whistleButtonContent}>
              <Ionicons
                name={
                  isPlaying
                    ? "pause"
                    : (currentSoundOption?.icon as any) || "volume-high"
                }
                size={48}
                color="white"
              />
              <Text style={styles.whistleButtonText}>
                {isPlaying ? "DURDUR" : currentSoundOption?.label.toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Force Stop Hint */}
          {isPlaying && (
            <Text style={styles.forceStopHint}>Uzun basarak zorla durdur</Text>
          )}

          {/* Current Settings Display */}
          <View style={styles.currentSettings}>
            <Text style={styles.settingText}>
              Ses Tipi:{" "}
              <Text style={styles.settingValue}>
                {currentSoundOption?.label}
              </Text>
            </Text>
            <Text style={styles.settingText}>
              Ses Seviyesi:{" "}
              <Text style={styles.settingValue}>
                {Math.round(volume * 100)}%
              </Text>
            </Text>
            <Text style={styles.settingDescription}>
              {currentSoundOption?.description}
            </Text>
          </View>
        </View>

        {/* Volume Controls */}
        <View style={styles.volumeContainer}>
          <Text style={styles.volumeTitle}>Ses Seviyesi</Text>
          <View style={styles.volumeControls}>
            <TouchableOpacity
              style={[
                styles.volumeButton,
                volume <= 0 && styles.volumeButtonDisabled,
              ]}
              onPress={() => changeVolume("down")}
              disabled={volume <= 0}
            >
              <Ionicons
                name="volume-low"
                size={24}
                color={volume <= 0 ? "#9ca3af" : "#374151"}
              />
              <Text
                style={[
                  styles.volumeButtonText,
                  volume <= 0 && styles.volumeButtonTextDisabled,
                ]}
              >
                Azalt
              </Text>
            </TouchableOpacity>

            <View style={styles.volumeDisplay}>
              <Text style={styles.volumePercentage}>
                {Math.round(volume * 100)}%
              </Text>
              <View style={styles.volumeBar}>
                <View
                  style={[
                    styles.volumeBarFill,
                    {
                      width: `${volume * 100}%`,
                      backgroundColor: currentSoundOption?.color,
                    },
                  ]}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.volumeButton,
                volume >= 1 && styles.volumeButtonDisabled,
              ]}
              onPress={() => changeVolume("up")}
              disabled={volume >= 1}
            >
              <Ionicons
                name="volume-high"
                size={24}
                color={volume >= 1 ? "#9ca3af" : "#374151"}
              />
              <Text
                style={[
                  styles.volumeButtonText,
                  volume >= 1 && styles.volumeButtonTextDisabled,
                ]}
              >
                Artır
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sound Type Selection */}
        <View style={styles.soundTypeContainer}>
          <Text style={styles.soundTypeTitle}>Ses Tipi Seçimi</Text>

          {/* Active Sound Type Info */}
          {isPlaying && (
            <View style={styles.activeSoundInfo}>
              <Ionicons name="information-circle" size={16} color="#f59e0b" />
              <Text style={styles.activeSoundInfoText}>
                Aktif ses: {currentSoundOption?.label} - Yeni ses tipi
                seçildiğinde otomatik durur
              </Text>
            </View>
          )}

          <View style={styles.soundTypeGrid}>
            {soundOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.soundTypeButton,
                  soundType === option.value && styles.soundTypeButtonActive,
                  {
                    borderColor: option.color,
                    borderWidth: soundType === option.value ? 3 : 2,
                    shadowColor: option.color,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: soundType === option.value ? 0.3 : 0.1,
                    shadowRadius: soundType === option.value ? 8 : 4,
                    elevation: soundType === option.value ? 8 : 4,
                  },
                ]}
                onPress={() => changeSoundType(option.value)}
              >
                <View
                  style={[
                    styles.soundTypeIcon,
                    soundType === option.value && {
                      backgroundColor: option.color,
                    },
                  ]}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={32}
                    color={soundType === option.value ? "white" : option.color}
                  />
                </View>
                <Text
                  style={[
                    styles.soundTypeLabel,
                    soundType === option.value && {
                      color: option.color,
                      fontWeight: "600",
                    },
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.soundTypeDescription}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Emergency Actions */}
        <View style={styles.emergencyContainer}>
          <Text style={styles.emergencyTitle}>Acil Durum Aksiyonları</Text>
          <View style={styles.emergencyGrid}>
            <TouchableOpacity
              style={styles.emergencyButton}
              onPress={() => {
                Vibration.vibrate([100, 100, 100, 100, 100]);
                Alert.alert(
                  "Konum Paylaşımı",
                  "Acil durum konumunuz paylaşılacak"
                );
              }}
            >
              <Ionicons name="location" size={24} color="#dc2626" />
              <Text style={styles.emergencyButtonText}>Konum Paylaş</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.emergencyButton,
                isFlashlightOn && styles.emergencyButtonActive,
              ]}
              onPress={toggleFlashlight}
            >
              <Ionicons
                name={isFlashlightOn ? "flashlight" : "flashlight-outline"}
                size={24}
                color={isFlashlightOn ? "#ffffff" : "#f59e0b"}
              />
              <Text
                style={[
                  styles.emergencyButtonText,
                  isFlashlightOn && styles.emergencyButtonTextActive,
                ]}
              >
                Fener
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.emergencyButton}
              onPress={() => {
                Alert.alert("Acil Arama", "Acil durum numarası aranacak");
              }}
            >
              <Ionicons name="call" size={24} color="#059669" />
              <Text style={styles.emergencyButtonText}>Acil Arama</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Kullanım Talimatları:</Text>
          <Text style={styles.instructionText}>
            • Ana butona basarak seçili sesi başlatın/durdurun
          </Text>
          <Text style={styles.instructionText}>
            • Ses durdurulamıyorsa uzun basarak zorla durdurun
          </Text>
          <Text style={styles.instructionText}>
            • Ses tipi değiştirildiğinde önceki ses otomatik durur
          </Text>
          <Text style={styles.instructionText}>
            • Ses seviyesini + ve - butonlarıyla ayarlayın
          </Text>
          <Text style={styles.instructionText}>
            • Acil durum butonlarını kullanarak ek aksiyonlar alın
          </Text>
          <Text style={styles.instructionText}>
            • Fener butonuna basarak telefon fenerini açıp kapatın
          </Text>
          <Text style={styles.instructionText}>
            • Fener açılamadığında simülasyon modu devreye girer
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Bold",
  },
  subtitle: {
    fontSize: 14,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
  },
  whistleContainer: {
    backgroundColor: colors.light.background,
    borderRadius: 24,
    padding: 32,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: "center",
  },
  whistleButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  whistleButtonContent: {
    alignItems: "center",
  },
  whistleButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "NotoSans-Bold",
    marginTop: 8,
  },
  currentSettings: {
    marginTop: 24,
    alignItems: "center",
  },
  settingText: {
    fontSize: 14,
    color: colors.light.textSecondary,
    marginBottom: 4,
    fontFamily: "NotoSans-Regular",
  },
  settingValue: {
    fontWeight: "600",
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Medium",
  },
  settingDescription: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 8,
    textAlign: "center",
    fontStyle: "italic",
    fontFamily: "NotoSans-Regular",
  },
  volumeContainer: {
    backgroundColor: colors.light.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  volumeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.light.textPrimary,
    marginBottom: 16,
    textAlign: "center",
    fontFamily: "NotoSans-Medium",
  },
  volumeControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  volumeButton: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    minWidth: 70,
  },
  volumeButtonDisabled: {
    backgroundColor: "#f9fafb",
  },
  volumeButtonText: {
    fontSize: 12,
    color: colors.light.textPrimary,
    marginTop: 4,
    fontFamily: "NotoSans-Regular",
  },
  volumeButtonTextDisabled: {
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
  },
  volumeDisplay: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  volumePercentage: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.light.textPrimary,
    marginBottom: 8,
    fontFamily: "NotoSans-Medium",
  },
  volumeBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  volumeBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  soundTypeContainer: {
    backgroundColor: colors.light.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  soundTypeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.light.textPrimary,
    marginBottom: 16,
    textAlign: "center",
    fontFamily: "NotoSans-Medium",
  },
  soundTypeGrid: {
    gap: 12,
  },
  soundTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
  },
  soundTypeButtonActive: {
    backgroundColor: "#f0f9ff",
  },
  soundTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    marginRight: 16,
  },
  soundTypeLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.light.textPrimary,
    flex: 1,
    fontFamily: "NotoSans-Medium",
  },
  soundTypeDescription: {
    fontSize: 12,
    color: colors.light.textSecondary,
    marginTop: 4,
    flex: 2,
    fontFamily: "NotoSans-Regular",
  },
  emergencyContainer: {
    backgroundColor: colors.light.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.light.textPrimary,
    marginBottom: 16,
    textAlign: "center",
    fontFamily: "NotoSans-Medium",
  },
  emergencyGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  emergencyButton: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    minWidth: 80,
  },
  emergencyButtonActive: {
    backgroundColor: "#f59e0b",
  },
  emergencyButtonText: {
    fontSize: 12,
    color: colors.light.textPrimary,
    marginTop: 8,
    textAlign: "center",
    fontWeight: "500",
    fontFamily: "NotoSans-Medium",
  },
  emergencyButtonTextActive: {
    color: "#ffffff",
  },
  instructions: {
    backgroundColor: "#fef3c7",
    borderColor: colors.gradientTwo,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400e",
    marginBottom: 8,
    fontFamily: "NotoSans-Medium",
  },
  instructionText: {
    fontSize: 12,
    color: "#b45309",
    marginBottom: 4,
    fontFamily: "NotoSans-Regular",
  },
  fileRequirements: {
    backgroundColor: "#f0f9ff",
    borderColor: "#3b82f6",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  fileRequirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: 8,
    fontFamily: "NotoSans-Medium",
  },
  fileRequirementText: {
    fontSize: 12,
    color: "#1e40af",
    marginBottom: 4,
    fontFamily: "NotoSans-Regular",
  },
  forceStopHint: {
    fontSize: 12,
    color: "#dc2626",
    marginTop: 8,
    textAlign: "center",
    fontStyle: "italic",
    fontFamily: "NotoSans-Regular",
  },
  activeSoundInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  activeSoundInfoText: {
    fontSize: 12,
    color: "#92400e",
    fontFamily: "NotoSans-Medium",
    flex: 1,
  },
});

export default WhistlePage;
