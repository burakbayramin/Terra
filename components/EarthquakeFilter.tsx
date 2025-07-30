import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { colors } from '@/constants/colors';

interface MagnitudeRange {
  min: number;
  max: number;
  label: string;
}

interface EarthquakeFilterProps {
  // Modal visibility
  showFilterModal: boolean;
  setShowFilterModal: (show: boolean) => void;
  
  // Region filters
  selectedRegions: string[];
  availableRegions: string[];
  
  // Magnitude filters
  selectedMagnitudeRanges: MagnitudeRange[];
  
  // Filter actions
  toggleRegion: (region: string) => void;
  toggleMagnitudeRange: (range: MagnitudeRange) => void;
  clearFilters: () => void;
  
  // Helper functions
  isMagnitudeRangeSelected: (range: MagnitudeRange) => boolean;
  hasActiveFilters: boolean;
}

const EarthquakeFilter: React.FC<EarthquakeFilterProps> = ({
  showFilterModal,
  setShowFilterModal,
  selectedRegions,
  availableRegions,
  selectedMagnitudeRanges,
  toggleRegion,
  toggleMagnitudeRange,
  clearFilters,
  isMagnitudeRangeSelected,
  hasActiveFilters,
}) => {
  // Magnitude ranges for filtering
  const magnitudeRanges: MagnitudeRange[] = [
    { label: 'Zayıf (0-3)', min: 0, max: 3 },
    { label: 'Hafif (3-4)', min: 3, max: 4 },
    { label: 'Orta (4-5)', min: 4, max: 5 },
    { label: 'Güçlü (5+)', min: 5, max: 10 },
  ];

  return (
    <>
      {/* Filter Button */}
      <TouchableOpacity
        style={[
          styles.filterButton,
          hasActiveFilters && styles.filterButtonActive,
        ]}
        onPress={() => setShowFilterModal(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.filterButtonText,
            hasActiveFilters && styles.filterButtonTextActive,
          ]}
        >
          🔍 Filtrele
        </Text>
        {hasActiveFilters && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>
              {selectedRegions.length + selectedMagnitudeRanges.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersTitle}>Aktif Filtreler:</Text>
          <View style={styles.activeFiltersRow}>
            {selectedRegions.map((region) => (
              <View key={`region-${region}`} style={styles.filterTag}>
                <Text style={styles.filterTagText}>📍 {region}</Text>
                <TouchableOpacity onPress={() => toggleRegion(region)}>
                  <Text style={styles.filterTagRemove}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            {selectedMagnitudeRanges.map((range, index) => (
              <View key={`magnitude-${index}`} style={styles.filterTag}>
                <Text style={styles.filterTagText}>⚡ {range.label}</Text>
                <TouchableOpacity onPress={() => toggleMagnitudeRange(range)}>
                  <Text style={styles.filterTagRemove}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={clearFilters}
              style={styles.clearFiltersButton}
            >
              <Text style={styles.clearFiltersText}>Temizle</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrele</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
            >
              {/* Magnitude Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>🔢 Büyüklük</Text>
                {magnitudeRanges.map((range) => (
                  <TouchableOpacity
                    key={`magnitude-${range.label}`}
                    style={[
                      styles.filterOption,
                      isMagnitudeRangeSelected(range) &&
                        styles.filterOptionSelected,
                    ]}
                    onPress={() => toggleMagnitudeRange(range)}
                    activeOpacity={0.6}
                  >
                    <View style={styles.filterOptionContent}>
                      <Text
                        style={[
                          styles.filterOptionText,
                          isMagnitudeRangeSelected(range) &&
                            styles.filterOptionTextSelected,
                        ]}
                      >
                        {range.label}
                      </Text>
                      {isMagnitudeRangeSelected(range) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Region Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>📍 Bölge</Text>
                {availableRegions.length > 0 ? (
                  availableRegions.map((region) => (
                    <TouchableOpacity
                      key={`region-${region}`}
                      style={[
                        styles.filterOption,
                        selectedRegions.includes(region) &&
                          styles.filterOptionSelected,
                      ]}
                      onPress={() => toggleRegion(region)}
                      activeOpacity={0.6}
                    >
                      <View style={styles.filterOptionContent}>
                        <Text
                          style={[
                            styles.filterOptionText,
                            selectedRegions.includes(region) &&
                              styles.filterOptionTextSelected,
                          ]}
                        >
                          {region}
                        </Text>
                        {selectedRegions.includes(region) && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.noOptionsContainer}>
                    <Text style={styles.noOptionsText}>
                      Henüz bölge verisi yüklenmemiş
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalClearButton}
                onPress={clearFilters}
              >
                <Text style={styles.modalClearButtonText}>Temizle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApplyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.modalApplyButtonText}>Uygula</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Filter Button Styles
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#e53e3e',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Active Filters Styles
  activeFiltersContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  activeFiltersTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  filterTagText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 6,
  },
  filterTagRemove: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearFiltersButton: {
    backgroundColor: '#ef4444',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
  },
  clearFiltersText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f7fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 24,
    color: '#718096',
    fontWeight: '300',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  filterSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 12,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f7fafc',
  },
  filterOptionSelected: {
    backgroundColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4a5568',
    flex: 1,
  },
  filterOptionTextSelected: {
    color: '#ffffff',
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  noOptionsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noOptionsText: {
    fontSize: 14,
    color: '#718096',
    fontStyle: 'italic',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  modalClearButton: {
    flex: 1,
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    paddingVertical: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  modalClearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#718096',
  },
  modalApplyButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalApplyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default EarthquakeFilter;