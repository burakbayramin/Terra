import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import Toast from "@/components/Toast";

interface EmergencyPlan {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
  is_default: boolean;
  creator_name: string;
  steps: PlanStep[];
}

interface PlanStep {
  id: string;
  title: string;
  description: string;
  category: 'emergency' | 'post_emergency';
  order: number;
  safe_zone_id?: string;
  safe_zone_name?: string;
}

interface CreatePlanData {
  name: string;
  steps: PlanStep[];
  network_id: string;
}

export default function EmergencyPlanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { networkId } = useLocalSearchParams<{ networkId: string }>();

  // State
  const [plans, setPlans] = useState<EmergencyPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<EmergencyPlan | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [planName, setPlanName] = useState("");
  const [emergencySteps, setEmergencySteps] = useState<PlanStep[]>([]);
  const [postEmergencySteps, setPostEmergencySteps] = useState<PlanStep[]>([]);

  // Toast state
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  });

  // Show toast function
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({
      visible: true,
      message,
      type
    });
  };

  // Hide toast function
  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // Load emergency plans
  const loadEmergencyPlans = async () => {
    try {
      setIsLoading(true);
      // Dummy data for testing
      const dummyPlans: EmergencyPlan[] = [
        {
          id: '1',
          name: 'Varsayılan Acil Durum Planı',
          created_by: 'system',
          created_at: '2024-01-01T00:00:00Z',
          is_active: true,
          is_default: true,
          creator_name: 'Sistem',
          steps: [
            {
              id: '1',
              title: 'Pencereden uzaklaş',
              description: 'Pencerelerden ve camlardan uzak durun',
              category: 'emergency',
              order: 1
            },
            {
              id: '2',
              title: 'Güvenli pozisyonda kal',
              description: 'Sarsıntı geçene kadar güvenli pozisyonda kalın',
              category: 'emergency',
              order: 2
            },
            {
              id: '3',
              title: 'Aile bireylerini kontrol et',
              description: 'Tüm aile bireylerinin güvende olduğundan emin olun',
              category: 'post_emergency',
              order: 1
            },
            {
              id: '4',
              title: 'Güvenli alana git',
              description: 'En yakın güvenli alana yönelin',
              category: 'post_emergency',
              order: 2
            }
          ]
        },
        {
          id: '2',
          name: 'Aile Acil Durum Planı',
          created_by: 'user1',
          created_at: '2024-01-10T15:30:00Z',
          is_active: false,
          is_default: false,
          creator_name: 'Ahmet Yılmaz',
          steps: [
            {
              id: '1',
              title: 'Çocukları koru',
              description: 'Çocukları güvenli bir yere alın',
              category: 'emergency',
              order: 1
            },
            {
              id: '2',
              title: 'Elektrik ve gazı kapat',
              description: 'Elektrik şalterini ve gaz vanasını kapatın',
              category: 'emergency',
              order: 2
            },
            {
              id: '3',
              title: 'Merkez Park\'a git',
              description: 'Aile buluşma noktası olarak Merkez Park\'a gidin',
              category: 'post_emergency',
              order: 1,
              safe_zone_id: '1',
              safe_zone_name: 'Merkez Park'
            }
          ]
        }
      ];

      setPlans(dummyPlans);
    } catch (error) {
      console.error('Error loading emergency plans:', error);
      showToast('Acil durum planları yüklenirken hata oluştu', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Activate plan
  const activatePlan = async (plan: EmergencyPlan) => {
    try {
      // Deactivate all other plans
      const updatedPlans = plans.map(p => ({
        ...p,
        is_active: p.id === plan.id
      }));
      setPlans(updatedPlans);
      showToast(`${plan.name} aktif hale getirildi!`, 'success');
    } catch (error) {
      showToast('Plan aktifleştirilirken hata oluştu', 'error');
    }
  };

  // Create new plan
  const createPlan = async () => {
    if (!planName.trim()) {
      showToast('Lütfen plan adını girin', 'error');
      return;
    }

    if (emergencySteps.length === 0 && postEmergencySteps.length === 0) {
      showToast('En az bir adım eklemelisiniz', 'error');
      return;
    }

    try {
      const newPlan: EmergencyPlan = {
        id: Date.now().toString(),
        name: planName.trim(),
        created_by: 'current-user',
        created_at: new Date().toISOString(),
        is_active: false,
        is_default: false,
        creator_name: 'Siz',
        steps: [
          ...emergencySteps.map((step, index) => ({ ...step, order: index + 1 })),
          ...postEmergencySteps.map((step, index) => ({ ...step, order: index + 1 }))
        ]
      };

      setPlans(prev => [newPlan, ...prev]);
      setShowCreateModal(false);
      resetCreateForm();
      showToast('Acil durum planı oluşturuldu!', 'success');
    } catch (error) {
      showToast('Plan oluşturulurken hata oluştu', 'error');
    }
  };

  // Reset create form
  const resetCreateForm = () => {
    setPlanName("");
    setEmergencySteps([]);
    setPostEmergencySteps([]);
    setCurrentStep(1);
  };

  // Add step
  const addStep = (category: 'emergency' | 'post_emergency') => {
    const newStep: PlanStep = {
      id: Date.now().toString(),
      title: '',
      description: '',
      category,
      order: category === 'emergency' ? emergencySteps.length + 1 : postEmergencySteps.length + 1
    };

    if (category === 'emergency') {
      setEmergencySteps(prev => [...prev, newStep]);
    } else {
      setPostEmergencySteps(prev => [...prev, newStep]);
    }
  };

  // Update step
  const updateStep = (stepId: string, updates: Partial<PlanStep>, category: 'emergency' | 'post_emergency') => {
    if (category === 'emergency') {
      setEmergencySteps(prev => prev.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      ));
    } else {
      setPostEmergencySteps(prev => prev.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      ));
    }
  };

  // Remove step
  const removeStep = (stepId: string, category: 'emergency' | 'post_emergency') => {
    if (category === 'emergency') {
      setEmergencySteps(prev => prev.filter(step => step.id !== stepId));
    } else {
      setPostEmergencySteps(prev => prev.filter(step => step.id !== stepId));
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render plan item
  const renderPlan = ({ item }: { item: EmergencyPlan }) => (
    <View style={styles.planCard}>
      <View style={styles.planHeader}>
        <View style={styles.planIcon}>
          <MaterialCommunityIcons
            name={item.is_default ? "shield-check" : "clipboard-text"}
            size={24}
            color={item.is_default ? "#2ed573" : colors.primary}
          />
        </View>
        
        <View style={styles.planInfo}>
          <Text style={styles.planName}>{item.name}</Text>
          <Text style={styles.planCreator}>
            {item.creator_name} tarafından oluşturuldu
          </Text>
          <Text style={styles.planDate}>
            {formatDate(item.created_at)}
          </Text>
        </View>
      </View>

      <View style={styles.planStats}>
        <View style={styles.statItem}>
          <Ionicons name="list" size={16} color={colors.light.textSecondary} />
          <Text style={styles.statText}>{item.steps.length} adım</Text>
        </View>
        
        <View style={[styles.statusBadge, item.is_active ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={[styles.statusText, item.is_active ? styles.activeText : styles.inactiveText]}>
            {item.is_active ? 'Aktif' : 'Pasif'}
          </Text>
        </View>
      </View>

      <View style={styles.planActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setSelectedPlan(item);
            setShowPlanModal(true);
          }}
        >
          <Ionicons name="eye-outline" size={20} color={colors.primary} />
          <Text style={styles.actionButtonText}>Görüntüle</Text>
        </TouchableOpacity>
        
        {!item.is_default && (
          <TouchableOpacity
            style={[styles.actionButton, item.is_active ? styles.deactivateButton : styles.activateButton]}
            onPress={() => activatePlan(item)}
          >
            <Ionicons 
              name={item.is_active ? "pause-outline" : "play-outline"} 
              size={20} 
              color={item.is_active ? "#ff4757" : "#2ed573"} 
            />
            <Text style={[styles.actionButtonText, item.is_active ? styles.deactivateText : styles.activateText]}>
              {item.is_active ? 'Pasifleştir' : 'Aktif Et'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Load data on mount
  useEffect(() => {
    loadEmergencyPlans();
  }, [networkId]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary + '10', colors.primary + '05']}
        style={[styles.headerGradient, { marginTop: -insets.top }]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Acil Durum Eylem Planları</Text>
            <Text style={styles.headerSubtitle}>
              Ağınız için acil durum senaryoları oluşturun
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.contentHeader}>
          <Text style={styles.sectionTitle}>
            Eylem Planları ({plans.length})
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Yeni Plan</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={plans}
            renderItem={renderPlan}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.plansList}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="clipboard-text"
                  size={48}
                  color={colors.light.textSecondary}
                />
                <Text style={styles.emptyText}>Henüz eylem planı bulunmuyor</Text>
                <Text style={styles.emptySubtext}>
                  İlk eylem planınızı oluşturmak için yukarıdaki "Yeni Plan" butonunu kullanın
                </Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Create Plan Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Eylem Planı Oluştur</Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Step 1: Plan Name */}
              {currentStep === 1 && (
                <View style={styles.stepContainer}>
                  <View style={styles.stepHeader}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <Text style={styles.stepTitle}>Plan Adını Belirleyin</Text>
                  </View>
                  <Text style={styles.stepDescription}>
                    Acil durum planınız için açıklayıcı bir isim verin
                  </Text>
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: Aile Acil Durum Planı"
                    placeholderTextColor="#999"
                    value={planName}
                    onChangeText={setPlanName}
                    maxLength={50}
                  />
                </View>
              )}

              {/* Step 2: Emergency Actions */}
              {currentStep === 2 && (
                <View style={styles.stepContainer}>
                  <View style={styles.stepHeader}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <Text style={styles.stepTitle}>Acil Durum Anı Aksiyonları</Text>
                  </View>
                  <Text style={styles.stepDescription}>
                    Deprem sırasında yapılacak ilk aksiyonları belirleyin
                  </Text>
                  
                  {emergencySteps.map((step, index) => (
                    <View key={step.id} style={styles.stepItem}>
                      <View style={styles.stepItemHeader}>
                        <Text style={styles.stepItemNumber}>Adım {index + 1}</Text>
                        <TouchableOpacity
                          onPress={() => removeStep(step.id, 'emergency')}
                          style={styles.removeStepButton}
                        >
                          <Ionicons name="close-circle" size={20} color="#ff4757" />
                        </TouchableOpacity>
                      </View>
                      
                      <TextInput
                        style={styles.stepInput}
                        placeholder="Aksiyon başlığı"
                        placeholderTextColor="#999"
                        value={step.title}
                        onChangeText={(text) => updateStep(step.id, { title: text }, 'emergency')}
                        maxLength={100}
                      />
                      
                      <TextInput
                        style={[styles.stepInput, styles.stepDescriptionInput]}
                        placeholder="Açıklama (opsiyonel)"
                        placeholderTextColor="#999"
                        value={step.description}
                        onChangeText={(text) => updateStep(step.id, { description: text }, 'emergency')}
                        multiline
                        numberOfLines={2}
                        maxLength={200}
                      />
                    </View>
                  ))}
                  
                  <TouchableOpacity
                    style={styles.addStepButton}
                    onPress={() => addStep('emergency')}
                  >
                    <Ionicons name="add" size={20} color={colors.primary} />
                    <Text style={styles.addStepButtonText}>Aksiyon Ekle</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Step 3: Post Emergency Actions */}
              {currentStep === 3 && (
                <View style={styles.stepContainer}>
                  <View style={styles.stepHeader}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <Text style={styles.stepTitle}>Acil Durum Sonrası Aksiyonları</Text>
                  </View>
                  <Text style={styles.stepDescription}>
                    Deprem sonrasında yapılacak aksiyonları belirleyin
                  </Text>
                  
                  {postEmergencySteps.map((step, index) => (
                    <View key={step.id} style={styles.stepItem}>
                      <View style={styles.stepItemHeader}>
                        <Text style={styles.stepItemNumber}>Adım {index + 1}</Text>
                        <TouchableOpacity
                          onPress={() => removeStep(step.id, 'post_emergency')}
                          style={styles.removeStepButton}
                        >
                          <Ionicons name="close-circle" size={20} color="#ff4757" />
                        </TouchableOpacity>
                      </View>
                      
                      <TextInput
                        style={styles.stepInput}
                        placeholder="Aksiyon başlığı"
                        placeholderTextColor="#999"
                        value={step.title}
                        onChangeText={(text) => updateStep(step.id, { title: text }, 'post_emergency')}
                        maxLength={100}
                      />
                      
                      <TextInput
                        style={[styles.stepInput, styles.stepDescriptionInput]}
                        placeholder="Açıklama (opsiyonel)"
                        placeholderTextColor="#999"
                        value={step.description}
                        onChangeText={(text) => updateStep(step.id, { description: text }, 'post_emergency')}
                        multiline
                        numberOfLines={2}
                        maxLength={200}
                      />
                    </View>
                  ))}
                  
                  <TouchableOpacity
                    style={styles.addStepButton}
                    onPress={() => addStep('post_emergency')}
                  >
                    <Ionicons name="add" size={20} color={colors.primary} />
                    <Text style={styles.addStepButtonText}>Aksiyon Ekle</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <View style={styles.stepContainer}>
                  <View style={styles.stepHeader}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>4</Text>
                    </View>
                    <Text style={styles.stepTitle}>Gözden Geçir</Text>
                  </View>
                  <Text style={styles.stepDescription}>
                    Planınızı gözden geçirin ve kaydedin
                  </Text>
                  
                  <View style={styles.reviewSection}>
                    <Text style={styles.reviewTitle}>Plan Adı</Text>
                    <Text style={styles.reviewText}>{planName}</Text>
                  </View>
                  
                  <View style={styles.reviewSection}>
                    <Text style={styles.reviewTitle}>Acil Durum Anı Aksiyonları ({emergencySteps.length})</Text>
                    {emergencySteps.map((step, index) => (
                      <View key={step.id} style={styles.reviewStep}>
                        <Text style={styles.reviewStepNumber}>{index + 1}.</Text>
                        <Text style={styles.reviewStepText}>{step.title}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.reviewSection}>
                    <Text style={styles.reviewTitle}>Acil Durum Sonrası Aksiyonları ({postEmergencySteps.length})</Text>
                    {postEmergencySteps.map((step, index) => (
                      <View key={step.id} style={styles.reviewStep}>
                        <Text style={styles.reviewStepNumber}>{index + 1}.</Text>
                        <Text style={styles.reviewStepText}>{step.title}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              {currentStep > 1 && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setCurrentStep(prev => prev - 1)}
                >
                  <Text style={styles.cancelButtonText}>Geri</Text>
                </TouchableOpacity>
              )}
              
              {currentStep < 4 ? (
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={() => setCurrentStep(prev => prev + 1)}
                  disabled={
                    (currentStep === 1 && !planName.trim()) ||
                    (currentStep === 2 && emergencySteps.length === 0) ||
                    (currentStep === 3 && postEmergencySteps.length === 0)
                  }
                >
                  <Text style={styles.confirmButtonText}>İleri</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={createPlan}
                >
                  <Text style={styles.confirmButtonText}>Planı Oluştur</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* View Plan Modal */}
      <Modal
        visible={showPlanModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPlanModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedPlan?.name}</Text>
              <TouchableOpacity
                onPress={() => setShowPlanModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedPlan && (
                <>
                  <View style={styles.planDetails}>
                    <Text style={styles.planCreatorText}>
                      {selectedPlan.creator_name} tarafından oluşturuldu
                    </Text>
                    <Text style={styles.planDateText}>
                      {formatDate(selectedPlan.created_at)}
                    </Text>
                  </View>

                  <View style={styles.stepsSection}>
                    <Text style={styles.stepsSectionTitle}>
                      Acil Durum Anı Aksiyonları
                    </Text>
                    {selectedPlan.steps
                      .filter(step => step.category === 'emergency')
                      .sort((a, b) => a.order - b.order)
                      .map((step, index) => (
                        <View key={step.id} style={styles.stepCard}>
                          <View style={styles.stepCardHeader}>
                            <View style={styles.stepCardNumber}>
                              <Text style={styles.stepCardNumberText}>{index + 1}</Text>
                            </View>
                            <Text style={styles.stepCardTitle}>{step.title}</Text>
                          </View>
                          {step.description && (
                            <Text style={styles.stepCardDescription}>{step.description}</Text>
                          )}
                        </View>
                      ))}
                  </View>

                  <View style={styles.stepsSection}>
                    <Text style={styles.stepsSectionTitle}>
                      Acil Durum Sonrası Aksiyonları
                    </Text>
                    {selectedPlan.steps
                      .filter(step => step.category === 'post_emergency')
                      .sort((a, b) => a.order - b.order)
                      .map((step, index) => (
                        <View key={step.id} style={styles.stepCard}>
                          <View style={styles.stepCardHeader}>
                            <View style={styles.stepCardNumber}>
                              <Text style={styles.stepCardNumberText}>{index + 1}</Text>
                            </View>
                            <Text style={styles.stepCardTitle}>{step.title}</Text>
                          </View>
                          {step.description && (
                            <Text style={styles.stepCardDescription}>{step.description}</Text>
                          )}
                          {step.safe_zone_name && (
                            <View style={styles.safeZoneInfo}>
                              <Ionicons name="location" size={16} color={colors.primary} />
                              <Text style={styles.safeZoneText}>{step.safe_zone_name}</Text>
                            </View>
                          )}
                        </View>
                      ))}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPlanModal(false)}
              >
                <Text style={styles.cancelButtonText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast Component */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 10,
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.light.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.light.textSecondary,
    lineHeight: 24,
    fontWeight: "400",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  contentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.light.textPrimary,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  plansList: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.light.textSecondary,
    marginTop: 12,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.light.textSecondary,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  planCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.light.textPrimary,
    marginBottom: 4,
  },
  planCreator: {
    fontSize: 14,
    color: colors.light.textSecondary,
    marginBottom: 2,
  },
  planDate: {
    fontSize: 12,
    color: colors.light.textSecondary,
  },
  planStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: colors.light.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: "#2ed57320",
  },
  inactiveBadge: {
    backgroundColor: "#ff475720",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  activeText: {
    color: "#2ed573",
  },
  inactiveText: {
    color: "#ff4757",
  },
  planActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primary + "10",
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
  },
  activateButton: {
    backgroundColor: "#2ed57310",
  },
  activateText: {
    color: "#2ed573",
  },
  deactivateButton: {
    backgroundColor: "#ff475710",
  },
  deactivateText: {
    color: "#ff4757",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 20,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.light.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    padding: 20,
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.light.textPrimary,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.light.textSecondary,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
    color: colors.light.textPrimary,
  },
  stepItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  stepItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stepItemNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  removeStepButton: {
    padding: 4,
  },
  stepInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#fff",
    color: colors.light.textPrimary,
    marginBottom: 8,
  },
  stepDescriptionInput: {
    height: 60,
    textAlignVertical: "top",
  },
  addStepButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: "dashed",
    gap: 8,
  },
  addStepButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
  },
  reviewSection: {
    marginBottom: 20,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.light.textPrimary,
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    color: colors.light.textSecondary,
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
  },
  reviewStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  reviewStepNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginRight: 8,
    minWidth: 20,
  },
  reviewStepText: {
    fontSize: 14,
    color: colors.light.textPrimary,
    flex: 1,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  cancelButtonText: {
    color: colors.light.textSecondary,
    fontSize: 16,
    fontWeight: "500",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  planDetails: {
    marginBottom: 20,
  },
  planCreatorText: {
    fontSize: 14,
    color: colors.light.textSecondary,
    marginBottom: 4,
  },
  planDateText: {
    fontSize: 12,
    color: colors.light.textSecondary,
  },
  stepsSection: {
    marginBottom: 24,
  },
  stepsSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.light.textPrimary,
    marginBottom: 12,
  },
  stepCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  stepCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  stepCardNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  stepCardNumberText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  stepCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.light.textPrimary,
    flex: 1,
  },
  stepCardDescription: {
    fontSize: 13,
    color: colors.light.textSecondary,
    marginLeft: 32,
  },
  safeZoneInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginLeft: 32,
    gap: 4,
  },
  safeZoneText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "500",
  },
}); 