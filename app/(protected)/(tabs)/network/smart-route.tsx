// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Modal,
//   TextInput,
//   ActivityIndicator,
//   Alert,
//   Switch,
//   Keyboard,
//   TouchableWithoutFeedback,
// } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { LinearGradient } from "expo-linear-gradient";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import {
//   MaterialCommunityIcons,
//   Ionicons,
// } from "@expo/vector-icons";
// import { colors } from "@/constants/colors";
// import { 
//   useSmartRouteSettings, 
//   useUpdateSmartRouteSettings,
//   useSmartRoutes,
//   useCreateSmartRoute,
//   useUserRouteSelection,
//   useSelectRoute,
//   useNetworkRouteOverview
// } from "@/hooks/useSmartRoute";
// import { useNetwork, useNetworkMembers } from "@/hooks/useNetwork";
// import { supabase } from "@/lib/supabase";
// import Toast from "@/components/Toast";
// import PremiumFeatureGate from "@/components/PremiumFeatureGate";

// export default function SmartRouteScreen() {
//   const insets = useSafeAreaInsets();
//   const router = useRouter();
//   const { networkId } = useLocalSearchParams<{ networkId: string }>();

//   // Fallback insets değerleri
//   const safeInsets = {
//     top: insets?.top || 0,
//     bottom: insets?.bottom || 0,
//     left: insets?.left || 0,
//     right: insets?.right || 0,
//   };

//   // Debug: insets değerini kontrol et
//   console.log('Smart Route Insets:', insets);
//   console.log('Smart Route Safe Insets:', safeInsets);
//   console.log('Smart Route NetworkId:', networkId);

//   // State
//   const [currentUser, setCurrentUser] = useState<any>(null);
//   const [isNetworkAdmin, setIsNetworkAdmin] = useState(false);
//   const [showCreateRouteModal, setShowCreateRouteModal] = useState(false);
//   const [showRouteSelectionModal, setShowRouteSelectionModal] = useState(false);
//   const [routeName, setRouteName] = useState("");
//   const [routeDescription, setRouteDescription] = useState("");
//   const [selectedRouteType, setSelectedRouteType] = useState<'default' | 'family' | 'disabled_friendly' | 'elderly_friendly' | 'custom'>('default');
//   const [isDefaultRoute, setIsDefaultRoute] = useState(false);

//   // Toast state
//   const [toast, setToast] = useState({
//     visible: false,
//     message: '',
//     type: 'success' as 'success' | 'error' | 'info'
//   });

//   // Queries
//   const { data: network } = useNetwork(networkId || '');
//   const { data: members } = useNetworkMembers(networkId || '');
//   const { data: routeSettings, isLoading: isLoadingSettings, error: settingsError } = useSmartRouteSettings(networkId || '');
//   const { data: routes, isLoading: isLoadingRoutes, error: routesError } = useSmartRoutes(networkId || '');
//   const { data: userSelection, error: selectionError } = useUserRouteSelection(networkId || '');
//   const { data: routeOverview, error: overviewError } = useNetworkRouteOverview(networkId || '');



//   // Mutations
//   const updateSettingsMutation = useUpdateSmartRouteSettings();
//   const createRouteMutation = useCreateSmartRoute();
//   const selectRouteMutation = useSelectRoute();

//   // Get current user and check if admin
//   React.useEffect(() => {
//     const getCurrentUser = async () => {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (user) {
//         setCurrentUser(user);
//         // Check if user is network admin
//         if (members && network) {
//           const userMember = members.find(member => member.user_id === user.id);
//           const isCreator = userMember && userMember.role === 'creator';
//           const isNetworkCreator = network.created_by === user.id;
          
//           console.log('Admin Check Debug:', {
//             userId: user.id,
//             networkCreatorId: network.created_by,
//             userMember: userMember,
//             isCreator,
//             isNetworkCreator
//           });
          
//           setIsNetworkAdmin(isCreator || isNetworkCreator);
//         }
//       }
//     };
//     getCurrentUser();
//   }, [members, network]);

//   // Show toast function
//   const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
//     setToast({
//       visible: true,
//       message,
//       type
//     });
//   };

//   // Hide toast function
//   const hideToast = () => {
//     setToast(prev => ({ ...prev, visible: false }));
//   };

//   // Toggle feature
//   const toggleFeature = async (enabled: boolean) => {
//     if (!networkId) return;

