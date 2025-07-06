import React from "react";
import { colors } from "@/constants/colors";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const duringEarthquake = {
  icon: "alert-outline",
  title: "Deprem Esnasında Yapılması Gerekenler",
  description:
    "Deprem sırasında sakin kalmak ve doğru hareket etmek hayati önem taşır. Kendi güvenliğinizi önceliklendirin ve aşağıdaki adımları izleyin:",
  steps: [
    "Sakin olun ve panik yapmayın.",
    "Güvenli bir yerde (masa altı, sağlam bir mobilya yanında) ÇÖK-KAPAN-TUTUN pozisyonu alın.",
    "Pencerelerden, camlardan, dış kapılardan ve duvarlardan uzak durun.",
    "Merdiven, asansör veya balkonlara yönelmeyin.",
    "Başınızı ve ensenizi koruyun.",
    "Açık alandaysanız; binalardan, ağaçlardan, elektrik direklerinden ve enerji hatlarından uzaklaşın.",
    "Araçtaysanız; güvenli bir yerde durun, araç içinde kalın ve deprem bitene kadar bekleyin.",
  ],
};

const afterEarthquake = {
  icon: "checkmark-done-outline",
  title: "Deprem Sonrasında Yapılması Gerekenler",
  description:
    "Deprem sona erdiğinde, hem kendi güvenliğiniz hem de çevrenizdekilerin güvenliği için dikkatli ve bilinçli hareket edin:",
  steps: [
    "Kısa bir süre sarsıntıların devam edebileceğini unutmayın, aceleyle dışarı çıkmayın.",
    "Kendinizin ve çevrenizdekilerin yaralanıp yaralanmadığını kontrol edin.",
    "Gaz, su ve elektrik vanalarını kapatın. Yangın riskine karşı dikkatli olun.",
    "Telefonları acil durumlar dışında kullanmayın.",
    "Radyo veya resmi kaynaklardan güncel bilgileri takip edin.",
    "Bina güvenli değilse, eşyalarınızı almadan hızlıca ve dikkatlice binayı terk edin.",
    "Açık alanda toplanma bölgelerine gidin, yardım ekiplerinin talimatlarına uyun.",
    "Yaralı veya mahsur kalanlara yardım edin, ancak kendi güvenliğinizi riske atmayın.",
    "Artçı sarsıntılara karşı hazırlıklı olun.",
  ],
};

const WhatToDoEarthquakePage: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="alert-circle" size={32} color={colors.gradientTwo} />
            <Text style={styles.title}>Deprem Esnası ve Sonrası</Text>
          </View>
          <Text style={styles.subtitle}>
            Deprem sırasında ve sonrasında güvenliğiniz için bilinçli hareket
            edin.
          </Text>
        </View>

        {/* Deprem Esnasında */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name={duringEarthquake.icon as any}
              size={28}
              color={colors.primary}
            />
            <Text style={styles.cardTitle}>{duringEarthquake.title}</Text>
          </View>
          <Text style={styles.cardDescription}>
            {duringEarthquake.description}
          </Text>
          <View style={styles.cardSteps}>
            {duringEarthquake.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <Ionicons
                  name="ellipse"
                  size={8}
                  color={colors.gradientTwo}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Deprem Sonrasında */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name={afterEarthquake.icon as any}
              size={28}
              color={colors.primary}
            />
            <Text style={styles.cardTitle}>{afterEarthquake.title}</Text>
          </View>
          <Text style={styles.cardDescription}>
            {afterEarthquake.description}
          </Text>
          <View style={styles.cardSteps}>
            {afterEarthquake.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <Ionicons
                  name="ellipse"
                  size={8}
                  color={colors.gradientTwo}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Ek Bilgiler:</Text>
          <Text style={styles.instructionText}>
            • Deprem sonrası artçı sarsıntılar olabilir, dikkatli olun.
          </Text>
          <Text style={styles.instructionText}>
            • Yetkililerin ve yardım ekiplerinin talimatlarına mutlaka uyun.
          </Text>
          <Text style={styles.instructionText}>
            • Güvenliğinizden emin olmadan binaya tekrar girmeyin.
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
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.light.background,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary,
    fontFamily: "NotoSans-Medium",
  },
  cardDescription: {
    fontSize: 14,
    color: colors.light.textSecondary,
    marginBottom: 8,
    fontFamily: "NotoSans-Regular",
  },
  cardSteps: {
    marginLeft: 8,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  stepText: {
    fontSize: 13,
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Regular",
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
});

export default WhatToDoEarthquakePage;
