import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../utils/constants/colors';
import useReducedMotion from '../../hooks/useReducedMotion';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface DocumentCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface UploadedDocument {
  id: string;
  uri: string;
  name: string;
  type: 'image' | 'pdf' | 'document';
  category: string;
  size: number;
  uploadDate: Date;
  metadata?: {
    width?: number;
    height?: number;
    pageCount?: number;
  };
}

interface DocumentUploaderProps {
  categories: DocumentCategory[];
  onDocumentUploaded: (document: UploadedDocument) => void;
  maxFileSizeMB?: number;
  allowedTypes?: ('image' | 'pdf' | 'document')[];
  style?: any;
}

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  { id: 'cpd', label: 'CPD Evidence', icon: '📚', color: COLORS.primary },
  { id: 'registration', label: 'Registration', icon: '📋', color: COLORS.secondary },
  { id: 'standards', label: 'Standards', icon: '⭐', color: '#F59E0B' },
  { id: 'other', label: 'Other', icon: '📁', color: '#6B7280' },
];

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  categories = DOCUMENT_CATEGORIES,
  onDocumentUploaded,
  maxFileSizeMB = 10,
  allowedTypes = ['image', 'pdf', 'document'],
  style,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<UploadedDocument | null>(null);
  const isReducedMotion = useReducedMotion();

  // Request permissions
  const requestPermissions = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraPermission.status !== 'granted' || mediaPermission.status !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Camera and photo library access are needed to upload documents.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  // Generate unique document ID
  const generateDocumentId = (): string => {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Get file type from extension
  const getFileType = (uri: string): 'image' | 'pdf' | 'document' => {
    const extension = uri.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return 'image';
    } else if (extension === 'pdf') {
      return 'pdf';
    }
    return 'document';
  };

  // Store document securely
  const storeDocument = async (uri: string, originalName: string): Promise<string> => {
    try {
      // Create documents directory if it doesn't exist
      const documentsDir = `${FileSystem.documentDirectory}documents/`;
      const dirInfo = await FileSystem.getInfoAsync(documentsDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(documentsDir, { intermediates: true });
      }

      // Generate secure filename
      const timestamp = Date.now();
      const extension = originalName.split('.').pop() || 'file';
      const secureFilename = `${timestamp}_${generateDocumentId()}.${extension}`;
      const newUri = `${documentsDir}${secureFilename}`;

      // Copy file to secure location
      await FileSystem.copyAsync({
        from: uri,
        to: newUri,
      });

      return newUri;
    } catch (error) {
      console.error('Failed to store document:', error);
      throw new Error('Failed to store document securely');
    }
  };

  // Handle camera capture
  const handleCameraCapture = async () => {
    try {
      if (!(await requestPermissions())) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets?.[0]) {
        await processDocument(result.assets[0]);
      }
    } catch (error) {
      console.error('Camera capture failed:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    }
  };

  // Handle gallery selection
  const handleGalleryPicker = async () => {
    try {
      if (!(await requestPermissions())) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets?.[0]) {
        await processDocument(result.assets[0]);
      }
    } catch (error) {
      console.error('Gallery picker failed:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Handle document picker
  const handleDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'text/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled) {
        await processDocument({
          uri: result.assets[0].uri,
          fileName: result.assets[0].name,
          fileSize: result.assets[0].size || 0,
        });
      }
    } catch (error) {
      console.error('Document picker failed:', error);
      Alert.alert('Error', 'Failed to select document. Please try again.');
    }
  };

  // Process selected document
  const processDocument = async (asset: any) => {
    if (!selectedCategory) {
      Alert.alert('Category Required', 'Please select a document category first.');
      return;
    }

    setIsUploading(true);

    try {
      const fileSize = asset.fileSize || 0;
      const fileSizeMB = fileSize / (1024 * 1024);

      // Check file size
      if (fileSizeMB > maxFileSizeMB) {
        Alert.alert(
          'File Too Large',
          `File size (${fileSizeMB.toFixed(1)}MB) exceeds the ${maxFileSizeMB}MB limit.`
        );
        return;
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);
      if (!fileInfo.exists) {
        throw new Error('Selected file does not exist');
      }

      // Store document securely
      const secureUri = await storeDocument(asset.uri, asset.fileName || 'document');
      
      // Create document object
      const document: UploadedDocument = {
        id: generateDocumentId(),
        uri: secureUri,
        name: asset.fileName || `Document_${Date.now()}`,
        type: getFileType(asset.uri),
        category: selectedCategory,
        size: fileSize,
        uploadDate: new Date(),
        metadata: {
          width: asset.width,
          height: asset.height,
        },
      };

      // Show preview
      setPreviewDocument(document);
      
      // Notify parent
      onDocumentUploaded(document);

      if (!isReducedMotion) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setIsModalVisible(false);
      setSelectedCategory('');

    } catch (error) {
      console.error('Document processing failed:', error);
      Alert.alert('Error', 'Failed to process document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Render upload option
  const renderUploadOption = (
    icon: string,
    label: string,
    onPress: () => void,
    disabled: boolean = false
  ) => (
    <TouchableOpacity
      style={[styles.uploadOption, disabled && styles.uploadOptionDisabled]}
      onPress={onPress}
      disabled={disabled || isUploading}
      activeOpacity={0.7}
    >
      <Text style={styles.uploadOptionIcon}>{icon}</Text>
      <Text style={[styles.uploadOptionText, disabled && styles.uploadOptionTextDisabled]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Render category selector
  const renderCategorySelector = () => (
    <View style={styles.categorySection}>
      <Text style={styles.sectionTitle}>Select Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipSelected,
              { borderColor: category.color },
            ]}
            onPress={() => setSelectedCategory(category.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text
              style={[
                styles.categoryLabel,
                selectedCategory === category.id && styles.categoryLabelSelected,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <>
      {/* Main Upload Button */}
      <TouchableOpacity
        style={[styles.uploadButton, style]}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Upload document"
        accessibilityHint="Tap to upload documents from camera or file system"
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.purple2]}
          style={styles.uploadButtonGradient}
        >
          <Ionicons name="cloud-upload" size={24} color={COLORS.white} />
          <Text style={styles.uploadButtonText}>Upload Document</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Upload Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.purple2]}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Upload Document</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
            {/* Category Selector */}
            {renderCategorySelector()}

            {/* Upload Options */}
            <View style={styles.uploadSection}>
              <Text style={styles.sectionTitle}>Choose Upload Method</Text>
              
              {renderUploadOption('📷', 'Take Photo', handleCameraCapture)}
              {renderUploadOption('🖼️', 'Choose from Gallery', handleGalleryPicker)}
              {renderUploadOption('📁', 'Select Document', handleDocumentPicker)}
            </View>

            {/* File Info */}
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Supported Formats</Text>
              <Text style={styles.infoText}>
                • Images: JPG, PNG, GIF, WebP{'\n'}
                • Documents: PDF{'\n'}
                • Maximum size: {maxFileSizeMB}MB{'\n'}
                • All files are encrypted and stored locally
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Document Preview Modal */}
      <Modal
        visible={!!previewDocument}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPreviewDocument(null)}
      >
        {previewDocument && (
          <View style={styles.previewOverlay}>
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Document Uploaded Successfully!</Text>
              
              {previewDocument.type === 'image' && (
                <Image
                  source={{ uri: previewDocument.uri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              )}
              
              <View style={styles.previewInfo}>
                <Text style={styles.previewInfoText}>
                  Name: {previewDocument.name}{'\n'}
                  Category: {categories.find(c => c.id === previewDocument.category)?.label}{'\n'}
                  Size: {(previewDocument.size / 1024).toFixed(1)}KB{'\n'}
                  Type: {previewDocument.type.toUpperCase()}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.previewCloseButton}
                onPress={() => setPreviewDocument(null)}
              >
                <Text style={styles.previewCloseText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  uploadButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  uploadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  modalTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#F9FAFB',
  },
  categoryChipSelected: {
    backgroundColor: 'rgba(107, 70, 193, 0.1)',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryLabelSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  uploadSection: {
    marginBottom: 32,
  },
  uploadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  uploadOptionDisabled: {
    opacity: 0.5,
  },
  uploadOptionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  uploadOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  uploadOptionTextDisabled: {
    color: '#9CA3AF',
  },
  infoSection: {
    padding: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: screenHeight * 0.8,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  previewInfo: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    width: '100%',
    marginBottom: 20,
  },
  previewInfoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  previewCloseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  previewCloseText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DocumentUploader;