//     try {
//       await updateSettingsMutation.mutateAsync({ networkId, isEnabled: enabled });
//       showToast(
//         enabled ? 'Akıllı rota özelliği aktif edildi' : 'Akıllı rota özelliği devre dışı bırakıldı',
//         'success'
//       );
//     } catch (error) {
//       showToast('Bir hata oluştu', 'error');
//     }
//   };

//   // Create route
//   const handleCreateRoute = async () => {
//     if (!routeName.trim() || !networkId) {
//       showToast('Lütfen rota adını girin', 'error');
//       return;
//     }

//     try {
//       await createRouteMutation.mutateAsync({
//         networkId,
//         name: routeName.trim(),
//         description: routeDescription.trim() || undefined,
//         routeType: selectedRouteType,
//         isDefault: isDefaultRoute,
//       });

//       setShowCreateRouteModal(false);
//       setRouteName("");
//       setRouteDescription("");
//       setSelectedRouteType('default');
//       setIsDefaultRoute(false);
//       showToast('Rota başarıyla oluşturuldu', 'success');
//     } catch (error) {
//       showToast('Rota oluşturulurken bir hata oluştu', 'error');
//     }
//   };

//   // Select route
//   const handleSelectRoute = async (routeId: string) => {
//     if (!networkId) return;

//     try {
//       await selectRouteMutation.mutateAsync({ networkId, routeId });
//       setShowRouteSelectionModal(false);
//       showToast('Rota seçiminiz kaydedildi', 'success');
//     } catch (error) {
//       showToast('Rota seçilirken bir hata oluştu', 'error');
//     }
//   };

//   // Get route type info
//   const getRouteTypeInfo = (type: string) => {
//     switch (type) {
//       case 'family':
//         return { name: 'Aile Rotası', icon: 'account-group', color: '#4ECDC4' };
//       case 'disabled_friendly':
//         return { name: 'Engelli Dostu', icon: 'wheelchair-accessibility', color: '#FF6B6B' };
//       case 'elderly_friendly':
//         return { name: 'Yaşlı Dostu', icon: 'account-heart', color: '#45B7D1' };
//       case 'custom':
//         return { name: 'Özel Rota', icon: 'map-marker-path', color: '#96CEB4' };
//       default:
//         return { name: 'Varsayılan Rota', icon: 'map', color: '#667EEA' };
//     }
//   };

//   // Get route status
//   const getRouteStatus = (route: any) => {
//     if (userSelection?.route_id === route.id) {
//       return { status: 'selected', text: 'Seçili Rota', color: '#4ECDC4' };
//     }
//     if (route.is_default) {
//       return { status: 'default', text: 'Varsayılan', color: '#667EEA' };
//     }
//     return { status: 'available', text: 'Kullanılabilir', color: '#999' };
//   };

//   if (isLoadingSettings || isLoadingRoutes) {
//     return (
//       <View style={[styles.container, { paddingTop: safeInsets.top + 20 }]}>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={colors.primary} />
//           <Text style={styles.loadingText}>Akıllı rota bilgileri yükleniyor...</Text>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <PremiumFeatureGate
//       featureId="smart-emergency-route"
//       fallback={
//         <View style={[styles.container, { paddingTop: safeInsets.top + 20 }]}> 
//           <View style={styles.premiumFallback}>
//             <MaterialCommunityIcons name="map-marker-path" size={64} color={colors.primary} />
//             <Text style={styles.premiumTitle}>Akıllı Acil Durum Rotası</Text>
//             <Text style={styles.premiumDescription}>
//               Bu özellik premium üyeler için kullanılabilir. Ağ grubunuz için özelleştirilmiş acil durum rotaları oluşturun.
//             </Text>
//           </View>
//         </View>
//       }
//     >
//       <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
//         <View style={styles.container}>
//           {/* Header */}
//           <LinearGradient
//             colors={['#45b7d110', '#45b7d105']}
//             style={[styles.headerGradient, { paddingTop: safeInsets.top + 20 }]}
//           >
//             <View style={styles.header}>
//               <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//                 <Ionicons name="arrow-back" size={24} color="#45B7D1" />
//               </TouchableOpacity>
//               <View style={styles.headerContent}>
//                 <View style={styles.headerTitleRow}>
//                   <MaterialCommunityIcons
//                     name="map-marker-path"
//                     size={24}
//                     color="#45B7D1"
//                     style={styles.headerIcon}
//                   />
//                   <Text style={styles.headerTitle}>Akıllı Acil Durum Rotası</Text>
//                 </View>
//                 <Text style={styles.headerSubtitle}>
//                   Ağ grubunuz için özelleştirilmiş acil durum rotaları oluşturun ve yönetin
//                 </Text>
//               </View>
//             </View>
//           </LinearGradient>

