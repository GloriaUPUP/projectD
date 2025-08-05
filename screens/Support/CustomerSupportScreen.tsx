import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Card } from '../../components';

interface CustomerSupportScreenProps {
  navigation: any;
}

const CustomerSupportScreen: React.FC<CustomerSupportScreenProps> = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);

  const supportCategories = [
    { id: 'delivery', title: 'Delivery Issues', icon: '📦' },
    { id: 'payment', title: 'Payment & Billing', icon: '💳' },
    { id: 'account', title: 'Account Settings', icon: '👤' },
    { id: 'technical', title: 'Technical Support', icon: '🔧' },
    { id: 'other', title: 'Other', icon: '💬' },
  ];

  const faqItems = [
    {
      question: 'How long does delivery usually take?',
      answer: 'Delivery times vary by service type: Ground Robot (4-6 hours), Drone (1-2 hours).',
    },
    {
      question: 'Can I track my package in real-time?',
      answer: 'Yes, all deliveries include real-time tracking with GPS updates.',
    },
    {
      question: 'What is the maximum package weight?',
      answer: 'Ground robots can handle up to 10kg, drones up to 5kg.',
    },
    {
      question: 'How do I cancel an order?',
      answer: 'You can cancel orders before pickup from your order history.',
    },
  ];

  const handleSubmitSupport = () => {
    if (!selectedCategory || !subject || !description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    Alert.alert(
      'Support Request Submitted',
      'Thank you for contacting us. We will respond within 24 hours.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Help & Support</Text>
      </View>

      <ScrollView style={styles.content}>
        {!showContactForm ? (
          <>
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => setShowContactForm(true)}
              >
                <Text style={styles.quickActionIcon}>📞</Text>
                <Text style={styles.quickActionText}>Contact Support</Text>
                <Text style={styles.quickActionArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickAction, styles.quickActionBorder]}>
                <Text style={styles.quickActionIcon}>📚</Text>
                <Text style={styles.quickActionText}>View Help Center</Text>
                <Text style={styles.quickActionArrow}>›</Text>
              </TouchableOpacity>
            </Card>

            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
              {faqItems.map((item, index) => (
                <View key={index} style={[styles.faqItem, index < faqItems.length - 1 && styles.faqItemBorder]}>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  <Text style={styles.faqAnswer}>{item.answer}</Text>
                </View>
              ))}
            </Card>

            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>Email:</Text>
                <Text style={styles.contactValue}>support@deliveryapp.com</Text>
              </View>
              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>Phone:</Text>
                <Text style={styles.contactValue}>+1 (555) 123-4567</Text>
              </View>
              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>Hours:</Text>
                <Text style={styles.contactValue}>24/7 Support Available</Text>
              </View>
            </Card>
          </>
        ) : (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Support</Text>
            
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {supportCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id && styles.selectedCategory,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.selectedCategoryText,
                  ]}>
                    {category.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Subject"
              value={subject}
              onChangeText={setSubject}
              placeholder="Brief description of your issue"
              required
            />

            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Please provide details about your issue"
              multiline
              numberOfLines={4}
              required
            />

            <View style={styles.formButtons}>
              <Button
                title="Back"
                onPress={() => setShowContactForm(false)}
                variant="outline"
                style={styles.backButton}
              />
              <Button
                title="Submit"
                onPress={handleSubmitSupport}
                style={styles.submitButton}
              />
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  quickActionBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 8,
    paddingTop: 20,
  },
  quickActionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  quickActionText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  quickActionArrow: {
    fontSize: 20,
    color: '#C7C7CC',
  },
  faqItem: {
    paddingVertical: 12,
  },
  faqItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 12,
    paddingBottom: 20,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  contactLabel: {
    fontSize: 14,
    color: '#666666',
    width: 60,
  },
  contactValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    flex: 1,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  categoryButton: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    margin: '1%',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCategory: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  formButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default CustomerSupportScreen;