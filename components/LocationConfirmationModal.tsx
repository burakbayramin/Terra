import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { colors } from "@/constants/colors";

interface LocationConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (locationInfo: {
    latitude: number;
    longitude: number;
    city?: string;
    district?: string;
    address?: string;
  }) => void;
}

interface LocationInfo {
  latitude: number;
  longitude: number;
  city?: string;
  district?: string;
  address?: string;
}

const LocationConfirmationModal: React.FC<LocationConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      getCurrentLocation();
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      // Konum izni kontrol et
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        if (newStatus !== "granted") {
          setError("Konum izni reddedildi. Ayarlardan konum iznini etkinleştirin.");
          setLoading(false);
          return;
        }
      }

      // Mevcut konumu al
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 1,
      });

      const { latitude, longitude } = location.coords;

      // Reverse geocoding ile adres bilgisi al
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      let addressInfo = {};
      if (reverseGeocode.length > 0) {
        const locationData = reverseGeocode[0];
        console.log("Raw location data from reverse geocoding:", locationData);
        
        // Şehir ve ilçe bilgilerini düzgün şekilde ayır
        let city = locationData.city || locationData.subregion;
        let district = locationData.district || locationData.region;
        
        console.log("Initial city:", city, "district:", district);
        
        // Türkiye'deki büyük şehirlerin ilçelerini kontrol et
        const cityDistrictMap: { [key: string]: string } = {
          // İstanbul ilçeleri
          'Esenyurt': 'İstanbul', 'Kadıköy': 'İstanbul', 'Beşiktaş': 'İstanbul', 
          'Şişli': 'İstanbul', 'Beyoğlu': 'İstanbul', 'Fatih': 'İstanbul', 
          'Üsküdar': 'İstanbul', 'Maltepe': 'İstanbul', 'Pendik': 'İstanbul', 
          'Kartal': 'İstanbul', 'Ataşehir': 'İstanbul', 'Ümraniye': 'İstanbul', 
          'Sarıyer': 'İstanbul', 'Bakırköy': 'İstanbul', 'Kıraç': 'İstanbul',
          'Avcılar': 'İstanbul', 'Büyükçekmece': 'İstanbul', 'Çatalca': 'İstanbul', 
          'Silivri': 'İstanbul', 'Şile': 'İstanbul', 'Tuzla': 'İstanbul',
          'Sultanbeyli': 'İstanbul', 'Sancaktepe': 'İstanbul', 'Başakşehir': 'İstanbul',
          'Esenler': 'İstanbul', 'Güngören': 'İstanbul', 'Kağıthane': 'İstanbul',
          'Sultangazi': 'İstanbul', 'Gaziosmanpaşa': 'İstanbul', 'Bayrampaşa': 'İstanbul',
          'Zeytinburnu': 'İstanbul', 'Küçükçekmece': 'İstanbul', 'Eyüpsultan': 'İstanbul',
          
          // Ankara ilçeleri
          'Çankaya': 'Ankara', 'Keçiören': 'Ankara', 'Mamak': 'Ankara',
          'Yenimahalle': 'Ankara', 'Etimesgut': 'Ankara', 'Sincan': 'Ankara',
          'Altındağ': 'Ankara', 'Gölbaşı': 'Ankara', 'Polatlı': 'Ankara',
          'Kazan': 'Ankara', 'Akyurt': 'Ankara', 'Ayaş': 'Ankara',
          
          // İzmir ilçeleri
          'Konak': 'İzmir', 'Bornova': 'İzmir', 'Karşıyaka': 'İzmir',
          'Buca': 'İzmir', 'Çiğli': 'İzmir', 'Bayraklı': 'İzmir',
          'Gaziemir': 'İzmir', 'Karabağlar': 'İzmir', 'Narlıdere': 'İzmir',
          'Güzelbahçe': 'İzmir', 'Urla': 'İzmir', 'Seferihisar': 'İzmir',
          
          // Bursa ilçeleri
          'Nilüfer': 'Bursa', 'Osmangazi': 'Bursa', 'Yıldırım': 'Bursa',
          'Mudanya': 'Bursa', 'Gürsu': 'Bursa', 'Kestel': 'Bursa',
          'İnegöl': 'Bursa', 'Gemlik': 'Bursa', 'Orhangazi': 'Bursa',
          
          // Antalya ilçeleri
          'Muratpaşa': 'Antalya', 'Kepez': 'Antalya', 'Döşemealtı': 'Antalya',
          'Aksu': 'Antalya', 'Konyaaltı': 'Antalya', 'Manavgat': 'Antalya',
          'Alanya': 'Antalya', 'Serik': 'Antalya', 'Kaş': 'Antalya',
          
          // Adana ilçeleri
          'Seyhan': 'Adana', 'Çukurova': 'Adana', 'Sarıçam': 'Adana',
          'Yüreğir': 'Adana', 'Ceyhan': 'Adana', 'Feke': 'Adana',
          
          // Konya ilçeleri
          'Selçuklu': 'Konya', 'Meram': 'Konya', 'Karatay': 'Konya',
          'Cihanbeyli': 'Konya', 'Ereğli': 'Konya', 'Akşehir': 'Konya',
          
          // Gaziantep ilçeleri
          'Şahinbey': 'Gaziantep', 'Şehitkamil': 'Gaziantep', 'Oğuzeli': 'Gaziantep',
          'Nizip': 'Gaziantep', 'İslahiye': 'Gaziantep', 'Araban': 'Gaziantep',
          
          // Mersin ilçeleri
          'Akdeniz': 'Mersin', 'Yenişehir': 'Mersin', 'Toroslar': 'Mersin',
          'Mezitli': 'Mersin', 'Tarsus': 'Mersin', 'Erdemli': 'Mersin',
          'Silifke': 'Mersin', 'Anamur': 'Mersin', 'Mut': 'Mersin',
          
          // Diyarbakır ilçeleri
          'Bağlar': 'Diyarbakır', 'Kayapınar': 'Diyarbakır', 'Sur': 'Diyarbakır',
          'Ergani': 'Diyarbakır', 'Bismil': 'Diyarbakır', 'Çermik': 'Diyarbakır',
          'Çınar': 'Diyarbakır', 'Dicle': 'Diyarbakır',
          
          // Samsun ilçeleri
          'İlkadım': 'Samsun', 'Canik': 'Samsun', 'Tekkeköy': 'Samsun',
          'Atakum': 'Samsun', 'Bafra': 'Samsun', 'Çarşamba': 'Samsun',
          'Terme': 'Samsun', 'Vezirköprü': 'Samsun', 'Havza': 'Samsun',
          
          // Denizli ilçeleri
          'Pamukkale': 'Denizli', 'Merkezefendi': 'Denizli', 'Tavas': 'Denizli',
          'Çivril': 'Denizli', 'Sarayköy': 'Denizli', 'Buldan': 'Denizli',
          
          // Eskişehir ilçeleri
          'Tepebaşı': 'Eskişehir', 'Odunpazarı': 'Eskişehir', 'Sivrihisar': 'Eskişehir',
          'Seyitgazi': 'Eskişehir', 'Mihalıççık': 'Eskişehir', 'Alpu': 'Eskişehir',
          
          // Kayseri ilçeleri
          'Melikgazi': 'Kayseri', 'Kocasinan': 'Kayseri', 'Talas': 'Kayseri',
          'Develi': 'Kayseri', 'Yahyalı': 'Kayseri', 'Bünyan': 'Kayseri',
          
          // Urfa ilçeleri
          'Eyyübiye': 'Şanlıurfa', 'Haliliye': 'Şanlıurfa', 'Karaköprü': 'Şanlıurfa',
          'Siverek': 'Şanlıurfa', 'Viranşehir': 'Şanlıurfa', 'Suruç': 'Şanlıurfa',
          
          // Malatya ilçeleri
          'Battalgazi': 'Malatya', 'Yeşilyurt': 'Malatya', 'Darende': 'Malatya',
          'Hekimhan': 'Malatya', 'Pütürge': 'Malatya', 'Akçadağ': 'Malatya',
          
          // Erzurum ilçeleri
          'Yakutiye': 'Erzurum', 'Palandöken': 'Erzurum', 'Aziziye': 'Erzurum',
          'Horasan': 'Erzurum', 'Karayazı': 'Erzurum', 'Hınıs': 'Erzurum',
          
          // Van ilçeleri
          'İpekyolu': 'Van', 'Tuşba': 'Van', 'Edremit': 'Van',
          'Özalp': 'Van', 'Çaldıran': 'Van', 'Gürpınar': 'Van',
          
          // Elazığ ilçeleri
          'Merkez': 'Elazığ', 'Kovancılar': 'Elazığ', 'Karakoçan': 'Elazığ',
          'Palu': 'Elazığ', 'Arıcak': 'Elazığ', 'Maden': 'Elazığ',
          
          // Kahramanmaraş ilçeleri
          'Onikişubat': 'Kahramanmaraş', 'Dulkadiroğlu': 'Kahramanmaraş', 'Elbistan': 'Kahramanmaraş',
          'Pazarcık': 'Kahramanmaraş', 'Göksun': 'Kahramanmaraş', 'Türkoğlu': 'Kahramanmaraş',
          
          // Manisa ilçeleri
          'Şehzadeler': 'Manisa', 'Yunusemre': 'Manisa', 'Akhisar': 'Manisa',
          'Salihli': 'Manisa', 'Turgutlu': 'Manisa', 'Alaşehir': 'Manisa',
          
          // Kocaeli ilçeleri
          'İzmit': 'Kocaeli', 'Gebze': 'Kocaeli', 'Derince': 'Kocaeli',
          'Darıca': 'Kocaeli', 'Körfez': 'Kocaeli', 'Gölcük': 'Kocaeli',
          'Kartepe': 'Kocaeli', 'Kandıra': 'Kocaeli', 'Dilovası': 'Kocaeli',
          
          // Sakarya ilçeleri
          'Adapazarı': 'Sakarya', 'Serdivan': 'Sakarya', 'Erenler': 'Sakarya',
          'Akyazı': 'Sakarya', 'Hendek': 'Sakarya', 'Geyve': 'Sakarya',
          'Pamukova': 'Sakarya', 'Taraklı': 'Sakarya', 'Ferizli': 'Sakarya',
          'Söğütlü': 'Sakarya', 'Kaynarca': 'Sakarya', 'Kocaali': 'Sakarya',
          'Karapürçek': 'Sakarya', 'Arifiye': 'Sakarya', 'Sapanca': 'Sakarya'
        };
        
        // Eğer city bir ilçe ise, onu district yap ve gerçek şehri bul
        if (city && cityDistrictMap[city]) {
          console.log("City is actually a district, mapping to:", cityDistrictMap[city]);
          district = city;
          city = cityDistrictMap[city];
        }
        
        // Eğer district bir ilçe ise ve city henüz ayarlanmamışsa
        if (district && cityDistrictMap[district] && city && !cityDistrictMap[city]) {
          console.log("District is actually a district, mapping to:", cityDistrictMap[district]);
          city = cityDistrictMap[district];
        }
        
        console.log("Mapped city:", city, "district:", district);
        
        addressInfo = {
          city: city,
          district: district,
          address: [
            locationData.street,
            locationData.streetNumber,
            locationData.district,
            locationData.city,
            locationData.region,
          ]
            .filter(Boolean)
            .join(", "),
        };
        
        console.log("Final addressInfo:", addressInfo);
      }

      const newLocationInfo: LocationInfo = {
        latitude,
        longitude,
        ...addressInfo,
      };

      setLocationInfo(newLocationInfo);
    } catch (err) {
      console.error("Location error:", err);
      setError("Konum alınırken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (locationInfo) {
      console.log("Location confirmed:", locationInfo);
      onConfirm(locationInfo);
      onClose();
    }
  };

  const handleRetry = () => {
    getCurrentLocation();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.gradientTwo} />
          </TouchableOpacity>
          <Text style={styles.title}>Konumunuzu Doğrulayın</Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.gradientTwo} />
            <Text style={styles.loadingText}>Konumunuz alınıyor...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="location" size={48} color="#ff4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : locationInfo ? (
          <View style={styles.content}>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: locationInfo.latitude,
                  longitude: locationInfo.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showsUserLocation={true}
                showsMyLocationButton={false}
              >
                <Marker
                  coordinate={{
                    latitude: locationInfo.latitude,
                    longitude: locationInfo.longitude,
                  }}
                  title="Konumunuz"
                  description="Bu konum doğru mu?"
                />
              </MapView>
            </View>

            <View style={styles.locationInfo}>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={20} color={colors.gradientTwo} />
                <Text style={styles.infoLabel}>Koordinatlar:</Text>
                <Text style={styles.infoValue}>
                  {locationInfo.latitude.toFixed(6)}, {locationInfo.longitude.toFixed(6)}
                </Text>
              </View>

              {locationInfo.city && (
                <View style={styles.infoRow}>
                  <Ionicons name="business" size={20} color={colors.gradientTwo} />
                  <Text style={styles.infoLabel}>Şehir:</Text>
                  <Text style={styles.infoValue}>{locationInfo.city}</Text>
                </View>
              )}

              {locationInfo.district && (
                <View style={styles.infoRow}>
                  <Ionicons name="business" size={20} color={colors.gradientTwo} />
                  <Text style={styles.infoLabel}>İlçe:</Text>
                  <Text style={styles.infoValue}>{locationInfo.district}</Text>
                </View>
              )}

              {locationInfo.address && (
                <View style={styles.infoRow}>
                  <Ionicons name="home" size={20} color={colors.gradientTwo} />
                  <Text style={styles.infoLabel}>Açık Adres:</Text>
                  <Text style={styles.infoValue} numberOfLines={3}>
                    {locationInfo.address}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmButtonText}>Konumu Onayla</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.textSecondary + "20",
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: "NotoSans-Bold",
    color: colors.gradientTwo,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Regular",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: "#ff4444",
    fontFamily: "NotoSans-Regular",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.gradientTwo,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "NotoSans-Bold",
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    height: 200, // Reduced map height
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  locationInfo: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Bold",
    minWidth: 60,
  },
  infoValue: {
    fontSize: 14,
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Regular",
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.light.textSecondary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: colors.light.textPrimary,
    fontSize: 16,
    fontFamily: "NotoSans-Bold",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.gradientTwo,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "NotoSans-Bold",
  },
});

export default LocationConfirmationModal; 