//           <ScrollView 
//             style={[styles.content, { paddingBottom: safeInsets.bottom }]} 
//             showsVerticalScrollIndicator={false}
//             contentContainerStyle={{ paddingBottom: 20 }}
//           >

//             {/* Debug Information */}
//             <View style={styles.debugSection}>
//               <Text style={styles.debugTitle}>🔍 Debug Bilgileri</Text>
//               <Text style={styles.debugText}>Network ID: {networkId}</Text>
//               <Text style={styles.debugText}>Network Data: {JSON.stringify(network)}</Text>
//               <Text style={styles.debugText}>Current User ID: {currentUser?.id || 'Yok'}</Text>
//               <Text style={styles.debugText}>Network Creator ID: {network?.created_by || 'Yok'}</Text>
//               <Text style={styles.debugText}>Members Count: {members?.length || 0}</Text>
//               <Text style={styles.debugText}>Is Admin: {isNetworkAdmin ? 'Evet' : 'Hayır'}</Text>
//               <Text style={styles.debugText}>User Member Role: {members?.find(m => m.user_id === currentUser?.id)?.role || 'Bulunamadı'}</Text>
//               <Text style={styles.debugText}>Is Network Creator: {network?.created_by === currentUser?.id ? 'Evet' : 'Hayır'}</Text>
//               <Text style={styles.debugText}>User Member Found: {members?.find(m => m.user_id === currentUser?.id) ? 'Evet' : 'Hayır'}</Text>
//               <Text style={styles.debugText}>All Members: {members?.map(m => `${m.user_id}:${m.role}`).join(', ') || 'Yok'}</Text>
//               <Text style={styles.debugText}>Settings Enabled: {routeSettings?.is_enabled ? 'Evet' : 'Hayır'}</Text>
//               <Text style={styles.debugText}>Settings Null: {routeSettings === null ? 'Evet' : 'Hayır'}</Text>
//               <Text style={styles.debugText}>Settings Undefined: {routeSettings === undefined ? 'Evet' : 'Hayır'}</Text>
//               <Text style={styles.debugText}>Settings Raw: {JSON.stringify(routeSettings)}</Text>
//               <Text style={styles.debugText}>Settings Type: {typeof routeSettings}</Text>
//               <Text style={styles.debugText}>Settings Keys: {routeSettings ? Object.keys(routeSettings).join(', ') : 'null'}</Text>
//               <Text style={styles.debugText}>Routes Count: {routes?.length ?? 0}</Text>
//               <Text style={styles.debugText}>Routes Null: {routes === null ? 'Evet' : 'Hayır'}</Text>
//               <Text style={styles.debugText}>Routes Undefined: {routes === undefined ? 'Evet' : 'Hayır'}</Text>
//               <Text style={styles.debugText}>User Selection: {userSelection ? 'Var' : 'Yok'}</Text>
//               <Text style={styles.debugText}>Loading Settings: {isLoadingSettings ? 'Evet' : 'Hayır'}</Text>
//               <Text style={styles.debugText}>Loading Routes: {isLoadingRoutes ? 'Evet' : 'Hayır'}</Text>
//               <Text style={styles.debugText}>Settings Error: {settingsError?.message || 'Yok'}</Text>
//               <Text style={styles.debugText}>Routes Error: {routesError?.message || 'Yok'}</Text>
//             </View>

//             {/* Feature Toggle (Test - Admin Check Disabled) */}
//             {true && (
//               <View style={styles.section}>
//                 <View style={styles.sectionHeader}>
//                   <Text style={styles.sectionTitle}>Özellik Yönetimi</Text>
//                   <Text style={styles.sectionSubtitle}>
//                     Akıllı rota özelliğini ağ grubunuz için aktif edin
//                   </Text>
//                 </View>
                
