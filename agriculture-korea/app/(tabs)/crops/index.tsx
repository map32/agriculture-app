import {categories, categoriesMapping} from '@/constants/constants';
import cropClass from '@/assets/crop_class.json';
import { TextInput, Text, View, StyleSheet, TouchableOpacity, FlatList, ScrollView, SafeAreaView} from 'react-native';
import {useState, createContext, useEffect, useRef, useMemo, useCallback, FC, useContext} from 'react';
import Svg, { Path } from 'react-native-svg'; // For icons if needed, though not strictly used in this version for search/filter icons
import { useRouter } from 'expo-router';

// Flatten the cropClass data and add the category to each item
const cropFlattened = Object.entries(cropClass).reduce((acc: any[], [category, value]) => {const _v = value.map((item) => ({...item, category: category}));return acc.concat(_v)}, [])
// Define the shape of the DataContext
interface DataContextType {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  list: any[];
  setList: React.Dispatch<React.SetStateAction<any[]>>;
  selectedCategory: string | null;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string | null>>;
}

// Create the DataContext
const DataContext = createContext<DataContextType>({
  search: '',
  setSearch: () => {},
  list: [],
  setList: () => {},
  selectedCategory: null,
  setSelectedCategory: () => {},
});

// Define the color palette
const colors = {
  primaryGreen: 'rgba(23, 190, 126, 1)', // Main green for accents
  darkGreen: 'rgba(6, 172, 108, 1)',    // Darker green for buttons/stronger elements
  white: '#FFFFFF',                     // Background and text
  lightGray: '#F0F4F8',                 // Subtle background for sections
  darkGray: '#4B5563',                  // Secondary text
  textBlack: '#1F2937',                 // Main text color
  borderColor: '#D1D5DB',               // Border color for inputs/cards
};

// Search function to filter crops by text and category
const filterCrops = (searchText: string, category: string | null) => {
  let items = cropFlattened;

  // Filter by category first if one is selected
  if (category && category !== 'All') { // 'All' will be a special category to show all crops
    items = items.filter((item) => item.category === category);
  }

  // Then filter by search text
  if (searchText) {
    const lowerCaseSearchText = searchText.toLowerCase();
    items = items.filter(
      (item) =>
        item.svcCodeNm.includes(searchText) ||
        item.svcCodeNmEng.toLowerCase().includes(lowerCaseSearchText)
    );
  }
  return items;
};

// SearchBar Component
const SearchBar = () => {
  const { search, setSearch, setList, selectedCategory } = useContext(DataContext);

  // Handle search logic when text changes or category changes
  useEffect(() => {
    setList(filterCrops(search, selectedCategory));
  }, [search, selectedCategory, setList]); // Depend on search, selectedCategory, and setList

  return (
    <View style={styles.searchBarContainer}>
      <TextInput
        autoCapitalize='none'
        autoComplete='off'
        autoCorrect={false}
        onChangeText={setSearch}
        value={search}
        placeholder="Search for crops..."
        placeholderTextColor={colors.darkGray}
        style={[styles.searchInput, { color: colors.textBlack, borderColor: colors.borderColor }]}
      />
      {/* Clear button for search input */}
      {search.length > 0 && (
        <TouchableOpacity onPress={() => setSearch('')} style={styles.clearButton}>
          <Text style={{ color: colors.darkGray, fontSize: 18 }}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Categories Component
const Categories = () => {
  const { selectedCategory, setSelectedCategory } = useContext(DataContext);

  return (
    <View style={styles.categoriesContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
        {/* "All" category button */}
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === null || selectedCategory === 'All'
              ? { backgroundColor: colors.darkGreen }
              : { backgroundColor: colors.lightGray },
          ]}
          onPress={() => setSelectedCategory('All')}
        >
          <Text
            style={[
              styles.categoryButtonText,
              selectedCategory === null || selectedCategory === 'All'
                ? { color: colors.white }
                : { color: colors.darkGray },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        {/* Dynamic category buttons */}
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category
                ? { backgroundColor: colors.darkGreen }
                : { backgroundColor: colors.lightGray },
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category
                  ? { color: colors.white }
                  : { color: colors.darkGray },
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// CropList Component
const CropList = () => {
  const { list } = useContext(DataContext);
  const router = useRouter();

  const renderItem = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity style={[styles.cropItem, { backgroundColor: colors.white, borderColor: colors.borderColor }]}
      onPress={() => router.navigate(`/crops/info?code=${item.svcCode}`)}>
      <Text style={[styles.cropItemTitle, { color: colors.textBlack }]}>{item.svcCodeNmEng} ({item.svcCodeNm})</Text>
      <Text style={[styles.cropItemCategory, { color: colors.darkGray }]}>{item.category || 'none'}</Text>
    </TouchableOpacity>
  ), [colors]); // Re-render only if colors change

  return (
    <FlatList
      data={list}
      keyExtractor={(item: any) => item.svcCode}
      renderItem={renderItem}
      contentContainerStyle={styles.flatListContent}
      ListEmptyComponent={() => (
        <View style={styles.emptyListContainer}>
          <Text style={[styles.emptyListText, { color: colors.darkGray }]}>No crops found matching your criteria.</Text>
        </View>
      )}
    />
  );
};

// Main Screen Component
const Screen = () => {
  const [search, setSearch] = useState('');
  const [list, setList] = useState<any[]>(cropFlattened);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // null means "All" initially

  // Effect to re-filter the list whenever search text or selected category changes
  useEffect(() => {
    setList(filterCrops(search, selectedCategory));
  }, [search, selectedCategory]); // Removed setList from dependencies as it's a state setter

  return (
    <DataContext.Provider value={{ search, setSearch, list, setList, selectedCategory, setSelectedCategory }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.lightGray }}>
        <View style={styles.screenContainer}>
          <Text style={[styles.screenTitle, { color: colors.textBlack }]}>Crop Search</Text>

          <SearchBar />
          <Categories />
          <CropList />
        </View>
      </SafeAreaView>
    </DataContext.Provider>
  );
};

// StyleSheet for React Native components
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.lightGray,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  clearButton: {
    marginLeft: 10,
    padding: 5,
  },
  categoriesContainer: {
    marginBottom: 15,
  },
  categoryScroll: {
    paddingVertical: 5,
    alignItems: 'center', // Center items vertically in the scroll view
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  flatListContent: {
    paddingBottom: 20, // Add some padding at the bottom of the list
  },
  cropItem: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1.5,
  },
  cropItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cropItemCategory: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyListText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default Screen;
