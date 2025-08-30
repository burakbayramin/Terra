import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

interface DropdownItem {
  label: string;
  value: string;
}

interface DropdownProps {
  placeholder: string;
  value: string;
  items: DropdownItem[];
  onSelect: (value: string) => void;
  disabled?: boolean;
  style?: any;
}

export default function Dropdown({
  placeholder,
  value,
  items,
  onSelect,
  disabled = false,
  style
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DropdownItem | null>(
    items.find(item => item.value === value) || null
  );

  // value prop'u değiştiğinde selectedItem'ı güncelle
  useEffect(() => {
    if (value) {
      const newSelectedItem = items.find(item => item.value === value);
      setSelectedItem(newSelectedItem || null);
    } else {
      setSelectedItem(null);
    }
  }, [value, items]);

  const handleSelect = (item: DropdownItem) => {
    setSelectedItem(item);
    onSelect(item.value);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          disabled && styles.disabledButton
        ]}
        onPress={toggleDropdown}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.dropdownText,
          !selectedItem && styles.placeholderText,
          disabled && styles.disabledText
        ]}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={20}
          color={disabled ? colors.light.textSecondary : colors.light.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.dropdownMenu}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {items.map((item, index) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.dropdownItem,
                    selectedItem?.value === item.value && styles.selectedItem,
                    index === items.length - 1 && styles.lastItem
                  ]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.itemText,
                    selectedItem?.value === item.value && styles.selectedItemText
                  ]}>
                    {item.label}
                  </Text>
                  {selectedItem?.value === item.value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
  },
  disabledButton: {
    backgroundColor: colors.light.surface,
    opacity: 0.6,
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'NotoSans-Medium',
    color: colors.light.textPrimary,
    flex: 1,
  },
  placeholderText: {
    color: colors.light.textSecondary,
  },
  disabledText: {
    color: colors.light.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    backgroundColor: colors.light.background,
    borderRadius: 12,
    width: '80%',
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedItem: {
    backgroundColor: colors.light.surface,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemText: {
    fontSize: 16,
    fontFamily: 'NotoSans-Medium',
    color: colors.light.textPrimary,
    flex: 1,
  },
  selectedItemText: {
    color: colors.primary,
    fontFamily: 'NotoSans-Bold',
  },
}); 