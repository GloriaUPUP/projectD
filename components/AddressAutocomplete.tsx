import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { apiService } from '../services/api';

interface Suggestion {
  address: string;
  confidence: number;
}

interface AddressAutocompleteProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onSuggestionSelect?: (suggestion: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  label,
  value,
  onChangeText,
  onSuggestionSelect,
  error,
  required = false,
  placeholder,
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (value.length >= 3) {
      fetchSuggestions(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) return;

    setLoading(true);
    try {
      const response = await apiService.getAddressSuggestions(query);
      const suggestions = response.success && response.data?.data?.suggestions ? response.data.data.suggestions : [];
      if (suggestions.length > 0) {
        setSuggestions(suggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const parseAddress = (fullAddress: string) => {
    // Parse the address into components
    // Expected format: "88 Hillside Blvd. Daly City, CA, 94014 USA"
    const parts = fullAddress.split(',').map(part => part.trim());
    
    if (parts.length >= 3) {
      // parts[0] = "88 Hillside Blvd. Daly City"  
      // parts[1] = "CA"
      // parts[2] = "94014 USA"
      
      const firstPart = parts[0]; // "88 Hillside Blvd. Daly City"
      const state = parts[1]; // "CA"
      const zipCountry = parts[2]; // "94014 USA"
      
      // Extract postal code from the last part
      const postalCodeMatch = zipCountry.match(/(\b\d{5}(?:-\d{4})?)/);
      const postalCode = postalCodeMatch ? postalCodeMatch[1] : '';
      
      // Split first part to get street and city
      // Find the last occurrence of a street indicator or split by common patterns
      const streetCityParts = firstPart.split(' ');
      
      // Try to identify where street ends and city begins
      // Look for common street suffixes: St, Ave, Blvd, Dr, Rd, etc.
      let streetEndIndex = -1;
      const streetSuffixes = ['St', 'Ave', 'Blvd', 'Dr', 'Rd', 'Lane', 'Way', 'Ct', 'Pl', 'Circle', 'Street', 'Avenue', 'Boulevard', 'Drive', 'Road'];
      
      for (let i = 0; i < streetCityParts.length; i++) {
        const part = streetCityParts[i].replace(/[.,]/g, ''); // Remove punctuation
        if (streetSuffixes.some(suffix => part.toLowerCase() === suffix.toLowerCase())) {
          streetEndIndex = i;
          break;
        }
      }
      
      let street, city;
      if (streetEndIndex !== -1) {
        // Found street suffix, split there
        street = streetCityParts.slice(0, streetEndIndex + 1).join(' ');
        city = streetCityParts.slice(streetEndIndex + 1).join(' ').trim();
      } else {
        // Fallback: assume last 2 words are city (e.g., "Daly City")
        if (streetCityParts.length >= 3) {
          street = streetCityParts.slice(0, -2).join(' ');
          city = streetCityParts.slice(-2).join(' ');
        } else {
          street = firstPart;
          city = '';
        }
      }
      
      return { street, city, state, postalCode };
    } else if (parts.length === 2) {
      // Handle simpler format like "Street Address, City State ZIP"
      const street = parts[0];
      const cityStateZip = parts[1];
      
      // Extract postal code
      const postalCodeMatch = cityStateZip.match(/(\b\d{5}(?:-\d{4})?)/);
      const postalCode = postalCodeMatch ? postalCodeMatch[1] : '';
      
      // Remove postal code and country to get city and state
      const cityState = cityStateZip.replace(/\b\d{5}(?:-\d{4})?\b/, '').replace(/\bUSA\b/i, '').trim();
      
      // Split by space and take last part as state, rest as city
      const cityStateParts = cityState.split(' ');
      const state = cityStateParts[cityStateParts.length - 1] || '';
      const city = cityStateParts.slice(0, -1).join(' ') || '';
      
      return { street, city, state, postalCode };
    }
    
    return { street: fullAddress, city: '', state: '', postalCode: '' };
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    // Use the full address suggestion
    onChangeText(suggestion.address);
    
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion.address);
    }
    
    setShowSuggestions(false);
  };

  const handleInputChange = (text: string) => {
    onChangeText(text);
    if (text.length < 3) {
      setShowSuggestions(false);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (value.length >= 3 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow tap selection
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  const renderSuggestion = ({ item }: { item: Suggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionSelect(item)}
    >
      <Text style={styles.suggestionText}>{item.address}</Text>
      <Text style={styles.confidenceText}>
        {Math.round(item.confidence * 100)}% match
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        <View style={[styles.inputWrapper, error && styles.inputError, isFocused && styles.inputFocused]}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            placeholderTextColor="#999999"
            autoComplete="address-line1"
            autoCorrect={false}
          />
          {loading && (
            <ActivityIndicator
              size="small"
              color="#007AFF"
              style={styles.loadingIndicator}
            />
          )}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item, index) => `${item.address}-${index}`}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            maxToRenderPerBatch={5}
            initialNumToRender={5}
            nestedScrollEnabled={true}
          />
        </View>
      )}

      {showSuggestions && suggestions.length === 0 && !loading && value.length >= 3 && (
        <View style={styles.noSuggestionsContainer}>
          <Text style={styles.noSuggestionsText}>
            No address suggestions found. Please check your input.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    position: 'relative',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputFocused: {
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 12,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 2,
  },
  confidenceText: {
    fontSize: 12,
    color: '#666666',
  },
  noSuggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  noSuggestionsText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});

export default AddressAutocomplete;