//                 {(routeSettings === null || routeSettings === undefined) ? (
//                   <View style={styles.initializeCard}>
//                     <LinearGradient
//                       colors={['#45b7d110', '#45b7d105']}
//                       style={styles.initializeCardGradient}
//                     >
//                       <MaterialCommunityIcons
//                         name="map-marker-path"
//                         size={48}
//                         color="#45B7D1"
//                       />
//                       <Text style={styles.initializeTitle}>Özellik Henüz Başlatılmamış</Text>
//                       <Text style={styles.initializeDescription}>
//                         Akıllı acil durum rotası özelliğini başlatmak için aşağıdaki butona tıklayın
//                       </Text>
//                       <TouchableOpacity
//                         style={styles.initializeButton}
//                         onPress={() => toggleFeature(true)}
//                       >
//                         <LinearGradient
//                           colors={['#45B7D1', '#45B7D1CC']}
//                           style={styles.initializeButtonGradient}
//                         >
//                           <Text style={styles.initializeButtonText}>Özelliği Başlat</Text>
//                         </LinearGradient>
//                       </TouchableOpacity>
//                     </LinearGradient>
//                   </View>
//                 ) : (
//                   <View style={styles.toggleCard}>
//                     <View style={styles.toggleContent}>
//                       <View style={styles.toggleInfo}>
//                         <Text style={styles.toggleTitle}>Akıllı Acil Durum Rotası</Text>
//                         <Text style={styles.toggleDescription}>
//                           Üyelerin acil durumlarda takip edebileceği rotalar oluşturun
//                         </Text>
//                       </View>
//                       <Switch
//                         value={routeSettings?.is_enabled ?? false}
//                         onValueChange={toggleFeature}
//                         trackColor={{ false: '#e0e0e0', true: '#45B7D1' }}
//                         thumbColor={(routeSettings?.is_enabled ?? false) ? '#fff' : '#f4f3f4'}
//                       />
//                     </View>
//                   </View>
//                 )}
//               </View>
//             )}

//             {/* Routes Section */}
//             {(routeSettings?.is_enabled || routeSettings === null || routeSettings === undefined) && (
//               <View style={styles.section}>
//                 <View style={styles.sectionHeader}>
//                   <Text style={styles.sectionTitle}>Mevcut Rotalar</Text>
//                   <Text style={styles.sectionSubtitle}>
//                     {routes?.length ?? 0} rota tanımlanmış
//                   </Text>
//                 </View>

//                 {(routes && routes.length > 0) ? (
//                   routes.map((route) => {
//                     const typeInfo = getRouteTypeInfo(route.route_type);
//                     const statusInfo = getRouteStatus(route);
                    
//                     return (
//                       <TouchableOpacity
//                         key={route.id}
//                         style={styles.routeCard}
//                         onPress={() => router.push(`/network/route/${route.id}?networkId=${networkId}`)}
//                       >
//                         <LinearGradient
//                           colors={[typeInfo.color + '10', typeInfo.color + '05']}
//                           style={styles.routeCardGradient}
//                         >
//                           <View style={styles.routeCardHeader}>
//                             <View style={[styles.routeIcon, { backgroundColor: typeInfo.color + '20' }]}>
//                               <MaterialCommunityIcons
//                                 name={typeInfo.icon as any}
//                                 size={24}
//                                 color={typeInfo.color}
//                               />
//                             </View>
//                             <View style={styles.routeInfo}>
//                               <Text style={styles.routeName}>{route.name}</Text>
//                               {route.description && (
//                                 <Text style={styles.routeDescription}>{route.description}</Text>
//                               )}
//                               <View style={styles.routeMeta}>
//                                 <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
//                                   <Text style={[styles.statusText, { color: statusInfo.color }]}>
//                                     {statusInfo.text}
//                                   </Text>
//                                 </View>
//                                 <Text style={styles.routeType}>{typeInfo.name}</Text>
//                               </View>
//                             </View>
//                             <Ionicons name="chevron-forward" size={20} color={colors.light.textSecondary} />
//                           </View>
//                         </LinearGradient>
//                       </TouchableOpacity>
//                     );
//                   })
//                 ) : (
//                   <View style={styles.emptyRoutesCard}>
//                     <LinearGradient
//                       colors={['#45b7d110', '#45b7d105']}
//                       style={styles.emptyCardGradient}
//                     >
//                       <MaterialCommunityIcons
//                         name="map-marker-path"
//                         size={56}
//                         color="#45B7D1"
//                       />
//                       <Text style={styles.emptyCardTitle}>Henüz Rota Tanımlanmamış</Text>
//                       <Text style={styles.emptyCardDescription}>
//                         İlk acil durum rotanızı oluşturun ve ağ üyelerinizin güvenliğini sağlayın
//                       </Text>
//                     </LinearGradient>
//                   </View>
//                 )}

