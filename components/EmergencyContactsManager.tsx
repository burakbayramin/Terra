import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import { colors } from "@/constants/colors";

interface EmergencyContactsManagerProps {
  contacts: string[];
  onContactsChange: (contacts: string[] | ((prev: string[]) => string[])) => void;
  disabled?: boolean;
}

function cleanAndFormatTurkishNumber(input: string): string {
  let number = input.replace(/\D/g, "");
  if (number.startsWith("90")) number = number.slice(2);
  if (number.startsWith("0")) number = number.slice(1);
  number = number.slice(0, 10);
  if (number.length === 10)
    return number.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4");
  else return number;
}

const EmergencyContactsManager: React.FC<EmergencyContactsManagerProps> = ({
  contacts,
  onContactsChange,
  disabled = false,
}) => {
  const [contactsModalVisible, setContactsModalVisible] = useState(false);
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [availableContacts, setAvailableContacts] = useState<Contacts.Contact[]>([]);

  const formatPhoneNumber = useCallback((value: string) => {
    const numeric = value.replace(/\D/g, "");
    const limited = numeric.slice(0, 10);
    if (limited.length >= 7) {
      return limited.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4");
    } else if (limited.length >= 6) {
      return limited.replace(/(\d{3})(\d{3})(\d{1,2})/, "$1 $2 $3");
    } else if (limited.length >= 3) {
      return limited.replace(/(\d{3})(\d{1,3})/, "$1 $2");
    }
    return limited;
  }, []);

  const validatePhoneNumber = useCallback((phone: string) => {
    const numeric = phone.replace(/\D/g, "");
    return numeric.length === 10;
  }, []);

  const addContact = useCallback((phoneNumber: string) => {
    const formattedNumber = cleanAndFormatTurkishNumber(phoneNumber);
    if (!validatePhoneNumber(formattedNumber)) {
      Alert.alert("Hata", "Geçerli bir telefon numarası girin (10 haneli)");
      return;
    }

    onContactsChange((prevContacts: string[]) => {
      if (prevContacts.includes(formattedNumber)) {
        Alert.alert("Uyarı", "Bu numara zaten eklenmiş");
        return prevContacts;
      }
      return [...prevContacts, formattedNumber];
    });
  }, [onContactsChange, validatePhoneNumber]);

  const removeContact = useCallback((phoneNumber: string) => {
    onContactsChange((prevContacts: string[]) => 
      prevContacts.filter((contact: string) => contact !== phoneNumber)
    );
  }, [onContactsChange]);

  const openContacts = useCallback(async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin Gerekli", "Rehbere erişim izni verilmedi.");
      return;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
      sort: Contacts.SortTypes.FirstName,
    });

    if (data.length > 0) {
      setAvailableContacts(
        data.filter((c) => c.phoneNumbers && c.phoneNumbers.length > 0)
      );
      setContactsModalVisible(true);
    } else {
      Alert.alert("Uyarı", "Rehberde telefon numarası bulunamadı.");
    }
  }, []);

  const handleManualAdd = useCallback(() => {
    setNewPhoneNumber("");
    setPhoneModalVisible(true);
  }, []);

  const handleSaveManualNumber = useCallback(() => {
    if (newPhoneNumber.trim()) {
      addContact(newPhoneNumber);
      setPhoneModalVisible(false);
      setNewPhoneNumber("");
    }
  }, [newPhoneNumber, addContact]);

  const renderContactItem = useCallback(({ item }: { item: string }) => (
    <View style={styles.contactItem}>
      <View style={styles.contactInfo}>
        <Ionicons name="call" size={16} color={colors.gradientTwo} />
        <Text style={styles.contactText}>{item}</Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeContact(item)}
        disabled={disabled}
      >
        <Ionicons name="close-circle" size={20} color="#ff4444" />
      </TouchableOpacity>
    </View>
  ), [removeContact, disabled]);

  const renderContactPickerItem = useCallback(({ item }: { item: Contacts.Contact }) => {
    const handleContactSelect = () => {
      const phoneRaw = item.phoneNumbers?.[0]?.number || "";
      const phone = cleanAndFormatTurkishNumber(phoneRaw);
      setContactsModalVisible(false);
      addContact(phone);
    };

    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={handleContactSelect}
      >
        <Text style={styles.listItemText}>
          {item.name || [item.firstName, item.lastName].filter(Boolean).join(" ")}
        </Text>
        <Text style={styles.listItemPhone}>
          {item.phoneNumbers?.[0]?.number}
        </Text>
      </TouchableOpacity>
    );
  }, [addContact]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Acil Durum Telefonları</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.addButton, disabled && styles.disabledButton]}
            onPress={handleManualAdd}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addButtonText}>Numara Ekle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, styles.contactsButton, disabled && styles.disabledButton]}
            onPress={openContacts}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Ionicons name="person-add" size={16} color="#fff" />
            <Text style={styles.addButtonText}>Rehberden Seç</Text>
          </TouchableOpacity>
        </View>
      </View>

      {contacts.length > 0 ? (
        <FlatList
          data={contacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item}
          style={styles.contactsList}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="call-outline" size={24} color={colors.light.textSecondary} />
          <Text style={styles.emptyStateText}>
            Henüz acil durum telefonu eklenmemiş
          </Text>
        </View>
      )}

      <Text style={styles.helperText}>
        Tehlikedeyim butonuna basıldığında mesaj gidecek numaralar
      </Text>

      {/* Manuel Numara Ekleme Modal */}
      <Modal
        visible={phoneModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPhoneModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPhoneModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.gradientTwo} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Telefon Numarası Ekle</Text>
            <View style={{ width: 24 }} />
          </View>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              <Text style={styles.modalLabel}>Telefon Numarası</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="5XX XXX XX XX"
                value={newPhoneNumber}
                onChangeText={(text) => setNewPhoneNumber(formatPhoneNumber(text))}
                keyboardType="phone-pad"
                maxLength={13}
                placeholderTextColor={colors.light.textSecondary}
              />

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveManualNumber}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveButtonText}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>

      {/* Rehber Seçme Modal */}
      <Modal
        visible={contactsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setContactsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setContactsModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.gradientTwo} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Rehberden Kişi Seç</Text>
            <View style={{ width: 24 }} />
          </View>

          <FlatList
            data={availableContacts}
            renderItem={renderContactPickerItem}
            keyExtractor={(item) =>
              item.id
                ? String(item.id)
                : String(item.phoneNumbers?.[0]?.number || Math.random())
            }
            style={styles.contactsPickerList}
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: "#eee" }} />
            )}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Bold",
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
  },
  addButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gradientTwo,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  contactsButton: {
    backgroundColor: colors.gradientOne,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "NotoSans-Bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
  contactsList: {
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.light.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.light.textSecondary + "20",
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Regular",
  },
  removeButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: colors.light.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.light.textSecondary + "20",
    borderStyle: "dashed",
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
    marginTop: 8,
    textAlign: "center",
  },
  helperText: {
    fontSize: 12,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.textSecondary + "20",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "NotoSans-Bold",
    color: colors.gradientTwo,
  },
  modalContent: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 15,
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Bold",
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.light.textSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    fontSize: 15,
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Regular",
    marginBottom: 16,
  },
  modalSaveButton: {
    backgroundColor: colors.gradientTwo,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalSaveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "NotoSans-Bold",
  },
  contactsPickerList: {
    flex: 1,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.textSecondary + "10",
  },
  listItemText: {
    fontSize: 16,
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Regular",
    flex: 1,
  },
  listItemPhone: {
    fontSize: 14,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
  },
});

export default EmergencyContactsManager; 