//                 {/* Create Route Button (Test - Admin Check Disabled) */}
//                 {true && (
//                   <TouchableOpacity
//                     style={styles.createRouteButton}
//                     onPress={() => setShowCreateRouteModal(true)}
//                   >
//                     <LinearGradient
//                       colors={['#45B7D1', '#45B7D1CC']}
//                       style={styles.createButtonGradient}
//                     >
//                       <Ionicons name="add-circle" size={24} color="#fff" />
//                       <Text style={styles.createRouteButtonText}>Yeni Rota Oluştur</Text>
//                     </LinearGradient>
//                   </TouchableOpacity>
//                 )}
//               </View>
//             )}

//             {/* User Route Selection */}
//             {(routeSettings?.is_enabled || routeSettings === null || routeSettings === undefined) && (
//               <View style={styles.section}>
//                 <View style={styles.sectionHeader}>
//                   <Text style={styles.sectionTitle}>Rota Seçiminiz</Text>
//                   <Text style={styles.sectionSubtitle}>
//                     Acil durumlarda takip edeceğiniz rotayı seçin
//                   </Text>
//                 </View>

//                 {routes && routes.length > 0 ? (
//                   userSelection ? (
//                   <View style={styles.selectionCard}>
//                     <LinearGradient
//                       colors={['#4ECDC410', '#4ECDC405']}
//                       style={styles.selectionCardGradient}
//                     >
//                       <View style={styles.selectionHeader}>
//                         <MaterialCommunityIcons
//                           name="check-circle"
//                           size={24}
//                           color="#4ECDC4"
//                         />
//                         <Text style={styles.selectionTitle}>Seçili Rota</Text>
//                       </View>
//                       <Text style={styles.selectedRouteName}>{userSelection.route?.name}</Text>
//                       <TouchableOpacity
//                         style={styles.changeRouteButton}
//                         onPress={() => setShowRouteSelectionModal(true)}
//                       >
//                         <Text style={styles.changeRouteButtonText}>Rotayı Değiştir</Text>
//                       </TouchableOpacity>
//                     </LinearGradient>
//                   </View>
//                 ) : (
//                   <TouchableOpacity
//                     style={styles.selectRouteButton}
//                     onPress={() => setShowRouteSelectionModal(true)}
//                   >
//                     <LinearGradient
//                       colors={['#667EEA', '#5A67D8']}
//                       style={styles.selectButtonGradient}
//                     >
//                       <MaterialCommunityIcons name="map-marker-path" size={24} color="#fff" />
//                       <Text style={styles.selectRouteButtonText}>Rota Seç</Text>
//                     </LinearGradient>
//                   </TouchableOpacity>
//                 )
//               ) : (
//                 <View style={styles.emptyRoutesCard}>
//                   <LinearGradient
//                     colors={['#45b7d110', '#45b7d105']}
//                     style={styles.emptyCardGradient}
//                   >
//                     <MaterialCommunityIcons
//                       name="map-marker-path"
//                       size={56}
//                       color="#45B7D1"
//                     />
//                     <Text style={styles.emptyCardTitle}>Henüz Rota Tanımlanmamış</Text>
//                     <Text style={styles.emptyCardDescription}>
//                       Admin tarafından rota oluşturulmasını bekleyin
//                     </Text>
//                   </LinearGradient>
//                 </View>
//               )}
//               </View>
//             )}

//             {/* Route Statistics (Admin Only) */}
//             {isNetworkAdmin && routeOverview && routeOverview.length > 0 && (
//               <View style={styles.section}>
//                 <View style={styles.sectionHeader}>
//                   <Text style={styles.sectionTitle}>Rota İstatistikleri</Text>
//                   <Text style={styles.sectionSubtitle}>
//                     Üyelerin rota seçimlerini takip edin
//                   </Text>
//                 </View>

//                 {routeOverview.map((route) => (
//                   <View key={route.id} style={styles.statCard}>
//                     <View style={styles.statHeader}>
//                       <Text style={styles.statRouteName}>{route.name}</Text>
//                       <Text style={styles.statCount}>
//                         {route.user_route_selections?.length || 0} kişi seçti
//                       </Text>
//                     </View>
//                     {route.user_route_selections && route.user_route_selections.length > 0 && (
//                       <View style={styles.statUsers}>
//                         {route.user_route_selections.slice(0, 3).map((selection, index) => (
//                           <Text key={index} style={styles.statUserName}>
//                             {selection.profiles?.name} {selection.profiles?.surname}
//                           </Text>
//                         ))}
//                         {route.user_route_selections.length > 3 && (
//                           <Text style={styles.statMoreUsers}>
//                             +{route.user_route_selections.length - 3} kişi daha
//                           </Text>
//                         )}
//                       </View>
//                     )}
//                   </View>
//                 ))}
//               </View>
//             )}
//           </ScrollView>

//           {/* Create Route Modal */}
//           <Modal
//             visible={showCreateRouteModal}
//             animationType="slide"
//             transparent={true}
//             onRequestClose={() => setShowCreateRouteModal(false)}
//           >
//             <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
//               <View style={[styles.modalOverlay, { 
//                 paddingTop: safeInsets.top, 
//                 paddingBottom: safeInsets.bottom 
//               }]}> 
//                 <View style={styles.modalContent}>
//                 <View style={styles.modalHeader}>
//                   <Text style={styles.modalTitle}>Yeni Rota Oluştur</Text>
//                   <TouchableOpacity
//                     onPress={() => setShowCreateRouteModal(false)}
//                     style={styles.closeButton}
//                   >
//                     <Ionicons name="close" size={24} color="#666" />
//                   </TouchableOpacity>
//                 </View>

//                 <TextInput
//                   style={styles.input}
//                   placeholder="Rota adı (örn: Aile Rotası, Engelli Dostu Rota)"
//                   placeholderTextColor="#999"
//                   value={routeName}
//                   onChangeText={setRouteName}
//                   maxLength={50}
//                 />

//                 <TextInput
//                   style={[styles.input, styles.textArea]}
//                   placeholder="Rota açıklaması (opsiyonel)"
//                   placeholderTextColor="#999"
//                   value={routeDescription}
//                   onChangeText={setRouteDescription}
//                   multiline
//                   numberOfLines={3}
//                   maxLength={200}
//                 />

//                 <Text style={styles.modalSubtitle}>Rota Türü</Text>
//                 <View style={styles.routeTypeOptions}>
//                   {[
//                     { type: 'default', name: 'Varsayılan', icon: 'map' },
//                     { type: 'family', name: 'Aile Rotası', icon: 'account-group' },
//                     { type: 'disabled_friendly', name: 'Engelli Dostu', icon: 'wheelchair-accessibility' },
//                     { type: 'elderly_friendly', name: 'Yaşlı Dostu', icon: 'account-heart' },
//                     { type: 'custom', name: 'Özel Rota', icon: 'map-marker-path' },
//                   ].map((option) => (
//                     <TouchableOpacity
//                       key={option.type}
//                       style={[
//                         styles.routeTypeOption,
//                         selectedRouteType === option.type && styles.routeTypeOptionSelected
//                       ]}
//                       onPress={() => setSelectedRouteType(option.type as any)}
//                     >
//                       <MaterialCommunityIcons
//                         name={option.icon as any}
//                         size={20}
//                         color={selectedRouteType === option.type ? '#fff' : '#666'}
//                       />
//                       <Text style={[
//                         styles.routeTypeOptionText,
//                         selectedRouteType === option.type && styles.routeTypeOptionTextSelected
//                       ]}>
//                         {option.name}
//                       </Text>
//                     </TouchableOpacity>
//                   ))}
//                 </View>

//                 <View style={styles.checkboxContainer}>
//                   <TouchableOpacity
//                     style={styles.checkbox}
//                     onPress={() => setIsDefaultRoute(!isDefaultRoute)}
//                   >
//                     {isDefaultRoute && (
//                       <Ionicons name="checkmark" size={16} color="#fff" />
//                     )}
//                   </TouchableOpacity>
//                   <Text style={styles.checkboxLabel}>Varsayılan rota olarak ayarla</Text>
//                 </View>

//                 <TouchableOpacity
//                   style={styles.modalButton}
//                   onPress={handleCreateRoute}
//                   disabled={createRouteMutation.isPending}
//                 >
//                   {createRouteMutation.isPending ? (
//                     <ActivityIndicator size="small" color="#fff" />
//                   ) : (
//                     <Text style={styles.modalButtonText}>Rota Oluştur</Text>
//                   )}
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </TouchableWithoutFeedback>
//         </Modal>

//           {/* Route Selection Modal */}
//           <Modal
//             visible={showRouteSelectionModal}
//             animationType="slide"
//             transparent={true}
//             onRequestClose={() => setShowRouteSelectionModal(false)}
//           >
//             <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
//               <View style={[styles.modalOverlay, { 
//                 paddingTop: safeInsets.top, 
//                 paddingBottom: safeInsets.bottom 
//               }]}> 
//                 <View style={styles.modalContent}>
//                   <View style={styles.modalHeader}>
//                     <Text style={styles.modalTitle}>Rota Seçin</Text>
//                     <TouchableOpacity
//                       onPress={() => setShowRouteSelectionModal(false)}
//                       style={styles.closeButton}
//                     >
//                       <Ionicons name="close" size={24} color="#666" />
//                     </TouchableOpacity>
//                   </View>
//                   <Text style={styles.modalSubtitle}>
//                     Acil durumlarda takip edeceğiniz rotayı seçin
//                   </Text>
//                   {routes?.map((route) => {
//                     const typeInfo = getRouteTypeInfo(route.route_type);
//                     const isSelected = userSelection?.route_id === route.id;
//                     return (
//                       <TouchableOpacity
//                         key={route.id}
//                         style={[
//                           styles.routeSelectionCard,
//                           isSelected && styles.routeSelectionCardSelected
//                         ]}
//                         onPress={() => handleSelectRoute(route.id)}
//                       >
//                         <View style={styles.routeSelectionHeader}>
//                           <View style={[styles.routeSelectionIcon, { backgroundColor: typeInfo.color + '20' }]}> 
//                             <MaterialCommunityIcons
//                               name={typeInfo.icon as any}
//                               size={20}
//                               color={typeInfo.color}
//                             />
//                           </View>
//                           <View style={styles.routeSelectionInfo}>
//                             <Text style={styles.routeSelectionName}>{route.name}</Text>
//                             <Text style={styles.routeSelectionType}>{typeInfo.name}</Text>
//                           </View>
//                           {isSelected && (
//                             <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
//                           )}
//                         </View>
//                       </TouchableOpacity>
//                     );
//                   })}
//                 </View>
//               </View>
//             </TouchableWithoutFeedback>
//           </Modal>

//           <Toast
//             visible={toast.visible}
//             message={toast.message}
//             type={toast.type}
//             onHide={hideToast}
//           />
//         </View>
//       </TouchableWithoutFeedback>
//     </PremiumFeatureGate>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//     paddingTop: 0,
//   },
//   headerGradient: {
//     paddingBottom: 20,
//     paddingHorizontal: 20,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   backButton: {
//     marginRight: 15,
//   },
//   headerContent: {
//     flex: 1,
//   },
//   headerTitleRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 5,
//   },
//   headerIcon: {
//     marginRight: 10,
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     color: '#666',
//     lineHeight: 20,
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: 20,
//     paddingTop: 10,
//   },
//   section: {
//     marginBottom: 30,
//   },
//   sectionHeader: {
//     marginBottom: 15,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 5,
//   },
//   sectionSubtitle: {
//     fontSize: 14,
//     color: '#666',
//   },
//   toggleCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   toggleContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   toggleInfo: {
//     flex: 1,
//     marginRight: 15,
//   },
//   toggleTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 5,
//   },
//   toggleDescription: {
//     fontSize: 14,
//     color: '#666',
//     lineHeight: 20,
//   },
//   routeCard: {
//     marginBottom: 15,
//     borderRadius: 12,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   routeCardGradient: {
//     padding: 20,
//   },
//   routeCardHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   routeIcon: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 15,
//   },
//   routeInfo: {
//     flex: 1,
//   },
//   routeName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 5,
//   },
//   routeDescription: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 10,
//     lineHeight: 20,
//   },
//   routeMeta: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   statusBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//     marginRight: 10,
//   },
//   statusText: {
//     fontSize: 12,
//     fontWeight: '500',
//   },
//   routeType: {
//     fontSize: 12,
//     color: '#999',
//   },
//   debugSection: {
//     backgroundColor: '#f0f0f0',
//     padding: 15,
//     margin: 15,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#ddd',
//   },
//   debugTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 10,
//   },
//   debugText: {
//     fontSize: 12,
//     color: '#666',
//     marginBottom: 5,
//   },
//   initializeCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 30,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   initializeCardGradient: {
//     alignItems: 'center',
//     width: '100%',
//   },
//   initializeTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#333',
//     marginTop: 15,
//     marginBottom: 10,
//     textAlign: 'center',
//   },
//   initializeDescription: {
//     fontSize: 14,
//     color: '#666',
//     textAlign: 'center',
//     lineHeight: 20,
//     marginBottom: 20,
//   },
//   initializeButton: {
//     borderRadius: 12,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   initializeButtonGradient: {
//     paddingVertical: 15,
//     paddingHorizontal: 30,
//     alignItems: 'center',
//   },
//   initializeButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   emptyRoutesCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 40,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   emptyCardGradient: {
//     alignItems: 'center',
//   },
//   emptyCardTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#333',
//     marginTop: 15,
//     marginBottom: 10,
//     textAlign: 'center',
//   },
//   emptyCardDescription: {
//     fontSize: 14,
//     color: '#666',
//     textAlign: 'center',
//     lineHeight: 20,
//   },
//   createRouteButton: {
//     marginTop: 15,
//     borderRadius: 12,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   createButtonGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 15,
//     paddingHorizontal: 20,
//   },
//   createRouteButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//     marginLeft: 10,
//   },
//   selectionCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   selectionCardGradient: {
//     padding: 20,
//   },
//   selectionHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   selectionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginLeft: 10,
//   },
//   selectedRouteName: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#4ECDC4',
//     marginBottom: 15,
//   },
//   changeRouteButton: {
//     alignSelf: 'flex-start',
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     backgroundColor: '#4ECDC4',
//     borderRadius: 20,
//   },
//   changeRouteButtonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   selectRouteButton: {
//     borderRadius: 12,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   selectButtonGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 15,
//     paddingHorizontal: 20,
//   },
//   selectRouteButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//     marginLeft: 10,
//   },
//   statCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   statHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   statRouteName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//   },
//   statCount: {
//     fontSize: 14,
//     color: '#666',
//   },
//   statUsers: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//   },
//   statUserName: {
//     fontSize: 12,
//     color: '#999',
//     marginRight: 10,
//     marginBottom: 5,
//   },
//   statMoreUsers: {
//     fontSize: 12,
//     color: '#999',
//     fontStyle: 'italic',
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   modalContent: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 20,
//     width: '100%',
//     maxHeight: '80%',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   closeButton: {
//     padding: 5,
//   },
//   modalSubtitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 15,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//     borderRadius: 8,
//     paddingHorizontal: 15,
//     paddingVertical: 12,
//     fontSize: 16,
//     color: '#333',
//     marginBottom: 15,
//   },
//   textArea: {
//     height: 80,
//     textAlignVertical: 'top',
//   },
//   routeTypeOptions: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     marginBottom: 20,
//   },
//   routeTypeOption: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 20,
//     backgroundColor: '#f0f0f0',
//     marginRight: 10,
//     marginBottom: 10,
//   },
//   routeTypeOptionSelected: {
//     backgroundColor: '#45B7D1',
//   },
//   routeTypeOptionText: {
//     fontSize: 14,
//     color: '#666',
//     marginLeft: 5,
//   },
//   routeTypeOptionTextSelected: {
//     color: '#fff',
//   },
//   checkboxContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   checkbox: {
//     width: 20,
//     height: 20,
//     borderRadius: 4,
//     backgroundColor: '#45B7D1',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 10,
//   },
//   checkboxLabel: {
//     fontSize: 14,
//     color: '#333',
//   },
//   modalButton: {
//     backgroundColor: '#45B7D1',
//     borderRadius: 8,
//     paddingVertical: 15,
//     alignItems: 'center',
//   },
//   modalButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   routeSelectionCard: {
//     backgroundColor: '#f8f9fa',
//     borderRadius: 8,
//     padding: 15,
//     marginBottom: 10,
//   },
//   routeSelectionCardSelected: {
//     backgroundColor: '#4ECDC410',
//     borderWidth: 2,
//     borderColor: '#4ECDC4',
//   },
//   routeSelectionHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   routeSelectionIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 15,
//   },
//   routeSelectionInfo: {
//     flex: 1,
//   },
//   routeSelectionName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 5,
//   },
//   routeSelectionType: {
//     fontSize: 14,
//     color: '#666',
//   },
//   premiumFallback: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//   },
//   premiumTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#333',
//     marginTop: 20,
//     marginBottom: 15,
//     textAlign: 'center',
//   },
//   premiumDescription: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//     lineHeight: 24,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 15,
//     fontSize: 16,
//     color: '#666',
//   },

// }); 